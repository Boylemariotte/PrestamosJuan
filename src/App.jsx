import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Clientes from './pages/Clientes';
import ClienteDetalle from './pages/ClienteDetalle';
import CreditosActivos from './pages/CreditosActivos';
import CreditosFinalizados from './pages/CreditosFinalizados';
import Estadisticas from './pages/Estadisticas';
import Configuracion from './pages/Configuracion';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Ruta pública de Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Clientes />} />
                    <Route path="/cliente/:id" element={<ClienteDetalle />} />
                    <Route path="/creditos-activos" element={<CreditosActivos />} />
                    <Route path="/creditos-finalizados" element={<CreditosFinalizados />} />
                    <Route path="/estadisticas" element={
                      <ProtectedRoute requiredPermission="verEstadisticas">
                        <Estadisticas />
                      </ProtectedRoute>
                    } />
                    <Route path="/configuracion" element={
                      <ProtectedRoute requiredPermission="verConfiguracion">
                        <Configuracion />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
