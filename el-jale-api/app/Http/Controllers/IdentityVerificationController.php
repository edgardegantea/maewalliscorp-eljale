<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExpertProfile;
use App\Helpers\Notify;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\IdentityVerifiedMail;

class IdentityVerificationController extends Controller
{
    /** Experto sube sus documentos */
    public function submitDocuments(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Acceso denegado'], 403);

        $request->validate([
            'id_front'  => 'required|image|max:8192',
            'id_back'   => 'required|image|max:8192',
            'selfie'    => 'required|image|max:8192',
        ]);

        $profile = ExpertProfile::where('user_id', $user->id)->firstOrFail();

        if ($profile->verification_status === 'verificado') {
            return response()->json(['message' => 'Tu identidad ya está verificada.'], 400);
        }

        // Eliminar documentos anteriores
        foreach (['id_front_path', 'id_back_path', 'selfie_path'] as $field) {
            if ($profile->$field) Storage::disk('private')->delete($profile->$field);
        }

        $profile->update([
            'id_front_path'       => $request->file('id_front')->store("kyc/{$user->id}", 'private'),
            'id_back_path'        => $request->file('id_back')->store("kyc/{$user->id}", 'private'),
            'selfie_path'         => $request->file('selfie')->store("kyc/{$user->id}", 'private'),
            'verification_status' => 'documentos_enviados',
            'rejection_reason'    => null,
        ]);

        // Notificar a admins (todos los admins)
        \App\Models\User::where('role', 'admin')->each(function ($admin) use ($user) {
            Notify::send($admin->id, 'kyc_submitted', 'Documentos de verificación recibidos',
                "{$user->name} envió sus documentos de identidad para revisión.", $user->id, 'User');
        });

        return response()->json(['message' => 'Documentos enviados. Revisaremos en las próximas 24 horas.']);
    }

    /** Admin ve los documentos (URL firmada temporal) */
    public function getDocuments(Request $request, $userId)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Acceso denegado'], 403);

        $profile = ExpertProfile::where('user_id', $userId)->firstOrFail();

        $docs = [];
        foreach (['id_front_path' => 'INE Frente', 'id_back_path' => 'INE Reverso', 'selfie_path' => 'Selfie'] as $field => $label) {
            if ($profile->$field) {
                $docs[] = [
                    'label' => $label,
                    'path'  => "/admin/kyc/{$userId}/document/{$field}",
                ];
            }
        }

        return response()->json([
            'verification_status' => $profile->verification_status,
            'rejection_reason'    => $profile->rejection_reason,
            'documents'           => $docs,
            'user'                => \App\Models\User::select('id','name','email')->find($userId),
        ]);
    }

    /** Admin aprueba la verificación */
    public function approve(Request $request, $userId)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Acceso denegado'], 403);

        $profile = ExpertProfile::where('user_id', $userId)->firstOrFail();
        $profile->update([
            'verification_status' => 'verificado',
            'is_verified'         => true,
            'verified_at'         => now(),
            'rejection_reason'    => null,
        ]);

        Notify::send($userId, 'identity_verified', '¡Identidad verificada! ✅',
            'Tu identidad fue verificada. Ya puedes aceptar trabajos en El Jale.', null, null);

        $expert = \App\Models\User::find($userId);
        if ($expert) {
            try { Mail::to($expert->email)->send(new IdentityVerifiedMail($expert, true)); } catch (\Throwable) {}
        }

        return response()->json(['message' => 'Experto verificado correctamente.']);
    }

    /** Admin rechaza con motivo */
    public function reject(Request $request, $userId)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Acceso denegado'], 403);

        $request->validate(['reason' => 'required|string|max:500']);

        $profile = ExpertProfile::where('user_id', $userId)->firstOrFail();
        $profile->update([
            'verification_status' => 'rechazado',
            'is_verified'         => false,
            'rejection_reason'    => $request->reason,
        ]);

        Notify::send($userId, 'identity_rejected', 'Verificación rechazada',
            "Tus documentos fueron rechazados: {$request->reason}. Puedes volver a enviarlos.", null, null);

        $expert = \App\Models\User::find($userId);
        if ($expert) {
            try { Mail::to($expert->email)->send(new IdentityVerifiedMail($expert, false, $request->reason)); } catch (\Throwable) {}
        }

        return response()->json(['message' => 'Verificación rechazada.']);
    }

    /** Admin descarga un documento KYC específico */
    public function getDocument(Request $request, $userId, $field)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Acceso denegado'], 403);

        $allowed = ['id_front_path', 'id_back_path', 'selfie_path'];
        if (!in_array($field, $allowed)) return response()->json(['message' => 'Documento no válido'], 400);

        $profile = ExpertProfile::where('user_id', $userId)->firstOrFail();
        $path    = $profile->$field;

        if (!$path || !Storage::disk('private')->exists($path)) {
            return response()->json(['message' => 'Documento no encontrado'], 404);
        }

        $mime = Storage::disk('private')->mimeType($path) ?: 'image/jpeg';

        return response(Storage::disk('private')->get($path), 200, [
            'Content-Type'        => $mime,
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
            'Cache-Control'       => 'private, no-store',
        ]);
    }

    /** Estado actual del experto autenticado */
    public function myStatus(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Acceso denegado'], 403);

        $profile = ExpertProfile::where('user_id', $user->id)->firstOrFail();

        return response()->json([
            'verification_status' => $profile->verification_status,
            'rejection_reason'    => $profile->rejection_reason,
            'has_documents'       => (bool) $profile->id_front_path,
        ]);
    }
}
