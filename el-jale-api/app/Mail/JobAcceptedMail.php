<?php

namespace App\Mail;

use App\Models\ServiceJob;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class JobAcceptedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ServiceJob $job,
        public User $expert
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '¡Tu Jale fue aceptado! — El Jale');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.job-accepted',
            with: ['job' => $this->job, 'expert' => $this->expert]
        );
    }

    public function attachments(): array { return []; }
}
