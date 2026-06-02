<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\JobBid;
use App\Models\ServiceJob;
use App\Models\Payment;
use App\Helpers\Notify;
use Illuminate\Support\Facades\Mail;
use App\Mail\BidReceivedMail;

class JobBidController extends Controller
{
    // Experto envía una cotización
    public function store(Request $request, $jobId)
    {
        $user = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Solo expertos pueden cotizar'], 403);

        $job = ServiceJob::findOrFail($jobId);
        if ($job->status !== 'buscando')
            return response()->json(['message' => 'Este trabajo ya no acepta cotizaciones'], 400);

        if (JobBid::where('service_job_id', $jobId)->where('expert_id', $user->id)->exists())
            return response()->json(['message' => 'Ya enviaste una cotización para este trabajo'], 400);

        $request->validate([
            'message' => 'required|string|max:500',
            'amount'  => 'nullable|numeric|min:0',
        ]);

        $user->load('expertProfile');
        $bid = JobBid::create([
            'service_job_id' => $jobId,
            'expert_id'      => $user->id,
            'message'        => $request->message,
            'amount'         => $request->amount,
        ]);

        // Notificar al cliente
        Notify::send(
            $job->client_id,
            'bid_received',
            'Nueva cotización recibida',
            "{$user->name} envió una cotización para «{$job->title}»." . ($request->amount ? " Monto: \${$request->amount}" : ''),
            $job->id,
            'ServiceJob'
        );

        // Email al cliente
        $job->load('client');
        try { Mail::to($job->client->email)->send(new BidReceivedMail($job, $user, $bid)); } catch (\Throwable) {}

        return response()->json($bid->load('expert:id,name'), 201);
    }

    // Cliente ve las cotizaciones de su trabajo
    public function index(Request $request, $jobId)
    {
        $user = $request->user();
        $job  = ServiceJob::findOrFail($jobId);

        if ($user->id !== $job->client_id) return response()->json(['message' => 'Acceso denegado'], 403);

        $bids = JobBid::with(['expert' => fn($q) => $q->with('expertProfile.category')])
            ->where('service_job_id', $jobId)
            ->where('status', 'pendiente')
            ->latest()->get()
            ->map(fn($b) => [
                'id'          => $b->id,
                'message'     => $b->message,
                'amount'      => $b->amount,
                'status'      => $b->status,
                'created_at'  => $b->created_at,
                'expert' => [
                    'id'             => $b->expert->id,
                    'name'           => $b->expert->name,
                    'category'       => $b->expert->expertProfile?->category?->name,
                    'avg_rating'     => $b->expert->expertProfile?->average_rating,
                    'total_reviews'  => $b->expert->expertProfile?->total_reviews,
                    'experience_years' => $b->expert->expertProfile?->experience_years,
                    'is_verified'    => $b->expert->expertProfile?->is_verified,
                ],
            ]);

        return response()->json($bids);
    }

    // Cliente acepta una cotización
    public function accept(Request $request, $jobId, $bidId)
    {
        $user = $request->user();
        $job  = ServiceJob::with('payment')->findOrFail($jobId);

        if ($user->id !== $job->client_id) return response()->json(['message' => 'Acceso denegado'], 403);
        if ($job->status !== 'buscando') return response()->json(['message' => 'El trabajo ya tiene un experto'], 400);

        $bid = JobBid::where('id', $bidId)->where('service_job_id', $jobId)->firstOrFail();

        // Asignar experto al trabajo
        $job->update(['expert_id' => $bid->expert_id, 'status' => 'asignado']);

        // Marcar cotización aceptada y rechazar las demás
        $bid->update(['status' => 'aceptada']);
        JobBid::where('service_job_id', $jobId)->where('id', '!=', $bidId)->update(['status' => 'rechazada']);

        // Si la cotización tiene un monto y el trabajo no tiene presupuesto, usar ese monto
        if ($bid->amount && !$job->budget) {
            $job->update(['budget' => $bid->amount]);
            Payment::create(['service_job_id' => $jobId, 'amount' => $bid->amount, 'status' => 'retenido_en_app']);
        }

        return response()->json(['message' => '¡Cotización aceptada! El experto ha sido asignado.']);
    }

    // Experto puede ver sus propias cotizaciones enviadas
    public function myBids(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Acceso denegado'], 403);

        $bids = JobBid::with('job:id,title,status,address,budget,category_id', 'job.category:id,name')
            ->where('expert_id', $user->id)
            ->latest()->get();

        return response()->json($bids);
    }
}
