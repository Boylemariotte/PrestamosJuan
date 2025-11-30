import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, TrendingUp, CheckCircle, BarChart3, Settings, LogOut, User, Calendar, ChevronDown, Wallet, Route, ClipboardList } from 'lucide-react';
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
    { path: '/dia-de-cobro', label: 'Día de Cobro', icon: Calendar },
    { path: '/rutas-de-cobro', label: 'Rutas de Cobro', icon: Route },
    { path: '/caja', label: 'Caja', icon: Wallet },
    { path: '/visitas', label: 'Visitas', icon: ClipboardList },
    { path: '/papeleria', label: 'Papelería', icon: ClipboardList },
    { path: '/creditos-activos', label: 'Créditos Activos', icon: TrendingUp },
    { path: '/creditos-finalizados', label: 'Finalizados', icon: CheckCircle },
    { path: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
    { path: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  // Filtrar items del nav según permisos
  const getFilteredNavItems = () => {
    return navItems.filter(item => {
      if (item.path === '/estadisticas') return hasPermission('verEstadisticas');
      if (item.path === '/configuracion') return hasPermission('verConfiguracion');
      return true;
    });
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

          {/* Dropdown del perfil de usuario */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-gray-200"
            >
              <div className="bg-sky-100 p-2 rounded-full">
                <User className="h-4 w-4 text-sky-600" />
              </div>
              <div className="text-sm text-left">
                <p className="font-semibold text-gray-900">{user?.nombre}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Menú desplegable */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                {/* Opciones de navegación */}
                <div className="px-2 pb-2 border-b border-gray-200">
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
    </nav>
  );
};

export default Navbar;
