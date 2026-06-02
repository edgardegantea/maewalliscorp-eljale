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

class ServiceJobController extends Controller
{
    // Método para que los expertos vean los trabajos disponibles
    public function availableJobs(Request $request)
    {
        $user = Auth::user();
        
        // Verificamos que sea un experto
        if ($user->role !== 'expert') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        // Cargamos el perfil para saber su categoría
        $user->load('expertProfile');
        $categoryId = $user->expertProfile->category_id;

        // Retornamos trabajos "buscando" que coincidan con su oficio
        $jobs = ServiceJob::with('client:id,name')
            ->where('category_id', $categoryId)
            ->where('status', 'buscando')
            ->latest()
            ->get();

        return response()->json($jobs, 200);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Solo los clientes pueden publicar trabajos'], 403);
        }

        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'budget' => 'nullable|numeric|min:0',
            'address' => 'nullable|string|max:500',
            'photos' => 'nullable|array|max:5',
            'photos.*' => 'image|max:5120',
        ]);

        $photoPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $photoPaths[] = $photo->store('job-photos', 'public');
            }
        }

        $job = ServiceJob::create([
            'client_id' => $user->id,
            'category_id' => $request->category_id,
            'title' => $request->title,
            'description' => $request->description,
            'budget' => $request->budget,
            'address' => $request->address,
            'client_photos' => $photoPaths ?: null,
            'status' => 'buscando'
        ]);

        // SIMULACIÓN DE ESCROW: Si el cliente puso presupuesto, retenemos el dinero virtualmente
        if ($request->budget > 0) {
            Payment::create([
                'service_job_id' => $job->id,
                'amount' => $request->budget,
                'status' => 'retenido_en_app'
            ]);
        }

        return response()->json($job->load('payment'), 201);
    }

    // Método para que el experto acepte un trabajo
    public function acceptJob(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'expert') {
            return response()->json(['message' => 'Solo los expertos pueden aceptar trabajos'], 403);
        }

        $job = ServiceJob::findOrFail($id);

        // Verificamos que el trabajo siga disponible
        if ($job->status !== 'buscando') {
            return response()->json(['message' => 'Este trabajo ya fue tomado o no está disponible'], 400);
        }

        // Asignamos el trabajo al experto y cambiamos el estado
        $job->update([
            'expert_id' => $user->id,
            'status'    => 'asignado',
        ]);

        // Notificar al cliente por email
        $job->load('client');
        Mail::to($job->client->email)
            ->send(new JobAcceptedMail($job, $user));

        return response()->json([
            'message' => '¡Felicidades! El trabajo ha sido asignado a ti.',
            'job'     => $job,
        ], 200);
    }


    // Cancelar un trabajo
    public function cancelJob(Request $request, $id)
    {
        $user = Auth::user();
        $job  = ServiceJob::with('payment')->findOrFail($id);

        // Solo el cliente dueño o el experto asignado pueden cancelar
        if ($user->id !== $job->client_id && $user->id !== $job->expert_id) {
            return response()->json(['message' => 'No tienes permiso para cancelar este trabajo'], 403);
        }

        if (!in_array($job->status, ['buscando', 'asignado'])) {
            return response()->json(['message' => 'Solo se pueden cancelar trabajos en curso'], 400);
        }

        // Si había pago retenido, se devuelve al cliente
        if ($job->payment && $job->payment->status === 'retenido_en_app') {
            $job->payment->update(['status' => 'reembolsado']);
        }

        $job->update(['status' => 'cancelado']);

        return response()->json([
            'message' => 'Trabajo cancelado. El pago retenido (si había) fue devuelto al cliente.',
            'job'     => $job,
        ], 200);
    }

    // Trabajos publicados por el cliente autenticado
    public function myJobs(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'client') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $jobs = ServiceJob::with(['category:id,name', 'expert:id,name', 'payment', 'review'])
            ->where('client_id', $user->id)
            ->latest()
            ->get();

        return response()->json($jobs, 200);
    }

    // Trabajos aceptados por el experto autenticado
    public function myActiveJobs(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'expert') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $jobs = ServiceJob::with(['category:id,name', 'client:id,name', 'payment', 'review'])
            ->where('expert_id', $user->id)
            ->latest()
            ->get();

        return response()->json($jobs, 200);
    }

    // El experto sube fotos de evidencia de trabajo terminado
    public function uploadExpertPhotos(Request $request, $id)
    {
        $user = Auth::user();
        $job = ServiceJob::findOrFail($id);

        if ($user->id !== $job->expert_id) {
            return response()->json(['message' => 'Solo el experto asignado puede subir fotos'], 403);
        }

        if ($job->status !== 'asignado') {
            return response()->json(['message' => 'El trabajo no está en progreso'], 400);
        }

        $request->validate([
            'photos' => 'required|array|min:1|max:5',
            'photos.*' => 'image|max:5120',
        ]);

        $photoPaths = [];
        foreach ($request->file('photos') as $photo) {
            $photoPaths[] = $photo->store('job-photos', 'public');
        }

        $existing = $job->expert_photos ?? [];
        $job->update(['expert_photos' => array_merge($existing, $photoPaths)]);

        return response()->json([
            'message' => 'Fotos subidas correctamente.',
            'expert_photos' => array_map(fn($p) => Storage::url($p), $job->expert_photos),
        ], 200);
    }

    // Notificaciones pendientes para el usuario autenticado
    public function notifications(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'client') {
            // Trabajos del cliente que pasaron a "asignado" (experto encontrado)
            $count = ServiceJob::where('client_id', $user->id)
                ->where('status', 'asignado')
                ->count();

            return response()->json(['pending' => $count]);
        }

        if ($user->role === 'expert') {
            $user->load('expertProfile');
            $count = ServiceJob::where('category_id', $user->expertProfile->category_id)
                ->where('status', 'buscando')
                ->count();

            return response()->json(['pending' => $count]);
        }

        return response()->json(['pending' => 0]);
    }

    // Método para que el cliente libere el dinero retenido
    public function releasePayment(Request $request, $id)
    {
        $user = Auth::user();
        $job = ServiceJob::with('payment')->findOrFail($id);

        // Validaciones de seguridad
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

        // Notificar al experto por email
        $job->load('expert');
        Mail::to($job->expert->email)
            ->send(new PaymentReleasedMail($job, $job->expert));

        return response()->json([
            'message' => '¡Pago liberado exitosamente! El experto recibirá su dinero pronto.',
            'job'     => $job,
        ], 200);
    }


}