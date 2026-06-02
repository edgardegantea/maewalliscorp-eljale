<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'expert_id',
        'category_id',
        'title',
        'description',
        'budget',
        'status',
        'client_photos',
        'expert_photos',
        'address',
        'preferred_date',
        'preferred_time',
        'urgency',
        'latitude',
        'longitude',
        'city',
    ];

    protected $casts = [
        'client_photos' => 'array',
        'expert_photos' => 'array',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function expert()
    {
        return $this->belongsTo(User::class, 'expert_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }


    public function payment()  { return $this->hasOne(Payment::class); }
    public function review()   { return $this->hasOne(Review::class); }
    public function messages() { return $this->hasMany(Message::class); }
    public function bids()     { return $this->hasMany(JobBid::class); }
    public function dispute()  { return $this->hasOne(Dispute::class); }

}