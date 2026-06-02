<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'icon_url'];

    // Generar el slug automáticamente al crear o actualizar
    public static function boot()
    {
        parent::boot();

        static::saving(function ($category) {
            $category->slug = Str::slug($category->name);
        });
    }

    // Relación: Una categoría tiene muchos perfiles de expertos
    public function experts()
    {
        return $this->hasMany(ExpertProfile::class);
    }
}