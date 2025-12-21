import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, Search, Calendar as CalendarIcon, Filter, Plus, FileDown, Trash2, Edit, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';

const Papeleria = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    tipo: 'ingreso',
    descripcion: '',
    cantidad: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    prestamoId: '',
  });

  // Cargar transacciones del backend
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/papeleria');
      if (response.success) {
        // Asegurar que las fechas sean objetos Date
        const transactionsWithDates = response.data.map(tx => ({
          ...tx,
          fecha: new Date(tx.fecha)
        }));
        setTransactions(transactionsWithDates);
      }
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Preparar fecha (si es fecha pura, poner a mediodía para evitar UTC shift)
    const fechaInput = new Date(formData.fecha);
    fechaInput.setHours(12, 0, 0, 0);

    const newTransaction = {
      ...formData,
      cantidad: Number(formData.cantidad),
      fecha: fechaInput,
      registradoPor: 'Usuario Actual', // El backend lo sobrescribirá con el user del token si existe
    };

    try {
      if (editingId) {
        // Actualizar transacción existente
        const response = await api.put(`/papeleria/${editingId}`, newTransaction);
        if (response.success) {
            setTransactions(prev => prev.map(tx => 
                (tx.id === editingId || tx._id === editingId) ? { ...response.data, fecha: new Date(response.data.fecha) } : tx
            ));
        }
        setEditingId(null);
      } else {
        // Agregar nueva transacción
        const response = await api.post('/papeleria', newTransaction);
        if (response.success) {
             setTransactions(prev => [{ ...response.data, fecha: new Date(response.data.fecha) }, ...prev]);
        }
      }

      // Limpiar el formulario
      setFormData({
        tipo: 'ingreso',
        descripcion: '',
        cantidad: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        prestamoId: '',
      });
      
      setShowForm(false);
    } catch (error) {
        console.error("Error guardando transacción:", error);
        alert("Error guardando transacción");
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      tipo: transaction.tipo,
      descripcion: transaction.descripcion,
      cantidad: transaction.cantidad,
      fecha: format(transaction.fecha, 'yyyy-MM-dd'),
      prestamoId: transaction.prestamoId || '',
    });
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      try {
        const response = await api.delete(`/papeleria/${id}`);
        if (response.success) {
            setTransactions(prev => prev.filter(tx => (tx.id !== id && tx._id !== id)));
        }
      } catch (error) {
        console.error("Error eliminando:", error);
        alert("Error eliminando transacción");
      }
    }
  };

  // Calcular totales
  const { totalIngresos, totalRetiros } = useMemo(() => {
    const ingresos = transactions
      .filter(tx => tx.tipo === 'ingreso')
      .reduce((sum, tx) => sum + (Number(tx.cantidad) || 0), 0);
      
    const retiros = transactions
      .filter(tx => tx.tipo === 'retiro')
      .reduce((sum, tx) => sum + (Number(tx.cantidad) || 0), 0);
      
    return { totalIngresos: ingresos, totalRetiros: retiros };
  }, [transactions]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.prestamoId && transaction.prestamoId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || 
                       format(transaction.fecha, 'yyyy-MM-dd') === dateFilter;
    
    const matchesType = typeFilter === 'all' || 
                       transaction.tipo === typeFilter;
    
    return matchesSearch && matchesDate && matchesType;
  });

  const getTransactionType = (tipo) => {
    const types = {
      ingreso: { label: 'Ingreso', color: 'bg-green-100 text-green-800' },
      retiro: { label: 'Retiro', color: 'bg-red-100 text-red-800' },
      ajuste: { label: 'Ajuste', color: 'bg-blue-100 text-blue-800' }
    };
    
    return types[tipo] || { label: 'Desconocido', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Tarjeta de Total Acumulado */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6 text-sky-600" />
            <h2 className="text-lg font-semibold text-gray-800">Total Acumulado</h2>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalIngresos - totalRetiros)}
          </div>
          <p className="text-sm text-gray-500 mt-1">Saldo actual en papelería</p>
        </div>
        
        {/* Tarjeta de Ingresos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Total Ingresos</h2>
          </div>
          <div className="text-3xl font-bold text-green-600">
            +{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalIngresos)}
          </div>
          <p className="text-sm text-gray-500 mt-1">Acumulado por préstamos</p>
        </div>
        
        {/* Tarjeta de Retiros */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-800">Total Retirado</h2>
          </div>
          <div className="text-3xl font-bold text-red-600">
            -{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalRetiros)}
          </div>
          <p className="text-sm text-gray-500 mt-1">Retiros de papelería</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Papelería</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro de transacciones de materiales de papelería
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button 
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                tipo: 'ingreso',
                descripcion: '',
                cantidad: '',
                fecha: format(new Date(), 'yyyy-MM-dd'),
                prestamoId: '',
              });
            }}
            className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </button>
          <button 
            onClick={() => {
              const data = JSON.stringify(transactions, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `papeleria-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Formulario de transacción */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar Transacción' : 'Nueva Transacción'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Transacción
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  required
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="retiro">Retiro</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Ej. Hojas tamaño carta"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad
                  </label>
                  <select
                    name="unidad"
                    value={formData.unidad}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="paquetes">Paquetes</option>
                    <option value="resmas">Resmas</option>
                    <option value="cajas">Cajas</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID de Préstamo (opcional)
                </label>
                <input
                  type="text"
                  name="prestamoId"
                  value={formData.prestamoId}
                  onChange={handleInputChange}
                  placeholder="Ej. PREST-123"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
              >
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
              placeholder="Buscar por descripción o ID de préstamo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 appearance-none bg-white"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="retiro">Retiros</option>
              <option value="ajuste">Ajustes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de transacciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay transacciones</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || dateFilter || typeFilter !== 'all' 
                ? 'No se encontraron transacciones que coincidan con los filtros.'
                : 'Comienza agregando tu primera transacción.'}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              Agregar Transacción
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Préstamo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => {
                  const tipo = getTransactionType(transaction.tipo);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(transaction.fecha, "PPPp", { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tipo.color}`}>
                          {tipo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.prestamoId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.cantidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-sky-600 hover:text-sky-900 mr-4"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Papeleria;
