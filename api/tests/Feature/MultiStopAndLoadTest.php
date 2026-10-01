<?php

namespace Tests\Feature;

use App\Models\LoadLocation;
use App\Services\MultiStopService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MultiStopAndLoadTest extends TestCase
{
    protected string $companyUuid;
    protected string $otherCompanyUuid;
    protected MultiStopService $multiStopService;

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

        $this->multiStopService = new MultiStopService();
        $this->companyUuid = (string) Str::uuid();
        $this->otherCompanyUuid = (string) Str::uuid();
        request()->headers->set('Company-Header', $this->companyUuid);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('load_locations');
        Schema::dropIfExists('companies');

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('load_locations', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36)->index();
            $table->string('load_uuid', 36)->nullable()->index();
            $table->string('place_uuid', 36)->nullable();
            $table->integer('sequence')->default(0);
            $table->string('location_type', 50)->default('pickup');
            $table->string('contact_name', 255)->nullable();
            $table->string('contact_phone', 50)->nullable();
            $table->text('material_items')->nullable();
            $table->decimal('total_quantity', 10, 2)->nullable();
            $table->decimal('total_weight', 10, 2)->nullable();
            $table->string('status', 50)->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->string('completed_by_uuid', 36)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test creating ordered stops for a consignment load.
     */
    public function test_multi_stop_creation_and_ordering(): void
    {
        $orderUuid = (string) Str::uuid();
        $stops = [
            [
                'location_type' => 'pickup',
                'contact_name'  => 'Mumbai Factory 1',
                'contact_phone' => '9820011111',
                'total_weight'  => 10.0,
            ],
            [
                'location_type' => 'pickup',
                'contact_name'  => 'Pune Warehouse 2',
                'contact_phone' => '9820022222',
                'total_weight'  => 5.0,
            ],
            [
                'location_type' => 'delivery',
                'contact_name'  => 'Bangalore Hub',
                'contact_phone' => '9820033333',
                'total_weight'  => 15.0,
            ],
        ];

        $created = $this->multiStopService->createStopsForOrder($orderUuid, $stops, $this->companyUuid);

        $this->assertCount(3, $created);
        $this->assertEquals(1, $created[0]->sequence);
        $this->assertEquals('pickup', $created[0]->location_type);
        $this->assertEquals(2, $created[1]->sequence);
        $this->assertEquals(3, $created[2]->sequence);
        $this->assertEquals('delivery', $created[2]->location_type);

        $this->assertDatabaseHas('load_locations', [
            'load_uuid'     => $orderUuid,
            'company_uuid'  => $this->companyUuid,
            'contact_name'  => 'Bangalore Hub',
            'sequence'      => 3,
        ]);
    }

    /**
     * Test valid multi-stop lifecycle state machine transitions.
     */
    public function test_multi_stop_lifecycle_state_machine_valid_transitions(): void
    {
        $orderUuid = (string) Str::uuid();
        $stops = $this->multiStopService->createStopsForOrder($orderUuid, [
            ['location_type' => 'pickup', 'contact_name' => 'Surat GIDC'],
        ], $this->companyUuid);

        $stop = $stops[0];
        $this->assertEquals(MultiStopService::STATUS_PENDING, $stop->status);

        // PENDING -> ARRIVED
        $stop = $this->multiStopService->transitionStopStatus($stop, MultiStopService::STATUS_ARRIVED);
        $this->assertEquals(MultiStopService::STATUS_ARRIVED, $stop->status);

        // ARRIVED -> LOADING
        $stop = $this->multiStopService->transitionStopStatus($stop, MultiStopService::STATUS_LOADING);
        $this->assertEquals(MultiStopService::STATUS_LOADING, $stop->status);

        // LOADING -> LOADED
        $stop = $this->multiStopService->transitionStopStatus($stop, MultiStopService::STATUS_LOADED);
        $this->assertEquals(MultiStopService::STATUS_LOADED, $stop->status);

        // LOADED -> IN_TRANSIT
        $stop = $this->multiStopService->transitionStopStatus($stop, MultiStopService::STATUS_IN_TRANSIT);
        $this->assertEquals(MultiStopService::STATUS_IN_TRANSIT, $stop->status);

        // IN_TRANSIT -> DELIVERED
        $userUuid = (string) Str::uuid();
        $stop = $this->multiStopService->transitionStopStatus($stop, MultiStopService::STATUS_DELIVERED, [
            'user_uuid' => $userUuid,
            'remarks'   => 'Unloaded 200 cartons without damage',
        ]);
        $this->assertEquals(MultiStopService::STATUS_DELIVERED, $stop->status);
        $this->assertNotNull($stop->completed_at);
        $this->assertEquals($userUuid, $stop->completed_by_uuid);
        $this->assertEquals('Unloaded 200 cartons without damage', $stop->remarks);
    }

    /**
     * Test state machine rejects invalid status transition.
     */
    public function test_multi_stop_state_machine_rejects_illegal_jump(): void
    {
        $orderUuid = (string) Str::uuid();
        $stops = $this->multiStopService->createStopsForOrder($orderUuid, [
            ['location_type' => 'pickup', 'contact_name' => 'Vapi Yard'],
        ], $this->companyUuid);

        $stop = $stops[0];
        $this->assertEquals(MultiStopService::STATUS_PENDING, $stop->status);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage("Cannot transition stop from 'pending' to 'delivered'");

        // Illegal jump: pending directly to delivered
        $this->multiStopService->transitionStopStatus($stop, MultiStopService::STATUS_DELIVERED);
    }

    /**
     * Test multi-stop company isolation.
     */
    public function test_multi_stop_company_isolation(): void
    {
        $orderUuid = (string) Str::uuid();
        $stops = $this->multiStopService->createStopsForOrder($orderUuid, [
            ['location_type' => 'pickup', 'contact_name' => 'Company A Depot'],
        ], $this->companyUuid);

        // Query with Company A
        request()->headers->set('Company-Header', $this->companyUuid);
        $found = LoadLocation::where('uuid', $stops[0]->uuid)->first();
        $this->assertNotNull($found);

        // Query with Company B
        request()->headers->set('Company-Header', $this->otherCompanyUuid);
        $notFound = LoadLocation::where('uuid', $stops[0]->uuid)->first();
        $this->assertNull($notFound);
    }
}
