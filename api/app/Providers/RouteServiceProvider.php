<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Where to send an already-authenticated request that hits a guest-only route.
     *
     * App\Http\Middleware\RedirectIfAuthenticated (the `guest` alias in
     * App\Http\Kernel) redirects to this constant. It was dropped when the stock
     * Laravel provider was replaced, so the alias would fatal with "Undefined
     * constant" the moment any route actually used it. No route does today,
     * which is why nothing caught it — the console is served separately, so the
     * only sensible in-app target is the API root.
     */
    public const HOME = '/';

    /**
     * Define your route model bindings, pattern filters, etc.
     *
     * @return void
     */
    public function boot()
    {
        $this->routes(
            function () {
                Route::get(
                    '/health',
                    function (Request $request) {
                        return response()->json(
                            [
                                'status' => 'ok',
                                'time' => microtime(true) - $request->attributes->get('request_start_time')
                            ]
                        );
                    }
                );

                Route::get('/ready', [\App\Http\Controllers\Internal\v1\ReadinessController::class, 'check']);
                Route::get('/api/v1/ready', [\App\Http\Controllers\Internal\v1\ReadinessController::class, 'check']);
                Route::get('/int/v1/ready', [\App\Http\Controllers\Internal\v1\ReadinessController::class, 'check']);

                Route::get('/verify/{token}', [\App\Http\Controllers\Public\v1\PublicVerificationController::class, 'verify']);
                Route::get('/api/v1/verify/{token}', [\App\Http\Controllers\Public\v1\PublicVerificationController::class, 'verify']);
                Route::get('/int/v1/verify/{token}', [\App\Http\Controllers\Public\v1\PublicVerificationController::class, 'verify']);

                $registerAuthRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::post('/login', [\App\Http\Controllers\Internal\v1\AuthController::class, 'login']);
                        Route::post('/sign-up', [\App\Http\Controllers\Internal\v1\AuthController::class, 'signUp']);
                        Route::get('/session', [\App\Http\Controllers\Internal\v1\AuthController::class, 'session']);
                    });
                };

                $registerAuthRoutes('v1/auth');
                $registerAuthRoutes('api/v1/auth');
                $registerAuthRoutes('int/v1/auth');

                $registerDriverTripRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::get('/', [\App\Http\Controllers\Internal\v1\DriverTripController::class, 'trips']);
                        Route::get('/{id}', [\App\Http\Controllers\Internal\v1\DriverTripController::class, 'tripDetails']);
                        Route::post('/{id}/accept', [\App\Http\Controllers\Internal\v1\DriverTripController::class, 'acceptTrip']);
                        Route::post('/{id}/start', [\App\Http\Controllers\Internal\v1\DriverTripController::class, 'startTrip']);
                        Route::post('/{id}/start-stop', [\App\Http\Controllers\Internal\v1\DriverTripController::class, 'startStop']);
                        Route::post('/{id}/complete-stop', [\App\Http\Controllers\Internal\v1\DriverTripController::class, 'completeStop']);
                        Route::post('/{id}/complete', [\App\Http\Controllers\Internal\v1\DriverTripController::class, 'completeTrip']);
                    });
                };

                $registerDriverTripRoutes('v1/driver/trips');
                $registerDriverTripRoutes('api/v1/driver/trips');
                $registerDriverTripRoutes('int/v1/driver/trips');

                $registerFreightChargeRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::get('/', [\App\Http\Controllers\Internal\v1\FreightChargeController::class, 'index']);
                        Route::post('/', [\App\Http\Controllers\Internal\v1\FreightChargeController::class, 'store']);
                        Route::post('/calculate', [\App\Http\Controllers\Internal\v1\FreightChargeController::class, 'calculate']);
                        Route::get('/{id}', [\App\Http\Controllers\Internal\v1\FreightChargeController::class, 'show']);
                        Route::put('/{id}', [\App\Http\Controllers\Internal\v1\FreightChargeController::class, 'update']);
                        Route::delete('/{id}', [\App\Http\Controllers\Internal\v1\FreightChargeController::class, 'destroy']);
                        Route::post('/{id}/record-payment', [\App\Http\Controllers\Internal\v1\FreightChargeController::class, 'recordPayment']);
                        Route::get('/{id}/statement-pdf', [\App\Http\Controllers\Internal\v1\FreightChargeController::class, 'generateFreightStatement']);
                        Route::get('/{id}/invoice-pdf', [\App\Http\Controllers\Internal\v1\FreightChargeController::class, 'invoicePdf']);
                    });
                };

                $registerFreightChargeRoutes('v1/freight-charges');
                $registerFreightChargeRoutes('api/v1/freight-charges');
                $registerFreightChargeRoutes('int/v1/freight-charges');

                Route::get('/int/v1/customers/{customerUuid}/statement', [\App\Http\Controllers\Internal\v1\CustomerStatementController::class, 'statement']);
                Route::get('/v1/customers/{customerUuid}/statement', [\App\Http\Controllers\Internal\v1\CustomerStatementController::class, 'statement']);

                $registerWhatsAppRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::get('settings', [\App\Http\Controllers\Internal\v1\WhatsAppSettingsController::class, 'getSettings']);
                        Route::post('settings', [\App\Http\Controllers\Internal\v1\WhatsAppSettingsController::class, 'updateSettings']);
                        Route::post('test', [\App\Http\Controllers\Internal\v1\WhatsAppSettingsController::class, 'testConnection']);
                        Route::get('templates', [\App\Http\Controllers\Internal\v1\WhatsAppSettingsController::class, 'getTemplates']);
                        Route::post('templates', [\App\Http\Controllers\Internal\v1\WhatsAppSettingsController::class, 'updateTemplates']);
                    });
                };

                $registerWhatsAppRoutes('v1/whatsapp');
                $registerWhatsAppRoutes('api/v1/whatsapp');
                $registerWhatsAppRoutes('int/v1/whatsapp');

                $registerAuditRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::get('/', [\App\Http\Controllers\Internal\v1\AuditLogController::class, 'index']);
                        Route::get('/{id}', [\App\Http\Controllers\Internal\v1\AuditLogController::class, 'show']);
                    });
                };

                $registerAuditRoutes('v1/audit-logs');
                $registerAuditRoutes('api/v1/audit-logs');
                $registerAuditRoutes('int/v1/audit-logs');

                $registerTelemetryRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::post('/', [\App\Http\Controllers\Internal\v1\TelemetryController::class, 'ingest']);
                        Route::get('/latest', [\App\Http\Controllers\Internal\v1\TelemetryController::class, 'latest']);
                    });
                };

                $registerTelemetryRoutes('v1/telemetry');
                $registerTelemetryRoutes('api/v1/telemetry');
                $registerTelemetryRoutes('int/v1/telemetry');

                $registerGatePassRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::get('/', [\App\Http\Controllers\Internal\v1\GatePassController::class, 'index']);
                        Route::post('/', [\App\Http\Controllers\Internal\v1\GatePassController::class, 'store']);
                        Route::post('/verify', [\App\Http\Controllers\Internal\v1\GatePassController::class, 'verifyQrToken']);
                        Route::get('/{id}', [\App\Http\Controllers\Internal\v1\GatePassController::class, 'show']);
                        Route::post('/{id}/exit', [\App\Http\Controllers\Internal\v1\GatePassController::class, 'recordExit']);
                        Route::delete('/{id}', [\App\Http\Controllers\Internal\v1\GatePassController::class, 'destroy']);
                        Route::get('/{id}/pdf', [\App\Http\Controllers\Internal\v1\GatePassController::class, 'generatePdf']);
                    });
                };

                $registerGatePassRoutes('v1/gate-passes');
                $registerGatePassRoutes('api/v1/gate-passes');
                $registerGatePassRoutes('int/v1/gate-passes');

                $registerChallanRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::get('/', [\App\Http\Controllers\Internal\v1\DeliveryChallanController::class, 'index']);
                        Route::post('/', [\App\Http\Controllers\Internal\v1\DeliveryChallanController::class, 'store']);
                        Route::get('/{id}', [\App\Http\Controllers\Internal\v1\DeliveryChallanController::class, 'show']);
                        Route::put('/{id}', [\App\Http\Controllers\Internal\v1\DeliveryChallanController::class, 'update']);
                        Route::patch('/{id}/status', [\App\Http\Controllers\Internal\v1\DeliveryChallanController::class, 'updateStatus']);
                        Route::delete('/{id}', [\App\Http\Controllers\Internal\v1\DeliveryChallanController::class, 'destroy']);
                        Route::get('/{id}/pdf', [\App\Http\Controllers\Internal\v1\DeliveryChallanController::class, 'generatePdf']);
                    });
                };

                $registerChallanRoutes('v1/delivery-challans');
                $registerChallanRoutes('api/v1/delivery-challans');
                $registerChallanRoutes('int/v1/delivery-challans');

                $registerTransportRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::get('/metrics', [\App\Http\Controllers\Internal\v1\TransportDashboardController::class, 'metrics']);
                    });
                };

                $registerTransportRoutes('v1/transport');
                $registerTransportRoutes('api/v1/transport');
                $registerTransportRoutes('int/v1/transport');

                $registerBiltyRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::get('/', [\App\Http\Controllers\Internal\v1\BiltyController::class, 'index']);
                        Route::post('/', [\App\Http\Controllers\Internal\v1\BiltyController::class, 'store']);
                        Route::get('/{id}', [\App\Http\Controllers\Internal\v1\BiltyController::class, 'show']);
                        Route::put('/{id}', [\App\Http\Controllers\Internal\v1\BiltyController::class, 'update']);
                        Route::delete('/{id}', [\App\Http\Controllers\Internal\v1\BiltyController::class, 'destroy']);
                        Route::get('/{id}/pdf', [\App\Http\Controllers\Internal\v1\BiltyController::class, 'generatePdf']);
                    });
                };

                $registerBiltyRoutes('v1/bilties');
                $registerBiltyRoutes('api/v1/bilties');
                $registerBiltyRoutes('int/v1/bilties');

                $registerLrRoutes = function (string $prefix) {
                    Route::prefix($prefix)->group(function () {
                        Route::get('/', [\App\Http\Controllers\Internal\v1\LrNumberController::class, 'index']);
                        Route::post('/', [\App\Http\Controllers\Internal\v1\LrNumberController::class, 'store']);
                        Route::get('/{id}', [\App\Http\Controllers\Internal\v1\LrNumberController::class, 'show']);
                        Route::post('/{id}/status', [\App\Http\Controllers\Internal\v1\LrNumberController::class, 'updateStatus']);
                        Route::get('/{id}/history', [\App\Http\Controllers\Internal\v1\LrNumberController::class, 'history']);
                        Route::get('/{id}/pdf', [\App\Http\Controllers\Internal\v1\LrNumberController::class, 'generatePdf']);
                    });
                };

                $registerLrRoutes('v1/lr-numbers');
                $registerLrRoutes('api/v1/lr-numbers');
                $registerLrRoutes('int/v1/lr-numbers');
            }
        );
    }
}
