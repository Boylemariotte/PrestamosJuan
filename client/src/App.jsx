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
import ClientesArchivados from './pages/ClientesArchivados';
import CreditosActivos from './pages/CreditosActivos';
import Estadisticas from './pages/Estadisticas';
import Configuracion from './pages/Configuracion';
import DiaDeCobro from './pages/DiaDeCobro';
import Rutas from './pages/Rutas';

import FlujoCajas from './pages/FlujoCajas';
import Alertas from './pages/Alertas';
import Papeleria from './pages/Papeleria';
import Visitas from './pages/Visitas';
import GestionUsuarios from './pages/GestionUsuarios';
import Perfil from './pages/Perfil';

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
              path="/archivados"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientesArchivados />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/archivados/cliente/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClienteDetalle soloLectura={true} />
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
              path="/rutas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Rutas />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/caja"
              element={
                <ProtectedRoute requiredRole="administrador">
                  <Layout>
                    <FlujoCajas />
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
              path="/usuarios"
              element={
                <ProtectedRoute requiredRole="ceo">
                  <Layout>
                    <GestionUsuarios />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Perfil />
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

            <Route
              path="/papeleria"
              element={
                <ProtectedRoute requiredRole="administrador">
                  <Layout>
                    <Papeleria />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/visitas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Visitas />
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

