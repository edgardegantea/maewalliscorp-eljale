<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralCredit extends Model
{
    protected $fillable = ['user_id', 'referred_user_id', 'amount', 'used'];

    public function user()         { return $this->belongsTo(User::class); }
    public function referredUser() { return $this->belongsTo(User::class, 'referred_user_id'); }
}
