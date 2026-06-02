<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ExpertProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
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
            'category_id'      => 'required_if:role,expert|exists:categories,id',
            'experience_years' => 'required_if:role,expert|integer|min:0',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

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
