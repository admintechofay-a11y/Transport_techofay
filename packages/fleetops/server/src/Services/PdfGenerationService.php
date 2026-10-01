<?php

namespace Fleetbase\FleetOps\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DompdfWrapper;
use Dompdf\Dompdf;
use Fleetbase\FleetOps\Models\Bilty;
use Fleetbase\FleetOps\Models\DeliveryChallan;
use Fleetbase\FleetOps\Models\FreightCharge;
use Fleetbase\FleetOps\Models\GatePass;
use Fleetbase\FleetOps\Models\LrNumber;
use Fleetbase\FleetOps\Models\Order;
use Fleetbase\FleetOps\Models\Proof;
use Fleetbase\FleetOps\Models\TransportSetting;
use Fleetbase\Models\Company;

class PdfGenerationService
{
    /**
     * Generate Lorry Receipt PDF.
     */
    public function generateLr(LrNumber $lr): DompdfWrapper
    {
        $lr->loadMissing(['consignor', 'consignee', 'customer', 'vehicle', 'driver', 'bilty']);
        $settings = $this->getCompanySettings($lr->company_uuid);

        return $this->renderToPdf('fleetops::pdf.lr', [
            'lr'       => $lr,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Bilty / Consignment Note PDF.
     */
    public function generateBilty(Bilty $bilty): DompdfWrapper
    {
        $bilty->loadMissing(['consignor', 'consignee', 'customer', 'vehicle', 'driver', 'lrNumber']);
        $settings = $this->getCompanySettings($bilty->company_uuid);

        return $this->renderToPdf('fleetops::pdf.bilty', [
            'bilty'    => $bilty,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Loading Slip PDF.
     */
    public function generateLoadingSlip(Order $order): DompdfWrapper
    {
        $order->loadMissing(['customer', 'vehicleAssigned', 'driverAssigned', 'payload.entities', 'payload.pickup', 'payload.dropoff']);
        $settings = $this->getCompanySettings($order->company_uuid);

        return $this->renderToPdf('fleetops::pdf.loading_slip', [
            'order'    => $order,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Delivery Challan PDF.
     */
    public function generateDeliveryChallan(DeliveryChallan $challan): DompdfWrapper
    {
        $challan->loadMissing(['consignee', 'vehicle', 'driver', 'load']);
        $settings = $this->getCompanySettings($challan->company_uuid);

        return $this->renderToPdf('fleetops::pdf.delivery_challan', [
            'challan'  => $challan,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Trip Sheet PDF.
     */
    public function generateTripSheet(Order $order): DompdfWrapper
    {
        $order->loadMissing(['customer', 'vehicleAssigned', 'driverAssigned', 'payload.waypoints.place']);
        $settings = $this->getCompanySettings($order->company_uuid);

        return $this->renderToPdf('fleetops::pdf.trip_sheet', [
            'order'    => $order,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Gate Pass PDF.
     */
    public function generateGatePass(GatePass $gatePass): DompdfWrapper
    {
        $gatePass->loadMissing(['vehicle', 'driver', 'load']);
        $settings = $this->getCompanySettings($gatePass->company_uuid);

        return $this->renderToPdf('fleetops::pdf.gate_pass', [
            'gatePass' => $gatePass,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Freight Statement PDF.
     */
    public function generateFreightStatement(FreightCharge $charge): DompdfWrapper
    {
        $charge->loadMissing(['customer', 'load']);
        $settings = $this->getCompanySettings($charge->company_uuid);

        return $this->renderToPdf('fleetops::pdf.freight_statement', [
            'charge'   => $charge,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Tax Invoice PDF.
     */
    public function generateInvoice(FreightCharge $charge): DompdfWrapper
    {
        $charge->loadMissing(['customer', 'load']);
        $settings = $this->getCompanySettings($charge->company_uuid);

        return $this->renderToPdf('fleetops::pdf.invoice', [
            'charge'   => $charge,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Proof of Delivery (POD) PDF.
     */
    public function generatePod(Proof $proof): DompdfWrapper
    {
        $proof->loadMissing(['subject']);
        $companyUuid = $proof->company_uuid ?? ($proof->subject?->company_uuid ?? session('company'));
        $settings = $this->getCompanySettings($companyUuid ?: '');

        return $this->renderToPdf('fleetops::pdf.pod', [
            'proof'    => $proof,
            'settings' => $settings,
        ]);
    }

    /**
     * Load company branding, GST, address, and terms.
     */
    public function getCompanySettings(string $companyUuid): array
    {
        $company = Company::find($companyUuid);
        $setting = TransportSetting::where('company_uuid', $companyUuid)->first();

        return [
            'company_name'         => $company?->name ?? 'Fleetbase Transport',
            'company_logo_url'     => $setting?->company_logo_url ?? ($company?->logo_url ?? null),
            'gstin'                => $setting?->gstin ?? 'UNREGISTERED',
            'company_address'      => $setting?->company_address ?? ($company?->address ?? ''),
            'company_phone'        => $setting?->company_phone ?? ($company?->phone ?? ''),
            'company_email'        => $setting?->company_email ?? ($company?->email ?? ''),
            'pdf_terms_conditions' => $setting?->pdf_terms_conditions ?? "1. Goods carried at owner's risk.\n2. Carrier not liable for leakage, pilferage or damage beyond carrier control.\n3. Subject to local jurisdiction only.",
            'signature_url'        => $setting?->signature_url,
            'custom_fields'        => $setting?->custom_pdf_fields ?? [],
        ];
    }

    /**
     * Render Blade view to DomPDF.
     */
    protected function renderToPdf(string $view, array $data, string $paperSize = 'A4'): DompdfWrapper
    {
        return Pdf::loadView($view, $data)->setPaper($paperSize);
    }
}
