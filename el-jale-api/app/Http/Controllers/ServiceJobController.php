<?php

namespace App\Http\Controllers;

use App\Models\ServiceJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Models\Payment;
use App\Mail\JobAcceptedMail;
use App\Mail\PaymentReleasedMail;
use App\Helpers\Notify;

class ServiceJobController extends Controller
{
    public function availableJobs(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'expert') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $user->load('expertProfile');
        $profile = $user->expertProfile;

        if (!$profile) {
            return response()->json([], 200); // sin perfil → sin trabajos disponibles
        }

        $categoryId = $profile->category_id;

        $query = ServiceJob::with('client:id,name')
            ->where('category_id', $categoryId)
            ->where('status', 'buscando');

        // Filtrar por radio si el experto tiene coordenadas y el trabajo también
        if ($profile->latitude && $profile->longitude && $profile->coverage_radius_km) {
            $lat = $profile->latitude;
            $lng = $profile->longitude;
            $r   = $profile->coverage_radius_km;
            // Fórmula Haversine aproximada en SQL
            $query->where(function ($q) use ($lat, $lng, $r) {
                $q->whereNull('latitude')  // sin coordenadas → mostrar siempre
                  ->orWhereRaw(
                    '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) <= ?',
                    [$lat, $lng, $lat, $r]
                );
            });
        } elseif ($profile->city) {
            // Fallback por ciudad si no hay coords
            $query->where(function ($q) use ($profile) {
                $q->whereNull('city')->orWhere('city', 'ilike', '%' . $profile->city . '%');
            });
        }

        // Urgentes primero, luego más recientes
        $jobs = $query->orderByRaw("CASE WHEN urgency = 'urgente' THEN 0 ELSE 1 END")->latest()->get();

