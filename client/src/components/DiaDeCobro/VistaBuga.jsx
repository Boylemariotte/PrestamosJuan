import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Users, CheckCircle, Phone, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatearMoneda, calcularTotalMultasCuota, aplicarAbonosAutomaticamente, determinarEstadoCredito } from '../../utils/creditCalculations';
import CreditoDetalle from '../Creditos/CreditoDetalle';

const VistaBuga = ({ 
  fechaSeleccionada, 
  searchTerm, 
  filtroK3, 
  clientes, 
  ordenCobro, 
  prorrogasCuotas,
  creditoSeleccionado, 
  clienteSeleccionado,
  setCreditoSeleccionado,
  setClienteSeleccionado,
  irAyer,
  irHoy,
  irMañana,
  cambiarFecha,
  setSearchTerm,
  setFiltroK3,
  handleActualizarOrdenManual,
  OrdenInput
}) => {
  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
  const esHoy = format(fechaSeleccionada, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Calcular datos de cobro para K3
  const datosCobroK3 = useMemo(() => {
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

            if (fechaCuota === fechaSeleccionadaStr) {
              const creditoConAbonos = aplicarAbonosAutomaticamente(credito);
              const cuotaActualizada = creditoConAbonos.cuotasActualizadas.find(c => c.nroCuota === cuota.nroCuota);
              const valorRealACobrar = calcularTotalMultasCuota(cuotaActualizada || cuota, credito);

              const key = `${cliente.id}-${credito.id}-${cuota.nroCuota}`;
              const prorroga = prorrogasCuotas[key];

              let valorMostrar = valorRealACobrar;
              let tipo = 'pendiente';

              if (prorroga && prorroga.fechaFin && new Date(prorroga.fechaFin) >= new Date(fechaSeleccionadaStr)) {
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
                orden: ordenCobro[fechaSeleccionadaStr]?.[`${cliente.id}-${credito.id}-${cuota.nroCuota}`] || cliente.posicion || 999
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
              montoPagadoMulta: 0,
              tipoPago: cuota.tipoPago || 'completo',
              tieneMulta: cuota.tieneMulta || false,
              multaMotivo: cuota.multaMotivo
            };

            pagosK3.push(pagoItem);
          }
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

  // Calcular estadísticas
  const estadisticasK3 = useMemo(() => {
    const porCobrarK3 = itemsK3Filtrados.reduce((sum, item) => sum + item.valorRealACobrar, 0);
    const recogidoK3 = clientesPagadosK3.K3.total;
    const totalClientesK3 = itemsK3Filtrados.length + (clientesPagadosK3?.K3?.items?.length || 0);

    return {
      porCobrar: porCobrarK3,
      recogido: recogidoK3,
      clientes: totalClientesK3
    };
  }, [itemsK3Filtrados, clientesPagadosK3]);

  // Componente de tabla de cobros
  const TablaCobrosK3 = ({ items, onCambioOrden, ordenFecha }) => {
    // Ordenar por número de orden manual si existe, sino por posición
    const itemsOrdenados = [...items].sort((a, b) => {
      const ordenA = ordenFecha[a.clienteId] || '';
      const ordenB = ordenFecha[b.clienteId] || '';
      
      if (ordenA && ordenB) {
        return parseInt(ordenA) - parseInt(ordenB);
      }
      if (ordenA) return -1;
      if (ordenB) return 1;
      
      // Si no hay orden manual, ordenar por posición
      const posA = a.clientePosicion || '999';
      const posB = b.clientePosicion || '999';
      return parseInt(posA) - parseInt(posB);
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-white uppercase bg-orange-600">
            <tr>
              <th scope="col" className="px-4 py-3 w-12 text-center">#</th>
              <th scope="col" className="px-4 py-3 text-center">Orden</th>
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
            {itemsOrdenados.map((item, index) => {
              const numeroLista = index + 1;
              const rawOrden = ordenFecha[item.clienteId];
              const valorOrden = rawOrden === undefined || rawOrden === null ? '' : String(rawOrden);

              return (
                <tr key={item.key} className="bg-orange-50 hover:bg-orange-100">
                  <td className="px-2 py-4 font-bold text-gray-900 text-center text-base">
                    {numeroLista}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <OrdenInput
                      valorInicial={valorOrden}
                      onGuardar={(nuevoValor) => onCambioOrden(item.clienteId, nuevoValor, items)}
                    />
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
                    {item.tipo === 'pendiente'
                      ? formatearMoneda(item.valorRealACobrar)
                      : item.tipo === 'cobrado'
                        ? <span className="text-green-600">Pagado ({formatearMoneda(item.valorRealACobrar)})</span>
                        : <span className="text-yellow-600">Abonado ({formatearMoneda(item.valorRealACobrar)})</span>
                    }
                  </td>
                  <td className="px-4 py-4 font-medium text-orange-600">
                    {item.tipo === 'cobrado' ? '-' : formatearMoneda(item.valorRealACobrar)}
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-900">
                    {formatearMoneda(item.saldoTotalCredito)}
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
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Por Cobrar</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-orange-300 wrap-break-word leading-tight">
              {formatearMoneda(estadisticasK3.porCobrar)}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Recogido</p>
            <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-green-300 wrap-break-word leading-tight">
              {formatearMoneda(estadisticasK3.recogido)}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0">
            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Clientes</p>
            <p className="sm md:text-xl lg:text-2xl font-bold text-orange-300">
              {estadisticasK3.clientes}
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
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 rounded-xl shadow-lg">
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
          <TablaCobrosK3
            items={itemsK3Filtrados}
            onCambioOrden={handleActualizarOrdenManual}
            ordenFecha={ordenCobro[fechaSeleccionadaStr] || {}}
          />
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
                            // Buscar el cliente y crédito completos para el modal
                            const clienteCompleto = clientes.find(c => c.id === item.clienteId);
                            const creditoCompleto = clienteCompleto?.creditos?.find(cr => cr.id === item.creditoId);
                            if (clienteCompleto && creditoCompleto) {
                              setCreditoSeleccionado(creditoCompleto);
                              setClienteSeleccionado(clienteCompleto);
                            }
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
    </div>
  );
};

export default VistaBuga;
