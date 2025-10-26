import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Search, Award, Check, Calendar, AlertCircle, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CreditoCard from '../components/Creditos/CreditoCard';
import CreditoDetalle from '../components/Creditos/CreditoDetalle';
import { determinarEstadoCredito, formatearMoneda } from '../utils/creditCalculations';

const CreditosFinalizados = () => {
  const { clientes } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('todas');
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Definición de etiquetas
  const ETIQUETAS = {
    excelente: {
      nombre: 'Excelente',
      color: 'bg-green-100 text-green-800 border-green-300',
      icono: Award
    },
    bueno: {
      nombre: 'Bueno',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icono: Check
    },
    atrasado: {
      nombre: 'Atrasado',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icono: Calendar
    },
    incompleto: {
      nombre: 'Incompleto',
      color: 'bg-red-100 text-red-800 border-red-300',
      icono: AlertCircle
    }
  };

  // Obtener todos los créditos finalizados con información del cliente
  const creditosConCliente = clientes.flatMap(cliente =>
    (cliente.creditos || [])
      .filter(credito => {
        const estado = determinarEstadoCredito(credito.cuotas, credito);
        return estado === 'finalizado';
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

  // Filtrar por búsqueda y etiqueta
  const creditosFiltrados = creditosConCliente.filter(item => {
    const coincideBusqueda = item.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cliente.documento.includes(searchTerm) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const coincideEtiqueta = filtroEtiqueta === 'todas' || 
      (filtroEtiqueta === 'sin-etiqueta' && !item.etiqueta) ||
      item.etiqueta === filtroEtiqueta;
    
    return coincideBusqueda && coincideEtiqueta;
  });

  // Contar créditos por etiqueta
  const contarPorEtiqueta = (etiqueta) => {
    if (etiqueta === 'todas') return creditosConCliente.length;
    if (etiqueta === 'sin-etiqueta') return creditosConCliente.filter(c => !c.etiqueta).length;
    return creditosConCliente.filter(c => c.etiqueta === etiqueta).length;
  };

  // Calcular total cobrado
  const totalCobrado = creditosConCliente.reduce(
    (sum, item) => sum + item.totalAPagar,
    0
  );

  const handleVerCredito = (credito, clienteId) => {
    // Buscar el cliente completo
    const cliente = clientes.find(c => c.id === clienteId);
    setCreditoSeleccionado(credito);
    setClienteSeleccionado(cliente);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Créditos Finalizados</h1>
        <p className="text-gray-600 mt-1">
          Historial de créditos completados
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Finalizados</p>
              <p className="text-3xl font-bold mt-1">{creditosConCliente.length}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Cobrado</p>
              <p className="text-2xl font-bold mt-1">{formatearMoneda(totalCobrado)}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
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
      </div>

      {/* Filtros por etiqueta */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Filtrar por etiqueta:</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Todas */}
          <button
            onClick={() => setFiltroEtiqueta('todas')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
              filtroEtiqueta === 'todas'
                ? 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-400'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            Todas ({contarPorEtiqueta('todas')})
          </button>

          {/* Excelente */}
          <button
            onClick={() => setFiltroEtiqueta('excelente')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${
              filtroEtiqueta === 'excelente'
                ? `${ETIQUETAS.excelente.color} ring-2 ring-green-400`
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Award className="h-4 w-4" />
            Excelente ({contarPorEtiqueta('excelente')})
          </button>

          {/* Bueno */}
          <button
            onClick={() => setFiltroEtiqueta('bueno')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${
              filtroEtiqueta === 'bueno'
                ? `${ETIQUETAS.bueno.color} ring-2 ring-blue-400`
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Check className="h-4 w-4" />
            Bueno ({contarPorEtiqueta('bueno')})
          </button>

          {/* Atrasado */}
          <button
            onClick={() => setFiltroEtiqueta('atrasado')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${
              filtroEtiqueta === 'atrasado'
                ? `${ETIQUETAS.atrasado.color} ring-2 ring-yellow-400`
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Atrasado ({contarPorEtiqueta('atrasado')})
          </button>

          {/* Incompleto */}
          <button
            onClick={() => setFiltroEtiqueta('incompleto')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${
              filtroEtiqueta === 'incompleto'
                ? `${ETIQUETAS.incompleto.color} ring-2 ring-red-400`
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            Incompleto ({contarPorEtiqueta('incompleto')})
          </button>

          {/* Sin etiqueta */}
          <button
            onClick={() => setFiltroEtiqueta('sin-etiqueta')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
              filtroEtiqueta === 'sin-etiqueta'
                ? 'bg-gray-200 text-gray-800 border-gray-400 ring-2 ring-gray-400'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Sin etiqueta ({contarPorEtiqueta('sin-etiqueta')})
          </button>
        </div>
      </div>

      {/* Lista de créditos */}
      {creditosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron créditos' : 'No hay créditos finalizados'}
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Los créditos completados aparecerán aquí'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {creditosFiltrados.map((item) => (
            <div key={`${item.cliente.id}-${item.id}`} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.cliente.nombre}
                    </h3>
                    {/* Etiqueta del crédito */}
                    {item.etiqueta && ETIQUETAS[item.etiqueta] && (
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium border-2 flex items-center gap-1 ${ETIQUETAS[item.etiqueta].color}`}>
                        {React.createElement(ETIQUETAS[item.etiqueta].icono, { className: 'h-4 w-4' })}
                        {ETIQUETAS[item.etiqueta].nombre}
                      </span>
                    )}
                  </div>
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

export default CreditosFinalizados;
