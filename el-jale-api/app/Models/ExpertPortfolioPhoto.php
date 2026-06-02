<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ExpertPortfolioPhoto extends Model {
    protected $fillable = ['expert_profile_id','photo_path','caption'];
    public function profile() { return $this->belongsTo(ExpertProfile::class, 'expert_profile_id'); }
}
