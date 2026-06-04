<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name','rfc','email','contact_name','phone','address','city',
        'plan','monthly_budget','jobs_this_month','is_active',
    ];

    protected $casts = ['is_active' => 'boolean', 'monthly_budget' => 'integer'];

    public function users() { return $this->hasMany(User::class); }
}
