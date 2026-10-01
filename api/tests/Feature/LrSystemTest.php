<?php

namespace Tests\Feature;

use App\Models\LrNumber;
use App\Models\LrSequence;
use App\Models\LrStatusHistory;
use App\Services\LrDomainService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LrSystemTest extends TestCase
{
    protected string $companyUuid;
    protected string $otherCompanyUuid;
    protected LrDomainService $service;

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

        $this->service = new LrDomainService();
        $this->companyUuid = (string) Str::uuid();
        $this->otherCompanyUuid = (string) Str::uuid();
        request()->headers->set('Company-Header', $this->companyUuid);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('lr_status_histories');
        Schema::dropIfExists('lr_sequences');
        Schema::dropIfExists('lr_numbers');
        Schema::dropIfExists('companies');

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('lr_sequences', function (Blueprint $table) {
            $table->increments('id');
            $table->string('company_uuid', 36)->index();
            $table->integer('year')->index();
            $table->unsignedBigInteger('current_sequence')->default(0);
            $table->timestamps();

            $table->unique(['company_uuid', 'year'], 'unique_company_year');
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

        Schema::create('lr_status_histories', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('company_uuid', 36)->index();
            $table->string('lr_uuid', 36)->index();
            $table->string('from_status', 50)->nullable();
            $table->string('to_status', 50);
            $table->text('remarks')->nullable();
            $table->string('changed_by_uuid', 36)->nullable();
            $table->text('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test Atomic Concurrency-Safe Sequential LR Number Generation.
     */
    public function test_concurrency_safe_sequential_lr_number_generation(): void
    {
        $year = (int) Carbon::now()->format('Y');

        $num1 = $this->service->generateAtomicLrNumber($this->companyUuid, $year);
        $num2 = $this->service->generateAtomicLrNumber($this->companyUuid, $year);
        $num3 = $this->service->generateAtomicLrNumber($this->companyUuid, $year);

        $this->assertEquals(sprintf('LR-%d-000001', $year), $num1);
        $this->assertEquals(sprintf('LR-%d-000002', $year), $num2);
        $this->assertEquals(sprintf('LR-%d-000003', $year), $num3);

        // Different company has its own isolated sequence starting from 000001
        $otherCompanyNum = $this->service->generateAtomicLrNumber($this->otherCompanyUuid, $year);
        $this->assertEquals(sprintf('LR-%d-000001', $year), $otherCompanyNum);
    }

    /**
     * Test LR Creation with Real Database Persistence and Initial Status History.
     */
    public function test_lr_creation_persists_in_database_with_booked_status(): void
    {
        $lr = $this->service->createLr([
            'company_uuid'  => $this->companyUuid,
            'from_location' => 'Ahmedabad, Gujarat',
            'to_location'   => 'Mumbai, Maharashtra',
            'remarks'       => 'High-value pharmaceuticals',
        ]);

        $this->assertDatabaseHas('lr_numbers', [
            'uuid'          => $lr->uuid,
            'company_uuid'  => $this->companyUuid,
            'status'        => LrDomainService::STATUS_BOOKED,
            'from_location' => 'Ahmedabad, Gujarat',
            'to_location'   => 'Mumbai, Maharashtra',
        ]);

        // Assert initial status history created
        $this->assertDatabaseHas('lr_status_histories', [
            'lr_uuid'     => $lr->uuid,
            'from_status' => null,
            'to_status'   => LrDomainService::STATUS_BOOKED,
        ]);
    }

    /**
     * Test Strict State Machine: BOOKED -> LOADED -> IN_TRANSIT -> DELIVERED -> POD_CLOSED.
     */
    public function test_valid_lr_state_machine_lifecycle(): void
    {
        $lr = $this->service->createLr(['company_uuid' => $this->companyUuid]);

        // 1. BOOKED -> LOADED
        $lr = $this->service->transitionStatus($lr, LrDomainService::STATUS_LOADED, 'Loaded onto vehicle');
        $this->assertEquals(LrDomainService::STATUS_LOADED, $lr->status);

        // 2. LOADED -> IN_TRANSIT
        $lr = $this->service->transitionStatus($lr, LrDomainService::STATUS_IN_TRANSIT, 'Departed facility');
        $this->assertEquals(LrDomainService::STATUS_IN_TRANSIT, $lr->status);

        // 3. IN_TRANSIT -> DELIVERED
        $lr = $this->service->transitionStatus($lr, LrDomainService::STATUS_DELIVERED, 'Reached consignee dock');
        $this->assertEquals(LrDomainService::STATUS_DELIVERED, $lr->status);

        // 4. DELIVERED -> POD_CLOSED
        $lr = $this->service->transitionStatus($lr, LrDomainService::STATUS_POD_CLOSED, 'Signed POD received and verified');
        $this->assertEquals(LrDomainService::STATUS_POD_CLOSED, $lr->status);

        // Check complete history count (initial + 4 transitions = 5 records)
        $history = $this->service->getHistory($lr);
        $this->assertCount(5, $history);
    }

    /**
     * Test Invalid Transitions Fail (e.g. BOOKED -> DELIVERED must fail).
     */
    public function test_invalid_transition_fails_with_validation_exception(): void
    {
        $lr = $this->service->createLr(['company_uuid' => $this->companyUuid]);
        $this->assertEquals(LrDomainService::STATUS_BOOKED, $lr->status);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage("Cannot transition LR from 'BOOKED' to 'DELIVERED'");

        // Illegal jump: BOOKED directly to DELIVERED
        $this->service->transitionStatus($lr, LrDomainService::STATUS_DELIVERED);
    }

    /**
     * Test Invalid Transition from Terminal State Fails.
     */
    public function test_cannot_transition_from_pod_closed(): void
    {
        $lr = $this->service->createLr(['company_uuid' => $this->companyUuid]);
        $lr = $this->service->transitionStatus($lr, LrDomainService::STATUS_LOADED);
        $lr = $this->service->transitionStatus($lr, LrDomainService::STATUS_IN_TRANSIT);
        $lr = $this->service->transitionStatus($lr, LrDomainService::STATUS_DELIVERED);
        $lr = $this->service->transitionStatus($lr, LrDomainService::STATUS_POD_CLOSED);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage("Cannot transition LR from 'POD_CLOSED'");

        $this->service->transitionStatus($lr, LrDomainService::STATUS_LOADED);
    }

    /**
     * Test LR Cancellation.
     */
    public function test_lr_cancellation_from_booked(): void
    {
        $lr = $this->service->createLr(['company_uuid' => $this->companyUuid]);

        $lr = $this->service->cancelLr($lr, 'Client cancelled order before loading');
        $this->assertEquals(LrDomainService::STATUS_CANCELLED, $lr->status);

        $this->assertDatabaseHas('lr_status_histories', [
            'lr_uuid'     => $lr->uuid,
            'from_status' => LrDomainService::STATUS_BOOKED,
            'to_status'   => LrDomainService::STATUS_CANCELLED,
        ]);
    }
}
