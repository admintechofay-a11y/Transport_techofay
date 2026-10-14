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
        $user = Auth::user() ?? request()?->user();
        if (!$user && request()) {
            $bearer = request()->bearerToken();
            if ($bearer) {
                try {
                    $tokenModel = \Laravel\Sanctum\PersonalAccessToken::findToken($bearer);
                    if ($tokenModel && $tokenModel->tokenable) {
                        $user = $tokenModel->tokenable;
                    }
                } catch (\Throwable $e) {
                    // Ignore token resolution error
                }
            }
        }

        $headerCompany = request()?->header('Company-Header') 
            ?? request()?->header('X-Company-Uuid')
            ?? request()?->header('Company');

        if ($user) {
            // Super admins can operate across any specified company
            if (($user->type ?? null) === 'super_admin') {
                if (!empty($headerCompany)) {
                    return (string) $headerCompany;
                }
                return $user->company_uuid ? (string) $user->company_uuid : null;
            }

            // Normal users: strictly enforce company membership
            if (!empty($headerCompany)) {
                if ((string) $headerCompany === (string) $user->company_uuid) {
                    return (string) $headerCompany;
                }

                try {
                    $isMember = \Fleetbase\Models\CompanyUser::where('user_uuid', $user->uuid)
                        ->where('company_uuid', $headerCompany)
                        ->exists();

                    if ($isMember) {
                        return (string) $headerCompany;
                    }
                } catch (\Throwable $e) {
                    // In case table does not exist in testing
                }

                // Tenant spoofing attempt blocked: enforce authenticated user's company
                return $user->company_uuid ? (string) $user->company_uuid : null;
            }

            return $user->company_uuid ? (string) $user->company_uuid : null;
        }

        // When unauthenticated (e.g. testing / console context)
        if (!empty($headerCompany)) {
            return (string) $headerCompany;
        }

        $sessionCompany = session('company');
        if (!empty($sessionCompany)) {
            return (string) $sessionCompany;
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
