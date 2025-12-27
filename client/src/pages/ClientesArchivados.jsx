import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, Users as UsersIcon, Briefcase, Filter, User, Phone, MapPin, RotateCcw, X, Award, Check, Calendar, AlertCircle, Ban } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatearMoneda, determinarEstadoCredito, aplicarAbonosAutomaticamente, calcularValorPendienteCuota } from '../utils/creditCalculations';
import api from '../services/api';

const ClientesArchivados = () => {
  const navigate = useNavigate();
  const { desarchivarCliente, loading, fetchData, clientes } = useApp();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCartera, setFiltroCartera] = useState('todas');
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('todas');
  const [clientesArchivados, setClientesArchivados] = useState([]);
  const [cargandoArchivados, setCargandoArchivados] = useState(true);
  const [mostrarModalPosicion, setMostrarModalPosicion] = useState(false);
  const [clienteParaDesarchivar, setClienteParaDesarchivar] = useState(null);
  const [posicionesDisponibles, setPosicionesDisponibles] = useState([]);
  const [cargandoPosiciones, setCargandoPosiciones] = useState(false);
  const [posicionSeleccionada, setPosicionSeleccionada] = useState(null);

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
    },
    vetado: {
      nombre: 'Vetado',
      color: 'bg-gray-800 text-white border-gray-900',
      icono: Ban
    },
    'sin-etiqueta': {
      nombre: 'Sin etiqueta',
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icono: null
    }
  };

  // Cargar clientes archivados
  useEffect(() => {
    const cargarArchivados = async () => {
      try {
        setCargandoArchivados(true);
        const response = await api.get('/clientes?archivados=true&limit=1000');
        if (response.success) {
          setClientesArchivados(response.data);
        }
      } catch (error) {
        console.error('Error cargando clientes archivados:', error);
      } finally {
        setCargandoArchivados(false);
      }
    };

    cargarArchivados();
  }, []);

  // Filtrar clientes según búsqueda y filtros
  const clientesFiltrados = useMemo(() => {
    let filtrados = clientesArchivados;

    // Filtro por cartera
    if (filtroCartera !== 'todas') {
      filtrados = filtrados.filter(c => c.cartera === filtroCartera);
    }

    // Filtro por etiqueta
    if (filtroEtiqueta !== 'todas') {
      if (filtroEtiqueta === 'sin-etiqueta') {
        filtrados = filtrados.filter(c => !c.etiqueta || c.etiqueta === 'sin-etiqueta');
      } else {
        filtrados = filtrados.filter(c => c.etiqueta === filtroEtiqueta);
      }
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(c => {
        const nombreMatch = c.nombre?.toLowerCase().includes(term);
        const documentoMatch = c.documento?.toLowerCase().includes(term);
        const telefonoMatch = c.telefono?.toLowerCase().includes(term);
        const barrioMatch = c.barrio?.toLowerCase().includes(term);
        return nombreMatch || documentoMatch || telefonoMatch || barrioMatch;
      });
    }

    return filtrados;
  }, [clientesArchivados, searchTerm, filtroCartera, filtroEtiqueta]);

  // Contar clientes por etiqueta
  const contarPorEtiqueta = (etiqueta) => {
    if (etiqueta === 'todas') return clientesArchivados.length;
    if (etiqueta === 'sin-etiqueta') return clientesArchivados.filter(c => !c.etiqueta || c.etiqueta === 'sin-etiqueta').length;
    return clientesArchivados.filter(c => c.etiqueta === etiqueta).length;
  };

  // Obtener información del crédito del cliente
  const getCreditoInfo = (cliente) => {
    if (!cliente || !cliente.creditos || cliente.creditos.length === 0) return null;
    // Obtener el último crédito o el más reciente
    return cliente.creditos[cliente.creditos.length - 1];
  };

  // Obtener tipo de pago del cliente (de créditos activos o tipoPagoEsperado)
  const getTipoPagoCliente = (cliente) => {
    if (!cliente) return null;
    
    // Primero intentar obtener de créditos activos
    if (cliente.creditos && cliente.creditos.length > 0) {
      const creditoActivo = cliente.creditos.find(c => {
        const estado = determinarEstadoCredito(c.cuotas, c);
        return estado === 'activo' || estado === 'mora';
      });
      if (creditoActivo && creditoActivo.tipo) {
        return creditoActivo.tipo;
      }
    }
    
    // Si no hay créditos activos, usar tipoPagoEsperado
    return cliente.tipoPagoEsperado || null;
  };

  // Calcular saldo pendiente total del cliente (todos los créditos)
  const calcularSaldoPendienteTotal = (cliente) => {
    if (!cliente || !cliente.creditos || cliente.creditos.length === 0) {
      return 0;
    }

    let saldoTotal = 0;

    // Calcular saldo pendiente de cada crédito
    cliente.creditos.forEach(credito => {
      // Aplicar abonos automáticamente para obtener cuotas actualizadas
      const { cuotasActualizadas } = aplicarAbonosAutomaticamente(credito);

      // Sumar el saldo pendiente de cada cuota
      cuotasActualizadas.forEach(cuota => {
        const valorPendiente = calcularValorPendienteCuota(credito.valorCuota, cuota);
        saldoTotal += valorPendiente;
      });

      // Calcular multas pendientes (valor de multa - abonos de multa)
      if (credito.multas && credito.multas.length > 0) {
        credito.multas.forEach(multa => {
          const totalAbonadoMulta = (credito.abonosMulta || [])
            .filter(abono => abono.multaId === multa.id)
            .reduce((sum, abono) => sum + (abono.valor || 0), 0);
          
          const multaPendiente = Math.max(0, (multa.valor || 0) - totalAbonadoMulta);
          saldoTotal += multaPendiente;
        });
      }
    });

    return saldoTotal;
  };

  const abrirModalPosicion = async (cliente) => {
    setClienteParaDesarchivar(cliente);
    setPosicionSeleccionada(null);
    setCargandoPosiciones(true);
    setMostrarModalPosicion(true);

    try {
      const cartera = cliente.cartera || 'K1';
      const tipoPago = getTipoPagoCliente(cliente);
      
      // Construir URL con query parameter para tipo de pago (para K1 y K3)
      let url = `/clientes/posiciones-disponibles/${cartera}`;
      if ((cartera === 'K1' || cartera === 'K3') && tipoPago) {
        url += `?tipoPago=${tipoPago}`;
      }
      
      const response = await api.get(url);
      if (response.success) {
        setPosicionesDisponibles(response.data);
      }
    } catch (error) {
      console.error('Error cargando posiciones disponibles:', error);
      alert('Error al cargar posiciones disponibles');
    } finally {
      setCargandoPosiciones(false);
    }
  };

  const handleDesarchivar = async () => {
    if (!clienteParaDesarchivar || !posicionSeleccionada) {
      alert('Por favor selecciona una posición');
      return;
    }

    try {
      // Asegurar que la posición sea un número
      const posicionNumero = parseInt(posicionSeleccionada, 10);
      if (isNaN(posicionNumero)) {
        alert('La posición seleccionada no es válida');
        return;
      }

      const response = await api.put(`/clientes/${clienteParaDesarchivar.id || clienteParaDesarchivar._id}/desarchivar`, {
        posicion: posicionNumero
      });

      if (response.success) {
        // Recargar clientes archivados
        const archivadosResponse = await api.get('/clientes?archivados=true&limit=1000');
        if (archivadosResponse.success) {
          setClientesArchivados(archivadosResponse.data);
        }
        // Recargar clientes normales
        await fetchData();
        setMostrarModalPosicion(false);
        setClienteParaDesarchivar(null);
        setPosicionSeleccionada(null);
      }
    } catch (error) {
      console.error('Error desarchivando cliente:', error);
      const errorMessage = error.response?.data?.error || error.message || 'No se pudo desarchivar el cliente.';
      alert(errorMessage);
    }
  };

  if (cargandoArchivados || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Cargando clientes archivados...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-3 rounded-full">
              <Archive className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clientes Archivados</h1>
              <p className="text-gray-600 mt-1">
                {clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'cliente archivado' : 'clientes archivados'}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, documento, teléfono o barrio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filtroCartera}
                onChange={(e) => setFiltroCartera(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todas las carteras</option>
                <option value="K1">K1</option>
                <option value="K2">K2</option>
                <option value="K3">K3</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      {clientesFiltrados.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Crédito
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Valor Cuota
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Saldo Pendiente
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Modalidad
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Etiqueta
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientesFiltrados.map((cliente) => {
                const creditoInfo = getCreditoInfo(cliente);
                const carteraRowClass = cliente.cartera === 'K1' 
                  ? 'bg-blue-100 hover:bg-blue-200' 
                  : cliente.cartera === 'K2'
                  ? 'bg-green-100 hover:bg-green-200'
                  : cliente.cartera === 'K3'
                  ? 'bg-orange-100 hover:bg-orange-200'
                  : 'hover:bg-gray-50';

                return (
                  <tr
                    key={cliente.id || cliente._id}
                    className={carteraRowClass}
                  >
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{cliente.nombre}</span>
                        <span className="text-xs text-gray-500">CC: {cliente.documento}</span>
                        <span className="flex items-center gap-1 text-gray-500 text-sm">
                          <Phone className="h-3 w-3" /> {cliente.telefono}
                        </span>
                        {cliente.barrio && (
                          <span className="text-xs flex items-center gap-1 text-gray-600 font-medium">
                            <MapPin className="h-3 w-3" /> {cliente.barrio}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {creditoInfo ? formatearMoneda(creditoInfo.monto) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {creditoInfo ? formatearMoneda(creditoInfo.valorCuota) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatearMoneda(calcularSaldoPendienteTotal(cliente))}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {creditoInfo?.tipo ? (creditoInfo.tipo.charAt(0).toUpperCase() + creditoInfo.tipo.slice(1)) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {cliente.etiqueta && ETIQUETAS[cliente.etiqueta] ? (
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border-2 flex items-center gap-1 w-fit ${ETIQUETAS[cliente.etiqueta].color}`}>
                          {ETIQUETAS[cliente.etiqueta].icono && React.createElement(ETIQUETAS[cliente.etiqueta].icono, { className: 'h-4 w-4' })}
                          {ETIQUETAS[cliente.etiqueta].nombre}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-lg text-sm font-medium border-2 bg-gray-100 text-gray-800 border-gray-300">
                          Sin etiqueta
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => navigate(`/archivados/cliente/${cliente.id || cliente._id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Ver Detalle
                      </button>
                      <button
                        onClick={() => abrirModalPosicion(cliente)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        title="Desarchivar cliente"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restaurar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay clientes archivados
          </h3>
          <p className="text-gray-600">
            {searchTerm || filtroCartera !== 'todas'
              ? 'No se encontraron clientes con los filtros aplicados'
              : 'Los clientes archivados aparecerán aquí cuando se archiven'}
          </p>
        </div>
      )}

      {/* Modal para seleccionar posición */}
      {mostrarModalPosicion && clienteParaDesarchivar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Seleccionar Posición para {clienteParaDesarchivar.nombre}
              </h2>
              <button
                onClick={() => {
                  setMostrarModalPosicion(false);
                  setClienteParaDesarchivar(null);
                  setPosicionSeleccionada(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="mb-4 space-y-1">
                <p className="text-sm text-gray-600">
                  Cartera: <span className="font-semibold">{clienteParaDesarchivar.cartera || 'K1'}</span>
                </p>
                {(clienteParaDesarchivar.cartera === 'K1' || clienteParaDesarchivar.cartera === 'K3') && (
                  <p className="text-sm text-gray-600">
                    Modalidad: <span className="font-semibold capitalize">
                      {getTipoPagoCliente(clienteParaDesarchivar) || 'No definida'}
                    </span>
                  </p>
                )}
              </div>

              {cargandoPosiciones ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando posiciones disponibles...</p>
                </div>
              ) : posicionesDisponibles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No hay posiciones disponibles en esta cartera</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Selecciona una posición disponible ({posicionesDisponibles.length} disponibles):
                  </p>
                  <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto">
                    {posicionesDisponibles.map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setPosicionSeleccionada(pos)}
                        className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                          posicionSeleccionada === pos
                            ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMostrarModalPosicion(false);
                  setClienteParaDesarchivar(null);
                  setPosicionSeleccionada(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDesarchivar}
                disabled={!posicionSeleccionada || cargandoPosiciones}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Desarchivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesArchivados;
