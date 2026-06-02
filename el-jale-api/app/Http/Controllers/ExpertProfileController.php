<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ExpertProfileController extends Controller
{
    // Listar expertos verificados, con filtros opcionales
    public function index(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\ExpertProfile::with(['user:id,name', 'category:id,name'])
            ->where('is_verified', true);

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->available === 'true') {
            $query->where('is_available', true);
        }

        if ($request->min_rating) {
            $query->where('average_rating', '>=', (float) $request->min_rating);
        }

        if ($request->search) {
            $search = '%' . $request->search . '%';
            $query->whereHas('user', fn($q) => $q->where('name', 'like', $search))
                  ->orWhere('bio', 'like', $search);
        }

        // Filtro por ciudad
        if ($request->city) {
            $query->where('city', 'ilike', '%' . $request->city . '%');
        }

        $experts = $query->orderByDesc('is_premium')->orderByDesc('average_rating')->get()
            ->map(fn($p) => [
                'id'               => $p->user->id,
                'name'             => $p->user->name,
                'category'         => $p->category,
                'experience_years' => $p->experience_years,
                'bio'              => $p->bio,
                'hourly_rate'      => $p->hourly_rate,
                'average_rating'   => $p->average_rating,
                'total_reviews'    => $p->total_reviews,
                'is_founding_member' => $p->is_founding_member,
                'is_available'     => $p->is_available,
                'city'             => $p->city,
                'state'            => $p->state,
                'coverage_radius_km' => $p->coverage_radius_km,
                'badge_top_rated'      => $p->badge_top_rated,
                'badge_fast_responder' => $p->badge_fast_responder,
                'badge_most_requested' => $p->badge_most_requested,
                'is_premium'           => $p->is_premium && $p->premium_expires_at && now()->isBefore($p->premium_expires_at),
            ]);

        return response()->json($experts);
    }

    // Perfil público de un experto
    // Estadísticas del experto autenticado
    public function myStats(\Illuminate\Http\Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'expert') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $completedJobs = \App\Models\ServiceJob::where('expert_id', $user->id)
            ->where('status', 'completado')->count();

        $totalEarned = \App\Models\Payment::whereHas('serviceJob', fn($q) =>
            $q->where('expert_id', $user->id)
        )->where('status', 'liberado_al_experto')->sum('amount');

        $pendingPayment = \App\Models\Payment::whereHas('serviceJob', fn($q) =>
            $q->where('expert_id', $user->id)->where('status', 'asignado')
        )->where('status', 'retenido_en_app')->sum('amount');

        $activeJobs = \App\Models\ServiceJob::where('expert_id', $user->id)
            ->where('status', 'asignado')->count();

        $user->load('expertProfile');

        return response()->json([
            'completed_jobs'  => $completedJobs,
            'active_jobs'     => $activeJobs,
            'total_earned'    => (float) $totalEarned,
            'pending_payment' => (float) $pendingPayment,
            'average_rating'  => (float) ($user->expertProfile->average_rating ?? 0),
            'total_reviews'   => $user->expertProfile->total_reviews ?? 0,
        ]);
    }

    // Actualizar el perfil propio (bio, tarifa)
    public function update(\Illuminate\Http\Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'expert') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $request->validate([
            'bio'                 => 'nullable|string|max:600',
            'hourly_rate'         => 'nullable|numeric|min:0|max:99999',
            'city'                => 'nullable|string|max:100',
            'state'               => 'nullable|string|max:100',
            'latitude'            => 'nullable|numeric|between:-90,90',
            'longitude'           => 'nullable|numeric|between:-180,180',
            'coverage_radius_km'  => 'nullable|integer|min:1|max:200',
        ]);

        $profile = \App\Models\ExpertProfile::where('user_id', $user->id)->firstOrFail();
        $profile->update($request->only('bio', 'hourly_rate', 'city', 'state', 'latitude', 'longitude', 'coverage_radius_km'));

        return response()->json(['message' => 'Perfil actualizado.', 'profile' => $profile]);
    }

    public function completeOnboarding(\Illuminate\Http\Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Acceso denegado'], 403);

        $profile = \App\Models\ExpertProfile::where('user_id', $user->id)->firstOrFail();
        $profile->update(['onboarding_completed' => true, 'onboarding_step' => 99]);

        return response()->json(['message' => 'Onboarding completado.']);
    }

    // Toggle disponibilidad
    public function toggleAvailability(\Illuminate\Http\Request $request)
    {
        $user    = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Acceso denegado'], 403);

        $profile = \App\Models\ExpertProfile::where('user_id', $user->id)->firstOrFail();
        $profile->update(['is_available' => !$profile->is_available]);

        return response()->json([
            'is_available' => $profile->is_available,
            'message' => $profile->is_available ? 'Ahora apareces como disponible.' : 'Ahora apareces como no disponible.',
        ]);
    }

    // Perfil público extendido (incluye portfolio)
    public function show($userId)
    {
        $expert = \App\Models\User::with(['expertProfile.category', 'expertProfile.portfolio'])
            ->where('role', 'expert')->findOrFail($userId);

        $reviews = \App\Models\Review::with('client:id,name')
            ->where('expert_id', $userId)->latest()->take(10)->get();

        $completedJobs = \App\Models\ServiceJob::where('expert_id', $userId)
            ->where('status', 'completado')->count();

        $profile = $expert->expertProfile;

        return response()->json([
            'id'             => $expert->id,
            'name'           => $expert->name,
            'profile'        => $profile,
            'portfolio'      => $profile?->portfolio ?? [],
            'reviews'        => $reviews,
            'completed_jobs' => $completedJobs,
        ]);
    }
}
