<?php

namespace App\Support;

/**
 * Small local-only Redis substitute for development machines without ext-redis.
 */
class LocalRedisManager
{
    /** @var array<string, mixed> */
    private array $values = [];

    public function connection(?string $name = null): self
    {
        return $this;
    }

    public function exists(string $key): bool
    {
        return array_key_exists($key, $this->values);
    }

    public function get(string $key): mixed
    {
        return $this->values[$key] ?? null;
    }

    public function set(string $key, mixed $value, mixed ...$options): string
    {
        $this->values[$key] = $value;

        return 'OK';
    }

    public function del(string|array ...$keys): int
    {
        $deleted = 0;
        foreach ($keys as $keyGroup) {
            foreach ((array) $keyGroup as $key) {
                if (array_key_exists($key, $this->values)) {
                    unset($this->values[$key]);
                    $deleted++;
                }
            }
        }

        return $deleted;
    }

    public function forget(string $key): bool
    {
        return $this->del($key) > 0;
    }

    public function __call(string $method, array $parameters): mixed
    {
        return match (strtolower($method)) {
            'flushdb', 'flushall' => $this->flush(),
            'expire', 'pexpire' => 1,
            'publish' => 0,
            default => null,
        };
    }

    private function flush(): string
    {
        $this->values = [];

        return 'OK';
    }
}
