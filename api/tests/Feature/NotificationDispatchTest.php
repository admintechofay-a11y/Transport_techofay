<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\FreightCharge;
use App\Models\LrNumber;
use App\Models\Order;
use App\Models\Proof;
use App\Services\FakeWhatsAppAdapter;
use App\Services\NotificationService;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationDispatchTest extends TestCase
{
    protected string $companyUuid;
    protected string $customerUuid;
    protected FakeWhatsAppAdapter $fakeWhatsApp;
    protected NotificationService $notificationService;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'database.connections.mysql' => config('database.connections.sqlite'),
            'responsecache.enabled' => false,
            'activitylog.enabled' => false,
            'cache.default' => 'array',
            'app.key' => 'base64:' . base64_encode('technofay-production-test-key-32'),
        ]);
        DB::setDefaultConnection('sqlite');

        $fakeCache = new class {
            public function clear(array $tags = []): void {}
        };
        app()->instance('responsecache', $fakeCache);
        \Illuminate\Support\Facades\Facade::clearResolvedInstance('responsecache');

        $this->createTestTables();
        Order::unsetEventDispatcher();
        Contact::unsetEventDispatcher();

        $this->companyUuid = (string) Str::uuid();
        $this->customerUuid = (string) Str::uuid();

        $this->fakeWhatsApp = new FakeWhatsAppAdapter();
        $whatsAppService = new WhatsAppService(['provider' => 'fake']);
        $whatsAppService->setProvider($this->fakeWhatsApp);

        $this->notificationService = new NotificationService($whatsAppService);

        DB::table('companies')->insert([
            ['uuid' => $this->companyUuid, 'name' => 'Technofay Logistics', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        DB::table('contacts')->insert([
            [
                'uuid'         => $this->customerUuid,
                'company_uuid' => $this->companyUuid,
                'name'         => 'Tata Motors Logistics',
                'phone'        => '+919876543210',
                'created_at'   => Carbon::now(),
                'updated_at'   => Carbon::now(),
            ],
        ]);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('freight_charges');
        Schema::dropIfExists('proofs');
        Schema::dropIfExists('lr_numbers');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('companies');

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('name');
            $table->string('phone', 50)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('customer_uuid', 36)->nullable()->index();
            $table->string('load_number', 100)->nullable();
            $table->integer('orchestrator_priority')->default(50);
            $table->string('status', 50)->default('pending');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('lr_numbers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('customer_uuid', 36)->nullable()->index();
            $table->string('lr_number', 50)->nullable();
            $table->string('from_location', 255)->nullable();
            $table->string('to_location', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('proofs', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('subject_uuid', 36)->nullable()->index();
            $table->string('subject_type', 100)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('freight_charges', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('load_uuid', 36)->nullable()->index();
            $table->string('customer_uuid', 36)->nullable()->index();
            $table->decimal('balance_payable', 12, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->uuidMorphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Test In-App Notification persistence in database.
     */
    public function test_in_app_notification_persistence(): void
    {
        $payload = [
            'company_uuid'  => $this->companyUuid,
            'lr_number'     => 'LR-2026-0001',
            'from_location' => 'Mumbai',
            'to_location'   => 'Delhi',
        ];

        $res = $this->notificationService->notify(
            NotificationService::EVENT_LR_CREATED,
            $payload,
            ['in_app'],
            $this->customerUuid,
            'App\\Models\\Contact'
        );

        $this->assertTrue($res['success']);
        $this->assertEquals('dispatched', $res['channels']['in_app']['status']);

        $dbNotice = DB::table('notifications')->where('id', $res['channels']['in_app']['notification_id'])->first();
        $this->assertNotNull($dbNotice);
        $this->assertEquals('transport.LR_CREATED', $dbNotice->type);
        $this->assertEquals($this->customerUuid, $dbNotice->notifiable_id);
        $this->assertStringContainsString('LR-2026-0001', $dbNotice->data);
    }

    /**
     * Test Multi-channel dispatch (In-App + WhatsApp).
     */
    public function test_multi_channel_dispatch_with_whatsapp(): void
    {
        $payload = [
            'company_uuid'  => $this->companyUuid,
            'load_number'   => 'LD-MUM-DEL-99',
            'driver_name'   => 'Rajesh Kumar',
            'vehicle_plate' => 'MH-04-AB-1234',
            'phone'         => '+919876543210',
        ];

        $res = $this->notificationService->notify(
            NotificationService::EVENT_LOAD_DISPATCHED,
            $payload,
            ['in_app', 'whatsapp'],
            $this->customerUuid,
            'App\\Models\\Contact',
            '+919876543210'
        );

        $this->assertTrue($res['success']);
        $this->assertEquals('dispatched', $res['channels']['in_app']['status']);
        $this->assertEquals('success', $res['channels']['whatsapp']['status']);

        // Verify FakeWhatsAppAdapter recorded message
        $this->assertCount(1, $this->fakeWhatsApp->sentMessages);
        $this->assertEquals('+919876543210', $this->fakeWhatsApp->sentMessages[0]['to']);
        $this->assertStringContainsString('LD-MUM-DEL-99', $this->fakeWhatsApp->sentMessages[0]['message']);
        $this->assertStringContainsString('MH-04-AB-1234', $this->fakeWhatsApp->sentMessages[0]['message']);
    }

    /**
     * Test all transport domain events dispatch cleanly without errors.
     */
    public function test_transport_domain_event_helpers(): void
    {
        // 1. LR Created
        $lr = LrNumber::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'customer_uuid' => $this->customerUuid,
            'lr_number'     => 'LR-DOM-01',
            'from_location' => 'Ahmedabad',
            'to_location'   => 'Pune',
        ]);
        $resLr = $this->notificationService->notifyLrCreated($lr);
        $this->assertEquals(NotificationService::EVENT_LR_CREATED, $resLr['event']);

        // 2. Load Dispatched
        $order = Order::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'customer_uuid' => $this->customerUuid,
            'load_number'   => 'LD-DOM-02',
            'status'        => 'dispatched',
        ]);
        $resLoad = $this->notificationService->notifyLoadDispatched($order);
        $this->assertEquals(NotificationService::EVENT_LOAD_DISPATCHED, $resLoad['event']);

        // 3. Document Expiring
        $resDoc = $this->notificationService->notifyDocumentExpiring([
            'company_uuid'  => $this->companyUuid,
            'vehicle_plate' => 'GJ-01-XY-5678',
            'document_type' => 'All India Tourist Permit',
            'expiry_date'   => Carbon::now()->addDays(7)->toDateString(),
            'days_left'     => 7,
            'phone'         => '+919876543210',
        ]);
        $this->assertEquals(NotificationService::EVENT_DOCUMENT_EXPIRING, $resDoc['event']);

        // 4. Delivered
        $resDelivered = $this->notificationService->notifyDelivered($order);
        $this->assertEquals(NotificationService::EVENT_DELIVERED, $resDelivered['event']);

        // 5. Payment Received
        $charge = FreightCharge::create([
            'uuid'            => (string) Str::uuid(),
            'company_uuid'    => $this->companyUuid,
            'customer_uuid'   => $this->customerUuid,
            'balance_payable' => 15000,
        ]);
        $resPayment = $this->notificationService->notifyPaymentReceived($charge, 25000, 'NEFT');
        $this->assertEquals(NotificationService::EVENT_PAYMENT_RECEIVED, $resPayment['event']);

        // Verify total in-app notifications in database
        $this->assertEquals(5, DB::table('notifications')->count());
    }
}
