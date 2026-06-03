// src/components/LandingPage.jsx — Rediseño 2025 v2
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

// ── Datos ──────────────────────────────────────────────────────────
const SERVICES = [
  { icon: '🔧', name: 'Plomería',      desc: 'Fugas, tuberías, instalaciones',    slug: 'fontaneros',        price: '300–900' },
  { icon: '⚡', name: 'Electricidad',   desc: 'Tableros, cortocircuitos, cableado', slug: 'electricistas',     price: '250–800' },
  { icon: '🎨', name: 'Pintura',        desc: 'Interior, exterior, acabados finos', slug: 'pintores',          price: '200–600' },
  { icon: '🪵', name: 'Carpintería',    desc: 'Muebles, puertas, ventanas',         slug: 'carpinteros',       price: '350–1200' },
  { icon: '🏗️', name: 'Albañilería',   desc: 'Construcción y remodelación',        slug: 'albanileria',       price: '400–1500' },
  { icon: '❄️', name: 'Aire Acond.',    desc: 'Instalación y mantenimiento',        slug: 'aire-acondicionado',price: '350–900' },
  { icon: '🧹', name: 'Limpieza',       desc: 'Hogar, oficinas y espacios',         slug: 'limpieza',          price: '150–500' },
  { icon: '🔑', name: 'Cerrajería',     desc: 'Cerraduras, llaves, emergencias',    slug: 'cerrajeros',        price: '200–600' },
];

const TRUST = [
  { icon: '🔒', title: 'Pago en escrow',      desc: 'Tu dinero no se libera hasta que confirmes el trabajo terminado.' },
  { icon: '✅', title: 'KYC verificado',       desc: 'Cada experto pasa revisión de identidad antes de aparecer.' },
  { icon: '⭐', title: 'Reseñas reales',       desc: 'Solo clientes que contrataron pueden calificar. Sin bots.' },
  { icon: '🛡️', title: 'Garantía de trabajo', desc: 'Si algo sale mal, abrimos una disputa y te protegemos.' },
  { icon: '💬', title: 'Chat en tiempo real', desc: 'Coordina con tu experto sin compartir tu número personal.' },
  { icon: '⚡', title: 'Modo urgente',         desc: 'Respuesta garantizada en 2 horas para emergencias.' },
];

const STEPS_CLIENT = [
  { n: '01', icon: '📋', title: 'Publica tu Jale',     desc: 'Describe el problema, sube fotos y pon tu presupuesto. Gratis.' },
  { n: '02', icon: '💬', title: 'Recibe ofertas',      desc: 'Expertos verificados de tu zona te contactan al instante.' },
  { n: '03', icon: '🤝', title: 'Elige y contrata',    desc: 'Compara perfiles, precios y reseñas. Tú decides.' },
  { n: '04', icon: '🔒', title: 'Pago protegido',      desc: 'Libera el pago solo cuando el trabajo quede perfecto.' },
];

const STEPS_EXPERT = [
  { n: '01', icon: '👤', title: 'Crea tu perfil',      desc: 'Sube tu foto, experiencia y zona de cobertura. 5 minutos.' },
  { n: '02', icon: '🔔', title: 'Recibe trabajos',     desc: 'Notificaciones en tiempo real de jales en tu área.' },
  { n: '03', icon: '💰', title: 'Envía cotización',    desc: 'Propón tu precio y mensaje personalizado al cliente.' },
  { n: '04', icon: '✅', title: 'Cobra seguro',         desc: 'El pago ya está reservado antes de que llegues.' },
];

