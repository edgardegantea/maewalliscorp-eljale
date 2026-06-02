<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Dispute;
use App\Models\ServiceJob;

class DisputeController extends Controller
{
    // Abrir disputa (cliente o experto)
    public function store(Request $request, $jobId)
    {
        $user = $request->user();
        $job  = ServiceJob::findOrFail($jobId);

        if ($user->id !== $job->client_id && $user->id !== $job->expert_id)
            return response()->json(['message' => 'No eres parte de este trabajo'], 403);

        if (!in_array($job->status, ['asignado', 'completado']))
            return response()->json(['message' => 'Solo se pueden abrir disputas en trabajos activos o completados'], 400);

        if ($job->dispute)
            return response()->json(['message' => 'Ya existe una disputa abierta para este trabajo'], 400);

        $request->validate([
            'reason'      => 'required|string|max:100',
            'description' => 'required|string|max:1000',
        ]);

        $dispute = Dispute::create([
            'service_job_id' => $jobId,
            'reporter_id'    => $user->id,
            'reason'         => $request->reason,
            'description'    => $request->description,
        ]);

        return response()->json(['message' => 'Disputa registrada. El equipo de El Jale la revisará en 24 horas.', 'dispute' => $dispute], 201);
    }

    // Ver disputa de un trabajo
    public function show(Request $request, $jobId)
    {
        $user    = $request->user();
        $job     = ServiceJob::findOrFail($jobId);
        $dispute = Dispute::where('service_job_id', $jobId)->firstOrFail();

        if ($user->id !== $job->client_id && $user->id !== $job->expert_id && $user->role !== 'admin')
            return response()->json(['message' => 'Acceso denegado'], 403);

        return response()->json($dispute->load('reporter:id,name'));
    }
}
