<?php

namespace Tests\Feature;

use App\Models\Position;
use App\Models\Vehicle;
use App\Services\TelemetryService;
use Carbon\Carbon;
use Fleetbase\FleetOps\Models\Device;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class TelemetryIngestionTest extends TestCase
{
    protected string $companyA;
    protected string $companyB;
    protected string $vehicleUuidA;
    protected string $deviceUuidA;
    protected TelemetryService $telemetryService;

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

        $this->companyA = (string) Str::uuid();
        $this->companyB = (string) Str::uuid();
        $this->vehicleUuidA = (string) Str::uuid();
        $this->deviceUuidA = (string) Str::uuid();

        DB::table('companies')->insert([
            ['uuid' => $this->companyA, 'name' => 'Technofay Fleet A', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['uuid' => $this->companyB, 'name' => 'Technofay Fleet B', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        DB::table('vehicles')->insert([
            [
                'uuid'         => $this->vehicleUuidA,
                'public_id'    => 'vehicle_test_01',
                'company_uuid' => $this->companyA,
                'plate_number' => 'DL01AB1234',
                'status'       => 'active',
                'created_at'   => Carbon::now(),
                'updated_at'   => Carbon::now(),
            ],
        ]);

        DB::table('devices')->insert([
            [
                'uuid'         => $this->deviceUuidA,
                'public_id'    => 'device_test_01',
                'company_uuid' => $this->companyA,
                'serial_number'=> 'SN-AIS140-9988',
                'imei'         => '868120045678901',
                'vehicle_uuid' => $this->vehicleUuidA,
                'created_at'   => Carbon::now(),
                'updated_at'   => Carbon::now(),
            ],
        ]);

        $this->telemetryService = app(TelemetryService::class);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('positions');
        Schema::dropIfExists('devices');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('companies');

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('vehicles', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 191)->unique()->nullable();
            $table->string('public_id', 191)->unique()->nullable();
            $table->string('company_uuid', 191)->nullable()->index();
            $table->string('plate_number', 50)->nullable();
            $table->string('status', 50)->default('active');
            $table->text('location')->nullable();
            $table->decimal('odometer', 12, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 191)->unique()->nullable();
            $table->string('public_id', 191)->unique()->nullable();
            $table->string('company_uuid', 191)->nullable()->index();
            $table->string('serial_number', 100)->nullable();
            $table->string('imei', 50)->nullable();
            $table->string('vehicle_uuid', 191)->nullable();
            $table->text('location')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('positions', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key')->nullable();
            $table->string('uuid', 191)->unique()->nullable();
            $table->string('company_uuid', 191)->nullable()->index();
            $table->string('order_uuid', 191)->nullable()->index();
            $table->string('destination_uuid', 191)->nullable()->index();
            $table->string('subject_uuid', 191)->nullable();
            $table->string('subject_type', 191)->nullable();
            $table->text('coordinates')->nullable();
            $table->string('heading')->nullable();
            $table->string('bearing')->nullable();
            $table->string('speed')->nullable();
            $table->string('altitude')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function test_telemetry_ingestion_endpoint_persists_gps_position_and_updates_vehicle(): void
    {
        $payload = [
            'vehicle_uuid' => $this->vehicleUuidA,
            'latitude'     => 28.613939,
            'longitude'    => 77.209021,
            'speed'        => 58.5,
            'heading'      => 145,
            'altitude'     => 216,
            'odometer'     => 45210.5,
            'timestamp'    => Carbon::now()->toIso8601String(),
        ];

        $response = $this->withSession(['company' => $this->companyA])
            ->postJson('/api/v1/telemetry', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('latitude', 28.613939);
        $response->assertJsonPath('longitude', 77.209021);
        $response->assertJsonPath('speed', 58.5);

        // Verify database persistence
        $this->assertDatabaseHas('positions', [
            'company_uuid' => $this->companyA,
            'subject_uuid' => $this->vehicleUuidA,
            'speed'        => '58.5',
            'heading'      => '145',
        ]);

        // Verify vehicle odometer was updated
        $vehicle = DB::table('vehicles')->where('uuid', $this->vehicleUuidA)->first();
        $this->assertEquals(45210.5, (float) $vehicle->odometer);
    }

    public function test_telemetry_ingestion_with_device_identifier_resolves_tenant_and_vehicle(): void
    {
        $payload = [
            'device_id' => '868120045678901', // IMEI of registered device
            'latitude'  => 19.0760,
            'longitude' => 72.8777,
            'speed'     => 62.0,
            'heading'   => 90,
        ];

        // Hit endpoint without explicit company session; should resolve company and vehicle from device IMEI
        $this->flushSession();
        $response = $this->postJson('/api/v1/telemetry', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('company_uuid', $this->companyA);
        $response->assertJsonPath('vehicle_uuid', $this->vehicleUuidA);

        $this->assertDatabaseHas('positions', [
            'company_uuid' => $this->companyA,
            'subject_uuid' => $this->vehicleUuidA,
            'speed'        => '62',
        ]);
    }

    public function test_telemetry_ingestion_blocks_cross_tenant_device_hijack(): void
    {
        $payload = [
            'device_id' => '868120045678901', // belongs to Company A
            'latitude'  => 12.9716,
            'longitude' => 77.5946,
            'speed'     => 30.0,
        ];

        // Send request authenticated as Company B targeting Company A's device
        $response = $this->withSession(['company' => $this->companyB])
            ->postJson('/api/v1/telemetry', $payload);

        $response->assertStatus(403);
    }

    public function test_telemetry_batch_ingestion_and_latest_fleet_query(): void
    {
        $batch = [
            'positions' => [
                [
                    'vehicle_uuid' => $this->vehicleUuidA,
                    'latitude'     => 28.5355,
                    'longitude'    => 77.3910,
                    'speed'        => 40.0,
                ],
                [
                    'vehicle_uuid' => $this->vehicleUuidA,
                    'latitude'     => 28.5360,
                    'longitude'    => 77.3920,
                    'speed'        => 42.5,
                ],
            ],
        ];

        $response = $this->withSession(['company' => $this->companyA])
            ->postJson('/api/v1/telemetry', $batch);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('count', 2);

        // Query latest positions for Company A
        $latestRes = $this->withSession(['company' => $this->companyA])
            ->getJson('/api/v1/telemetry/latest?vehicle_uuid=' . $this->vehicleUuidA);

        $latestRes->assertStatus(200);
        $data = $latestRes->json('data');
        $this->assertCount(2, $data);

        // Query as Company B returns empty collection
        $latestResB = $this->withSession(['company' => $this->companyB])
            ->getJson('/api/v1/telemetry/latest');

        $latestResB->assertStatus(200);
        $this->assertCount(0, $latestResB->json('data'));
    }

    public function test_telemetry_validation_rejects_invalid_coordinates(): void
    {
        // Latitude out of bounds (> 90)
        $invalidLat = [
            'vehicle_uuid' => $this->vehicleUuidA,
            'latitude'     => 999.0,
            'longitude'    => 77.2090,
        ];

        $response = $this->withSession(['company' => $this->companyA])
            ->postJson('/api/v1/telemetry', $invalidLat);

        $response->assertStatus(422);

        // Missing latitude
        $missingCoord = [
            'vehicle_uuid' => $this->vehicleUuidA,
            'longitude'    => 77.2090,
        ];

        $response2 = $this->withSession(['company' => $this->companyA])
            ->postJson('/api/v1/telemetry', $missingCoord);

        $response2->assertStatus(422);
    }
}
