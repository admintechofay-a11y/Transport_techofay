<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\DriverDocument;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use App\Services\DispatchValidationService;
use Fleetbase\FleetOps\Models\Order;
use Fleetbase\Models\Company;
use Fleetbase\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class VehicleAndDriverDispatchTest extends TestCase
{
    protected string $companyUuid;
    protected DispatchValidationService $validator;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'fleetbase.connection.db' => 'sqlite',
            'database.default' => 'sqlite',
            'database.connections.mysql' => config('database.connections.sqlite'),
            'responsecache.enabled' => false,
            'activitylog.enabled' => false,
            'cache.default' => 'array',
        ]);
        \Illuminate\Support\Facades\DB::setDefaultConnection('sqlite');

        $fakeCache = new class {
            public function clear(array $tags = []): void {}
        };
        app()->instance('responsecache', $fakeCache);
        \Illuminate\Support\Facades\Facade::clearResolvedInstance('responsecache');

        $this->createTestTables();

        $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
        if (is_object($pdo) && method_exists($pdo, 'sqliteCreateFunction')) {
            $pdo->sqliteCreateFunction('ST_PointFromText', function ($val = null, $srid = null) {
                return $val;
            });
            $pdo->sqliteCreateFunction('ST_GeomFromText', function ($val = null, $srid = null) {
                return $val;
            });
            $pdo->sqliteCreateFunction('ST_AsText', function ($val = null) {
                return $val;
            });
        }

        $this->validator = new DispatchValidationService();
        $this->companyUuid = (string) Str::uuid();
        request()->headers->set('Company-Header', $this->companyUuid);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('vehicle_documents');
        Schema::dropIfExists('driver_documents');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('tracking_statuses');
        Schema::dropIfExists('tracking_numbers');
        Schema::dropIfExists('files');
        Schema::dropIfExists('users');
        Schema::dropIfExists('companies');

        Schema::create('tracking_statuses', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('company_uuid', 36)->nullable();
            $table->string('tracking_number_uuid', 36)->nullable();
            $table->string('proof_uuid', 36)->nullable();
            $table->string('status')->nullable();
            $table->string('details')->nullable();
            $table->string('code')->nullable();
            $table->boolean('complete')->default(false);
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->text('location')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('tracking_numbers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('company_uuid', 36)->nullable();
            $table->string('owner_uuid', 36)->nullable();
            $table->string('owner_type')->nullable();
            $table->string('tracking_number')->nullable();
            $table->string('region')->nullable();
            $table->string('status')->nullable();
            $table->string('status_uuid', 36)->nullable();
            $table->text('qr_code')->nullable();
            $table->text('barcode')->nullable();
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
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36)->nullable();
            $table->string('name');
            $table->string('username')->nullable();
            $table->string('slug')->nullable();
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('password')->nullable();
            $table->string('type')->default('user');
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('vehicles', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36);
            $table->string('name')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('make')->nullable();
            $table->string('model')->nullable();
            $table->string('year')->nullable();
            $table->string('trim')->nullable();
            $table->string('plate_number')->nullable();
            $table->string('status')->default('active');
            $table->string('slug')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('drivers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36);
            $table->string('user_uuid', 36)->nullable();
            $table->string('name')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('phone')->nullable();
            $table->string('drivers_license_number')->nullable();
            $table->date('license_expiry')->nullable();
            $table->string('status')->default('active');
            $table->string('slug')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36)->nullable();
            $table->string('tracking_number_uuid', 36)->nullable();
            $table->string('vehicle_assigned_uuid', 36)->nullable();
            $table->string('driver_assigned_uuid', 36)->nullable();
            $table->integer('orchestrator_priority')->default(50);
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('vehicle_documents', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('company_uuid', 36);
            $table->string('vehicle_uuid', 36);
            $table->string('document_type');
            $table->date('expiry_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('driver_documents', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('company_uuid', 36);
            $table->string('driver_uuid', 36);
            $table->string('document_type');
            $table->date('expiry_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('files', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test Vehicle CRUD with real persistence.
     */
    public function test_vehicle_crud_persists_in_database(): void
    {
        // 1. Create
        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'name'         => 'Tata Prima 4028',
            'make'         => 'Tata',
            'model'        => 'Prima 4028',
            'plate_number' => 'GJ-06-XX-9999',
            'status'       => 'active',
        ]);

        $this->assertDatabaseHas('vehicles', [
            'uuid'         => $vehicle->uuid,
            'plate_number' => 'GJ-06-XX-9999',
        ]);

        // 2. Read
        $found = Vehicle::where('plate_number', 'GJ-06-XX-9999')->first();
        $this->assertNotNull($found);
        $this->assertEquals('Tata Prima 4028', $found->name);

        // 3. Update
        $found->update(['status' => 'maintenance']);
        $this->assertDatabaseHas('vehicles', [
            'uuid'   => $vehicle->uuid,
            'status' => 'maintenance',
        ]);

        // 4. Delete (soft-delete)
        $found->delete();
        $this->assertSoftDeleted('vehicles', ['uuid' => $vehicle->uuid]);
    }

    /**
     * Test Driver CRUD with real persistence.
     */
    public function test_driver_crud_persists_in_database(): void
    {
        $user = new User([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'name'         => 'Vikram Singh',
            'email'        => 'vikram@technofay.com',
            'phone'        => '9123456780',
            'status'       => 'active',
        ]);
        $user->type = 'driver';
        $user->save();

        // 1. Create
        $driver = Driver::create([
            'uuid'                   => (string) Str::uuid(),
            'company_uuid'           => $this->companyUuid,
            'user_uuid'              => $user->uuid,
            'name'                   => 'Vikram Singh',
            'phone'                  => '9123456780',
            'drivers_license_number' => 'DL-GJ-06-2020-001',
            'status'                 => 'active',
        ]);

        $this->assertDatabaseHas('drivers', [
            'uuid'                   => $driver->uuid,
            'drivers_license_number' => 'DL-GJ-06-2020-001',
        ]);

        // 2. Read
        $found = Driver::where('uuid', $driver->uuid)->first();
        $this->assertNotNull($found);
        $this->assertEquals('Vikram Singh', $found->name);

        // 3. Update
        $found->update(['status' => 'suspended']);
        $this->assertDatabaseHas('drivers', [
            'uuid'   => $driver->uuid,
            'status' => 'suspended',
        ]);

        // 4. Delete
        $found->delete();
        $this->assertSoftDeleted('drivers', ['uuid' => $driver->uuid]);
    }

    /**
     * Dispatch Validation: Vehicle blocked when inactive.
     */
    public function test_vehicle_cannot_be_dispatched_when_inactive(): void
    {
        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'plate_number' => 'MH-04-AB-1111',
            'status'       => 'maintenance',
        ]);

        $this->expectException(ValidationException::class);
        $this->validator->validateVehicleForDispatch($vehicle);
    }

    /**
     * Dispatch Validation: Vehicle blocked when already assigned to active trip.
     */
    public function test_vehicle_cannot_be_dispatched_with_overlapping_active_trip(): void
    {
        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'plate_number' => 'MH-04-AB-2222',
            'status'       => 'active',
        ]);

        // Overlapping active order exists
        Order::create([
            'uuid'                  => (string) Str::uuid(),
            'company_uuid'          => $this->companyUuid,
            'vehicle_assigned_uuid' => $vehicle->uuid,
            'status'                => 'in_progress',
        ]);

        $this->expectException(ValidationException::class);
        $this->validator->validateVehicleForDispatch($vehicle);
    }

    /**
     * Dispatch Validation: Vehicle blocked when mandatory documents missing.
     */
    public function test_vehicle_cannot_be_dispatched_when_mandatory_documents_missing(): void
    {
        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'plate_number' => 'MH-04-AB-3333',
            'status'       => 'active',
        ]);

        // Only RC exists; insurance and fitness are missing
        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'rc',
            'expiry_date'   => now()->addYear(),
            'is_active'     => true,
        ]);

        $this->expectException(ValidationException::class);
        $this->validator->validateVehicleForDispatch($vehicle);
    }

    /**
     * Dispatch Validation: Vehicle blocked when mandatory document is expired.
     */
    public function test_vehicle_cannot_be_dispatched_when_document_expired(): void
    {
        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'plate_number' => 'MH-04-AB-4444',
            'status'       => 'active',
        ]);

        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'rc',
            'expiry_date'   => now()->addYear(),
            'is_active'     => true,
        ]);

        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'insurance',
            'expiry_date'   => now()->subDays(5), // EXPIRED
            'is_active'     => true,
        ]);

        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'fitness_certificate',
            'expiry_date'   => now()->addMonths(6),
            'is_active'     => true,
        ]);

        $this->expectException(ValidationException::class);
        $this->validator->validateVehicleForDispatch($vehicle);
    }

    /**
     * Dispatch Validation: Vehicle passes when all criteria met.
     */
    public function test_vehicle_dispatch_succeeds_when_compliant_and_available(): void
    {
        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'plate_number' => 'MH-04-AB-5555',
            'status'       => 'active',
        ]);

        foreach (DispatchValidationService::MANDATORY_VEHICLE_DOCS as $docType) {
            VehicleDocument::create([
                'uuid'          => (string) Str::uuid(),
                'company_uuid'  => $this->companyUuid,
                'vehicle_uuid'  => $vehicle->uuid,
                'document_type' => $docType,
                'expiry_date'   => now()->addMonths(6),
                'is_active'     => true,
            ]);
        }

        $result = $this->validator->validateVehicleForDispatch($vehicle);
        $this->assertTrue($result);
    }

    /**
     * Dispatch Validation: Driver blocked when inactive.
     */
    public function test_driver_cannot_be_dispatched_when_inactive(): void
    {
        $user = new User([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'name'         => 'Raju Driver',
            'email'        => 'raju@technofay.com',
            'phone'        => '9876543201',
            'status'       => 'inactive',
        ]);
        $user->type = 'driver';
        $user->save();

        $driver = Driver::create([
            'uuid'                   => (string) Str::uuid(),
            'company_uuid'           => $this->companyUuid,
            'user_uuid'              => $user->uuid,
            'name'                   => 'Raju Driver',
            'drivers_license_number' => 'DL-999',
            'status'                 => 'suspended',
        ]);

        $this->expectException(ValidationException::class);
        $this->validator->validateDriverForDispatch($driver);
    }

    /**
     * Dispatch Validation: Driver blocked with overlapping active trip.
     */
    public function test_driver_cannot_be_dispatched_with_overlapping_active_trip(): void
    {
        $user = new User([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'name'         => 'Raju Driver 2',
            'email'        => 'raju2@technofay.com',
            'phone'        => '9876543202',
            'status'       => 'active',
        ]);
        $user->type = 'driver';
        $user->save();

        $driver = Driver::create([
            'uuid'                   => (string) Str::uuid(),
            'company_uuid'           => $this->companyUuid,
            'user_uuid'              => $user->uuid,
            'name'                   => 'Raju Driver 2',
            'drivers_license_number' => 'DL-1000',
            'status'                 => 'active',
        ]);

        Order::create([
            'uuid'                => (string) Str::uuid(),
            'company_uuid'        => $this->companyUuid,
            'driver_assigned_uuid'=> $driver->uuid,
            'status'              => 'en_route',
        ]);

        $this->expectException(ValidationException::class);
        $this->validator->validateDriverForDispatch($driver);
    }

    /**
     * Dispatch Validation: Driver blocked when license expired.
     */
    public function test_driver_cannot_be_dispatched_when_license_expired(): void
    {
        $user = new User([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'name'         => 'Raju Driver 3',
            'email'        => 'raju3@technofay.com',
            'phone'        => '9876543203',
            'status'       => 'active',
        ]);
        $user->type = 'driver';
        $user->save();

        $driver = Driver::create([
            'uuid'                   => (string) Str::uuid(),
            'company_uuid'           => $this->companyUuid,
            'user_uuid'              => $user->uuid,
            'name'                   => 'Raju Driver 3',
            'drivers_license_number' => 'DL-1001',
            'status'                 => 'active',
        ]);

        DriverDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'driver_uuid'   => $driver->uuid,
            'document_type' => 'driving_licence',
            'expiry_date'   => now()->subMonth(), // Expired
            'is_active'     => true,
        ]);

        $this->expectException(ValidationException::class);
        $this->validator->validateDriverForDispatch($driver);
    }

    /**
     * Dispatch Validation: Driver passes when active and valid license present.
     */
    public function test_driver_dispatch_succeeds_when_compliant_and_available(): void
    {
        $user = new User([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'name'         => 'Compliant Driver',
            'email'        => 'compliant.driver@technofay.com',
            'phone'        => '9876543204',
            'status'       => 'active',
        ]);
        $user->type = 'driver';
        $user->save();

        $driver = Driver::create([
            'uuid'                   => (string) Str::uuid(),
            'company_uuid'           => $this->companyUuid,
            'user_uuid'              => $user->uuid,
            'name'                   => 'Compliant Driver',
            'drivers_license_number' => 'DL-2026-COMPLIANT',
            'status'                 => 'active',
        ]);

        DriverDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'driver_uuid'   => $driver->uuid,
            'document_type' => 'driving_licence',
            'expiry_date'   => now()->addYear(),
            'is_active'     => true,
        ]);

        $result = $this->validator->validateDriverForDispatch($driver);
        $this->assertTrue($result);
    }
}
