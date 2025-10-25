import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Usuarios predefinidos
const USERS = {
  domiciliario: {
    username: 'domiciliario',
    password: 'dom123',
    role: 'domiciliario',
    nombre: 'Domiciliario'
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'administrador',
    nombre: 'Administrador'
  },
  ceo: {
    username: 'ceo',
    password: 'ceo123',
    role: 'ceo',
    nombre: 'CEO'
  }
};

// Definición de permisos por rol
const PERMISSIONS = {
  domiciliario: {
    verClientes: true,
    verCreditosActivos: true,
    verCreditosFinalizados: true,
    registrarPagos: true,
    agregarNotas: true,
    agregarMultas: true,
    crearClientes: false,
    editarClientes: false,
    eliminarClientes: false,
    crearCreditos: false,
    editarCreditos: false,
    eliminarCreditos: false,
    verEstadisticas: false,
    verConfiguracion: false,
    exportarDatos: false,
    importarDatos: false,
    limpiarDatos: false,
    verCaja: false,
    gestionarCaja: false
  },
  administrador: {
    verClientes: true,
    verCreditosActivos: true,
    verCreditosFinalizados: true,
    registrarPagos: true,
    agregarNotas: true,
    agregarMultas: true,
    crearClientes: true,
    editarClientes: true,
    eliminarClientes: true,
    crearCreditos: true,
    editarCreditos: true,
    eliminarCreditos: false,
    verEstadisticas: true,
    verConfiguracion: false,
    exportarDatos: true,
    importarDatos: false,
    limpiarDatos: false,
    verCaja: true,
    gestionarCaja: true
  },
  ceo: {
    verClientes: true,
    verCreditosActivos: true,
    verCreditosFinalizados: true,
    registrarPagos: true,
    agregarNotas: true,
    agregarMultas: true,
    crearClientes: true,
    editarClientes: true,
    eliminarClientes: true,
    crearCreditos: true,
    editarCreditos: true,
    eliminarCreditos: true,
    verEstadisticas: true,
    verConfiguracion: true,
    exportarDatos: true,
    importarDatos: true,
    limpiarDatos: true,
    verCaja: true,
    gestionarCaja: true
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    const userFound = USERS[username];
    
    if (userFound && userFound.password === password) {
      const userData = {
        username: userFound.username,
        role: userFound.role,
        nombre: userFound.nombre
      };
      
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return { success: true };
    }
    
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return PERMISSIONS[user.role]?.[permission] || false;
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
