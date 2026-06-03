<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Helpers\Notify;

/**
 * Verificación de teléfono via SMS (OTP).
 * Usa Vonage (Nexmo) o Twilio — configurable en .env.
 * SMS_PROVIDER=vonage | twilio
 */
class PhoneVerificationController extends Controller
{
    /** Enviar OTP al teléfono */
    public function sendOtp(Request $request)
    {
        $request->validate(['phone' => 'required|string|min:10|max:20']);

        $user = $request->user();
        $otp  = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->update([
            'phone'               => $request->phone,
            'phone_otp'           => bcrypt($otp),
            'phone_otp_expires_at'=> now()->addMinutes(10),
            'phone_verified'      => false,
        ]);

        $this->sendSms($request->phone, "Tu código de El Jale es: {$otp}. Válido 10 minutos.");

        return response()->json(['message' => 'Código enviado correctamente.']);
    }

    /** Verificar OTP */
    public function verifyOtp(Request $request)
    {
        $request->validate(['otp' => 'required|string|size:6']);

        $user = $request->user();

        if (!$user->phone_otp || !$user->phone_otp_expires_at) {
            return response()->json(['message' => 'No hay OTP pendiente.'], 422);
        }

        if (now()->isAfter($user->phone_otp_expires_at)) {
            return response()->json(['message' => 'El código ha expirado.'], 422);
        }

        if (!\Hash::check($request->otp, $user->phone_otp)) {
            return response()->json(['message' => 'Código incorrecto.'], 422);
        }

        $user->update([
            'phone_verified'       => true,
            'phone_otp'            => null,
            'phone_otp_expires_at' => null,
        ]);

        Notify::send($user->id, 'phone_verified', '📱 Teléfono verificado',
            'Tu número de teléfono ha sido verificado exitosamente.', null, null);

        return response()->json(['message' => 'Teléfono verificado correctamente.']);
    }

    /** Guardar FCM token del dispositivo */
    public function saveFcmToken(Request $request)
    {
        $request->validate(['fcm_token' => 'required|string']);
        $request->user()->update(['fcm_token' => $request->fcm_token]);
        return response()->json(['ok' => true]);
    }

    /** Obtener créditos de referidos */
    public function referralStatus(Request $request)
    {
        $user    = $request->user();
        $credits = $user->referralCredits()->with('referredUser:id,name')->get();

        return response()->json([
            'referral_code'   => $user->referral_code,
            'referral_link'   => config('app.frontend_url') . '/register?ref=' . $user->referral_code,
            'total_credits'   => $credits->sum('amount'),
            'available'       => $credits->where('used', false)->sum('amount'),
            'used'            => $credits->where('used', true)->sum('amount'),
            'referrals'       => $credits->map(fn($c) => [
                'name'       => $c->referredUser->name,
                'amount'     => $c->amount,
                'used'       => $c->used,
                'date'       => $c->created_at->format('d/m/Y'),
            ]),
        ]);
    }

    // ─── Private ────────────────────────────────────────────────────────────

    private function sendSms(string $to, string $text): void
    {
        $provider = config('services.sms.provider', 'vonage');

        if ($provider === 'vonage') {
            Http::post('https://rest.nexmo.com/sms/json', [
                'api_key'    => config('services.vonage.key'),
                'api_secret' => config('services.vonage.secret'),
                'to'         => $to,
                'from'       => 'ElJale',
                'text'       => $text,
            ]);
        } elseif ($provider === 'twilio') {
            Http::withBasicAuth(config('services.twilio.sid'), config('services.twilio.token'))
                ->post("https://api.twilio.com/2010-04-01/Accounts/" . config('services.twilio.sid') . "/Messages.json", [
                    'To'   => $to,
                    'From' => config('services.twilio.from'),
                    'Body' => $text,
                ]);
        }
        // En local/test, solo loggear
        \Log::info("SMS a {$to}: {$text}");
    }
}
