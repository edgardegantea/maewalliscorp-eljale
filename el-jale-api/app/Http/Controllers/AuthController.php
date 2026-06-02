<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ExpertProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:client,expert',
            // Validaciones si es experto
            'category_id' => 'required_if:role,expert|exists:categories,id',
            'experience_years' => 'required_if:role,expert|integer|min:0',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        // Si el usuario es un trabajador, creamos su perfil
        if ($user->role === 'expert') {
            // Lógica: Solo para los primeros 50 que se unan hoy 
            $expertCount = ExpertProfile::count();
            $isFoundingMember = $expertCount < 50;

            ExpertProfile::create([
                'user_id' => $user->id,
                'category_id' => $request->category_id,
                'experience_years' => $request->experience_years,
                'is_founding_member' => $isFoundingMember,
                'is_verified' => false, // Requiere entrevista previa [cite: 81]
            ]);
        }

        // Generamos el token de Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('expertProfile')
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('expertProfile')
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente'
        ]);
    }
}
