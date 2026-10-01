<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class CompanyScope implements Scope
{
    /**
     * Resolve the active company UUID from request header, session, or authenticated user.
     */
    public static function resolveCompanyUuid(): ?string
    {
        // 1. Check request headers
        $headerCompany = request()?->header('Company-Header') ?? request()?->header('Company');
        if (!empty($headerCompany)) {
            return (string) $headerCompany;
        }

        // 2. Check active session
        $sessionCompany = session('company');
        if (!empty($sessionCompany)) {
            return (string) $sessionCompany;
        }

        // 3. Check authenticated user's company
        $user = Auth::user();
        if ($user && !empty($user->company_uuid)) {
            return (string) $user->company_uuid;
        }

        return null;
    }

    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $companyUuid = static::resolveCompanyUuid();

        if (!empty($companyUuid)) {
            $builder->where($model->qualifyColumn('company_uuid'), $companyUuid);
        } else {
            // When no company context exists, block data leakage across tenants
            // Super admins querying without tenant header can bypass via withoutGlobalScope(CompanyScope::class)
            $user = Auth::user();
            if (!$user || ($user->type ?? null) !== 'super_admin') {
                $builder->whereRaw('1 = 0');
            }
        }
    }
}