const TESTIMONIALS = [
  { name: 'María G.',   city: 'CDMX',        role: 'Cliente · Plomería',     stars: 5, text: 'Carlos llegó en 2 horas, arregló la fuga y dejó todo limpio. El pago seguro me dio mucha confianza. Definitivamente vuelvo a usar El Jale.', color: '#ec4899', tag: 'Cliente' },
  { name: 'Roberto J.', city: 'Guadalajara',  role: 'Cliente · Electricidad', stars: 5, text: 'Encontré a Luis en minutos. Detectó el problema eléctrico rápido, precio justo y profesional. Sin regateos ni sorpresas.', color: '#3b82f6', tag: 'Cliente' },
  { name: 'Carlos H.',  city: 'CDMX',        role: 'Plomero verificado',     stars: 5, text: 'Desde que me uní tengo trabajo fijo. Los clientes pagan siempre porque el dinero ya está en escrow. Ya no pierdo tiempo con quien no paga.', color: '#f97316', tag: 'Experto Top' },
  { name: 'Laura M.',   city: 'Monterrey',   role: 'Cliente · Limpieza',     stars: 5, text: 'Contraté a Ana para limpiar mi departamento. Puntual, profesional y el resultado fue increíble. Lo recomiendo a todos.', color: '#10b981', tag: 'Cliente' },
  { name: 'Eduardo P.', city: 'Guadalajara', role: 'Pintor verificado',       stars: 5, text: 'En mi primer mes conseguí 8 clientes. La plataforma me da trabajo estable y cobro sin problemas. Lo mejor que me pasó profesionalmente.', color: '#8b5cf6', tag: 'Experto Top' },
  { name: 'Patricia V.',city: 'CDMX',        role: 'Cliente · Carpintería',  stars: 5, text: 'Pedí cotizaciones para mis closets. Recibí 4 propuestas en 30 minutos, comparé y contraté al mejor. Fácil y rápido.', color: '#f59e0b', tag: 'Cliente' },
];

const FAQS = [
  { q: '¿Cuánto cuesta publicar un trabajo?', a: 'Es completamente gratis para los clientes. No pagas nada hasta que contratas y liberas el pago al finalizar.' },
  { q: '¿Cómo sé que el experto es confiable?', a: 'Todos los expertos pasan verificación de identidad (KYC), tienen reseñas de clientes reales y están evaluados en la plataforma.' },
  { q: '¿Qué pasa si el trabajo no queda bien?', a: 'Tu dinero está protegido en escrow. Si hay un problema, abres una disputa y el equipo de El Jale la resuelve. No pierdes tu dinero.' },
  { q: '¿Cuánto cobra El Jale a los expertos?', a: 'Una comisión del 10% sobre el trabajo completado. Los Socios Fundadores (primeros 50 expertos) tienen comisión preferencial de por vida.' },
  { q: '¿Puedo pagar en efectivo?', a: 'Sí, puedes elegir efectivo, tarjeta (MercadoPago), transferencia bancaria u OXXO al publicar tu trabajo.' },
  { q: '¿Cuánto tiempo tarda en llegar un experto?', a: 'Depende del servicio y la urgencia. Para el modo normal suelen llegar en 1-3 días. Con el modo urgente, respuesta garantizada en 2 horas.' },
];

const CITIES = ['CDMX', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León'];

// ── Helpers ────────────────────────────────────────────────────────
const Star = ({ size = 'w-4 h-4' }) => (
  <svg className={`${size} text-amber-400`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

function Counter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 16);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString('es-MX')}{suffix}</span>;
}

