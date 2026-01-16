import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Lazy loading de páginas para mejorar el rendimiento inicial
const Login = lazy(() => import('./pages/Login'));
const Clientes = lazy(() => import('./pages/Clientes'));
const ClienteDetalle = lazy(() => import('./pages/ClienteDetalle'));
const ClientesArchivados = lazy(() => import('./pages/ClientesArchivados'));
const CreditosActivos = lazy(() => import('./pages/CreditosActivos'));
const Estadisticas = lazy(() => import('./pages/Estadisticas'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const DiaDeCobro = lazy(() => import('./pages/DiaDeCobro'));
const Rutas = lazy(() => import('./pages/Rutas'));
const FlujoCajas = lazy(() => import('./pages/FlujoCajas'));
const Alertas = lazy(() => import('./pages/Alertas'));
const Papeleria = lazy(() => import('./pages/Papeleria'));
const Visitas = lazy(() => import('./pages/Visitas'));
const GestionUsuarios = lazy(() => import('./pages/GestionUsuarios'));
const Perfil = lazy(() => import('./pages/Perfil'));
const HistorialBorrados = lazy(() => import('./pages/HistorialBorrados'));
const Supervision = lazy(() => import('./pages/Supervision'));
const RF = lazy(() => import('./pages/RF'));
const TotalMultas = lazy(() => import('./pages/TotalMultas'));
const Notas = lazy(() => import('./pages/Notas'));
const BuscarDocumento = lazy(() => import('./pages/BuscarDocumento'));

// Componente de carga
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Cargando...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
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
                path="/historial-borrados"
                element={
                  <ProtectedRoute requiredRole="administrador">
                    <Layout>
                      <HistorialBorrados />
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
                path="/supervision"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Supervision />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rf"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RF />
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
                path="/total-multas"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TotalMultas />
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

              <Route
                path="/notas"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Notas />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/buscar-documento"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BuscarDocumento />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Redirigir cualquier ruta no encontrada a la página principal */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

