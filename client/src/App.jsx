import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Lazy loading de páginas
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

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Suspense fallback={<LoadingFallback />}><Login /></Suspense>
  },
  {
    path: "/",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><Clientes /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/cliente/:id",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><ClienteDetalle /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/archivados",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><ClientesArchivados /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/archivados/cliente/:id",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><ClienteDetalle soloLectura={true} /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/dia-de-cobro",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><DiaDeCobro /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/rutas",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><Rutas /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/caja",
    element: <ProtectedRoute requiredRole="administrador"><Layout><Suspense fallback={<LoadingFallback />}><FlujoCajas /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/creditos-activos",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><CreditosActivos /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/usuarios",
    element: <ProtectedRoute requiredRole="ceo"><Layout><Suspense fallback={<LoadingFallback />}><GestionUsuarios /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/historial-borrados",
    element: <ProtectedRoute requiredRole="administrador"><Layout><Suspense fallback={<LoadingFallback />}><HistorialBorrados /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/perfil",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><Perfil /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/estadisticas",
    element: <ProtectedRoute requiredPermission="verEstadisticas"><Layout><Suspense fallback={<LoadingFallback />}><Estadisticas /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/configuracion",
    element: <ProtectedRoute requiredPermission="verConfiguracion"><Layout><Suspense fallback={<LoadingFallback />}><Configuracion /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/flujo-cajas",
    element: <ProtectedRoute requiredPermission="gestionarCaja"><Layout><Suspense fallback={<LoadingFallback />}><FlujoCajas /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/alertas",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><Alertas /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/supervision",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><Supervision /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/rf",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><RF /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/papeleria",
    element: <ProtectedRoute requiredRole="administrador"><Layout><Suspense fallback={<LoadingFallback />}><Papeleria /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/total-multas",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><TotalMultas /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/visitas",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><Visitas /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/notas",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><Notas /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "/buscar-documento",
    element: <ProtectedRoute><Layout><Suspense fallback={<LoadingFallback />}><BuscarDocumento /></Suspense></Layout></ProtectedRoute>
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

