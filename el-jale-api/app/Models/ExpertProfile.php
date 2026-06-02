<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExpertProfile extends Model
{
    use HasFactory;

    // Agregar esta propiedad es la clave
    protected $fillable = [
        'user_id',
        'category_id',
        'bio',
        'experience_years',
        'is_verified',
        'is_founding_member',
        'average_rating',
        'total_reviews',
    ];

    // Relación: Un perfil pertenece a un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relación: Un perfil pertenece a una categoría (oficio)
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}