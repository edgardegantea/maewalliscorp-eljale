<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\ServiceJob;
use App\Models\Payment;
use App\Models\Review;
use App\Models\ExpertProfile;
use App\Models\Message;
use App\Models\UserNotification;
use App\Helpers\Notify;

class AdminController extends Controller
{
    private function checkAdmin($request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Acceso solo para administradores');
        }
    }

    // ── ESTADÍSTICAS COMPLETAS ────────────────────────────────────
    public function stats(Request $request)
    {
        $this->checkAdmin($request);

        // ── Actividad reciente ──
        $recentJobs = ServiceJob::with(['client:id,name', 'category:id,name'])
            ->latest()->take(5)->get()
            ->map(fn($j) => [
                'type'   => 'job',
                'icon'   => '🔧',
                'text'   => "{$j->client->name} publicó \"{$j->title}\"",
                'status' => $j->status,
                'time'   => $j->created_at->diffForHumans(),
                'raw_time' => $j->created_at,
            ]);

        $recentReviews = Review::with(['client:id,name', 'expert:id,name'])
            ->latest()->take(5)->get()
            ->map(fn($r) => [
                'type'   => 'review',
                'icon'   => '⭐',
                'text'   => "{$r->client->name} calificó a {$r->expert->name} con {$r->rating}/5",
                'status' => null,
                'time'   => $r->created_at->diffForHumans(),
                'raw_time' => $r->created_at,
            ]);

        $recentUsers = User::latest()->take(5)->get()
            ->map(fn($u) => [
                'type'   => 'user',
                'icon'   => $u->role === 'expert' ? '🔧' : '🏠',
                'text'   => "Nuevo {$u->role}: {$u->name}",
                'status' => null,
                'time'   => $u->created_at->diffForHumans(),
                'raw_time' => $u->created_at,
            ]);

        $activity = $recentJobs->concat($recentReviews)->concat($recentUsers)
            ->sortByDesc('raw_time')->take(10)->values()
            ->map(fn($a) => collect($a)->except('raw_time')->toArray());

        // ── Gráficas ──
        $jobsByDay = ServiceJob::selectRaw("DATE(created_at) as date, COUNT(*) as total")
            ->where('created_at', '>=', now()->subDays(13))
            ->groupBy('date')->orderBy('date')->get();

        $revenueByMonth = Payment::selectRaw("TO_CHAR(created_at, 'YYYY-MM') as month, SUM(amount) as revenue, COUNT(*) as count")
            ->where('status', 'liberado_al_experto')
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month')->orderBy('month')->get();

        $usersByMonth = User::selectRaw("TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count, role")
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month', 'role')->orderBy('month')->get()
            ->groupBy('month')
            ->map(fn($g) => [
                'month'   => $g->first()['month'],
                'clients' => $g->where('role', 'client')->sum('count'),
                'experts' => $g->where('role', 'expert')->sum('count'),
            ])->values();

        $jobsByCategory = ServiceJob::selectRaw('category_id, COUNT(*) as total, SUM(CASE WHEN status=\'completado\' THEN 1 ELSE 0 END) as completados')
            ->with('category:id,name')
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->take(8)
            ->get()
            ->map(fn($r) => [
                'category' => $r->category?->name ?? 'Sin categoría',
                'total'    => $r->total,
                'completados' => $r->completados,
            ]);

        $revenueByCategory = Payment::selectRaw('categories.name as category, SUM(payments.amount) as revenue, COUNT(*) as pagos')
            ->join('service_jobs', 'service_jobs.id', '=', 'payments.service_job_id')
            ->join('categories', 'categories.id', '=', 'service_jobs.category_id')
            ->where('payments.status', 'liberado_al_experto')
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->take(6)
            ->get();

        // ── Métricas ──
        $jobsLast30      = ServiceJob::where('created_at', '>=', now()->subDays(30))->count();
        $completedLast30 = ServiceJob::where('status', 'completado')->where('updated_at', '>=', now()->subDays(30))->count();
        $cancelledLast30 = ServiceJob::where('status', 'cancelado')->where('updated_at', '>=', now()->subDays(30))->count();
        $conversionRate  = $jobsLast30 > 0 ? round($completedLast30 / $jobsLast30 * 100, 1) : 0;
        $cancellationRate = $jobsLast30 > 0 ? round($cancelledLast30 / $jobsLast30 * 100, 1) : 0;

        // Tiempo promedio de completion (días)
        $avgCompletionTime = ServiceJob::selectRaw('AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours')
            ->where('status', 'completado')
            ->value('avg_hours');

        // Comisiones recaudadas
        $platformFees = Payment::where('status', 'liberado_al_experto')->sum('platform_fee');

        // Top expertos
        $topExperts = Payment::selectRaw('service_jobs.expert_id, SUM(payments.expert_amount) as earned, COUNT(*) as jobs')
            ->join('service_jobs', 'service_jobs.id', '=', 'payments.service_job_id')
            ->where('payments.status', 'liberado_al_experto')
            ->whereNotNull('service_jobs.expert_id')
            ->groupBy('service_jobs.expert_id')
            ->orderByDesc('earned')
            ->take(5)
            ->get()
            ->map(fn($row) => [
                'name'   => User::find($row->expert_id)?->name ?? 'Desconocido',
                'earned' => (float) $row->earned,
                'jobs'   => $row->jobs,
            ]);

        // Hoy
        $todayJobs  = ServiceJob::whereDate('created_at', today())->count();
        $todayUsers = User::whereDate('created_at', today())->count();
        $todayRev   = Payment::where('status', 'liberado_al_experto')->whereDate('updated_at', today())->sum('amount');

        // Esta semana
        $weekJobs  = ServiceJob::where('created_at', '>=', now()->startOfWeek())->count();
        $weekUsers = User::where('created_at', '>=', now()->startOfWeek())->count();
        $weekRev   = Payment::where('status', 'liberado_al_experto')->where('updated_at', '>=', now()->startOfWeek())->sum('amount');

        return response()->json([
            // Usuarios
            'total_users'         => User::count(),
            'total_clients'       => User::where('role', 'client')->count(),
            'total_experts'       => User::where('role', 'expert')->count(),
            'experts_pending'     => ExpertProfile::where('is_verified', false)->where('verification_status', 'documentos_enviados')->count(),
            'experts_premium'     => ExpertProfile::where('is_premium', true)->where('premium_expires_at', '>', now())->count(),
            'experts_verified'    => ExpertProfile::where('is_verified', true)->count(),
            'phone_verified'      => User::where('phone_verified', true)->count(),

            // Trabajos
            'total_jobs'          => ServiceJob::count(),
            'jobs_buscando'       => ServiceJob::where('status', 'buscando')->count(),
            'jobs_asignado'       => ServiceJob::where('status', 'asignado')->count(),
            'jobs_completado'     => ServiceJob::where('status', 'completado')->count(),
            'jobs_cancelado'      => ServiceJob::where('status', 'cancelado')->count(),

            // Reseñas
            'total_reviews'       => Review::count(),
            'avg_rating'          => round(Review::avg('rating') ?? 0, 1),

            // Revenue
            'revenue_total'       => (float) Payment::where('status', 'liberado_al_experto')->sum('amount'),
            'revenue_escrow'      => (float) Payment::where('status', 'retenido_en_app')->sum('amount'),
            'revenue_refunded'    => (float) Payment::where('status', 'reembolsado')->sum('amount'),
            'platform_fees'       => (float) $platformFees,

            // Hoy / Esta semana
            'today_jobs'          => $todayJobs,
            'today_users'         => $todayUsers,
            'today_revenue'       => (float) $todayRev,
            'week_jobs'           => $weekJobs,
            'week_users'          => $weekUsers,
            'week_revenue'        => (float) $weekRev,

            // Métricas
            'conversion_rate'     => $conversionRate,
            'cancellation_rate'   => $cancellationRate,
            'avg_completion_hours'=> $avgCompletionTime ? round((float) $avgCompletionTime, 1) : null,

            // Gráficas
            'jobs_by_day'         => $jobsByDay,
            'revenue_by_month'    => $revenueByMonth,
            'users_by_month'      => $usersByMonth,
            'jobs_by_category'    => $jobsByCategory,
            'revenue_by_category' => $revenueByCategory,
            'top_experts'         => $topExperts,

            // Actividad
            'activity'            => $activity,

            // Mensajes
            'total_messages'      => Message::count(),
            'total_disputes'      => \App\Models\Dispute::count(),
            'open_disputes'       => \App\Models\Dispute::whereNotIn('status', ['resuelto', 'resuelta', 'cerrada'])->count(),
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
                  ->orWhere('phone', 'ilike', "%{$request->search}%")
            );
        }
        if ($request->role)     $q->where('role', $request->role);
        if ($request->verified !== null && $request->verified !== '') {
            $v = filter_var($request->verified, FILTER_VALIDATE_BOOLEAN);
            $q->whereHas('expertProfile', fn($w) => $w->where('is_verified', $v));
        }
        if ($request->premium) {
            $q->whereHas('expertProfile', fn($w) => $w->where('is_premium', true)->where('premium_expires_at', '>', now()));
        }

        return response()->json($q->orderBy('created_at', 'desc')->paginate($request->per_page ?? 15));
    }

    public function userDetail(Request $request, $id)
    {
        $this->checkAdmin($request);

        $user = User::with(['expertProfile.category'])->findOrFail($id);

        $jobCount      = ServiceJob::where('client_id', $id)->orWhere('expert_id', $id)->count();
        $completedJobs = ServiceJob::where('expert_id', $id)->where('status', 'completado')->count();
        $reviews       = Review::with('job:id,title')->where('expert_id', $id)->latest()->take(5)->get();
        $earned        = Payment::whereHas('serviceJob', fn($q) => $q->where('expert_id', $id))->where('status', 'liberado_al_experto')->sum('amount');
        $spent         = Payment::whereHas('serviceJob', fn($q) => $q->where('client_id', $id))->where('status', 'liberado_al_experto')->sum('amount');
        $recentJobs    = ServiceJob::with('category:id,name')
            ->where(fn($q) => $q->where('client_id', $id)->orWhere('expert_id', $id))
            ->latest()->take(5)->get();
        $notifications = UserNotification::where('user_id', $id)->latest()->take(5)->get();
        $referrals     = \App\Models\ReferralCredit::where('user_id', $id)->with('referredUser:id,name')->count();

        return response()->json([
            'user'           => $user,
            'job_count'      => $jobCount,
            'completed_jobs' => $completedJobs,
            'reviews'        => $reviews,
            'total_earned'   => (float) $earned,
            'total_spent'    => (float) $spent,
            'recent_jobs'    => $recentJobs,
            'notifications'  => $notifications,
            'referrals_count'=> $referrals,
        ]);
    }

    public function toggleUser(Request $request, $id)
    {
        $this->checkAdmin($request);

        $user = User::findOrFail($id);
        if ($user->id === $request->user()->id) return response()->json(['message' => 'No puedes desactivarte a ti mismo'], 400);

        $active = !is_null($user->email_verified_at);
        $user->update(['email_verified_at' => $active ? null : now()]);

        return response()->json(['message' => $active ? 'Usuario desactivado.' : 'Usuario activado.', 'active' => !$active]);
    }

    // ── TRABAJOS ──────────────────────────────────────────────────
    public function jobs(Request $request)
    {
        $this->checkAdmin($request);

        $q = ServiceJob::with(['client:id,name', 'expert:id,name', 'category:id,name']);

        if ($request->search)      $q->where('title', 'ilike', "%{$request->search}%");
        if ($request->status)      $q->where('status', $request->status);
        if ($request->category_id) $q->where('category_id', $request->category_id);
        if ($request->city)        $q->where('city', 'ilike', "%{$request->city}%");

        return response()->json($q->orderBy('created_at', 'desc')->paginate(15));
    }

    public function jobDetail(Request $request, $id)
    {
        $this->checkAdmin($request);

        $job = ServiceJob::with([
            'client:id,name,email,phone',
            'expert:id,name,email,phone',
            'category:id,name',
            'payment',
            'review.client:id,name',
            'messages.sender:id,name,role',
            'bids.expert:id,name',
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

        if ($request->status)   $q->where('status', $request->status);
        if ($request->date_from) $q->where('created_at', '>=', $request->date_from);
        if ($request->date_to)   $q->where('created_at', '<=', $request->date_to . ' 23:59:59');

        $payments = $q->orderBy('created_at', 'desc')->paginate(15);
        $totals   = [
            'retenido'    => (float) Payment::where('status', 'retenido_en_app')->sum('amount'),
            'liberado'    => (float) Payment::where('status', 'liberado_al_experto')->sum('amount'),
            'reembolsado' => (float) Payment::where('status', 'reembolsado')->sum('amount'),
            'fees'        => (float) Payment::where('status', 'liberado_al_experto')->sum('platform_fee'),
        ];

        return response()->json(['payments' => $payments, 'totals' => $totals]);
    }

    // ── DETALLE + ACCIONES DE PAGO ────────────────────────────────
    public function paymentDetail(Request $request, $id)
    {
        $this->checkAdmin($request);

        $payment = Payment::with([
            'serviceJob:id,title,status,budget,client_id,expert_id,category_id,address,created_at',
            'serviceJob.client:id,name,email,phone',
            'serviceJob.expert:id,name,email,phone',
            'serviceJob.category:id,name',
        ])->findOrFail($id);

        return response()->json($payment);
    }

    public function releasePayment(Request $request, $id)
    {
        $this->checkAdmin($request);

        $payment = Payment::with('serviceJob')->findOrFail($id);

        if ($payment->status !== 'retenido_en_app') {
            return response()->json(['message' => 'Solo se pueden liberar pagos retenidos.'], 422);
        }

        // Calcular expert_amount si falta
        $updates = ['status' => 'liberado_al_experto'];
        if ($payment->expert_amount <= 0 && $payment->amount > 0) {
            $fee = round($payment->amount * 0.10, 2);
            $updates['platform_fee']  = $fee;
            $updates['expert_amount'] = round($payment->amount - $fee, 2);
        }
        $payment->update($updates);
        $payment->serviceJob?->update(['status' => 'completado']);

        $expertNet = $payment->fresh()->expert_amount;

        if ($payment->serviceJob?->expert_id) {
            Notify::send($payment->serviceJob->expert_id, 'payment_released',
                '💸 Pago liberado',
                "Se liberó $" . number_format($expertNet, 2) . " MXN de \"{$payment->serviceJob->title}\".",
                $payment->id, 'Payment');
        }

        return response()->json(['message' => 'Pago liberado al experto.']);
    }

    public function refundPayment(Request $request, $id)
    {
        $this->checkAdmin($request);
        $request->validate(['reason' => 'nullable|string|max:300']);

        $payment = Payment::with('serviceJob')->findOrFail($id);

        if (!in_array($payment->status, ['retenido_en_app', 'liberado_al_experto'])) {
            return response()->json(['message' => 'Este pago no se puede reembolsar.'], 422);
        }

        $payment->update(['status' => 'reembolsado']);
        $payment->serviceJob?->update(['status' => 'cancelado']);

        if ($payment->serviceJob?->client_id) {
            Notify::send($payment->serviceJob->client_id, 'payment_refunded',
                '↩️ Reembolso procesado',
                "Se reembolsó el pago de \"{$payment->serviceJob->title}\"." . ($request->reason ? " Motivo: {$request->reason}" : ''),
                $payment->id, 'Payment');
        }

        return response()->json(['message' => 'Pago reembolsado al cliente.']);
    }

    // ── RESEÑAS ───────────────────────────────────────────────────
    public function reviews(Request $request)
    {
        $this->checkAdmin($request);

        $q = Review::with([
            'client:id,name',
            'expert:id,name',
            'job:id,title',
        ]);

        if ($request->min_rating) $q->where('rating', '<=', (int) $request->min_rating);
        if ($request->search)     $q->where('comment', 'ilike', "%{$request->search}%");

        return response()->json($q->orderBy('created_at', 'desc')->paginate(20));
    }

    public function deleteReview(Request $request, $id)
    {
        $this->checkAdmin($request);
        Review::findOrFail($id)->delete();
        return response()->json(['message' => 'Reseña eliminada.']);
    }

    // ── NOTIFICACIONES ────────────────────────────────────────────
    public function notifications(Request $request)
    {
        $this->checkAdmin($request);

        $q = UserNotification::with('user:id,name,role');

        if ($request->type)    $q->where('type', $request->type);
        if ($request->user_id) $q->where('user_id', $request->user_id);

        return response()->json($q->orderBy('created_at', 'desc')->paginate(20));
    }

    public function sendNotification(Request $request)
    {
        $this->checkAdmin($request);
        $request->validate([
            'target'  => 'required|in:all,clients,experts,user',
            'user_id' => 'required_if:target,user|exists:users,id',
            'title'   => 'required|string|max:100',
            'body'    => 'required|string|max:500',
        ]);

        $users = match($request->target) {
            'all'     => User::pluck('id'),
            'clients' => User::where('role', 'client')->pluck('id'),
            'experts' => User::where('role', 'expert')->pluck('id'),
            'user'    => collect([$request->user_id]),
        };

        foreach ($users as $userId) {
            Notify::send($userId, 'admin_broadcast', $request->title, $request->body, null, null);
        }

        return response()->json(['message' => "Notificación enviada a {$users->count()} usuario(s)."]);
    }

    // ── EXPORTAR CSV ──────────────────────────────────────────────
    public function exportJobs(Request $request)
    {
        $this->checkAdmin($request);

        $jobs = ServiceJob::with(['client:id,name', 'expert:id,name', 'category:id,name', 'payment'])
            ->orderBy('created_at', 'desc')->get();

        $csv = "ID,Título,Categoría,Ciudad,Cliente,Experto,Presupuesto,Estado,Pago,Urgencia,Fecha\n";
        foreach ($jobs as $j) {
            $csv .= implode(',', [
                $j->id,
                '"' . str_replace('"', '""', $j->title ?? '') . '"',
                $j->category?->name ?? '',
                $j->city ?? '',
                $j->client?->name ?? '',
                $j->expert?->name ?? '',
                $j->budget ?? '',
                $j->status,
                $j->payment?->status ?? '',
                $j->urgency ?? '',
                $j->created_at->format('Y-m-d'),
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="jales_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    public function exportUsers(Request $request)
    {
        $this->checkAdmin($request);

        $users = User::with('expertProfile.category')->orderBy('created_at', 'desc')->get();

        $csv = "ID,Nombre,Email,Teléfono,Rol,Oficio,Verificado,Premium,Registro\n";
        foreach ($users as $u) {
            $csv .= implode(',', [
                $u->id,
                '"' . str_replace('"', '""', $u->name) . '"',
                $u->email,
                $u->phone ?? '',
                $u->role,
                $u->expertProfile?->category?->name ?? '',
                $u->expertProfile ? ($u->expertProfile->is_verified ? 'Sí' : 'No') : '',
                $u->expertProfile?->is_premium ? 'Sí' : 'No',
                $u->created_at->format('Y-m-d'),
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="usuarios_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    public function exportPayments(Request $request)
    {
        $this->checkAdmin($request);

        $payments = Payment::with([
            'serviceJob:id,title,client_id,expert_id',
            'serviceJob.client:id,name',
            'serviceJob.expert:id,name',
        ])->orderBy('created_at', 'desc')->get();

        $csv = "ID,Trabajo,Cliente,Experto,Monto,Comisión,Monto Experto,Estado,MP ID,Fecha\n";
        foreach ($payments as $p) {
            $csv .= implode(',', [
                $p->id,
                '"' . str_replace('"', '""', $p->serviceJob?->title ?? '') . '"',
                $p->serviceJob?->client?->name ?? '',
                $p->serviceJob?->expert?->name ?? '',
                $p->amount,
                $p->platform_fee ?? 0,
                $p->expert_amount ?? 0,
                $p->status,
                $p->mp_payment_id ?? '',
                $p->created_at->format('Y-m-d'),
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="pagos_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    // ── DISPUTAS ──────────────────────────────────────────────────
    public function disputes(Request $request)
    {
        $this->checkAdmin($request);

        $q = \App\Models\Dispute::with([
            'job:id,title,status,budget,client_id,expert_id',
            'job.client:id,name',
            'job.expert:id,name',
            'job.payment:id,service_job_id,amount,status',
            'reporter:id,name,role',
        ]);

        if ($request->status) $q->where('status', $request->status);

        return response()->json($q->orderBy('created_at', 'desc')->paginate(15));
    }

    public function resolveDispute(Request $request, $id)
    {
        $this->checkAdmin($request);
        $request->validate([
            'resolution'  => 'required|string|max:1000',
            'status'      => 'nullable|in:resuelto,resuelta,cerrada,en_revision',
        ]);
        $dispute = \App\Models\Dispute::findOrFail($id);
        $dispute->update([
            'status'      => $request->status ?? 'resuelto',
            'admin_notes' => $request->resolution,
            'resolution'  => $request->resolution,
        ]);

        // Notificar a ambas partes
        if ($dispute->job?->client_id) {
            Notify::send($dispute->job->client_id, 'dispute_resolved', '⚖️ Disputa resuelta',
                "Tu disputa sobre \"{$dispute->job->title}\" ha sido resuelta.", $dispute->id, 'Dispute');
        }
        if ($dispute->job?->expert_id) {
            Notify::send($dispute->job->expert_id, 'dispute_resolved', '⚖️ Disputa resuelta',
                "La disputa sobre \"{$dispute->job->title}\" ha sido resuelta.", $dispute->id, 'Dispute');
        }

        return response()->json(['message' => 'Disputa resuelta.']);
    }

    // ── VERIFICACIÓN ──────────────────────────────────────────────
    public function verifyExpert(Request $request, $userId)
    {
        $this->checkAdmin($request);
        ExpertProfile::where('user_id', $userId)->firstOrFail()->update([
            'is_verified'         => true,
            'verification_status' => 'verificado',
            'verified_at'         => now(),
        ]);
        Notify::send($userId, 'expert_verified', '✅ ¡Estás verificado!',
            'Tu perfil fue verificado por el equipo de El Jale. ¡Ya puedes recibir trabajos!', null, null);
        return response()->json(['message' => 'Experto verificado correctamente.']);
    }

    public function rejectExpert(Request $request, $userId)
    {
        $this->checkAdmin($request);
        ExpertProfile::where('user_id', $userId)->firstOrFail()->update([
            'is_verified'         => false,
            'verification_status' => 'sin_documentos',
        ]);
        return response()->json(['message' => 'Verificación revocada.']);
    }
}
