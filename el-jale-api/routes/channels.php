<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Canal privado del chat por trabajo
// Solo el cliente o el experto del trabajo pueden suscribirse
Broadcast::channel('chat.{jobId}', function ($user, $jobId) {
    $job = \App\Models\ServiceJob::find($jobId);
    if (!$job) return false;
    return $user->id === $job->client_id || $user->id === $job->expert_id;
});
