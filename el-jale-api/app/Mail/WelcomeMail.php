<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '¡Bienvenido a El Jale! 🔧');
    }

    public function content(): Content
    {
        $view = $this->user->role === 'expert' ? 'emails.welcome-expert' : 'emails.welcome-client';
        return new Content(view: $view, with: ['user' => $this->user]);
    }

    public function attachments(): array { return []; }
}
