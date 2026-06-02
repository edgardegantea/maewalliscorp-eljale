<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReviewReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $expert,
        public Review $review,
        public float $avgRating,
        public int $totalReviews,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Nueva reseña {$this->review->rating}/5 — El Jale");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.review-received', with: [
            'expert'       => $this->expert,
            'review'       => $this->review,
            'avgRating'    => $this->avgRating,
            'totalReviews' => $this->totalReviews,
        ]);
    }

    public function attachments(): array { return []; }
}
