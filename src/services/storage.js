// Servicio de almacenamiento local usando LocalStorage
const STORAGE_KEY = 'creditos_app_data';

export const storage = {
  // Obtener todos los datos
  getData: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { clientes: [] };
    } catch (error) {
      console.error('Error al leer datos:', error);
      return { clientes: [] };
    }
  },

  // Guardar todos los datos
  saveData: (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error al guardar datos:', error);
      return false;
    }
  },

  // Limpiar todos los datos
  clearData: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error al limpiar datos:', error);
      return false;
    }
  },

  // Exportar datos como JSON
  exportData: () => {
    const data = storage.getData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `creditos_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // Importar datos desde JSON
  importData: (jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      storage.saveData(data);
      return true;
    } catch (error) {
      console.error('Error al importar datos:', error);
      return false;
    }
  }
};
