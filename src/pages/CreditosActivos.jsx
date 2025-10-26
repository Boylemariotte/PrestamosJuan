import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Search, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CreditoCard from '../components/Creditos/CreditoCard';
import CreditoDetalle from '../components/Creditos/CreditoDetalle';
import { determinarEstadoCredito } from '../utils/creditCalculations';

const CreditosActivos = () => {
  const { clientes } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos'); // todos, activo, mora

  // Obtener todos los créditos activos con información del cliente
  const creditosConCliente = clientes.flatMap(cliente =>
    (cliente.creditos || [])
      .filter(credito => {
        const estado = determinarEstadoCredito(credito.cuotas, credito);
        return estado === 'activo' || estado === 'mora';
      })
      .map(credito => ({
        ...credito,
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          documento: cliente.documento
        }
      }))
  );

  // Filtrar por búsqueda y estado
  const creditosFiltrados = creditosConCliente.filter(item => {
    const matchSearch = 
      item.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cliente.documento.includes(searchTerm) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (filtroEstado === 'todos') return true;
    
    const estado = determinarEstadoCredito(item.cuotas, item);
    return estado === filtroEstado;
  });

  const creditosEnMora = creditosConCliente.filter(item => {
    const estado = determinarEstadoCredito(item.cuotas, item);
    return estado === 'mora';
  }).length;

  const handleVerCredito = (credito, clienteId) => {
    // Buscar el cliente completo
    const cliente = clientes.find(c => c.id === clienteId);
    setCreditoSeleccionado(credito);
    setClienteSeleccionado(cliente);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Créditos Activos</h1>
        <p className="text-gray-600 mt-1">
          Gestiona todos los créditos en curso
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Activos</p>
              <p className="text-3xl font-bold mt-1">{creditosConCliente.length}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Al Día</p>
              <p className="text-3xl font-bold mt-1">
                {creditosConCliente.length - creditosEnMora}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">En Mora</p>
              <p className="text-3xl font-bold mt-1">{creditosEnMora}</p>
            </div>
            <AlertCircle className="h-12 w-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, documento o ID de crédito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === 'todos'
                ? 'bg-sky-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroEstado('activo')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === 'activo'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Al Día
          </button>
          <button
            onClick={() => setFiltroEstado('mora')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === 'mora'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            En Mora
          </button>
        </div>
      </div>

      {/* Lista de créditos */}
      {creditosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filtroEstado !== 'todos'
              ? 'No se encontraron créditos'
              : 'No hay créditos activos'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filtroEstado !== 'todos'
              ? 'Intenta con otros términos de búsqueda o filtros'
              : 'Los créditos activos aparecerán aquí'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {creditosFiltrados.map((item) => (
            <div key={`${item.cliente.id}-${item.id}`} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.cliente.nombre}
                  </h3>
                  <p className="text-sm text-gray-500">CC: {item.cliente.documento}</p>
                </div>
                <button
                  onClick={() => navigate(`/cliente/${item.cliente.id}`)}
                  className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                >
                  Ver cliente →
                </button>
              </div>
              <div onClick={() => handleVerCredito(item, item.cliente.id)}>
                <CreditoCard credito={item} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {creditoSeleccionado && clienteSeleccionado && (
        <CreditoDetalle
          credito={creditoSeleccionado}
          clienteId={clienteSeleccionado.id}
          cliente={clienteSeleccionado}
          onClose={() => {
            setCreditoSeleccionado(null);
            setClienteSeleccionado(null);
          }}
        />
      )}
    </div>
  );
};

export default CreditosActivos;
