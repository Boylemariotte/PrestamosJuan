import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, TrendingUp, CheckCircle, BarChart3, Settings, LogOut, User, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Clientes', icon: Users },
    { path: '/dia-de-cobro', label: 'Día de Cobro', icon: Calendar },
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
        <div className="flex justify-between h-16">
          <div className="flex items-center min-w-[200px]">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-slate-700" />
              <span className="text-xl font-bold text-slate-800 whitespace-nowrap">
                Prestamos Juan
              </span>
            </div>
          </div>
          
          <div className="hidden sm:flex sm:items-center sm:gap-2 sm:ml-8">
            {getFilteredNavItems().map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Información del usuario y logout */}
            <div className="flex items-center gap-4 ml-6 pl-6 border-l border-gray-200">
              <div className="flex items-center gap-2">
                <div className="bg-sky-100 p-2 rounded-full">
                  <User className="h-4 w-4 text-sky-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">{user?.nombre}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="px-4 pt-2 pb-3 space-y-2">
          {getFilteredNavItems().map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                  isActive
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
