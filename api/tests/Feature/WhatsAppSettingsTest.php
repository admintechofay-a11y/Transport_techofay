<?php

namespace Tests\Feature;

use App\Http\Controllers\Internal\v1\WhatsAppSettingsController;
use App\Models\Contact;
use App\Models\LrNumber;
use App\Models\TransportSetting;
use App\Services\FakeWhatsAppAdapter;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class WhatsAppSettingsTest extends TestCase
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
            ['uuid' => $this->otherCompanyUuid, 'name' => 'Competitor Logistics', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);
    }

    protected function createTestTables(): void
    {
        Schema::dropIfExists('transport_settings');
        Schema::dropIfExists('lr_numbers');
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
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('name');
            $table->string('phone', 50)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('lr_numbers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->nullable()->index();
            $table->string('customer_uuid', 36)->nullable()->index();
            $table->string('lr_number', 50)->nullable();
            $table->string('from_location', 255)->nullable();
            $table->string('to_location', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('transport_settings', function (Blueprint $table) {
            $table->increments('id');
            $table->string('_key', 36)->nullable();
            $table->string('uuid', 36)->unique()->nullable();
            $table->string('public_id', 191)->nullable();
            $table->string('company_uuid', 36)->unique();
            $table->string('company_logo_url', 500)->nullable();
            $table->string('gstin', 20)->nullable();
            $table->text('company_address')->nullable();
            $table->string('company_phone', 50)->nullable();
            $table->string('company_email', 100)->nullable();
            $table->text('pdf_terms_conditions')->nullable();
            $table->string('signature_url', 500)->nullable();
            $table->json('custom_pdf_fields')->nullable();
            $table->json('whatsapp_settings')->nullable();
            $table->json('meta')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Test updating and retrieving WhatsApp configuration.
     */
    public function test_get_and_update_whatsapp_settings(): void
    {
        $controller = new WhatsAppSettingsController();

        // 1. Update settings
        $updateReq = Request::create('/int/v1/whatsapp/settings', 'POST', [
            'provider'            => 'interakt',
            'api_key'             => 'secret_key_interakt_9999',
            'from_number'         => '+919876543210',
            'is_whatsapp_enabled' => true,
            'templates'           => [
                'lr_template'    => 'Hello, LR #{lr_number} is generated.',
                'bilty_template' => 'Hello, Bilty #{bilty_number} is generated.',
            ],
        ]);
        $updateReq->headers->set('Company-Header', $this->companyUuid);

        $updateRes = $controller->updateSettings($updateReq);
        $this->assertEquals(200, $updateRes->getStatusCode());

        // Verify in database
        $setting = TransportSetting::where('company_uuid', $this->companyUuid)->first();
        $this->assertNotNull($setting);
        $this->assertEquals('interakt', $setting->whatsapp_settings['provider']);
        $this->assertEquals('+919876543210', $setting->whatsapp_settings['from_number']);
        $this->assertEquals('secret_key_interakt_9999', $setting->whatsapp_settings['api_key']);

        // 2. Retrieve settings and check masking
        $getReq = Request::create('/int/v1/whatsapp/settings', 'GET');
        $getReq->headers->set('Company-Header', $this->companyUuid);

        $getRes = $controller->getSettings($getReq);
        $this->assertEquals(200, $getRes->getStatusCode());
        $data = json_decode($getRes->getContent(), true);

        $this->assertEquals('interakt', $data['provider']);
        $this->assertEquals('+919876543210', $data['from_number']);
        $this->assertTrue($data['is_api_key_set']);
        $this->assertStringContainsString('***', $data['api_key_masked']);
        $this->assertStringEndsWith('9999', $data['api_key_masked']);
        $this->assertEquals('Hello, LR #{lr_number} is generated.', $data['templates']['lr_template']);
    }

    /**
     * Test WhatsApp configuration company isolation.
     */
    public function test_whatsapp_settings_company_isolation(): void
    {
        $controller = new WhatsAppSettingsController();

        // Company A configures settings
        $reqA = Request::create('/int/v1/whatsapp/settings', 'POST', [
            'provider'    => 'gupshup',
            'api_key'     => 'company_a_secret_key',
            'from_number' => '+919999911111',
        ]);
        $reqA->headers->set('Company-Header', $this->companyUuid);
        $controller->updateSettings($reqA);

        // Company B queries settings
        $reqB = Request::create('/int/v1/whatsapp/settings', 'GET');
        $reqB->headers->set('Company-Header', $this->otherCompanyUuid);
        $resB = $controller->getSettings($reqB);

        $dataB = json_decode($resB->getContent(), true);

        // Company B does NOT see Company A's key or phone
        $this->assertFalse($dataB['is_api_key_set']);
        $this->assertNotEquals('+919999911111', $dataB['from_number']);
    }

    /**
     * Test WhatsApp test connection and FakeWhatsAppAdapter dispatch.
     */
    public function test_whatsapp_test_connection_and_adapter_dispatch(): void
    {
        $service = new WhatsAppService(['provider' => 'fake']);
        $controller = new WhatsAppSettingsController();

        $testReq = Request::create('/int/v1/whatsapp/test', 'POST', [
            'phone'   => '+919876500000',
            'message' => 'Test dispatch verification',
        ]);
        $testReq->headers->set('Company-Header', $this->companyUuid);

        $testRes = $controller->testConnection($testReq, $service);
        $this->assertEquals(200, $testRes->getStatusCode());
        $data = json_decode($testRes->getContent(), true);

        $this->assertTrue($data['success']);
        $this->assertEquals('+919876500000', $data['result']['to']);

        // Verify FakeWhatsAppAdapter records sent messages
        $fakeAdapter = new FakeWhatsAppAdapter();
        $customRes = $fakeAdapter->sendCustomMessage('+919822233344', 'Direct adapter test');
        $this->assertEquals('success', $customRes['status']);
        $this->assertCount(1, $fakeAdapter->sentMessages);
        $this->assertEquals('Direct adapter test', $fakeAdapter->sentMessages[0]['message']);

        // Verify PDF dispatch on adapter
        $pdfRes = $fakeAdapter->sendPdf('+919822233344', 'https://api.technofay.com/pdf/test.pdf', 'LR Document', 'LR-1001.pdf');
        $this->assertEquals('success', $pdfRes['status']);
        $this->assertCount(2, $fakeAdapter->sentMessages);
        $this->assertEquals('pdf', $fakeAdapter->sentMessages[1]['type']);
    }
}
