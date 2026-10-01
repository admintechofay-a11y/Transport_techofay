<?php

namespace App\Providers;

use Illuminate\Database\Connection;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Database\Events\TransactionBeginning;
use Illuminate\Database\Events\TransactionCommitting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Psr\Http\Message\RequestInterface;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Ring buffer of recent statements, kept only while the transaction tripwire is armed.
     *
     * @var array<int, string>
     */
    protected static array $recentStatements = [];

    /**
     * Whether a divergence has already been reported on this worker pass.
     */
    protected static bool $divergenceReported = false;

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        $this->configureSqliteSpatialPolyfills();
        $this->configureOutboundHttpLogging();
        $this->configureTransactionTripwire();
    }

    /**
     * Polyfill MySQL spatial geometry functions for SQLite connections.
     */
    protected function configureSqliteSpatialPolyfills(): void
    {
        try {
            $register = function ($pdo) {
                if ($pdo && method_exists($pdo, 'sqliteCreateFunction')) {
                    $pdo->sqliteCreateFunction('ST_GeomFromText', fn($wkt, $srid = null) => $wkt);
                    $pdo->sqliteCreateFunction('ST_PointFromText', fn($wkt, $srid = null) => $wkt);
                    $pdo->sqliteCreateFunction('ST_AsText', fn($geom) => $geom);
                    $pdo->sqliteCreateFunction('ST_X', fn($geom) => 0);
                    $pdo->sqliteCreateFunction('ST_Y', fn($geom) => 0);
                    $pdo->sqliteCreateFunction('ST_Distance_Sphere', fn($a, $b) => 0);
                    $pdo->sqliteCreateFunction('ST_Contains', fn($a, $b) => 1);
                    $pdo->sqliteCreateFunction('ST_Within', fn($a, $b) => 1);
                    $pdo->sqliteCreateFunction('DATE_FORMAT', function ($date, $format) {
                        if (!$date) return null;
                        $time = strtotime($date);
                        if ($time === false) return null;
                        $phpFormat = str_replace(
                            ['%Y', '%y', '%m', '%d', '%H', '%i', '%s', '%M', '%b', '%D'],
                            ['Y',  'y',  'm',  'd',  'H',  'i',  's',  'F',  'M',  'jS'],
                            $format
                        );
                        return date($phpFormat, $time);
                    });
                    $pdo->sqliteCreateFunction('NOW', fn() => date('Y-m-d H:i:s'));
                    $pdo->sqliteCreateFunction('CONCAT', fn(...$args) => implode('', $args));
                    $pdo->sqliteCreateFunction('UNIX_TIMESTAMP', fn($d = null) => $d ? strtotime($d) : time());
                    $pdo->sqliteCreateFunction('UUID', fn() => (string) Str::uuid());
                    $pdo->sqliteCreateFunction('JSON_UNQUOTE', fn($v) => is_string($v) ? trim($v, '"') : $v);
                    $pdo->sqliteCreateFunction('SUBSTRING_INDEX', function ($str, $delim, $count) {
                        if ($str === null || $delim === null || $count === null) {
                            return null;
                        }
                        $delim = (string) $delim;
                        if ($delim === '') {
                            return '';
                        }
                        $parts = explode($delim, (string) $str);
                        $count = (int) $count;
                        if ($count === 0) {
                            return '';
                        }
                        if ($count > 0) {
                            return implode($delim, array_slice($parts, 0, $count));
                        }
                        return implode($delim, array_slice($parts, $count));
                    });
                }
            };

            $setupConnection = function ($connection) use ($register) {
                if ($connection->getDriverName() === 'sqlite') {
                    $register($connection->getPdo());
                    try {
                        $connection->getPdo()->exec('PRAGMA foreign_keys = OFF;');
                    } catch (\Throwable $e) {}
                    $connection->setSchemaGrammar(new class extends \Illuminate\Database\Schema\Grammars\SQLiteGrammar {
                        public function compileSpatialIndex(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                        {
                            return null;
                        }

                        public function wrapTable($table)
                        {
                            if ($this->isExpression($table)) {
                                $val = (string) $this->getValue($table);
                                if (str_contains($val, '.')) {
                                    $parts = explode('.', $val);
                                    $tableName = end($parts);
                                    return parent::wrapTable($tableName);
                                }
                                return $val;
                            }

                            if (is_string($table) && str_contains($table, '.')) {
                                $parts = explode('.', $table);
                                $tableName = end($parts);
                                return parent::wrapTable($tableName);
                            }

                            return parent::wrapTable($table);
                        }

                        public function compileCreate(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                        {
                            return sprintf('%s table if not exists %s (%s%s%s)',
                                $blueprint->temporary ? 'create temporary' : 'create',
                                $this->wrapTable($blueprint),
                                implode(', ', $this->getColumns($blueprint)),
                                (string) $this->addForeignKeys($blueprint),
                                (string) $this->addPrimaryKeys($blueprint)
                            );
                        }

                        public function compileUnique(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                        {
                            return sprintf('create unique index if not exists %s on %s (%s)',
                                $this->wrap($command->index),
                                $this->wrapTable($blueprint),
                                $this->columnize($command->columns)
                            );
                        }

                        public function compileIndex(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                        {
                            return sprintf('create index if not exists %s on %s (%s)',
                                $this->wrap($command->index),
                                $this->wrapTable($blueprint),
                                $this->columnize($command->columns)
                            );
                        }

                        public function compileDropIndex(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                        {
                            $index = $this->wrap($command->index);
                            return "drop index if exists {$index}";
                        }

                        public function compileDropUnique(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                        {
                            $index = $this->wrap($command->index);
                            return "drop index if exists {$index}";
                        }

                        public function compileDropSpatialIndex(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                        {
                            return null;
                        }

                        public function compileRenameColumn(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command, \Illuminate\Database\Connection $connection)
                        {
                            $tableName = $this->wrapTable($blueprint);
                            $cleanTableName = trim($tableName, '"\'`');
                            $fromCol = trim($this->wrap($command->from), '"\'`');
                            $toCol = trim($this->wrap($command->to), '"\'`');

                            try {
                                $pdo = $connection->getPdo();
                                if ($pdo) {
                                    $stmt = $pdo->query("PRAGMA table_info('{$cleanTableName}')");
                                    if ($stmt) {
                                        $cols = array_map(fn($c) => strtolower($c['name']), $stmt->fetchAll(\PDO::FETCH_ASSOC));
                                        if (!in_array(strtolower($fromCol), $cols, true) || in_array(strtolower($toCol), $cols, true)) {
                                            return null;
                                        }
                                    }
                                }
                            } catch (\Throwable $e) {}

                            return $connection->usingNativeSchemaOperations()
                                ? sprintf('alter table %s rename column %s to %s',
                                    $this->wrapTable($blueprint),
                                    $this->wrap($command->from),
                                    $this->wrap($command->to)
                                )
                                : parent::compileRenameColumn($blueprint, $command, $connection);
                        }

                        public function compileAdd(\Illuminate\Database\Schema\Blueprint $blueprint, \Illuminate\Support\Fluent $command)
                        {
                            $tableName = $this->wrapTable($blueprint);
                            $cleanTableName = trim($tableName, '"\'`');
                            $existingCols = [];
                            try {
                                $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
                                if ($pdo) {
                                    $stmt = $pdo->query("PRAGMA table_info('{$cleanTableName}')");
                                    if ($stmt) {
                                        $cols = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                                        $existingCols = array_map(fn($c) => strtolower($c['name']), $cols);
                                    }
                                }
                            } catch (\Throwable $e) {}

                            $columns = $this->prefixArray('add column', $this->getColumns($blueprint));

                            return collect($columns)->reject(function ($column) use ($existingCols) {
                                if (preg_match('/as \(.*\) stored/', $column) > 0) {
                                    return true;
                                }
                                if (preg_match('/add column\s+["`]?([a-zA-Z0-9_]+)["`]?/i', $column, $m)) {
                                    $colName = strtolower($m[1]);
                                    if (in_array($colName, $existingCols, true)) {
                                        return true;
                                    }
                                }
                                return false;
                            })->map(function ($column) use ($blueprint) {
                                return 'alter table '.$this->wrapTable($blueprint).' '.$column;
                            })->all();
                        }
                    });
                    try {
                        $platform = $connection->getDoctrineConnection()->getDatabasePlatform();
                        $platform->registerDoctrineTypeMapping('string', 'string');
                        $platform->registerDoctrineTypeMapping('point', 'string');
                        $platform->registerDoctrineTypeMapping('geometry', 'string');
                        $platform->registerDoctrineTypeMapping('enum', 'string');
                    } catch (\Throwable $t) {
                    }
                }
            };

            Event::listen(\Illuminate\Database\Events\ConnectionEstablished::class, function ($event) use ($setupConnection) {
                $setupConnection($event->connection);
            });

            if (DB::connection()->getDriverName() === 'sqlite') {
                $setupConnection(DB::connection());
            }

            Log::debug('[db:connection:health]', [
                'default'  => config('database.default'),
                'driver'   => DB::connection()->getDriverName(),
                'database' => DB::connection()->getDatabaseName(),
            ]);
        } catch (\Throwable $e) {
            // Database connection may not be resolved yet
        }
    }

    /**
     * Detect the moment Laravel's transaction counter stops agreeing with the MySQL session.
     *
     * Laravel decides whether to issue a COMMIT from its own integer counter
     * (ManagesTransactions::commit(), and the inline twin inside transaction()),
     * while PDO decides whether a COMMIT is legal from the server's
     * SERVER_STATUS_IN_TRANS flag. If anything ends the server-side transaction
     * without going through the Connection - an implicit commit from DDL, or a
     * second PDO handle aliasing the same persistent MySQL session - the counter
     * keeps saying "1". Every statement issued since BEGIN is then already
     * durable, and the eventual commit throws "There is no active transaction",
     * so the caller reports failure for a write that landed.
     *
     * This logs the divergence at the statement that caused it, which is the
     * only place the culprit is still identifiable.
     */
    protected function configureTransactionTripwire(): void
    {
        if (!env('DB_TXN_TRIPWIRE_ENABLED', false)) {
            return;
        }

        // One report per transaction, not one per worker: a worker serves up to
        // --max-requests before it recycles, and a single latched flag would hide
        // every occurrence after the first.
        Event::listen(TransactionBeginning::class, function (TransactionBeginning $event) {
            if ($event->connection->transactionLevel() === 1) {
                static::$divergenceReported = false;
            }
        });

        DB::listen(function (QueryExecuted $query) {
            $this->recordStatement($query->sql);

            if ($query->connection->transactionLevel() < 1) {
                return;
            }

            $pdo = $query->connection->getRawPdo();

            if (!$pdo instanceof \PDO || $pdo->inTransaction()) {
                return;
            }

            $this->reportTransactionDivergence($query->connection, 'after-statement', $query->sql);
        });

        // Backstop: the divergence may be caused by something we never see as a
        // query of ours (another PDO handle on the same session). This catches it
        // immediately before the doomed COMMIT.
        Event::listen(TransactionCommitting::class, function (TransactionCommitting $event) {
            $pdo = $event->connection->getRawPdo();

            if ($pdo instanceof \PDO && !$pdo->inTransaction()) {
                $this->reportTransactionDivergence($event->connection, 'at-commit', null);
            }
        });
    }

    protected function recordStatement(string $sql): void
    {
        static::$recentStatements[] = Str::limit(preg_replace('/\s+/', ' ', $sql), 200);

        if (count(static::$recentStatements) > 25) {
            array_shift(static::$recentStatements);
        }
    }

    protected function reportTransactionDivergence(Connection $connection, string $phase, ?string $sql): void
    {
        // One report per worker pass. Re-entrancy guard as well: the CONNECTION_ID()
        // lookup below is itself a query and would otherwise trip the listener.
        if (static::$divergenceReported) {
            return;
        }

        static::$divergenceReported = true;

        $pdo = $connection->getRawPdo();

        try {
            $mysqlConnectionId = $pdo instanceof \PDO
                ? $pdo->query('SELECT CONNECTION_ID()')->fetchColumn()
                : null;
        } catch (\Throwable $e) {
            $mysqlConnectionId = 'unavailable: ' . $e->getMessage();
        }

        Log::error('[db:txn:divergence] transaction ended outside the Connection', [
            'phase'               => $phase,
            'statement'           => $sql === null ? null : Str::limit(preg_replace('/\s+/', ' ', $sql), 300),
            'connection'          => $connection->getName(),
            'transaction_level'   => $connection->transactionLevel(),
            'pdo_object_id'       => $pdo instanceof \PDO ? spl_object_id($pdo) : null,
            'connection_object_id'=> spl_object_id($connection),
            'mysql_connection_id' => $mysqlConnectionId,
            'recent_statements'   => static::$recentStatements,
            'trace'               => $this->applicationTrace(),
        ]);
    }

    protected function applicationTrace(): array
    {
        return collect(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 60))
            ->map(fn ($frame) => ($frame['file'] ?? '?') . ':' . ($frame['line'] ?? '?'))
            ->values()
            ->all();
    }

    protected function configureOutboundHttpLogging(): void
    {
        if (!env('HTTP_CLIENT_TRACE_ENABLED', false)) {
            return;
        }

        Http::globalMiddleware(function (callable $handler) {
            return function (RequestInterface $request, array $options) use ($handler) {
                $id      = (string) Str::uuid();
                $started = microtime(true);

                Log::info('[http:out:start]', [
                    'id'              => $id,
                    'method'          => $request->getMethod(),
                    'url'             => $this->redactOutboundHttpUrl((string) $request->getUri()),
                    'timeout'         => $options['timeout'] ?? null,
                    'connect_timeout' => $options['connect_timeout'] ?? null,
                    'trace'           => $this->outboundHttpTrace(),
                ]);

                return $handler($request, $options)->then(
                    function ($response) use ($id, $started) {
                        Log::info('[http:out:finish]', [
                            'id'         => $id,
                            'status'     => $response->getStatusCode(),
                            'elapsed_ms' => $this->elapsedMilliseconds($started),
                        ]);

                        return $response;
                    },
                    function ($reason) use ($id, $started) {
                        Log::warning('[http:out:error]', [
                            'id'         => $id,
                            'elapsed_ms' => $this->elapsedMilliseconds($started),
                            'error'      => $reason instanceof \Throwable ? $reason->getMessage() : (string) $reason,
                        ]);

                        if ($reason instanceof \Throwable) {
                            throw $reason;
                        }

                        throw new \RuntimeException((string) $reason);
                    }
                );
            };
        });
    }

    protected function redactOutboundHttpUrl(string $url): string
    {
        return preg_replace('/([?&](?:token|access_token|api_key|apikey|key|secret|signature)=)[^&#]*/i', '$1[redacted]', $url) ?? $url;
    }

    protected function outboundHttpTrace(): array
    {
        return collect(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 20))
            ->filter(function ($frame) {
                $file = $frame['file'] ?? null;

                return $file && !str_contains($file, '/vendor/');
            })
            ->map(fn ($frame) => $frame['file'] . ':' . ($frame['line'] ?? '?'))
            ->values()
            ->take(8)
            ->all();
    }

    protected function elapsedMilliseconds(float $started): int
    {
        return (int) ((microtime(true) - $started) * 1000);
    }
}
