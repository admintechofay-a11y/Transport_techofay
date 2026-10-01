<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseCheckCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'transport:db-check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify database health, connection, required tables, and critical columns for Transport Techofay';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('=== Transport Techofay Database Health Check ===');

        try {
            $connectionName = DB::getDefaultConnection();
            $driver = DB::connection()->getDriverName();
            $databaseName = DB::connection()->getDatabaseName();

            // Mask any sensitive path or connection string if present
            $safeDbName = basename($databaseName);
            $this->line("Connection: <info>{$connectionName}</info> (Driver: <comment>{$driver}</comment>, DB: <comment>{$safeDbName}</comment>)");
        } catch (\Throwable $e) {
            $this->error('[FAIL] Database connection failed: ' . $e->getMessage());
            return Command::FAILURE;
        }

        $tablesToCheck = [
            'users',
            'companies',
            'permissions',
            'roles',
            'custom_field_values',
            'drivers',
            'vehicles',
            'orders',
            'places',
            'entities',
            'waypoints',
            'payloads',
            'tracking_statuses',
            'contacts',
            'bilties',
            'lr_numbers',
            'vehicle_documents',
            'driver_documents',
            'freight_charges',
            'delivery_challans',
            'gate_passes',
            'transport_settings',
            'lr_sequences',
            'bilty_sequences',
            'audit_logs',
        ];

        $columnsToCheck = [
            'drivers' => ['uuid', 'company_uuid', 'vehicle_uuid', 'phone', 'status'],
            'vehicles' => ['uuid', 'company_uuid', 'plate_number', 'status'],
            'orders' => ['uuid', 'company_uuid', 'status'],
            'permissions' => ['id', 'name', 'guard_name'],
            'roles' => ['id', 'name', 'guard_name'],
            'custom_field_values' => ['id', 'subject_uuid', 'custom_field_uuid', 'value'],
            'bilties' => ['uuid', 'company_uuid', 'bilty_number'],
            'lr_numbers' => ['uuid', 'company_uuid', 'lr_number'],
            'transport_settings' => ['uuid', 'company_uuid'],
            'vehicle_documents' => ['uuid', 'company_uuid', 'vehicle_uuid', 'document_type'],
            'driver_documents' => ['uuid', 'company_uuid', 'driver_uuid', 'document_type'],
        ];

        $hasFailures = false;

        $this->newLine();
        $this->info('--- Required Tables ---');
        foreach ($tablesToCheck as $table) {
            if (Schema::hasTable($table)) {
                $count = DB::table($table)->count();
                $this->line("<info>[OK]</info> {$table} ({$count} records)");
            } else {
                $this->error("<error>[FAIL]</error> missing table: {$table}");
                $hasFailures = true;
            }
        }

        $this->newLine();
        $this->info('--- Critical Columns ---');
        foreach ($columnsToCheck as $table => $columns) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($columns as $column) {
                if (Schema::hasColumn($table, $column)) {
                    $this->line("<info>[OK]</info> {$table}.{$column}");
                } else {
                    $this->error("<error>[FAIL]</error> missing column: {$table}.{$column}");
                    $hasFailures = true;
                }
            }
        }

        $this->newLine();
        if ($hasFailures) {
            $this->error('=== Health Check Finished with Failures ===');
            return Command::FAILURE;
        }

        $this->info('=== All Database Health Checks Passed Successfully ===');
        return Command::SUCCESS;
    }
}
