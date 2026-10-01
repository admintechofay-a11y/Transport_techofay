<?php

namespace Tests\Feature;

use App\Models\LoadLocation;
use App\Models\Order;
use App\Models\Proof;
use App\Services\ProofOfDeliveryService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProofOfDeliveryTest extends TestCase
{
    protected string $companyUuid;
    protected string $otherCompanyUuid;
    protected ProofOfDeliveryService $service;

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

        $this->service = new ProofOfDeliveryService();
        $this->companyUuid = (string) Str::uuid();
        $this->otherCompanyUuid = (string) Str::uuid();

        request()->headers->set('Company-Header', $this->companyUuid);

        DB::table('companies')->insert([
            ['uuid' => $this->companyUuid, 'name' => 'Technofay Transport', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['uuid' => $this->otherCompanyUuid, 'name' => 'Competitor Freight', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('proofs');
        Schema::dropIfExists('load_locations');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('companies');

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('internal_id', 191)->nullable();
            $table->integer('orchestrator_priority')->default(50);
            $table->boolean('adhoc')->default(false);
            $table->boolean('dispatched')->default(false);
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('load_number', 100)->nullable();
            $table->string('status', 50)->default('pending');
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('load_locations', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('load_uuid', 36)->nullable()->index();
            $table->string('stop_type', 50)->default('dropoff');
            $table->string('status', 50)->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('proofs', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('order_uuid', 36)->nullable()->index();
            $table->string('subject_uuid', 36)->nullable()->index();
            $table->string('subject_type', 191)->nullable();
            $table->string('file_uuid', 36)->nullable();
            $table->text('remarks')->nullable();
            $table->text('raw_data')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test POD submission creates proof, updates order status, and completes dropoff waypoints.
     */
    public function test_pod_submission_and_consignment_completion(): void
    {
        $order = Order::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'load_number'  => 'LD-2026-000888',
            'status'       => 'in_transit',
        ]);

        $stop = LoadLocation::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'load_uuid'    => $order->uuid,
            'stop_type'    => 'dropoff',
            'status'       => 'pending',
        ]);

        $proof = $this->service->createPod([
            'order_uuid'         => $order->uuid,
            'receiver_name'      => 'Supervisor R. Sharma',
            'receiver_phone'     => '+91 98765 43210',
            'packages_condition' => 'Seals intact, 50 bags verified',
            'latitude'           => 19.0760,
            'longitude'          => 72.8777,
            'remarks'            => 'Unloaded at Bay 4 with physical sign-off.',
        ], $this->companyUuid);

        $this->assertInstanceOf(Proof::class, $proof);
        $this->assertEquals($order->uuid, $proof->order_uuid);
        $this->assertEquals('Supervisor R. Sharma', $proof->data['receiver_name']);
        $this->assertEquals(19.0760, $proof->data['latitude']);
        $this->assertEquals('verified', $proof->data['status']);

        // Assert Order transitioned to delivered
        $order->refresh();
        $this->assertEquals('delivered', $order->status);
        $this->assertNotNull($order->delivered_at);

        // Assert dropoff waypoint transitioned to delivered
        $stop->refresh();
        $this->assertEquals('delivered', $stop->status);
        $this->assertNotNull($stop->completed_at);
    }

    /**
     * Test company isolation: proofs cannot leak between tenants.
     */
    public function test_pod_company_isolation(): void
    {
        $proofA = $this->service->createPod([
            'receiver_name' => 'Company A Receiver',
            'remarks'       => 'Company A POD',
        ], $this->companyUuid);

        $proofB = $this->service->createPod([
            'receiver_name' => 'Company B Receiver',
            'remarks'       => 'Company B POD',
        ], $this->otherCompanyUuid);

        // Querying with Company A header
        request()->headers->set('Company-Header', $this->companyUuid);
        $paginatedA = $this->service->listProofs([], $this->companyUuid);

        $this->assertCount(1, $paginatedA->items());
        $this->assertEquals($proofA->uuid, $paginatedA->items()[0]->uuid);

        // Querying with Company B header
        request()->headers->set('Company-Header', $this->otherCompanyUuid);
        $paginatedB = $this->service->listProofs([], $this->otherCompanyUuid);

        $this->assertCount(1, $paginatedB->items());
        $this->assertEquals($proofB->uuid, $paginatedB->items()[0]->uuid);
    }

    /**
     * Test REST controller endpoint.
     */
    public function test_pod_rest_api_endpoint(): void
    {
        $order = Order::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'load_number'  => 'LD-2026-000999',
            'status'       => 'in_transit',
        ]);

        $payload = [
            'order_uuid'    => $order->uuid,
            'receiver_name' => 'Gate Foreman Singh',
            'remarks'       => 'Delivered via REST API test',
            'latitude'      => 22.3072,
            'longitude'     => 73.1812,
        ];

        $controller = new \App\Http\Controllers\Internal\v1\ProofController($this->service);
        $request = \Illuminate\Http\Request::create('/int/v1/proofs', 'POST', $payload);
        $request->headers->set('Company-Header', $this->companyUuid);

        $response = $controller->store($request);
        $this->assertEquals(201, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('proof', $data);
        $this->assertEquals('Gate Foreman Singh', $data['proof']['data']['receiver_name']);

        $order->refresh();
        $this->assertEquals('delivered', $order->status);
    }
}
