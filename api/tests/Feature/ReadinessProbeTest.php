<?php

namespace Tests\Feature;

use App\Providers\RouteServiceProvider;
use App\Services\ReadinessService;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReadinessProbeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'responsecache.enabled' => false,
            'cache.default' => 'array',
            'queue.default' => 'sync',
            'app.key' => 'base64:' . base64_encode('technofay-production-test-key-32'),
        ]);

        $fakeCache = new class {
            public function clear(array $tags = []): void {}
        };
        app()->instance('responsecache', $fakeCache);
        \Illuminate\Support\Facades\Facade::clearResolvedInstance('responsecache');
    }

    public function test_readiness_probe_returns_ready_status_when_services_healthy(): void
    {
        (new RouteServiceProvider($this->app))->boot();

        $response = $this->getJson('/ready');

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'ready');
        $response->assertJsonPath('services.database.status', 'healthy');
        $response->assertJsonPath('services.redis.status', 'healthy');
        $response->assertJsonPath('services.queue.status', 'healthy');
        $response->assertJsonPath('services.storage.status', 'healthy');
        $response->assertJsonStructure([
            'status',
            'services' => [
                'database' => ['status', 'connection', 'latency_ms'],
                'redis'    => ['status', 'driver'],
                'queue'    => ['status', 'connection', 'pending_jobs'],
                'storage'  => ['status', 'writable'],
            ],
            'timestamp',
        ]);
    }

    public function test_readiness_probe_available_under_api_and_internal_prefixes(): void
    {
        (new RouteServiceProvider($this->app))->boot();

        $apiRes = $this->getJson('/api/v1/ready');
        $apiRes->assertStatus(200);
        $apiRes->assertJsonPath('status', 'ready');

        $intRes = $this->getJson('/int/v1/ready');
        $intRes->assertStatus(200);
        $intRes->assertJsonPath('status', 'ready');
    }

    public function test_readiness_probe_returns_503_when_service_unhealthy(): void
    {
        // Mock a degraded readiness service where database is down
        $mockService = new class extends ReadinessService {
            public function check(): array
            {
                $report = parent::check();
                $report['status'] = 'not_ready';
                $report['services']['database'] = [
                    'status' => 'unhealthy',
                    'error'  => 'Connection refused: could not connect to MySQL server',
                ];
                return $report;
            }
        };

        $this->app->instance(ReadinessService::class, $mockService);
        (new RouteServiceProvider($this->app))->boot();

        $response = $this->getJson('/ready');

        $response->assertStatus(503);
        $response->assertJsonPath('status', 'not_ready');
        $response->assertJsonPath('services.database.status', 'unhealthy');
    }
}
