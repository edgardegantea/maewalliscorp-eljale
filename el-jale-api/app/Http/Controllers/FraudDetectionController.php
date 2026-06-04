<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FraudFlag;
use App\Models\User;
use App\Models\Dispute;

class FraudDetectionController extends Controller
{
    /** Admin: listar flags de fraude */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'No autorizado'], 403);

        $flags = FraudFlag::with('user:id,name,email,role')
            ->orderByRaw("FIELD(severity,'high','medium','low')")
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $stats = [
            'total'       => FraudFlag::count(),
            'unresolved'  => FraudFlag::where('resolved', false)->count(),
            'high'        => FraudFlag::where('severity', 'high')->where('resolved', false)->count(),
            'medium'      => FraudFlag::where('severity', 'medium')->where('resolved', false)->count(),
        ];

        return response()->json(['data' => $flags, 'stats' => $stats]);
    }

    /** Admin: resolver flag */
    public function resolve(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'No autorizado'], 403);
        $request->validate(['resolution' => 'required|string|max:500']);

        $flag = FraudFlag::findOrFail($id);
        $flag->update(['resolved' => true, 'resolution' => $request->resolution]);

        return response()->json(['message' => 'Flag resuelto.', 'flag' => $flag]);
    }

    /** Ejecutar análisis de fraude en todos los usuarios */
    public function runAnalysis(Request $request)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'No autorizado'], 403);
        $count = self::analyze();
        return response()->json(['message' => "Análisis completado. {$count} alertas nuevas generadas."]);
    }

    /** Lógica de detección — puede llamarse desde comandos también */
    public static function analyze(): int
    {
        $newFlags = 0;

        // 1. Expertos con 2+ disputas en 30 días
        $suspectExperts = \App\Models\Dispute::where('created_at', '>=', now()->subDays(30))
            ->groupBy('service_job_id')
            ->selectRaw('count(*) as cnt, service_job_id')
            ->having('cnt', '>=', 2)
            ->with('serviceJob:id,expert_id')
            ->get()
            ->pluck('serviceJob.expert_id')
            ->unique()
            ->filter();

        foreach ($suspectExperts as $expertId) {
            if (!FraudFlag::where('user_id', $expertId)->where('type', 'multiple_disputes')->where('resolved', false)->exists()) {
                FraudFlag::create([
                    'user_id'     => $expertId,
                    'type'        => 'multiple_disputes',
                    'description' => 'Este experto tiene 2+ disputas en los últimos 30 días.',
                    'severity'    => 'high',
                ]);
                $newFlags++;
            }
        }

        // 2. Clientes con 3+ cancelaciones en 7 días
        $suspectClients = \App\Models\ServiceJob::where('status', 'cancelado')
            ->where('updated_at', '>=', now()->subDays(7))
            ->groupBy('client_id')
            ->selectRaw('count(*) as cnt, client_id')
            ->having('cnt', '>=', 3)
            ->pluck('client_id');

        foreach ($suspectClients as $clientId) {
            if (!FraudFlag::where('user_id', $clientId)->where('type', 'rapid_cancel')->where('resolved', false)->exists()) {
                FraudFlag::create([
                    'user_id'     => $clientId,
                    'type'        => 'rapid_cancel',
                    'description' => 'Este cliente canceló 3+ trabajos en 7 días.',
                    'severity'    => 'medium',
                ]);
                $newFlags++;
            }
        }

        // 3. Pagos sin liberar después de 72h de trabajo completado (posible extorsión)
        $stalledJobs = \App\Models\ServiceJob::where('status', 'asignado')
            ->where('updated_at', '<=', now()->subHours(72))
            ->whereHas('payment', fn($q) => $q->where('status', 'retenido_en_app'))
            ->with('client:id')
            ->get();

        foreach ($stalledJobs as $job) {
            if ($job->client_id && !FraudFlag::where('user_id', $job->client_id)->where('type', 'payment_hold')->where('resolved', false)->exists()) {
                FraudFlag::create([
                    'user_id'     => $job->client_id,
                    'type'        => 'payment_hold',
                    'description' => "Trabajo #{$job->id} tiene pago retenido sin liberar por más de 72 horas.",
                    'severity'    => 'medium',
                ]);
                $newFlags++;
            }
        }

        return $newFlags;
    }
}
