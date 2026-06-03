// src/components/LandingPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const SERVICES = [
  { icon: '🔧', name: 'Plomería',           desc: 'Fugas, instalaciones, tuberías',           slug: 'fontaneros' },
  { icon: '⚡', name: 'Electricidad',        desc: 'Cortocircuitos, tableros, instalaciones',  slug: 'electricistas' },
  { icon: '🏗️', name: 'Albañilería',         desc: 'Construcción, remodelación, acabados',     slug: 'albanileria' },
  { icon: '🎨', name: 'Pintura',             desc: 'Interior, exterior, acabados finos',       slug: 'pintores' },
  { icon: '❄️', name: 'Aire Acondicionado',  desc: 'Instalación y mantenimiento',              slug: 'aire-acondicionado' },
  { icon: '🪵', name: 'Carpintería',         desc: 'Muebles, puertas, ventanas',               slug: 'carpinteros' },
  { icon: '⚙️', name: 'Herrería',            desc: 'Rejas, puertas, trabajos en metal',        slug: 'herreria' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '📝', title: 'Publica tu Jale', desc: 'Describe el problema, agrega fotos y fija tu presupuesto. Gratis y en menos de 2 minutos.' },
  { step: '02', icon: '💬', title: 'Recibe cotizaciones', desc: 'Expertos verificados de tu zona envían sus ofertas con precio y mensaje personalizado.' },
  { step: '03', icon: '✅', title: 'Elige y contrata', desc: 'Compara perfiles, calificaciones y precios. Acepta la mejor propuesta.' },
  { step: '04', icon: '🔒', title: 'Pago seguro', desc: 'Tu dinero queda protegido hasta que confirmes que el trabajo quedó perfecto.' },
];

const TESTIMONIALS = [
  { name: 'María G.', role: 'Cliente', stars: 5, text: 'Carlos llegó puntual, resolvió la fuga en una hora y dejó todo limpio. El proceso de pago fue muy seguro.', avatar: 'M' },
  { name: 'Roberto J.', role: 'Cliente', stars: 5, text: 'Luis encontró el problema eléctrico en 20 minutos. Profesional, limpio y a buen precio. Muy recomendado.', avatar: 'R' },
  { name: 'Carlos H.', role: 'Experto · Plomero', stars: 5, text: 'La plataforma me consigue clientes serios con el pago garantizado. Ya no pierdo tiempo con regateos.', avatar: 'C' },
];

