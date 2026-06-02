<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = ['service_job_id', 'client_id', 'expert_id', 'rating', 'comment'];

    public function job()   { return $this->belongsTo(ServiceJob::class, 'service_job_id'); }
    public function client(){ return $this->belongsTo(User::class, 'client_id'); }
    public function expert(){ return $this->belongsTo(User::class, 'expert_id'); }
}
