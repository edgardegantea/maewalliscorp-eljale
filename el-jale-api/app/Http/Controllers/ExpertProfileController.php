<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ExpertProfileController extends Controller
{
    // Listar expertos verificados, opcionalmente filtrando por categoría
    public function index(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\ExpertProfile::with(['user:id,name', 'category:id,name'])
            ->where('is_verified', true);

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        $experts = $query->orderByDesc('average_rating')->get()
            ->map(fn($p) => [
                'id'               => $p->user->id,
                'name'             => $p->user->name,
                'category'         => $p->category,
                'experience_years' => $p->experience_years,
                'bio'              => $p->bio,
                'average_rating'   => $p->average_rating,
                'total_reviews'    => $p->total_reviews,
                'is_founding_member' => $p->is_founding_member,
            ]);

        return response()->json($experts);
    }

    // Perfil público de un experto
    public function show($userId)
    {
        $expert = \App\Models\User::with([
            'expertProfile.category',
        ])->where('role', 'expert')->findOrFail($userId);

        $reviews = \App\Models\Review::with('client:id,name')
            ->where('expert_id', $userId)
            ->latest()
            ->take(10)
            ->get();

        $completedJobs = \App\Models\ServiceJob::where('expert_id', $userId)
            ->where('status', 'completado')
            ->count();

        return response()->json([
            'id'            => $expert->id,
            'name'          => $expert->name,
            'profile'       => $expert->expertProfile,
            'reviews'       => $reviews,
            'completed_jobs'=> $completedJobs,
        ]);
    }

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

    // Actualizar el perfil propio (bio)
    public function update(\Illuminate\Http\Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'expert') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $request->validate([
            'bio' => 'nullable|string|max:600',
        ]);

        $profile = \App\Models\ExpertProfile::where('user_id', $user->id)->firstOrFail();
        $profile->update(['bio' => $request->bio]);

        return response()->json(['message' => 'Perfil actualizado.', 'profile' => $profile]);
    }
}
