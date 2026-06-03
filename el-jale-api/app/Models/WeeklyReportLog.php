<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeeklyReportLog extends Model
{
    protected $fillable = ['user_id', 'week_start', 'data'];
    protected $casts    = ['data' => 'array'];

    public function user() { return $this->belongsTo(User::class); }
}
