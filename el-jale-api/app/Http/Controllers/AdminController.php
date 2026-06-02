<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AdminController extends Controller
{
    private function checkAdmin($request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Acceso solo para administradores');
        }
    }

    public function stats(Request $request)
    {
        $this->checkAdmin($request);

        return response()->json([
            'total_users'   => \App\Models\User::count(),
            'total_clients' => \App\Models\User::where('role', 'client')->count(),
            'total_experts' => \App\Models\User::where('role', 'expert')->count(),
            'total_jobs'    => \App\Models\ServiceJob::count(),
            'jobs_buscando' => \App\Models\ServiceJob::where('status', 'buscando')->count(),
            'jobs_asignado' => \App\Models\ServiceJob::where('status', 'asignado')->count(),
            'jobs_completado' => \App\Models\ServiceJob::where('status', 'completado')->count(),
            'total_reviews' => \App\Models\Review::count(),
            'avg_rating'    => round(\App\Models\Review::avg('rating'), 1),
        ]);
    }

    public function users(Request $request)
    {
        $this->checkAdmin($request);

        $users = \App\Models\User::with('expertProfile.category')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($users);
    }

    public function jobs(Request $request)
    {
        $this->checkAdmin($request);

        $jobs = \App\Models\ServiceJob::with(['client:id,name', 'expert:id,name', 'category:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($jobs);
    }

    public function payments(Request $request)
    {
        $this->checkAdmin($request);

        $payments = \App\Models\Payment::with([
            'serviceJob:id,title,status,client_id,expert_id',
            'serviceJob.client:id,name',
            'serviceJob.expert:id,name',
        ])
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        $totals = [
            'retenido'  => \App\Models\Payment::where('status', 'retenido_en_app')->sum('amount'),
            'liberado'  => \App\Models\Payment::where('status', 'liberado_al_experto')->sum('amount'),
            'reembolsado' => \App\Models\Payment::where('status', 'reembolsado')->sum('amount'),
        ];

        return response()->json(['payments' => $payments, 'totals' => $totals]);
    }

    public function verifyExpert(Request $request, $userId)
    {
        $this->checkAdmin($request);

        $profile = \App\Models\ExpertProfile::where('user_id', $userId)->firstOrFail();
        $profile->update(['is_verified' => true]);

        return response()->json(['message' => 'Experto verificado correctamente.']);
    }

    public function rejectExpert(Request $request, $userId)
    {
        $this->checkAdmin($request);

        $profile = \App\Models\ExpertProfile::where('user_id', $userId)->firstOrFail();
        $profile->update(['is_verified' => false]);

        return response()->json(['message' => 'Verificación revocada.']);
    }
}
