import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Calendar, Users, ChevronLeft, ChevronRight, CheckCircle, Clock, MapPin, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format, parseISO, startOfDay, addDays, subDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearMoneda, calcularTotalMultasCuota, aplicarAbonosAutomaticamente, determinarEstadoCredito, formatearFechaCorta } from '../utils/creditCalculations';
import CreditoDetalle from '../components/Creditos/CreditoDetalle';

const DiaDeCobro = () => {
  const navigate = useNavigate();
  const { clientes, obtenerCliente, obtenerCredito } = useApp();
  const hoy = startOfDay(new Date());

  // Estado para la fecha seleccionada
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');

  // Estado para visitas
  const [visitas, setVisitas] = useState([]);

  // Estado para orden de cobro por fecha y cliente
  // Estructura: { [fechaStr]: { [clienteId]: numeroOrden } }
  const [ordenCobro, setOrdenCobro] = useState({});

  // Cargar visitas y orden de cobro desde localStorage
  useEffect(() => {
    const cargarVisitas = () => {
      const savedVisitas = localStorage.getItem('visitas');
      if (savedVisitas) {
        setVisitas(JSON.parse(savedVisitas));
      }
    };

    cargarVisitas();
    window.addEventListener('storage', cargarVisitas);
    return () => window.removeEventListener('storage', cargarVisitas);
  }, []);

  // Cargar orden de cobro al iniciar
  useEffect(() => {
    const savedOrden = localStorage.getItem('ordenCobro');
    if (savedOrden) {
      try {
        setOrdenCobro(JSON.parse(savedOrden));
      } catch (e) {
        console.error('Error al parsear ordenCobro desde localStorage', e);
      }
    }
  }, []);

  // Guardar cambios de orden de cobro
  useEffect(() => {
    localStorage.setItem('ordenCobro', JSON.stringify(ordenCobro));
  }, [ordenCobro]);

  // Filtrar visitas para el día seleccionado
  const visitasDelDia = useMemo(() => {
    return visitas.filter(visita => {
      if (visita.completada) return false;
      const fechaVisita = visita.fechaVisita;
      if (fechaVisita === fechaSeleccionadaStr) return true;
      if (fechaVisita < fechaSeleccionadaStr) return true;
      return false;
    });
  }, [visitas, fechaSeleccionadaStr]);

  const handleCompletarVisita = (id) => {
    if (window.confirm('¿Marcar visita como completada?')) {
      const nuevasVisitas = visitas.map(v =>
        v.id === id ? { ...v, completada: true } : v
      );
      setVisitas(nuevasVisitas);
      localStorage.setItem('visitas', JSON.stringify(nuevasVisitas));
      toast.success('Visita marcada como completada');
    }
  };

  // Manejar cambio de número de orden para un cliente en la fecha seleccionada
  const handleCambioOrdenCliente = (clienteId, nuevoOrden) => {
    const numero = Number(nuevoOrden);
    if (Number.isNaN(numero) || numero <= 0) return;

    setOrdenCobro(prev => {
      const fechaKey = fechaSeleccionadaStr;
      const ordenFechaActual = prev[fechaKey] || {};

      const nuevoOrdenFecha = {
        ...ordenFechaActual,
        [clienteId]: numero,
      };

      return {
        ...prev,
        [fechaKey]: nuevoOrdenFecha,
      };
    });
  };

  // Procesar cobros agrupados por BARRIO
  const datosCobro = useMemo(() => {
    const porBarrio = {}; // { "Nombre Barrio": [items...] }
    const stats = {
      esperado: 0,
      recogido: 0,
      pendiente: 0,
      clientesTotal: 0
    };

    const clientesUnicos = new Set();

    // Helper para agregar item a barrio
    const agregarItem = (barrioRaw, item) => {
      const barrio = barrioRaw || 'Sin Barrio';
      if (!porBarrio[barrio]) porBarrio[barrio] = [];
      porBarrio[barrio].push(item);
      clientesUnicos.add(item.clienteId);
    };

    clientes.forEach(cliente => {
      if (!cliente.creditos || cliente.creditos.length === 0) return;

      cliente.creditos.forEach(credito => {
        if (!credito.cuotas) return;

        const { cuotasActualizadas } = aplicarAbonosAutomaticamente(credito);
        const estadoCredito = determinarEstadoCredito(credito.cuotas, credito);

        // Identificar actividad del día
        let tieneActividadHoy = false;
        let totalACobrarHoy = 0;
        let totalCobradoHoy = 0;
        let totalAbonadoHoy = 0;

        // 1. Cuotas Pendientes (Programadas hoy o Vencidas)
        const cuotasPendientesHoy = cuotasActualizadas.filter((cuota, index) => {
          const cuotaOriginal = credito.cuotas[index];
          if (cuotaOriginal.pagado) return false;

          const abonoAplicado = cuota.abonoAplicado || 0;
          const valorCuotaPendiente = credito.valorCuota - abonoAplicado;
          const totalMultas = calcularTotalMultasCuota(cuota);
          const multasCubiertas = cuota.multasCubiertas || 0;
          const multasPendientes = totalMultas - multasCubiertas;
          const tieneSaldo = valorCuotaPendiente > 0 || multasPendientes > 0;

          // Check fecha
          if (cuotaOriginal.fechaProgramada === fechaSeleccionadaStr) return tieneSaldo;
          const fProg = new Date(cuotaOriginal.fechaProgramada);
          const fSel = new Date(fechaSeleccionadaStr);
          return tieneSaldo && fProg <= fSel;
        });

        if (cuotasPendientesHoy.length > 0) {
          tieneActividadHoy = true;
          cuotasPendientesHoy.forEach(c => {
            const abono = c.abonoAplicado || 0;
            const multas = calcularTotalMultasCuota(c) - (c.multasCubiertas || 0);
            totalACobrarHoy += (credito.valorCuota - abono) + multas;
          });
        }

        // 2. Cuotas Cobradas Hoy
        const cuotasCobradasHoy = credito.cuotas.filter(cuota => {
          return cuota.pagado && cuota.fechaPago === fechaSeleccionadaStr && !cuota.tieneAbono;
        });
        if (cuotasCobradasHoy.length > 0) {
          tieneActividadHoy = true;
          totalCobradoHoy += (cuotasCobradasHoy.length * credito.valorCuota);
        }

        // 3. Abonos Hoy (Específicos o Generales)
        // a. Específicos
        const cuotasAbonadasHoy = credito.cuotas.filter(cuota =>
          cuota.abonosCuota && cuota.abonosCuota.some(a => a.fecha === fechaSeleccionadaStr)
        );
        // b. Generales
        const abonosGeneralesHoy = (credito.abonos || []).filter(abono => {
          const f = abono.fecha?.split('T')[0] || abono.fecha;
          return f === fechaSeleccionadaStr;
        });

        if (cuotasAbonadasHoy.length > 0 || abonosGeneralesHoy.length > 0) {
          tieneActividadHoy = true;
          cuotasAbonadasHoy.forEach(c => {
            const abonos = c.abonosCuota.filter(a => a.fecha === fechaSeleccionadaStr);
            totalAbonadoHoy += abonos.reduce((s, a) => s + a.valor, 0);
          });
          totalAbonadoHoy += abonosGeneralesHoy.reduce((s, a) => s + a.valor, 0);
        }

        if (!tieneActividadHoy) return;

        // Determinar estado visual para la tabla
        // Prioridad: Pendiente > Abonado > Cobrado
        let tipoItem = 'cobrado';
        if (totalACobrarHoy > 0) tipoItem = 'pendiente';
        else if (totalAbonadoHoy > 0 && totalACobrarHoy === 0) tipoItem = 'abonado'; // Si abonó y no debe nada pendiente viejo/hoy

        // Si debe pendiente, el valor a mostrar principal es lo que debe.
        // Si no debe, mostramos lo que pagó/abonó.
        let valorMostrar = 0;
        // CAMBIO: Para pendiente, mostrar siempre el valor de la cuota general del crédito,
        // independiente de si debe varias. El usuario solicitó ver la cuota estándar.
        if (tipoItem === 'pendiente') valorMostrar = credito.valorCuota;
        else if (tipoItem === 'cobrado') valorMostrar = totalCobradoHoy;
        else valorMostrar = totalAbonadoHoy;

        // Calcular info de vencimiento (Global del crédito)
        // Similar a Clientes.jsx
        let cuotasVencidasCount = 0;
        let primerCuotaVencidaFecha = null;
        const fechaHoyObj = startOfDay(new Date());

        cuotasActualizadas.forEach(cuota => {
          if (cuota.pagado) return;
          const abono = cuota.abonoAplicado || 0;
          if ((credito.valorCuota - abono) > 0) {
            const fProg = startOfDay(parseISO(cuota.fechaProgramada));
            if (isBefore(fProg, fechaHoyObj)) {
              cuotasVencidasCount++;
              if (!primerCuotaVencidaFecha || isBefore(fProg, startOfDay(parseISO(primerCuotaVencidaFecha)))) {
                primerCuotaVencidaFecha = cuota.fechaProgramada;
              }
            }
          }
        });

        // Calcular saldo total del crédito
        let pagadoTotal = 0;
        credito.cuotas.forEach(c => { if (c.pagado) pagadoTotal += credito.valorCuota; });
        const totalAbonosCredito = (credito.abonos || []).reduce((sum, a) => sum + a.valor, 0);

        const saldoTotalCredito = cuotasActualizadas.reduce((sum, c) => {
          if (c.pagado) return sum;
          const abono = c.abonoAplicado || 0;
          const multas = calcularTotalMultasCuota(c) - (c.multasCubiertas || 0);
          return sum + (credito.valorCuota - abono) + multas;
        }, 0);


        const item = {
          tipo: tipoItem,
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          clienteDocumento: cliente.documento,
          clienteTelefono: cliente.telefono,
          clienteDireccion: cliente.direccion,
          clienteBarrio: cliente.barrio,
          creditoId: credito.id,
          creditoMonto: credito.monto,
          creditoTipo: credito.tipo,
          valorMostrar: valorMostrar,
          valorRealACobrar: totalACobrarHoy,
          saldoTotalCredito: saldoTotalCredito,
          estadoCredito: estadoCredito,
          cuotasVencidasCount,
          primerCuotaVencidaFecha
        };

        agregarItem(cliente.barrio, item);

        // Stats
        stats.esperado += totalACobrarHoy + totalCobradoHoy + totalAbonadoHoy;
        stats.pendiente += totalACobrarHoy;
        stats.recogido += (totalCobradoHoy + totalAbonadoHoy);

      });
    });

    stats.clientesTotal = clientesUnicos.size;

    const barriosOrdenados = Object.keys(porBarrio).sort().reduce((obj, key) => {
      obj[key] = porBarrio[key];
      return obj;
    }, {});

    return { porBarrio: barriosOrdenados, stats };
  }, [clientes, fechaSeleccionadaStr]);

  // Construir lista plana de cobros del día (sin agrupar por barrio)
  const listaCobrosDia = useMemo(() => {
    const items = [];
    Object.values(datosCobro.porBarrio).forEach(arr => {
      arr.forEach(item => items.push(item));
    });

    const ordenFecha = ordenCobro[fechaSeleccionadaStr] || {};

    // Ordenar primero por número de orden asignado, luego por nombre de cliente
    items.sort((a, b) => {
      const ordenA = ordenFecha[a.clienteId] ?? Number.MAX_SAFE_INTEGER;
      const ordenB = ordenFecha[b.clienteId] ?? Number.MAX_SAFE_INTEGER;

      if (ordenA !== ordenB) return ordenA - ordenB;
      return (a.clienteNombre || '').localeCompare(b.clienteNombre || '');
    });

    return items;
  }, [datosCobro, ordenCobro, fechaSeleccionadaStr]);

  // Funciones de navegación de fecha
  const irAyer = () => setFechaSeleccionada(subDays(fechaSeleccionada, 1));
  const irHoy = () => setFechaSeleccionada(startOfDay(new Date()));
  const irMañana = () => setFechaSeleccionada(addDays(fechaSeleccionada, 1));
  const cambiarFecha = (e) => {
    const nuevaFecha = parseISO(e.target.value);
    setFechaSeleccionada(startOfDay(nuevaFecha));
  };
  const esHoy = format(fechaSeleccionada, 'yyyy-MM-dd') === format(startOfDay(new Date()), 'yyyy-MM-dd');

  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const abrirDetalle = (clienteId, creditoId) => {
    const cliente = obtenerCliente(clienteId);
    const credito = obtenerCredito(clienteId, creditoId);
    if (cliente && credito) {
      setClienteSeleccionado(cliente);
      setCreditoSeleccionado(credito);
    }
  };

  // Tabla de Cobros del día en lista única con numeración
  const TablaCobrosLista = ({ items, onCambioOrden, ordenFecha }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-white uppercase bg-slate-800">
          <tr>
            <th scope="col" className="px-2 py-3 w-16 text-center">#</th>
            <th scope="col" className="px-4 py-3 w-24 text-center">Orden</th>
            <th scope="col" className="px-4 py-3 w-20 text-center">Ref. Crédito</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Crédito</th>
            <th scope="col" className="px-4 py-3 text-green-400">Valor Cuota</th>
            <th scope="col" className="px-4 py-3">Saldo Pendiente (Cuota)</th>
            <th scope="col" className="px-4 py-3">Saldo Pendiente (Total)</th>
            <th scope="col" className="px-4 py-3">Vencido</th>
            <th scope="col" className="px-4 py-3">Modalidad</th>
            <th scope="col" className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const numeroLista = index + 1;
            const valorOrden = ordenFecha[item.clienteId] || numeroLista;

            return (
              <tr key={`${item.clienteId}-${item.creditoId}-${index}`} className="bg-white border-b hover:bg-gray-50">
                <td className="px-2 py-4 font-bold text-gray-900 text-center text-base">
                  {numeroLista}
                </td>
                <td className="px-4 py-4 text-center">
                  <input
                    type="number"
                    min={1}
                    max={items.length}
                    className="w-16 text-center border border-gray-300 rounded-md text-sm py-1 px-1"
                    value={valorOrden}
                    onChange={(e) => onCambioOrden(item.clienteId, e.target.value)}
                  />
                </td>
                <td className="px-4 py-4 font-bold text-gray-900 text-center text-lg">
                  #{item.creditoId}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-base">{item.clienteNombre}</span>
                    <span className="text-gray-500 text-xs">CC: {item.clienteDocumento || 'N/A'}</span>
                    <div className="flex items-center gap-1 text-gray-600 text-xs mt-1 font-medium">
                      <Phone className="h-3 w-3" />
                      <span className="bg-yellow-100 text-yellow-800 px-1 rounded">{item.clienteTelefono}</span>
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
                  {item.tipo === 'pendiente'
                    ? formatearMoneda(item.valorMostrar)
                    : item.tipo === 'cobrado'
                      ? <span className="text-green-600">Pagado ({formatearMoneda(item.valorMostrar)})</span>
                      : <span className="text-yellow-600">Abonado ({formatearMoneda(item.valorMostrar)})</span>
                  }
                </td>
                <td className="px-4 py-4 font-medium text-orange-600">
                  {item.tipo === 'cobrado' ? '-' : formatearMoneda(item.valorRealACobrar)}
                </td>
                <td className="px-4 py-4 font-medium text-gray-900">
                  {formatearMoneda(item.saldoTotalCredito)}
                </td>
                <td className="px-4 py-4">
                  {item.cuotasVencidasCount > 0 ? (
                    <div className="text-red-600 font-bold">
                      (SI) - <span className="text-xs">{formatearFechaCorta(item.primerCuotaVencidaFecha)}</span>
                      {item.cuotasVencidasCount > 1 && (
                        <div className="text-xs text-red-500 mt-0.5 font-normal">
                          ({item.cuotasVencidasCount} cuotas)
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-green-600 font-medium">Al día</span>
                  )}
                </td>
                <td className="px-4 py-4 capitalize">
                  {item.creditoTipo}
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => abrirDetalle(item.clienteId, item.creditoId)}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm"
                  >
                    Ver Detalle
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header y Totales */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Día de Cobro</h1>
              <p className="text-slate-300 text-sm">
                {format(fechaSeleccionada, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>

          {/* Navegación Fecha */}
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
              className={`ml-2 px-3 text-sm font-bold rounded-md transition-colors ${esHoy ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'}`}
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Por Cobrar</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-orange-300 break-words leading-tight">{formatearMoneda(datosCobro.stats.pendiente)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Recogido</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-green-300 break-words leading-tight">{formatearMoneda(datosCobro.stats.recogido)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Clientes</p>
            <p className="text-sm md:text-xl lg:text-2xl font-bold text-blue-300">{datosCobro.stats.clientesTotal}</p>
          </div>
        </div>
      </div>

      {/* Visitas */}
      {visitasDelDia.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-purple-800">
            <Clock className="h-5 w-5" />
            <h2 className="font-bold text-lg">Visitas Programadas ({visitasDelDia.length})</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {visitasDelDia.map(visita => (
              <div key={visita.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center border border-purple-100">
                <div>
                  <p className="font-bold text-gray-800">{visita.solicitante.nombre}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {visita.solicitante.barrioCasa}
                  </div>
                </div>
                <button
                  onClick={() => handleCompletarVisita(visita.id)}
                  className="p-2 hover:bg-green-100 text-gray-400 hover:text-green-600 rounded-full transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista única de clientes del día con numeración */}
      <div className="space-y-4">
        {listaCobrosDia.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay cobros para esta fecha</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <TablaCobrosLista
              items={listaCobrosDia}
              onCambioOrden={handleCambioOrdenCliente}
              ordenFecha={ordenCobro[fechaSeleccionadaStr] || {}}
            />
          </div>
        )}
      </div>

      {/* Modal Detalle */}
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

export default DiaDeCobro;
