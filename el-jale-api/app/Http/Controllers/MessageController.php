<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request, $jobId)
    {
        $user = $request->user();
        $job  = \App\Models\ServiceJob::findOrFail($jobId);

        if ($user->id !== $job->client_id && $user->id !== $job->expert_id) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $messages = \App\Models\Message::with('sender:id,name,role')
            ->where('service_job_id', $jobId)
            ->orderBy('created_at')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request, $jobId)
    {
        $user = $request->user();
        $job  = \App\Models\ServiceJob::findOrFail($jobId);

        if ($user->id !== $job->client_id && $user->id !== $job->expert_id) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        if (!in_array($job->status, ['asignado', 'completado'])) {
            return response()->json(['message' => 'El chat solo está disponible cuando el trabajo tiene un experto asignado'], 400);
        }

        $request->validate(['body' => 'required|string|max:1000']);

        $message = \App\Models\Message::create([
            'service_job_id' => $jobId,
            'sender_id'      => $user->id,
            'body'           => $request->body,
        ]);

        return response()->json($message->load('sender:id,name,role'), 201);
    }
}
