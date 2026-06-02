<x-mail::message>
# ¡Tu Jale fue aceptado! 🎉

Hola, **{{ $job->client->name }}**.

**{{ $expert->name }}** ha aceptado tu solicitud y está listo para ponerse a trabajar.

<x-mail::panel>
**{{ $job->title }}**

{{ $job->description }}

@if($job->address)
📍 **Dirección:** {{ $job->address }}
@endif

@if($job->budget)
💰 **Presupuesto asegurado:** ${{ number_format($job->budget, 2) }}
@endif
</x-mail::panel>

**¿Qué sigue?**
1. Coordina el horario con el experto usando el chat de la plataforma.
2. Cuando el trabajo esté listo, confirma su terminación y libera el pago.

<x-mail::button :url="config('app.frontend_url', 'http://localhost:5173') . '/client-dashboard'" color="success">
Ver mis Jales
</x-mail::button>

Gracias por confiar en El Jale,<br>
El equipo de **El Jale**
</x-mail::message>
