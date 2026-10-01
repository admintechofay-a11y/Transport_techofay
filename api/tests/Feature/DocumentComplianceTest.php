<?php

namespace Tests\Feature;

use App\Events\DocumentExpiredEvent;
use App\Events\DocumentExpiringSoonEvent;
use App\Jobs\CheckDocumentExpiriesJob;
use App\Models\DriverDocument;
use App\Models\VehicleDocument;
use App\Services\DispatchValidationService;
use App\Services\DocumentComplianceService;
use Carbon\Carbon;
use Fleetbase\FleetOps\Models\Driver;
use Fleetbase\FleetOps\Models\Vehicle;
use Fleetbase\Models\Company;
use Fleetbase\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class DocumentComplianceTest extends TestCase
{
    protected string $companyUuid;
    protected DocumentComplianceService $service;
    protected DispatchValidationService $dispatchValidator;

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
        \Illuminate\Support\Facades\DB::setDefaultConnection('sqlite');

        $fakeCache = new class {
            public function clear(array $tags = []): void {}
        };
        app()->instance('responsecache', $fakeCache);
        \Illuminate\Support\Facades\Facade::clearResolvedInstance('responsecache');

        $this->createTestTables();

        $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
        if (is_object($pdo) && method_exists($pdo, 'sqliteCreateFunction')) {
            $pdo->sqliteCreateFunction('ST_PointFromText', fn ($val = null) => $val);
            $pdo->sqliteCreateFunction('ST_GeomFromText', fn ($val = null) => $val);
            $pdo->sqliteCreateFunction('ST_AsText', fn ($val = null) => $val);
        }

        $this->service = new DocumentComplianceService();
        $this->dispatchValidator = new DispatchValidationService();
        $this->companyUuid = (string) Str::uuid();
        request()->headers->set('Company-Header', $this->companyUuid);

        Storage::fake('local');
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
            $table->text('location')->nullable();
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
            $table->string('document_number')->nullable();
            $table->string('issuing_authority')->nullable();
            $table->string('file_url')->nullable();
            $table->text('notes')->nullable();
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
            $table->string('document_number')->nullable();
            $table->string('issuing_authority')->nullable();
            $table->string('file_url')->nullable();
            $table->text('notes')->nullable();
            $table->date('expiry_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test Vehicle Document Upload, Storage, and Record Creation.
     */
    public function test_vehicle_document_upload_and_storage(): void
    {
        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'plate_number' => 'MH-12-AB-1234',
            'status'       => 'active',
        ]);

        $fakeFile = UploadedFile::fake()->create('rc_certificate.pdf', 300, 'application/pdf');

        $doc = $this->service->storeVehicleDocument(
            $vehicle,
            'rc',
            Carbon::now()->addYear()->toDateString(),
            $fakeFile,
            ['document_number' => 'RC-998877']
        );

        $this->assertDatabaseHas('vehicle_documents', [
            'uuid'            => $doc->uuid,
            'vehicle_uuid'    => $vehicle->uuid,
            'document_type'   => 'rc',
            'document_number' => 'RC-998877',
            'is_active'       => 1,
        ]);

        $this->assertNotNull($doc->file_url);
        Storage::disk('local')->assertExists($doc->file_url);
    }

    /**
     * Test Vehicle Document Replacement deactivates previous document.
     */
    public function test_vehicle_document_replacement_deactivates_old(): void
    {
        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'plate_number' => 'MH-12-AB-5678',
            'status'       => 'active',
        ]);

        // Upload first RC document
        $oldFile = UploadedFile::fake()->create('old_rc.pdf', 200, 'application/pdf');
        $oldDoc = $this->service->storeVehicleDocument(
            $vehicle,
            'rc',
            Carbon::now()->addMonths(2)->toDateString(),
            $oldFile
        );

        // Upload replacement RC document
        $newFile = UploadedFile::fake()->create('new_rc.pdf', 250, 'application/pdf');
        $newDoc = $this->service->storeVehicleDocument(
            $vehicle,
            'rc',
            Carbon::now()->addYears(2)->toDateString(),
            $newFile
        );

        // Verify old document is deactivated
        $oldDoc->refresh();
        $this->assertFalse((bool) $oldDoc->is_active);

        // Verify new document is active
        $newDoc->refresh();
        $this->assertTrue((bool) $newDoc->is_active);
        Storage::disk('local')->assertExists($newDoc->file_url);
    }

    /**
     * Test Driver Document Upload, Storage, and Replacement.
     */
    public function test_driver_document_upload_and_replacement(): void
    {
        $user = new User();
        $user->uuid = (string) Str::uuid();
        $user->company_uuid = $this->companyUuid;
        $user->name = 'Ramu Kaka';
        $user->email = 'ramu@technofay.com';
        $user->password = bcrypt('Password123!');
        $user->type = 'driver';
        $user->save();

        $driver = Driver::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'user_uuid'    => $user->uuid,
            'name'         => 'Ramu Kaka',
            'status'       => 'active',
        ]);

        $fakeDl = UploadedFile::fake()->create('driving_licence.pdf', 400, 'application/pdf');

        $doc = $this->service->storeDriverDocument(
            $driver,
            'driving_licence',
            Carbon::now()->addYears(5)->toDateString(),
            $fakeDl,
            ['document_number' => 'DL-9988-PUN']
        );

        $this->assertDatabaseHas('driver_documents', [
            'uuid'          => $doc->uuid,
            'driver_uuid'   => $driver->uuid,
            'document_type' => 'driving_licence',
            'is_active'     => 1,
        ]);
        Storage::disk('local')->assertExists($doc->file_url);
    }

    /**
     * Test Document Status Evaluation (VALID, EXPIRING_SOON, EXPIRED, MISSING).
     */
    public function test_document_status_evaluation(): void
    {
        $today = Carbon::today();

        // Expired yesterday
        $statusExpired = $this->service->evaluateStatus($today->copy()->subDay()->toDateString());
        $this->assertEquals(DocumentComplianceService::STATUS_EXPIRED, $statusExpired);

        // Expiring in 10 days (threshold: 30)
        $statusExpiringSoon = $this->service->evaluateStatus($today->copy()->addDays(10)->toDateString());
        $this->assertEquals(DocumentComplianceService::STATUS_EXPIRING_SOON, $statusExpiringSoon);

        // Expiring in 90 days
        $statusValid = $this->service->evaluateStatus($today->copy()->addDays(90)->toDateString());
        $this->assertEquals(DocumentComplianceService::STATUS_VALID, $statusValid);
    }

    /**
     * Test Daily Expiry Job dispatches DocumentExpiredEvent and DocumentExpiringSoonEvent.
     */
    public function test_daily_expiry_job_dispatches_events(): void
    {
        Event::fake([
            DocumentExpiredEvent::class,
            DocumentExpiringSoonEvent::class,
        ]);

        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'plate_number' => 'KA-01-EXP-001',
            'status'       => 'active',
        ]);

        // 1. Expired RC
        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'rc',
            'expiry_date'   => Carbon::yesterday()->toDateString(),
            'is_active'     => true,
        ]);

        // 2. Insurance expiring in 15 days
        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'insurance',
            'expiry_date'   => Carbon::today()->addDays(15)->toDateString(),
            'is_active'     => true,
        ]);

        // 3. Fitness valid for 6 months
        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'fitness_certificate',
            'expiry_date'   => Carbon::today()->addMonths(6)->toDateString(),
            'is_active'     => true,
        ]);

        // Run the daily check job
        $job = new CheckDocumentExpiriesJob(30);
        $result = $job->handle($this->service);

        $this->assertEquals(1, $result['expired']);
        $this->assertEquals(1, $result['expiring_soon']);

        Event::assertDispatched(DocumentExpiredEvent::class, function ($event) use ($vehicle) {
            return $event->entityType === 'vehicle' &&
                   $event->entityUuid === $vehicle->uuid &&
                   $event->documentType === 'rc';
        });

        Event::assertDispatched(DocumentExpiringSoonEvent::class, function ($event) use ($vehicle) {
            return $event->entityType === 'vehicle' &&
                   $event->entityUuid === $vehicle->uuid &&
                   $event->documentType === 'insurance' &&
                   $event->daysRemaining === 15;
        });
    }

    /**
     * Test Expired Mandatory Document blocks dispatch.
     */
    public function test_expired_mandatory_document_blocks_dispatch(): void
    {
        $vehicle = Vehicle::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'plate_number' => 'DL-01-DISP-001',
            'status'       => 'active',
        ]);

        // RC valid
        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'rc',
            'expiry_date'   => Carbon::now()->addYear()->toDateString(),
            'is_active'     => true,
        ]);

        // Insurance EXPIRED
        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'insurance',
            'expiry_date'   => Carbon::now()->subMonths(1)->toDateString(),
            'is_active'     => true,
        ]);

        // Fitness valid
        VehicleDocument::create([
            'uuid'          => (string) Str::uuid(),
            'company_uuid'  => $this->companyUuid,
            'vehicle_uuid'  => $vehicle->uuid,
            'document_type' => 'fitness_certificate',
            'expiry_date'   => Carbon::now()->addMonths(6)->toDateString(),
            'is_active'     => true,
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $this->expectExceptionMessage("Mandatory vehicle document 'insurance' is expired");

        $this->dispatchValidator->validateVehicleForDispatch($vehicle);
    }
}
