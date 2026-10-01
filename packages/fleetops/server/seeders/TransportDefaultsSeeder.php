<?php

namespace Fleetbase\FleetOps\Seeders;

use Fleetbase\FleetOps\Models\TransportSetting;
use Fleetbase\Models\Category;
use Fleetbase\Models\Company;
use Illuminate\Database\Seeder;

class TransportDefaultsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $companies = Company::all();

        // Default Indian logistics terms & conditions
        $defaultTerms = "1. Goods are carried strictly at owner's risk unless specifically insured.\n" .
            "2. The company is not liable for leakage, breakage, or damage during transit due to natural causes or unavoidable accidents.\n" .
            "3. Demurrage and detention charges of Rs. 1,500/day will be applicable after 24 hours of vehicle arrival at loading/unloading point.\n" .
            "4. Original Lorry Receipt (LR) must be presented and signed at the time of delivery acknowledgment.\n" .
            "5. All claims and disputes are subject to the jurisdiction of the transporter's registered office city.\n" .
            "6. Payment is due within agreed credit terms (Net 30 days unless agreed in writing). Interest @ 18% p.a. applies on overdue amounts.";

        $defaultTemplates = [
            'lr_generated'     => 'lr_generated',
            'vehicle_assigned' => 'vehicle_assigned',
            'dispatched'       => 'dispatched',
            'in_transit'       => 'in_transit',
            'delivered'        => 'delivered',
            'custom_message'   => 'custom_message',
        ];

        $defaultCustomFields = [
            ['label' => 'Bank Name', 'value' => 'State Bank of India'],
            ['label' => 'Account No', 'value' => 'XXXXXXXXXXXX'],
            ['label' => 'IFSC Code', 'value' => 'SBIN0000000'],
            ['label' => 'Branch', 'value' => 'Commercial Branch'],
        ];

        foreach ($companies as $company) {
            TransportSetting::firstOrCreate(
                ['company_uuid' => $company->uuid],
                [
                    'company_address'       => $company->address ?: 'Transport Nagar, Delhi Bypass Road, India',
                    'company_phone'         => $company->phone ?: '+91 98765 43210',
                    'company_email'         => $company->email ?: 'dispatch@haulage-fleet.in',
                    'gstin'                 => '07AAAAA0000A1Z5',
                    'pdf_terms_conditions'  => $defaultTerms,
                    'whatsapp_provider'     => 'twilio',
                    'is_whatsapp_enabled'   => false,
                    'whatsapp_templates'    => $defaultTemplates,
                    'custom_pdf_fields'     => $defaultCustomFields,
                ]
            );

            // Seed Document Type Categories for Indian Transport
            $vehicleDocTypes = [
                'RC (Registration Certificate)',
                'Commercial Vehicle Insurance',
                'PUC (Pollution Certificate)',
                'Fitness Certificate (Form 38)',
                'State Goods Permit',
                'National Permit (Form 48)',
                'Road Tax Receipt',
                'Speed Governor Certificate',
            ];

            foreach ($vehicleDocTypes as $docType) {
                Category::firstOrCreate([
                    'company_uuid' => $company->uuid,
                    'name'         => $docType,
                    'for'          => 'vehicle_document',
                ]);
            }

            $driverDocTypes = [
                'Commercial Driving Licence (Transport)',
                'Aadhaar Card Reference',
                'PAN Card Reference',
                'Police Verification Certificate',
                'Medical Fitness Certificate',
                'Hazchem Transport Endorsement',
            ];

            foreach ($driverDocTypes as $docType) {
                Category::firstOrCreate([
                    'company_uuid' => $company->uuid,
                    'name'         => $docType,
                    'for'          => 'driver_document',
                ]);
            }
        }
    }
}
