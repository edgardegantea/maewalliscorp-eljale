<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Plomería'],
            ['name' => 'Electricidad'],
            ['name' => 'Albañilería'],
            ['name' => 'Pintura'],
            ['name' => 'Aire Acondicionado'],
            ['name' => 'Carpintería'],
            ['name' => 'Herrería'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(['name' => $category['name']], $category);
        }
    }
}