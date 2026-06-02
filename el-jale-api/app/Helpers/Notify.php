<?php

namespace App\Helpers;

use App\Models\UserNotification;

class Notify
{
    public static function send(int $userId, string $type, string $title, string $body, ?int $relatedId = null, ?string $relatedType = null): void
    {
        UserNotification::create([
            'user_id'      => $userId,
            'type'         => $type,
            'title'        => $title,
            'body'         => $body,
            'related_id'   => $relatedId,
            'related_type' => $relatedType,
        ]);
    }
}
