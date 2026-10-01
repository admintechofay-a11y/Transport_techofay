<?php

return [
    'api' => [
        'version' => 'v1',
        'routing' => [
            'prefix' => env('API_PREFIX'),
            'internal_prefix' => env('INTERNAL_API_PREFIX', 'int'),
        ],
    ],
    'connection' => [
        'db' => env('DB_CONNECTION', 'sqlite'),
        'sandbox' => env('SANDBOX_DB_CONNECTION', 'sandbox'),
    ],
    'version' => env('FLEETBASE_VERSION', '1.0.0'),
];
