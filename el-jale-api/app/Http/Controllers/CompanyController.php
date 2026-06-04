<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    /** Registrar empresa nueva */
    public function register(Request $request)
    {
        $request->validate([
            'company_name'   => 'required|string|max:255',
            'rfc'            => 'nullable|string|max:13',
            'contact_name'   => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|min:8',
            'phone'          => 'nullable|string|max:20',
            'city'           => 'nullable|string|max:100',
        ]);

        // Crear empresa
        $company = Company::create([
            'name'         => $request->company_name,
            'rfc'          => $request->rfc,
            'email'        => $request->email,
            'contact_name' => $request->contact_name,
            'phone'        => $request->phone,
            'city'         => $request->city,
            'plan'         => 'starter',
        ]);

        // Crear usuario admin de la empresa
        $user = User::create([
            'name'               => $request->contact_name,
            'email'              => $request->email,
            'password'           => Hash::make($request->password),
            'role'               => 'client',
            'company_id'         => $company->id,
            'email_verified_at'  => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => '¡Cuenta empresarial creada! Bienvenido a El Jale Empresas.',
            'token'   => $token,
            'user'    => $user->load('company'),
            'company' => $company,
        ], 201);
    }

    /** Dashboard de la empresa */
    public function dashboard(Request $request)
    {
        $user    = $request->user();
        $company = Company::find($user->company_id);
        if (!$company) return response()->json(['message' => 'Sin cuenta empresarial'], 404);

        $teamMembers = User::where('company_id', $company->id)->get(['id','name','email','created_at']);

        // Stats de trabajos de todos los miembros del equipo
        $userIds = $teamMembers->pluck('id');
        $jobs    = \App\Models\ServiceJob::whereIn('client_id', $userIds)
            ->with(['category', 'expert', 'payment'])
            ->latest()
            ->take(20)
            ->get();

        $totalSpent = \App\Models\Payment::whereHas('serviceJob', fn($q) => $q->whereIn('client_id', $userIds))
            ->where('status', 'liberado_al_experto')
            ->sum('amount');

        return response()->json([
            'company'      => $company,
            'team'         => $teamMembers,
            'recent_jobs'  => $jobs,
            'stats' => [
                'total_jobs'    => $jobs->count(),
                'total_spent'   => $totalSpent,
                'team_size'     => $teamMembers->count(),
                'active_jobs'   => $jobs->where('status', 'asignado')->count(),
            ],
        ]);
    }

    /** Invitar miembro al equipo */
    public function invite(Request $request)
    {
        $user    = $request->user();
        $company = Company::find($user->company_id);
        if (!$company) return response()->json(['message' => 'Sin cuenta empresarial'], 404);

        $request->validate(['email' => 'required|email|unique:users,email', 'name' => 'required|string']);

        $tempPass = Str::random(12);
        $member   = User::create([
            'name'               => $request->name,
            'email'              => $request->email,
            'password'           => Hash::make($tempPass),
            'role'               => 'client',
            'company_id'         => $company->id,
            'email_verified_at'  => now(),
        ]);

        // TODO: enviar email de invitación con $tempPass

        return response()->json([
            'message'     => "Invitación enviada a {$request->email}.",
            'member'      => $member,
            'temp_password' => $tempPass, // en producción no retornar esto, sólo enviar por email
        ], 201);
    }

    /** Actualizar empresa */
    public function update(Request $request)
    {
        $user    = $request->user();
        $company = Company::find($user->company_id);
        if (!$company) return response()->json(['message' => 'Sin cuenta empresarial'], 404);

        $company->update($request->only(['name','rfc','contact_name','phone','address','city','monthly_budget']));
        return response()->json(['message' => 'Empresa actualizada.', 'company' => $company]);
    }
}
