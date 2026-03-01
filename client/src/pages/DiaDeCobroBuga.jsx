//ARCHIVO YA NO UTILIZADO
import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays, addDays, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Users, AlertCircle, CheckCircle, Phone, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatearMoneda, calcularTotalMultasCuota, aplicarAbonosAutomaticamente, determinarEstadoCredito } from '../utils/creditCalculations';
import CreditoDetalle from '../components/Creditos/CreditoDetalle';
import api, { prorrogaService, ordenCobroService } from '../services/api';
import { toast } from 'react-toastify';

const DiaDeCobroBuga = () => {
  // Estados principales
  const [clientes, setClientes] = useState([]);
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(startOfDay(new Date()));
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para filtro de tipo de pago K3
  const [filtroK3, setFiltroK3] = useState('todos'); // 'todos', 'semanal', 'quincenal', 'mensual'

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Variables adicionales para compatibilidad con el diseño
  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
  const esHoy = format(fechaSeleccionada, 'yyyy-MM-dd') === format(startOfDay(new Date()), 'yyyy-MM-dd');

  // Estados para prórrogas
  const [prorrogasCuotas, setProrrogasCuotas] = useState({});

  // Estado para orden de cobro
  const [ordenCobro, setOrdenCobro] = useState({});

  // Obtener usuario del localStorage
  useEffect(() => {
    const userData = localStorage.getItem('auth_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Cargar clientes desde el backend
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        setLoading(true);
        const response = await api.get('/clientes');
        if (response.success) {
          setClientes(response.data);
        }
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        toast.error('Error al cargar los clientes');
      } finally {
        setLoading(false);
      }
    };

    cargarClientes();
  }, []);

  // Cargar órdenes de cobro desde el backend
  const cargarOrdenesCobro = async (fecha) => {
    try {
      const response = await ordenCobroService.obtenerPorFecha(fecha);
      if (response.success && response.data) {
        setOrdenCobro(prev => ({
          ...prev,
          [fecha]: response.data
        }));
      }
    } catch (error) {
      console.error('Error al cargar órdenes de cobro:', error);
    }
  };

  // Cargar órdenes cuando cambia la fecha
  useEffect(() => {
    const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
    cargarOrdenesCobro(fechaStr);
  }, [fechaSeleccionada]);

  // Cargar prórrogas desde el backend
  const cargarProrrogas = async () => {
    try {
      const response = await prorrogaService.obtenerTodas();
      if (response.success && response.data) {
        const prorrogasMap = {};
        response.data.forEach(prorroga => {
          const key = `${prorroga.clienteId}-${prorroga.creditoId}-${prorroga.nroCuota}`;
          prorrogasMap[key] = prorroga;
        });
        setProrrogasCuotas(prorrogasMap);
      }
    } catch (error) {
      console.error('Error al cargar prorrogas:', error);
    }
  };

  useEffect(() => {
    cargarProrrogas();
  }, []);

  // Calcular datos de cobro para K3 agrupados por cartera
  const datosCobroK3 = useMemo(() => {
    const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
    const itemsK3 = [];

    clientes.forEach(cliente => {
      // Solo procesar clientes de cartera K3
      if (cliente.cartera !== 'K3') return;

      if (!cliente.creditos || cliente.creditos.length === 0) return;

      cliente.creditos.forEach(credito => {
        // Validar que el crédito tenga cuotas
        if (!credito.cuotas || !Array.isArray(credito.cuotas)) return;

        const estado = determinarEstadoCredito(credito.cuotas, credito);

        if (estado === 'activo' || estado === 'mora') {
          credito.cuotas.forEach(cuota => {
            if (cuota.pagada) return;

            const fechaCuota = typeof cuota.fechaProgramada === 'string'
              ? cuota.fechaProgramada.split('T')[0]
              : format(cuota.fechaProgramada, 'yyyy-MM-dd');

            if (fechaCuota === fechaStr) {
              const creditoConAbonos = aplicarAbonosAutomaticamente(credito);
              const cuotaActualizada = creditoConAbonos.cuotasActualizadas.find(c => c.nroCuota === cuota.nroCuota);
              const valorRealACobrar = calcularTotalMultasCuota(cuotaActualizada || cuota, credito);

              const key = `${cliente.id}-${credito.id}-${cuota.nroCuota}`;
              const prorroga = prorrogasCuotas[key];

              let valorMostrar = valorRealACobrar;
              let tipo = 'pendiente';

              if (prorroga && prorroga.fechaFin && new Date(prorroga.fechaFin) >= new Date(fechaStr)) {
                valorMostrar = 0;
                tipo = 'prorrogado';
              }

              const item = {
                clienteId: cliente.id,
                clienteNombre: cliente.nombre,
                clienteDocumento: cliente.documento,
                clienteTelefono: cliente.telefono,
                clienteDireccion: cliente.direccion,
                clienteBarrio: cliente.barrio,
                clienteCartera: cliente.cartera || 'K3',
                clientePosicion: cliente.posicion,
                creditoId: credito.id,
                creditoMonto: credito.monto,
                creditoTipo: credito.tipo,
                nroCuota: cuota.nroCuota,
                valorCuota: cuota.valor,
                valorRealACobrar: valorMostrar,
                tipo,
                reportado: true,
                key: `${cliente.id}-${credito.id}-${cuota.nroCuota}`,
                orden: ordenCobro[fechaStr]?.[`${cliente.id}-${credito.id}-${cuota.nroCuota}`] || cliente.posicion || 999,
                cliente,
                credito
              };

              itemsK3.push(item);
            }
          });
        }
      });
    });

    // Función para filtrar por tipo de pago
    const filtrarPorTipo = (items) => {
      if (filtroK3 === 'todos') return items;
      return items.filter(item => item.creditoTipo === filtroK3);
    };

    // Filtrar y ordenar
    const itemsFiltrados = filtrarPorTipo(itemsK3)
      .sort((a, b) => a.orden - b.orden);

    return { itemsK3: itemsFiltrados };
  }, [clientes, fechaSeleccionada, prorrogasCuotas, ordenCobro, filtroK3]);

  // Filtrar por búsqueda
  const itemsK3Filtrados = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase().trim();

    if (!searchTermLower) return datosCobroK3?.itemsK3 || [];

    return datosCobroK3.itemsK3.filter(item => {
      const refCredito = item.clientePosicion ? `#${item.clientePosicion}` : '';
      if (refCredito.toLowerCase().includes(searchTermLower)) return true;
      if (item.clienteNombre.toLowerCase().includes(searchTermLower)) return true;
      if (item.clienteDocumento && item.clienteDocumento.toLowerCase().includes(searchTermLower)) return true;
      if (item.clienteTelefono && item.clienteTelefono.toLowerCase().includes(searchTermLower)) return true;
      if (item.clienteBarrio && item.clienteBarrio.toLowerCase().includes(searchTermLower)) return true;
      return false;
    });
  }, [datosCobroK3.itemsK3, searchTerm]);



  // Obtener clientes pagados K3
  const clientesPagadosK3 = useMemo(() => {
    const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
    const pagosK3 = [];

    clientes.forEach(cliente => {
      if (cliente.cartera !== 'K3') return;

      if (!cliente.creditos || cliente.creditos.length === 0) return;

      cliente.creditos.forEach(credito => {
        // Validar que el crédito tenga cuotas
        if (!credito.cuotas || !Array.isArray(credito.cuotas)) return;

        credito.cuotas.forEach(cuota => {
          if (!cuota.pagada) return;

          const fechaPago = typeof cuota.fechaPago === 'string'
            ? cuota.fechaPago.split('T')[0]
            : format(cuota.fechaPago, 'yyyy-MM-dd');

          if (fechaPago === fechaStr) {
            const pagoItem = {
              clienteId: cliente.id,
              clienteNombre: cliente.nombre,
              clienteDocumento: cliente.documento,
              clienteTelefono: cliente.telefono,
              clienteBarrio: cliente.barrio,
              clienteCartera: cliente.cartera,
              clientePosicion: cliente.posicion,
              creditoId: credito.id,
              creditoTipo: credito.tipo,
              nroCuota: cuota.nroCuota,
              montoPagado: cuota.valorCuota,
              montoPagadoMulta: 0,
              tipoPago: cuota.tipoPago || 'completo',
              tieneMulta: cuota.tieneMulta || false,
              multaMotivo: cuota.multaMotivo,
              cliente,
              credito
            };

            pagosK3.push(pagoItem);
          }
        });
      });
    });

    // Filtrar por tipo de pago si es necesario
    const pagosFiltrados = filtroK3 === 'todos'
      ? pagosK3
      : pagosK3.filter(item => item.creditoTipo === filtroK3);

    const calcularTotal = (items) => items.reduce((sum, item) => sum + item.montoPagado + (item.montoPagadoMulta || 0), 0);

    return {
      K3: { items: pagosFiltrados, total: calcularTotal(pagosFiltrados) }
    };
  }, [clientes, fechaSeleccionadaStr, filtroK3]);

  // Calcular estadísticas Globales
  const estadisticasGlobales = useMemo(() => {
    let porCobrarTotal = 0;
    let recogidoTotal = 0;

    clientes.forEach(cliente => {
      if (!cliente.creditos || cliente.creditos.length === 0) return;

      cliente.creditos.forEach(credito => {
        if (!credito.cuotas || !Array.isArray(credito.cuotas)) return;
        if (credito.renovado) return;

        // 1. Calcular Por Cobrar Global (Pendientes hoy o vencidos)
        const creditoConAbonos = aplicarAbonosAutomaticamente(credito);
        creditoConAbonos.cuotasActualizadas.forEach((cuota, index) => {
          const cuotaOriginal = credito.cuotas[index];
          if (cuotaOriginal.pagado) return;

          const fechaCuota = typeof cuotaOriginal.fechaProgramada === 'string'
            ? cuotaOriginal.fechaProgramada.split('T')[0]
            : format(new Date(cuotaOriginal.fechaProgramada), 'yyyy-MM-dd');

          const esVencidaOActual = fechaCuota <= fechaSeleccionadaStr;
          const abonoAplicado = cuota.abonoAplicado || 0;
          const valorPendiente = (credito.valorCuota - abonoAplicado) + calcularTotalMultasCuota(cuota, credito);

          if (esVencidaOActual && valorPendiente > 0) {
            porCobrarTotal += valorPendiente;
          }
        });

        // 2. Calcular Recogido Global (Pagado hoy)
        credito.cuotas.forEach(cuota => {
          let fechaPagoNormalizada = null;
          if (cuota.pagada && cuota.fechaPago) {
            fechaPagoNormalizada = typeof cuota.fechaPago === 'string'
              ? cuota.fechaPago.split('T')[0]
              : format(new Date(cuota.fechaPago), 'yyyy-MM-dd');
          }

          const abonosHoy = (cuota.abonosCuota || []).filter(a => {
            const f = typeof a.fecha === 'string' ? a.fecha.split('T')[0] : format(new Date(a.fecha), 'yyyy-MM-dd');
            return f === fechaSeleccionadaStr;
          });
          const montoAbonosHoy = abonosHoy.reduce((s, a) => s + (a.valor || 0), 0);
          recogidoTotal += montoAbonosHoy;

          if (fechaPagoNormalizada === fechaSeleccionadaStr && montoAbonosHoy === 0) {
            recogidoTotal += (cuota.valorCuota || credito.valorCuota);
          }
        });

        // Sumar abonos generales, multas, etc.
        const abonosHoyGenerales = (credito.abonos || []).filter(a => (a.fecha?.split('T')[0] || a.fecha) === fechaSeleccionadaStr);
        recogidoTotal += abonosHoyGenerales.reduce((s, a) => s + a.valor, 0);

        const abonosMultaHoy = (credito.abonosMulta || []).filter(a => (a.fecha?.split('T')[0] || a.fecha) === fechaSeleccionadaStr);
        recogidoTotal += abonosMultaHoy.reduce((s, a) => s + a.valor, 0);
      });
    });

    const clisBuga = itemsK3Filtrados.length + (clientesPagadosK3?.K3?.items?.length || 0);

    return {
      porCobrar: porCobrarTotal,
      recogido: recogidoTotal,
      clientes: clisBuga
    };
  }, [clientes, itemsK3Filtrados, clientesPagadosK3, fechaSeleccionadaStr]);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Funciones de navegación de fecha
  const irAyer = () => setFechaSeleccionada(subDays(fechaSeleccionada, 1));
  const irHoy = () => setFechaSeleccionada(startOfDay(new Date()));
  const irMañana = () => setFechaSeleccionada(addDays(fechaSeleccionada, 1));
  const cambiarFecha = (e) => {
    const nuevaFecha = parseISO(e.target.value);
    setFechaSeleccionada(startOfDay(nuevaFecha));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header y Totales */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-orange-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Día de Cobro Buga</h1>
              <p className="text-slate-300 text-sm">
                {format(fechaSeleccionada, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>

          {/* Navegación Fecha */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-700/50 rounded-lg p-1">
              <button onClick={irAyer} className="p-2 hover:bg-white/10 rounded-md transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="relative">
                <input
                  type="date"
                  value={fechaSeleccionadaStr}
                  onChange={cambiarFecha}
                  className="bg-transparent text-center font-bold w-32 focus:outline-none cursor-pointer h-full"
                />
              </div>
              <button onClick={irMañana} className="p-2 hover:bg-white/10 rounded-md transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={irHoy}
                className={`ml-2 px-3 text-sm font-bold rounded-md transition-colors ${esHoy ? 'bg-orange-600 text-white' : 'hover:bg-white/10 text-slate-300'}`}
              >
                Hoy
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Por Cobrar (Global)</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-orange-300 wrap-break-word leading-tight">
              {formatearMoneda(estadisticasGlobales.porCobrar)}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Recogido (Global)</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-green-300 wrap-break-word leading-tight">
              {formatearMoneda(estadisticasGlobales.recogido)}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Clientes Buga</p>
            <p className="sm md:text-xl lg:text-2xl font-bold text-orange-300">
              {estadisticasGlobales.clientes}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ref. crédito, nombre, CC, teléfono o barrio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Header Día de Cobro Buga */}
      <div className="bg-linear-to-r from-orange-600 to-orange-700 text-white px-6 py-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Día de Cobro Buga</h2>
            <p className="text-orange-100 text-sm">Pagos Semanales, Quincenales, Mensuales y Diarios</p>
          </div>
        </div>
      </div>

      {/* Sección K3 */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-orange-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Cartera K3</h3>
              <p className="text-orange-100 text-sm">
                {itemsK3Filtrados.length} {itemsK3Filtrados.length === 1 ? 'cliente' : 'clientes'}
                {filtroK3 !== 'todos' && ` (${filtroK3})`}
              </p>
            </div>
            <select
              value={filtroK3}
              onChange={(e) => setFiltroK3(e.target.value)}
              className="bg-gradient-to-r from-orange-600 to-orange-700 border border-orange-400/50 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-orange-500/25 backdrop-blur-sm transition-all duration-300 hover:from-orange-500 hover:to-orange-600 hover:shadow-orange-400/30 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-300/70 focus:ring-offset-2 focus:ring-offset-orange-900/50 cursor-pointer"
            >
              <option value="todos" className="bg-gray-900 text-gray-100">Todos</option>
              <option value="semanal" className="bg-gray-900 text-gray-100">Semanal</option>
              <option value="quincenal" className="bg-gray-900 text-gray-100">Quincenal</option>
              <option value="mensual" className="bg-gray-900 text-gray-100">Mensual</option>
            </select>
          </div>
        </div>
        {itemsK3Filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay cobros para K3 en esta fecha</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-white uppercase bg-orange-600">
                <tr>
                  <th scope="col" className="px-4 py-3 w-12 text-center">#</th>
                  <th scope="col" className="px-4 py-3 text-center">Ref.</th>
                  <th scope="col" className="px-4 py-3">Cliente</th>
                  <th scope="col" className="px-4 py-3">Crédito</th>
                  <th scope="col" className="px-4 py-3 text-green-400">A Cobrar</th>
                  <th scope="col" className="px-4 py-3 text-orange-600">Vencido</th>
                  <th scope="col" className="px-4 py-3">Modalidad</th>
                  <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {itemsK3Filtrados.map((item, index) => (
                  <tr key={item.key} className="bg-orange-50 hover:bg-orange-100">
                    <td className="px-2 py-4 font-bold text-gray-900 text-center text-base">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 font-bold text-gray-900 text-center text-lg">
                      {item.clientePosicion ? `#${item.clientePosicion}` : `#${item.creditoId}`}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-base">{item.clienteNombre}</span>
                        <span className="text-gray-500 text-xs">CC: {item.clienteDocumento || 'N/A'}</span>
                        <div className="flex items-center gap-1 text-gray-600 text-xs mt-1 font-medium">
                          <Phone className="h-3 w-3" />
                          <span className="bg-yellow-100 text-yellow-800 px-1 rounded">{item.clienteTelefono || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                          <MapPin className="h-3 w-3" />
                          {item.clienteBarrio || 'Sin barrio'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {formatearMoneda(item.creditoMonto)}
                    </td>
                    <td className="px-4 py-4 font-bold text-green-600 text-base">
                      {formatearMoneda(item.valorRealACobrar)}
                    </td>
                    <td className="px-4 py-4 font-medium text-orange-600">
                      {formatearMoneda(item.valorRealACobrar)}
                    </td>
                    <td className="px-4 py-4 capitalize">
                      {item.creditoTipo}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => {
                          setCreditoSeleccionado(item.credito);
                          setClienteSeleccionado(item.cliente);
                        }}
                        className="text-orange-600 hover:text-orange-800 font-medium hover:underline text-sm"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sección Pagados */}
      <div className="space-y-6 mt-8 pt-8 border-t-2 border-gray-300">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Pagados</h2>
        </div>

        {/* Pagados K3 */}
        {(clientesPagadosK3?.K3?.items?.length || 0) > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-orange-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Pagos K3</h3>
                  <p className="text-orange-100 text-sm">{clientesPagadosK3?.K3?.items?.length || 0} {(clientesPagadosK3?.K3?.items?.length || 0) === 1 ? 'pago' : 'pagos'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-orange-100 text-sm">Total Recogido</p>
                <p className="text-2xl font-bold">{formatearMoneda(clientesPagadosK3?.K3?.total || 0)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-white uppercase bg-blue-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 w-20 text-center">Ref. Crédito</th>
                    <th scope="col" className="px-4 py-3">Cliente</th>
                    <th scope="col" className="px-4 py-3 text-green-400">Monto Pagado</th>
                    <th scope="col" className="px-4 py-3 text-center">Cuota</th>
                    <th scope="col" className="px-4 py-3 text-center">Tipo de Pago</th>
                    <th scope="col" className="px-4 py-3 text-center">Multa</th>
                    <th scope="col" className="px-4 py-3 text-center">Monto Pagado Multa</th>
                    <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(clientesPagadosK3?.K3?.items || []).map((item, index) => (
                    <tr key={`${item.clienteId}-${item.creditoId}-${item.nroCuota || 'general'}-${index}`} className="bg-orange-50 hover:bg-orange-100">
                      <td className="px-4 py-4 font-bold text-gray-900 text-center text-lg">
                        {item.clientePosicion ? `#${item.clientePosicion}` : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-base">{item.clienteNombre}</span>
                          <span className="text-gray-500 text-xs">CC: {item.clienteDocumento || 'N/A'}</span>
                          <div className="flex items-center gap-1 text-gray-600 text-xs mt-1 font-medium">
                            <Phone className="h-3 w-3" />
                            <span className="bg-yellow-100 text-yellow-800 px-1 rounded">{item.clienteTelefono || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                            <MapPin className="h-3 w-3" />
                            {item.clienteBarrio || 'Sin barrio'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold text-green-600 text-base">
                        {item.montoPagado > 0 ? formatearMoneda(item.montoPagado) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.nroCuota ? (
                          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded font-medium">
                            #{item.nroCuota}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.tipoPago ? (
                          <span className={`px-2 py-1 rounded font-medium ${item.tipoPago === 'completo'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                            }`}>
                            {item.tipoPago === 'completo' ? 'Completo' : 'Parcial'}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.tieneMulta ? (
                          <span className="bg-red-200 text-red-800 px-2 py-1 rounded font-medium text-xs">
                            {item.multaMotivo || 'Multa'}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-bold">
                        {item.montoPagadoMulta > 0 ? (
                          <span className="text-orange-600">{formatearMoneda(item.montoPagadoMulta)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => {
                            setCreditoSeleccionado(item.credito);
                            setClienteSeleccionado(item.cliente);
                          }}
                          className="text-orange-600 hover:text-orange-800 font-medium hover:underline text-sm"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mensaje si no hay pagos */}
        {(!clientesPagadosK3?.K3?.items || clientesPagadosK3.K3.items.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay pagos registrados para K3 en esta fecha</p>
          </div>
        )}
      </div>

      {/* Modal de Detalles de Crédito */}
      {creditoSeleccionado && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-orange-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-xl font-bold">Detalles del Crédito</h3>
              <button
                onClick={() => {
                  setCreditoSeleccionado(null);
                  setClienteSeleccionado(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CreditoDetalle
                credito={creditoSeleccionado}
                cliente={clienteSeleccionado}
                onClose={() => {
                  setCreditoSeleccionado(null);
                  setClienteSeleccionado(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-12">
        <p className="text-gray-600">Cuarta parte añadida - Modal de detalles y funcionalidades completas</p>
        <p className="text-green-600 font-medium mt-2">✓ DiaDeCobroBuga recreado exitosamente</p>
      </div>
    </div>
  );
};

export default DiaDeCobroBuga;
