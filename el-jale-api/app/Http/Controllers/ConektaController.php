<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\ServiceJob;
use App\Models\Payment;
use App\Helpers\Notify;

class ConektaController extends Controller
{
    private function apiKey(): string
    {
        return config('services.conekta.secret_key', '');
    }

    private function baseUrl(): string
    {
        return 'https://api.conekta.io';
    }

    /** Crear orden de pago en Conekta */
    public function createOrder(Request $request, $jobId)
    {
        $request->validate([
            'token_id' => 'required|string',      // token del tarjetahabiente del JS SDK
        ]);

        $user = $request->user();
        $job  = ServiceJob::where('id', $jobId)
            ->where('client_id', $user->id)
            ->with(['expert', 'payment'])
            ->firstOrFail();

        if ($job->status !== 'asignado') {
            return response()->json(['message' => 'El trabajo no está en estado asignado.'], 422);
        }

        if ($job->payment && !in_array($job->payment->status, ['pendiente', null])) {
            return response()->json(['message' => 'Este trabajo ya tiene un pago registrado.'], 422);
        }

        if (!$this->apiKey()) {
            return response()->json(['message' => 'Conekta no está configurado en este servidor.'], 503);
        }

        $amount   = (int) round(($job->budget ?? 0) * 100); // en centavos
        $jobTitle = mb_substr($job->title, 0, 250);

        try {
            $response = Http::withBasicAuth($this->apiKey(), '')
                ->withHeaders(['Accept' => 'application/vnd.conekta-v2.1.0+json'])
                ->post("{$this->baseUrl()}/orders", [
                    'line_items' => [[
                        'name'       => $jobTitle,
                        'unit_price' => $amount,
                        'quantity'   => 1,
                    ]],
                    'currency'   => 'MXN',
                    'customer_info' => [
                        'name'  => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone ?? '+5200000000',
                    ],
                    'charges' => [[
                        'payment_method' => [
                            'type'     => 'card',
                            'token_id' => $request->token_id,
                        ],
                    ]],
                    'metadata' => [
                        'job_id'    => $job->id,
                        'client_id' => $user->id,
                        'source'    => 'eljale_conekta',
                    ],
                ]);

            if ($response->failed()) {
                $err = $response->json('details.0.message') ?? $response->json('message') ?? 'Error de pago';
                return response()->json(['message' => $err], 422);
            }

            $order = $response->json();

            // Guardar o actualizar pago
            $payment = $job->payment ?? new Payment(['service_job_id' => $job->id]);
            $payment->fill([
                'amount'         => $job->budget,
                'status'         => 'retenido_en_app',
                'payment_method' => 'conekta',
                'conekta_order_id' => $order['id'],
            ])->save();

            // Notificar al experto
            Notify::send(
                $job->expert_id,
                'payment_received',
                '💳 Pago recibido',
                "El cliente pagó \${$job->budget} MXN por «{$job->title}». El dinero está en escrow.",
                $job->id,
                'ServiceJob'
            );

            return response()->json([
                'message'  => 'Pago procesado correctamente. El dinero está protegido en escrow.',
                'order_id' => $order['id'],
                'status'   => 'retenido_en_app',
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al procesar el pago con Conekta.'], 500);
        }
    }

    /** Webhook de Conekta */
    public function webhook(Request $request)
    {
        $event = $request->input('type');
        $data  = $request->input('data.object', []);

        if ($event === 'order.paid') {
            $jobId   = $data['metadata']['job_id'] ?? null;
            $orderId = $data['id'] ?? null;
            if ($jobId && $orderId) {
                Payment::where('conekta_order_id', $orderId)
                    ->update(['status' => 'retenido_en_app']);
            }
        }

        return response()->json(['ok' => true]);
    }
}
