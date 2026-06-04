<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\TwoFactorMail;

class TwoFactorController extends Controller
{
    /** Enviar código 2FA al email del usuario */
    public function send(Request $request)
    {
        $user = $request->user();
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->update([
            'two_factor_code'       => $code,
            'two_factor_expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::to($user->email)->send(new TwoFactorMail($user->name, $code));
        } catch (\Throwable) {}

        return response()->json(['message' => "Código enviado a {$user->email}"]);
    }

    /** Verificar código 2FA */
    public function verify(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);
        $user = $request->user();

        if (
            $user->two_factor_code !== $request->code ||
            !$user->two_factor_expires_at ||
            now()->gt($user->two_factor_expires_at)
        ) {
            return response()->json(['message' => 'Código inválido o expirado.'], 422);
        }

        $user->update(['two_factor_code' => null, 'two_factor_expires_at' => null]);
        return response()->json(['message' => 'Verificación exitosa.', 'verified' => true]);
    }

    /** Activar 2FA para la cuenta */
    public function enable(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);
        $user = $request->user();

        if ($user->two_factor_code !== $request->code || now()->gt($user->two_factor_expires_at)) {
            return response()->json(['message' => 'Código incorrecto o expirado.'], 422);
        }

        $user->update(['two_factor_enabled' => true, 'two_factor_code' => null]);
        return response()->json(['message' => '2FA activado. Tu cuenta ahora es más segura.']);
    }

    /** Desactivar 2FA */
    public function disable(Request $request)
    {
        $request->validate(['password' => 'required']);
        if (!\Hash::check($request->password, $request->user()->password)) {
            return response()->json(['message' => 'Contraseña incorrecta.'], 422);
        }
        $request->user()->update(['two_factor_enabled' => false]);
        return response()->json(['message' => '2FA desactivado.']);
    }

    /** Estado actual */
    public function status(Request $request)
    {
        return response()->json([
            'enabled' => $request->user()->two_factor_enabled,
            'email'   => substr($request->user()->email, 0, 3) . '***@' . explode('@', $request->user()->email)[1],
        ]);
    }
}
