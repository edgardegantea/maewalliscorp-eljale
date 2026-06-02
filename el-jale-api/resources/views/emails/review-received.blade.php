<x-emails.components.layout subject="Nueva reseña de un cliente — El Jale">
  <h1>⭐ ¡Recibiste una calificación!</h1>
  <p>Hola <strong>{{ $expert->name }}</strong>, un cliente calificó tu trabajo.</p>

  <div class="card" style="text-align:center;">
    <div style="font-size:32px; margin-bottom:8px;">
      @for($i = 1; $i <= 5; $i++)
        <span style="color:{{ $i <= $review->rating ? '#f59e0b' : '#e2e8f0' }}">★</span>
      @endfor
    </div>
    <div style="font-size:24px; font-weight:900; color:#0f172a;">{{ number_format($review->rating, 1) }} / 5</div>
    @if($review->comment)
    <p style="margin-top:12px; font-style:italic; color:#475569;">"{{ $review->comment }}"</p>
    @endif
    <p style="font-size:13px; color:#94a3b8; margin-bottom:0;">— {{ $review->client->name ?? 'Cliente' }}</p>
  </div>

  <p>Tu calificación actual es <strong>{{ number_format($avgRating, 1) }}/5</strong> con {{ $totalReviews }} reseña{{ $totalReviews != 1 ? 's' : '' }}.</p>

  <div style="text-align:center; margin-top:24px;">
    <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/expertos/{{ $expert->id }}" class="btn">Ver mi perfil público →</a>
  </div>
</x-emails.components.layout>
