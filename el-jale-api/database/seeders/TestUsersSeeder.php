<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // --- ADMIN ---
        \App\Models\User::firstOrCreate(['email' => 'admin@eljale.mx'], [
            'name'     => 'Admin El Jale',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role'     => 'admin',
        ]);

        // --- CLIENTES ---
        $clients = [
            ['name' => 'María González',  'email' => 'maria@test.mx'],
            ['name' => 'Roberto Jiménez', 'email' => 'roberto@test.mx'],
        ];
        foreach ($clients as $data) {
            \App\Models\User::firstOrCreate(['email' => $data['email']], [
                'name'     => $data['name'],
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role'     => 'client',
            ]);
        }

        // --- EXPERTOS ---
        $experts = [
            ['name' => 'Carlos Herrera', 'email' => 'carlos@test.mx',  'category_id' => 1, 'experience_years' => 8,  'bio' => 'Plomero certificado con 8 años de experiencia en instalaciones residenciales y comerciales. Trabajo limpio y garantizado.'],
            ['name' => 'Luis Martínez',  'email' => 'luis@test.mx',    'category_id' => 2, 'experience_years' => 12, 'bio' => 'Electricista con más de 12 años instalando sistemas eléctricos. Especialista en tableros y circuitos de alta tensión.'],
            ['name' => 'Ana Ramírez',    'email' => 'ana@test.mx',     'category_id' => 4, 'experience_years' => 5,  'bio' => 'Pintora profesional. Acabados perfectos en interiores y exteriores. Puntual y detallista.'],
            ['name' => 'Jorge Mendoza',  'email' => 'jorge@test.mx',   'category_id' => 3, 'experience_years' => 15, 'bio' => 'Albañil con 15 años de experiencia en construcción y remodelación. Proyectos desde cero hasta acabados finos.'],
        ];

        $expertCount = \App\Models\ExpertProfile::count();
        foreach ($experts as $data) {
            $user = \App\Models\User::firstOrCreate(['email' => $data['email']], [
                'name'     => $data['name'],
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'role'     => 'expert',
            ]);

            \App\Models\ExpertProfile::firstOrCreate(['user_id' => $user->id], [
                'category_id'      => $data['category_id'],
                'experience_years' => $data['experience_years'],
                'bio'              => $data['bio'],
                'is_verified'      => true,
                'is_founding_member' => $expertCount < 50,
                'average_rating'   => 0,
                'total_reviews'    => 0,
            ]);
            $expertCount++;
        }
    }
}
