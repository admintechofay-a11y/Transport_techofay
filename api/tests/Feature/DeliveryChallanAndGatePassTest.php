<?php

namespace Tests\Feature;

use App\Models\DeliveryChallan;
use App\Models\GatePass;
use App\Services\ChallanAndGatePassService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeliveryChallanAndGatePassTest extends TestCase
{
    protected string $companyUuid;
    protected string $otherCompanyUuid;
    protected ChallanAndGatePassService $service;

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

        $this->service = new ChallanAndGatePassService();
        $this->companyUuid = (string) Str::uuid();
        $this->otherCompanyUuid = (string) Str::uuid();
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
     * Test Delivery Challan creation, atomic numbering, and status transitions.
     */
    public function test_delivery_challan_crud_and_lifecycle(): void
    {
        $year = (int) Carbon::now()->format('Y');

        $challan1 = $this->service->createDeliveryChallan([
            'total_quantity' => 150,
            'total_weight'   => 12.5,
            'remarks'        => 'First consignment delivery batch',
        ], null, $this->companyUuid);

        $challan2 = $this->service->createDeliveryChallan([
            'total_quantity' => 300,
            'total_weight'   => 25.0,
        ], null, $this->companyUuid);

        $this->assertEquals(sprintf('DC-%04d-000001', $year), $challan1->challan_number);
        $this->assertEquals(sprintf('DC-%04d-000002', $year), $challan2->challan_number);
        $this->assertEquals('pending', $challan1->status);
        $this->assertNull($challan1->delivered_at);

        $this->assertDatabaseHas('delivery_challans', [
            'uuid'           => $challan1->uuid,
            'company_uuid'   => $this->companyUuid,
            'challan_number' => sprintf('DC-%04d-000001', $year),
        ]);

        // Transition status to delivered
        $updated = $this->service->updateChallanStatus($challan1, 'delivered', [
            'received_by' => 'Store Manager Vikram',
            'remarks'     => 'Received with intact seal',
        ]);

        $this->assertEquals('delivered', $updated->status);
        $this->assertNotNull($updated->delivered_at);
        $this->assertEquals('Store Manager Vikram', $updated->received_by);
        $this->assertEquals('Received with intact seal', $updated->remarks);
    }

    /**
     * Test Gate Pass creation, atomic numbering, and in/out timestamp tracking.
     */
    public function test_gate_pass_creation_and_exit_recording(): void
    {
        $year = (int) Carbon::now()->format('Y');

        $gatePass = $this->service->createGatePass([
            'pass_type'     => 'in',
            'authorized_by' => 'Yard In-Charge',
            'security_name' => 'Officer R. Verma',
            'remarks'       => 'Vehicle entered for loading',
        ], null, $this->companyUuid);

        $this->assertEquals(sprintf('GP-%04d-000001', $year), $gatePass->gate_pass_number);
        $this->assertEquals('in', $gatePass->pass_type);
        $this->assertNotNull($gatePass->in_time);
        $this->assertNull($gatePass->out_time);
        $this->assertNotEmpty($gatePass->qr_token);

        // Record exit
        $exitTime = Carbon::now()->addHours(2);
        $exited = $this->service->recordGatePassExit($gatePass, $exitTime);

        $this->assertNotNull($exited->out_time);
        $this->assertEquals($exitTime->toDateTimeString(), $exited->out_time->toDateTimeString());
    }

    /**
     * Test Gate Pass HMAC signed QR token security and verification.
     */
    public function test_gate_pass_hmac_signed_qr_token_verification(): void
    {
        $gatePass = $this->service->createGatePass([
            'pass_type'     => 'out',
            'authorized_by' => 'Security Chief',
        ], null, $this->companyUuid);

        $token = $gatePass->qr_token;
        $this->assertNotNull($token);

        // 1. Valid token verification succeeds
        $verified = $this->service->verifyHmacSignedQrToken($token);
        $this->assertNotNull($verified);
        $this->assertEquals('gate_pass', $verified['type']);
        $this->assertEquals($gatePass->uuid, $verified['uuid']);
        $this->assertEquals($gatePass->gate_pass_number, $verified['pass_number']);
        $this->assertEquals($this->companyUuid, $verified['company']);

        // 2. Tampered token fails verification
        $raw = base64_decode($token);
        $tamperedRaw = str_replace($gatePass->uuid, (string) Str::uuid(), $raw);
        $tamperedToken = base64_encode($tamperedRaw);

        $tamperedResult = $this->service->verifyHmacSignedQrToken($tamperedToken);
        $this->assertNull($tamperedResult);

        // 3. Corrupted base64 or garbage string fails verification
        $this->assertNull($this->service->verifyHmacSignedQrToken('invalid-garbage-token'));
    }

    /**
     * Test multi-tenancy company isolation for Challans and Gate Passes.
     */
    public function test_challan_and_gate_pass_company_isolation(): void
    {
        $challan = $this->service->createDeliveryChallan([
            'total_weight' => 10,
        ], null, $this->companyUuid);

        $gatePass = $this->service->createGatePass([
            'pass_type' => 'out',
        ], null, $this->companyUuid);

        // Query under Company A
        request()->headers->set('Company-Header', $this->companyUuid);
        $foundChallan = DeliveryChallan::where('uuid', $challan->uuid)->first();
        $foundPass = GatePass::where('uuid', $gatePass->uuid)->first();
        $this->assertNotNull($foundChallan);
        $this->assertNotNull($foundPass);

        // Query under Company B
        request()->headers->set('Company-Header', $this->otherCompanyUuid);
        $notFoundChallan = DeliveryChallan::where('uuid', $challan->uuid)->first();
        $notFoundPass = GatePass::where('uuid', $gatePass->uuid)->first();
        $this->assertNull($notFoundChallan);
        $this->assertNull($notFoundPass);
    }
}