        return response()->json($jobs, 200);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Solo los clientes pueden publicar trabajos'], 403);
        }

        $request->validate([
            'category_id'    => 'required|exists:categories,id',
            'title'          => 'required|string|max:255',
            'description'    => 'required|string',
            'budget'         => 'nullable|numeric|min:0',
            'address'        => 'nullable|string|max:500',
            'preferred_date' => 'nullable|date|after_or_equal:today',
            'preferred_time' => 'nullable|date_format:H:i',
            'urgency'        => 'nullable|in:normal,urgente',
            'latitude'       => 'nullable|numeric|between:-90,90',
            'longitude'      => 'nullable|numeric|between:-180,180',
            'city'           => 'nullable|string|max:100',
            'photos'         => 'nullable|array|max:5',
            'photos.*'       => 'image|max:5120',
        ]);

        $photoPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $photoPaths[] = $photo->store('job-photos', 'public');
            }
        }

        $job = ServiceJob::create([
            'client_id'      => $user->id,
            'category_id'    => $request->category_id,
            'title'          => $request->title,
            'description'    => $request->description,
            'budget'         => $request->budget,
            'address'        => $request->address,
            'preferred_date' => $request->preferred_date,
            'preferred_time' => $request->preferred_time,
            'urgency'        => $request->urgency ?? 'normal',
            'latitude'       => $request->latitude,
            'longitude'      => $request->longitude,
            'city'           => $request->city,
            'client_photos'  => $photoPaths ?: null,
            'status'         => 'buscando',
        ]);

        if ($request->budget > 0) {
            Payment::create([
                'service_job_id' => $job->id,
                'amount'         => $request->budget,
                'status'         => 'retenido_en_app',
            ]);
        }

        return response()->json($job->load('payment'), 201);
    }

    public function acceptJob(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'expert') {
            return response()->json(['message' => 'Solo los expertos pueden aceptar trabajos'], 403);
        }

        $job = ServiceJob::findOrFail($id);

        if ($job->status !== 'buscando') {
            return response()->json(['message' => 'Este trabajo ya fue tomado o no está disponible'], 400);
        }

        $job->update(['expert_id' => $user->id, 'status' => 'asignado']);
        $job->load('client');

        // Notificación en app al cliente
        Notify::send(
            $job->client_id,
            'job_assigned',
            '¡Experto encontrado!',
            "{$user->name} aceptó tu solicitud: «{$job->title}».",
            $job->id,
            'ServiceJob'
        );

        try {
            Mail::to($job->client->email)->send(new JobAcceptedMail($job, $user));
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => '¡Felicidades! El trabajo ha sido asignado a ti.',
            'job'     => $job,
        ], 200);
    }

    public function cancelJob(Request $request, $id)
    {
        $user = Auth::user();
        $job  = ServiceJob::with('payment')->findOrFail($id);

        if ($user->id !== $job->client_id && $user->id !== $job->expert_id) {
            return response()->json(['message' => 'No tienes permiso para cancelar este trabajo'], 403);
        }

        if (!in_array($job->status, ['buscando', 'asignado'])) {
            return response()->json(['message' => 'Solo se pueden cancelar trabajos en curso'], 400);
        }

        if ($job->payment && $job->payment->status === 'retenido_en_app') {
            $job->payment->update(['status' => 'reembolsado']);
        }

        $job->update(['status' => 'cancelado']);

        // Notificar a la otra parte
        $otherUserId = $user->id === $job->client_id ? $job->expert_id : $job->client_id;
        if ($otherUserId) {
            Notify::send(
                $otherUserId,
                'job_cancelled',
                'Trabajo cancelado',
                "El trabajo «{$job->title}» fue cancelado.",
                $job->id,
                'ServiceJob'
            );
        }

        return response()->json([
            'message' => 'Trabajo cancelado. El pago retenido (si había) fue devuelto al cliente.',
            'job'     => $job,
        ], 200);
    }

    public function myJobs(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $jobs = ServiceJob::with(['category:id,name', 'expert:id,name', 'payment', 'review', 'dispute'])
            ->where('client_id', $user->id)
            ->latest()
            ->get();

        return response()->json($jobs, 200);
    }

    public function myActiveJobs(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'expert') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $jobs = ServiceJob::with(['category:id,name', 'client:id,name', 'payment', 'review', 'dispute'])
            ->where('expert_id', $user->id)
            ->latest()
            ->get();

        return response()->json($jobs, 200);
    }

    public function uploadExpertPhotos(Request $request, $id)
    {
        $user = Auth::user();
        $job  = ServiceJob::findOrFail($id);

        if ($user->id !== $job->expert_id) {
            return response()->json(['message' => 'Solo el experto asignado puede subir fotos'], 403);
        }

        if ($job->status !== 'asignado') {
            return response()->json(['message' => 'El trabajo no está en progreso'], 400);
        }

        $request->validate([
            'photos'   => 'required|array|min:1|max:5',
            'photos.*' => 'image|max:5120',
        ]);

        $photoPaths = [];
        foreach ($request->file('photos') as $photo) {
            $photoPaths[] = $photo->store('job-photos', 'public');
        }

        $existing = $job->expert_photos ?? [];
        $job->update(['expert_photos' => array_merge($existing, $photoPaths)]);

        // Notificar al cliente
        Notify::send(
            $job->client_id,
            'evidence_uploaded',
            'Fotos de evidencia subidas',
            "El experto subió fotos de avance en «{$job->title}».",
            $job->id,
            'ServiceJob'
        );

        return response()->json([
            'message'      => 'Fotos subidas correctamente.',
            'expert_photos' => $job->expert_photos,
        ], 200);
    }

    public function notifications(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'client') {
            $count = ServiceJob::where('client_id', $user->id)
                ->where('status', 'asignado')
                ->count();
            return response()->json(['pending' => $count]);
        }

        if ($user->role === 'expert') {
            $user->load('expertProfile');
            if (!$user->expertProfile) {
                return response()->json(['pending' => 0]);
            }
            $count = ServiceJob::where('category_id', $user->expertProfile->category_id)
                ->where('status', 'buscando')
                ->count();
            return response()->json(['pending' => $count]);
        }

        return response()->json(['pending' => 0]);
    }

    public function releasePayment(Request $request, $id)
    {
        $user = Auth::user();
        $job  = ServiceJob::with('payment')->findOrFail($id);

        if ($user->id !== $job->client_id) {
            return response()->json(['message' => 'Solo el creador del trabajo puede liberar el pago'], 403);
        }

        if ($job->status !== 'asignado') {
            return response()->json(['message' => 'El trabajo no está en progreso'], 400);
        }

        if (!$job->payment || $job->payment->status !== 'retenido_en_app') {
            return response()->json(['message' => 'No hay fondos retenidos para liberar'], 400);
        }

        $job->payment->update(['status' => 'liberado_al_experto']);
        $job->update(['status' => 'completado']);

        $job->load('expert');

        // Notificar al experto
        Notify::send(
            $job->expert_id,
            'payment_released',
            '¡Pago liberado!',
            "El cliente confirmó el trabajo «{$job->title}». Tu pago fue liberado.",
            $job->id,
            'ServiceJob'
        );

        try {
            Mail::to($job->expert->email)->send(new PaymentReleasedMail($job, $job->expert));
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => '¡Pago liberado exitosamente! El experto recibirá su dinero pronto.',
            'job'     => $job,
        ], 200);
    }

    // Estadísticas del cliente
    public function clientStats(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'client') return response()->json(['message' => 'Acceso denegado'], 403);

        $totalJobs      = ServiceJob::where('client_id', $user->id)->count();
        $completedJobs  = ServiceJob::where('client_id', $user->id)->where('status', 'completado')->count();
        $activeJobs     = ServiceJob::where('client_id', $user->id)->where('status', 'asignado')->count();
        $totalSpent     = Payment::whereHas('serviceJob', fn($q) => $q->where('client_id', $user->id))
                            ->where('status', 'liberado_al_experto')->sum('amount');
        $pendingPayment = Payment::whereHas('serviceJob', fn($q) => $q->where('client_id', $user->id))
                            ->where('status', 'retenido_en_app')->sum('amount');

        return response()->json([
            'total_jobs'      => $totalJobs,
            'completed_jobs'  => $completedJobs,
            'active_jobs'     => $activeJobs,
            'total_spent'     => (float) $totalSpent,
            'pending_payment' => (float) $pendingPayment,
        ]);
    }
}
