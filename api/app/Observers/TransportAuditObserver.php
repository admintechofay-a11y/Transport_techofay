<?php

namespace App\Observers;

use App\Models\AuditLog;
use App\Models\BiltySequence;
use App\Models\LrSequence;
use App\Services\AuditLogService;
use Illuminate\Database\Eloquent\Model;

class TransportAuditObserver
{
    protected AuditLogService $auditService;

    public function __construct(AuditLogService $auditService)
    {
        $this->auditService = $auditService;
    }

    /**
     * Handle the Model "created" event.
     */
    public function created(Model $model): void
    {
        if ($this->shouldSkip($model)) {
            return;
        }

        $after = $this->sanitizeAttributes($model->getAttributes());
        $this->auditService->record('CREATE', $model, null, $after);
    }

    /**
     * Handle the Model "updated" event.
     */
    public function updated(Model $model): void
    {
        if ($this->shouldSkip($model)) {
            return;
        }

        $changes = $model->getChanges();
        unset($changes['updated_at']);

        if (empty($changes)) {
            return;
        }

        $before = [];
        foreach (array_keys($changes) as $key) {
            $before[$key] = $model->getOriginal($key);
        }

        $action = array_key_exists('status', $changes) ? 'STATUS_CHANGE' : 'UPDATE';

        $this->auditService->record(
            $action,
            $model,
            $this->sanitizeAttributes($before),
            $this->sanitizeAttributes($changes)
        );
    }

    /**
     * Handle the Model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        if ($this->shouldSkip($model)) {
            return;
        }

        $before = $this->sanitizeAttributes($model->getAttributes());
        $this->auditService->record('DELETE', $model, $before, null);
    }

    /**
     * Check if the model should be skipped.
     */
    protected function shouldSkip(Model $model): bool
    {
        return $model instanceof AuditLog
            || $model instanceof LrSequence
            || $model instanceof BiltySequence;
    }

    /**
     * Filter out sensitive or internal keys from logged attributes.
     */
    protected function sanitizeAttributes(array $attributes): array
    {
        $hidden = ['password', 'remember_token', 'secret', '_key'];
        foreach ($hidden as $key) {
            unset($attributes[$key]);
        }

        return $attributes;
    }
}
