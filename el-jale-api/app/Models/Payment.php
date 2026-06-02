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
        'transaction_id'
    ];

    public function serviceJob()
    {
        return $this->belongsTo(ServiceJob::class);
    }
}