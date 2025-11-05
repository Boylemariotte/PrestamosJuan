import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO, startOfDay, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Map, List, X, CalendarPlus, Clock, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatearMoneda, formatearFecha, isFechaPasada, aplicarAbonosAutomaticamente, calcularTotalMultasCuota } from '../utils/creditCalculations';

const RutasDeCobro = () => {
  const { clientes, editarFechaCuota, obtenerCredito } = useApp();
  const hoy = startOfDay(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
  
  // Estado para el barrio seleccionado en el modal
  const [barrioSeleccionado, setBarrioSeleccionado] = useState(null);
  
  // Estado para rastrear clientes visitados
  const [clientesVisitados, setClientesVisitados] = useState({});
  
  // Estado para controlar el modal de posposición de cuota
  const [modalPosponer, setModalPosponer] = useState({
    isOpen: false,
    cliente: null,
    credito: null,
    creditoCompleto: null,
    cuotaPendiente: null,
    nroCuota: null,
    fechaActual: null,
    fechaMaxima: null,
    fechaSeleccionada: null,
    proximasFechas: []
  });

  // Obtener todos los cobros del día agrupados por barrio
  const clientesPorBarrio = useMemo(() => {
    // Usar un objeto simple en lugar de Map para mayor compatibilidad
    const barriosObj = {};
    
    // Procesar clientes con cobros pendientes
    clientes.forEach(cliente => {
      // Solo procesar clientes con créditos
      if (!cliente.creditos || cliente.creditos.length === 0) return;

      // Verificar si el cliente tiene cobros pendientes para la fecha seleccionada
      const tieneCobrosPendientes = cliente.creditos.some(credito => {
        if (!credito.cuotas) return false;
        
        // Aplicar abonos automáticamente para obtener cuotas actualizadas
        const { cuotasActualizadas } = aplicarAbonosAutomaticamente(credito);
        
        // Verificar si hay cuotas pendientes para la fecha seleccionada
        return cuotasActualizadas.some((cuota, index) => {
          const cuotaOriginal = credito.cuotas[index];
          if (cuotaOriginal.pagado) return false;
          
          // Calcular el valor pendiente de la cuota (ya incluye abonos aplicados)
          const abonoAplicado = cuota.abonoAplicado || 0;
          const valorCuotaPendiente = credito.valorCuota - abonoAplicado;
          
          // Calcular multas pendientes (ya incluye multas cubiertas)
          const totalMultas = calcularTotalMultasCuota(cuota);
          const multasCubiertas = cuota.multasCubiertas || 0;
          const multasPendientes = totalMultas - multasCubiertas;
          
          // Si la cuota tiene saldo pendiente (valor de cuota o multas)
          const tieneSaldoPendiente = valorCuotaPendiente > 0 || multasPendientes > 0;
          
          // Incluir si es la fecha programada
          if (cuotaOriginal.fechaProgramada === fechaSeleccionadaStr) return tieneSaldoPendiente;
          
          // Incluir si tiene saldo pendiente y la fecha programada ya pasó
          const fechaProgramada = new Date(cuotaOriginal.fechaProgramada);
          const fechaSeleccionadaDate = new Date(fechaSeleccionadaStr);
          
          return tieneSaldoPendiente && fechaProgramada <= fechaSeleccionadaDate;
        });
      });

      if (!tieneCobrosPendientes) return;

      const barrio = (cliente.barrio || '').trim() || 'Sin barrio';
      
      // Inicializar el barrio si no existe
      if (!barriosObj[barrio]) {
        barriosObj[barrio] = {
          nombre: barrio,
          clientes: [],
          totalPendiente: 0,
          cantidadClientes: 0
        };
      }
      
      const barrioData = barriosObj[barrio];
      
      // Verificar si el cliente ya está en el barrio
      let clienteData = barrioData.clientes.find(c => c.clienteId === cliente.id);
      
      // Si el cliente no está en el barrio, agregarlo
      if (!clienteData) {
        clienteData = {
          clienteId: cliente.id,
          nombre: cliente.nombre,
          direccion: cliente.direccion || 'Sin dirección',
          telefono: cliente.telefono || 'Sin teléfono',
          valorPendiente: 0,
          creditos: []
        };
        barrioData.clientes.push(clienteData);
        barrioData.cantidadClientes++;
      }
      
      // Procesar cada crédito del cliente
      cliente.creditos.forEach(credito => {
        if (!credito.cuotas) return;
        
        // Aplicar abonos automáticamente para obtener cuotas actualizadas
        const { cuotasActualizadas } = aplicarAbonosAutomaticamente(credito);
        
        // Filtrar cuotas pendientes para la fecha seleccionada
        const cuotasPendientes = cuotasActualizadas.filter((cuota, index) => {
          const cuotaOriginal = credito.cuotas[index];
          if (cuotaOriginal.pagado) return false;
          
          // Calcular el valor pendiente de la cuota (ya incluye abonos aplicados)
          const abonoAplicado = cuota.abonoAplicado || 0;
          const valorCuotaPendiente = credito.valorCuota - abonoAplicado;
          
          // Calcular multas pendientes (ya incluye multas cubiertas)
          const totalMultas = calcularTotalMultasCuota(cuota);
          const multasCubiertas = cuota.multasCubiertas || 0;
          const multasPendientes = totalMultas - multasCubiertas;
          
          // Si la cuota tiene saldo pendiente (valor de cuota o multas)
          const tieneSaldoPendiente = valorCuotaPendiente > 0 || multasPendientes > 0;
          
          // Incluir si es la fecha programada
          if (cuotaOriginal.fechaProgramada === fechaSeleccionadaStr) return tieneSaldoPendiente;
          
          // Incluir si tiene saldo pendiente y la fecha programada ya pasó
          const fechaProgramada = new Date(cuotaOriginal.fechaProgramada);
          const fechaSeleccionadaDate = new Date(fechaSeleccionadaStr);
          
          return tieneSaldoPendiente && fechaProgramada <= fechaSeleccionadaDate;
        });

        if (cuotasPendientes.length === 0) return;

        // Calcular el total pendiente para este crédito
        const totalPendienteCredito = cuotasPendientes.reduce((sum, cuota, index) => {
          const cuotaOriginal = credito.cuotas[index];
          const abonoAplicado = cuota.abonoAplicado || 0;
          const valorCuotaPendiente = credito.valorCuota - abonoAplicado;
          
          const totalMultas = calcularTotalMultasCuota(cuota);
          const multasCubiertas = cuota.multasCubiertas || 0;
          const multasPendientes = totalMultas - multasCubiertas;
          
          return sum + valorCuotaPendiente + multasPendientes;
        }, 0);

        // Agregar el crédito al cliente
        clienteData.creditos.push({
          creditoId: credito.id,
          valorPendiente: totalPendienteCredito,
          nroCuota: cuotasPendientes[0].nroCuota,
          totalCuotas: credito.numCuotas,
          fechaVencimiento: cuotasPendientes[0].fechaProgramada,
          diasPosposicion: cuotasPendientes[0].diasPosposicion || 0
        });
        
        // Actualizar totales
        clienteData.valorPendiente += totalPendienteCredito;
        barrioData.totalPendiente += totalPendienteCredito;
      });
    });
    
    // Convertir el objeto a array y ordenar alfabéticamente
    const barriosArray = Object.values(barriosObj).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );
    
    // Ordenar clientes dentro de cada barrio por nombre
    barriosArray.forEach(barrio => {
      barrio.clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
    
    return barriosArray;
  }, [clientes, fechaSeleccionadaStr]);

  // Funciones de navegación de fecha
  const irAyer = () => setFechaSeleccionada(subDays(fechaSeleccionada, 1));
  const irHoy = () => setFechaSeleccionada(hoy);
  const irManana = () => setFechaSeleccionada(addDays(fechaSeleccionada, 1));
  const cambiarFecha = (e) => {
    const nuevaFecha = parseISO(e.target.value);
    setFechaSeleccionada(startOfDay(nuevaFecha));
  };

  // Verificar si la fecha seleccionada es hoy
  const esHoy = format(fechaSeleccionada, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd');

  // Función para abrir el modal con los clientes de un barrio
  const abrirModalClientes = (barrio) => {
    setBarrioSeleccionado(barrio);
  };

  // Función para cerrar el modal
  const cerrarModalClientes = () => {
    setBarrioSeleccionado(null);
  };

  // Función para alternar el estado de visita de un cliente
  const toggleClienteVisitado = (clienteId) => {
    setClientesVisitados(prev => ({
      ...prev,
      [clienteId]: !prev[clienteId]
    }));
  };

  // Función para abrir el modal de posposición
  const abrirModalPosponer = (cliente, credito) => {
    // Obtener el crédito completo del contexto
    const creditoCompleto = obtenerCredito(cliente.clienteId, credito.creditoId);
    
    if (!creditoCompleto) {
      toast.error('No se pudo obtener la información del crédito');
      return;
    }
    
    // Encontrar la cuota pendiente (la que estamos posponiendo)
    const cuotaPendiente = creditoCompleto.cuotas?.find(c => c.nroCuota === credito.nroCuota);
    
    if (!cuotaPendiente) {
      toast.error('No se encontró la cuota pendiente');
      return;
    }
    
    const fechaActual = new Date();
    const fechaVencimiento = new Date(cuotaPendiente.fechaProgramada);
    
    // Si la fecha de vencimiento es pasada, usar la fecha actual
    const fechaBase = fechaVencimiento < fechaActual ? fechaActual : fechaVencimiento;
    
    // Calcular la fecha máxima (5 días después de la fecha base)
    const fechaMaxima = new Date(fechaBase);
    fechaMaxima.setDate(fechaBase.getDate() + 5);
    
    // Calcular la fecha sugerida (mañana desde la fecha base, pero no más de 5 días)
    const fechaSugerida = new Date(fechaBase);
    fechaSugerida.setDate(fechaBase.getDate() + 1);
    
    setModalPosponer({
      isOpen: true,
      cliente: cliente,
      credito: credito,
      creditoCompleto: creditoCompleto,
      cuotaPendiente: cuotaPendiente,
      nroCuota: credito.nroCuota,
      fechaActual: cuotaPendiente.fechaProgramada,
      fechaMaxima: fechaMaxima.toISOString().split('T')[0],
      fechaSeleccionada: fechaSugerida.toISOString().split('T')[0],
      proximasFechas: []
    });
  };

  // Función para cerrar el modal de posposición
  const cerrarModalPosponer = () => {
    setModalPosponer({
      isOpen: false,
      cliente: null,
      credito: null,
      creditoCompleto: null,
      cuotaPendiente: null,
      nroCuota: null,
      fechaActual: null,
      fechaMaxima: null,
      fechaSeleccionada: null,
      proximasFechas: []
    });
  };

  // Función para manejar el cambio de fecha
  const handleFechaChange = (fecha) => {
    setModalPosponer(prev => ({
      ...prev,
      fechaSeleccionada: fecha
    }));
  };

  // Función para confirmar la posposición
  const confirmarPosposicion = () => {
    if (!modalPosponer.cliente || !modalPosponer.credito || !modalPosponer.fechaSeleccionada || !modalPosponer.nroCuota) {
      toast.error('Por favor selecciona una fecha para la prórroga');
      return;
    }

    const nuevaFecha = modalPosponer.fechaSeleccionada;
    const clienteId = modalPosponer.cliente.clienteId;
    const creditoId = modalPosponer.credito.creditoId;
    const nroCuota = modalPosponer.nroCuota;
    
    // Calcular la diferencia de días para mostrar en el mensaje
    const fechaActual = new Date(modalPosponer.fechaActual);
    const fechaNueva = new Date(nuevaFecha);
    const diasPosposicion = Math.ceil((fechaNueva - fechaActual) / (1000 * 60 * 60 * 24));

    // Validar que no exceda los 5 días
    if (diasPosposicion > 5) {
      toast.error('La prórroga no puede exceder 5 días después de la fecha de vencimiento actual');
      return;
    }

    // Validar que la fecha no sea anterior a la fecha actual de la cuota
    if (diasPosposicion < 0) {
      toast.error('La nueva fecha no puede ser anterior a la fecha de vencimiento actual');
      return;
    }

    // Usar editarFechaCuota que actualiza la cuota y ajusta automáticamente las posteriores
    editarFechaCuota(clienteId, creditoId, nroCuota, nuevaFecha);

    // Mostrar mensaje de éxito
    toast.success(`Fecha de vencimiento actualizada. Prórroga de ${diasPosposicion} días aplicada correctamente`);

    // Cerrar el modal de posposición
    cerrarModalPosponer();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MapPin className="h-8 w-8" />
              Rutas de Cobro
            </h1>
            <p className="text-slate-200 text-lg mt-2">
              {format(fechaSeleccionada, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-slate-300" />
            <div className="text-right">
              <p className="text-sm text-slate-300">Barrios con cobros</p>
              <p className="text-3xl font-bold">{clientesPorBarrio.length}</p>
            </div>
          </div>
        </div>

        {/* Selector de Fecha */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={irAyer}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Ayer</span>
          </button>
          
          <button
            onClick={irHoy}
            disabled={esHoy}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              esHoy 
                ? 'bg-blue-500 text-white cursor-default' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Hoy
          </button>
          
          <button
            onClick={irManana}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium">Mañana</span>
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <input
              type="date"
              value={format(fechaSeleccionada, 'yyyy-MM-dd')}
              onChange={cambiarFecha}
              className="bg-transparent border-none text-white text-sm font-medium focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Lista de Barrios */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              Rutas de Cobro
            </h2>
            
            {clientesPorBarrio.length === 0 ? (
              <div className="text-center py-12">
                <Map className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay clientes con cobros pendientes en esta fecha</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientesPorBarrio.map((barrio) => (
                  <BarrioCard 
                    key={barrio.nombre} 
                    barrio={barrio} 
                    onVerClientes={abrirModalClientes}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para ver clientes de un barrio */}
      {barrioSeleccionado && (
        <ClientesBarrioModal 
          barrio={barrioSeleccionado} 
          onClose={cerrarModalClientes}
          clientesVisitados={clientesVisitados}
          onToggleVisitado={toggleClienteVisitado}
          onPosponerPago={abrirModalPosponer}
        />
      )}

      {/* Modal para posponer pago */}
      {modalPosponer.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <CalendarPlus className="h-5 w-5 inline-block mr-2 text-blue-600" />
                  Posponer pago
                </h3>
                <button 
                  onClick={cerrarModalPosponer}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cliente</p>
                  <p className="font-medium">{modalPosponer.cliente?.nombre}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cuota</p>
                  <p className="font-medium">Cuota {modalPosponer.nroCuota} de {modalPosponer.creditoCompleto?.numCuotas || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha actual de vencimiento
                  </label>
                  <input
                    type="text"
                    value={modalPosponer.fechaActual ? formatearFecha(modalPosponer.fechaActual) : ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva fecha de vencimiento *
                  </label>
                  <input
                    type="date"
                    value={modalPosponer.fechaSeleccionada || ''}
                    onChange={(e) => handleFechaChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    min={modalPosponer.fechaActual || format(new Date(), 'yyyy-MM-dd')}
                    max={modalPosponer.fechaMaxima || ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 5 días después de la fecha actual de vencimiento
                  </p>
                </div>
                
                {modalPosponer.creditoCompleto && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> La prórroga está limitada a máximo 5 días. Al cambiar esta fecha, todas las cuotas posteriores se ajustarán automáticamente manteniendo el intervalo de {
                        modalPosponer.creditoCompleto.tipo === 'semanal' ? '7' : 
                        modalPosponer.creditoCompleto.tipo === 'quincenal' ? '15' :
                        modalPosponer.creditoCompleto.tipo === 'mensual' ? '30' :
                        modalPosponer.creditoCompleto.tipo === 'diario' ? '1' : '15'
                      } días.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={cerrarModalPosponer}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarPosposicion}
                    disabled={!modalPosponer.fechaSeleccionada}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      modalPosponer.fechaSeleccionada 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-blue-400 cursor-not-allowed'
                    }`}
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar la tarjeta de un barrio
const BarrioCard = ({ barrio, onVerClientes }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{barrio.nombre}</h3>
              <p className="text-sm text-gray-600">
                {barrio.cantidadClientes} {barrio.cantidadClientes === 1 ? 'cliente' : 'clientes'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total pendiente</p>
            <p className="text-lg font-bold text-blue-700">{formatearMoneda(barrio.totalPendiente)}</p>
          </div>
        </div>
        
        <button
          onClick={() => onVerClientes(barrio)}
          className="mt-3 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          <List className="h-4 w-4" />
          Ver clientes
        </button>
      </div>
    </div>
  );
};

// Componente para mostrar los clientes de un barrio específico
const ClientesBarrioModal = ({ barrio, onClose, clientesVisitados, onToggleVisitado, onPosponerPago }) => {
  if (!barrio) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {barrio.nombre} - {barrio.clientes.length} {barrio.clientes.length === 1 ? 'cliente' : 'clientes'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Total: {formatearMoneda(barrio.totalPendiente)}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Cerrar modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {barrio.clientes.map((cliente) => (
              <div 
                key={cliente.clienteId} 
                className={`border rounded-lg p-4 transition-colors ${
                  clientesVisitados && clientesVisitados[cliente.clienteId] 
                    ? 'bg-gray-50 border-gray-200 text-gray-500' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center justify-between w-full">
                      <h3 className="font-semibold text-gray-900">{cliente.nombre}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisitado(cliente.clienteId);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        aria-label={clientesVisitados && clientesVisitados[cliente.clienteId] ? 'Marcar como no visitado' : 'Marcar como visitado'}
                      >
                        {clientesVisitados && clientesVisitados[cliente.clienteId] ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">{cliente.direccion}</p>
                    {cliente.telefono && (
                      <p className="text-sm text-blue-600 mt-1">
                        📞 {cliente.telefono}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-700">
                      {formatearMoneda(cliente.valorPendiente)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cliente.creditos.length} {cliente.creditos.length === 1 ? 'crédito' : 'créditos'}
                    </p>
                  </div>
                </div>
                
                {cliente.creditos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">DETALLE DE CRÉDITOS</p>
                    <div className="space-y-3">
                      {cliente.creditos.map((credito, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <div>
                              <span className="text-sm font-medium">Crédito #{String(credito.creditoId || '').slice(-4)}</span>
                              {credito.pospuesto && (
                                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full inline-flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pospuesto
                                </span>
                              )}
                            </div>
                            <span className="font-medium">{formatearMoneda(credito.valorPendiente)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <span>Cuota {credito.nroCuota}/{credito.totalCuotas}</span>
                            {credito.fechaVencimiento && (
                              <span className={`text-xs ${isFechaPasada(credito.fechaVencimiento) ? 'text-red-600' : 'text-gray-500'}`}>
                                Vence: {formatearFecha(credito.fechaVencimiento)}
                                {credito.diasPosposicion > 0 && ` (+${credito.diasPosposicion} días)`}
                              </span>
                            )}
                          </div>
                          {onPosponerPago && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPosponerPago(cliente, credito);
                                }}
                                className="w-full py-1 px-2 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1"
                              >
                                <CalendarPlus className="h-3 w-3" />
                                <span>Posponer pago</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RutasDeCobro;
