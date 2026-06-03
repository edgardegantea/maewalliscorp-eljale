<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_job_id',
        'amount',
        'status',
        'transaction_id',
        'mp_preference_id',
        'mp_payment_id',
        'mp_status',
        'platform_fee',
        'expert_amount',
        'payment_method',
        'cash_confirmed_at',
    ];

    public function serviceJob()
    {
        return $this->belongsTo(ServiceJob::class);
    }
}