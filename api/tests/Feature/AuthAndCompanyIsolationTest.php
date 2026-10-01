<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\LrNumber;
use App\Models\Vehicle;
use App\Scopes\CompanyScope;
use Fleetbase\Models\Company;
use Fleetbase\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthAndCompanyIsolationTest extends TestCase
{
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
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('activity_log');
        Schema::dropIfExists('activity');
        Schema::dropIfExists('lr_numbers');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('company_users');
        Schema::dropIfExists('companies');
        Schema::dropIfExists('users');
        Schema::dropIfExists('files');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('order_configs');
        Schema::dropIfExists('vendors');
        Schema::dropIfExists('settings');

        Schema::create('order_configs', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id')->nullable();
            $table->string('company_uuid', 36)->nullable();
            $table->string('author_uuid', 36)->nullable();
            $table->string('category_uuid', 36)->nullable();
            $table->string('icon_uuid', 36)->nullable();
            $table->string('name')->nullable();
            $table->string('description')->nullable();
            $table->string('type')->nullable();
            $table->string('namespace')->nullable();
            $table->string('key')->nullable();
            $table->string('status')->nullable();
            $table->string('version')->nullable();
            $table->string('core_service')->nullable();
            $table->text('tags')->nullable();
            $table->text('flow')->nullable();
            $table->text('actions')->nullable();
            $table->text('entities')->nullable();
            $table->text('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->increments('id');
            $table->string('key')->nullable();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('company_uuid', 36)->nullable();
            $table->string('driver_assigned_uuid', 36)->nullable();
            $table->string('vehicle_assigned_uuid', 36)->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('vendors', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('company_uuid', 36)->nullable();
            $table->string('name')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('files', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('company_uuid', 36)->nullable();
            $table->string('uploader_uuid', 36)->nullable();
            $table->string('subject_uuid', 36)->nullable();
            $table->string('subject_type')->nullable();
            $table->string('caption')->nullable();
            $table->string('name')->nullable();
            $table->string('slug')->nullable();
            $table->string('original_filename')->nullable();
            $table->string('extension')->nullable();
            $table->string('content_type')->nullable();
            $table->bigInteger('file_size')->default(0);
            $table->string('disk')->default('local');
            $table->string('path')->nullable();
            $table->string('bucket')->nullable();
            $table->string('type')->nullable();
            $table->text('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('activity_log', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->nullable();
            $table->string('log_name')->nullable();
            $table->text('description')->nullable();
            $table->string('subject_type')->nullable();
            $table->string('subject_id')->nullable();
            $table->string('causer_type')->nullable();
            $table->string('causer_id')->nullable();
            $table->text('properties')->nullable();
            $table->timestamps();
        });

        Schema::create('activity', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->nullable();
            $table->string('log_name')->nullable();
            $table->text('description')->nullable();
            $table->string('subject_type')->nullable();
            $table->string('subject_id')->nullable();
            $table->string('causer_type')->nullable();
            $table->string('causer_id')->nullable();
            $table->text('properties')->nullable();
            $table->timestamps();
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('slug')->nullable();
            $table->string('name');
            $table->string('owner_uuid', 36)->nullable();
            $table->string('currency', 10)->default('INR');
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
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('timezone')->nullable();
            $table->string('country')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('company_users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('company_uuid', 36);
            $table->string('user_uuid', 36);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('vehicles', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36);
            $table->string('name')->nullable();
            $table->string('slug')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('type')->nullable();
            $table->string('year')->nullable();
            $table->string('make')->nullable();
            $table->string('model')->nullable();
            $table->string('trim')->nullable();
            $table->string('plate_number')->nullable();
            $table->string('status')->default('active');
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
            $table->string('drivers_license_number')->nullable();
            $table->string('slug')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('type')->nullable();
            $table->string('phone')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('lr_numbers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique();
            $table->string('public_id')->nullable();
            $table->string('internal_id')->nullable();
            $table->string('company_uuid', 36);
            $table->string('slug')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('lr_number')->nullable();
            $table->string('status')->default('BOOKED');
            $table->text('meta')->nullable();
            $table->date('lr_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test 1: Authentication endpoint validates credentials correctly.
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $company = Company::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Techofay Global Logistics',
        ]);

        $user = new User([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $company->uuid,
            'name'         => 'Test Dispatcher',
            'email'        => 'dispatcher@technofay.com',
            'status'       => 'active',
            'email_verified_at' => now(),
        ]);
        $user->password = 'SecretPass123!';
        $user->type = 'dispatcher';
        $user->save();

        $response = $this->postJson('/int/v1/auth/login', [
            'identity' => 'dispatcher@technofay.com',
            'password' => 'SecretPass123!',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['token', 'type']);
        $this->assertEquals('dispatcher', $response->json('type'));
    }

    /**
     * Test 2: Login rejects wrong password with 401.
     */
    public function test_login_rejects_invalid_password(): void
    {
        $company = Company::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Techofay Global Logistics',
        ]);

        $user = new User([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $company->uuid,
            'name'         => 'Test Dispatcher',
            'email'        => 'dispatcher@technofay.com',
            'status'       => 'active',
            'email_verified_at' => now(),
        ]);
        $user->password = 'SecretPass123!';
        $user->type = 'dispatcher';
        $user->save();

        $response = $this->postJson('/int/v1/auth/login', [
            'identity' => 'dispatcher@technofay.com',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test 3: Roles validation (admin, dispatcher, billing, driver, customer).
     */
    public function test_transport_roles_can_be_assigned_and_authenticated(): void
    {
        $roles = ['admin', 'dispatcher', 'billing', 'driver', 'customer'];
        $companyUuid = (string) Str::uuid();

        foreach ($roles as $role) {
            $user = new User([
                'uuid'         => (string) Str::uuid(),
                'company_uuid' => $companyUuid,
                'name'         => ucfirst($role) . ' User',
                'email'        => "{$role}@technofay.com",
                'status'       => 'active',
                'email_verified_at' => now(),
            ]);
            $user->password = 'TestRolePass123!';
            $user->type = $role;
            $user->save();

            $this->assertEquals($role, $user->type);
            $this->assertEquals($role, $user->getType());
        }
    }

    /**
     * Test 4: Strict Multi-Tenant Company Isolation.
     * Company A records CANNOT be accessed by Company B.
     */
    public function test_strict_company_isolation_prevents_cross_tenant_access(): void
    {
        $companyA = (string) Str::uuid();
        $companyB = (string) Str::uuid();

        // Create records directly under Company A
        Vehicle::withoutGlobalScopes()->create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $companyA,
            'name'         => 'Truck A-101',
            'plate_number' => 'MH-12-AB-1234',
        ]);

        $driverUser = new User([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $companyA,
            'name'         => 'Driver A-Rajesh',
            'email'        => 'driver.rajesh@technofay.com',
            'phone'        => '9876543210',
            'status'       => 'active',
            'email_verified_at' => now(),
        ]);
        $driverUser->password = 'SecretPass123!';
        $driverUser->type = 'driver';
        $driverUser->save();

        Driver::withoutGlobalScopes()->create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $companyA,
            'user_uuid'    => $driverUser->uuid,
            'name'         => 'Driver A-Rajesh',
            'phone'        => '9876543210',
        ]);

        LrNumber::withoutGlobalScopes()->create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $companyA,
            'lr_number'    => 'LR-2026-001',
            'status'       => 'BOOKED',
        ]);

        // Scenario 1: Request with Company B header MUST NOT see Company A's records
        request()->headers->set('Company-Header', $companyB);
        $this->withHeader('Company-Header', $companyB);

        $vehiclesSeenByCompanyB = Vehicle::all();
        $driversSeenByCompanyB  = Driver::all();
        $lrsSeenByCompanyB      = LrNumber::all();

        $this->assertCount(0, $vehiclesSeenByCompanyB, 'Company B must see 0 vehicles belonging to Company A');
        $this->assertCount(0, $driversSeenByCompanyB, 'Company B must see 0 drivers belonging to Company A');
        $this->assertCount(0, $lrsSeenByCompanyB, 'Company B must see 0 LR numbers belonging to Company A');

        // Scenario 2: Request with Company A header MUST see Company A's records
        request()->headers->set('Company-Header', $companyA);
        $this->withHeader('Company-Header', $companyA);

        $vehiclesSeenByCompanyA = Vehicle::all();
        $driversSeenByCompanyA  = Driver::all();
        $lrsSeenByCompanyA      = LrNumber::all();

        $this->assertCount(1, $vehiclesSeenByCompanyA);
        $this->assertCount(1, $driversSeenByCompanyA);
        $this->assertCount(1, $lrsSeenByCompanyA);
        $this->assertEquals('Truck A-101', $vehiclesSeenByCompanyA->first()->name);
        $this->assertEquals('Driver A-Rajesh', $driversSeenByCompanyA->first()->name);
        $this->assertEquals('LR-2026-001', $lrsSeenByCompanyA->first()->lr_number);

        // Scenario 3: Request with NO company header from unauthenticated non-superadmin MUST NOT leak cross-company data
        request()->headers->remove('Company-Header');
        $this->flushHeaders();
        Auth::logout();

        $unscopedVehicles = Vehicle::all();
        $this->assertCount(0, $unscopedVehicles, 'Unscoped request without tenant context must return 0 records');
    }
}
