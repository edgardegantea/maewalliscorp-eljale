<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Dispute extends Model {
    protected $fillable = ['service_job_id','reporter_id','reason','description','status','admin_notes','resolution'];
    public function job()      { return $this->belongsTo(ServiceJob::class, 'service_job_id'); }
    public function reporter() { return $this->belongsTo(User::class, 'reporter_id'); }
}
