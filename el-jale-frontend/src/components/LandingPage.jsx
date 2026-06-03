// src/components/LandingPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const SERVICES = [
  { icon: '🔧', name: 'Plomería',          desc: 'Fugas y tuberías',        slug: 'fontaneros',        color: 'bg-blue-50   text-blue-600   border-blue-100' },
  { icon: '⚡', name: 'Electricidad',       desc: 'Instalaciones eléctricas', slug: 'electricistas',     color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  { icon: '🎨', name: 'Pintura',            desc: 'Interior y exterior',      slug: 'pintores',          color: 'bg-pink-50   text-pink-600   border-pink-100' },
  { icon: '🪵', name: 'Carpintería',        desc: 'Muebles y puertas',        slug: 'carpinteros',       color: 'bg-amber-50  text-amber-600  border-amber-100' },
  { icon: '🏗️', name: 'Albañilería',        desc: 'Construcción y acabados',  slug: 'albanileria',       color: 'bg-stone-50  text-stone-600  border-stone-100' },
  { icon: '❄️', name: 'Aire Acond.',        desc: 'Instalación y servicio',   slug: 'aire-acondicionado', color: 'bg-cyan-50   text-cyan-600   border-cyan-100' },
  { icon: '🧹', name: 'Limpieza',           desc: 'Hogar y oficinas',         slug: 'limpieza',          color: 'bg-green-50  text-green-600  border-green-100' },
  { icon: '🔑', name: 'Cerrajería',         desc: 'Cerraduras y accesos',     slug: 'cerrajeros',        color: 'bg-purple-50 text-purple-600 border-purple-100' },
];

const STEPS = [
  { n: '1', icon: '📋', title: 'Publica tu Jale',       desc: 'Describe el trabajo, agrega fotos y tu presupuesto. Gratis en 2 minutos.',       color: 'text-orange-500' },
  { n: '2', icon: '💬', title: 'Recibe cotizaciones',   desc: 'Expertos verificados de tu zona te envían sus propuestas al instante.',          color: 'text-blue-500' },
  { n: '3', icon: '🤝', title: 'Elige al mejor',        desc: 'Revisa perfiles, reseñas y precios. Acepta la propuesta que más te convenza.',   color: 'text-green-500' },
  { n: '4', icon: '🔒', title: 'Pago protegido',        desc: 'Tu dinero queda en escrow y se libera solo cuando confirmas el trabajo listo.',  color: 'text-purple-500' },
];

const TESTIMONIALS = [
  { name: 'María G.',   city: 'CDMX',          role: 'Cliente',              stars: 5, text: 'Carlos llegó puntual, arregló la fuga en una hora y dejó todo limpio. El pago seguro me dio mucha confianza.',   avatar: 'M', color: 'bg-pink-500' },
  { name: 'Roberto J.', city: 'Guadalajara',    role: 'Cliente',              stars: 5, text: 'Encontré al electricista perfecto en minutos. Precio justo, trabajo profesional y sin regateos.',                avatar: 'R', color: 'bg-blue-500' },
  { name: 'Carlos H.',  city: 'Experto · CDMX', role: 'Plomero verificado',   stars: 5, text: 'Desde que me uní consigo clientes serios. El pago siempre llega. Ya no pierdo tiempo con personas que no pagan.', avatar: 'C', color: 'bg-orange-500' },
];

