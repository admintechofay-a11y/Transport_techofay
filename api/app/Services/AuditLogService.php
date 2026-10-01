<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Scopes\CompanyScope;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    /**
     * Record an audit log entry for a domain entity.
     */
    public function record(
        string $action,
        $entity,
        ?array $before = null,
        ?array $after = null,
        ?string $userUuid = null,
        ?string $companyUuid = null
    ): ?AuditLog {
        $resolvedCompanyUuid = $companyUuid
            ?: ($entity->company_uuid ?? CompanyScope::resolveCompanyUuid() ?? session('company'));

        if (!$resolvedCompanyUuid) {
            return null;
        }

        $entityType = is_object($entity) ? class_basename($entity) : (string) $entity;
        $entityUuid = is_object($entity) ? ($entity->uuid ?? (string) $entity->id ?? null) : null;

        $resolvedUserUuid = $userUuid
            ?: (Auth::user()?->uuid ?? Auth::id() ?? session('user'));

        $ipAddress = request()?->ip() ?? '127.0.0.1';
        $userAgent = request()?->userAgent() ?? 'System';

        return AuditLog::create([
            'company_uuid' => $resolvedCompanyUuid,
            'user_uuid'    => $resolvedUserUuid,
            'action'       => strtoupper($action),
            'entity_type'  => $entityType,
            'entity_uuid'  => $entityUuid,
            'before'       => $before,
            'after'        => $after,
            'ip_address'   => $ipAddress,
            'user_agent'   => $userAgent,
        ]);
    }

    /**
     * Record a status change event.
     */
    public function recordStatusChange($entity, string $oldStatus, string $newStatus, ?array $additional = null): ?AuditLog
    {
        $before = array_merge(['status' => $oldStatus], $additional['before'] ?? []);
        $after = array_merge(['status' => $newStatus], $additional['after'] ?? []);

        return $this->record(
            'STATUS_CHANGE',
            $entity,
            $before,
            $after
        );
    }

    /**
     * Query audit logs with multi-tenant filtering and pagination.
     */
    public function queryLogs(?string $companyUuid, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = AuditLog::query();

        if ($companyUuid) {
            $query->where('company_uuid', $companyUuid);
        }

        if (!empty($filters['action'])) {
            $query->where('action', strtoupper($filters['action']));
        }

        if (!empty($filters['entity_type'])) {
            $query->where('entity_type', $filters['entity_type']);
        }

        if (!empty($filters['entity_uuid'])) {
            $query->where('entity_uuid', $filters['entity_uuid']);
        }

        if (!empty($filters['user_uuid'])) {
            $query->where('user_uuid', $filters['user_uuid']);
        }

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', $search)
                  ->orWhere('entity_type', 'like', $search)
                  ->orWhere('entity_uuid', 'like', $search)
                  ->orWhere('ip_address', 'like', $search);
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }
}
