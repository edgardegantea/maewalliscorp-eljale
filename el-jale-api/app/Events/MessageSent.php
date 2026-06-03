<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    /**
     * Canal privado: solo el cliente y el experto del trabajo pueden escuchar.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->message->service_job_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id'             => $this->message->id,
            'service_job_id' => $this->message->service_job_id,
            'sender_id'      => $this->message->sender_id,
            'body'           => $this->message->body,
            'created_at'     => $this->message->created_at->toISOString(),
            'sender'         => [
                'id'   => $this->message->sender->id,
                'name' => $this->message->sender->name,
                'role' => $this->message->sender->role,
            ],
        ];
    }
}
