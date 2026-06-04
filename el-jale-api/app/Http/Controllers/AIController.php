<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    /** Mejorar descripción de trabajo con Claude */
    public function improveDescription(Request $request)
    {
        $request->validate([
            'category'    => 'required|string|max:100',
            'description' => 'required|string|max:2000',
            'urgency'     => 'nullable|in:normal,urgente',
        ]);

        $apiKey = config('services.anthropic.api_key');
        if (!$apiKey) {
            return response()->json(['message' => 'Servicio de IA no configurado'], 503);
        }

        $prompt = <<<EOT
Eres un asistente especializado en servicios del hogar en México.

El cliente necesita un servicio de "{$request->category}" y escribió esta descripción:
"{$request->description}"

Urgencia: {$request->urgency}.

Reescribe la descripción para que sea clara, específica y útil para el técnico.
Incluye: síntomas del problema, posible causa, qué materiales o herramientas podría necesitar el experto.
Usa un tono amigable y directo. Máximo 3 oraciones. Solo devuelve la descripción mejorada, sin explicaciones.
EOT;

        try {
            $response = Http::withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(15)->post('https://api.anthropic.com/v1/messages', [
                'model'      => 'claude-haiku-4-5',
                'max_tokens' => 300,
                'messages'   => [['role' => 'user', 'content' => $prompt]],
            ]);

            if ($response->failed()) {
                return response()->json(['message' => 'Error al procesar con IA'], 500);
            }

            $improved = $response->json('content.0.text') ?? $request->description;
            return response()->json(['description' => trim($improved)]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error de conexión con IA'], 500);
        }
    }

    /** Sugerir título del trabajo */
    public function suggestTitle(Request $request)
    {
        $request->validate(['description' => 'required|string|max:500', 'category' => 'required|string']);

        $apiKey = config('services.anthropic.api_key');
        if (!$apiKey) return response()->json(['title' => '']);

        try {
            $response = Http::withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(10)->post('https://api.anthropic.com/v1/messages', [
                'model'      => 'claude-haiku-4-5',
                'max_tokens' => 60,
                'messages'   => [[
                    'role'    => 'user',
                    'content' => "Genera un título corto (máximo 8 palabras) para este trabajo de {$request->category}: \"{$request->description}\". Solo el título, sin comillas ni puntos.",
                ]],
            ]);

            $title = $response->json('content.0.text') ?? '';
            return response()->json(['title' => trim($title)]);
        } catch (\Exception $e) {
            return response()->json(['title' => '']);
        }
    }
}
