<?php

namespace Tests\Feature;

use App\Models\Bilty;
use App\Models\BiltySequence;
use App\Models\FreightCharge;
use App\Models\LrNumber;
use App\Services\BillingEngineService;
use App\Services\BiltyDomainService;
use App\Services\PdfGenerationService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class BiltyAndFreightTest extends TestCase
{
    protected string $companyUuid;
    protected string $otherCompanyUuid;
    protected BiltyDomainService $biltyService;
    protected BillingEngineService $billingService;

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
        ]);
        DB::setDefaultConnection('sqlite');

        $fakeCache = new class {
            public function clear(array $tags = []): void {}
        };
        app()->instance('responsecache', $fakeCache);
        \Illuminate\Support\Facades\Facade::clearResolvedInstance('responsecache');

        $this->createTestTables();

        $this->biltyService = new BiltyDomainService();
        $this->billingService = new BillingEngineService();
        $this->companyUuid = (string) Str::uuid();
        $this->otherCompanyUuid = (string) Str::uuid();
        request()->headers->set('Company-Header', $this->companyUuid);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('freight_charges');
        Schema::dropIfExists('bilty_sequences');
        Schema::dropIfExists('bilties');
        Schema::dropIfExists('lr_numbers');
        Schema::dropIfExists('companies');

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('bilty_sequences', function (Blueprint $table) {
            $table->increments('id');
            $table->string('company_uuid', 36)->index();
            $table->integer('year')->index();
            $table->unsignedBigInteger('current_sequence')->default(0);
            $table->timestamps();

            $table->unique(['company_uuid', 'year'], 'unique_company_bilty_year');
        });

        Schema::create('bilties', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36)->index();
            $table->string('lr_uuid', 36)->nullable();
            $table->string('load_uuid', 36)->nullable();
            $table->string('vehicle_uuid', 36)->nullable();
            $table->string('driver_uuid', 36)->nullable();
            $table->string('customer_uuid', 36)->nullable();
            $table->string('consignor_uuid', 36)->nullable();
            $table->string('consignee_uuid', 36)->nullable();
            $table->string('bilty_number', 100)->unique();
            $table->date('bilty_date')->nullable();
            $table->string('from_location', 255)->nullable();
            $table->string('to_location', 255)->nullable();
            $table->text('material_details')->nullable();
            $table->decimal('total_weight', 10, 2)->nullable();
            $table->decimal('freight_amount', 12, 2)->default(0);
            $table->decimal('advance_amount', 12, 2)->default(0);
            $table->decimal('balance_amount', 12, 2)->default(0);
            $table->string('payment_terms', 50)->default('to_pay');
            $table->text('remarks')->nullable();
            $table->string('authorized_by', 255)->nullable();
            $table->text('meta')->nullable();
            $table->string('created_by_uuid', 36)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('lr_numbers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36)->index();
            $table->string('load_uuid', 36)->nullable();
            $table->string('vehicle_uuid', 36)->nullable();
            $table->string('driver_uuid', 36)->nullable();
            $table->string('customer_uuid', 36)->nullable();
            $table->string('consignor_uuid', 36)->nullable();
            $table->string('consignee_uuid', 36)->nullable();
            $table->string('bilty_uuid', 36)->nullable();
            $table->string('lr_number', 100)->unique();
            $table->string('generation_mode', 20)->default('auto');
            $table->string('status', 50)->default('BOOKED');
            $table->string('from_location', 255)->nullable();
            $table->string('to_location', 255)->nullable();
            $table->date('lr_date')->nullable();
            $table->text('remarks')->nullable();
            $table->text('meta')->nullable();
            $table->string('created_by_uuid', 36)->nullable();
            $table->string('updated_by_uuid', 36)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('freight_charges', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36)->index();
            $table->string('load_uuid', 36)->nullable();
            $table->string('trip_uuid', 36)->nullable();
            $table->string('customer_uuid', 36)->nullable();
            $table->decimal('freight_amount', 12, 2)->default(0);
            $table->decimal('loading_charges', 12, 2)->default(0);
            $table->decimal('unloading_charges', 12, 2)->default(0);
            $table->decimal('detention_charges', 12, 2)->default(0);
            $table->decimal('toll_charges', 12, 2)->default(0);
            $table->decimal('handling_charges', 12, 2)->default(0);
            $table->decimal('miscellaneous_charges', 12, 2)->default(0);
            $table->text('additional_charges')->nullable();
            $table->decimal('total_charges', 12, 2)->default(0);
            $table->decimal('advance_paid', 12, 2)->default(0);
            $table->decimal('deductions', 12, 2)->default(0);
            $table->text('deduction_remarks')->nullable();
            $table->decimal('balance_payable', 12, 2)->default(0);
            $table->string('payment_status', 50)->default('pending');
            $table->text('remarks')->nullable();
            $table->string('created_by_uuid', 36)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test atomic Bilty sequence generation without race conditions.
     */
    public function test_bilty_atomic_number_generation(): void
    {
        $year = 2026;
        $num1 = $this->biltyService->generateAtomicBiltyNumber($this->companyUuid, $year);
        $num2 = $this->biltyService->generateAtomicBiltyNumber($this->companyUuid, $year);
        $num3 = $this->biltyService->generateAtomicBiltyNumber($this->companyUuid, $year);

        $this->assertEquals('BL-2026-000001', $num1);
        $this->assertEquals('BL-2026-000002', $num2);
        $this->assertEquals('BL-2026-000003', $num3);

        // Assert different company has its own sequence starting at 000001
        $otherNum1 = $this->biltyService->generateAtomicBiltyNumber($this->otherCompanyUuid, $year);
        $this->assertEquals('BL-2026-000001', $otherNum1);
    }

    /**
     * Test Bilty creation, calculation, and database persistence.
     */
    public function test_bilty_crud_with_real_database_persistence(): void
    {
        $bilty = $this->biltyService->createBilty([
            'company_uuid'   => $this->companyUuid,
            'from_location'  => 'Ahmedabad Transport Nagar',
            'to_location'    => 'Mumbai Nhava Sheva Port',
            'freight_amount' => 45000.00,
            'advance_amount' => 15000.00,
            'payment_terms'  => 'to_pay',
            'total_weight'   => 18.5,
        ]);

        $this->assertNotNull($bilty->uuid);
        $this->assertStringStartsWith('BL-', $bilty->bilty_number);
        $this->assertEquals(45000.00, (float) $bilty->freight_amount);
        $this->assertEquals(15000.00, (float) $bilty->advance_amount);
        $this->assertEquals(30000.00, (float) $bilty->balance_amount);

        $this->assertDatabaseHas('bilties', [
            'uuid'         => $bilty->uuid,
            'bilty_number' => $bilty->bilty_number,
            'company_uuid' => $this->companyUuid,
            'balance_amount' => 30000.00,
        ]);
    }

    /**
     * Test Bilty auto-inherits consignor, consignee, and vehicle from LR and links back.
     */
    public function test_bilty_links_with_lr_number(): void
    {
        $vehicleUuid = (string) Str::uuid();
        $driverUuid = (string) Str::uuid();

        $lr = LrNumber::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'lr_number'     => 'LR-2026-000099',
            'vehicle_uuid'  => $vehicleUuid,
            'driver_uuid'   => $driverUuid,
            'from_location' => 'Surat GIDC',
            'to_location'   => 'Delhi Okhla',
            'status'        => 'BOOKED',
        ]);

        $bilty = $this->biltyService->createBilty([
            'company_uuid'   => $this->companyUuid,
            'lr_uuid'        => $lr->uuid,
            'freight_amount' => 28000.00,
            'advance_amount' => 5000.00,
        ]);

        $this->assertEquals($vehicleUuid, $bilty->vehicle_uuid);
        $this->assertEquals($driverUuid, $bilty->driver_uuid);
        $this->assertEquals('Surat GIDC', $bilty->from_location);
        $this->assertEquals('Delhi Okhla', $bilty->to_location);

        // Verify LR is updated with bilty_uuid
        $refreshedLr = LrNumber::where('uuid', $lr->uuid)->first();
        $this->assertEquals($bilty->uuid, $refreshedLr->bilty_uuid);
    }

    /**
     * Test Bilty cross-company multi-tenant isolation.
     */
    public function test_bilty_company_isolation(): void
    {
        $biltyCompanyA = $this->biltyService->createBilty([
            'company_uuid'   => $this->companyUuid,
            'from_location'  => 'Pune',
            'to_location'    => 'Nagpur',
            'freight_amount' => 20000.00,
        ]);

        // Query with Company A
        request()->headers->set('Company-Header', $this->companyUuid);
        $found = $this->biltyService->resolveBilty($biltyCompanyA->uuid, $this->companyUuid);
        $this->assertNotNull($found);

        // Query with Company B
        request()->headers->set('Company-Header', $this->otherCompanyUuid);
        $notFound = $this->biltyService->resolveBilty($biltyCompanyA->uuid, $this->otherCompanyUuid);
        $this->assertNull($notFound);
    }

    /**
     * Test BillingEngineService statutory Indian GTA calculation formula.
     * base + loading + unloading + demurrage + insurance + toll + handling + misc + GST (5%) - advance - deductions
     */
    public function test_billing_engine_standard_freight_formula(): void
    {
        $input = [
            'base_freight'          => 20000.00,
            'loading_charges'       => 800.00,
            'unloading_charges'     => 700.00,
            'demurrage_charges'     => 1500.00,
            'insurance_charges'     => 500.00,
            'toll_charges'          => 1200.00,
            'handling_charges'      => 300.00,
            'miscellaneous_charges' => 200.00,
            'additional_charges'    => [
                ['label' => 'Green Tax', 'amount' => 300.00],
            ],
            'gst_applicable'        => true,
            'gst_rate'              => 5.0, // 5% GTA SAC 9965
            'advance_paid'          => 8000.00,
            'deductions'            => 1500.00, // Shortage / TDS deduction
            'deduction_remarks'     => 'TDS 2% + 500 shortage penalty',
        ];

        $res = $this->billingService->calculateCharges($input);

        // Taxable freight: 20000 + 800 + 700 + 1500 + 500 + 1200 + 300 + 200 + 300 = 25500.00
        $this->assertEquals(25500.00, $res['taxable_freight']);
        // GST (5%): 25500 * 0.05 = 1275.00
        $this->assertEquals(1275.00, $res['gst_amount']);
        // Total charges: 25500 + 1275 = 26775.00
        $this->assertEquals(26775.00, $res['total_charges']);
        // Advance: 8000, Deductions: 1500. Balance payable = 26775 - 9500 = 17275.00
        $this->assertEquals(17275.00, $res['balance_payable']);
        $this->assertEquals('partial', $res['payment_status']);
    }

    /**
     * Test BillingEngineService when fully paid.
     */
    public function test_billing_engine_fully_paid_status(): void
    {
        $input = [
            'base_freight'   => 10000.00,
            'gst_applicable' => false,
            'advance_paid'   => 10000.00,
            'deductions'     => 0.00,
        ];

        $res = $this->billingService->calculateCharges($input);

        $this->assertEquals(10000.00, $res['total_charges']);
        $this->assertEquals(0.00, $res['balance_payable']);
        $this->assertEquals('paid', $res['payment_status']);
    }

    /**
     * Test BillingEngineService clamping negative balance payable to 0.
     */
    public function test_billing_engine_prevents_negative_payable(): void
    {
        $input = [
            'base_freight'   => 5000.00,
            'gst_applicable' => false,
            'advance_paid'   => 6000.00, // overpaid
            'deductions'     => 500.00,
        ];

        $res = $this->billingService->calculateCharges($input);

        $this->assertEquals(0.00, $res['balance_payable']);
        $this->assertEquals('paid', $res['payment_status']);
    }

    /**
     * Test FreightCharge model persistence with BillingEngineService.
     */
    public function test_freight_charge_persistence_in_database(): void
    {
        request()->headers->set('Company-Header', $this->companyUuid);

        $charge = $this->billingService->createOrUpdateFreightCharge([
            'company_uuid'          => $this->companyUuid,
            'base_freight'          => 32000.00,
            'loading_charges'       => 1000.00,
            'unloading_charges'     => 1000.00,
            'toll_charges'          => 2000.00,
            'gst_rate'              => 5.0,
            'advance_paid'          => 10000.00,
            'deductions'            => 1000.00,
            'remarks'               => 'Standard FMCG consignment',
        ]);

        $this->assertNotNull($charge->uuid);
        $this->assertEquals(32000.00, (float) $charge->freight_amount);
        $this->assertGreaterThan(32000.00, (float) $charge->total_charges);
        $this->assertDatabaseHas('freight_charges', [
            'uuid'         => $charge->uuid,
            'company_uuid' => $this->companyUuid,
        ]);
    }
}
