<?php

namespace Tests\Feature;

use App\Models\DeliveryChallan;
use App\Models\GatePass;
use App\Services\PdfGenerationService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class PdfStreamingTest extends TestCase
{
    protected string $companyUuid;
    protected PdfGenerationService $pdfService;

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
        $this->pdfService = new PdfGenerationService();
        $this->companyUuid = (string) Str::uuid();
        request()->headers->set('Company-Header', $this->companyUuid);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('delivery_challans');
        Schema::dropIfExists('gate_passes');
        Schema::dropIfExists('companies');

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('delivery_challans', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('load_uuid', 36)->nullable()->index();
            $table->string('load_location_uuid', 36)->nullable();
            $table->string('vehicle_uuid', 36)->nullable();
            $table->string('driver_uuid', 36)->nullable();
            $table->string('consignee_uuid', 36)->nullable();
            $table->string('challan_number', 100)->unique();
            $table->date('challan_date')->nullable();
            $table->text('material_items')->nullable();
            $table->decimal('total_quantity', 10, 2)->nullable();
            $table->decimal('total_weight', 10, 2)->nullable();
            $table->string('status', 50)->default('pending');
            $table->timestamp('delivered_at')->nullable();
            $table->string('received_by', 255)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('gate_passes', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('load_uuid', 36)->nullable()->index();
            $table->string('vehicle_uuid', 36)->nullable();
            $table->string('driver_uuid', 36)->nullable();
            $table->string('gate_pass_number', 100)->unique();
            $table->string('pass_type', 20)->default('out');
            $table->timestamp('in_time')->nullable();
            $table->timestamp('out_time')->nullable();
            $table->string('authorized_by', 255)->nullable();
            $table->string('security_name', 255)->nullable();
            $table->text('remarks')->nullable();
            $table->text('qr_token')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test Delivery Challan PDF generation returns binary with %PDF- header.
     */
    public function test_delivery_challan_pdf_generation(): void
    {
        $challan = DeliveryChallan::create([
            'uuid'           => (string) Str::uuid(),
            'company_uuid'   => $this->companyUuid,
            'challan_number' => 'DC-2026-000001',
            'challan_date'   => Carbon::now()->toDateString(),
            'total_quantity' => 100,
            'total_weight'   => 15.5,
            'status'         => 'pending',
            'remarks'        => 'Test delivery challan generation',
        ]);

        $pdf = $this->pdfService->generateDeliveryChallan($challan);
        $output = $pdf->output();

        $this->assertNotEmpty($output);
        $this->assertStringStartsWith('%PDF-', $output);
    }

    /**
     * Test Gate Pass PDF generation returns binary with %PDF- header.
     */
    public function test_gate_pass_pdf_generation(): void
    {
        $gatePass = GatePass::create([
            'uuid'             => (string) Str::uuid(),
            'company_uuid'     => $this->companyUuid,
            'gate_pass_number' => 'GP-2026-000001',
            'pass_type'        => 'out',
            'in_time'          => Carbon::now()->subHours(2),
            'authorized_by'    => 'Gate Officer A. Sharma',
            'security_name'    => 'Main Checkpost Guard',
            'remarks'          => 'Gate pass test generation',
        ]);

        $pdf = $this->pdfService->generateGatePass($gatePass);
        $output = $pdf->output();

        $this->assertNotEmpty($output);
        $this->assertStringStartsWith('%PDF-', $output);
    }

    /**
     * Test Loading Slip and Trip Sheet PDF generation via Order object.
     */
    public function test_loading_slip_and_trip_sheet_pdf_generation(): void
    {
        $order = (object) [
            'uuid'         => (string) Str::uuid(),
            'public_id'    => 'order_test_123',
            'load_number'  => 'LD-2026-000001',
            'company_uuid' => $this->companyUuid,
            'status'       => 'dispatched',
            'payload'      => (object) [
                'pickup'    => (object) ['name' => 'Vadodara Hub', 'street1' => 'NH-8 Highway'],
                'dropoff'   => (object) ['name' => 'Mumbai Unloading Yard', 'street1' => 'Kalamboli'],
                'entities'  => collect([]),
                'waypoints' => collect([]),
            ],
            'customer'        => (object) ['name' => 'Gujarat Steel Ltd', 'phone' => '+919876543210'],
            'driverAssigned'  => (object) ['name' => 'Rajesh Kumar', 'phone' => '+919820011223'],
            'vehicleAssigned' => (object) ['plate_number' => 'GJ06AX1234', 'model' => 'Tata Prima 4028'],
            'trackingNumber'  => (object) ['tracking_number' => 'TRK-2026-001'],
        ];

        $loadingSlipPdf = $this->pdfService->generateLoadingSlip($order);
        $loadingSlipOutput = $loadingSlipPdf->output();
        $this->assertNotEmpty($loadingSlipOutput);
        $this->assertStringStartsWith('%PDF-', $loadingSlipOutput);

        $tripSheetPdf = $this->pdfService->generateTripSheet($order);
        $tripSheetOutput = $tripSheetPdf->output();
        $this->assertNotEmpty($tripSheetOutput);
        $this->assertStringStartsWith('%PDF-', $tripSheetOutput);
    }

    /**
     * Test LR and Bilty PDF generation.
     */
    public function test_lr_and_bilty_pdf_generation(): void
    {
        $lr = (object) [
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'lr_number'    => 'LR-2026-000001',
            'status'       => 'issued',
            'consignor'    => (object) ['name' => 'ABC Logistics', 'phone' => '+919800011111', 'address' => 'Surat, Gujarat'],
            'consignee'    => (object) ['name' => 'XYZ Corp', 'phone' => '+919800022222', 'address' => 'Navi Mumbai'],
            'vehicle'      => (object) ['plate_number' => 'MH04AB5678'],
            'driver'       => (object) ['name' => 'Suresh Patil'],
        ];

        $lrPdf = $this->pdfService->generateLr($lr);
        $lrOutput = $lrPdf->output();
        $this->assertNotEmpty($lrOutput);
        $this->assertStringStartsWith('%PDF-', $lrOutput);

        $bilty = (object) [
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'bilty_number' => 'BL-2026-000001',
            'status'       => 'active',
            'consignor'    => (object) ['name' => 'ABC Logistics'],
            'consignee'    => (object) ['name' => 'XYZ Corp'],
            'vehicle'      => (object) ['plate_number' => 'MH04AB5678'],
            'driver'       => (object) ['name' => 'Suresh Patil'],
            'lrNumber'     => (object) ['lr_number' => 'LR-2026-000001'],
        ];

        $biltyPdf = $this->pdfService->generateBilty($bilty);
        $biltyOutput = $biltyPdf->output();
        $this->assertNotEmpty($biltyOutput);
        $this->assertStringStartsWith('%PDF-', $biltyOutput);
    }
}
