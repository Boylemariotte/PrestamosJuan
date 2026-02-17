import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Users, AlertCircle, CheckCircle, Phone, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatearMoneda, determinarEstadoCredito } from '../../utils/creditCalculations';
import CreditoDetalle from '../Creditos/CreditoDetalle';
import { toast } from 'react-toastify';

const VistaTuluá = ({ 
  fechaSeleccionada, 
  searchTerm, 
  filtroK1, 
  filtroK2, 
  clientes, 
  ordenCobro, 
  creditoSeleccionado, 
  clienteSeleccionado,
  setCreditoSeleccionado,
  setClienteSeleccionado,
  irAyer,
  irHoy,
  irMañana,
  cambiarFecha,
  setSearchTerm,
  setFiltroK1,
  setFiltroK2,
  handleActualizarOrdenManual,
  OrdenInput,
  TablaCobrosLista
}) => {
  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
  const esHoy = format(fechaSeleccionada, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Calcular datos de cobro para K1 y K2
  const datosCobro = useMemo(() => {
    const itemsK1 = [];
    const itemsK2 = [];
    const clientesNoEncontradosK1 = new Set();
    const clientesNoEncontradosK2 = new Set();

    clientes.forEach(cliente => {
      if (!cliente.creditos || cliente.creditos.length === 0) return;

      cliente.creditos.forEach(credito => {
        if (!credito.cuotas || !Array.isArray(credito.cuotas)) return;
        
        const estado = determinarEstadoCredito(credito.cuotas, credito);
        
        if (estado === 'activo' || estado === 'mora') {
          credito.cuotas.forEach(cuota => {
            if (cuota.pagada) return;

            const fechaCuota = typeof cuota.fechaProgramada === 'string' 
              ? cuota.fechaProgramada.split('T')[0]
              : format(cuota.fechaProgramada, 'yyyy-MM-dd');

            if (fechaCuota === fechaSeleccionadaStr) {
              const item = {
                clienteId: cliente.id,
                clienteNombre: cliente.nombre,
                clienteDocumento: cliente.documento,
                clienteTelefono: cliente.telefono,
                clienteDireccion: cliente.direccion,
                clienteBarrio: cliente.barrio,
                clienteCartera: cliente.cartera || 'K1',
                clientePosicion: cliente.posicion,
                creditoId: credito.id,
                creditoMonto: credito.monto,
                creditoTipo: credito.tipo,
                nroCuota: cuota.nroCuota,
                valorCuota: cuota.valor,
                valorRealACobrar: cuota.valor,
                tipo: 'pendiente',
                reportado: true,
                key: `${cliente.id}-${credito.id}-${cuota.nroCuota}`,
                orden: ordenCobro[fechaSeleccionadaStr]?.[`${cliente.id}-${credito.id}-${cuota.nroCuota}`] || cliente.posicion || 999
              };

              if (cliente.cartera === 'K1') {
                itemsK1.push(item);
              } else if (cliente.cartera === 'K2') {
                itemsK2.push(item);
              }
            }
          });
        }
      });

      // Verificar si cliente fue encontrado
      const encontradoK1 = itemsK1.some(item => item.clienteId === cliente.id);
      const encontradoK2 = itemsK2.some(item => item.clienteId === cliente.id);
      
      if (!encontradoK1 && cliente.cartera === 'K1') {
        clientesNoEncontradosK1.add(cliente.id);
      }
      if (!encontradoK2 && cliente.cartera === 'K2') {
        clientesNoEncontradosK2.add(cliente.id);
      }
    });

    // Función para filtrar por tipo de pago
    const filtrarPorTipo = (items, filtro) => {
      if (filtro === 'todos') return items;
      return items.filter(item => item.creditoTipo === filtro);
    };

    // Filtrar y ordenar
    const itemsK1Filtrados = filtrarPorTipo(itemsK1, filtroK1)
      .sort((a, b) => a.orden - b.orden);
    
    const itemsK2Filtrados = filtrarPorTipo(itemsK2, filtroK2)
      .sort((a, b) => a.orden - b.orden);

    return {
      K1: itemsK1Filtrados,
      K2: itemsK2Filtrados,
      clientesNoEncontradosK1,
      clientesNoEncontradosK2
    };
  }, [clientes, fechaSeleccionadaStr, ordenCobro, filtroK1, filtroK2]);

  // Filtrar por búsqueda
  const itemsK1Filtrados = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    if (!searchTermLower) return datosCobro.K1 || [];
    
    return datosCobro.K1.filter(item => {
      const refCredito = item.clientePosicion ? `#${item.clientePosicion}` : '';
      return refCredito.toLowerCase().includes(searchTermLower) ||
             item.clienteNombre.toLowerCase().includes(searchTermLower) ||
             (item.clienteDocumento && item.clienteDocumento.toLowerCase().includes(searchTermLower)) ||
             (item.clienteTelefono && item.clienteTelefono.toLowerCase().includes(searchTermLower)) ||
             (item.clienteBarrio && item.clienteBarrio.toLowerCase().includes(searchTermLower));
    });
  }, [datosCobro.K1, searchTerm]);

  const itemsK2Filtrados = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    if (!searchTermLower) return datosCobro.K2 || [];
    
    return datosCobro.K2.filter(item => {
      const refCredito = item.clientePosicion ? `#${item.clientePosicion}` : '';
      return refCredito.toLowerCase().includes(searchTermLower) ||
             item.clienteNombre.toLowerCase().includes(searchTermLower) ||
             (item.clienteDocumento && item.clienteDocumento.toLowerCase().includes(searchTermLower)) ||
             (item.clienteTelefono && item.clienteTelefono.toLowerCase().includes(searchTermLower)) ||
             (item.clienteBarrio && item.clienteBarrio.toLowerCase().includes(searchTermLower));
    });
  }, [datosCobro.K2, searchTerm]);

  // Obtener clientes pagados
  const clientesPagados = useMemo(() => {
    const pagadosK1 = [];
    const pagadosK2 = [];

    clientes.forEach(cliente => {
      if (!cliente.creditos || cliente.creditos.length === 0) return;

      cliente.creditos.forEach(credito => {
        if (!credito.cuotas || !Array.isArray(credito.cuotas)) return;

        credito.cuotas.forEach(cuota => {
          if (!cuota.pagada) return;

          const fechaPago = typeof cuota.fechaPago === 'string' 
            ? cuota.fechaPago.split('T')[0]
            : format(cuota.fechaPago, 'yyyy-MM-dd');

          if (fechaPago === fechaSeleccionadaStr) {
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
              tipoPago: cuota.tipoPago || 'completo'
            };

            if (cliente.cartera === 'K1') {
              pagadosK1.push(pagoItem);
            } else if (cliente.cartera === 'K2') {
              pagadosK2.push(pagoItem);
            }
          }
        });
      });
    });

    const totalK1 = pagadosK1.reduce((sum, item) => sum + item.montoPagado, 0);
    const totalK2 = pagadosK2.reduce((sum, item) => sum + item.montoPagado, 0);

    return {
      K1: { items: pagadosK1, total: totalK1 },
      K2: { items: pagadosK2, total: totalK2 }
    };
  }, [clientes, fechaSeleccionadaStr]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const porCobrarK1 = itemsK1Filtrados.reduce((sum, item) => sum + item.valorRealACobrar, 0);
    const porCobrarK2 = itemsK2Filtrados.reduce((sum, item) => sum + item.valorRealACobrar, 0);
    const recogidoK1 = clientesPagados.K1.total;
    const recogidoK2 = clientesPagados.K2.total;

    return {
      K1: {
        porCobrar: porCobrarK1,
        recogido: recogidoK1,
        clientes: itemsK1Filtrados.length + clientesPagados.K1.items.length
      },
      K2: {
        porCobrar: porCobrarK2,
        recogido: recogidoK2,
        clientes: itemsK2Filtrados.length + clientesPagados.K2.items.length
      },
      totales: {
        porCobrar: porCobrarK1 + porCobrarK2,
        recogido: recogidoK1 + recogidoK2,
        clientes: itemsK1Filtrados.length + itemsK2Filtrados.length + clientesPagados.K1.items.length + clientesPagados.K2.items.length
      }
    };
  }, [itemsK1Filtrados, itemsK2Filtrados, clientesPagados]);

  return (
    <div className="space-y-6">
      {/* Header y Totales */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Día de Cobro Tuluá</h1>
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
              <input
                type="date"
                value={fechaSeleccionadaStr}
                onChange={cambiarFecha}
                className="bg-transparent text-center font-bold w-32 focus:outline-none cursor-pointer h-full"
              />
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">K1 Por Cobrar</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-blue-300 wrap-break-word leading-tight">
              {formatearMoneda(estadisticas.K1.porCobrar)}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">K1 Recogido</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-green-300 wrap-break-word leading-tight">
              {formatearMoneda(estadisticas.K1.recogido)}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">K2 Por Cobrar</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-green-300 wrap-break-word leading-tight">
              {formatearMoneda(estadisticas.K2.porCobrar)}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">K2 Recogido</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-emerald-300 wrap-break-word leading-tight">
              {formatearMoneda(estadisticas.K2.recogido)}
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
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Header Día de Cobro Tuluá */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-lg">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Día de Cobro Tuluá</h2>
            <p className="text-blue-100 text-sm">Pagos K1 y K2</p>
          </div>
        </div>
      </div>

      {/* Sección K1 */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Cartera K1</h3>
              <p className="text-blue-100 text-sm">
                {itemsK1Filtrados.length} {itemsK1Filtrados.length === 1 ? 'cliente' : 'clientes'}
                {filtroK1 !== 'todos' && ` (${filtroK1})`}
              </p>
            </div>
            <select
              value={filtroK1}
              onChange={(e) => setFiltroK1(e.target.value)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-400/50 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 backdrop-blur-sm transition-all duration-300 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-400/30 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-300/70 focus:ring-offset-2 focus:ring-offset-blue-900/50 cursor-pointer"
            >
              <option value="todos" className="bg-gray-900 text-gray-100">Todos</option>
              <option value="semanal" className="bg-gray-900 text-gray-100">Semanal</option>
              <option value="quincenal" className="bg-gray-900 text-gray-100">Quincenal</option>
              <option value="mensual" className="bg-gray-900 text-gray-100">Mensual</option>
            </select>
          </div>
        </div>
        {itemsK1Filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay cobros para K1 en esta fecha</p>
          </div>
        ) : (
          <TablaCobrosLista
            items={itemsK1Filtrados}
            onCambioOrden={handleActualizarOrdenManual}
            ordenFecha={ordenCobro[fechaSeleccionadaStr] || {}}
            setCreditoSeleccionado={setCreditoSeleccionado}
            setClienteSeleccionado={setClienteSeleccionado}
            color="blue"
          />
        )}
      </div>

      {/* Sección K2 */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Cartera K2</h3>
              <p className="text-green-100 text-sm">
                {itemsK2Filtrados.length} {itemsK2Filtrados.length === 1 ? 'cliente' : 'clientes'}
                {filtroK2 !== 'todos' && ` (${filtroK2})`}
              </p>
            </div>
            <select
              value={filtroK2}
              onChange={(e) => setFiltroK2(e.target.value)}
              className="bg-gradient-to-r from-green-600 to-green-700 border border-green-400/50 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-green-500/25 backdrop-blur-sm transition-all duration-300 hover:from-green-500 hover:to-green-600 hover:shadow-green-400/30 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-300/70 focus:ring-offset-2 focus:ring-offset-green-900/50 cursor-pointer"
            >
              <option value="todos" className="bg-gray-900 text-gray-100">Todos</option>
              <option value="quincenal" className="bg-gray-900 text-gray-100">Quincenal</option>
              <option value="mensual" className="bg-gray-900 text-gray-100">Mensual</option>
            </select>
          </div>
        </div>
        {itemsK2Filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay cobros para K2 en esta fecha</p>
          </div>
        ) : (
          <TablaCobrosLista
            items={itemsK2Filtrados}
            onCambioOrden={handleActualizarOrdenManual}
            ordenFecha={ordenCobro[fechaSeleccionadaStr] || {}}
            setCreditoSeleccionado={setCreditoSeleccionado}
            setClienteSeleccionado={setClienteSeleccionado}
            color="green"
          />
        )}
      </div>

      {/* Sección Pagados */}
      <div className="space-y-6 mt-8 pt-8 border-t-2 border-gray-300">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Pagados</h2>
        </div>

        {/* Pagados K1 */}
        {(clientesPagados.K1?.items?.length || 0) > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Pagos K1</h3>
                  <p className="text-blue-100 text-sm">{clientesPagados.K1.items.length} {clientesPagados.K1.items.length === 1 ? 'pago' : 'pagos'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Total Recogido</p>
                <p className="text-2xl font-bold">{formatearMoneda(clientesPagados.K1.total)}</p>
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
                    <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clientesPagados.K1.items.map((item, index) => (
                    <tr key={`${item.clienteId}-${item.creditoId}-${item.nroCuota || 'general'}-${index}`} className="bg-blue-50 hover:bg-blue-100">
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
                        {formatearMoneda(item.montoPagado)}
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
                        <button
                          onClick={() => {
                            const clienteCompleto = clientes.find(c => c.id === item.clienteId);
                            const creditoCompleto = clienteCompleto?.creditos?.find(cr => cr.id === item.creditoId);
                            if (clienteCompleto && creditoCompleto) {
                              setCreditoSeleccionado(creditoCompleto);
                              setClienteSeleccionado(clienteCompleto);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm"
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

        {/* Pagados K2 */}
        {(clientesPagados.K2?.items?.length || 0) > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Pagos K2</h3>
                  <p className="text-green-100 text-sm">{clientesPagados.K2.items.length} {clientesPagados.K2.items.length === 1 ? 'pago' : 'pagos'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-100 text-sm">Total Recogido</p>
                <p className="text-2xl font-bold">{formatearMoneda(clientesPagados.K2.total)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-white uppercase bg-green-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 w-20 text-center">Ref. Crédito</th>
                    <th scope="col" className="px-4 py-3">Cliente</th>
                    <th scope="col" className="px-4 py-3 text-green-400">Monto Pagado</th>
                    <th scope="col" className="px-4 py-3 text-center">Cuota</th>
                    <th scope="col" className="px-4 py-3 text-center">Tipo de Pago</th>
                    <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clientesPagados.K2.items.map((item, index) => (
                    <tr key={`${item.clienteId}-${item.creditoId}-${item.nroCuota || 'general'}-${index}`} className="bg-green-50 hover:bg-green-100">
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
                        {formatearMoneda(item.montoPagado)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.nroCuota ? (
                          <span className="bg-green-200 text-green-800 px-2 py-1 rounded font-medium">
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
                        <button
                          onClick={() => {
                            const clienteCompleto = clientes.find(c => c.id === item.clienteId);
                            const creditoCompleto = clienteCompleto?.creditos?.find(cr => cr.id === item.creditoId);
                            if (clienteCompleto && creditoCompleto) {
                              setCreditoSeleccionado(creditoCompleto);
                              setClienteSeleccionado(clienteCompleto);
                            }
                          }}
                          className="text-green-600 hover:text-green-800 font-medium hover:underline text-sm"
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
        {(!clientesPagados.K1?.items || clientesPagados.K1.items.length === 0) && 
         (!clientesPagados.K2?.items || clientesPagados.K2.items.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay pagos registrados en esta fecha</p>
          </div>
        )}
      </div>

      {/* Modal de Detalles de Crédito */}
      {creditoSeleccionado && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
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
    </div>
  );
};

export default VistaTuluá;
