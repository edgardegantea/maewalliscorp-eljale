<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request, $jobId)
    {
        $user = $request->user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Solo los clientes pueden calificar'], 403);
        }

        $job = \App\Models\ServiceJob::with('review')->findOrFail($jobId);

        if ($job->client_id !== $user->id) {
            return response()->json(['message' => 'No eres el cliente de este trabajo'], 403);
        }

        if ($job->status !== 'completado') {
            return response()->json(['message' => 'Solo puedes calificar trabajos completados'], 400);
        }

        if ($job->review) {
            return response()->json(['message' => 'Este trabajo ya fue calificado'], 400);
        }

        $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        $review = \App\Models\Review::create([
            'service_job_id' => $job->id,
            'client_id'      => $user->id,
            'expert_id'      => $job->expert_id,
            'rating'         => $request->rating,
            'comment'        => $request->comment,
        ]);

        // Recalcular promedio en el perfil del experto
        $profile = \App\Models\ExpertProfile::where('user_id', $job->expert_id)->first();
        if ($profile) {
            $avg = \App\Models\Review::where('expert_id', $job->expert_id)->avg('rating');
            $total = \App\Models\Review::where('expert_id', $job->expert_id)->count();
            $profile->update(['average_rating' => round($avg, 1), 'total_reviews' => $total]);
        }

        return response()->json($review, 201);
    }
}
