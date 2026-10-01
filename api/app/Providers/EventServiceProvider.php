<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        \App\Models\Order::observe(\App\Observers\TransportAuditObserver::class);
        \App\Models\LrNumber::observe(\App\Observers\TransportAuditObserver::class);
        \App\Models\Bilty::observe(\App\Observers\TransportAuditObserver::class);
        \App\Models\DeliveryChallan::observe(\App\Observers\TransportAuditObserver::class);
        \App\Models\GatePass::observe(\App\Observers\TransportAuditObserver::class);
        \App\Models\Proof::observe(\App\Observers\TransportAuditObserver::class);
        \App\Models\FreightCharge::observe(\App\Observers\TransportAuditObserver::class);
    }
}
