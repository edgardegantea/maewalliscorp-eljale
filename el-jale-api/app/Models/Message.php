<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = ['service_job_id', 'sender_id', 'body'];

    public function sender() { return $this->belongsTo(User::class, 'sender_id'); }
    public function job()    { return $this->belongsTo(ServiceJob::class, 'service_job_id'); }
}
