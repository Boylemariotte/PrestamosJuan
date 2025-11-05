import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Pages
import Login from './pages/Login';
import Clientes from './pages/Clientes';
import ClienteDetalle from './pages/ClienteDetalle';
import CreditosActivos from './pages/CreditosActivos';
import CreditosFinalizados from './pages/CreditosFinalizados';
import Estadisticas from './pages/Estadisticas';
import Configuracion from './pages/Configuracion';
import DiaDeCobro from './pages/DiaDeCobro';
import Caja from './pages/Caja';
import RutasDeCobro from './pages/RutasDeCobro';
import FlujoCajas from './pages/FlujoCajas';
import Alertas from './pages/Alertas';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Login - No requiere autenticación */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Clientes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/cliente/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClienteDetalle />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dia-de-cobro"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DiaDeCobro />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/caja"
              element={
                <ProtectedRoute requiredPermission="verCaja">
                  <Layout>
                    <Caja />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/creditos-activos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreditosActivos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/creditos-finalizados"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreditosFinalizados />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/estadisticas"
              element={
                <ProtectedRoute requiredPermission="verEstadisticas">
                  <Layout>
                    <Estadisticas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/configuracion"
              element={
                <ProtectedRoute requiredPermission="verConfiguracion">
                  <Layout>
                    <Configuracion />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/rutas-de-cobro"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RutasDeCobro />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/flujo-cajas"
              element={
                <ProtectedRoute requiredPermission="gestionarCaja">
                  <Layout>
                    <FlujoCajas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/alertas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Alertas />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Redirigir cualquier ruta no encontrada a la página principal */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

