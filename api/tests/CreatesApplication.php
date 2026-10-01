<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;

trait CreatesApplication
{
    /**
     * Creates the application.
     *
     * @return \Illuminate\Foundation\Application
     */
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', storage_path('testing.sqlite'));
        $app['config']->set('fleetbase.connection.db', 'sqlite');
        $app['config']->set('responsecache.enabled', false);
        $app['config']->set('activitylog.enabled', false);

        return $app;
    }
}
