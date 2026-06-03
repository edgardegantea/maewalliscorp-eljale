<?php

namespace App\Events;

use App\Models\ServiceJob;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JobStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ServiceJob $job) {}

    public function broadcastOn(): array
    {
        // Canal privado para el cliente del trabajo
        return [
            new PrivateChannel('job.' . $this->job->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'status.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'id'          => $this->job->id,
            'status'      => $this->job->status,
            'expert_id'   => $this->job->expert_id,
            'expert_name' => $this->job->expert?->name,
            'updated_at'  => $this->job->updated_at->toISOString(),
        ];
    }
}
