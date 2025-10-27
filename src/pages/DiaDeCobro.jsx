import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, DollarSign, Users, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, startOfDay, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearMoneda, calcularTotalMultasCuota, aplicarAbonosAutomaticamente } from '../utils/creditCalculations';

const DiaDeCobro = () => {
  const { clientes } = useApp();
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
          <div className="mt-8 pt-6 border-t-2 border-gray-200">
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
          <div className="mt-8 pt-6 border-t-2 border-gray-200">
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

export default DiaDeCobro;
