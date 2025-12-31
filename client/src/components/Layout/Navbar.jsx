import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, TrendingUp, CheckCircle, BarChart3, Settings, LogOut, User, Calendar, ChevronDown, Wallet, Route, ClipboardList, UserPlus, Archive, History } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cerrar dropdown al navegar
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'Clientes', icon: Users },
    { path: '/archivados', label: 'Archivados', icon: Archive },
    { path: '/dia-de-cobro', label: 'Día de Cobro', icon: Calendar },
    { path: '/rutas', label: 'Rutas', icon: Route },
    { path: '/caja', label: 'Caja', icon: Wallet },
    { path: '/visitas', label: 'Visitas', icon: ClipboardList },
    { path: '/supervision', label: 'Supervisión', icon: ClipboardList },
    { path: '/papeleria', label: 'Papelería', icon: ClipboardList },
    { path: '/creditos-activos', label: 'Créditos Activos', icon: TrendingUp },
    { path: '/usuarios', label: 'Gestión de usuarios', icon: UserPlus }, // New Item
    { path: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
    { path: '/historial-borrados', label: 'Historial de borrados', icon: History },
    { path: '/configuracion', label: 'Configuración', icon: Settings }
  ];

  const quickAccessPaths = ['/', '/dia-de-cobro', '/caja'];

  // Filtrar items del nav según permisos y rol de usuario
  const getFilteredNavItems = () => {
    return navItems.filter(item => {
      // Ocultar varias opciones para domiciliarios
      if (user?.role === 'domiciliario') {
        // Ocultar: Caja, Papelería, Archivados, Usuarios, Supervisión
        if (item.path === '/caja' || item.path === '/papeleria' ||
          item.path === '/archivados' || item.path === '/usuarios' ||
          item.path === '/historial-borrados' || item.path === '/supervision') {
          return false;
        }
      }

      // Filtrar para supervisores
      if (user?.role === 'supervisor') {
        // Solo: Clientes, Supervisión
        if (item.path === '/' || item.path === '/supervision') {
          return true;
        }
        return false;
      }

      if (item.path === '/estadisticas') return hasPermission('verEstadisticas');
      if (item.path === '/configuracion') return hasPermission('verConfiguracion');
      if (item.path === '/usuarios') return user?.role === 'ceo'; // Only CEO
      if (item.path === '/historial-borrados') return user?.role === 'ceo' || user?.role === 'administrador';
      if (item.path === '/supervision') return user?.role === 'ceo' || user?.role === 'supervisor';
      return true;
    });
  };

  const getDropdownNavItems = () => {
    return getFilteredNavItems().filter(item => !quickAccessPaths.includes(item.path));
  };

  const getQuickAccessNavItems = () => {
    return getFilteredNavItems().filter(item => quickAccessPaths.includes(item.path));
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center min-w-[200px]">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-slate-700" />
              <span className="text-xl font-extrabold text-slate-800 whitespace-nowrap tracking-tight">
                Servi Carnes
              </span>
            </div>
          </div>

          {/* Contenedor de Accesos Directos y Perfil */}
          <div className="flex items-center gap-4">
            {/* Accesos Directos (Desktop) */}
            <div className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {getQuickAccessNavItems().map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={item.label}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Dropdown del perfil de usuario */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="bg-sky-100 p-2 rounded-full">
                  <User className="h-4 w-4 text-sky-600" />
                </div>
                <div className="text-sm text-left hidden sm:block">
                  <p className="font-semibold text-gray-900 leading-tight">{user?.nombre}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{user?.role}</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Menú desplegable */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in duration-200">
                  {/* Opciones de navegación secundarias */}
                  <div className="px-2 pb-2 border-b border-gray-200">
                    {/* En dispositivos móviles mostramos todos los items filtrados */}
                    {/* En desktop ocultamos los que ya están en acceso directo */}
                    <div className="md:hidden">
                      {getFilteredNavItems().map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                              ? 'bg-slate-700 text-white shadow-md'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>

                    <div className="hidden md:block">
                      {getDropdownNavItems().map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                              ? 'bg-slate-700 text-white shadow-md'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <div className="px-2 py-2 border-b border-gray-200">
                    <Link
                      to="/perfil"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all"
                    >
                      <User className="h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </div>

                  {/* Opción de cerrar sesión */}
                  <div className="px-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
