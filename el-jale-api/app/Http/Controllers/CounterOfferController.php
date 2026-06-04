<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\JobBid;
use App\Models\ServiceJob;
use App\Helpers\Notify;

class CounterOfferController extends Controller
{
    /** Cliente hace contra-oferta a un bid */
    public function make(Request $request, $jobId, $bidId)
    {
        $request->validate([
            'counter_amount'  => 'required|numeric|min:1',
            'counter_message' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $job  = ServiceJob::where('id', $jobId)->where('client_id', $user->id)->firstOrFail();
        $bid  = JobBid::where('id', $bidId)->where('service_job_id', $jobId)->firstOrFail();

        if ($bid->status !== 'pendiente') {
            return response()->json(['message' => 'Esta cotización ya no puede modificarse.'], 422);
        }

        $bid->update([
            'counter_amount'  => $request->counter_amount,
            'counter_message' => $request->counter_message ?? "Te propongo $" . number_format($request->counter_amount, 0, '.', ',') . " MXN por este trabajo.",
            'counter_status'  => 'pending',
        ]);

        // Notificar al experto
        Notify::send(
            $bid->expert_id,
            'counter_offer',
            '💬 El cliente propone un precio',
            "{$user->name} te propone \${$request->counter_amount} MXN para «{$job->title}».",
            $job->id,
            'ServiceJob'
        );

        return response()->json(['message' => 'Contra-oferta enviada al experto.', 'bid' => $bid]);
    }

    /** Experto acepta contra-oferta del cliente */
    public function accept(Request $request, $jobId, $bidId)
    {
        $user = $request->user();
        $bid  = JobBid::where('id', $bidId)
            ->where('service_job_id', $jobId)
            ->where('expert_id', $user->id)
            ->firstOrFail();

        if ($bid->counter_status !== 'pending') {
            return response()->json(['message' => 'No hay contra-oferta pendiente.'], 422);
        }

        $bid->update([
            'amount'         => $bid->counter_amount,
            'counter_status' => 'accepted',
        ]);

        $job = ServiceJob::find($jobId);
        Notify::send(
            $job->client_id,
            'counter_accepted',
            '✅ El experto aceptó tu precio',
            "{$user->name} aceptó tu propuesta de \${$bid->counter_amount} MXN.",
            $job->id,
            'ServiceJob'
        );

        return response()->json(['message' => 'Precio aceptado. Ahora puedes contratar al experto.', 'bid' => $bid]);
    }

    /** Experto rechaza contra-oferta */
    public function reject(Request $request, $jobId, $bidId)
    {
        $user = $request->user();
        $bid  = JobBid::where('id', $bidId)
            ->where('service_job_id', $jobId)
            ->where('expert_id', $user->id)
            ->firstOrFail();

        $bid->update(['counter_status' => 'rejected']);

        $job = ServiceJob::find($jobId);
        Notify::send(
            $job->client_id,
            'counter_rejected',
            '❌ El experto rechazó tu precio',
            "El experto no pudo aceptar tu propuesta para «{$job->title}».",
            $job->id,
            'ServiceJob'
        );

        return response()->json(['message' => 'Contra-oferta rechazada.', 'bid' => $bid]);
    }
}
