<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DompdfWrapper;
use Fleetbase\Models\Company;
use Illuminate\Support\Facades\DB;

class PdfGenerationService
{
    /**
     * Generate Lorry Receipt PDF.
     */
    public function generateLr($lr): DompdfWrapper
    {
        $settings = $this->getCompanySettings($lr->company_uuid ?? '');

        return $this->renderToPdf('fleetops::pdf.lr', [
            'lr'       => $lr,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Bilty / Consignment Note PDF.
     */
    public function generateBilty($bilty): DompdfWrapper
    {
        $settings = $this->getCompanySettings($bilty->company_uuid ?? '');

        return $this->renderToPdf('fleetops::pdf.bilty', [
            'bilty'    => $bilty,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Loading Slip PDF.
     */
    public function generateLoadingSlip($order): DompdfWrapper
    {
        $settings = $this->getCompanySettings($order->company_uuid ?? '');

        return $this->renderToPdf('fleetops::pdf.loading_slip', [
            'order'    => $order,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Delivery Challan PDF.
     */
    public function generateDeliveryChallan($challan): DompdfWrapper
    {
        $settings = $this->getCompanySettings($challan->company_uuid ?? '');

        return $this->renderToPdf('fleetops::pdf.delivery_challan', [
            'challan'  => $challan,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Trip Sheet PDF.
     */
    public function generateTripSheet($order): DompdfWrapper
    {
        $settings = $this->getCompanySettings($order->company_uuid ?? '');

        return $this->renderToPdf('fleetops::pdf.trip_sheet', [
            'order'    => $order,
            'settings' => $settings,
        ]);
    }

    /**
     * Generate Gate Pass PDF.
     */
    public function generateGatePass($gatePass): DompdfWrapper
    {
        $settings = $this->getCompanySettings($gatePass->company_uuid ?? '');

        return $this->renderToPdf('fleetops::pdf.gate_pass', [
            'gatePass' => $gatePass,
            'settings' => $settings,
        ]);
    }

    /**
     * Load company branding, GST, address, and terms.
     */
    public function getCompanySettings(string $companyUuid): array
    {
        $companyName = 'Fleetbase Transport';
        $companyAddress = 'Transport Nagar, Mumbai';
        $companyPhone = '+91 98200 11223';
        $companyEmail = 'dispatch@technofay.com';
        $companyLogoUrl = null;
        $gstin = '27AAACU9912K1Z5';

        if (!empty($companyUuid)) {
            $company = DB::table('companies')->where('uuid', $companyUuid)->first();
            if ($company) {
                $companyName = $company->name ?? $companyName;
            }

            if (DB::getSchemaBuilder()->hasTable('transport_settings')) {
                $setting = DB::table('transport_settings')->where('company_uuid', $companyUuid)->first();
                if ($setting) {
                    $companyLogoUrl = $setting->company_logo_url ?? $companyLogoUrl;
                    $gstin = $setting->gstin ?? $gstin;
                    $companyAddress = $setting->company_address ?? $companyAddress;
                    $companyPhone = $setting->company_phone ?? $companyPhone;
                    $companyEmail = $setting->company_email ?? $companyEmail;
                }
            }
        }

        return [
            'company_name'         => $companyName,
            'company_logo_url'     => $companyLogoUrl,
            'gstin'                => $gstin,
            'company_address'      => $companyAddress,
            'company_phone'        => $companyPhone,
            'company_email'        => $companyEmail,
            'pdf_terms_conditions' => "1. Goods carried at owner's risk.\n2. Carrier not liable for leakage, pilferage or damage beyond carrier control.\n3. Subject to local jurisdiction only.",
            'signature_url'        => null,
            'custom_fields'        => [],
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