// Fade-in on scroll
function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled]     = useState(false);
  const [audience, setAudience]     = useState('client');
  const [openFaq, setOpenFaq]       = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ experts: 50, jobs: 100, rating: 4.9 });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    api.get('/admin/stats').then(r => {
      setStats({ experts: r.data.total_experts, jobs: r.data.jobs_completado, rating: r.data.avg_rating || 4.9 });
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/register?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">

      {/* ══ BANNER URGENCIA ══════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2.5 px-4 text-xs font-semibold relative z-50">
        <span className="mr-2">⭐</span>
        Socios Fundadores: primeros 50 expertos obtienen comisión preferencial de por vida —
        <Link to="/register?role=expert" className="underline underline-offset-2 ml-1 hover:text-white/80">únete ahora →</Link>
      </div>

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <nav className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/96 backdrop-blur-lg shadow-sm border-b border-gray-100' : 'bg-[#0a0a0a]'
      }`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/30">J</span>
            <span className={`text-xl font-black ${scrolled ? 'text-gray-900' : 'text-white'}`}>El Jale</span>
          </Link>

          <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${scrolled ? 'text-gray-600' : 'text-white/80'}`}>
            <a href="#servicios"     className="hover:text-orange-500 transition-colors">Servicios</a>
            <a href="#como-funciona" className="hover:text-orange-500 transition-colors">Cómo funciona</a>
            <a href="#expertos"      className="hover:text-orange-500 transition-colors">Para expertos</a>
            <a href="#precios"       className="hover:text-orange-500 transition-colors">Precios</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className={`hidden sm:block text-sm font-semibold transition-colors ${scrolled ? 'text-gray-600 hover:text-orange-500' : 'text-white/80 hover:text-white'}`}>
              Iniciar sesión
            </Link>
            <Link to="/register" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm">
              Únete gratis
            </Link>
            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
              aria-label="Menú"
            >
              {mobileMenu ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-5 py-4 space-y-1">
              {[
                { href: '#servicios',     label: 'Servicios' },
                { href: '#como-funciona', label: 'Cómo funciona' },
                { href: '#expertos',      label: 'Para expertos' },
                { href: '#precios',       label: 'Precios' },
              ].map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileMenu(false)}
                  className="block py-2.5 px-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                  {l.label}
                </a>
              ))}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenu(false)}
                  className="block text-center py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                  Iniciar sesión
                </Link>
                <Link to="/register" onClick={() => setMobileMenu(false)}
                  className="block text-center py-2.5 text-sm font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600">
                  Únete gratis
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-orange-500/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
          <div className="absolute top-1/3 left-0 w-px h-48 bg-gradient-to-b from-transparent via-orange-500/30 to-transparent" />
          <div className="absolute top-1/2 right-0 w-px h-64 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-12 w-full">

          {/* Audience toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
              {[
                { v: 'client', label: '🏠 Necesito un servicio' },
                { v: 'expert', label: '🔧 Soy experto en oficios' },
              ].map(o => (
                <button key={o.v} onClick={() => setAudience(o.v)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    audience === o.v ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* ── COPY ── */}
            <div className="space-y-7">
              {audience === 'client' ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-300 text-xs font-semibold">+{stats.experts} expertos disponibles ahora</span>
                  </div>
                  <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.0] tracking-tight">
                    El experto<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400">
                      perfecto,
                    </span><br />
                    hoy mismo.
                  </h1>
                  <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
                    Plomeros, electricistas, pintores y más — <strong className="text-white">verificados</strong>, con <strong className="text-white">pago protegido</strong> y sin regateos.
                  </p>

                  {/* Search bar */}
                  <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                    <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/15 rounded-2xl px-4 py-3.5 focus-within:border-orange-500/50 focus-within:bg-white/12 transition-all">
                      <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder='¿Qué necesitas? "plomero urgente"'
                        className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none"
                      />
                    </div>
                    <button type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/30 shrink-0">
                      Buscar
                    </button>
                  </form>

                  {/* Quick services */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SERVICES.slice(0, 5).map(s => (
                      <Link key={s.slug} to={`/servicios/${s.slug}`}
                        className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:border-orange-500/40 hover:text-orange-300 transition-all">
                        {s.icon} {s.name}
                      </Link>
                    ))}
                  </div>

                  {/* Social proof */}
                  <div className="flex items-center gap-5 pt-1">
                    <div className="flex -space-x-2.5">
                      {['#f97316','#3b82f6','#10b981','#8b5cf6','#ec4899'].map((c, i) => (
                        <div key={i} className="w-9 h-9 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: c }}>
                          {['M','R','C','L','A'][i]}
                        </div>
                      ))}
                      <div className="w-9 h-9 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-white text-[10px] font-bold">+{stats.experts}</div>
                    </div>
                    <div>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} />)}</div>
                      <p className="text-xs text-gray-500 mt-0.5"><span className="text-white font-bold">{stats.rating}/5</span> · {stats.jobs}+ trabajos completados</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                    <span className="text-orange-300 text-xs font-semibold">Primeros 50 expertos = Socios Fundadores</span>
                  </div>
                  <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.0] tracking-tight">
                    Tu oficio,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400">
                      tus clientes,
                    </span><br />
                    tu precio.
                  </h1>
                  <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
                    Recibe trabajos de <strong className="text-white">clientes verificados</strong> en tu zona. El pago está garantizado antes de que llegues. <strong className="text-white">Sin regateos.</strong>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/register?role=expert"
                      className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all active:scale-95 text-base shadow-xl shadow-orange-500/30">
                      Registrarme como experto
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {['✅ Pago garantizado','🏆 Perfil con reseñas','📱 Notificaciones en tiempo real','💰 Comisión 10% solo al cobrar'].map(b => (
                      <span key={b} className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">{b}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── UI PREVIEW ── */}
            <div className="hidden lg:block">
              {audience === 'client' ? (
                <div className="space-y-3 max-w-[360px] ml-auto">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white text-xs font-semibold">Cotizaciones recibidas · Plomería</p>
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3 nuevas</span>
                    </div>
                    {[
                      { name: 'Carlos H.', price: '$650', rating: '5.0', time: '2 min', color: '#f97316' },
                      { name: 'Luis M.',   price: '$780', rating: '4.8', time: '8 min', color: '#3b82f6' },
                      { name: 'Pedro R.',  price: '$590', rating: '4.9', time: '15 min', color: '#10b981' },
                    ].map((p, i) => (
                      <div key={i} className={`flex items-center gap-3 py-2.5 ${i < 2 ? 'border-b border-white/5' : ''}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: p.color }}>{p.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold">{p.name} <span className="text-gray-500 font-normal">· {p.time}</span></p>
                          <div className="flex items-center gap-1 mt-0.5"><Star size="w-3 h-3" /><span className="text-[10px] text-gray-500">{p.rating}</span></div>
                        </div>
                        <span className="text-orange-400 font-black text-sm">{p.price}</span>
                      </div>
                    ))}
                    <button className="w-full mt-3 bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold py-2 rounded-xl">Ver y comparar ofertas</button>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </div>
                    <div>
                      <p className="text-emerald-300 text-sm font-bold">$650 protegidos en escrow</p>
                      <p className="text-emerald-600 text-xs">Se libera cuando confirmes el trabajo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: stats.experts, s: '+', l: 'Expertos' },
                      { v: stats.jobs, s: '+', l: 'Jales' },
                      { v: 4.9, s: '⭐', l: 'Rating' },
                    ].map(s => (
                      <div key={s.l} className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
                        <p className="text-white font-black text-lg">{s.v}{s.s}</p>
                        <p className="text-gray-600 text-[10px] mt-0.5">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-w-[360px] ml-auto">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                      <p className="text-orange-300 text-xs font-semibold uppercase">Nuevo trabajo en tu zona</p>
                    </div>
                    <p className="text-white font-bold mb-1">Reparación de fuga — Cocina</p>
                    <p className="text-gray-400 text-xs mb-3">📍 Colonia Del Valle, CDMX · 💰 $600–900 · ⚡ Urgente</p>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-orange-500 text-white text-xs font-bold py-2 rounded-xl">Enviar cotización</button>
                      <button className="px-3 bg-white/10 text-white text-xs font-medium py-2 rounded-xl">Ver más</button>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="text-gray-400 text-xs font-semibold mb-3">Mis ganancias este mes</p>
                    <p className="text-white text-3xl font-black mb-1">$12,400 <span className="text-emerald-400 text-sm font-semibold">+23%</span></p>
                    <p className="text-gray-500 text-xs">18 trabajos completados</p>
                    <div className="mt-3 flex gap-1 items-end h-10">
                      {[30,60,45,80,55,90,70,95,65,85,75,100].map((h, i) => (
                        <div key={i} className="flex-1 bg-orange-500/60 rounded-sm" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="text-amber-300 font-bold text-sm">Socio Fundador</p>
                      <p className="text-amber-600 text-xs">Comisión preferencial de por vida · Primeros 50</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-700">
          <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"/></svg>
        </div>
      </section>

      {/* ══ CIUDADES ════════════════════════════════════════════ */}
      <div className="bg-gray-50 border-b border-gray-100 py-4 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-5 flex items-center gap-3 min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center">
          <span className="text-xs text-gray-400 font-medium shrink-0">Disponible en:</span>
          {CITIES.map(c => (
            <button key={c}
              className="text-xs text-gray-600 border border-gray-200 bg-white hover:border-orange-300 hover:text-orange-600 px-3 py-1.5 rounded-full transition-all font-medium">
              📍 {c}
            </button>
          ))}
          <span className="text-xs text-gray-400 font-medium">+ más ciudades →</span>
        </div>
      </div>

      {/* ══ CONTADORES ══════════════════════════════════════════ */}
      <section className="py-16 bg-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { val: stats.experts, suf: '+', label: 'Expertos activos' },
              { val: stats.jobs,    suf: '+', label: 'Jales completados' },
              { val: 98,            suf: '%', label: 'Clientes satisfechos' },
              { val: 2,             suf: 'h', label: 'Tiempo promedio de respuesta' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-4xl md:text-5xl font-black mb-1">
                  <Counter target={s.val} suffix={s.suf} />
                </p>
                <p className="text-orange-100 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICIOS ══════════════════════════════════════════ */}
      <section id="servicios" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <FadeIn className="text-center mb-14">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Más de 20 categorías</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Todo para tu hogar</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Especialistas verificados disponibles en tu ciudad. Precios transparentes desde el inicio.</p>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICES.map((s, i) => (
              <FadeIn key={s.name} delay={i * 60}>
                <Link to={`/servicios/${s.slug}`}
                  className="group relative p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-orange-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block h-full">
                  <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform duration-300">{s.icon}</span>
                  <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors text-sm mb-1">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">${s.price}</span>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/register" className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors text-sm">
              Ver todos los servicios disponibles →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA ══════════════════════════════════════ */}
      <section id="como-funciona" className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative max-w-6xl mx-auto px-5">
          <FadeIn className="text-center mb-14">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Simple y rápido</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">¿Cómo funciona?</h2>
          </FadeIn>

          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
              {[
                { v: 'client', label: '🏠 Soy Cliente' },
                { v: 'expert', label: '🔧 Soy Experto' },
              ].map(o => (
                <button key={o.v} onClick={() => setAudience(o.v)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    audience === o.v ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(audience === 'client' ? STEPS_CLIENT : STEPS_EXPERT).map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="relative group">
                  {i < 3 && <div className="hidden lg:block absolute top-10 left-full w-full h-px border-t border-dashed border-white/10 z-0" />}
                  <div className="relative z-10 bg-white/3 border border-white/8 rounded-2xl p-6 hover:bg-white/6 hover:border-white/15 transition-all duration-300 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-2xl">{s.icon}</div>
                      <span className="text-4xl font-black text-white/8 select-none">{s.n}</span>
                    </div>
                    <h3 className="font-bold text-white mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to={audience === 'expert' ? '/register?role=expert' : '/register'}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-orange-500/25">
              {audience === 'expert' ? 'Registrarme como experto' : 'Publicar mi primer Jale'} →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ CONFIANZA / BENTO ══════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <FadeIn className="text-center mb-14">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Por qué El Jale</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Construido para la confianza</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Cada detalle diseñado para que clientes y expertos trabajen tranquilos.</p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Card grande — pago */}
            <FadeIn className="md:col-span-2">
              <div className="bg-gray-950 rounded-3xl p-8 relative overflow-hidden group h-full">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.12),transparent_70%)] group-hover:opacity-150 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-3xl mb-5">🔒</div>
                  <h3 className="text-white text-2xl font-black mb-3">Pago 100% protegido</h3>
                  <p className="text-gray-400 leading-relaxed max-w-sm mb-6">Tu dinero se guarda en escrow y solo se libera cuando TÚ confirmas que el trabajo quedó perfecto. Si algo falla, te reembolsamos.</p>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {['#f97316','#3b82f6','#10b981'].map((c,i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-950 flex items-center justify-center text-sm" style={{ background: c }}>
                          {['🔧','⚡','🎨'][i]}
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-600 text-xs">+{stats.experts} expertos protegidos por escrow</p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Verificación */}
            <FadeIn delay={100}>
              <div className="bg-orange-50 border border-orange-100 rounded-3xl p-7 flex flex-col justify-between group hover:shadow-lg transition-shadow h-full">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-3xl mb-5">✅</div>
                  <h3 className="text-gray-900 text-xl font-black mb-2">Expertos verificados</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Revisión de identidad (KYC) obligatoria. Solo aparecen los que pasan el filtro.</p>
                </div>
                <div className="mt-5 bg-white rounded-2xl p-3 flex items-center gap-2.5 shadow-sm">
                  <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Identidad confirmada</p>
                    <p className="text-[10px] text-gray-400">INE + Selfie verificados</p>
                  </div>
                </div>
              </div>
            </FadeIn>

            {TRUST.slice(2).map((t, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-7 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group h-full">
                  <div className="text-3xl mb-4">{t.icon}</div>
                  <h3 className="text-gray-900 text-lg font-black mb-2">{t.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRECIOS ════════════════════════════════════════════ */}
      <section id="precios" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <FadeIn className="text-center mb-14">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Transparencia total</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Precios claros</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Sin cargos escondidos. El cliente sabe cuánto paga. El experto sabe cuánto gana.</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <FadeIn>
              <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 hover:border-orange-200 transition-colors h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">🏠</div>
                  <div>
                    <p className="font-black text-gray-900 text-lg">Para Clientes</p>
                    <p className="text-xs text-gray-400">Publica y encuentra expertos</p>
                  </div>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-black text-gray-900">Gratis</span>
                  <p className="text-gray-500 text-sm mt-1">Sin cargos por publicar. Solo pagas el trabajo.</p>
                </div>
                <ul className="space-y-3 mb-7 flex-1">
                  {['Publicar trabajos gratis','Recibir y comparar cotizaciones','Chat con expertos','Pago protegido en escrow','Reembolso si algo sale mal'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block text-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl transition-colors">
                  Publicar trabajo gratis →
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="bg-orange-500 rounded-3xl p-8 relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">Más popular</div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🔧</div>
                  <div>
                    <p className="font-black text-white text-lg">Para Expertos</p>
                    <p className="text-xs text-orange-200">Recibe trabajos y cobra seguro</p>
                  </div>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-black text-white">10%</span>
                  <p className="text-orange-200 text-sm mt-1">Comisión solo cuando cobras. Sin mensualidad.</p>
                </div>
                <ul className="space-y-3 mb-7 flex-1">
                  {['Perfil verificado visible','Notificaciones de trabajos en tu zona','Chat y cotizaciones ilimitadas','Pago garantizado antes de llegar','Badges y reputación digital','Socios Fundadores: comisión especial'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                      <svg className="w-4 h-4 text-white/70 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register?role=expert" className="block text-center bg-white text-orange-600 hover:bg-orange-50 font-bold py-3.5 rounded-2xl transition-colors">
                  Registrarme como experto →
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALES ══════════════════════════════════════ */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-5">
          <FadeIn className="text-center mb-14">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Historias reales</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Lo que dicen nuestros usuarios</h2>
            <div className="flex justify-center items-center gap-2 mt-3">
              {[1,2,3,4,5].map(i => <Star key={i} size="w-5 h-5" />)}
              <span className="text-gray-700 font-bold ml-1">{stats.rating}/5</span>
              <span className="text-gray-400 text-sm">· {stats.jobs}+ reseñas</span>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div className={`bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col ${i === 2 ? 'border-l-4 border-l-orange-400' : ''}`}>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.stars)].map((_,j) => <Star key={j} />)}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-5 flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: t.color }}>
                      {t.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role} · {t.city}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                      t.tag === 'Experto Top'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-orange-50 text-orange-600 border border-orange-100'
                    }`}>{t.tag === 'Experto Top' ? '⭐ ' : ''}{t.tag}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA EXPERTOS ══════════════════════════════════════ */}
      <section id="expertos" className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(249,115,22,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <p className="text-orange-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Para técnicos y artesanos</p>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
                  Deja de buscar clientes.<br />
                  <span className="text-orange-400">Los clientes te encuentran a ti.</span>
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                  Crea tu perfil en 5 minutos, recibe trabajos en tu zona y cobra siempre seguro. El pago está garantizado antes de que llegues.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  {['✅ Sin mensualidad','💰 Solo cobras 10% al terminar','🏆 Perfil con reseñas y badges','📱 App con notificaciones','⭐ Socios Fundadores: comisión especial'].map(f => (
                    <span key={f} className="text-xs text-gray-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">{f}</span>
                  ))}
                </div>
                <Link to="/register?role=expert"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-orange-500/25 text-base">
                  Registrarme gratis →
                </Link>
              </div>
            </FadeIn>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '💵', title: 'Cobra siempre', desc: 'El dinero está en escrow. No hay manera de que no cobres.' },
                { icon: '🚫', title: 'Sin regateos', desc: 'El cliente ya vio el precio. Si acepta, lo paga completo.' },
                { icon: '⚡', title: 'Trabaja hoy', desc: 'Trabajos urgentes con tarifa premium. Responde rápido.' },
                { icon: '🏆', title: 'Crece tu marca', desc: 'Cada reseña es una publicidad gratuita de tu trabajo.' },
              ].map((f, i) => (
                <FadeIn key={i} delay={i * 80}>
                  <div className="bg-white/5 border border-white/8 rounded-2xl p-5 hover:bg-white/8 transition-colors h-full">
                    <span className="text-3xl block mb-3">{f.icon}</span>
                    <p className="text-white font-bold text-sm mb-1">{f.title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-5">
          <FadeIn className="text-center mb-14">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">Respuestas rápidas</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Preguntas frecuentes</h2>
          </FadeIn>

          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <FadeIn key={i} delay={i * 50}>
                <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${openFaq === i ? 'border-orange-200 shadow-sm' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                  >
                    <span className="font-semibold text-gray-900 text-sm">{f.q}</span>
                    <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-orange-500' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════════════ */}
      <section className="py-24 bg-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto px-5 text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
              ¿Listo para tu<br />primer Jale?
            </h2>
            <p className="text-orange-100 text-xl mb-10 max-w-xl mx-auto">
              Expertos verificados esperan tu solicitud. Publica gratis en 2 minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-orange-50 font-black px-10 py-5 rounded-2xl transition-all active:scale-95 text-lg shadow-2xl">
                Publicar trabajo gratis →
              </Link>
              <Link to="/register?role=expert"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white hover:bg-white/10 font-bold px-10 py-5 rounded-2xl transition-all text-lg">
                Soy experto, quiero trabajar
              </Link>
            </div>
            <p className="text-orange-200 text-sm mt-6">Sin tarjeta de crédito · Gratis para clientes · 10% solo al cobrar</p>
          </FadeIn>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer className="bg-[#0a0a0a] py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid sm:grid-cols-4 gap-10 mb-12">
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-500/30">J</div>
                <span className="text-xl font-black text-white">El Jale</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">El marketplace de servicios del hogar de México. Expertos verificados, pago seguro.</p>
              <div className="flex items-center gap-1.5 mt-4">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-gray-600 text-xs">Plataforma en línea 24/7</span>
              </div>
              {/* Payment methods */}
              <div className="mt-5 flex flex-wrap gap-2">
                {['MercadoPago','OXXO','SPEI','Efectivo'].map(m => (
                  <span key={m} className="text-[10px] font-semibold text-gray-600 border border-white/8 px-2 py-1 rounded-lg">{m}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-gray-300 font-semibold text-sm mb-4">Plataforma</p>
              <div className="space-y-2.5">
                {[
                  { to: '/register',              label: 'Publicar trabajo' },
                  { to: '/register?role=expert',  label: 'Ser experto' },
                  { to: '/login',                 label: 'Iniciar sesión' },
                ].map(l => <Link key={l.to} to={l.to} className="block text-gray-600 hover:text-white text-sm transition-colors">{l.label}</Link>)}
              </div>
            </div>

            <div>
              <p className="text-gray-300 font-semibold text-sm mb-4">Servicios populares</p>
              <div className="space-y-2.5">
                {SERVICES.slice(0, 5).map(s => (
                  <Link key={s.slug} to={`/servicios/${s.slug}`} className="block text-gray-600 hover:text-white text-sm transition-colors">
                    {s.icon} {s.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-gray-300 font-semibold text-sm mb-4">Más servicios</p>
              <div className="space-y-2.5">
                {SERVICES.slice(5).map(s => (
                  <Link key={s.slug} to={`/servicios/${s.slug}`} className="block text-gray-600 hover:text-white text-sm transition-colors">
                    {s.icon} {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-700 text-sm">© 2025 El Jale · Maewalliscorp · Hecho en México 🇲🇽</p>
            <p className="text-gray-700 text-xs">Pago seguro · Expertos verificados · Soporte 24/7</p>
          </div>
        </div>
      </footer>

      {/* ══ STICKY MOBILE CTA ══════════════════════════════════ */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-white border-t border-gray-100 shadow-2xl p-3 flex gap-2">
        <Link to="/register?role=expert"
          className="flex-1 text-center py-3 text-sm font-bold text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors">
          Soy experto
        </Link>
        <Link to="/register"
          className="flex-1 text-center py-3 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors shadow-lg shadow-orange-500/30">
          Publicar trabajo
        </Link>
      </div>

    </div>
  );
}
