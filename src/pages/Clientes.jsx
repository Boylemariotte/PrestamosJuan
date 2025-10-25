import React, { useState } from 'react';
import { Plus, Search, Users as UsersIcon, Briefcase, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ClienteCard from '../components/Clientes/ClienteCard';
import ClienteForm from '../components/Clientes/ClienteForm';

const Clientes = () => {
  const { clientes, agregarCliente, loading } = useApp();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCartera, setFiltroCartera] = useState('todas'); // 'todas', 'K1', 'K2'

  const handleAgregarCliente = (clienteData) => {
    agregarCliente(clienteData);
    setShowForm(false);
  };

  // Filtrar por búsqueda y cartera
  const clientesFiltrados = clientes.filter(cliente => {
    const coincideBusqueda = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.documento.includes(searchTerm) ||
      cliente.telefono.includes(searchTerm);
    
    const coincideCartera = filtroCartera === 'todas' || 
      (cliente.cartera || 'K1') === filtroCartera;
    
    return coincideBusqueda && coincideCartera;
  });

  // Contar clientes por cartera
  const clientesK1 = clientes.filter(c => (c.cartera || 'K1') === 'K1').length;
  const clientesK2 = clientes.filter(c => c.cartera === 'K2').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información de tus clientes
          </p>
        </div>
        {hasPermission('crearClientes') && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Cliente
          </button>
        )}
      </div>

      {/* Estadísticas por cartera */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Cartera K1</p>
              <p className="text-3xl font-bold mt-1">{clientesK1}</p>
              <p className="text-blue-100 text-xs mt-1">clientes</p>
            </div>
            <Briefcase className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Cartera K2</p>
              <p className="text-3xl font-bold mt-1">{clientesK2}</p>
              <p className="text-green-100 text-xs mt-1">clientes</p>
            </div>
            <Briefcase className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Clientes</p>
              <p className="text-3xl font-bold mt-1">{clientes.length}</p>
              <p className="text-purple-100 text-xs mt-1">registrados</p>
            </div>
            <UsersIcon className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Filtros por cartera */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Filtrar por cartera:</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroCartera('todas')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
              filtroCartera === 'todas'
                ? 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-400'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            Todas ({clientes.length})
          </button>

          <button
            onClick={() => setFiltroCartera('K1')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${
              filtroCartera === 'K1'
                ? 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-400'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Cartera K1 ({clientesK1})
          </button>

          <button
            onClick={() => setFiltroCartera('K2')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${
              filtroCartera === 'K2'
                ? 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-400'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Cartera K2 ({clientesK2})
          </button>
        </div>
      </div>

      {/* Lista de clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza agregando tu primer cliente'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <ClienteCard key={cliente.id} cliente={cliente} />
          ))}
        </div>
      )}

      {/* Formulario de cliente */}
      {showForm && (
        <ClienteForm
          onSubmit={handleAgregarCliente}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Clientes;
