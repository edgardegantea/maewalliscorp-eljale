<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // Asegúrate de tener esta línea

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'phone_verified',
        'phone_otp',
        'phone_otp_expires_at',
        'fcm_token',
        'referral_code',
        'referred_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'phone_otp',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relación con el perfil de experto
    public function expertProfile()
    {
        return $this->hasOne(ExpertProfile::class);
    }

    // Dentro de User.php
    public function clientJobs()
    {
        return $this->hasMany(ServiceJob::class, 'client_id');
    }

    public function expertJobs()
    {
        return $this->hasMany(ServiceJob::class, 'expert_id');
    }

    public function referralCredits()
    {
        return $this->hasMany(\App\Models\ReferralCredit::class);
    }

    public function referredUsers()
    {
        return $this->hasMany(User::class, 'referred_by');
    }
}