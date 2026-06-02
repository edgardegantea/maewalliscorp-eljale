<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ReviewReceivedMail;
use App\Helpers\Notify;
use App\Services\BadgeService;

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

        $review->load('client:id,name');

        // Recalcular promedio
        $profile = \App\Models\ExpertProfile::where('user_id', $job->expert_id)->first();
        if ($profile) {
            $avg   = \App\Models\Review::where('expert_id', $job->expert_id)->avg('rating');
            $total = \App\Models\Review::where('expert_id', $job->expert_id)->count();
            $profile->update(['average_rating' => round($avg, 2), 'total_reviews' => $total]);

            // Recalcular badges en background
            try { BadgeService::recalculate($profile->fresh()); } catch (\Throwable) {}
        }

        // Notificar al experto
        $expert = \App\Models\User::find($job->expert_id);
        if ($expert) {
            Notify::send($expert->id, 'review_received', "Nueva reseña {$request->rating}/5",
                "{$user->name} te calificó con {$request->rating} estrellas.", $job->id, 'ServiceJob');

            try {
                Mail::to($expert->email)->send(new ReviewReceivedMail(
                    $expert,
                    $review,
                    round($profile?->average_rating ?? $request->rating, 1),
                    $profile?->total_reviews ?? 1,
                ));
            } catch (\Throwable) {}
        }

        return response()->json($review, 201);
    }
}
