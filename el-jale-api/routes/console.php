<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Mail;
use App\Models\ServiceJob;
use App\Models\User;
use App\Mail\NoBidsReminderMail;
use App\Mail\InactiveExpertMail;
use App\Mail\ReviewReminderMail;
use App\Http\Controllers\FraudDetectionController;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Email: trabajos sin cotizaciones después de 2h ─────────────────
Schedule::call(function () {
    $frontend = config('app.frontend_url', 'https://eljale.maewalliscorp.org');
    $jobs = ServiceJob::where('status', 'buscando')
        ->where('created_at', '<=', now()->subHours(2))
        ->where('created_at', '>=', now()->subHours(6))
        ->whereDoesntHave('bids')
        ->with('client:id,name,email')
        ->get();
    foreach ($jobs as $job) {
        if (!$job->client?->email) continue;
        try { Mail::to($job->client->email)->send(new NoBidsReminderMail($job->client->name, $job->title, $job->id, $frontend)); } catch (\Throwable) {}
    }
})->everyThirtyMinutes()->name('emails:no-bids')->withoutOverlapping();

// ── Email: expertos inactivos 7+ días ─────────────────────────────
Schedule::call(function () {
    $frontend = config('app.frontend_url', 'https://eljale.maewalliscorp.org');
    $experts  = User::where('role', 'expert')
        ->whereHas('expertProfile', fn($q) => $q->where('is_verified', true))
        ->where('updated_at', '<=', now()->subDays(7))
        ->get();
    foreach ($experts as $expert) {
        $count = ServiceJob::where('status', 'buscando')
            ->whereHas('category', fn($q) => $q->where('id', optional($expert->expertProfile)->category_id))
            ->where('created_at', '>=', now()->subDays(3))
            ->count();
        if ($count === 0) continue;
        try { Mail::to($expert->email)->send(new InactiveExpertMail($expert->name, $count, $frontend)); } catch (\Throwable) {}
    }
})->dailyAt('09:00')->name('emails:inactive-experts')->withoutOverlapping();

// ── Email: recordatorio de reseña 24h después ─────────────────────
Schedule::call(function () {
    $frontend = config('app.frontend_url', 'https://eljale.maewalliscorp.org');
    $jobs = ServiceJob::where('status', 'completado')
        ->whereBetween('updated_at', [now()->subHours(48), now()->subHours(24)])
        ->whereDoesntHave('review')
        ->with(['client:id,name,email', 'expert:id,name'])
        ->get();
    foreach ($jobs as $job) {
        if (!$job->client?->email || !$job->expert) continue;
        try { Mail::to($job->client->email)->send(new ReviewReminderMail($job->client->name, $job->expert->name, $job->title, $frontend)); } catch (\Throwable) {}
    }
})->hourly()->name('emails:review-reminder')->withoutOverlapping();

// ── Detección de fraude diaria ────────────────────────────────────
Schedule::call(function () {
    FraudDetectionController::analyze();
})->dailyAt('02:00')->name('fraud:analyze')->withoutOverlapping();
