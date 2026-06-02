<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ServiceJob;
use App\Models\Payment;
use App\Helpers\Notify;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Exceptions\MPApiException;

class MercadoPagoController extends Controller
{
    public function __construct()
    {
        MercadoPagoConfig::setAccessToken(config('mercadopago.access_token'));
        MercadoPagoConfig::setRuntimeEnviroment(MercadoPagoConfig::LOCAL);
    }

    /**
     * Crea una preferencia de pago en MercadoPago para un trabajo.
     * El cliente llama a esto y recibe la URL donde pagar.
     */
    public function createPreference(Request $request, $jobId)
    {
        $user = $request->user();
        $job  = ServiceJob::with(['category', 'payment'])->findOrFail($jobId);

        if ($user->id !== $job->client_id) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        if (!in_array($job->status, ['buscando', 'asignado'])) {
            return response()->json(['message' => 'Este trabajo no puede recibir pagos en su estado actual'], 400);
        }

        $amount = $job->payment?->amount ?? $job->budget;

        if (!$amount || $amount <= 0) {
            return response()->json(['message' => 'El trabajo no tiene un monto definido. Agrega un presupuesto primero.'], 400);
        }

        $feePct     = config('mercadopago.platform_fee_pct', 10);
        $fee        = round($amount * $feePct / 100, 2);
        $expertAmt  = round($amount - $fee, 2);

        $client = new PreferenceClient();

        $preferenceData = [
            'items' => [[
                'id'          => (string) $job->id,
                'title'       => $job->title,
                'description' => substr($job->description, 0, 255),
                'category_id' => 'services',
                'quantity'    => 1,
                'currency_id' => 'MXN',
                'unit_price'  => (float) $amount,
            ]],
            'payer' => [
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'back_urls' => [
                'success' => config('mercadopago.success_url') . "&job_id={$job->id}",
                'failure' => config('mercadopago.failure_url') . "&job_id={$job->id}",
                'pending' => config('mercadopago.pending_url') . "&job_id={$job->id}",
            ],
            'auto_return'       => 'approved',
            'external_reference' => (string) $job->id,
            'notification_url'  => url('/api/mp/webhook'),
            'expires'           => true,
            'expiration_date_from' => now()->toIso8601String(),
            'expiration_date_to'   => now()->addDays(3)->toIso8601String(),
            'metadata' => [
                'job_id'       => $job->id,
                'client_id'    => $user->id,
                'platform_fee' => $fee,
                'expert_amount'=> $expertAmt,
            ],
        ];

        try {
            $preference = $client->create($preferenceData);
        } catch (MPApiException $e) {
            return response()->json(['message' => 'Error al crear preferencia de pago: ' . $e->getMessage()], 500);
        }

        // Crear o actualizar el registro de pago
        $payment = $job->payment ?? new Payment(['service_job_id' => $job->id]);
        $payment->fill([
            'amount'            => $amount,
            'status'            => 'pendiente',
            'mp_preference_id'  => $preference->id,
            'platform_fee'      => $fee,
            'expert_amount'     => $expertAmt,
        ]);
        $payment->save();

        return response()->json([
            'preference_id' => $preference->id,
            'init_point'    => $preference->init_point,     // producción
            'sandbox_url'   => $preference->sandbox_init_point, // sandbox
            'amount'        => $amount,
            'platform_fee'  => $fee,
            'expert_amount' => $expertAmt,
        ]);
    }

    /**
     * Webhook que MercadoPago llama cuando cambia el estado de un pago.
     */
    public function webhook(Request $request)
    {
        // Verificar firma del webhook (HMAC-SHA256)
        $secret    = config('mercadopago.webhook_secret');
        $xSignature = $request->header('x-signature');
        $xRequestId = $request->header('x-request-id');

        if ($secret && $xSignature) {
            $dataId  = $request->query('data_id') ?? $request->input('data.id');
            $manifest = "id:{$dataId};request-id:{$xRequestId};ts:" . explode(',', str_replace('ts=', '', $xSignature))[0] . ';';

            $ts    = null;
            $hash  = null;
            foreach (explode(',', $xSignature) as $part) {
                [$k, $v] = explode('=', trim($part), 2);
                if ($k === 'ts')   $ts   = $v;
                if ($k === 'v1')   $hash = $v;
            }

            $manifest  = "id:{$dataId};request-id:{$xRequestId};ts:{$ts};";
            $expected  = hash_hmac('sha256', $manifest, $secret);

            if (!hash_equals($expected, $hash ?? '')) {
                return response()->json(['ok' => false, 'reason' => 'invalid_signature'], 400);
            }
        }

        $type   = $request->input('type') ?? $request->input('topic');
        $dataId = $request->input('data.id') ?? $request->query('id');

        if ($type !== 'payment' || !$dataId) {
            return response()->json(['ok' => true]);
        }

        try {
            $mpPayment = (new PaymentClient())->get((int) $dataId);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'reason' => $e->getMessage()], 500);
        }

        $jobId = $mpPayment->external_reference ?? $mpPayment->metadata?->job_id;
        if (!$jobId) {
            return response()->json(['ok' => true]);
        }

        $payment = Payment::where('service_job_id', $jobId)->first();
        if (!$payment) {
            return response()->json(['ok' => true]);
        }

        $payment->update([
            'mp_payment_id' => $dataId,
            'mp_status'     => $mpPayment->status,
        ]);

