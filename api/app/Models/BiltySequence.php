<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiltySequence extends Model
{
    protected $table = 'bilty_sequences';

    protected $fillable = [
        'company_uuid',
        'year',
        'current_sequence',
    ];

    protected $casts = [
        'year'             => 'integer',
        'current_sequence' => 'integer',
    ];
}
