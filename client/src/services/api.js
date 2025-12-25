/**
 * Servicio de API para comunicación con el backend
 */

const API_URL = import.meta.env.VITE_API_URL ||'http://localhost:5000/api';

/**
 * Obtener el token de autenticación desde localStorage
 */
const getToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Realizar una petición HTTP
 */
const request = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  // Si hay body, convertirlo a JSON
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Si no es JSON, intentar leer texto o usar un objeto por defecto
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text || response.statusText };
      }
    }

    if (!response.ok) {
      // Si es error 401, limpiar token y redirigir
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        // No redirigir aquí, dejar que el componente maneje la redirección
      }
      throw new Error(data.error || data.message || `Error en la petición (${response.status})`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Métodos HTTP
 */
export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' })
};

/**
 * Servicio de autenticación
 */
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.success && response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data));
    }
    return response;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  changePassword: async (currentPassword, newPassword) => {
    return await api.put('/auth/change-password', { currentPassword, newPassword });
  }
};

export default api;

