<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ServiceJob;
use App\Models\Payment;
use App\Models\Review;
use App\Models\ExpertProfile;
use App\Models\Message;

class AdminController extends Controller
{
    private function checkAdmin($request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Acceso solo para administradores');
        }
    }

    // ── ESTADÍSTICAS ──────────────────────────────────────────────
    public function stats(Request $request)
    {
        $this->checkAdmin($request);

        // Actividad reciente (últimos 10 eventos)
        $recentJobs = ServiceJob::with(['client:id,name', 'category:id,name'])
            ->latest()->take(5)->get()
            ->map(fn($j) => [
                'type'    => 'job',
                'icon'    => '🔧',
                'text'    => "{$j->client->name} publicó \"{$j->title}\"",
                'status'  => $j->status,
                'time'    => $j->created_at->diffForHumans(),
            ]);

        $recentReviews = Review::with(['client:id,name', 'expert:id,name'])
            ->latest()->take(5)->get()
            ->map(fn($r) => [
                'type'   => 'review',
                'icon'   => '⭐',
                'text'   => "{$r->client->name} calificó a {$r->expert->name} con {$r->rating}/5",
                'status' => null,
                'time'   => $r->created_at->diffForHumans(),
            ]);

        $activity = $recentJobs->concat($recentReviews)
            ->sortByDesc('time')->take(8)->values();

        // Trabajos por día (últimos 14 días)
        $jobsByDay = ServiceJob::selectRaw("DATE(created_at) as date, COUNT(*) as total")
            ->where('created_at', '>=', now()->subDays(13))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Revenue por mes (últimos 6 meses)
        $revenueByMonth = Payment::selectRaw("TO_CHAR(created_at, 'YYYY-MM') as month, SUM(amount) as revenue, COUNT(*) as count")
            ->where('status', 'liberado_al_experto')
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Tasa de conversión (completados / publicados en últimos 30 días)
        $jobsLast30     = ServiceJob::where('created_at', '>=', now()->subDays(30))->count();
        $completedLast30 = ServiceJob::where('status', 'completado')
            ->where('updated_at', '>=', now()->subDays(30))->count();
        $conversionRate = $jobsLast30 > 0 ? round($completedLast30 / $jobsLast30 * 100, 1) : 0;

        // Top 5 expertos por ingresos
        $topExperts = Payment::selectRaw('service_jobs.expert_id, SUM(payments.expert_amount) as earned, COUNT(*) as jobs')
            ->join('service_jobs', 'service_jobs.id', '=', 'payments.service_job_id')
            ->where('payments.status', 'liberado_al_experto')
            ->whereNotNull('service_jobs.expert_id')
            ->groupBy('service_jobs.expert_id')
            ->orderByDesc('earned')
            ->take(5)
            ->get()
            ->map(function ($row) {
                $expert = User::find($row->expert_id);
                return [
                    'name'   => $expert?->name ?? 'Desconocido',
                    'earned' => (float) $row->earned,
                    'jobs'   => $row->jobs,
                ];
            });

        // Nuevos usuarios por mes (últimos 6 meses)
        $usersByMonth = User::selectRaw("TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count, role")
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month', 'role')
            ->orderBy('month')
            ->get()
            ->groupBy('month')
            ->map(fn($g) => [
                'month'   => $g->first()['month'],
                'clients' => $g->where('role', 'client')->sum('count'),
                'experts' => $g->where('role', 'expert')->sum('count'),
            ])->values();

        // Premium activos
        $premiumExperts = ExpertProfile::where('is_premium', true)
            ->where('premium_expires_at', '>', now())->count();

        // Revenue premium
        $revenuePremium = 0; // Calcular cuando haya datos reales de MP

        return response()->json([
            'total_users'      => User::count(),
            'total_clients'    => User::where('role', 'client')->count(),
            'total_experts'    => User::where('role', 'expert')->count(),
            'experts_pending'  => ExpertProfile::where('is_verified', false)->where('verification_status', 'documentos_enviados')->count(),
            'experts_premium'  => $premiumExperts,
            'total_jobs'       => ServiceJob::count(),
            'jobs_buscando'    => ServiceJob::where('status', 'buscando')->count(),
            'jobs_asignado'    => ServiceJob::where('status', 'asignado')->count(),
            'jobs_completado'  => ServiceJob::where('status', 'completado')->count(),
            'jobs_cancelado'   => ServiceJob::where('status', 'cancelado')->count(),
            'total_reviews'    => Review::count(),
            'avg_rating'       => round(Review::avg('rating') ?? 0, 1),
            'revenue_total'    => (float) Payment::where('status', 'liberado_al_experto')->sum('amount'),
            'revenue_escrow'   => (float) Payment::where('status', 'retenido_en_app')->sum('amount'),
            'revenue_by_month' => $revenueByMonth,
            'conversion_rate'  => $conversionRate,
            'top_experts'      => $topExperts,
            'users_by_month'   => $usersByMonth,
            'activity'         => $activity,
            'jobs_by_day'      => $jobsByDay,
        ]);
    }

    // ── USUARIOS ──────────────────────────────────────────────────
    public function users(Request $request)
    {
        $this->checkAdmin($request);

        $q = User::with('expertProfile.category');

        if ($request->search) {
            $q->where(fn($w) =>
                $w->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%")
            );
        }
        if ($request->role) {
            $q->where('role', $request->role);
        }
        if ($request->verified !== null && $request->verified !== '') {
            $verified = filter_var($request->verified, FILTER_VALIDATE_BOOLEAN);
            $q->whereHas('expertProfile', fn($w) => $w->where('is_verified', $verified));
        }

        return response()->json($q->orderBy('created_at', 'desc')->paginate(15));
    }

    // Detalle de un usuario
    public function userDetail(Request $request, $id)
    {
        $this->checkAdmin($request);

        $user = User::with(['expertProfile.category'])->findOrFail($id);

        $jobCount      = ServiceJob::where('client_id', $id)->orWhere('expert_id', $id)->count();
        $completedJobs = ServiceJob::where('expert_id', $id)->where('status', 'completado')->count();
        $reviews       = Review::with('job:id,title')
            ->where('expert_id', $id)->latest()->take(5)->get();
        $earned        = Payment::whereHas('serviceJob', fn($q) =>
            $q->where('expert_id', $id)
        )->where('status', 'liberado_al_experto')->sum('amount');

        return response()->json([
            'user'          => $user,
            'job_count'     => $jobCount,
            'completed_jobs'=> $completedJobs,
            'reviews'       => $reviews,
            'total_earned'  => (float) $earned,
        ]);
    }

    // Activar / desactivar usuario (usando campo email_verified_at como proxy)
    public function toggleUser(Request $request, $id)
    {
        $this->checkAdmin($request);

        $user = User::findOrFail($id);
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'No puedes desactivarte a ti mismo'], 400);
        }

        $active = !is_null($user->email_verified_at);
        $user->update(['email_verified_at' => $active ? null : now()]);

        return response()->json([
            'message' => $active ? 'Usuario desactivado.' : 'Usuario activado.',
            'active'  => !$active,
        ]);
    }

    // ── TRABAJOS ──────────────────────────────────────────────────
    public function jobs(Request $request)
    {
        $this->checkAdmin($request);

        $q = ServiceJob::with(['client:id,name', 'expert:id,name', 'category:id,name']);

        if ($request->search) {
            $q->where('title', 'ilike', "%{$request->search}%");
        }
        if ($request->status) {
            $q->where('status', $request->status);
        }
        if ($request->category_id) {
            $q->where('category_id', $request->category_id);
        }

        return response()->json($q->orderBy('created_at', 'desc')->paginate(15));
    }

    // Detalle completo de un trabajo
    public function jobDetail(Request $request, $id)
    {
        $this->checkAdmin($request);

        $job = ServiceJob::with([
            'client:id,name,email',
            'expert:id,name,email',
            'category:id,name',
            'payment',
            'review.client:id,name',
            'messages.sender:id,name,role',
        ])->findOrFail($id);

        return response()->json($job);
    }

    // ── PAGOS ─────────────────────────────────────────────────────
    public function payments(Request $request)
    {
        $this->checkAdmin($request);

        $q = Payment::with([
            'serviceJob:id,title,status,client_id,expert_id',
            'serviceJob.client:id,name',
            'serviceJob.expert:id,name',
        ]);

        if ($request->status) {
            $q->where('status', $request->status);
        }

        $payments = $q->orderBy('created_at', 'desc')->paginate(15);

        $totals = [
            'retenido'    => Payment::where('status', 'retenido_en_app')->sum('amount'),
            'liberado'    => Payment::where('status', 'liberado_al_experto')->sum('amount'),
            'reembolsado' => Payment::where('status', 'reembolsado')->sum('amount'),
        ];

        return response()->json(['payments' => $payments, 'totals' => $totals]);
    }

    // ── EXPORTAR CSV ──────────────────────────────────────────────
    public function exportJobs(Request $request)
    {
        $this->checkAdmin($request);

        $jobs = ServiceJob::with(['client:id,name', 'expert:id,name', 'category:id,name', 'payment'])
            ->orderBy('created_at', 'desc')->get();

        $csv = "ID,Título,Categoría,Cliente,Experto,Presupuesto,Estado,Pago,Fecha\n";
        foreach ($jobs as $j) {
            $csv .= implode(',', [
                $j->id,
                '"' . str_replace('"', '""', $j->title) . '"',
                $j->category?->name ?? '',
                $j->client?->name ?? '',
                $j->expert?->name ?? '',
                $j->budget ?? '',
                $j->status,
                $j->payment?->status ?? '',
                $j->created_at->format('Y-m-d'),
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="jales_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    public function exportUsers(Request $request)
    {
        $this->checkAdmin($request);

        $users = User::with('expertProfile.category')->orderBy('created_at', 'desc')->get();

        $csv = "ID,Nombre,Email,Rol,Oficio,Verificado,Registro\n";
        foreach ($users as $u) {
            $csv .= implode(',', [
                $u->id,
                '"' . str_replace('"', '""', $u->name) . '"',
                $u->email,
                $u->role,
                $u->expertProfile?->category?->name ?? '',
                $u->expertProfile ? ($u->expertProfile->is_verified ? 'Sí' : 'No') : '',
                $u->created_at->format('Y-m-d'),
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="usuarios_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    // ── VERIFICACIÓN ──────────────────────────────────────────────
    public function disputes(Request $request)
    {
        $this->checkAdmin($request);
        $disputes = \App\Models\Dispute::with([
            'job:id,title,status',
            'reporter:id,name,role',
        ])->orderBy('created_at', 'desc')->paginate(15);
        return response()->json($disputes);
    }

    public function resolveDispute(Request $request, $id)
    {
        $this->checkAdmin($request);
        $request->validate([
            'status'      => 'required|in:en_revision,resuelta,cerrada',
            'admin_notes' => 'nullable|string|max:1000',
        ]);
        $dispute = \App\Models\Dispute::findOrFail($id);
        $dispute->update(['status' => $request->status, 'admin_notes' => $request->admin_notes]);
        return response()->json(['message' => 'Disputa actualizada.']);
    }

    public function verifyExpert(Request $request, $userId)
    {
        $this->checkAdmin($request);
        ExpertProfile::where('user_id', $userId)->firstOrFail()->update(['is_verified' => true]);
        return response()->json(['message' => 'Experto verificado correctamente.']);
    }

    public function rejectExpert(Request $request, $userId)
    {
        $this->checkAdmin($request);
        ExpertProfile::where('user_id', $userId)->firstOrFail()->update(['is_verified' => false]);
        return response()->json(['message' => 'Verificación revocada.']);
    }
}
