<?php

namespace App\Traits;

use App\Scopes\CompanyScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Fleetbase\Models\Company;

trait BelongsToCompany
{
    /**
     * Boot the BelongsToCompany trait for a model.
     */
    public static function bootBelongsToCompany(): void
    {
        static::addGlobalScope(new CompanyScope());

        static::creating(function ($model) {
            if (empty($model->company_uuid)) {
                $resolved = CompanyScope::resolveCompanyUuid();
                if (!empty($resolved)) {
                    $model->company_uuid = $resolved;
                }
            }
        });
    }

    /**
     * Define the relationship to the tenant Company.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_uuid', 'uuid');
    }
}
