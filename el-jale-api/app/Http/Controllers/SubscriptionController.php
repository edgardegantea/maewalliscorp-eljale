<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExpertProfile;
use App\Helpers\Notify;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Client\Payment\PaymentClient;

class SubscriptionController extends Controller
{
    const PRICE_MXN  = 299.00;
    const DAYS       = 30;

    public function __construct()
    {
        MercadoPagoConfig::setAccessToken(config('mercadopago.access_token'));
    }

    /** Estado actual de membresía */
    public function status(Request $request)
    {
        $user    = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Acceso denegado'], 403);

        $profile = ExpertProfile::where('user_id', $user->id)->firstOrFail();

        // Verificar si expiró
        if ($profile->is_premium && $profile->premium_expires_at && now()->isAfter($profile->premium_expires_at)) {
            $profile->update(['is_premium' => false]);
        }

        return response()->json([
            'is_premium'          => $profile->fresh()->is_premium,
            'premium_expires_at'  => $profile->premium_expires_at,
            'price_mxn'           => self::PRICE_MXN,
            'days'                => self::DAYS,
        ]);
    }

    /** Crea preferencia de pago para activar/renovar membresía */
    public function createPreference(Request $request)
    {
        $user    = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Acceso denegado'], 403);

        $profile = ExpertProfile::where('user_id', $user->id)->firstOrFail();

        $client = new PreferenceClient();

        $preference = $client->create([
            'items' => [[
                'id'          => 'premium-mensual',
                'title'       => 'El Jale Premium — 1 mes',
                'description' => 'Aparece primero en búsquedas, badge Premium y más.',
                'quantity'    => 1,
                'currency_id' => 'MXN',
                'unit_price'  => (float) self::PRICE_MXN,
            ]],
            'payer' => ['name' => $user->name, 'email' => $user->email],
            'back_urls' => [
                'success' => config('app.frontend_url') . '/expert-dashboard?premium=success',
                'failure' => config('app.frontend_url') . '/expert-dashboard?premium=failure',
                'pending' => config('app.frontend_url') . '/expert-dashboard?premium=pending',
            ],
            'auto_return'        => 'approved',
            'external_reference' => "premium_{$user->id}",
            'notification_url'   => url('/api/subscriptions/webhook'),
            'metadata'           => ['user_id' => $user->id, 'type' => 'premium'],
        ]);

        $profile->update(['mp_subscription_preference_id' => $preference->id]);

        return response()->json([
            'init_point'   => $preference->init_point,
            'sandbox_url'  => $preference->sandbox_init_point,
            'price'        => self::PRICE_MXN,
        ]);
    }

    /** Webhook de pagos de suscripción */
    public function webhook(Request $request)
    {
        $type   = $request->input('type') ?? $request->input('topic');
        $dataId = $request->input('data.id') ?? $request->query('id');

        if ($type !== 'payment' || !$dataId) return response()->json(['ok' => true]);

        try {
            $mp = (new PaymentClient())->get((int) $dataId);
        } catch (\Throwable) {
            return response()->json(['ok' => false], 500);
        }

        $ref = $mp->external_reference ?? '';
        if (!str_starts_with($ref, 'premium_')) return response()->json(['ok' => true]);

        $userId = (int) str_replace('premium_', '', $ref);

        if ($mp->status === 'approved') {
            $profile = ExpertProfile::where('user_id', $userId)->first();
            if (!$profile) return response()->json(['ok' => true]);

            $expiresAt = $profile->is_premium && $profile->premium_expires_at && now()->isBefore($profile->premium_expires_at)
                ? $profile->premium_expires_at->addDays(self::DAYS)
                : now()->addDays(self::DAYS);

            $profile->update([
                'is_premium'         => true,
                'premium_expires_at' => $expiresAt,
            ]);

            Notify::send($userId, 'premium_activated', '⭐ ¡Membresía Premium activada!',
                "Tu membresía Premium está activa hasta el {$expiresAt->format('d/m/Y')}. Ahora apareces primero en las búsquedas.",
                null, null);
        }

        return response()->json(['ok' => true]);
    }
}
