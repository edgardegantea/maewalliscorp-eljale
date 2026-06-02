<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class IdentityVerifiedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public bool $approved, public ?string $reason = null) {}

    public function envelope(): Envelope
    {
        $subject = $this->approved
            ? '✅ ¡Tu identidad fue verificada! — El Jale'
            : 'Acción requerida: verifica tu identidad en El Jale';
        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        $view = $this->approved ? 'emails.identity-verified' : 'emails.identity-rejected';
        return new Content(view: $view, with: [
            'user'   => $this->user,
            'reason' => $this->reason,
        ]);
    }

    public function attachments(): array { return []; }
}
