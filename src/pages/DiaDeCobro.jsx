import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, DollarSign, Users, Wallet, ChevronLeft, ChevronRight, MapPin, Map, List, X, CalendarPlus, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format, parseISO, startOfDay, addDays, subDays, isToday, isSameDay, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearMoneda, calcularTotalMultasCuota, aplicarAbonosAutomaticamente } from '../utils/creditCalculations';

const DiaDeCobro = () => {
  const { clientes, setClientes } = useApp();
  const hoy = startOfDay(new Date());

  // Estado para la fecha seleccionada
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');

  // Obtener todos los cobros del día agrupados por cartera
  const cobrosDelDia = useMemo(() => {
    const cobrosK1 = [];
    const cobrosK2 = [];
    const cobradosK1 = [];
    const cobradosK2 = [];
    const abonadosK1 = [];
    const abonadosK2 = [];

    clientes.forEach(cliente => {
      // Solo procesar clientes con créditos
      if (!cliente.creditos || cliente.creditos.length === 0) return;

      cliente.creditos.forEach(credito => {
        // Solo procesar créditos activos o en mora (no finalizados)
        if (!credito.cuotas) return;

        // Aplicar abonos automáticamente para obtener cuotas actualizadas con abonoAplicado y multasCubiertas
        const { cuotasActualizadas } = aplicarAbonosAutomaticamente(credito);
        
        // Cuotas pendientes programadas para la fecha seleccionada
        // O cuotas con multas pendientes (sin importar la fecha)
        const cuotasDelDia = cuotasActualizadas.filter((cuota, index) => {
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

        // Cuotas cobradas en la fecha seleccionada
        const cuotasCobradas = credito.cuotas.filter(cuota => {
          return cuota.pagado && cuota.fechaPago === fechaSeleccionadaStr && !cuota.tieneAbono;
        });

        // Verificar si hay abonos generales del crédito en la fecha seleccionada
        const abonosGeneralesDelDia = (credito.abonos || []).filter(abono => {
          if (!abono || !abono.fecha) return false;
          const fechaAbono = abono.fecha?.split('T')[0] || abono.fecha;
          return fechaAbono === fechaSeleccionadaStr;
        });

        // Si hay abonos generales hoy, NO agregar a cuotas pendientes
        const tieneAbonoGeneralHoy = abonosGeneralesDelDia.length > 0;

        // Cuotas con abonos en la fecha seleccionada (abonos a cuotas específicas)
        const cuotasAbonadas = credito.cuotas.filter(cuota => {
          if (!cuota.abonosCuota || cuota.abonosCuota.length === 0) return false;
          return cuota.abonosCuota.some(abono => abono.fecha === fechaSeleccionadaStr);
        });

        // Ya no necesitamos calcular excedenteAbonos porque ahora usamos
        // cuota.abonoAplicado que ya tiene el abono aplicado a cada cuota

        // Agregar cuotas pendientes (solo si NO tiene abono general hoy)
        if (!tieneAbonoGeneralHoy) {
          // Ordenar cuotas pendientes por número
          const cuotasOrdenadas = [...cuotasDelDia].sort((a, b) => a.nroCuota - b.nroCuota);
          
          cuotasOrdenadas.forEach((cuota, index) => {
          // Calcular multas de la cuota
          const totalMultas = calcularTotalMultasCuota(cuota);
          const multasCubiertas = cuota.multasCubiertas || 0;
          const multasPendientes = totalMultas - multasCubiertas;
          
          // Calcular abonos aplicados a la cuota (después de cubrir multas)
          const abonoAplicado = cuota.abonoAplicado || 0;
          
          // El valor pendiente de la cuota es: valorCuota - abonoAplicado
          const valorCuotaPendiente = credito.valorCuota - abonoAplicado;
          
          // Calcular el valor real a cobrar: multas pendientes + cuota pendiente
          const valorACobrar = multasPendientes + valorCuotaPendiente;

          const cobro = {
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            clienteTelefono: cliente.telefono,
            clienteDireccion: cliente.direccion,
            creditoId: credito.id,
            creditoMonto: credito.monto,
            creditoTipo: credito.tipo,
            nroCuota: cuota.nroCuota,
            valorCuota: valorACobrar,
            valorCuotaOriginal: credito.valorCuota,
            totalCuotas: credito.numCuotas,
            cartera: cliente.cartera,
            tieneSaldoPendiente: valorACobrar > credito.valorCuota,
            totalMultas: multasPendientes,
            multasCubiertas: multasCubiertas,
            abonoAplicado: abonoAplicado,
            valorCuotaPendiente: valorCuotaPendiente
          };

          if (cliente.cartera === 'K1') {
            cobrosK1.push(cobro);
          } else {
            cobrosK2.push(cobro);
          }
        });
        }

        // Agregar cuotas cobradas hoy
        cuotasCobradas.forEach(cuota => {
          const cobrado = {
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            valorCuota: credito.valorCuota,
            cartera: cliente.cartera
          };

          if (cliente.cartera === 'K1') {
            cobradosK1.push(cobrado);
          } else {
            cobradosK2.push(cobrado);
          }
        });

        // Agregar cuotas con abonos específicos
        cuotasAbonadas.forEach(cuota => {
          const abonosDelDia = cuota.abonosCuota.filter(a => a.fecha === fechaSeleccionadaStr);
          const totalAbonadoHoy = abonosDelDia.reduce((sum, a) => sum + a.valor, 0);
          
          // Encontrar la cuota actualizada correspondiente
          const indexCuota = credito.cuotas.findIndex(c => c.nroCuota === cuota.nroCuota);
          const cuotaActualizada = cuotasActualizadas[indexCuota];
          
          // Usar los valores de la cuota actualizada
          const abonoAplicado = cuotaActualizada.abonoAplicado || 0;
          const totalMultas = calcularTotalMultasCuota(cuotaActualizada);
          const multasCubiertas = cuotaActualizada.multasCubiertas || 0;
          const multasPendientes = totalMultas - multasCubiertas;
          
          // El saldo pendiente de la cuota
          const cuotaPendiente = credito.valorCuota - abonoAplicado;
          const saldoPendiente = cuotaPendiente + multasPendientes;
          
          // Calcular la distribución del abono de hoy (similar a abonos generales)
          // Calcular el estado ANTES del abono de hoy
          const abonosCuotaAntesDeHoy = cuota.abonosCuota.filter(a => a.fecha !== fechaSeleccionadaStr);
          const totalAbonadoAntesDeHoy = abonosCuotaAntesDeHoy.reduce((sum, a) => sum + a.valor, 0);
          
          // Simular aplicar abonos sin el abono de hoy
          const creditoSinAbonoHoy = {
            ...credito,
            cuotas: credito.cuotas.map(c => {
              if (c.nroCuota === cuota.nroCuota) {
                return {
                  ...c,
                  abonosCuota: abonosCuotaAntesDeHoy
                };
              }
              return c;
            })
          };
          
          // Nota: Los abonos a cuotas específicas no se procesan por aplicarAbonosAutomaticamente
          // Se aplican directamente a la cuota, así que calculamos manualmente
          let abonoHoyAMultas = 0;
          let abonoHoyACuota = 0;
          
          // Calcular multas antes del abono de hoy
          const multasAntesDeHoy = totalMultas; // Las multas no cambian con abonos
          const multasCubiertasAntesDeHoy = Math.max(0, multasCubiertas - totalAbonadoHoy);
          const multasPendientesAntesDeHoy = multasAntesDeHoy - multasCubiertasAntesDeHoy;
          
          if (multasPendientesAntesDeHoy > 0) {
            abonoHoyAMultas = Math.min(totalAbonadoHoy, multasPendientesAntesDeHoy);
            abonoHoyACuota = totalAbonadoHoy - abonoHoyAMultas;
          } else {
            abonoHoyACuota = totalAbonadoHoy;
          }

          const abonado = {
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            clienteTelefono: cliente.telefono,
            creditoId: credito.id,
            nroCuota: cuota.nroCuota,
            valorCuota: credito.valorCuota,
            totalAbonado: abonoAplicado + multasCubiertas,
            totalAbonadoHoy: totalAbonadoHoy,
            saldoPendiente: saldoPendiente,
            cartera: cliente.cartera,
            esAbonoGeneral: false,
            totalMultas: totalMultas,
            multasCubiertas: multasCubiertas,
            multasPendientes: multasPendientes,
            cuotaPendiente: cuotaPendiente,
            abonoHoyAMultas: abonoHoyAMultas,
            abonoHoyACuota: abonoHoyACuota
          };

          if (cliente.cartera === 'K1') {
            abonadosK1.push(abonado);
          } else {
            abonadosK2.push(abonado);
          }
        });

        // Agregar abonos generales del crédito realizados en la fecha
        if (abonosGeneralesDelDia.length > 0) {
          const totalAbonadoHoy = abonosGeneralesDelDia.reduce((sum, a) => sum + a.valor, 0);
          const totalAbonosCredito = (credito.abonos || []).reduce((sum, a) => sum + a.valor, 0);
          
          // Encontrar la primera cuota pendiente (usando cuotas actualizadas)
          const indexPrimeraCuotaPendiente = credito.cuotas.findIndex(c => !c.pagado);
          
          let multasPendientes = 0;
          let multasCubiertasTotal = 0;
          let nroCuotaPendiente = 'General';
          let abonoHoyAMultas = 0;
          let abonoHoyACuota = 0;
          let cuotaPendiente = credito.valorCuota;
          
          if (indexPrimeraCuotaPendiente !== -1) {
            const cuotaActualizada = cuotasActualizadas[indexPrimeraCuotaPendiente];
            const cuotaOriginal = credito.cuotas[indexPrimeraCuotaPendiente];
            
            // Usar los valores calculados por aplicarAbonosAutomaticamente
            const totalMultas = calcularTotalMultasCuota(cuotaActualizada);
            multasCubiertasTotal = cuotaActualizada.multasCubiertas || 0;
            multasPendientes = totalMultas - multasCubiertasTotal;
            nroCuotaPendiente = cuotaOriginal.nroCuota;
            
            // Calcular el valor pendiente de la cuota usando abonoAplicado
            const abonoAplicado = cuotaActualizada.abonoAplicado || 0;
            cuotaPendiente = credito.valorCuota - abonoAplicado;
            
            // Calcular cuánto del abono de HOY se aplicó a multas y cuánto a la cuota
            // Necesitamos calcular esto basándonos en el estado ANTES del abono de hoy
            // Para simplificar, asumimos que el abono de hoy sigue la misma lógica:
            // primero multas, luego cuota
            
            // Calcular multas y abonos ANTES del abono de hoy
            const totalAbonosAntesDeHoy = totalAbonosCredito - totalAbonadoHoy;
            const { cuotasActualizadas: cuotasAntesDeHoy } = aplicarAbonosAutomaticamente({
              ...credito,
              abonos: (credito.abonos || []).filter(a => {
                const fechaAbono = a.fecha?.split('T')[0] || a.fecha;
                return fechaAbono !== fechaSeleccionadaStr;
              })
            });
            
            const cuotaAntesDeHoy = cuotasAntesDeHoy[indexPrimeraCuotaPendiente];
            const multasAntesDeHoy = calcularTotalMultasCuota(cuotaAntesDeHoy);
            const multasCubiertasAntesDeHoy = cuotaAntesDeHoy.multasCubiertas || 0;
            const multasPendientesAntesDeHoy = multasAntesDeHoy - multasCubiertasAntesDeHoy;
            
            // El abono de hoy primero cubre multas pendientes
            if (multasPendientesAntesDeHoy > 0) {
              abonoHoyAMultas = Math.min(totalAbonadoHoy, multasPendientesAntesDeHoy);
              abonoHoyACuota = totalAbonadoHoy - abonoHoyAMultas;
            } else {
              // Si no hay multas pendientes, todo el abono va a la cuota
              abonoHoyACuota = totalAbonadoHoy;
            }
          }

          const abonadoGeneral = {
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            clienteTelefono: cliente.telefono,
            creditoId: credito.id,
            nroCuota: nroCuotaPendiente,
            valorCuota: credito.valorCuota,
            totalAbonado: totalAbonosCredito,
            totalAbonadoHoy: totalAbonadoHoy,
            saldoPendiente: cuotaPendiente + multasPendientes,
            cartera: cliente.cartera,
            esAbonoGeneral: true,
            multasPendientes: multasPendientes,
            multasCubiertas: multasCubiertasTotal,
            cuotaPendiente: cuotaPendiente,
            abonoHoyAMultas: abonoHoyAMultas,
            abonoHoyACuota: abonoHoyACuota
          };

          if (cliente.cartera === 'K1') {
            abonadosK1.push(abonadoGeneral);
          } else {
            abonadosK2.push(abonadoGeneral);
          }
        }
      });
    });

    return { cobrosK1, cobrosK2, cobradosK1, cobradosK2, abonadosK1, abonadosK2 };
  }, [clientes, fechaSeleccionadaStr]);

  // Agrupar clientes por barrio para la vista de rutas
  const clientesPorBarrio = useMemo(() => {
    // Usar un objeto simple en lugar de Map para mayor compatibilidad
    const barriosObj = {};
    
    // Procesar clientes con cobros pendientes
    const todosLosCobros = [...(cobrosDelDia.cobrosK1 || []), ...(cobrosDelDia.cobrosK2 || [])];
    
    todosLosCobros.forEach(cobro => {
      const cliente = clientes.find(c => c.id === cobro.clienteId);
      if (!cliente || !cliente.barrio) return;
      
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
      let clienteData = barrioData.clientes.find(c => c.clienteId === cobro.clienteId);
      
      // Si el cliente no está en el barrio, agregarlo
      if (!clienteData) {
        clienteData = {
          clienteId: cobro.clienteId,
          nombre: cobro.clienteNombre,
          direccion: cobro.clienteDireccion || 'Sin dirección',
          telefono: cobro.clienteTelefono || 'Sin teléfono',
          valorPendiente: 0,
          creditos: []
        };
        barrioData.clientes.push(clienteData);
        barrioData.cantidadClientes++;
      }
      
      // Buscar si ya existe el crédito para este cliente
      let creditoExistente = clienteData.creditos.find(c => c.creditoId === cobro.creditoId);
      
      if (creditoExistente) {
        // Si el crédito ya existe, sumar al valor pendiente
        creditoExistente.valorPendiente += cobro.valorCuota || 0;
      } else {
        // Si no existe, agregar el crédito
        clienteData.creditos.push({
          creditoId: cobro.creditoId || `cred-${Math.random().toString(36).substr(2, 9)}`,
          valorPendiente: cobro.valorCuota || 0,
          nroCuota: cobro.nroCuota || 1,
          totalCuotas: cobro.totalCuotas || 1
        });
      }
      
      // Actualizar totales
      const valorCuota = cobro.valorCuota || 0;
      barrioData.totalPendiente += valorCuota;
      clienteData.valorPendiente += valorCuota;
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
  }, [cobrosDelDia, clientes]);

  // Calcular totales pendientes
  const totalPendienteK1 = cobrosDelDia.cobrosK1.reduce((sum, cobro) => sum + cobro.valorCuota, 0);
  const totalPendienteK2 = cobrosDelDia.cobrosK2.reduce((sum, cobro) => sum + cobro.valorCuota, 0);
  const totalPendienteGeneral = totalPendienteK1 + totalPendienteK2;

  // Calcular totales cobrados hoy
  const totalCobradoK1 = cobrosDelDia.cobradosK1.reduce((sum, cobro) => sum + cobro.valorCuota, 0);
  const totalCobradoK2 = cobrosDelDia.cobradosK2.reduce((sum, cobro) => sum + cobro.valorCuota, 0);
  const totalCobradoGeneral = totalCobradoK1 + totalCobradoK2;

  // Calcular totales abonados hoy
  const totalAbonadoK1 = cobrosDelDia.abonadosK1.reduce((sum, abono) => sum + abono.totalAbonadoHoy, 0);
  const totalAbonadoK2 = cobrosDelDia.abonadosK2.reduce((sum, abono) => sum + abono.totalAbonadoHoy, 0);
  const totalAbonadoGeneral = totalAbonadoK1 + totalAbonadoK2;

  // Contar clientes únicos por cartera
  const clientesUnicosK1 = new Set(cobrosDelDia.cobrosK1.map(c => c.clienteId)).size;
  const clientesUnicosK2 = new Set(cobrosDelDia.cobrosK2.map(c => c.clienteId)).size;
  const totalClientesUnicos = clientesUnicosK1 + clientesUnicosK2;

  // Funciones de navegación de fecha
  const irAyer = () => setFechaSeleccionada(subDays(fechaSeleccionada, 1));
  const irHoy = () => setFechaSeleccionada(hoy);
  const irMañana = () => setFechaSeleccionada(addDays(fechaSeleccionada, 1));
  const cambiarFecha = (e) => {
    const nuevaFecha = parseISO(e.target.value);
    setFechaSeleccionada(startOfDay(nuevaFecha));
  };

  // Verificar si la fecha seleccionada es hoy
  const esHoy = format(fechaSeleccionada, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd');

  // Estado para controlar la vista de rutas
  const [mostrarVistaRutas, setMostrarVistaRutas] = useState(false);

  const CobroCard = ({ cobro }) => {
    const tieneMultas = cobro.totalMultas && cobro.totalMultas > 0;
    const tieneAbonos = cobro.abonoAplicado > 0 || cobro.multasCubiertas > 0;
    const tieneSaldoOMultas = cobro.tieneSaldoPendiente || tieneMultas;
    
    // Determinar si es un caso simple (sin abonos previos ni multas)
    const esCasoSimple = !tieneAbonos && !tieneMultas;
    
    return (
      <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
        tieneSaldoOMultas ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">{cobro.clienteNombre}</h3>
              {cobro.tieneSaldoPendiente && (
                <span className="inline-flex items-center px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold">
                  + Saldo
                </span>
              )}
              {tieneMultas && (
                <span className="inline-flex items-center px-2 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                  ⚠️ Multa
                </span>
              )}
            </div>
            
            {/* TOTAL A PAGAR - Destacado al inicio */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg px-4 py-3 mb-3 shadow-md">
              <p className="text-xs font-medium opacity-90">DEBE PAGAR</p>
              <p className="text-2xl font-bold">{formatearMoneda(cobro.valorCuota)}</p>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <span className="font-medium">Teléfono:</span>
                <span>{cobro.clienteTelefono}</span>
              </p>
              {cobro.clienteDireccion && (
                <p className="flex items-center gap-2">
                  <span className="font-medium">Dirección:</span>
                  <span>{cobro.clienteDireccion}</span>
                </p>
              )}
              <p className="flex items-center gap-2">
                <span className="font-medium">Crédito:</span>
                <span>{formatearMoneda(cobro.creditoMonto)} - {cobro.creditoTipo}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Cuota:</span>
                <span>{cobro.nroCuota} de {cobro.totalCuotas}</span>
              </p>
              
              {/* Versión compacta para casos simples */}
              {esCasoSimple && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Cuota completa sin abonos previos</p>
                </div>
              )}
              
              {/* Versión detallada para casos con abonos o multas */}
              {!esCasoSimple && (
                <div className="mt-3 pt-3 border-t-2 border-orange-300">
                  <p className="text-xs font-bold text-gray-700 mb-2">📊 Desglose:</p>
                  
                  {/* Cuota original */}
                  <div className="bg-blue-50 border-l-4 border-blue-400 px-3 py-2 mb-1">
                    <p className="text-sm font-semibold text-blue-900">
                      Cuota #{cobro.nroCuota}: {formatearMoneda(cobro.valorCuotaOriginal)}
                    </p>
                  </div>
                  
                  {/* Multas (si existen) */}
                  {(cobro.totalMultas > 0 || cobro.multasCubiertas > 0) && (
                    <div className="bg-red-50 border-l-4 border-red-400 px-3 py-2 mb-1">
                      <p className="text-sm font-semibold text-red-900">
                        + Multas: {formatearMoneda(cobro.totalMultas + cobro.multasCubiertas)}
                      </p>
                    </div>
                  )}
                  
                  {/* Total a pagar */}
                  {(cobro.totalMultas > 0 || cobro.multasCubiertas > 0) && (
                    <div className="bg-purple-50 border-l-4 border-purple-400 px-3 py-2 mb-2">
                      <p className="text-sm font-bold text-purple-900">
                        = Total: {formatearMoneda(cobro.valorCuotaOriginal + (cobro.totalMultas + cobro.multasCubiertas))}
                      </p>
                    </div>
                  )}
                  
                  {/* Abonos aplicados (si existen) */}
                  {tieneAbonos && (
                    <div className="bg-green-50 border-l-4 border-green-400 px-3 py-2 mb-1">
                      <p className="text-sm font-semibold text-green-900">
                        - Ya pagó: {formatearMoneda(cobro.abonoAplicado + cobro.multasCubiertas)}
                      </p>
                      {cobro.multasCubiertas > 0 && (
                        <p className="text-xs text-green-700 ml-2">
                          • Multas: {formatearMoneda(cobro.multasCubiertas)}
                        </p>
                      )}
                      {cobro.abonoAplicado > 0 && (
                        <p className="text-xs text-green-700 ml-2">
                          • Cuota: {formatearMoneda(cobro.abonoAplicado)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Total pendiente */}
                  <div className="bg-orange-100 border-l-4 border-orange-500 px-3 py-2 mt-2">
                    <p className="text-sm font-bold text-orange-900">
                      = Pendiente: {formatearMoneda(cobro.valorCuota)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ClientePagadoCard = ({ cobrado }) => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-lg">{cobrado.clienteNombre}</h3>
            <span className="inline-flex items-center px-2 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
              ✓ Pagado
            </span>
          </div>
        </div>
        <div className="ml-4 text-right">
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
            <DollarSign className="h-4 w-4" />
            {formatearMoneda(cobrado.valorCuota)}
          </div>
        </div>
      </div>
    </div>
  );

  const ClienteAbonadoCard = ({ abonado }) => {
    const tieneMultas = abonado.multasPendientes && abonado.multasPendientes > 0;
    const multasPagadasCompleto = abonado.abonoHoyAMultas > 0 && abonado.multasPendientes === 0;
    const saldoTotal = abonado.cuotaPendiente + (abonado.multasPendientes || 0);
    
    return (
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-gray-900 text-lg">{abonado.clienteNombre}</h3>
              <span className="inline-flex items-center px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-semibold">
                💰 Abono {abonado.esAbonoGeneral ? 'General' : ''}
              </span>
              {tieneMultas && (
                <span className="inline-flex items-center px-2 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                  ⚠️ Multa
                </span>
              )}
            </div>
            
            {/* SECCIÓN 1: Lo que abonó HOY */}
            <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-3 mb-3">
              <p className="text-xs font-bold text-blue-900 mb-2">💰 ABONÓ HOY:</p>
              <p className="text-2xl font-bold text-blue-900 mb-2">{formatearMoneda(abonado.totalAbonadoHoy)}</p>
              
              <div className="space-y-1">
                {abonado.abonoHoyAMultas > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${multasPagadasCompleto ? 'text-green-700' : 'text-blue-700'}`}>
                      {multasPagadasCompleto ? '✓ Multas pagadas:' : '• A multas:'}
                    </span>
                    <span className="text-sm font-bold text-blue-900">
                      {formatearMoneda(abonado.abonoHoyAMultas)}
                    </span>
                    {multasPagadasCompleto && (
                      <span className="text-xs text-green-600">(completo)</span>
                    )}
                  </div>
                )}
                {abonado.abonoHoyACuota > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-700">
                      • A cuota:
                    </span>
                    <span className="text-sm font-bold text-blue-900">
                      {formatearMoneda(abonado.abonoHoyACuota)}
                    </span>
                    <span className="text-xs text-blue-600">(parcial)</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* SECCIÓN 2: Saldo después del abono */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-gray-600">Teléfono:</p>
                <p className="text-sm text-gray-900">{abonado.clienteTelefono}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs font-medium text-gray-600">Cuota:</p>
                <p className="text-sm text-gray-900">#{abonado.nroCuota}</p>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-700 mb-2">⚠️ AÚN DEBE:</p>
                <div className="bg-orange-100 border-2 border-orange-400 rounded-lg px-4 py-3">
                  <p className="text-2xl font-bold text-orange-900">{formatearMoneda(saldoTotal)}</p>
                  <div className="mt-2 space-y-1 text-xs text-orange-800">
                    {abonado.cuotaPendiente > 0 && (
                      <p>• Cuota: {formatearMoneda(abonado.cuotaPendiente)}</p>
                    )}
                    {tieneMultas && (
                      <p>• Multas: {formatearMoneda(abonado.multasPendientes)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CarteraSection = ({ titulo, cobros, cobrados, abonados, total, color }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`${color} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-white" />
          <h2 className="text-xl font-bold text-white">{titulo}</h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/80">Total a cobrar</p>
          <p className="text-2xl font-bold text-white">{formatearMoneda(total)}</p>
        </div>
      </div>
      
      <div className="p-6">
        {cobros.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay cobros programados para esta fecha</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{cobros.length}</span> {cobros.length === 1 ? 'cliente' : 'clientes'} para cobrar
              </p>
            </div>
            <div className="space-y-3">
              {cobros.map((cobro, index) => (
                <CobroCard key={`${cobro.clienteId}-${cobro.creditoId}-${cobro.nroCuota}`} cobro={cobro} />
              ))}
            </div>
          </>
        )}

        {/* Sección de clientes que abonaron */}
        {abonados && abonados.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-4 flex items-center gap-2">
              <div className="bg-yellow-100 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Clientes que Abonaron
              </h3>
              <span className="ml-auto bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                {abonados.length} {abonados.length === 1 ? 'abono' : 'abonos'}
              </span>
            </div>
            <div className="space-y-3">
              {abonados.map((abonado, index) => (
                <ClienteAbonadoCard key={`${abonado.clienteId}-${abonado.creditoId}-${index}`} abonado={abonado} />
              ))}
            </div>
          </div>
        )}

        {/* Sección de clientes que ya pagaron */}
        {cobrados && cobrados.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-4 flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Clientes que ya Pagaron
              </h3>
              <span className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {cobrados.length} {cobrados.length === 1 ? 'pago' : 'pagos'}
              </span>
            </div>
            <div className="space-y-3">
              {cobrados.map((cobrado, index) => (
                <ClientePagadoCard key={`${cobrado.clienteId}-${index}`} cobrado={cobrado} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Estado para el barrio seleccionado en el modal
  const [barrioSeleccionado, setBarrioSeleccionado] = useState(null);
  
  // Estado para rastrear clientes visitados
  const [clientesVisitados, setClientesVisitados] = useState({});
  
  // Estado para controlar el modal de posposición de cuota
  const [modalPosponer, setModalPosponer] = useState({
    isOpen: false,
    cliente: null,
    credito: null,
    fechaSeleccionada: null,
    proximasFechas: []
  });
  
  // Función para alternar el estado de visita de un cliente
  const toggleClienteVisitado = (clienteId) => {
    setClientesVisitados(prev => ({
      ...prev,
      [clienteId]: !prev[clienteId]
    }));
  };

  // Función para abrir el modal de posposición
  const abrirModalPosponer = (cliente, credito) => {
    const fechaActual = new Date();
    
    // Asegurarse de que la fecha de vencimiento sea un objeto Date
    const fechaVencimiento = credito.fechaVencimiento 
      ? new Date(credito.fechaVencimiento) 
      : new Date();
    
    // Si la fecha de vencimiento es pasada, usar la fecha actual
    const fechaBase = fechaVencimiento < fechaActual ? fechaActual : fechaVencimiento;
    
    // Calcular las próximas 5 fechas (hoy + 1 a 5 días)
    const proximasFechas = Array.from({ length: 5 }, (_, i) => {
      const fecha = new Date(fechaBase);
      fecha.setDate(fechaBase.getDate() + i + 1);
      return fecha.toISOString().split('T')[0];
    });
    
    setModalPosponer({
      isOpen: true,
      cliente: cliente,
      credito: credito,
      fechaSeleccionada: proximasFechas[0],
      proximasFechas: proximasFechas
    });
  };

  // Función para cerrar el modal de posposición
  const cerrarModalPosponer = () => {
    setModalPosponer({
      isOpen: false,
      cliente: null,
      credito: null,
      fechaSeleccionada: null,
      proximasFechas: []
    });
  };

  // Función para manejar el cambio en los días de posposición
  const handleCambioDias = (e) => {
    const dias = parseInt(e.target.value, 10);
    if (dias >= 1 && dias <= 5 && modalPosponer.credito) {
      const fechaActual = new Date();
      
      // Obtener la fecha de vencimiento del crédito
      const fechaVencimiento = modalPosponer.credito.fechaVencimiento 
        ? new Date(modalPosponer.credito.fechaVencimiento) 
        : new Date();
      
      // Si la fecha de vencimiento es pasada, usar la fecha actual
      const fechaBase = fechaVencimiento < fechaActual ? fechaActual : fechaVencimiento;
      
      // Calcular la nueva fecha sumando los días desde la fecha base
      const fechaPosposicion = new Date(fechaBase);
      fechaPosposicion.setDate(fechaBase.getDate() + dias);
      
      setModalPosponer(prev => ({
        ...prev,
        diasPosposicion: dias,
        fechaPosposicion: fechaPosposicion.toISOString().split('T')[0]
      }));
    }
  };

  // Función para manejar la selección de fecha
  const seleccionarFecha = (fecha) => {
    setModalPosponer(prev => ({
      ...prev,
      fechaSeleccionada: fecha
    }));
  };

  // Función para confirmar la posposición
  const confirmarPosposicion = () => {
    if (!modalPosponer.cliente || !modalPosponer.credito || !modalPosponer.fechaSeleccionada) {
      toast.error('Por favor selecciona una fecha para la prórroga');
      return;
    }

    const nuevaFechaVencimiento = modalPosponer.fechaSeleccionada;
    const clienteId = modalPosponer.cliente.clienteId;
    const creditoId = modalPosponer.credito.creditoId;
    
    // Calcular la diferencia de días para mostrar en el mensaje
    const fechaVencimiento = modalPosponer.credito.fechaVencimiento 
      ? new Date(modalPosponer.credito.fechaVencimiento)
      : new Date();
    const fechaNueva = new Date(nuevaFechaVencimiento);
    const diasPosposicion = Math.ceil((fechaNueva - fechaVencimiento) / (1000 * 60 * 60 * 24));

    // Actualizar el estado de clientes con el crédito pospuesto
    setClientes(prevClientes => 
      prevClientes.map(cliente => {
        if (cliente.id === clienteId) {
          return {
            ...cliente,
            creditos: cliente.creditos.map(credito => {
              if (credito.creditoId === creditoId) {
                // Actualizar la cuota específica que se está posponiendo
                const cuotasActualizadas = credito.cuotas.map((cuota, index) => {
                  if (index === modalPosponer.credito.nroCuota - 1) {
                    return {
                      ...cuota,
                      fechaVencimiento: nuevaFechaVencimiento,
                      pospuesto: true,
                      fechaPosposicion: nuevaFechaVencimiento,
                      diasPosposicion: diasPosposicion,
                      fechaVencimientoOriginal: cuota.fechaVencimientoOriginal || cuota.fechaVencimiento
                    };
                  }
                  return cuota;
                });

                // Actualizar también la fecha de vencimiento del crédito
                return {
                  ...credito,
                  fechaVencimiento: nuevaFechaVencimiento,
                  pospuesto: true,
                  fechaPosposicion: nuevaFechaVencimiento,
                  diasPosposicion: diasPosposicion,
                  fechaVencimientoOriginal: credito.fechaVencimientoOriginal || credito.fechaVencimiento,
                  cuotas: cuotasActualizadas
                };
              }
              return credito;
            })
          };
        }
        return cliente;
      })
    );

    // Actualizar también el estado del barrio seleccionado si existe
    if (barrioSeleccionado) {
      setBarrioSeleccionado(prevBarrio => {
        if (!prevBarrio) return null;
        
        return {
          ...prevBarrio,
          clientes: prevBarrio.clientes.map(cliente => {
            if (cliente.clienteId === clienteId) {
              return {
                ...cliente,
                creditos: cliente.creditos.map(credito => {
                  if (credito.creditoId === creditoId) {
                    return {
                      ...credito,
                      fechaVencimiento: nuevaFechaVencimiento,
                      pospuesto: true,
                      fechaPosposicion: nuevaFechaVencimiento,
                      diasPosposicion: diasPosposicion,
                      fechaVencimientoOriginal: credito.fechaVencimientoOriginal || credito.fechaVencimiento
                    };
                  }
                  return credito;
                })
              };
            }
            return cliente;
          })
        };
      });
    }

    // Mostrar notificación de éxito
    toast.success(`Se ha pospuesto el pago correctamente por ${diasPosposicion} días`);
    
    // Cerrar el modal de posposición
    cerrarModalPosponer();
    
    // Cerrar el modal de clientes del barrio
    if (setModalClientesAbierto) {
      setModalClientesAbierto(false);
    }
    
    // Redirigir a la vista de rutas
    if (setMostrarVistaRutas) {
      setMostrarVistaRutas(true);
    }

    // Mostrar notificación
    toast.success(`Se ha pospuesto el pago para el cliente ${modalPosponer.cliente?.nombre} hasta el ${modalPosponer.fechaPosposicion}`);
    
    // Cerrar el modal de posposición
    cerrarModalPosponer();
    
    // Cerrar el modal de clientes del barrio
    if (setModalClientesAbierto) {
      setModalClientesAbierto(false);
    }
    
    // Mostrar la vista de rutas del día de cobro
    setMostrarVistaRutas(true);
  };

  // Función para abrir el modal con los clientes de un barrio
  const abrirModalClientes = (barrio) => {
    setBarrioSeleccionado(barrio);
  };

  // Función para cerrar el modal
  const cerrarModalClientes = () => {
    setBarrioSeleccionado(null);
  };

  // Función para renderizar la vista de rutas
  const renderVistaRutas = () => (
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
      
      {/* Botón para volver a la vista normal */}
      <div className="flex justify-center">
        <button
          onClick={() => setMostrarVistaRutas(false)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full font-medium transition-colors"
        >
          <List className="h-5 w-5" />
          <span>Volver a la vista normal</span>
        </button>
      </div>
    </div>
  );

  // Renderizar la vista normal o la vista de rutas según el estado
  if (mostrarVistaRutas) {
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
        </div>
        
        {renderVistaRutas()}
        
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
                    <p className="text-sm text-gray-500 mb-2">Selecciona una fecha de prórroga:</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {modalPosponer.proximasFechas.map((fecha, index) => {
                        const fechaObj = new Date(fecha);
                        const diaSemana = fechaObj.toLocaleDateString('es-ES', { weekday: 'short' });
                        const diaMes = fechaObj.getDate();
                        const mes = fechaObj.toLocaleDateString('es-ES', { month: 'short' });
                        const isSelected = modalPosponer.fechaSeleccionada === fecha;
                        
                        return (
                          <button
                            key={fecha}
                            type="button"
                            onClick={() => seleccionarFecha(fecha)}
                            className={`p-3 border rounded-lg text-center transition-colors ${
                              isSelected 
                                ? 'bg-blue-100 border-blue-500 text-blue-700' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-sm font-medium">{diaSemana}</div>
                            <div className="text-2xl font-bold">{diaMes}</div>
                            <div className="text-xs text-gray-500">{mes}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
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
  }

  // Vista normal
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Día de Cobro</h1>
            </div>
            
            {/* Selector de Fecha */}
            <div className="flex flex-wrap items-center gap-3">
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
                onClick={irMañana}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium">Mañana</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Calendar className="h-4 w-4" />
                <input
                  type="date"
                  value={format(fechaSeleccionada, 'yyyy-MM-dd')}
                  onChange={cambiarFecha}
                  className="bg-transparent border-none text-white text-sm font-medium focus:outline-none cursor-pointer"
                />
              </div>
            </div>
            
            <p className="text-slate-200 text-lg mt-3">
              {format(fechaSeleccionada, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-slate-300" />
            <div className="text-right">
              <p className="text-sm text-slate-300">Clientes a cobrar</p>
              <p className="text-3xl font-bold">{totalClientesUnicos}</p>
            </div>
          </div>
        </div>
        
        {/* Totales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-slate-300 mb-1">📊 Total Esperado</p>
            <p className="text-3xl font-bold">{formatearMoneda(totalPendienteGeneral + totalCobradoGeneral + totalAbonadoGeneral)}</p>
            <p className="text-sm text-slate-300 mt-1">
              Para el día de {esHoy ? 'hoy' : 'cobro'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-slate-300 mb-1">✅ Total Recogido</p>
            <p className="text-3xl font-bold text-green-300">{formatearMoneda(totalCobradoGeneral + totalAbonadoGeneral)}</p>
            <p className="text-sm text-slate-300 mt-1">
              {cobrosDelDia.cobradosK1.length + cobrosDelDia.cobradosK2.length} cuotas + {cobrosDelDia.abonadosK1.length + cobrosDelDia.abonadosK2.length} abonos
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-slate-300 mb-1">⏳ Faltante por Cobrar</p>
            <p className="text-3xl font-bold text-orange-300">{formatearMoneda(totalPendienteGeneral)}</p>
            <p className="text-sm text-slate-300 mt-1">
              {cobrosDelDia.cobrosK1.length + cobrosDelDia.cobrosK2.length} cuotas pendientes
            </p>
          </div>
        </div>

        {/* Botón para alternar vista de rutas */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setMostrarVistaRutas(!mostrarVistaRutas)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
              mostrarVistaRutas 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
            }`}
          >
            {mostrarVistaRutas ? (
              <><List className="h-5 w-5" /><span>Ver Vista Normal</span></>
            ) : (
              <><Map className="h-5 w-5" /><span>Ver Rutas de Cobro</span></>
            )}
          </button>
        </div>
      </div>

      {/* Resumen por Cartera */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cartera K1 */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Cartera K1</p>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <p className="text-xl font-bold text-blue-900">{clientesUnicosK1} clientes</p>
              </div>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-2 border-t border-blue-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">📊 Total esperado:</span>
              <span className="text-lg font-bold text-blue-900">{formatearMoneda(totalPendienteK1 + totalCobradoK1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">✅ Total recogido:</span>
              <span className="text-lg font-bold text-green-700">{formatearMoneda(totalCobradoK1 + totalAbonadoK1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">⏳ Faltante por cobrar:</span>
              <span className="text-lg font-bold text-orange-600">{formatearMoneda(totalPendienteK1)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-blue-600 pt-2 border-t border-blue-200">
              <span>{cobrosDelDia.cobrosK1.length} cuotas pendientes</span>
              <span>{cobrosDelDia.cobradosK1.length} cuotas cobradas</span>
            </div>
          </div>
        </div>

        {/* Cartera K2 */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Cartera K2</p>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <p className="text-xl font-bold text-green-900">{clientesUnicosK2} clientes</p>
              </div>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="space-y-2 border-t border-green-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">📊 Total esperado:</span>
              <span className="text-lg font-bold text-green-900">{formatearMoneda(totalPendienteK2 + totalCobradoK2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">✅ Total recogido:</span>
              <span className="text-lg font-bold text-green-700">{formatearMoneda(totalCobradoK2 + totalAbonadoK2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">⏳ Faltante por cobrar:</span>
              <span className="text-lg font-bold text-orange-600">{formatearMoneda(totalPendienteK2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-green-600 pt-2 border-t border-green-200">
              <span>{cobrosDelDia.cobrosK2.length} cuotas pendientes</span>
              <span>{cobrosDelDia.cobradosK2.length} cuotas cobradas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Carteras */}
      <div className="space-y-6">
        <CarteraSection
          titulo="Cartera K1"
          cobros={cobrosDelDia.cobrosK1}
          cobrados={cobrosDelDia.cobradosK1}
          abonados={cobrosDelDia.abonadosK1}
          total={totalPendienteK1}
          color="bg-gradient-to-r from-blue-600 to-blue-700"
        />

        <CarteraSection
          titulo="Cartera K2"
          cobros={cobrosDelDia.cobrosK2}
          cobrados={cobrosDelDia.cobradosK2}
          abonados={cobrosDelDia.abonadosK2}
          total={totalPendienteK2}
          color="bg-gradient-to-r from-green-600 to-green-700"
        />
      </div>
    </div>
  );
};

// Componente para mostrar la tarjeta de un barrio en la vista de rutas
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
                  onToggleVisitado && onToggleVisitado[cliente.clienteId] 
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
                          {!credito.pospuesto && onPosponerPago && (
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

export default DiaDeCobro;
