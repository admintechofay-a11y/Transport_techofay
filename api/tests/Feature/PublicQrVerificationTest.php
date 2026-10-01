<?php

namespace Tests\Feature;

use App\Models\DeliveryChallan;
use App\Models\GatePass;
use App\Services\QrVerificationService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicQrVerificationTest extends TestCase
{
    protected string $companyUuid;
    protected QrVerificationService $service;

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
        $this->service = new QrVerificationService();
        $this->companyUuid = (string) Str::uuid();

        DB::table('companies')->insert([
            'uuid'       => $this->companyUuid,
            'name'       => 'Technofay Logistics Ltd',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
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
     * Test public verification endpoint returns 200 with sanitized data for Gate Pass.
     */
    public function test_public_verify_gate_pass_success(): void
    {
        $gatePass = GatePass::create([
            'uuid'             => (string) Str::uuid(),
            'company_uuid'     => $this->companyUuid,
            'gate_pass_number' => 'GP-2026-000100',
            'pass_type'        => 'out',
            'in_time'          => Carbon::now()->subHour(),
            'out_time'         => null,
            'authorized_by'    => 'Security Inspector',
            'security_name'    => 'Gate Officer Verma',
        ]);

        $token = $this->service->generateSignedToken('gate_pass', $gatePass);
        $gatePass->update(['qr_token' => $token]);

        $response = $this->getJson("/verify/{$token}");
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertTrue($data['valid']);
        $this->assertEquals('gate_pass', $data['document_type']);
        $this->assertEquals('GP-2026-000100', $data['document_number']);
        $this->assertEquals('active', $data['status']);
        $this->assertEquals('Outward', $data['pass_type']);
        $this->assertEquals('Technofay Logistics Ltd', $data['company_name']);
        $this->assertArrayHasKey('verified_at', $data);
        $this->assertEquals('Security Inspector', $data['details']['authorized_by']);
    }

    /**
     * Test public verification endpoint returns 200 for Delivery Challan.
     */
    public function test_public_verify_delivery_challan_success(): void
    {
        $challan = DeliveryChallan::create([
            'uuid'           => (string) Str::uuid(),
            'company_uuid'   => $this->companyUuid,
            'challan_number' => 'DC-2026-000200',
            'challan_date'   => Carbon::now()->toDateString(),
            'total_quantity' => 50,
            'total_weight'   => 18.5,
            'status'         => 'delivered',
            'received_by'    => 'Store Manager Patel',
            'delivered_at'   => Carbon::now(),
        ]);

        $token = $this->service->generateSignedToken('delivery_challan', $challan);

        $response = $this->getJson("/api/v1/verify/{$token}");
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertTrue($data['valid']);
        $this->assertEquals('delivery_challan', $data['document_type']);
        $this->assertEquals('DC-2026-000200', $data['document_number']);
        $this->assertEquals('delivered', $data['status']);
        $this->assertEquals(18.5, $data['details']['total_weight']);
        $this->assertEquals('Store Manager Patel', $data['details']['received_by']);
    }

    /**
     * Test verification fails with 403 on tampered or invalid token.
     */
    public function test_public_verify_tampered_token_forbidden(): void
    {
        $fakeToken = base64_encode(json_encode(['type' => 'gate_pass', 'uuid' => 'fake']) . '.tampered_signature_xyz');

        $response = $this->getJson("/verify/{$fakeToken}");
        $response->assertStatus(403);

        $data = $response->json();
        $this->assertFalse($data['valid']);
        $this->assertEquals('invalid', $data['status']);
    }

    /**
     * Test verification fails with 404 when document is not in DB.
     */
    public function test_public_verify_missing_record_not_found(): void
    {
        $dummy = new GatePass([
            'uuid'             => (string) Str::uuid(),
            'company_uuid'     => $this->companyUuid,
            'gate_pass_number' => 'GP-2026-999999',
        ]);

        $validTokenMissingDb = $this->service->generateSignedToken('gate_pass', $dummy);

        $response = $this->getJson("/verify/{$validTokenMissingDb}");
        $response->assertStatus(404);

        $data = $response->json();
        $this->assertFalse($data['valid']);
        $this->assertEquals('not_found', $data['status']);
    }
}
