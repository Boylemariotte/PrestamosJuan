import api from '../services/api';

// Obtener todas las transacciones (Ahora retorna Promesa)
export const getPapeleriaTransactions = async () => {
  try {
    const response = await api.get('/papeleria');
    return response.success ? response.data : [];
  } catch (error) {
    console.error('Error al obtener transacciones de papelería:', error);
    return [];
  }
};

// Guardar una nueva transacción (Ahora retorna Promesa)
export const savePapeleriaTransaction = async (transaction) => {
  try {
    // Preparar fecha si es string
    let fecha = transaction.fecha;
    if (typeof fecha === 'string') {
        const d = new Date(fecha);
        // Si no tiene hora, poner mediodía para evitar UTC shift
        if (!fecha.includes('T')) {
            d.setHours(12, 0, 0, 0);
        }
        fecha = d;
    }

    const payload = {
        ...transaction,
        fecha: fecha,
        cantidad: Number(transaction.cantidad)
    };
    
    // Si tiene id, es update, sino create. Pero papeleriaStorage original
    // siempre hacía "save" como "add" (push al array), a menos que viniera lógica de update.
    // FlujoCajas usa savePapeleriaTransaction para CREAR.
    
    const response = await api.post('/papeleria', payload);
    return response.success ? response.data : null;
  } catch (error) {
    console.error('Error al guardar transacción de papelería:', error);
    return null;
  }
};

// Eliminar una transacción (Ahora retorna Promesa)
export const deletePapeleriaTransaction = async (id) => {
  try {
    const response = await api.delete(`/papeleria/${id}`);
    return response.success;
  } catch (error) {
    console.error('Error al eliminar transacción de papelería:', error);
    return false;
  }
};

// Filtrar transacciones (Deprecada o requiere refactor masivo si se usa síncronamente)
// FlujoCajas NO usa esta función. Solo usa save y delete.
// Papeleria.jsx tenía su propia lógica de filtrado y ahora usa backend/local.
export const filterPapeleriaTransactions = async (filters = {}) => {
  // Esta función difícilmente se usará igual que antes de forma síncrona.
  // La dejaré como wrapper de getPapeleria con params
  try {
      const params = new URLSearchParams();
      if(filters.typeFilter && filters.typeFilter !== 'all') params.append('tipo', filters.typeFilter);
      if(filters.searchTerm) params.append('search', filters.searchTerm);
      if(filters.dateFilter) params.append('fechaInicio', filters.dateFilter); // Aprox
      
      const response = await api.get(`/papeleria?${params.toString()}`);
      return response.success ? response.data : [];
  } catch (error) {
      return [];
  }
};
