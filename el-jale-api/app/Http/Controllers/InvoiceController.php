<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ServiceJob;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    public function download(Request $request, $jobId)
    {
        $user = $request->user();
        $job  = ServiceJob::with(['client', 'expert', 'category', 'payment'])->findOrFail($jobId);

        // Solo el cliente o el experto del trabajo pueden descargar
        if ($user->id !== $job->client_id && $user->id !== $job->expert_id && $user->role !== 'admin') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        if ($job->status !== 'completado') {
            return response()->json(['message' => 'Solo se pueden generar recibos de trabajos completados'], 400);
        }

        if (!$job->payment) {
            return response()->json(['message' => 'Este trabajo no tiene registro de pago'], 400);
        }

        $pdf = Pdf::loadView('pdf.invoice', [
            'job'     => $job,
            'payment' => $job->payment,
        ])->setPaper('a4', 'portrait');

        $filename = "recibo-eljale-{$job->id}.pdf";

        return $pdf->download($filename);
    }
}