export default function LandingPage() {
  const [stats, setStats] = useState({ experts: '50+', jobs: '100+', rating: '4.9' });
  const [email, setEmail] = useState('');

  useEffect(() => {
    api.get('/admin/stats').catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-2xl font-black text-brand-dark">El <span className="text-brand-primary">Jale</span></span>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#servicios" className="hover:text-brand-primary transition-colors">Servicios</a>
            <a href="#como-funciona" className="hover:text-brand-primary transition-colors">¿Cómo funciona?</a>
            <a href="#expertos" className="hover:text-brand-primary transition-colors">Para expertos</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-brand-primary transition-colors hidden sm:block">Iniciar sesión</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Únete gratis</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-16 min-h-screen flex items-center bg-gradient-to-br from-brand-dark via-slate-900 to-slate-800 relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-screen-xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/20 rounded-full">
              <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
              <span className="text-brand-primary text-sm font-semibold">Especialistas verificados disponibles ahora</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.05]">
              Tu hogar merece<br />
              <span className="text-brand-primary">el mejor experto.</span>
            </h1>

            <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
              Conectamos a clientes con plomeros, electricistas y más especialistas verificados. Pago seguro, sin regateos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="btn-primary text-base px-8 py-4 text-center">
                Publicar un Jale gratis →
              </Link>
              <Link to="/register?role=expert" className="btn-secondary text-base px-8 py-4 text-center bg-white/10 border-white/20 text-white hover:bg-white/20">
                Soy experto, quiero trabajar
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              {[
                { value: stats.experts, label: 'Especialistas activos' },
                { value: stats.jobs, label: 'Jales completados' },
                { value: `${stats.rating}⭐`, label: 'Calificación promedio' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card flotante */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="card p-6 max-w-sm mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white text-lg">🔧</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Carlos Herrera</p>
                    <p className="text-xs text-gray-500">Plomero · Verificado ✓</p>
                  </div>
                  <div className="ml-auto">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block animate-pulse-slow" />
                    <span className="text-xs text-emerald-600 ml-1 font-medium">Disponible</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => <svg key={i} className="w-4 h-4 text-brand-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                  <span className="text-sm font-bold text-gray-700 ml-1">5.0</span>
                  <span className="text-xs text-gray-400">(24 reseñas)</span>
                </div>
                <p className="text-xs text-gray-600 italic">"Llegué puntual, resolví la fuga en 1h y dejé todo limpio."</p>
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span className="text-xs text-emerald-700 font-medium">Pago asegurado $850</span>
                </div>
              </div>
              {/* Badge flotante */}
              <div className="absolute -top-4 -right-4 bg-brand-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                +3 cotizaciones
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section id="servicios" className="py-20 bg-slate-50">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Servicios disponibles</h2>
            <p className="text-gray-500 mt-2">Especialistas verificados para cada necesidad de tu hogar</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {SERVICES.map(s => (
              <Link to={`/servicios/${s.slug}`} key={s.name}
                className="card p-4 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-3xl block mb-2">{s.icon}</span>
                <p className="font-bold text-sm text-gray-900 group-hover:text-brand-primary transition-colors">{s.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block leading-tight">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Así de simple</h2>
            <p className="text-gray-500 mt-2">De la solicitud al trabajo terminado en horas, no días</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-brand-primary/30 to-transparent z-10" />
                )}
                <div className="card p-6 hover:shadow-card-hover transition-all duration-200">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{step.icon}</span>
                    <span className="text-xs font-black text-brand-primary/50 uppercase tracking-widest">{step.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GARANTÍAS ── */}
      <section className="py-16 bg-gradient-to-r from-brand-dark to-slate-800">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: '🔒', title: 'Pago 100% Seguro', desc: 'Tu dinero está protegido en escrow hasta que confirmes el trabajo.' },
              { icon: '✅', title: 'Expertos Verificados', desc: 'Todos los especialistas pasan por revisión de identidad y competencias.' },
              { icon: '⭐', title: 'Garantía de Calidad', desc: 'Si no quedas satisfecho, abrimos una disputa y protegemos tu dinero.' },
            ].map(g => (
              <div key={g.title} className="text-center">
                <span className="text-4xl block mb-3">{g.icon}</span>
                <h3 className="font-bold text-white mb-1">{g.title}</h3>
                <p className="text-sm text-gray-400">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(t.stars)].map((_, j) => <svg key={j} className="w-4 h-4 text-brand-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                </div>
                <p className="text-gray-600 text-sm italic leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-sm">{t.avatar}</div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA EXPERTOS ── */}
      <section id="expertos" className="py-20 bg-brand-primary">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-white mb-4">¿Eres experto en tu oficio?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">Únete como Socio Fundador, recibe trabajos de clientes serios y cobra seguro. Sin regateos.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-brand-primary font-bold px-8 py-4 rounded-2xl hover:bg-orange-50 transition-all active:scale-95 text-base">
              Registrarme como experto →
            </Link>
          </div>
          <p className="text-white/60 text-sm mt-4">Los primeros 50 expertos obtienen comisión preferencial de por vida.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-brand-dark py-10 text-center">
        <span className="text-xl font-black text-white">El <span className="text-brand-primary">Jale</span></span>
        <p className="text-gray-500 text-sm mt-2">© 2025 Maewalliscorp · Todos los derechos reservados</p>
        <div className="flex justify-center gap-6 mt-4 text-sm text-gray-500">
          <Link to="/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
          <Link to="/register" className="hover:text-white transition-colors">Registrarse</Link>
        </div>
      </footer>

    </div>
  );
}
