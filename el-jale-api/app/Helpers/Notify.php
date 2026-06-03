<?php

namespace App\Helpers;

use App\Models\UserNotification;
use App\Services\FcmService;

class Notify
{
    /**
     * Crea notificación in-app Y envía push FCM si el usuario tiene token.
     */
    public static function send(
        int $userId,
        string $type,
        string $title,
        string $body,
        ?int $relatedId = null,
        ?string $relatedType = null
    ): void {
        UserNotification::create([
            'user_id'      => $userId,
            'type'         => $type,
            'title'        => $title,
            'body'         => $body,
            'related_id'   => $relatedId,
            'related_type' => $relatedType,
        ]);

        // Push FCM (silencioso si no hay server key configurado)
        FcmService::notifyUser($userId, $title, $body, [
            'type'         => $type,
            'related_id'   => (string) ($relatedId ?? ''),
            'related_type' => $relatedType ?? '',
        ]);
    }
}
