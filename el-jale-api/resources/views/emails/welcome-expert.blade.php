<x-emails.components.layout subject="¡Bienvenido a El Jale, especialista!">
  <h1>¡Hola, {{ $user->name }}! Casi listo 🔧</h1>
  <p>Tu cuenta de experto fue creada. Antes de aparecer a los clientes, necesitas completar tu perfil y verificar tu identidad.</p>

  <div class="card">
    <div class="steps">
      <div class="step"><p><strong>Completa tu zona de cobertura</strong> — define dónde trabajas para ver trabajos cercanos.</p></div>
      <div class="step"><p><strong>Agrega tu tarifa y bio</strong> — los clientes la ven antes de contactarte.</p></div>
      <div class="step"><p><strong>Verifica tu identidad</strong> — sube tu INE y selfie para ser verificado.</p></div>
      <div class="step"><p><strong>¡Empieza a ganar!</strong> — una vez verificado, los trabajos llegan a ti.</p></div>
    </div>
  </div>

  <div style="text-align:center; margin-top:28px;">
    <a href="{{ config('app.frontend_url') }}/expert-dashboard" class="btn">Completar mi perfil →</a>
  </div>
</x-emails.components.layout>
