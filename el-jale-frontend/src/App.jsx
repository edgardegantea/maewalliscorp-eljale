// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import ExpertDashboard from './components/ExpertDashboard';
import ClientDashboard from './components/ClientDashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from './components/AdminDashboard';
import ExpertProfile from './components/ExpertProfile';
import ExploreExperts from './components/ExploreExperts';

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
  return (
    <Router>
      <Routes>
        {/* Landing pública */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Perfiles públicos (no requieren login) */}
        <Route path="/expertos/:id" element={<ExpertProfile />} />

        {/* Dashboards protegidos */}
        <Route path="/expert-dashboard" element={<PrivateRoute role="expert"><ExpertDashboard /></PrivateRoute>} />
        <Route path="/client-dashboard" element={<PrivateRoute role="client"><ClientDashboard /></PrivateRoute>} />
        <Route path="/explorar"         element={<PrivateRoute role="client"><ExploreExperts /></PrivateRoute>} />
        <Route path="/admin"            element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
