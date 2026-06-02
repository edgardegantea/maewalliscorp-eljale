<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class JobBid extends Model {
    protected $fillable = ['service_job_id','expert_id','amount','message','status'];
    public function job()    { return $this->belongsTo(ServiceJob::class, 'service_job_id'); }
    public function expert() { return $this->belongsTo(User::class, 'expert_id'); }
}
