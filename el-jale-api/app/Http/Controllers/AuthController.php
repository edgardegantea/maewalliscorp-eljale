<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ExpertProfile;
use App\Models\ReferralCredit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use App\Mail\WelcomeMail;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'required|string|email|max:255|unique:users',
            'password'         => 'required|string|min:8',
            'role'             => 'required|in:client,expert',
            'phone'            => 'nullable|string|max:20',
            'category_id'      => 'required_if:role,expert|exists:categories,id',
            'experience_years' => 'required_if:role,expert|integer|min:0',
            'referral_code'    => 'nullable|string|exists:users,referral_code',
        ]);

        // Generar código de referido único
        do {
            $code = strtoupper(Str::random(8));
        } while (User::where('referral_code', $code)->exists());

        // Buscar referidor
        $referrer = null;
        if ($request->referral_code) {
            $referrer = User::where('referral_code', $request->referral_code)->first();
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'role'          => $request->role,
            'phone'         => $request->phone,
            'referral_code' => $code,
            'referred_by'   => $referrer?->id,
        ]);

        // Otorgar crédito al referidor
        if ($referrer) {
            ReferralCredit::create([
                'user_id'          => $referrer->id,
                'referred_user_id' => $user->id,
                'amount'           => 50.00,
            ]);
        }

        if ($user->role === 'expert') {
            $expertCount     = ExpertProfile::count();
            $isFoundingMember = $expertCount < 50;

            ExpertProfile::create([
                'user_id'           => $user->id,
                'category_id'       => $request->category_id,
                'experience_years'  => $request->experience_years,
                'is_founding_member' => $isFoundingMember,
                'is_verified'       => false,
            ]);
        }

        // Email de bienvenida
        try {
            Mail::to($user->email)->send(new WelcomeMail($user));
        } catch (\Throwable) {}

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user->load('expertProfile'),
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user->load('expertProfile'),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }
}
