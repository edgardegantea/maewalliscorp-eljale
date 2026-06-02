<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    protected $table = 'user_notifications';

    protected $fillable = [
        'user_id', 'type', 'title', 'body',
        'related_id', 'related_type', 'read',
    ];

    public function user() { return $this->belongsTo(User::class); }
}
