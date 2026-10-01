<?php

namespace App\Services;

use App\Models\FreightCharge;
use App\Models\LrNumber;
use App\Models\Order;
use App\Models\Proof;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NotificationService
{
    public const EVENT_LR_CREATED = 'LR_CREATED';
    public const EVENT_LOAD_DISPATCHED = 'LOAD_DISPATCHED';
    public const EVENT_DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING';
    public const EVENT_DELIVERED = 'DELIVERED';
    public const EVENT_POD_RECEIVED = 'POD_RECEIVED';
    public const EVENT_PAYMENT_RECEIVED = 'PAYMENT_RECEIVED';

    protected WhatsAppService $whatsAppService;

    public function __construct(?WhatsAppService $whatsAppService = null)
    {
        $this->whatsAppService = $whatsAppService ?? new WhatsAppService();
    }

    /**
     * Dispatch notification across specified channels.
     *
     * @param string $event Event identifier (e.g. LR_CREATED)
     * @param array $payload Event data
     * @param array $channels Array of channels ['in_app', 'whatsapp', 'email']
     * @param string|null $notifiableUuid Entity receiving notification (company, customer, driver)
     * @param string|null $notifiableType Class name of notifiable
     * @param string|null $phone Recipient phone number for WhatsApp/SMS
     */
    public function notify(
        string $event,
        array $payload,
        array $channels = ['in_app', 'whatsapp'],
        ?string $notifiableUuid = null,
        ?string $notifiableType = null,
        ?string $phone = null
    ): array {
        $results = [
            'event'     => $event,
            'success'   => true,
            'channels'  => [],
            'timestamp' => now()->toIso8601String(),
        ];

        // 1. In-App Notification (Database table notifications)
        if (in_array('in_app', $channels)) {
            $inAppResult = $this->dispatchInApp($event, $payload, $notifiableUuid, $notifiableType);
            $results['channels']['in_app'] = $inAppResult;
        }

        // 2. WhatsApp Notification
        if (in_array('whatsapp', $channels)) {
            $targetPhone = $phone ?? $payload['phone'] ?? $payload['recipient_phone'] ?? null;
            $companyUuid = $payload['company_uuid'] ?? null;
            $whatsAppResult = $this->dispatchWhatsApp($event, $payload, $targetPhone, $companyUuid);
            $results['channels']['whatsapp'] = $whatsAppResult;
        }

        // 3. Email Notification (Log/Queue)
        if (in_array('email', $channels)) {
            $results['channels']['email'] = [
                'status'  => 'queued',
                'message' => "Email dispatch queued for event {$event}",
            ];
        }

        return $results;
    }

    /**
     * Persist In-App Notification record.
     */
    protected function dispatchInApp(
        string $event,
        array $payload,
        ?string $notifiableUuid = null,
        ?string $notifiableType = null
    ): array {
        $notificationId = (string) Str::uuid();
        $targetId = $notifiableUuid ?? $payload['company_uuid'] ?? (string) Str::uuid();
        $targetType = $notifiableType ?? 'App\\Models\\Company';

        try {
            DB::table('notifications')->insert([
                'id'              => $notificationId,
                'type'            => "transport.{$event}",
                'notifiable_type' => $targetType,
                'notifiable_id'   => $targetId,
                'data'            => json_encode(array_merge(['event' => $event], $payload)),
                'read_at'         => null,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);

            return [
                'status'          => 'dispatched',
                'notification_id' => $notificationId,
            ];
        } catch (\Throwable $e) {
            Log::warning("In-app notification insert skipped: " . $e->getMessage());
            return [
                'status' => 'failed',
                'error'  => $e->getMessage(),
            ];
        }
    }

    /**
     * Dispatch WhatsApp message for domain event.
     */
    protected function dispatchWhatsApp(string $event, array $payload, ?string $phone, ?string $companyUuid): array
    {
        if (empty($phone)) {
            return [
                'status'  => 'skipped',
                'message' => 'No phone number provided for WhatsApp dispatch',
            ];
        }

        $service = $this->whatsAppService->forCompany($companyUuid);

        $templateMap = [
            self::EVENT_LR_CREATED         => 'lr_template',
            self::EVENT_LOAD_DISPATCHED    => 'challan_template',
            self::EVENT_DOCUMENT_EXPIRING  => 'document_expiring_template',
            self::EVENT_DELIVERED          => 'pod_template',
            self::EVENT_POD_RECEIVED       => 'pod_template',
            self::EVENT_PAYMENT_RECEIVED   => 'payment_reminder_template',
        ];

        $template = $templateMap[$event] ?? 'custom_message';
        $messageText = $this->renderFallbackText($event, $payload);

        try {
            return $service->sendCustomMessage($phone, $messageText);
        } catch (\Throwable $e) {
            return [
                'status' => 'failed',
                'error'  => $e->getMessage(),
            ];
        }
    }

    /**
     * Render readable text for the event.
     */
    protected function renderFallbackText(string $event, array $payload): string
    {
        return match ($event) {
            self::EVENT_LR_CREATED => "Technofay Transport: Lorry Receipt #{$payload['lr_number']} issued for shipment from {$payload['from_location']} to {$payload['to_location']}.",
            self::EVENT_LOAD_DISPATCHED => "Technofay Transport: Load #{$payload['load_number']} dispatched with Vehicle {$payload['vehicle_plate']}. Driver: {$payload['driver_name']}.",
            self::EVENT_DOCUMENT_EXPIRING => "COMPLIANCE ALERT: Document {$payload['document_type']} for vehicle {$payload['vehicle_plate']} is expiring on {$payload['expiry_date']} ({$payload['days_left']} days left).",
            self::EVENT_DELIVERED => "Technofay Transport: Load #{$payload['load_number']} has been successfully delivered at {$payload['delivery_location']}.",
            self::EVENT_POD_RECEIVED => "Technofay Transport: Proof of Delivery received and verified for Load #{$payload['load_number']}.",
            self::EVENT_PAYMENT_RECEIVED => "Technofay Transport: Payment of INR {$payload['amount']} received via {$payload['payment_method']}. Balance payable: INR {$payload['balance_payable']}.",
            default => "Technofay Transport Update: " . json_encode($payload),
        };
    }

    /**
     * Domain Event: LR Created
     */
    public function notifyLrCreated(LrNumber $lr): array
    {
        $phone = $lr->customer?->phone ?? $lr->consignor?->phone ?? $lr->driver?->phone;

        $payload = [
            'company_uuid'  => $lr->company_uuid,
            'lr_number'     => $lr->lr_number,
            'from_location' => $lr->from_location ?? 'Origin',
            'to_location'   => $lr->to_location ?? 'Destination',
            'phone'         => $phone,
        ];

        return $this->notify(
            self::EVENT_LR_CREATED,
            $payload,
            ['in_app', 'whatsapp'],
            $lr->customer_uuid ?? $lr->company_uuid,
            'App\\Models\\Contact',
            $phone
        );
    }

    /**
     * Domain Event: Load Dispatched
     */
    public function notifyLoadDispatched(Order $order): array
    {
        $driver = $order->driver;
        $vehicle = $order->vehicle;
        $customer = $order->customer;

        $payload = [
            'company_uuid'  => $order->company_uuid,
            'load_number'   => $order->load_number ?? $order->public_id,
            'driver_name'   => $driver?->name ?? 'Assigned Driver',
            'vehicle_plate' => $vehicle?->plate_number ?? 'Assigned Vehicle',
            'phone'         => $customer?->phone ?? $driver?->phone,
        ];

        return $this->notify(
            self::EVENT_LOAD_DISPATCHED,
            $payload,
            ['in_app', 'whatsapp'],
            $order->customer_uuid ?? $order->company_uuid,
            'App\\Models\\Contact',
            $payload['phone']
        );
    }

    /**
     * Domain Event: Document Expiring
     */
    public function notifyDocumentExpiring(array $docData): array
    {
        $payload = [
            'company_uuid'  => $docData['company_uuid'] ?? null,
            'vehicle_plate' => $docData['vehicle_plate'] ?? 'Fleet Vehicle',
            'document_type' => $docData['document_type'] ?? 'Permit/Fitness/Insurance',
            'expiry_date'   => $docData['expiry_date'] ?? now()->toDateString(),
            'days_left'     => $docData['days_left'] ?? 0,
            'phone'         => $docData['phone'] ?? null,
        ];

        return $this->notify(
            self::EVENT_DOCUMENT_EXPIRING,
            $payload,
            ['in_app', 'whatsapp'],
            $payload['company_uuid'],
            'App\\Models\\Company',
            $payload['phone']
        );
    }

    /**
     * Domain Event: Delivered
     */
    public function notifyDelivered(Order $order): array
    {
        $payload = [
            'company_uuid'      => $order->company_uuid,
            'load_number'       => $order->load_number ?? $order->public_id,
            'delivery_location' => 'Customer Destination',
            'phone'             => $order->customer?->phone,
        ];

        return $this->notify(
            self::EVENT_DELIVERED,
            $payload,
            ['in_app', 'whatsapp'],
            $order->customer_uuid ?? $order->company_uuid,
            'App\\Models\\Contact',
            $payload['phone']
        );
    }

    /**
     * Domain Event: POD Received
     */
    public function notifyPodReceived(Proof $proof): array
    {
        $order = $proof->order;

        $payload = [
            'company_uuid' => $proof->company_uuid,
            'load_number'  => $order?->load_number ?? $proof->subject_uuid,
            'pod_id'       => $proof->public_id,
            'phone'        => $order?->customer?->phone,
        ];

        return $this->notify(
            self::EVENT_POD_RECEIVED,
            $payload,
            ['in_app', 'whatsapp'],
            $proof->company_uuid,
            'App\\Models\\Company',
            $payload['phone']
        );
    }

    /**
     * Domain Event: Payment Received
     */
    public function notifyPaymentReceived(FreightCharge $charge, float $amount, string $paymentMethod): array
    {
        $customer = $charge->customer;

        $payload = [
            'company_uuid'    => $charge->company_uuid,
            'load_number'     => $charge->order?->load_number ?? $charge->load_uuid,
            'amount'          => $amount,
            'payment_method'  => $paymentMethod,
            'balance_payable' => (float) $charge->balance_payable,
            'phone'           => $customer?->phone,
        ];

        return $this->notify(
            self::EVENT_PAYMENT_RECEIVED,
            $payload,
            ['in_app', 'whatsapp'],
            $charge->customer_uuid ?? $charge->company_uuid,
            'App\\Models\\Contact',
            $payload['phone']
        );
    }
}