        if ($mpPayment->status === 'approved') {
            $this->handleApproved($payment, $mpPayment);
        } elseif (in_array($mpPayment->status, ['cancelled', 'rejected', 'refunded'])) {
            $this->handleFailed($payment);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * El pago fue aprobado → retener dinero en la plataforma.
     */
    private function handleApproved(Payment $payment, $mpPayment): void
    {
        if ($payment->status === 'retenido_en_app') return;

        $payment->update([
            'status'         => 'retenido_en_app',
            'transaction_id' => $mpPayment->id,
        ]);

        $job = $payment->serviceJob()->with(['client', 'expert'])->first();
        if (!$job) return;

        // Notificar al cliente
        Notify::send(
            $job->client_id,
            'payment_confirmed',
            '¡Pago confirmado!',
            "Tu pago de $" . number_format($payment->amount, 2) . " para «{$job->title}» fue procesado. El dinero está seguro hasta confirmar el trabajo.",
            $job->id,
            'ServiceJob'
        );

        // Si el trabajo tiene experto asignado, notificarlo
        if ($job->expert_id) {
            Notify::send(
                $job->expert_id,
                'payment_confirmed',
                'Pago del cliente recibido',
                "El cliente confirmó el pago para «{$job->title}». Recibirás $" . number_format($payment->expert_amount, 2) . " al completarlo.",
                $job->id,
                'ServiceJob'
            );
        }
    }

    /**
     * El pago falló o fue cancelado.
     */
    private function handleFailed(Payment $payment): void
    {
        $payment->update(['status' => 'pendiente']);

        $job = $payment->serviceJob()->first();
        if ($job) {
            Notify::send(
                $job->client_id,
                'payment_failed',
                'Pago no procesado',
                "El pago para «{$job->title}» no pudo procesarse. Intenta de nuevo.",
                $job->id,
                'ServiceJob'
            );
        }
    }

    /**
     * Verifica el estado de un pago manualmente (útil para el return_url).
     */
    public function checkStatus(Request $request, $jobId)
    {
        $user    = $request->user();
        $job     = ServiceJob::with('payment')->findOrFail($jobId);

        if ($user->id !== $job->client_id && $user->id !== $job->expert_id && $user->role !== 'admin') {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $payment = $job->payment;
        if (!$payment) {
            return response()->json(['status' => 'sin_pago', 'amount' => null]);
        }

        // Si MP tiene un pago registrado, sincronizar
        if ($payment->mp_payment_id && $payment->status === 'pendiente') {
            try {
                $mp = (new PaymentClient())->get((int) $payment->mp_payment_id);
                if ($mp->status === 'approved') {
                    $this->handleApproved($payment, $mp);
                    $payment->refresh();
                }
            } catch (\Throwable) {}
        }

        return response()->json([
            'status'         => $payment->status,
            'mp_status'      => $payment->mp_status,
            'amount'         => $payment->amount,
            'platform_fee'   => $payment->platform_fee,
            'expert_amount'  => $payment->expert_amount,
        ]);
    }

    /**
     * El cliente libera el pago (confirma trabajo terminado).
     * Actualiza el estado a liberado — el pago real al experto
     * se realiza fuera de la plataforma (o via MP Payouts en fase 2).
     */
    public function releasePayment(Request $request, $jobId)
    {
        $user    = $request->user();
        $job     = ServiceJob::with('payment')->findOrFail($jobId);

        if ($user->id !== $job->client_id) {
            return response()->json(['message' => 'Solo el cliente puede liberar el pago'], 403);
        }

        if ($job->status !== 'asignado') {
            return response()->json(['message' => 'El trabajo no está en progreso'], 400);
        }

        $payment = $job->payment;
        if (!$payment || $payment->status !== 'retenido_en_app') {
            return response()->json(['message' => 'No hay fondos retenidos para liberar'], 400);
        }

        $payment->update(['status' => 'liberado_al_experto']);
        $job->update(['status' => 'completado']);

        $job->load('expert');

        Notify::send(
            $job->expert_id,
            'payment_released',
            '¡Pago liberado! 💰',
            "El cliente aprobó el trabajo «{$job->title}». Recibirás $" . number_format($payment->expert_amount, 2) . " (después de comisión del " . config('mercadopago.platform_fee_pct') . "%).",
            $job->id,
            'ServiceJob'
        );

        Notify::send(
            $job->client_id,
            'job_completed',
            'Trabajo completado',
            "Has liberado el pago para «{$job->title}». ¡No olvides calificar al experto!",
            $job->id,
            'ServiceJob'
        );

        return response()->json([
            'message'       => '¡Pago liberado! El experto recibirá su dinero pronto.',
            'expert_amount' => $payment->expert_amount,
            'platform_fee'  => $payment->platform_fee,
        ]);
    }

    /**
     * Reembolsar al cliente (Admin o disputa resuelta).
     */
    public function refundPayment(Request $request, $jobId)
    {
        $user    = $request->user();
        $job     = ServiceJob::with('payment')->findOrFail($jobId);

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Solo administradores pueden emitir reembolsos'], 403);
        }

        $payment = $job->payment;
        if (!$payment || $payment->status !== 'retenido_en_app') {
            return response()->json(['message' => 'No hay fondos retenidos para reembolsar'], 400);
        }

        // En producción: llamar a MP Refunds API
        // Por ahora marcamos el estado y lo procesamos manualmente
        $payment->update(['status' => 'reembolsado']);
        $job->update(['status' => 'cancelado']);

        Notify::send($job->client_id, 'payment_refunded', 'Reembolso procesado',
            "Se procesó el reembolso de $" . number_format($payment->amount, 2) . " para «{$job->title}».",
            $job->id, 'ServiceJob');

        return response()->json(['message' => 'Reembolso procesado correctamente.']);
    }
}
