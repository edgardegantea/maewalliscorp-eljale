<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\ServiceJob;
use App\Models\Payment;
use App\Models\Message;
use App\Models\Review;
use App\Models\ExpertProfile;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $maria   = User::where('email', 'maria@eljale.mx')->first();
        $roberto = User::where('email', 'roberto@eljale.mx')->first();
        $carlos  = User::where('email', 'carlos@eljale.mx')->first();  // Plomería
        $luis    = User::where('email', 'luis@eljale.mx')->first();    // Electricidad
        $ana     = User::where('email', 'ana@eljale.mx')->first();     // Pintura
        $jorge   = User::where('email', 'jorge@eljale.mx')->first();   // Albañilería

        if (!$maria || !$carlos) {
            $this->command->error('Primero corre TestUsersSeeder.');
            return;
        }

        // =====================================================
        // TRABAJOS COMPLETADOS (con pago liberado y reseña)
        // =====================================================

        $job1 = ServiceJob::create([
            'client_id'   => $maria->id,
            'expert_id'   => $carlos->id,
            'category_id' => 1,
            'title'       => 'Fuga de agua en el baño principal',
            'description' => 'Hay una fuga debajo del lavabo, lleva 2 días goteando y ya manchó el mueble. Necesito que vengan lo antes posible.',
            'budget'      => 850.00,
            'address'     => 'Calle Hidalgo 45, Col. Centro',
            'status'      => 'completado',
            'created_at'  => Carbon::now()->subDays(15),
            'updated_at'  => Carbon::now()->subDays(14),
        ]);
        Payment::create([
            'service_job_id' => $job1->id,
            'amount'         => 850.00,
            'status'         => 'liberado_al_experto',
            'created_at'     => Carbon::now()->subDays(15),
            'updated_at'     => Carbon::now()->subDays(14),
        ]);
        Message::insert([
            ['service_job_id' => $job1->id, 'sender_id' => $carlos->id, 'body' => 'Hola María, puedo ir mañana en la mañana a las 9am. ¿Te queda bien?', 'created_at' => Carbon::now()->subDays(15), 'updated_at' => Carbon::now()->subDays(15)],
            ['service_job_id' => $job1->id, 'sender_id' => $maria->id,  'body' => 'Perfecto Carlos, aquí te espero. La dirección es Calle Hidalgo 45.', 'created_at' => Carbon::now()->subDays(15), 'updated_at' => Carbon::now()->subDays(15)],
            ['service_job_id' => $job1->id, 'sender_id' => $carlos->id, 'body' => 'Listo, ahí estaré. Voy a llevar tubería de cobre por si se necesita cambiar.', 'created_at' => Carbon::now()->subDays(15), 'updated_at' => Carbon::now()->subDays(15)],
            ['service_job_id' => $job1->id, 'sender_id' => $maria->id,  'body' => 'Gracias, fue un excelente trabajo. Todo quedó perfecto.', 'created_at' => Carbon::now()->subDays(14), 'updated_at' => Carbon::now()->subDays(14)],
        ]);
        Review::create([
            'service_job_id' => $job1->id,
            'client_id'      => $maria->id,
            'expert_id'      => $carlos->id,
            'rating'         => 5,
            'comment'        => 'Carlos llegó puntual, resolvió la fuga rápido y dejó todo limpio. Muy profesional.',
            'created_at'     => Carbon::now()->subDays(14),
            'updated_at'     => Carbon::now()->subDays(14),
        ]);

        $job2 = ServiceJob::create([
            'client_id'   => $roberto->id,
            'expert_id'   => $luis->id,
            'category_id' => 2,
            'title'       => 'Cortocircuito en la cocina',
            'description' => 'Se fue la luz en la cocina y el comedor. Ya revisé el tablero y el switch está bien. Creo que hay un cable quemado.',
            'budget'      => 1200.00,
            'address'     => 'Av. Juárez 112, Fracc. Las Palmas',
            'status'      => 'completado',
            'created_at'  => Carbon::now()->subDays(10),
            'updated_at'  => Carbon::now()->subDays(9),
        ]);
        Payment::create([
            'service_job_id' => $job2->id,
            'amount'         => 1200.00,
            'status'         => 'liberado_al_experto',
            'created_at'     => Carbon::now()->subDays(10),
            'updated_at'     => Carbon::now()->subDays(9),
        ]);
        Message::insert([
            ['service_job_id' => $job2->id, 'sender_id' => $luis->id,    'body' => 'Buenos días Roberto, ¿puedo pasar hoy en la tarde como a las 4?', 'created_at' => Carbon::now()->subDays(10), 'updated_at' => Carbon::now()->subDays(10)],
            ['service_job_id' => $job2->id, 'sender_id' => $roberto->id, 'body' => 'Sí, aquí estaré. ¿Qué necesito tener listo?', 'created_at' => Carbon::now()->subDays(10), 'updated_at' => Carbon::now()->subDays(10)],
            ['service_job_id' => $job2->id, 'sender_id' => $luis->id,    'body' => 'Solo acceso al tablero eléctrico y a la cocina. Yo llevo todo lo necesario.', 'created_at' => Carbon::now()->subDays(10), 'updated_at' => Carbon::now()->subDays(10)],
        ]);
        Review::create([
            'service_job_id' => $job2->id,
            'client_id'      => $roberto->id,
            'expert_id'      => $luis->id,
            'rating'         => 5,
            'comment'        => 'Excelente trabajo, encontró el problema en 20 minutos. Muy recomendado.',
            'created_at'     => Carbon::now()->subDays(9),
            'updated_at'     => Carbon::now()->subDays(9),
        ]);

        $job3 = ServiceJob::create([
            'client_id'   => $maria->id,
            'expert_id'   => $ana->id,
            'category_id' => 4,
            'title'       => 'Pintar sala y comedor',
            'description' => 'Quiero pintar la sala y el comedor de blanco hueso. Son aproximadamente 40m². Ya tengo la pintura, solo necesito la mano de obra.',
            'budget'      => 1500.00,
            'address'     => 'Calle Hidalgo 45, Col. Centro',
            'status'      => 'completado',
            'created_at'  => Carbon::now()->subDays(20),
            'updated_at'  => Carbon::now()->subDays(18),
        ]);
        Payment::create([
            'service_job_id' => $job3->id,
            'amount'         => 1500.00,
            'status'         => 'liberado_al_experto',
            'created_at'     => Carbon::now()->subDays(20),
            'updated_at'     => Carbon::now()->subDays(18),
        ]);
        Review::create([
            'service_job_id' => $job3->id,
            'client_id'      => $maria->id,
            'expert_id'      => $ana->id,
            'rating'         => 4,
            'comment'        => 'Muy buen trabajo, quedó bonito. Solo tardó un poco más de lo planeado pero el resultado valió la pena.',
            'created_at'     => Carbon::now()->subDays(18),
            'updated_at'     => Carbon::now()->subDays(18),
        ]);

        // =====================================================
        // TRABAJOS EN PROGRESO (asignados, con chat activo)
        // =====================================================

        $job4 = ServiceJob::create([
            'client_id'   => $roberto->id,
            'expert_id'   => $jorge->id,
            'category_id' => 3,
            'title'       => 'Reparar pared dañada por humedad',
            'description' => 'La pared del cuarto de lavado tiene humedad y se está descascarando. Necesito que la piquen, traten y vuelvan a aplanar.',
            'budget'      => 2200.00,
            'address'     => 'Av. Juárez 112, Fracc. Las Palmas',
            'status'      => 'asignado',
            'created_at'  => Carbon::now()->subDays(2),
            'updated_at'  => Carbon::now()->subDays(1),
        ]);
        Payment::create([
            'service_job_id' => $job4->id,
            'amount'         => 2200.00,
            'status'         => 'retenido_en_app',
            'created_at'     => Carbon::now()->subDays(2),
            'updated_at'     => Carbon::now()->subDays(2),
        ]);
        Message::insert([
            ['service_job_id' => $job4->id, 'sender_id' => $jorge->id,   'body' => 'Hola Roberto, ¿puedo pasar el jueves a las 8am a revisar el daño antes de traer materiales?', 'created_at' => Carbon::now()->subDays(1), 'updated_at' => Carbon::now()->subDays(1)],
            ['service_job_id' => $job4->id, 'sender_id' => $roberto->id, 'body' => 'Sí claro Jorge, el jueves está perfecto.', 'created_at' => Carbon::now()->subDays(1), 'updated_at' => Carbon::now()->subDays(1)],
            ['service_job_id' => $job4->id, 'sender_id' => $jorge->id,   'body' => 'Perfecto. Voy a necesitar acceso al cuarto de lavado y que esté despejado si es posible.', 'created_at' => Carbon::now()->subHours(5), 'updated_at' => Carbon::now()->subHours(5)],
        ]);

        $job5 = ServiceJob::create([
            'client_id'   => $maria->id,
            'expert_id'   => $carlos->id,
            'category_id' => 1,
            'title'       => 'Instalar calentador de agua nuevo',
            'description' => 'Compré un calentador de paso Rheem y necesito que lo instalen. Hay que quitar el viejo y conectar el nuevo.',
            'budget'      => 650.00,
            'address'     => 'Calle Hidalgo 45, Col. Centro',
            'status'      => 'asignado',
            'created_at'  => Carbon::now()->subDays(1),
            'updated_at'  => Carbon::now()->subHours(3),
        ]);
        Payment::create([
            'service_job_id' => $job5->id,
            'amount'         => 650.00,
            'status'         => 'retenido_en_app',
            'created_at'     => Carbon::now()->subDays(1),
            'updated_at'     => Carbon::now()->subDays(1),
        ]);
        Message::insert([
            ['service_job_id' => $job5->id, 'sender_id' => $carlos->id, 'body' => '¿Ya tiene el kit de instalación o solo el calentador?', 'created_at' => Carbon::now()->subHours(3), 'updated_at' => Carbon::now()->subHours(3)],
            ['service_job_id' => $job5->id, 'sender_id' => $maria->id,  'body' => 'Solo el calentador, ¿trae el kit usted?', 'created_at' => Carbon::now()->subHours(2), 'updated_at' => Carbon::now()->subHours(2)],
            ['service_job_id' => $job5->id, 'sender_id' => $carlos->id, 'body' => 'Sí yo traigo todo. Paso mañana a las 10am.', 'created_at' => Carbon::now()->subHours(1), 'updated_at' => Carbon::now()->subHours(1)],
        ]);

        // =====================================================
        // TRABAJOS BUSCANDO EXPERTO (sin asignar)
        // =====================================================

        ServiceJob::create([
            'client_id'   => $roberto->id,
            'category_id' => 2,
            'title'       => 'Instalar 4 contactos nuevos en la oficina',
            'description' => 'Necesito instalar 4 contactos dobles en mi oficina en casa. Ya está la instalación, solo es conectar y tapar.',
            'budget'      => 400.00,
            'address'     => 'Av. Juárez 112, Fracc. Las Palmas',
            'status'      => 'buscando',
            'created_at'  => Carbon::now()->subHours(6),
            'updated_at'  => Carbon::now()->subHours(6),
        ]);

        ServiceJob::create([
            'client_id'   => $maria->id,
            'category_id' => 4,
            'title'       => 'Pintar fachada de la casa',
            'description' => 'La fachada tiene como 4 años sin pintar y ya está muy desgastada. Son aproximadamente 30m² de frente. Quiero color terracota.',
            'budget'      => 1800.00,
            'address'     => 'Calle Hidalgo 45, Col. Centro',
            'status'      => 'buscando',
            'created_at'  => Carbon::now()->subHours(2),
            'updated_at'  => Carbon::now()->subHours(2),
        ]);

        ServiceJob::create([
            'client_id'   => $roberto->id,
            'category_id' => 1,
            'title'       => 'Cambiar llave de jardín que gotea',
            'description' => 'La llave de agua del jardín no cierra bien y está desperdiciando agua constantemente. Necesito que la cambien.',
            'budget'      => 350.00,
            'address'     => 'Av. Juárez 112, Fracc. Las Palmas',
            'status'      => 'buscando',
            'created_at'  => Carbon::now()->subHours(1),
            'updated_at'  => Carbon::now()->subHours(1),
        ]);

        // =====================================================
        // TRABAJO CANCELADO
        // =====================================================

        $job9 = ServiceJob::create([
            'client_id'   => $maria->id,
            'category_id' => 3,
            'title'       => 'Ampliar cuarto de servicio',
            'description' => 'Quiero ampliar el cuarto de servicio unos 2 metros hacia el patio.',
            'budget'      => 8000.00,
            'address'     => 'Calle Hidalgo 45, Col. Centro',
            'status'      => 'cancelado',
            'created_at'  => Carbon::now()->subDays(5),
            'updated_at'  => Carbon::now()->subDays(4),
        ]);
        Payment::create([
            'service_job_id' => $job9->id,
            'amount'         => 8000.00,
            'status'         => 'reembolsado',
            'created_at'     => Carbon::now()->subDays(5),
            'updated_at'     => Carbon::now()->subDays(4),
        ]);

        // =====================================================
        // ACTUALIZAR CALIFICACIONES EN PERFILES DE EXPERTOS
        // =====================================================

        $this->recalcularRating($carlos->id);
        $this->recalcularRating($luis->id);
        $this->recalcularRating($ana->id);

        $this->command->info('✓ Datos de ejemplo insertados correctamente.');
        $this->command->table(
            ['Concepto', 'Cantidad'],
            [
                ['Trabajos completados', 3],
                ['Trabajos en progreso', 2],
                ['Trabajos buscando experto', 3],
                ['Trabajos cancelados', 1],
                ['Mensajes de chat', 11],
                ['Calificaciones', 3],
            ]
        );
    }

    private function recalcularRating(int $expertId): void
    {
        $avg   = Review::where('expert_id', $expertId)->avg('rating') ?? 0;
        $total = Review::where('expert_id', $expertId)->count();
        ExpertProfile::where('user_id', $expertId)
            ->update(['average_rating' => round($avg, 1), 'total_reviews' => $total]);
    }
}
