<?php

return [
    'enabled'       => env('WHATSAPP_ENABLED', false),
    'provider'      => env('WHATSAPP_PROVIDER', 'twilio'), // twilio|gupshup|360dialog|interakt
    'api_key'       => env('WHATSAPP_API_KEY'),
    'api_secret'    => env('WHATSAPP_API_SECRET'),
    'from_number'   => env('WHATSAPP_FROM_NUMBER'),
    'base_url'      => env('WHATSAPP_BASE_URL'),
    'templates'     => [
        'lr_generated'       => env('WHATSAPP_TPL_LR_GENERATED', 'lr_generated'),
        'vehicle_assigned'   => env('WHATSAPP_TPL_VEHICLE_ASSIGNED', 'vehicle_assigned'),
        'dispatched'         => env('WHATSAPP_TPL_DISPATCHED', 'dispatched'),
        'in_transit'         => env('WHATSAPP_TPL_IN_TRANSIT', 'in_transit'),
        'delivered'          => env('WHATSAPP_TPL_DELIVERED', 'delivered'),
        'custom_message'     => env('WHATSAPP_TPL_CUSTOM', 'custom_message'),
    ],
];
