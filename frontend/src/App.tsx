import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './auth/ThemeContext';
import { PrivateRoute } from './auth/PrivateRoute';
import { ParkingProvider } from './context/ParkingContext';
import { AdminLayout } from './components/Layout/AdminLayout';
import Login from './pages/Login';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Reservas from './pages/Reservas';
import CheckIn from './pages/CheckIn';
import CheckOut from './pages/CheckOut';
import MapaVagas from './pages/MapaVagas';
import NovaReserva from './pages/NovaReserva';
import Auditoria from './pages/Auditoria';
import AccessDenied from './pages/AccessDenied';
import NotFound from './pages/NotFound';
import './index.css';

function App() {
  const Protegida = ({ children }: { children: React.ReactNode }) => (
    <PrivateRoute>
      <AdminLayout>{children}</AdminLayout>
    </PrivateRoute>
  );

  const SoAdmin = ({ children }: { children: React.ReactNode }) => (
    <PrivateRoute perfisPermitidos={['ADMIN']}>
      <AdminLayout>{children}</AdminLayout>
    </PrivateRoute>
  );

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ParkingProvider>
            <Routes>
              {/* Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/acesso-negado" element={<AccessDenied />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Acessíveis para ADMIN e FUNCIONARIO */}
              <Route path="/mapa"         element={<Protegida><MapaVagas /></Protegida>} />
              <Route path="/reservas"     element={<Protegida><Reservas /></Protegida>} />
              <Route path="/nova-reserva" element={<Protegida><NovaReserva /></Protegida>} />
              <Route path="/checkin"      element={<Protegida><CheckIn /></Protegida>} />
              <Route path="/checkout"     element={<Protegida><CheckOut /></Protegida>} />
              <Route path="/relatorios"   element={<Protegida><Relatorios /></Protegida>} />

              {/* Exclusivas para ADMIN */}
              <Route path="/auditoria"     element={<SoAdmin><Auditoria /></SoAdmin>} />
              <Route path="/configuracoes" element={<SoAdmin><Configuracoes /></SoAdmin>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </ParkingProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
