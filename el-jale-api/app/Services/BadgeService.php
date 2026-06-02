<?php

namespace App\Services;

use App\Models\ExpertProfile;
use App\Models\ServiceJob;
use App\Helpers\Notify;

class BadgeService
{
    /**
     * Recalcula todos los badges de todos los expertos.
     * Llamar desde un comando artisan programado (diariamente).
     */
    public static function recalculateAll(): void
    {
        ExpertProfile::where('is_verified', true)->each(function ($profile) {
            self::recalculate($profile);
        });
    }

    /**
     * Recalcula badges para un experto específico.
     */
    public static function recalculate(ExpertProfile $profile): void
    {
        $userId = $profile->user_id;
        $old    = [
            'top_rated'       => $profile->badge_top_rated,
            'fast_responder'  => $profile->badge_fast_responder,
            'most_requested'  => $profile->badge_most_requested,
        ];

        // 🏆 Top Rated: ≥4.8 de promedio con al menos 10 reseñas
        $topRated = $profile->average_rating >= 4.8 && $profile->total_reviews >= 10;

        // ⚡ Respuesta rápida: acepta trabajos en promedio en < 2 horas
        // Usamos created_at del trabajo vs updated_at cuando pasó a 'asignado'
        $avgResponseMinutes = ServiceJob::where('expert_id', $userId)
            ->where('status', '!=', 'buscando')
            ->whereNotNull('expert_id')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_minutes')
            ->value('avg_minutes');
        $fastResponder = $avgResponseMinutes !== null && $avgResponseMinutes <= 120;

        // 🔥 Más solicitado: top 10% de trabajos completados en los últimos 30 días
        $completedThisMonth = ServiceJob::where('expert_id', $userId)
            ->where('status', 'completado')
            ->where('updated_at', '>=', now()->subDays(30))
            ->count();
        $p90 = self::getP90CompletedThisMonth();
        $mostRequested = $completedThisMonth > 0 && $completedThisMonth >= $p90;

        $profile->update([
            'badge_top_rated'       => $topRated,
            'badge_fast_responder'  => $fastResponder,
            'badge_most_requested'  => $mostRequested,
            'badges_updated_at'     => now(),
        ]);

        // Notificar si ganó un badge nuevo
        if (!$old['top_rated'] && $topRated) {
            Notify::send($userId, 'badge_earned', '🏆 ¡Badge ganado!',
                'Ahora eres Top Rated. Tienes +4.8 estrellas con 10 o más reseñas.', null, null);
        }
        if (!$old['fast_responder'] && $fastResponder) {
            Notify::send($userId, 'badge_earned', '⚡ ¡Badge ganado!',
                'Ganaste el badge de Respuesta Rápida. Aceptas trabajos en menos de 2 horas.', null, null);
        }
        if (!$old['most_requested'] && $mostRequested) {
            Notify::send($userId, 'badge_earned', '🔥 ¡Badge ganado!',
                'Eres uno de los más solicitados este mes. ¡Sigue así!', null, null);
        }
    }

    private static function getP90CompletedThisMonth(): int
    {
        $counts = ServiceJob::selectRaw('expert_id, COUNT(*) as cnt')
            ->where('status', 'completado')
            ->where('updated_at', '>=', now()->subDays(30))
            ->whereNotNull('expert_id')
            ->groupBy('expert_id')
            ->pluck('cnt')
            ->sort()
            ->values();

        if ($counts->isEmpty()) return PHP_INT_MAX;

        $idx = (int) ceil($counts->count() * 0.9) - 1;
        return $counts->get($idx, PHP_INT_MAX);
    }
}
