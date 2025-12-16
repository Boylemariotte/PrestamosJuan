import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario desde localStorage al iniciar y verificar token
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');

      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Verificar que el token sigue siendo válido
          try {
            const response = await authService.getMe();
            if (response.success) {
              // Actualizar datos del usuario desde el servidor
              setUser(response.data);
              localStorage.setItem('auth_user', JSON.stringify(response.data));
            } else {
              // Token inválido, limpiar
              authService.logout();
              setUser(null);
            }
          } catch (error) {
            // Token inválido o error de conexión
            console.error('Error al verificar token:', error);
            authService.logout();
            setUser(null);
          }
        } catch (error) {
          console.error('Error al cargar usuario:', error);
          authService.logout();
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      
      if (response.success) {
        setUser(response.data);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Error al iniciar sesión' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Error de conexión con el servidor' 
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions[permission] || false;
  };

  const canAccess = (requiredRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      domiciliario: 1,
      administrador: 2,
      ceo: 3
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    canAccess,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
