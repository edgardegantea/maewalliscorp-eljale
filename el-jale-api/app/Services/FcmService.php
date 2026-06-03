<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\User;

/**
 * Firebase Cloud Messaging — Push Notifications
 *
 * Config en .env:
 *   FCM_SERVER_KEY=AAAA...  (Legacy HTTP API key)
 *   — O bien —
 *   FCM_PROJECT_ID=mi-proyecto
 *   FCM_SERVICE_ACCOUNT_JSON=/path/to/serviceAccount.json  (v1 API)
 */
class FcmService
{
    /** Enviar push a un usuario por su ID */
    public static function notifyUser(int $userId, string $title, string $body, array $data = []): bool
    {
        $user = User::find($userId);
        if (!$user || !$user->fcm_token) return false;

        return self::send($user->fcm_token, $title, $body, $data);
    }

    /** Enviar push a múltiples usuarios */
    public static function notifyUsers(array $userIds, string $title, string $body, array $data = []): void
    {
        $tokens = User::whereIn('id', $userIds)
            ->whereNotNull('fcm_token')
            ->pluck('fcm_token')
            ->toArray();

        foreach (array_chunk($tokens, 500) as $chunk) {
            self::sendMulticast($chunk, $title, $body, $data);
        }
    }

    /** Enviar a un token */
    public static function send(string $token, string $title, string $body, array $data = []): bool
    {
        $serverKey = config('services.fcm.server_key');
        if (!$serverKey) {
            Log::info("[FCM] No server key configured. Push omitted: {$title}");
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "key={$serverKey}",
                'Content-Type'  => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', [
                'to'           => $token,
                'notification' => [
                    'title' => $title,
                    'body'  => $body,
                    'sound' => 'default',
                    'badge' => '1',
                    'icon'  => '/icons/icon-192.png',
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ],
                'data'         => array_merge($data, ['title' => $title, 'body' => $body]),
                'priority'     => 'high',
            ]);

            if ($response->json('failure')) {
                Log::warning('[FCM] Send failed', ['response' => $response->json()]);
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            Log::error('[FCM] Exception: ' . $e->getMessage());
            return false;
        }
    }

    /** Multicast (hasta 500 tokens) */
    private static function sendMulticast(array $tokens, string $title, string $body, array $data): void
    {
        $serverKey = config('services.fcm.server_key');
        if (!$serverKey || empty($tokens)) return;

        try {
            Http::withHeaders([
                'Authorization' => "key={$serverKey}",
                'Content-Type'  => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', [
                'registration_ids' => $tokens,
                'notification'     => ['title' => $title, 'body' => $body, 'sound' => 'default'],
                'data'             => $data,
                'priority'         => 'high',
            ]);
        } catch (\Throwable $e) {
            Log::error('[FCM] Multicast exception: ' . $e->getMessage());
        }
    }
}
