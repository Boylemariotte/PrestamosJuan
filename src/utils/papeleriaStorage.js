// Clave para el localStorage
const STORAGE_KEY = 'papeleria_transactions';

// Obtener todas las transacciones
export const getPapeleriaTransactions = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error al obtener transacciones de papelería:', error);
    return [];
  }
};

// Guardar una nueva transacción
export const savePapeleriaTransaction = (transaction) => {
  try {
    const transactions = getPapeleriaTransactions();
    const newTransaction = {
      ...transaction,
      id: transaction.id || Date.now().toString(),
      fecha: new Date(transaction.fecha).toISOString()
    };
    const updatedTransactions = [newTransaction, ...transactions];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
    return newTransaction;
  } catch (error) {
    console.error('Error al guardar transacción de papelería:', error);
    return null;
  }
};

// Eliminar una transacción
export const deletePapeleriaTransaction = (id) => {
  try {
    const transactions = getPapeleriaTransactions();
    const updatedTransactions = transactions.filter(tx => tx.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions));
    return true;
  } catch (error) {
    console.error('Error al eliminar transacción de papelería:', error);
    return false;
  }
};

// Filtrar transacciones
export const filterPapeleriaTransactions = (filters = {}) => {
  const { searchTerm = '', dateFilter = '', typeFilter = 'all' } = filters;
  const transactions = getPapeleriaTransactions();
  
  return transactions.filter(transaction => {
    const matchesSearch = transaction.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.prestamoId && transaction.prestamoId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const transactionDate = new Date(transaction.fecha).toISOString().split('T')[0];
    const matchesDate = !dateFilter || transactionDate === dateFilter;
    
    const matchesType = typeFilter === 'all' || transaction.tipo === typeFilter;
    
    return matchesSearch && matchesDate && matchesType;
  });
};