const Star = () => (
  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

export default function LandingPage() {
  const [stats, setStats]         = useState({ experts: '50+', jobs: '100+', rating: '4.9' });
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ══════════════════════ NAVBAR ══════════════════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-black tracking-tight">
            <span className={scrolled ? 'text-gray-900' : 'text-white'}>El </span>
            <span className="text-orange-500">Jale</span>
          </Link>

          {/* Desktop nav */}
          <div className={`hidden md:flex items-center gap-7 text-sm font-medium ${scrolled ? 'text-gray-600' : 'text-white/80'}`}>
            <a href="#servicios"     className="hover:text-orange-500 transition-colors">Servicios</a>
            <a href="#como-funciona" className="hover:text-orange-500 transition-colors">¿Cómo funciona?</a>
            <a href="#expertos"      className="hover:text-orange-500 transition-colors">Para expertos</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link to="/login"
              className={`hidden sm:block text-sm font-semibold transition-colors ${
                scrolled ? 'text-gray-600 hover:text-orange-500' : 'text-white/80 hover:text-white'
              }`}
            >
              Iniciar sesión
            </Link>
            <Link to="/register"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              Únete gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center bg-gray-950 overflow-hidden">
        {/* Fondo animado */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_20%_50%,rgba(249,115,22,0.15),transparent_60%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_80%_30%,rgba(59,130,246,0.08),transparent_60%)]" />
          {/* Grid sutil */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <span className="text-orange-300 text-xs font-semibold tracking-wide uppercase">Expertos disponibles ahora mismo</span>
              </div>

              {/* Headline */}
              <div className="space-y-3">
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.0] tracking-tight">
                  El experto<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                    que necesitas,
                  </span><br />
                  hoy mismo.
                </h1>
                <p className="text-lg text-gray-400 max-w-md leading-relaxed pt-2">
                  Plomeros, electricistas, pintores y más — verificados, con pago seguro y sin regateos.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/register"
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-4 rounded-2xl transition-all active:scale-95 text-base shadow-lg shadow-orange-500/25"
                >
                  Publicar trabajo gratis
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                  </svg>
                </Link>
                <Link to="/register?role=expert"
                  className="flex items-center justify-center gap-2 border border-white/20 text-white/80 hover:bg-white/10 hover:text-white font-semibold px-7 py-4 rounded-2xl transition-all text-base"
                >
                  Soy experto, quiero trabajar
                </Link>
              </div>

              {/* Social proof mini */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {['#f97316','#3b82f6','#10b981','#8b5cf6','#ec4899'].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-950 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c }}>
                      {['C','R','M','J','L'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} />)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5"><span className="text-white font-semibold">4.9/5</span> · más de 100 jales completados</p>
                </div>
              </div>
            </div>

            {/* Right — Cards flotantes */}
            <div className="hidden lg:flex flex-col gap-4 max-w-sm ml-auto">
              {/* Card trabajo activo */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-lg">🔧</div>
                    <div>
                      <p className="text-white font-semibold text-sm">Carlos Herrera</p>
                      <p className="text-gray-500 text-xs">Plomero · ✓ Verificado</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Disponible
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} />)}
                  <span className="text-white text-sm font-bold ml-1">5.0</span>
                  <span className="text-gray-500 text-xs">(24)</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span className="text-emerald-300 text-xs font-medium">Pago protegido: $850 MXN</span>
                </div>
              </div>

              {/* Notificación nueva cotización */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">¡Nueva cotización!</p>
                  <p className="text-orange-300 text-xs">Luis M. ofrece $650 · Hace 2 min</p>
                </div>
                <div className="ml-auto w-2 h-2 bg-orange-400 rounded-full shrink-0 animate-pulse" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: stats.experts, l: 'Expertos' },
                  { v: stats.jobs,    l: 'Jales' },
                  { v: '4.9⭐',       l: 'Rating' },
                ].map(s => (
                  <div key={s.l} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-white font-black text-lg">{s.v}</p>
                    <p className="text-gray-500 text-xs">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600">
          <span className="text-xs">Conoce más</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
        </div>
      </section>

      {/* ══════════════════════ SERVICIOS ══════════════════════ */}
      <section id="servicios" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Lo que ofrecemos</p>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Servicios para tu hogar</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Especialistas verificados disponibles en tu ciudad para cualquier trabajo del hogar.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SERVICES.map(s => (
              <Link
                key={s.name}
                to={`/servicios/${s.slug}`}
                className="group relative bg-gray-50 hover:bg-white border border-gray-100 hover:border-orange-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <span className="text-3xl block mb-3">{s.icon}</span>
                <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors text-sm">{s.name}</p>
                <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400 absolute top-4 right-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ CÓMO FUNCIONA ══════════════════════ */}
      <section id="como-funciona" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">El proceso</p>
            <h2 className="text-4xl font-black text-gray-900 mb-3">De solicitud a trabajo terminado</h2>
            <p className="text-gray-500 max-w-lg mx-auto">En horas, no días. Así de fácil.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                {/* Línea conectora */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(100%-8px)] w-full h-px border-t-2 border-dashed border-gray-200 z-0" />
                )}
                <div className="relative z-10 bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all duration-200 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl">{s.icon}</div>
                    <span className={`text-3xl font-black ${s.color} opacity-30`}>{s.n}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-sm"
            >
              Empezar ahora — es gratis
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════ BENTO GARANTÍAS ══════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Por qué El Jale</p>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Diseñado para la confianza</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card grande */}
            <div className="md:col-span-2 bg-gray-950 rounded-3xl p-8 flex flex-col justify-between min-h-[260px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent_70%)]" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-2xl mb-5">🔒</div>
                <h3 className="text-white text-xl font-black mb-2">Pago 100% Seguro</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm">Tu dinero queda en escrow hasta que confirmes que el trabajo quedó perfecto. Si algo falla, te reembolsamos.</p>
              </div>
              <div className="relative flex items-center gap-2 mt-6">
                <div className="flex -space-x-1">
                  {['🔧','⚡','🎨'].map((e, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm">{e}</div>
                  ))}
                </div>
                <span className="text-gray-500 text-xs">+50 expertos asegurados</span>
              </div>
            </div>

            {/* Card verificación */}
            <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 flex flex-col justify-between min-h-[260px]">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-2xl mb-5">✅</div>
                <h3 className="text-gray-900 text-xl font-black mb-2">Expertos Verificados</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Todos pasan revisión de identidad (KYC) antes de aparecer en la plataforma.</p>
              </div>
              <div className="mt-6 bg-white rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                <span className="text-xs text-gray-700 font-medium">Identidad confirmada</span>
              </div>
            </div>

            {/* Card rating */}
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-2xl mb-5">⭐</div>
              <h3 className="text-gray-900 text-xl font-black mb-2">Calificaciones Reales</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Solo clientes que contrataron pueden dejar reseñas. Sin bots ni reseñas falsas.</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} />)}</div>
                <span className="text-amber-600 font-black">4.9</span>
                <span className="text-gray-400 text-xs">promedio</span>
              </div>
            </div>

            {/* Card disputas */}
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-2xl mb-5">🛡️</div>
              <h3 className="text-gray-900 text-xl font-black mb-2">Garantía de calidad</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Si el trabajo no es satisfactorio, abrimos una disputa y protegemos tu dinero.</p>
            </div>

            {/* Card chat */}
            <div className="bg-purple-50 border border-purple-100 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-2xl mb-5">💬</div>
              <h3 className="text-gray-900 text-xl font-black mb-2">Chat en tiempo real</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Coordina directo con tu experto desde la plataforma. Sin dar tu número personal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ TESTIMONIALES ══════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Testimonios</p>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Lo que dicen nuestros usuarios</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ CTA EXPERTOS ══════════════════════ */}
      <section id="expertos" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="bg-gray-950 rounded-3xl px-8 py-14 md:px-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(249,115,22,0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1),transparent_60%)]" />

            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-4">Para expertos</p>
                <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                  ¿Tienes un oficio?<br />
                  <span className="text-orange-400">Gana más sin regateos.</span>
                </h2>
                <p className="text-gray-400 leading-relaxed mb-2">
                  Únete como Socio Fundador, recibe trabajos de clientes serios y cobra siempre seguro.
                </p>
                <p className="text-orange-300 text-sm font-medium">
                  ⭐ Los primeros 50 expertos reciben comisión preferencial de por vida.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: '💰', title: 'Cobra seguro siempre',      desc: 'El pago está protegido antes de que llegues al trabajo.' },
                  { icon: '📱', title: 'Clientes que pagan',         desc: 'Sin gente que solo pide presupuesto y desaparece.' },
                  { icon: '🏆', title: 'Construye tu reputación',    desc: 'Tu perfil, reseñas y badges te hacen destacar.' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                    <span className="text-xl shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{f.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}

                <Link to="/register?role=expert"
                  className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-4 rounded-2xl transition-all active:scale-95 mt-2"
                >
                  Registrarme como experto
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer className="bg-gray-950 py-14 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid sm:grid-cols-3 gap-10 mb-10">
            <div>
              <p className="text-2xl font-black text-white mb-3">El <span className="text-orange-500">Jale</span></p>
              <p className="text-gray-500 text-sm leading-relaxed">Marketplace de servicios del hogar. Expertos verificados, pago seguro.</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold text-sm mb-4">Plataforma</p>
              <div className="space-y-2">
                {[
                  { to: '/register', label: 'Publicar un trabajo' },
                  { to: '/register?role=expert', label: 'Registrarme como experto' },
                  { to: '/login', label: 'Iniciar sesión' },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="block text-gray-500 hover:text-white text-sm transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-400 font-semibold text-sm mb-4">Servicios</p>
              <div className="space-y-2">
                {SERVICES.slice(0, 4).map(s => (
                  <Link key={s.slug} to={`/servicios/${s.slug}`} className="block text-gray-500 hover:text-white text-sm transition-colors">
                    {s.icon} {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-600 text-sm">© 2025 El Jale · Maewalliscorp · Todos los derechos reservados</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-gray-600 text-xs">Todos los sistemas operativos</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
