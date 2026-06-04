<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FraudFlag extends Model
{
    protected $fillable = ['user_id','type','description','severity','resolved','resolution'];
    protected $casts    = ['resolved' => 'boolean'];
    public function user() { return $this->belongsTo(User::class); }
}
