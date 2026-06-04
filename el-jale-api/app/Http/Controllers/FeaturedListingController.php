<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExpertProfile;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Exceptions\MPApiException;

class FeaturedListingController extends Controller
{
    const PLANS = [
        '7days'  => ['days' => 7,  'price' => 99,   'label' => '7 días'],
        '15days' => ['days' => 15, 'price' => 179,  'label' => '15 días'],
        '30days' => ['days' => 30, 'price' => 299,  'label' => '30 días'],
    ];

    /** Estado actual del destacado */
    public function status(Request $request)
    {
        $profile = ExpertProfile::where('user_id', $request->user()->id)->firstOrFail();
        $active  = $profile->is_featured && $profile->featured_until && now()->lt($profile->featured_until);

        return response()->json([
            'is_featured'    => $active,
            'featured_until' => $profile->featured_until,
            'plans'          => self::PLANS,
        ]);
    }

    /** Crear preferencia de MercadoPago para destacar */
    public function createPreference(Request $request)
    {
        $request->validate(['plan' => 'required|in:7days,15days,30days']);

        $user    = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Solo expertos'], 403);

        $plan    = self::PLANS[$request->plan];
        $profile = ExpertProfile::where('user_id', $user->id)->firstOrFail();

        MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));
        $client = new PreferenceClient();

        try {
            $pref = $client->create([
                'items' => [[
                    'id'          => "featured-{$request->plan}",
                    'title'       => "El Jale — Experto Destacado {$plan['label']}",
                    'quantity'    => 1,
                    'unit_price'  => (float) $plan['price'],
                    'currency_id' => 'MXN',
                ]],
                'payer'         => ['email' => $user->email],
                'back_urls'     => [
                    'success' => config('app.frontend_url') . '/expert-dashboard?featured=success&plan=' . $request->plan,
                    'failure' => config('app.frontend_url') . '/expert-dashboard?featured=failure',
                    'pending' => config('app.frontend_url') . '/expert-dashboard?featured=pending',
                ],
                'auto_return'   => 'approved',
                'external_reference' => "featured-{$user->id}-{$request->plan}",
                'metadata'      => ['user_id' => $user->id, 'plan' => $request->plan, 'days' => $plan['days']],
            ]);

            $profile->update(['featured_preference_id' => $pref->id]);

            return response()->json(['init_point' => $pref->init_point, 'sandbox_init_point' => $pref->sandbox_init_point]);

        } catch (MPApiException $e) {
            return response()->json(['message' => 'Error al crear preferencia de pago'], 500);
        }
    }

    /** Webhook / callback de MercadoPago — activar destacado */
    public function activate(Request $request)
    {
        // Llamado desde webhook o retorno de MP con payment_id
        $externalRef = $request->input('external_reference', '');
        if (!str_starts_with($externalRef, 'featured-')) {
            return response()->json(['message' => 'Referencia inválida'], 400);
        }

        [$, $userId, $planKey] = explode('-', $externalRef, 3);
        $plan    = self::PLANS[$planKey] ?? null;
        if (!$plan || !$userId) return response()->json(['message' => 'Plan inválido'], 400);

        $profile = ExpertProfile::where('user_id', $userId)->first();
        if (!$profile) return response()->json(['message' => 'Perfil no encontrado'], 404);

        // Si ya tiene featured activo, extender desde la fecha actual o desde la expiración
        $from = ($profile->is_featured && $profile->featured_until && now()->lt($profile->featured_until))
            ? $profile->featured_until
            : now();

        $profile->update([
            'is_featured'    => true,
            'featured_until' => $from->addDays($plan['days']),
        ]);

        return response()->json(['message' => 'Perfil destacado activado.']);
    }

    /** Admin: activar/desactivar featured manualmente */
    public function adminToggle(Request $request, $userId)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'No autorizado'], 403);
        $request->validate(['days' => 'required|integer|min:1|max:365']);

        $profile = ExpertProfile::where('user_id', $userId)->firstOrFail();
        if ($profile->is_featured && $profile->featured_until && now()->lt($profile->featured_until)) {
            $profile->update(['is_featured' => false, 'featured_until' => null]);
            return response()->json(['message' => 'Destacado desactivado.']);
        }
        $profile->update(['is_featured' => true, 'featured_until' => now()->addDays($request->days)]);
        return response()->json(['message' => "Perfil destacado por {$request->days} días."]);
    }
}
