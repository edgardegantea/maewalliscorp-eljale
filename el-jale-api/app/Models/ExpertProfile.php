<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExpertProfile extends Model
{
    use HasFactory;

    // Agregar esta propiedad es la clave
    protected $fillable = [
        'user_id', 'category_id', 'bio', 'hourly_rate', 'experience_years',
        'is_verified', 'is_founding_member', 'average_rating',
        'total_reviews', 'is_available', 'response_time',
        // Geolocalización
        'city', 'state', 'latitude', 'longitude', 'coverage_radius_km',
        // Verificación de identidad
        'id_front_path', 'id_back_path', 'selfie_path',
        'verification_status', 'rejection_reason', 'verified_at',
        // Badges
        'badge_top_rated', 'badge_fast_responder', 'badge_most_requested', 'badges_updated_at',
        // Onboarding
        'onboarding_completed', 'onboarding_step',
        // Premium
        'is_premium', 'premium_expires_at', 'mp_subscription_preference_id',
        // Garantía
        'has_guarantee',
    ];

    public function user()     { return $this->belongsTo(User::class); }
    public function category() { return $this->belongsTo(Category::class); }
    public function portfolio() { return $this->hasMany(ExpertPortfolioPhoto::class); }
}