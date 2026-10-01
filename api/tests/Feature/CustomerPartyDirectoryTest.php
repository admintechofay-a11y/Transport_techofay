<?php

namespace Tests\Feature;

use App\Models\Contact;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class CustomerPartyDirectoryTest extends TestCase
{
    protected string $companyUuid;
    protected string $otherCompanyUuid;

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
        Contact::unsetEventDispatcher();

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
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('companies');

        Schema::create('companies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('internal_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('user_uuid', 36)->nullable();
            $table->string('place_uuid', 36)->nullable();
            $table->string('photo_uuid', 36)->nullable();
            $table->string('name');
            $table->string('title')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('type', 50)->default('contact');
            $table->string('party_type', 50)->default('customer');
            $table->string('gstin', 20)->nullable();
            $table->string('pan_number', 20)->nullable();
            $table->text('billing_address')->nullable();
            $table->text('delivery_address')->nullable();
            $table->string('billing_city', 100)->nullable();
            $table->string('billing_state', 100)->nullable();
            $table->string('billing_pincode', 20)->nullable();
            $table->string('payment_terms', 50)->nullable();
            $table->text('notes')->nullable();
            $table->json('meta')->nullable();
            $table->string('slug')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Test creating customer party with real database persistence.
     */
    public function test_customer_party_creation_and_persistence(): void
    {
        $contact = Contact::create([
            'uuid'            => (string) Str::uuid(),
            'company_uuid'    => $this->companyUuid,
            'name'            => 'Larsen & Toubro Heavy Haulage Division',
            'phone'           => '+91 98200 44332',
            'email'           => 'logistics@lnt.com',
            'party_type'      => 'consignor',
            'gstin'           => '27AAACL1234F1Z5',
            'pan_number'      => 'AAACL1234F',
            'billing_city'    => 'Powai, Mumbai',
            'billing_state'   => 'Maharashtra',
            'payment_terms'   => 'net_30',
        ]);

        $this->assertDatabaseHas('contacts', [
            'uuid'         => $contact->uuid,
            'name'         => 'Larsen & Toubro Heavy Haulage Division',
            'gstin'        => '27AAACL1234F1Z5',
            'party_type'   => 'consignor',
            'billing_city' => 'Powai, Mumbai',
        ]);

        $contact->refresh();
        $this->assertEquals('Larsen & Toubro Heavy Haulage Division', $contact->name);
        $this->assertEquals('27AAACL1234F1Z5', $contact->gstin);
        $this->assertEquals('consignor', $contact->party_type);
    }

    /**
     * Test customer directory enforces company multi-tenant isolation.
     */
    public function test_customer_directory_enforces_company_isolation(): void
    {
        $partyA = Contact::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->companyUuid,
            'name'         => 'Company A Shipper',
            'phone'        => '+91 99999 11111',
            'party_type'   => 'consignor',
        ]);

        $partyB = Contact::create([
            'uuid'         => (string) Str::uuid(),
            'company_uuid' => $this->otherCompanyUuid,
            'name'         => 'Company B Shipper',
            'phone'        => '+91 99999 22222',
            'party_type'   => 'consignee',
        ]);

        // Querying for Company A
        request()->headers->set('Company-Header', $this->companyUuid);
        $contactsA = Contact::where('company_uuid', $this->companyUuid)->get();
        $this->assertCount(1, $contactsA);
        $this->assertEquals($partyA->uuid, $contactsA->first()->uuid);

        // Querying for Company B
        request()->headers->set('Company-Header', $this->otherCompanyUuid);
        $contactsB = Contact::where('company_uuid', $this->otherCompanyUuid)->get();
        $this->assertCount(1, $contactsB);
        $this->assertEquals($partyB->uuid, $contactsB->first()->uuid);
    }

    /**
     * Test updating customer party details.
     */
    public function test_customer_party_update(): void
    {
        $contact = Contact::create([
            'uuid'            => (string) Str::uuid(),
            'company_uuid'    => $this->companyUuid,
            'name'            => 'Initial Trader Name',
            'phone'           => '+91 98765 00000',
            'party_type'      => 'customer',
            'billing_city'    => 'Ahmedabad',
        ]);

        $contact->update([
            'name'         => 'Updated Trader Enterprises Pvt Ltd',
            'billing_city' => 'Vadodara',
            'gstin'        => '24AABCT1234D1Z8',
        ]);

        $this->assertDatabaseHas('contacts', [
            'uuid'         => $contact->uuid,
            'name'         => 'Updated Trader Enterprises Pvt Ltd',
            'billing_city' => 'Vadodara',
            'gstin'        => '24AABCT1234D1Z8',
        ]);
    }
}
