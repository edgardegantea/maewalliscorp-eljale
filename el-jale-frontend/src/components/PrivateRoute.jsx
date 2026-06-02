// src/components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const allowed = Array.isArray(role) ? role : [role];
  if (role && !allowed.includes(user.role)) {
    const redirects = { expert: '/expert-dashboard', client: '/client-dashboard', admin: '/admin' };
    return <Navigate to={redirects[user.role] || '/login'} replace />;
  }

  return children;
}
