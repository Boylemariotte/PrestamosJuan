import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Users as UsersIcon, Briefcase, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ClienteCard from '../components/Clientes/ClienteCard';
import ClienteForm from '../components/Clientes/ClienteForm';
import { determinarEstadoCredito } from '../utils/creditCalculations';

const Clientes = () => {
  const { clientes, agregarCliente, loading } = useApp();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formCartera, setFormCartera] = useState(null);
  const [formTipoPago, setFormTipoPago] = useState(null);
  const [formPosicion, setFormPosicion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCartera, setFiltroCartera] = useState('todas'); // 'todas', 'K1', 'K2'
  const [filtroTipoPago, setFiltroTipoPago] = useState('todos'); // 'todos', 'diario', 'semanal', 'quincenal', 'mensual'

  // Tipos de pago disponibles según la cartera seleccionada
  const tiposPagoDisponibles = useMemo(() => {
    if (filtroCartera === 'todas') {
      return ['todos', 'diario', 'semanal', 'quincenal', 'mensual'];
    } else if (filtroCartera === 'K1') {
      return ['todos', 'diario', 'semanal', 'quincenal'];
    } else if (filtroCartera === 'K2') {
      return ['todos', 'quincenal', 'mensual'];
    }
    return ['todos', 'diario', 'semanal', 'quincenal', 'mensual'];
  }, [filtroCartera]);

  // Resetear filtro de tipo de pago si el tipo actual no está disponible en la cartera seleccionada
  useEffect(() => {
    if (!tiposPagoDisponibles.includes(filtroTipoPago)) {
      setFiltroTipoPago('todos');
    }
  }, [filtroCartera, tiposPagoDisponibles, filtroTipoPago]);

  const handleAgregarCliente = (clienteData) => {
    // Si hay posición predefinida, agregarla
    if (formPosicion) {
      clienteData.posicion = formPosicion;
    }
    // Si hay tipo de pago predefinido, guardarlo como tipo de pago esperado (respaldo)
    if (formTipoPago) {
      clienteData.tipoPagoEsperado = formTipoPago;
    }
    agregarCliente(clienteData);
    setShowForm(false);
    setFormCartera(null);
    setFormTipoPago(null);
    setFormPosicion(null);
  };

  const handleAgregarDesdeCard = (cartera, tipoPago, posicion) => {
    setFormCartera(cartera);
    setFormTipoPago(tipoPago);
    setFormPosicion(posicion);
    setShowForm(true);
  };

  // Obtener tipos de pago activos del cliente (según créditos activos o en mora)
  const getTiposPagoActivos = (cliente) => {
    const tipos = new Set();
    (cliente.creditos || []).forEach((c) => {
      const estadoC = determinarEstadoCredito(c.cuotas, c);
      if (estadoC === 'activo' || estadoC === 'mora') {
        if (c.tipo) tipos.add(c.tipo);
      }
    });
    return Array.from(tipos);
  };

  // Capacidades por cartera/tipo de pago
  const CAPACIDADES = {
    K1: { diario: 75, semanal: 150, quincenal: 150 },
    K2: { quincenal: 150, mensual: 75 }
  };

  // Ocupación actual por cartera/tipo (considera clientes con créditos activos/en mora o tipoPagoEsperado)
  const ocupacion = useMemo(() => {
    const base = {
      K1: { diario: 0, semanal: 0, quincenal: 0 },
      K2: { quincenal: 0, mensual: 0 }
    };
    clientes.forEach((cliente) => {
      const cartera = cliente.cartera || 'K1';
      const tiposActivos = getTiposPagoActivos(cliente);
      // Si tiene créditos activos, usar esos tipos; si no, usar tipoPagoEsperado
      const tipos = tiposActivos.length > 0 
        ? tiposActivos 
        : (cliente.tipoPagoEsperado ? [cliente.tipoPagoEsperado] : []);
      
      tipos.forEach((t) => {
        if (base[cartera] && typeof base[cartera][t] === 'number') {
          base[cartera][t] += 1;
        }
      });
    });
    return base;
  }, [clientes]);

  // Generar todas las cards posibles según capacidades
  const todasLasCards = useMemo(() => {
    const cards = [];
    
    // Generar cards para K1
    Object.entries(CAPACIDADES.K1).forEach(([tipo, capacidad]) => {
      for (let i = 1; i <= capacidad; i++) {
        cards.push({
          cartera: 'K1',
          tipoPago: tipo,
          posicion: i,
          cliente: null
        });
      }
    });
    
    // Generar cards para K2
    Object.entries(CAPACIDADES.K2).forEach(([tipo, capacidad]) => {
      for (let i = 1; i <= capacidad; i++) {
        cards.push({
          cartera: 'K2',
          tipoPago: tipo,
          posicion: i,
          cliente: null
        });
      }
    });
    
    // Asignar clientes a las cards correspondientes
    clientes.forEach(cliente => {
      const carteraCliente = cliente.cartera || 'K1';
      const tiposActivos = getTiposPagoActivos(cliente);
      
      // Si el cliente tiene créditos activos, usar esos tipos
      // Si no tiene créditos pero tiene tipoPagoEsperado, usar ese
      const tiposAAsignar = tiposActivos.length > 0 
        ? tiposActivos 
        : (cliente.tipoPagoEsperado ? [cliente.tipoPagoEsperado] : []);
      
      // Si no hay tipos para asignar, no hacer nada
      if (tiposAAsignar.length === 0) return;
      
      tiposAAsignar.forEach(tipo => {
        // Buscar la card correspondiente
        // Convertir posiciones a número para comparación correcta
        const posicionCliente = Number(cliente.posicion);
        const cardIndex = cards.findIndex(c => {
          return c.cartera === carteraCliente && 
            c.tipoPago === tipo && 
            Number(c.posicion) === posicionCliente &&
            c.cliente === null;
        });
        
        if (cardIndex !== -1) {
          cards[cardIndex].cliente = cliente;
        }
      });
    });
    
    return cards;
  }, [clientes]);

  // Filtrar cards según búsqueda, cartera y tipo de pago
  const cardsFiltradas = todasLasCards.filter(card => {
    // Si hay búsqueda, solo mostrar cards con cliente que coincida
    if (searchTerm) {
      if (!card.cliente) return false;
      const coincideBusqueda = card.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.cliente.documento.includes(searchTerm) ||
        card.cliente.telefono.includes(searchTerm);
      if (!coincideBusqueda) return false;
    }

    const coincideCartera = filtroCartera === 'todas' || card.cartera === filtroCartera;
    const coincideTipo = filtroTipoPago === 'todos' || card.tipoPago === filtroTipoPago;

    return coincideCartera && coincideTipo;
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
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información de tus clientes
          </p>
        </div>
      </div>

      {/* Estadísticas por cartera */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Cartera K1</p>
              <p className="text-3xl font-bold mt-1">{clientesK1}</p>
              <p className="text-blue-100 text-xs mt-1">clientes</p>
              <div className="mt-3 space-y-1 text-[11px]">
                <p className="text-blue-100">Diario: {ocupacion.K1.diario}/{CAPACIDADES.K1.diario}</p>
                <p className="text-blue-100">Semanal: {ocupacion.K1.semanal}/{CAPACIDADES.K1.semanal}</p>
                <p className="text-blue-100">Quincenal: {ocupacion.K1.quincenal}/{CAPACIDADES.K1.quincenal}</p>
              </div>
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
              <div className="mt-3 space-y-1 text-[11px]">
                <p className="text-green-100">Quincenal: {ocupacion.K2.quincenal}/{CAPACIDADES.K2.quincenal}</p>
                <p className="text-green-100">Mensual: {ocupacion.K2.mensual}/{CAPACIDADES.K2.mensual}</p>
              </div>
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

      {/* Filtro por tipo de pago */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Filtrar por tipo de pago:</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {tiposPagoDisponibles.map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipoPago(tipo)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                filtroTipoPago === tipo
                  ? 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-400'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de cards */}
      {cardsFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron clientes' : 'No hay cards disponibles'}
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
          {cardsFiltradas.map((card, index) => (
            <ClienteCard
              key={`${card.cartera}-${card.tipoPago}-${card.posicion}-${index}`}
              cliente={card.cliente}
              cardVacia={!card.cliente}
              numeroCard={card.posicion}
              cartera={card.cartera}
              tipoPago={card.tipoPago}
              onAgregarCliente={handleAgregarDesdeCard}
            />
          ))}
        </div>
      )}

      {/* Formulario de cliente */}
      {showForm && (
        <ClienteForm
          onSubmit={handleAgregarCliente}
          onClose={() => {
            setShowForm(false);
            setFormCartera(null);
            setFormTipoPago(null);
            setFormPosicion(null);
          }}
          carteraPredefinida={formCartera}
          tipoPagoPredefinido={formTipoPago}
        />
      )}
    </div>
  );
};

export default Clientes;
