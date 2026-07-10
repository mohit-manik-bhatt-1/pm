import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLiveFeed } from './context/useLiveFeed';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import MachineDetail from './pages/MachineDetail';
import Alerts from './pages/Alerts';
import Maintenance from './pages/Maintenance';
import { theme } from './theme';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  const { connected } = useLiveFeed();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.colors.bg }}>
      <Sidebar connected={connected} />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/machines"
        element={
          <ProtectedLayout>
            <Machines />
          </ProtectedLayout>
        }
      />
      <Route
        path="/machines/:machineId"
        element={
          <ProtectedLayout>
            <MachineDetail />
          </ProtectedLayout>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedLayout>
            <Alerts />
          </ProtectedLayout>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedLayout>
            <Maintenance />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
