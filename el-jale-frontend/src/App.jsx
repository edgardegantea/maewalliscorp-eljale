// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import ExpertDashboard from './components/ExpertDashboard';
import ClientDashboard from './components/ClientDashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from './components/AdminDashboard';
import ExpertProfile from './components/ExpertProfile';
import ExploreExperts from './components/ExploreExperts';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/expert-dashboard"
          element={
            <PrivateRoute role="expert">
              <ExpertDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/client-dashboard"
          element={
            <PrivateRoute role="client">
              <ClientDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/explorar"
          element={
            <PrivateRoute role="client">
              <ExploreExperts />
            </PrivateRoute>
          }
        />

        {/* Perfil público — visible para todos los logueados */}
        <Route
          path="/expertos/:id"
          element={
            <PrivateRoute>
              <ExpertProfile />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;