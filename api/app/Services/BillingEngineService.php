<?php

namespace App\Services;

use App\Models\FreightCharge;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BillingEngineService
{
    public const DEFAULT_GTA_GST_RATE = 5.0; // 5% GTA without ITC (SAC 9965)
    public const GTA_SAC_CODE = '9965';

    /**
     * Compute freight charges breakdown, GST, total and payable amounts.
     */
    public function calculateCharges(array $inputs): array
    {
        $baseFreight   = max(0.0, round((float) ($inputs['freight_amount'] ?? $inputs['base_freight'] ?? 0), 2));
        $loading       = max(0.0, round((float) ($inputs['loading_charges'] ?? 0), 2));
        $unloading     = max(0.0, round((float) ($inputs['unloading_charges'] ?? 0), 2));
        $demurrage     = max(0.0, round((float) ($inputs['demurrage_charges'] ?? $inputs['detention_charges'] ?? 0), 2));
        $insurance     = max(0.0, round((float) ($inputs['insurance_charges'] ?? 0), 2));
        $toll          = max(0.0, round((float) ($inputs['toll_charges'] ?? 0), 2));
        $handling      = max(0.0, round((float) ($inputs['handling_charges'] ?? 0), 2));
        $miscellaneous = max(0.0, round((float) ($inputs['miscellaneous_charges'] ?? $inputs['misc_charges'] ?? 0), 2));

        // Additional charges sum
        $additionalCharges = $inputs['additional_charges'] ?? [];
        $extraCharges = 0.0;
        if (is_array($additionalCharges)) {
            foreach ($additionalCharges as $item) {
                if (is_array($item) && isset($item['amount'])) {
                    $extraCharges += max(0.0, (float) $item['amount']);
                }
            }
        }
        $extraCharges = round($extraCharges, 2);

        // Taxable freight
        $taxableFreight = round(
            $baseFreight +
            $loading +
            $unloading +
            $demurrage +
            $insurance +
            $toll +
            $handling +
            $miscellaneous +
            $extraCharges,
            2
        );

        // GST calculation (SAC 9965)
        $gstApplicable = isset($inputs['gst_applicable']) ? (bool) $inputs['gst_applicable'] : true;
        $gstRate = isset($inputs['gst_rate']) ? (float) $inputs['gst_rate'] : ($gstApplicable ? self::DEFAULT_GTA_GST_RATE : 0.0);
        $gstAmount = $gstApplicable ? round($taxableFreight * ($gstRate / 100), 2) : 0.0;

        // Total gross charges
        $totalCharges = round($taxableFreight + $gstAmount, 2);

        // Settlement
        $advancePaid = max(0.0, round((float) ($inputs['advance_paid'] ?? 0), 2));
        $deductions  = max(0.0, round((float) ($inputs['deductions'] ?? 0), 2));

        // Balance payable cannot be negative
        $balancePayable = max(0.0, round($totalCharges - $advancePaid - $deductions, 2));

        // Payment status
        if ($balancePayable <= 0 && $totalCharges > 0) {
            $paymentStatus = 'paid';
        } elseif ($advancePaid > 0 && $balancePayable > 0) {
            $paymentStatus = 'partial';
        } else {
            $paymentStatus = 'pending';
        }

        return [
            'freight_amount'        => $baseFreight,
            'base_freight'          => $baseFreight,
            'loading_charges'       => $loading,
            'unloading_charges'     => $unloading,
            'detention_charges'     => $demurrage,
            'demurrage_charges'     => $demurrage,
            'insurance_charges'     => $insurance,
            'toll_charges'          => $toll,
            'handling_charges'      => $handling,
            'miscellaneous_charges' => $miscellaneous,
            'additional_charges'    => $additionalCharges,
            'taxable_freight'       => $taxableFreight,
            'sac_code'              => self::GTA_SAC_CODE,
            'gst_applicable'        => $gstApplicable,
            'gst_rate'              => $gstRate,
            'gst_amount'            => $gstAmount,
            'total_charges'         => $totalCharges,
            'advance_paid'          => $advancePaid,
            'deductions'            => $deductions,
            'deduction_remarks'     => $inputs['deduction_remarks'] ?? null,
            'balance_payable'       => $balancePayable,
            'payment_status'        => $paymentStatus,
        ];
    }

    /**
     * Create or update a FreightCharge record with real calculated values.
     */
    public function createOrUpdateFreightCharge(array $data, ?string $userUuid = null): FreightCharge
    {
        $companyUuid = $data['company_uuid'] ?? session('company') ?? request()->header('Company-Header');

        if (!$companyUuid) {
            throw ValidationException::withMessages([
                'company_uuid' => 'Company UUID is required for freight billing.',
            ]);
        }

        $calculated = $this->calculateCharges($data);

        $charge = null;
        if (!empty($data['uuid'])) {
            $charge = FreightCharge::where('uuid', $data['uuid'])->first();
        }

        if (!$charge) {
            $charge = new FreightCharge();
            $charge->uuid = $data['uuid'] ?? (string) Str::uuid();
            $charge->company_uuid = $companyUuid;
            $charge->created_by_uuid = $userUuid;
        }

        $charge->load_uuid             = $data['load_uuid'] ?? $charge->load_uuid ?? null;
        $charge->trip_uuid             = $data['trip_uuid'] ?? $charge->trip_uuid ?? null;
        $charge->customer_uuid         = $data['customer_uuid'] ?? $charge->customer_uuid ?? null;
        $charge->freight_amount        = $calculated['freight_amount'];
        $charge->loading_charges       = $calculated['loading_charges'];
        $charge->unloading_charges     = $calculated['unloading_charges'];
        $charge->detention_charges     = $calculated['detention_charges'];
        $charge->toll_charges          = $calculated['toll_charges'];
        $charge->handling_charges      = $calculated['handling_charges'];
        $charge->miscellaneous_charges = $calculated['miscellaneous_charges'];
        $charge->additional_charges    = $calculated['additional_charges'];
        $charge->total_charges         = $calculated['total_charges'];
        $charge->advance_paid          = $calculated['advance_paid'];
        $charge->deductions            = $calculated['deductions'];
        $charge->deduction_remarks     = $calculated['deduction_remarks'];
        $charge->balance_payable       = $calculated['balance_payable'];
        $charge->payment_status        = $calculated['payment_status'];
        $charge->remarks               = $data['remarks'] ?? $charge->remarks ?? null;

        $charge->save();

        return $charge;
    }
}
