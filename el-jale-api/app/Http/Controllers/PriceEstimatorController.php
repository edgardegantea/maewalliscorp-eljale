<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\ServiceJob;
use Illuminate\Support\Facades\DB;

class PriceEstimatorController extends Controller
{
    /**
     * Estima el rango de precios para una categoría y ciudad.
     * GET /price-estimate?category_id=1&city=CDMX
     */
    public function estimate(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'city'        => 'nullable|string|max:100',
        ]);

        $catId = $request->category_id;
        $city  = $request->city;

        // Pagos completados para esta categoría
        $query = Payment::selectRaw('
                MIN(payments.amount) as min_price,
                MAX(payments.amount) as max_price,
                AVG(payments.amount) as avg_price,
                PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY payments.amount) as p25,
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY payments.amount) as p75,
                COUNT(*) as sample_count
            ')
            ->join('service_jobs', 'service_jobs.id', '=', 'payments.service_job_id')
            ->where('service_jobs.category_id', $catId)
            ->where('payments.status', 'liberado_al_experto')
            ->where('payments.amount', '>', 0);

        if ($city) {
            $query->where('service_jobs.city', 'ilike', "%{$city}%");
        }

        $stats = $query->first();

        // Si no hay suficientes datos locales, usar nacionales
        if (!$stats || $stats->sample_count < 3) {
            $stats = Payment::selectRaw('
                    MIN(payments.amount) as min_price,
                    MAX(payments.amount) as max_price,
                    AVG(payments.amount) as avg_price,
                    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY payments.amount) as p25,
                    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY payments.amount) as p75,
                    COUNT(*) as sample_count
                ')
                ->join('service_jobs', 'service_jobs.id', '=', 'payments.service_job_id')
                ->where('service_jobs.category_id', $catId)
                ->where('payments.status', 'liberado_al_experto')
                ->where('payments.amount', '>', 0)
                ->first();
        }

        // Expertos activos en esta categoría
        $expertsCount = \App\Models\ExpertProfile::where('category_id', $catId)
            ->where('is_verified', true)
            ->where('is_available', true)
            ->count();

        $avgRating = \App\Models\ExpertProfile::where('category_id', $catId)
            ->where('is_verified', true)
            ->avg('average_rating');

        // Precio sugerido con urgencia
        $suggested    = $stats && $stats->sample_count > 0 ? round($stats->avg_price, 0) : null;
        $urgentSuggested = $suggested ? round($suggested * 1.5, 0) : null;

        return response()->json([
            'category_id'    => (int) $catId,
            'city'           => $city,
            'has_data'       => $stats && $stats->sample_count >= 3,
            'sample_count'   => $stats?->sample_count ?? 0,
            'min'            => $stats?->min_price ? round($stats->min_price, 0) : null,
            'max'            => $stats?->max_price ? round($stats->max_price, 0) : null,
            'avg'            => $suggested,
            'p25'            => $stats?->p25 ? round($stats->p25, 0) : null,
            'p75'            => $stats?->p75 ? round($stats->p75, 0) : null,
            'suggested'      => $suggested,
            'urgent_price'   => $urgentSuggested,
            'experts_available' => $expertsCount,
            'avg_rating'     => $avgRating ? round($avgRating, 1) : null,
        ]);
    }
}
