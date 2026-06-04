// src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useFcm } from './hooks/useFcm';

// Carga inmediata — rutas públicas críticas
import LandingPage  from './components/LandingPage';
import Login        from './components/Login';
import Register     from './components/Register';
import PrivateRoute from './components/PrivateRoute';

// Carga diferida — solo cuando se navega a esa ruta
const ExpertDashboard = lazy(() => import('./components/ExpertDashboard'));
const ClientDashboard = lazy(() => import('./components/ClientDashboard'));
const AdminDashboard  = lazy(() => import('./components/AdminDashboard'));
const ExpertProfile   = lazy(() => import('./components/ExpertProfile'));
const ExploreExperts  = lazy(() => import('./components/ExploreExperts'));
const CategoryPage    = lazy(() => import('./components/CategoryPage'));
const NotFound        = lazy(() => import('./components/NotFound'));
const CompanyDashboard = lazy(() => import('./components/CompanyDashboard'));
const CompanyRegister  = lazy(() => import('./components/CompanyRegister'));

// Spinner de carga global
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-sm text-gray-400 font-medium">Cargando...</p>
      </div>
    </div>
  );
}

// Redirige al dashboard si ya está logueado
function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');
  if (token && user) {
    const redirects = { expert: '/expert-dashboard', admin: '/admin', client: '/client-dashboard' };
    return <Navigate to={redirects[user.role] || '/client-dashboard'} replace />;
  }
  return children;
}

function App() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  useFcm(user);

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rutas públicas — carga inmediata */}
          <Route path="/"         element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Perfiles y categorías SEO — lazy */}
          <Route path="/expertos/:id"       element={<ExpertProfile />} />
          <Route path="/servicios/:categoria" element={<CategoryPage />} />

          {/* Dashboards — lazy */}
          <Route path="/expert-dashboard" element={<PrivateRoute role="expert"><ExpertDashboard /></PrivateRoute>} />
          <Route path="/client-dashboard" element={<PrivateRoute role="client"><ClientDashboard /></PrivateRoute>} />
          <Route path="/explorar"         element={<PrivateRoute role="client"><ExploreExperts /></PrivateRoute>} />
          <Route path="/admin"            element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />

          {/* B2B Empresas */}
          <Route path="/empresas"          element={<CompanyDashboard />} />
          <Route path="/register/empresa"  element={<PublicRoute><CompanyRegister /></PublicRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
