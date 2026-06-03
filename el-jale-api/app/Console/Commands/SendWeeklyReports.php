<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\ExpertProfile;
use App\Models\ServiceJob;
use App\Models\WeeklyReportLog;
use App\Mail\WeeklyReportMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

class SendWeeklyReports extends Command
{
    protected $signature   = 'reports:weekly';
    protected $description = 'Envía reporte semanal de actividad a cada experto';

    public function handle(): void
    {
        $weekStart = now()->startOfWeek()->toDateString();

        $experts = User::where('role', 'expert')
            ->whereHas('expertProfile')
            ->get();

        foreach ($experts as $expert) {
            // Evitar doble envío
            if (WeeklyReportLog::where('user_id', $expert->id)->where('week_start', $weekStart)->exists()) {
                continue;
            }

            $profile = $expert->expertProfile;

            $data = [
                'name'            => $expert->name,
                'week_start'      => $weekStart,
                'profile_views'   => 0, // placeholder — implementar tracking de vistas si se desea
                'jobs_completed'  => ServiceJob::where('expert_id', $expert->id)
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [now()->startOfWeek(), now()->endOfWeek()])
                    ->count(),
                'jobs_available'  => ServiceJob::where('status', 'open')
                    ->where('category_id', $profile->category_id ?? 0)
                    ->count(),
                'total_earned'    => DB::table('payments')
                    ->where('expert_id', $expert->id)
                    ->where('status', 'released')
                    ->whereBetween('updated_at', [now()->startOfWeek(), now()->endOfWeek()])
                    ->sum('amount'),
                'average_rating'  => $profile->average_rating ?? 0,
                'total_reviews'   => $profile->total_reviews ?? 0,
                'is_premium'      => $profile->is_premium ?? false,
                'bids_sent'       => DB::table('job_bids')
                    ->where('expert_id', $expert->id)
                    ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                    ->count(),
            ];

            try {
                Mail::to($expert->email)->send(new WeeklyReportMail($data));

                WeeklyReportLog::create([
                    'user_id'    => $expert->id,
                    'week_start' => $weekStart,
                    'data'       => $data,
                ]);

                $this->info("Reporte enviado a {$expert->email}");
            } catch (\Throwable $e) {
                $this->warn("Error con {$expert->email}: " . $e->getMessage());
            }
        }

        $this->info('Reportes semanales completados.');
    }
}
