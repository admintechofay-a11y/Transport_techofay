<?php

namespace Tests\Feature;

use App\Http\Controllers\Internal\v1\FreightChargeController;
use App\Models\Contact;
use App\Models\FreightCharge;
use App\Models\Order;
use App\Services\BillingEngineService;
use Carbon\Carbon;
use App\Http\Controllers\Internal\v1\CustomerStatementController;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class CustomerStatementAndPaymentReconciliationTest extends TestCase
{
    protected string $companyUuid;
    protected string $otherCompanyUuid;
    protected string $customerUuid;

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
        $this->otherCompanyUuid = (string) Str::uuid();
        $this->customerUuid = (string) Str::uuid();

        request()->headers->set('Company-Header', $this->companyUuid);

        DB::table('companies')->insert([
            ['uuid' => $this->companyUuid, 'name' => 'Technofay Transport', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['uuid' => $this->otherCompanyUuid, 'name' => 'Competitor Freight', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        DB::table('contacts')->insert([
            [
                'uuid'         => $this->customerUuid,
                'company_uuid' => $this->companyUuid,
                'name'         => 'Adani Ports & SEZ',
                'phone'        => '+91 98250 11223',
                'email'        => 'logistics@adani.com',
                'gstin'        => '24AAACA1234F1Z9',
                'party_type'   => 'customer',
                'created_at'   => Carbon::now(),
                'updated_at'   => Carbon::now(),
            ],
        ]);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('freight_charges');
        Schema::dropIfExists('bilties');
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
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('internal_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('type', 50)->default('contact');
            $table->string('party_type', 50)->default('customer');
            $table->string('gstin', 20)->nullable();
            $table->string('pan_number', 20)->nullable();
            $table->text('billing_address')->nullable();
            $table->text('delivery_address')->nullable();
            $table->string('payment_terms', 50)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('internal_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('customer_uuid', 36)->nullable()->index();
            $table->string('customer_type', 100)->nullable();
            $table->string('facilitator_uuid', 36)->nullable()->index();
            $table->string('facilitator_type', 100)->nullable();
            $table->string('driver_assigned_uuid', 36)->nullable();
            $table->string('vehicle_assigned_uuid', 36)->nullable();
            $table->string('load_number', 100)->nullable();
            $table->integer('orchestrator_priority')->default(50);
            $table->string('status', 50)->default('pending');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('lr_numbers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('customer_uuid', 36)->nullable()->index();
            $table->string('consignor_uuid', 36)->nullable();
            $table->string('consignee_uuid', 36)->nullable();
            $table->string('vehicle_uuid', 36)->nullable();
            $table->string('driver_uuid', 36)->nullable();
            $table->string('lr_number', 50)->nullable();
            $table->date('lr_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('bilties', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('customer_uuid', 36)->nullable()->index();
            $table->string('consignor_uuid', 36)->nullable();
            $table->string('consignee_uuid', 36)->nullable();
            $table->string('vehicle_uuid', 36)->nullable();
            $table->string('driver_uuid', 36)->nullable();
            $table->string('bilty_number', 50)->nullable();
            $table->date('bilty_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('freight_charges', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('internal_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('load_uuid', 36)->nullable()->index();
            $table->string('order_uuid', 36)->nullable()->index();
            $table->string('customer_uuid', 36)->nullable()->index();
            $table->decimal('freight_amount', 12, 2)->default(0);
            $table->decimal('total_charges', 12, 2)->default(0);
            $table->decimal('advance_paid', 12, 2)->default(0);
            $table->decimal('deductions', 12, 2)->default(0);
            $table->decimal('balance_payable', 12, 2)->default(0);
            $table->string('payment_status', 50)->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test customer freight statement aggregates orders, LRs, Bilties and Freight Charges.
     */
    public function test_customer_statement_aggregation(): void
    {
        // 1. Create order
        $order = Order::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'customer_uuid' => $this->customerUuid,
            'customer_type' => Contact::class,
            'load_number'   => 'LD-2026-STAT-01',
            'status'        => 'in_transit',
        ]);

        // 2. Create Freight Charge
        $charge = FreightCharge::create([
            'uuid'            => (string) Str::uuid(),
            'company_uuid'    => $this->companyUuid,
            'load_uuid'       => $order->uuid,
            'order_uuid'      => $order->uuid,
            'customer_uuid'   => $this->customerUuid,
            'freight_amount'  => 50000,
            'total_charges'   => 55000,
            'advance_paid'    => 20000,
            'deductions'      => 1000,
            'balance_payable' => 34000,
            'payment_status'  => 'partial',
            'remarks'         => 'Advance received via RTGS',
        ]);

        $controller = new CustomerStatementController();
        $request = Request::create("/int/v1/customers/{$this->customerUuid}/statement", 'GET');
        $request->headers->set('Company-Header', $this->companyUuid);

        $response = $controller->statement($this->customerUuid, $request);
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);

        $this->assertEquals('Adani Ports & SEZ', $data['customer']['name']);
        $this->assertEquals(1, $data['summary']['total_loads']);
        $this->assertEquals(55000, $data['summary']['total_freight_billed']);
        $this->assertEquals(20000, $data['summary']['total_advance_paid']);
        $this->assertEquals(1000, $data['summary']['total_deductions']);
        $this->assertEquals(34000, $data['summary']['outstanding_balance']);
        $this->assertCount(1, $data['transactions']);
        $this->assertEquals(34000, $data['transactions'][0]['balance_payable']);
    }

    /**
     * Test statement endpoint company isolation.
     */
    public function test_customer_statement_enforces_company_isolation(): void
    {
        $controller = new CustomerStatementController();
        $request = Request::create("/int/v1/customers/{$this->customerUuid}/statement", 'GET');
        // Querying customer with other company header
        $request->headers->set('Company-Header', $this->otherCompanyUuid);

        $response = $controller->statement($this->customerUuid, $request);
        $this->assertEquals(404, $response->getStatusCode());
    }

    /**
     * Test recording payment against a freight charge recalculates balance and updates status.
     */
    public function test_freight_charge_payment_recording_and_status_progression(): void
    {
        $charge = FreightCharge::create([
            'uuid'            => (string) Str::uuid(),
            'company_uuid'    => $this->companyUuid,
            'customer_uuid'   => $this->customerUuid,
            'freight_amount'  => 50000,
            'total_charges'   => 50000,
            'advance_paid'    => 10000,
            'deductions'      => 0,
            'balance_payable' => 40000,
            'payment_status'  => 'partial',
        ]);

        $billingEngine = new BillingEngineService();
        $controller = new FreightChargeController($billingEngine);

        // Payment 1: Partial payment of 25000
        $req1 = Request::create("/int/v1/freight-charges/{$charge->uuid}/record-payment", 'POST', [
            'amount'         => 25000,
            'payment_method' => 'NEFT',
            'reference'      => 'UTR-987654321',
            'notes'          => 'Part balance clearance',
        ]);
        $req1->headers->set('Company-Header', $this->companyUuid);

        $res1 = $controller->recordPayment($charge->uuid, $req1);
        $this->assertEquals(200, $res1->getStatusCode());
        $data1 = json_decode($res1->getContent(), true);

        $this->assertEquals(35000, $data1['freight_charge']['advance_paid']);
        $this->assertEquals(15000, $data1['freight_charge']['balance_payable']);
        $this->assertEquals('partial', $data1['freight_charge']['payment_status']);

        // Payment 2: Full final settlement of remaining 15000
        $req2 = Request::create("/int/v1/freight-charges/{$charge->uuid}/record-payment", 'POST', [
            'amount'         => 15000,
            'payment_method' => 'RTGS',
            'reference'      => 'UTR-999999999',
        ]);
        $req2->headers->set('Company-Header', $this->companyUuid);

        $res2 = $controller->recordPayment($charge->uuid, $req2);
        $this->assertEquals(200, $res2->getStatusCode());
        $data2 = json_decode($res2->getContent(), true);

        $this->assertEquals(50000, $data2['freight_charge']['advance_paid']);
        $this->assertEquals(0, $data2['freight_charge']['balance_payable']);
        $this->assertEquals('paid', $data2['freight_charge']['payment_status']);
    }
}
