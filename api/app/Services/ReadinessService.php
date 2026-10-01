<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

class ReadinessService
{
    /**
     * Check status of all system components.
     */
    public function check(): array
    {
        $db = $this->checkDatabase();
        $cache = $this->checkCache();
        $queue = $this->checkQueue();
        $storage = $this->checkStorage();

        $isReady = ($db['status'] === 'healthy')
            && ($cache['status'] === 'healthy')
            && ($queue['status'] === 'healthy')
            && ($storage['status'] === 'healthy');

        return [
            'status'    => $isReady ? 'ready' : 'not_ready',
            'services'  => [
                'database' => $db,
                'redis'    => $cache,
                'queue'    => $queue,
                'storage'  => $storage,
            ],
            'timestamp' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Verify database connection and measure latency.
     */
    protected function checkDatabase(): array
    {
        $start = microtime(true);
        try {
            DB::connection()->getPdo();
            DB::select('SELECT 1');
            $latency = round((microtime(true) - $start) * 1000, 2);

            return [
                'status'     => 'healthy',
                'connection' => DB::connection()->getDriverName(),
                'latency_ms' => $latency,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'unhealthy',
                'error'  => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify Redis / Cache store.
     */
    protected function checkCache(): array
    {
        try {
            $key = 'readiness_probe_' . uniqid();
            Cache::put($key, 'ok', 5);
            $val = Cache::get($key);
            Cache::forget($key);

            if ($val !== 'ok') {
                return [
                    'status' => 'unhealthy',
                    'error'  => 'Cache read/write verification failed.',
                ];
            }

            return [
                'status' => 'healthy',
                'driver' => config('cache.default'),
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'unhealthy',
                'error'  => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify Queue connectivity and count pending jobs.
     */
    protected function checkQueue(): array
    {
        try {
            $queueConnection = Queue::connection();
            $size = method_exists($queueConnection, 'size') ? $queueConnection->size() : 0;

            return [
                'status'       => 'healthy',
                'connection'   => config('queue.default'),
                'pending_jobs' => $size,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'unhealthy',
                'error'  => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify filesystem storage permissions.
     */
    protected function checkStorage(): array
    {
        $storagePath = storage_path('framework/cache');
        $isWritable = is_writable(storage_path()) || is_writable($storagePath);

        return [
            'status'   => $isWritable ? 'healthy' : 'unhealthy',
            'writable' => $isWritable,
        ];
    }
}
