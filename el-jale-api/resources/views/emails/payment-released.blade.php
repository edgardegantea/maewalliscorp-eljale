<x-mail::message>
# ¡Tu pago fue liberado! 💸

Hola, **{{ $expert->name }}**.

El cliente **{{ $job->client->name }}** confirmó que el trabajo quedó terminado y liberó tu pago.

<x-mail::panel>
**{{ $job->title }}**

@if($job->budget)
💰 **Monto liberado:** ${{ number_format($job->budget, 2) }}
@endif
</x-mail::panel>

El dinero será transferido a tu cuenta conforme a los términos de la plataforma.

¡Sigue haciendo un excelente trabajo!

<x-mail::button :url="config('app.frontend_url', 'http://localhost:5173') . '/expert-dashboard'" color="success">
Ver mis Jales
</x-mail::button>

Gracias por ser parte de El Jale,<br>
El equipo de **El Jale**
</x-mail::message>
