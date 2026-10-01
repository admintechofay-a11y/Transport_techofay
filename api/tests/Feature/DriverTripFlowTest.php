<?php

namespace Tests\Feature;

use App\Http\Controllers\Internal\v1\DriverTripController;
use App\Models\LoadLocation;
use App\Models\Order;
use App\Services\DriverTripService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class DriverTripFlowTest extends TestCase
{
    protected string $companyUuid;
    protected string $otherCompanyUuid;
    protected string $driverUuid;
    protected string $otherDriverUuid;
    protected string $userUuid;
    protected string $otherUserUuid;
    protected DriverTripService $service;

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

        $this->service = new DriverTripService();
        $this->companyUuid = (string) Str::uuid();
        $this->otherCompanyUuid = (string) Str::uuid();
        $this->driverUuid = (string) Str::uuid();
        $this->otherDriverUuid = (string) Str::uuid();
        $this->userUuid = (string) Str::uuid();
        $this->otherUserUuid = (string) Str::uuid();

        request()->headers->set('Company-Header', $this->companyUuid);

        DB::table('companies')->insert([
            ['uuid' => $this->companyUuid, 'name' => 'Technofay Transport', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['uuid' => $this->otherCompanyUuid, 'name' => 'Competitor Freight', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        DB::table('users')->insert([
            ['uuid' => $this->userUuid, 'company_uuid' => $this->companyUuid, 'name' => 'Driver User 1', 'email' => 'driver1@technofay.com', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['uuid' => $this->otherUserUuid, 'company_uuid' => $this->otherCompanyUuid, 'name' => 'Driver User 2', 'email' => 'driver2@competitor.com', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        DB::table('drivers')->insert([
            ['uuid' => $this->driverUuid, 'company_uuid' => $this->companyUuid, 'user_uuid' => $this->userUuid, 'name' => 'Driver Rajesh Sharma', 'phone' => '+91 98765 11111', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['uuid' => $this->otherDriverUuid, 'company_uuid' => $this->otherCompanyUuid, 'user_uuid' => $this->otherUserUuid, 'name' => 'Driver Suresh Verma', 'phone' => '+91 98765 22222', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('files');
        Schema::dropIfExists('load_locations');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('users');
        Schema::dropIfExists('companies');

        Schema::create('files', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('company_uuid', 36)->nullable();
            $table->string('subject_uuid', 36)->nullable();
            $table->string('subject_type', 100)->nullable();
            $table->string('type', 50)->nullable();
            $table->string('url')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('company_uuid', 36)->nullable();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('drivers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('user_uuid', 36)->nullable();
            $table->string('name');
            $table->string('phone', 50)->nullable();
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
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('driver_assigned_uuid', 36)->nullable()->index();
            $table->string('vehicle_assigned_uuid', 36)->nullable()->index();
            $table->string('load_number', 100)->nullable();
            $table->string('status', 50)->default('pending');
            $table->boolean('dispatched')->default(false);
            $table->dateTime('dispatched_at')->nullable();
            $table->boolean('started')->default(false);
            $table->dateTime('started_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->json('meta')->nullable();
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
            $table->integer('sequence')->default(0);
            $table->string('location_type', 50)->default('pickup');
            $table->string('contact_name', 255)->nullable();
            $table->string('contact_phone', 50)->nullable();
            $table->string('status', 50)->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->string('completed_by_uuid', 36)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test driver can list assigned trips with company isolation.
     */
    public function test_driver_can_list_assigned_trips_with_company_isolation(): void
    {
        $trip1 = Order::create([
            'uuid'                 => (string) Str::uuid(),
            'company_uuid'         => $this->companyUuid,
            'driver_assigned_uuid' => $this->driverUuid,
            'load_number'          => 'TRIP-2026-001',
            'status'               => 'dispatched',
        ]);

        $trip2 = Order::create([
            'uuid'                 => (string) Str::uuid(),
            'company_uuid'         => $this->otherCompanyUuid,
            'driver_assigned_uuid' => $this->otherDriverUuid,
            'load_number'          => 'TRIP-2026-002',
            'status'               => 'dispatched',
        ]);

        // Driver 1 lists trips in Company 1
        $tripsA = $this->service->listDriverTrips($this->driverUuid, $this->companyUuid);
        $this->assertEquals(1, $tripsA->total());
        $this->assertEquals($trip1->uuid, $tripsA->items()[0]->uuid);

        // Driver 2 lists trips in Company 2
        $tripsB = $this->service->listDriverTrips($this->otherDriverUuid, $this->otherCompanyUuid);
        $this->assertEquals(1, $tripsB->total());
        $this->assertEquals($trip2->uuid, $tripsB->items()[0]->uuid);
    }

    /**
     * Test driver accept and start lifecycle state machine.
     */
    public function test_driver_can_accept_and_start_trip_state_machine(): void
    {
        $order = Order::create([
            'uuid'                 => (string) Str::uuid(),
            'company_uuid'         => $this->companyUuid,
            'driver_assigned_uuid' => $this->driverUuid,
            'load_number'          => 'TRIP-2026-003',
            'status'               => 'dispatched',
        ]);

        $stop1 = LoadLocation::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'load_uuid'     => $order->uuid,
            'sequence'      => 1,
            'location_type' => 'pickup',
            'status'        => 'pending',
        ]);

        // Step 1: Accept
        $acceptedOrder = $this->service->acceptTrip($order->uuid, $this->driverUuid, $this->companyUuid);
        $this->assertEquals('driver_accepted', $acceptedOrder->status);
        $meta = is_array($acceptedOrder->meta) ? $acceptedOrder->meta : json_decode($acceptedOrder->meta, true);
        $this->assertNotEmpty($meta['driver_accepted_at']);

        // Step 2: Start
        $startedOrder = $this->service->startTrip($order->uuid, $this->driverUuid, $this->companyUuid);
        $this->assertEquals('in_transit', $startedOrder->status);
        $this->assertTrue((bool) $startedOrder->started);
        $this->assertNotNull($startedOrder->started_at);

        // First pickup stop should auto-progress to loading
        $stop1->refresh();
        $this->assertEquals('loading', $stop1->status);
    }

    /**
     * Test driver cannot access or manipulate another driver's trip.
     */
    public function test_driver_cannot_access_or_manipulate_another_drivers_trip(): void
    {
        $order = Order::create([
            'uuid'                 => (string) Str::uuid(),
            'company_uuid'         => $this->companyUuid,
            'driver_assigned_uuid' => $this->driverUuid,
            'load_number'          => 'TRIP-2026-004',
            'status'               => 'dispatched',
        ]);

        try {
            $this->service->resolveTrip($order->uuid, $this->companyUuid, $this->otherDriverUuid);
            $this->fail('Expected HttpException 403');
        } catch (HttpException $e) {
            $this->assertEquals(403, $e->getStatusCode());
        }
    }

    /**
     * Test stop progression (start-stop, complete-stop) and final trip completion.
     */
    public function test_driver_can_start_and_complete_stops_and_complete_entire_trip(): void
    {
        $order = Order::create([
            'uuid'                 => (string) Str::uuid(),
            'company_uuid'         => $this->companyUuid,
            'driver_assigned_uuid' => $this->driverUuid,
            'load_number'          => 'TRIP-2026-005',
            'status'               => 'in_transit',
        ]);

        $pickup = LoadLocation::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'load_uuid'     => $order->uuid,
            'sequence'      => 1,
            'location_type' => 'pickup',
            'status'        => 'loading',
        ]);

        $dropoff = LoadLocation::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'load_uuid'     => $order->uuid,
            'sequence'      => 2,
            'location_type' => 'delivery',
            'status'        => 'pending',
        ]);

        // Complete pickup stop
        $resPickup = $this->service->completeStop($order->uuid, $pickup->uuid, $this->driverUuid, $this->companyUuid, [
            'remarks' => 'All 20 tonnes loaded safely',
        ]);
        $this->assertEquals('loaded', $resPickup['stop']->status);
        $this->assertNotNull($resPickup['stop']->completed_at);
        $this->assertEquals('All 20 tonnes loaded safely', $resPickup['stop']->remarks);

        // Start dropoff stop
        $resDropoffStart = $this->service->startStop($order->uuid, $dropoff->uuid, $this->driverUuid, $this->companyUuid);
        $this->assertEquals('in_transit', $resDropoffStart['stop']->status);

        // Complete dropoff stop
        $resDropoff = $this->service->completeStop($order->uuid, $dropoff->uuid, $this->driverUuid, $this->companyUuid, [
            'remarks' => 'Delivered to warehouse manager',
        ]);
        $this->assertEquals('delivered', $resDropoff['stop']->status);
        $this->assertNotNull($resDropoff['stop']->completed_at);

        // Complete entire trip
        $completedTrip = $this->service->completeTrip($order->uuid, $this->driverUuid, $this->companyUuid, [
            'odometer_end' => '124500',
            'remarks'      => 'Trip concluded on time without exceptions',
        ]);

        $this->assertEquals('completed', $completedTrip->status);
        $this->assertNotNull($completedTrip->delivered_at);
        $meta = is_array($completedTrip->meta) ? $completedTrip->meta : json_decode($completedTrip->meta, true);
        $this->assertEquals('124500', $meta['odometer_end']);
        $this->assertEquals('Trip concluded on time without exceptions', $meta['completion_remarks']);
    }

    /**
     * Test REST controller endpoints for driver trips.
     */
    public function test_driver_trip_controller_http_endpoints(): void
    {
        $order = Order::create([
            'uuid'                 => (string) Str::uuid(),
            'company_uuid'         => $this->companyUuid,
            'driver_assigned_uuid' => $this->driverUuid,
            'load_number'          => 'TRIP-2026-006',
            'status'               => 'dispatched',
        ]);

        $controller = new DriverTripController($this->service);

        // 1. Accept
        $reqAccept = Request::create("/v1/driver/trips/{$order->uuid}/accept", 'POST');
        $reqAccept->headers->set('Company-Header', $this->companyUuid);
        $reqAccept->headers->set('Driver-Uuid', $this->driverUuid);

        $resAccept = $controller->acceptTrip($reqAccept, $order->uuid);
        $this->assertEquals(200, $resAccept->getStatusCode());
        $dataAccept = json_decode($resAccept->getContent(), true);
        $this->assertEquals('driver_accepted', $dataAccept['trip']['status']);

        // 2. Start
        $reqStart = Request::create("/v1/driver/trips/{$order->uuid}/start", 'POST');
        $reqStart->headers->set('Company-Header', $this->companyUuid);
        $reqStart->headers->set('Driver-Uuid', $this->driverUuid);

        $resStart = $controller->startTrip($reqStart, $order->uuid);
        $this->assertEquals(200, $resStart->getStatusCode());
        $dataStart = json_decode($resStart->getContent(), true);
        $this->assertEquals('in_transit', $dataStart['trip']['status']);

        // 3. Complete
        $reqComplete = Request::create("/v1/driver/trips/{$order->uuid}/complete", 'POST', [
            'odometer_end' => '54321',
        ]);
        $reqComplete->headers->set('Company-Header', $this->companyUuid);
        $reqComplete->headers->set('Driver-Uuid', $this->driverUuid);

        $resComplete = $controller->completeTrip($reqComplete, $order->uuid);
        $this->assertEquals(200, $resComplete->getStatusCode());
        $dataComplete = json_decode($resComplete->getContent(), true);
        $this->assertEquals('completed', $dataComplete['trip']['status']);
    }
}
