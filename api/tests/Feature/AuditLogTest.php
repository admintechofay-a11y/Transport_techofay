<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Bilty;
use App\Models\LrNumber;
use App\Observers\TransportAuditObserver;
use App\Services\AuditLogService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    protected string $companyA;
    protected string $companyB;
    protected string $userUuid;
    protected AuditLogService $auditService;

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
        $this->userUuid = (string) Str::uuid();

        DB::table('companies')->insert([
            ['uuid' => $this->companyA, 'name' => 'Company Alpha', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['uuid' => $this->companyB, 'name' => 'Company Beta', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        $this->auditService = app(AuditLogService::class);

        // Bind observer for LrNumber and Bilty
        LrNumber::observe(TransportAuditObserver::class);
        Bilty::observe(TransportAuditObserver::class);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('lr_numbers');
        Schema::dropIfExists('bilties');
        Schema::dropIfExists('companies');

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 191)->unique()->nullable();
            $table->string('public_id', 191)->unique()->nullable();
            $table->string('company_uuid', 191)->nullable()->index();
            $table->string('user_uuid', 191)->nullable()->index();
            $table->string('action', 50)->index();
            $table->string('entity_type', 191)->index();
            $table->string('entity_uuid', 191)->index();
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('lr_numbers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 191)->unique()->nullable();
            $table->string('public_id', 191)->unique()->nullable();
            $table->string('company_uuid', 191)->nullable()->index();
            $table->string('lr_number', 100)->nullable();
            $table->string('status', 50)->default('booked');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('bilties', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 191)->unique()->nullable();
            $table->string('public_id', 191)->unique()->nullable();
            $table->string('company_uuid', 191)->nullable()->index();
            $table->string('bilty_number', 100)->nullable();
            $table->string('status', 50)->default('draft');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function test_observer_automatically_creates_audit_log_on_model_creation_and_status_change(): void
    {
        session(['company' => $this->companyA]);
        $lrUuid = (string) Str::uuid();

        // 1. Create LR under Company A
        $lr = LrNumber::create([
            'uuid'         => $lrUuid,
            'company_uuid' => $this->companyA,
            'lr_number'    => 'LR-DEL-2026-0001',
            'status'       => 'booked',
        ]);

        $createLog = AuditLog::where('entity_uuid', $lrUuid)->where('action', 'CREATE')->first();
        $this->assertNotNull($createLog, 'Observer should have logged CREATE action');
        $this->assertEquals($this->companyA, $createLog->company_uuid);
        $this->assertEquals('LrNumber', $createLog->entity_type);
        $this->assertEquals('LR-DEL-2026-0001', $createLog->after['lr_number'] ?? null);

        // 2. Update status: booked -> in_transit
        $lr->status = 'in_transit';
        $lr->save();

        $statusLog = AuditLog::where('entity_uuid', $lrUuid)->where('action', 'STATUS_CHANGE')->first();
        $this->assertNotNull($statusLog, 'Observer should have logged STATUS_CHANGE action');
        $this->assertEquals('booked', $statusLog->before['status'] ?? null);
        $this->assertEquals('in_transit', $statusLog->after['status'] ?? null);
    }

    public function test_audit_log_api_enforces_strict_multi_tenant_isolation(): void
    {
        // Insert logs for Company A
        $this->auditService->record('CREATE', (object) [
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyA,
        ], null, ['item' => 'Order A']);

        $this->auditService->record('STATUS_CHANGE', (object) [
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyA,
        ], ['status' => 'booked'], ['status' => 'delivered']);

        // Insert log for Company B
        $logB = $this->auditService->record('CREATE', (object) [
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyB,
        ], null, ['item' => 'Secret Company B Cargo']);

        // Query as Company A
        $responseA = $this->withSession(['company' => $this->companyA])
            ->getJson('/int/v1/audit-logs');

        $responseA->assertStatus(200);
        $dataA = $responseA->json('data');
        $this->assertCount(2, $dataA);

        foreach ($dataA as $log) {
            $this->assertEquals($this->companyA, $log['company_uuid']);
            $this->assertNotEquals('Secret Company B Cargo', $log['after']['item'] ?? null);
        }

        // Query as Company B
        $responseB = $this->withSession(['company' => $this->companyB])
            ->getJson('/int/v1/audit-logs');

        $responseB->assertStatus(200);
        $dataB = $responseB->json('data');
        $this->assertCount(1, $dataB);
        $this->assertEquals($this->companyB, $dataB[0]['company_uuid']);

        // Company A querying Company B log by ID receives 404
        $crossTenantResponse = $this->withSession(['company' => $this->companyA])
            ->getJson('/int/v1/audit-logs/' . $logB->uuid);

        $crossTenantResponse->assertStatus(404);
    }

    public function test_audit_log_api_filters_by_action_and_entity(): void
    {
        $lrUuid = (string) Str::uuid();
        $biltyUuid = (string) Str::uuid();

        $this->auditService->record('CREATE', (object) [
            'uuid'         => $lrUuid,
            'company_uuid' => $this->companyA,
        ], null, ['lr_number' => 'LR-001']);

        $this->auditService->record('STATUS_CHANGE', (object) [
            'uuid'         => $lrUuid,
            'company_uuid' => $this->companyA,
        ], ['status' => 'booked'], ['status' => 'in_transit']);

        $this->auditService->record('CREATE', (object) [
            'uuid'         => $biltyUuid,
            'company_uuid' => $this->companyA,
        ], null, ['bilty_number' => 'BL-001']);

        // Filter by action = STATUS_CHANGE
        $responseAction = $this->withSession(['company' => $this->companyA])
            ->getJson('/int/v1/audit-logs?action=STATUS_CHANGE');

        $responseAction->assertStatus(200);
        $items = $responseAction->json('data');
        $this->assertCount(1, $items);
        $this->assertEquals('STATUS_CHANGE', $items[0]['action']);
    }

    public function test_audit_logs_without_company_context_returns_forbidden(): void
    {
        $this->flushSession();
        $response = $this->getJson('/int/v1/audit-logs');
        $response->assertStatus(403);
    }
}
