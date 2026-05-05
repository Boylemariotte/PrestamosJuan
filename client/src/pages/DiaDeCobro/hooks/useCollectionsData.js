import { useMemo } from 'react';
import { format, addDays, startOfDay, parseISO, isBefore, differenceInCalendarDays } from 'date-fns';
import { calcularTotalMultasCuota, aplicarAbonosAutomaticamente, determinarEstadoCredito } from '../../../utils/creditCalculations';

export const useCollectionsData = ({
    clientes,
    searchTerm,
    fechaSeleccionada,
    fechaSeleccionadaStr,
    creditosInvalidos,
    prorrogasCuotas,
    clientesNoEncontradosPorFecha,
    hoy,
    ciudadSeleccionada,
    carteras,
    filtrosPorCartera,
    filtroPagosPorCartera,
    ordenCobro
}) => {
    // Carteras activas de la ciudad seleccionada
    const carterasDeCiudad = useMemo(() => {
        if (!carteras || !ciudadSeleccionada) return [];
        return carteras
            .filter(c => c.activa !== false && c.ciudad === ciudadSeleccionada)
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }, [carteras, ciudadSeleccionada]);

    const nombresCarterasCiudad = useMemo(() => carterasDeCiudad.map(c => c.nombre), [carterasDeCiudad]);

    // Filtrar clientes por búsqueda y excluir renovaciones activadas (RF)
    const clientesFiltrados = useMemo(() => {
        // Si no hay ciudad seleccionada, no mostrar clientes
        if (!ciudadSeleccionada) return [];
        
        return clientes.filter(cliente => {
            // Filtrar por ciudad usando las carteras disponibles
            const carteraCliente = carteras.find(c => c.nombre === (cliente.cartera || 'K1'));
            const coincideCiudad = carteraCliente && carteraCliente.ciudad === ciudadSeleccionada;
            
            return coincideCiudad &&
                   cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                   !cliente.tieneBotonRenovacion;
        });
    }, [clientes, searchTerm, ciudadSeleccionada, carteras]);

    // Procesar cobros agrupados por BARRIO
    const datosCobro = useMemo(() => {
        const porBarrio = {};
        const stats = {
            esperado: 0,
            recogido: 0,
            pendiente: 0,
            clientesTotal: 0
        };

        const clientesUnicosHoy = new Set();

        clientesFiltrados.forEach(cliente => {
            if (!cliente.creditos || cliente.creditos.length === 0) return;

            cliente.creditos.forEach(credito => {
                if (!credito || !credito.id) return;
                if (!credito.cuotas || !Array.isArray(credito.cuotas) || credito.cuotas.length === 0) return;
                if (!credito.monto || !credito.valorCuota || !credito.tipo) return;
                if (credito.renovado) return;
                if (typeof credito.id !== 'string' || credito.id.trim() === '') return;

                const creditoKey = `${cliente.id}-${credito.id}`;
                if (creditosInvalidos.has(creditoKey)) return;

                const { cuotasActualizadas } = aplicarAbonosAutomaticamente(credito);
                const estadoCredito = determinarEstadoCredito(credito.cuotas, credito);

                let tieneActividadHoy = false;
                let totalACobrarHoy = 0;
                let totalCobradoHoy = 0;
                let totalAbonadoHoy = 0;

                // Para clientes finalizados, verificar si pagaron hoy
                if (estadoCredito === 'finalizado') {
                    const cuotasPagadasHoy = credito.cuotas.filter(cuota => {
                        if (!cuota.pagada || !cuota.fechaPago) return false;
                        
                        const fechaPago = typeof cuota.fechaPago === 'string'
                            ? cuota.fechaPago.split('T')[0]
                            : format(cuota.fechaPago, 'yyyy-MM-dd');
                        
                        return fechaPago === fechaSeleccionadaStr;
                    });

                    // Depuración: clientes finalizados
                    if (cuotasPagadasHoy.length > 0) {
                        console.log(`=== CLIENTE FINALIZADO DETECTADO ===`);
                        console.log(`Cliente: ${cliente.nombre}`);
                        console.log(`Crédito ID: ${credito.id}`);
                        console.log(`Cuotas pagadas hoy: ${cuotasPagadasHoy.length}`);
                        console.log(`Total cobrado hoy: ${cuotasPagadasHoy.length * credito.valorCuota}`);
                        console.log('=====================================');
                        
                        tieneActividadHoy = true;
                        totalCobradoHoy = cuotasPagadasHoy.length * credito.valorCuota;
                    }
                }

                const cuotasPendientesHoy = cuotasActualizadas.filter((cuota, index) => {
                    const cuotaOriginal = credito.cuotas[index];
                    if (cuotaOriginal.pagado) return false;

                    const keyCuota = `${cliente.id}-${credito.id}-${cuota.nroCuota}`;
                    const fechaProrroga = prorrogasCuotas[keyCuota];
                    let fechaReferencia = fechaProrroga || cuotaOriginal.fechaProgramada;

                    if (typeof fechaReferencia === 'string') {
                        if (fechaReferencia.includes('T')) {
                            fechaReferencia = fechaReferencia.split('T')[0];
                        } else if (!fechaReferencia.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const fechaObj = parseISO(fechaReferencia);
                            if (!isNaN(fechaObj.getTime())) fechaReferencia = format(fechaObj, 'yyyy-MM-dd');
                        }
                    } else if (fechaReferencia instanceof Date) {
                        fechaReferencia = format(fechaReferencia, 'yyyy-MM-dd');
                    }

                    const abonoAplicado = cuota.abonoAplicado || 0;
                    const valorCuotaPendiente = credito.valorCuota - abonoAplicado;
                    const totalMultas = calcularTotalMultasCuota(cuota);
                    const multasPendientes = totalMultas - (cuota.multasCubiertas || 0);
                    const tieneSaldo = valorCuotaPendiente > 0 || multasPendientes > 0;

                    const esDiaProgramado = fechaReferencia === fechaSeleccionadaStr;
                    const fechaReferenciaObj = parseISO(fechaReferencia);
                    const esVencidaOActual = isBefore(fechaReferenciaObj, hoy) || format(fechaReferenciaObj, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd');

                    const diffRespectoHoy = differenceInCalendarDays(parseISO(fechaSeleccionadaStr), hoy);
                    const viendoHoyOMañana = diffRespectoHoy === 0 || diffRespectoHoy === 1;

                    if (esDiaProgramado || (esVencidaOActual && viendoHoyOMañana)) {
                        return tieneSaldo;
                    }
                    return false;
                });

                if (cuotasPendientesHoy.length > 0) {
                    tieneActividadHoy = true;
                    cuotasPendientesHoy.forEach(c => {
                        const abono = c.abonoAplicado || 0;
                        const multas = calcularTotalMultasCuota(c) - (c.multasCubiertas || 0);
                        totalACobrarHoy += (credito.valorCuota - abono) + multas;
                    });
                }

                const cuotasCobradasHoy = credito.cuotas.filter(cuota => {
                    return cuota.pagado && cuota.fechaPago === fechaSeleccionadaStr && !cuota.tieneAbono;
                });
                if (cuotasCobradasHoy.length > 0) {
                    tieneActividadHoy = true;
                    totalCobradoHoy += (cuotasCobradasHoy.length * credito.valorCuota);
                }

                const cuotasAbonadasHoy = credito.cuotas.filter(cuota =>
                    cuota.abonosCuota && cuota.abonosCuota.some(a => a.fecha === fechaSeleccionadaStr)
                );
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

                // Si el cliente ya pagó completamente hoy, no mostrar en día de cobro
                if (totalACobrarHoy === 0 && (totalCobradoHoy > 0 || totalAbonadoHoy > 0)) {
                    console.log(`=== CLIENTE PAGO/ABONO COMPLETO HOY - NO MOSTRAR EN DÍA DE COBRO ===`);
                    console.log(`Cliente: ${cliente.nombre}`);
                    console.log(`Total cobrado hoy: ${totalCobradoHoy}`);
                    console.log(`Total abonado hoy: ${totalAbonadoHoy}`);
                    console.log(`Total a cobrar hoy: ${totalACobrarHoy}`);
                    console.log('================================================');
                    return; // No mostrar en día de cobro, solo en pagos registrados
                }

                if (!tieneActividadHoy || (totalACobrarHoy === 0 && totalCobradoHoy === 0 && totalAbonadoHoy === 0)) return;

                let tipoItem = 'cobrado';
                if (totalACobrarHoy > 0) tipoItem = 'pendiente';
                else if (totalAbonadoHoy > 0 && totalACobrarHoy === 0) tipoItem = 'abonado';

                let valorMostrar = tipoItem === 'pendiente' ? credito.valorCuota : (tipoItem === 'cobrado' ? totalCobradoHoy : totalAbonadoHoy);

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
                    clienteCartera: cliente.cartera || 'K1',
                    clientePosicion: cliente.posicion,
                    creditoId: credito.id,
                    creditoMonto: credito.monto,
                    creditoTipo: credito.tipo,
                    valorMostrar,
                    valorRealACobrar: totalACobrarHoy,
                    saldoTotalCredito,
                    estadoCredito,
                    cuotasVencidasCount,
                    primerCuotaVencidaFecha,
                    clienteRF: cliente.rf,
                    nroCuotasPendientes: cuotasPendientesHoy.map(c => c.nroCuota),
                    reportado: cliente.reportado !== false,
                    tieneAbonoParcialHoy: totalAbonadoHoy > 0 && totalACobrarHoy > 0
                };

                const barrio = cliente.barrio || 'Sin Barrio';
                if (!porBarrio[barrio]) porBarrio[barrio] = [];
                porBarrio[barrio].push(item);

                if (cliente.reportado !== false) {
                    clientesUnicosHoy.add(cliente.id);
                }

                stats.esperado += totalACobrarHoy + totalCobradoHoy + totalAbonadoHoy;
                stats.pendiente += totalACobrarHoy;
                stats.recogido += (totalCobradoHoy + totalAbonadoHoy);
            });
        });

        const clientesNoEncontradosHoy = clientesNoEncontradosPorFecha[fechaSeleccionadaStr] || new Set();
        clientesNoEncontradosHoy.forEach(id => clientesUnicosHoy.add(id));
        stats.clientesTotal = clientesUnicosHoy.size;

        const barriosOrdenados = Object.keys(porBarrio).sort().reduce((obj, key) => {
            obj[key] = porBarrio[key];
            return obj;
        }, {});

        return { porBarrio: barriosOrdenados, stats };
    }, [clientesFiltrados, fechaSeleccionadaStr, creditosInvalidos, prorrogasCuotas, clientesNoEncontradosPorFecha, hoy]);

    // Construir listas de cobros del día separadas por cartera — DINÁMICO
    const cobrosPorCartera = useMemo(() => {
        const items = [];
        Object.values(datosCobro.porBarrio).forEach(arr => items.push(...arr));

        const ordenFecha = ordenCobro[fechaSeleccionadaStr] || {};
        const mañanaStr = format(addDays(fechaSeleccionada, 1), 'yyyy-MM-dd');
        const clientesProgramadosParaMañana = clientesNoEncontradosPorFecha[mañanaStr] || new Set();

        const itemsReportados = items.filter(item => item.reportado !== false);
        const itemsNoReportados = items.filter(item =>
            item.reportado === false && !clientesProgramadosParaMañana.has(item.clienteId)
        );

        const clientesNoEncontradosHoy = clientesNoEncontradosPorFecha[fechaSeleccionadaStr] || new Set();
        const idsYaEnLista = new Set(items.map(i => i.clienteId));

        const clientesNoEncontradosItems = clientesFiltrados
            .filter(cliente => clientesNoEncontradosHoy.has(cliente.id) && !idsYaEnLista.has(cliente.id))
            .map(cliente => {
                const creditoActivo = cliente.creditos?.find(cred => !cred.renovado && cred.cuotas?.some(c => !c.pagado));
                if (!creditoActivo) return null;

                const { cuotasActualizadas } = aplicarAbonosAutomaticamente(creditoActivo);
                const estadoCredito = determinarEstadoCredito(creditoActivo.cuotas, creditoActivo);
                const saldoTotalCredito = cuotasActualizadas.reduce((sum, c) => {
                    if (c.pagado) return sum;
                    const abono = c.abonoAplicado || 0;
                    const multas = calcularTotalMultasCuota(c) - (c.multasCubiertas || 0);
                    return sum + (creditoActivo.valorCuota - abono) + multas;
                }, 0);

                return {
                    tipo: 'no_encontrado',
                    clienteId: cliente.id,
                    clienteNombre: cliente.nombre,
                    clienteDocumento: cliente.documento,
                    clienteTelefono: cliente.telefono,
                    clienteDireccion: cliente.direccion,
                    clienteBarrio: cliente.barrio,
                    clienteCartera: cliente.cartera || 'K1',
                    clientePosicion: cliente.posicion,
                    creditoId: creditoActivo.id,
                    creditoMonto: creditoActivo.monto,
                    creditoTipo: creditoActivo.tipo,
                    valorMostrar: 0,
                    valorRealACobrar: 0,
                    saldoTotalCredito,
                    estadoCredito,
                    cuotasVencidasCount: 0,
                    primerCuotaVencidaFecha: null,
                    clienteRF: cliente.rf,
                    nroCuotasPendientes: [],
                    reportado: false
                };
            })
            .filter(Boolean);

        const todosItemsNoReportados = [...itemsNoReportados, ...clientesNoEncontradosItems];

        const ordenarItems = (itemsList) => [...itemsList].sort((a, b) => {
            const rawA = ordenFecha[a.clienteId];
            const rawB = ordenFecha[b.clienteId];
            const ordenA = rawA === '' || rawA == null ? Number.MAX_SAFE_INTEGER : Number(rawA);
            const ordenB = rawB === '' || rawB == null ? Number.MAX_SAFE_INTEGER : Number(rawB);
            if (ordenA !== ordenB) return ordenA - ordenB;
            return (a.clienteNombre || '').localeCompare(b.clienteNombre || '');
        });

        const filtrarPorBusqueda = (itemsList) => {
            if (!searchTerm.trim()) return itemsList;
            const t = searchTerm.toLowerCase().trim();
            const filtrados = itemsList.filter(item => {
                const ref = item.clientePosicion ? `#${item.clientePosicion}` : '';
                return ref.toLowerCase().includes(t) ||
                    item.clienteNombre?.toLowerCase().includes(t) ||
                    item.clienteDocumento?.includes(t) ||
                    item.clienteTelefono?.includes(t) ||
                    item.clienteBarrio?.toLowerCase().includes(t);
            });
            
            // Depuración: mostrar qué items son filtrados
            const noFiltrados = itemsList.filter(item => {
                const ref = item.clientePosicion ? `#${item.clientePosicion}` : '';
                return !(ref.toLowerCase().includes(t) ||
                    item.clienteNombre?.toLowerCase().includes(t) ||
                    item.clienteDocumento?.includes(t) ||
                    item.clienteTelefono?.includes(t) ||
                    item.clienteBarrio?.toLowerCase().includes(t));
            });
            
            if (noFiltrados.length > 0) {
                console.log('=== ITEMS FILTRADOS POR BÚSQUEDA ===');
                console.log('Término de búsqueda:', t);
                console.log('Items que NO pasan el filtro:', noFiltrados.map(i => i.clienteNombre));
                console.log('=====================================');
            }
            
            return filtrados;
        };

        // Construir dinámicamente con las carteras de la ciudad
        const resultado = {};
        nombresCarterasCiudad.forEach(nombre => {
            const filtro = filtrosPorCartera[nombre] || 'todos';
            
            // Depuración: mostrar filtrado por tipo de pago
            const itemsPorCartera = itemsReportados.filter(i => i.clienteCartera === nombre);
            const itemsDespuesDeFiltroTipo = itemsPorCartera.filter(i => filtro === 'todos' || i.creditoTipo === filtro);
            
            if (nombre === 'K1' && itemsDespuesDeFiltroTipo.length !== itemsPorCartera.length) {
                console.log('=== FILTRADO POR TIPO DE PAGO K1 ===');
                console.log('Filtro aplicado:', filtro);
                console.log('Items antes del filtro:', itemsPorCartera.map(i => ({nombre: i.clienteNombre, tipo: i.creditoTipo})));
                console.log('Items después del filtro:', itemsDespuesDeFiltroTipo.map(i => ({nombre: i.clienteNombre, tipo: i.creditoTipo})));
                console.log('=====================================');
            }
            
            resultado[nombre] = filtrarPorBusqueda(
                ordenarItems(itemsDespuesDeFiltroTipo)
            );
        });

        // No reportados filtrados por carteras de la ciudad
        resultado.NoReportados = filtrarPorBusqueda(
            todosItemsNoReportados.filter(i => nombresCarterasCiudad.includes(i.clienteCartera))
        );

        return resultado;
    }, [datosCobro, ordenCobro, fechaSeleccionadaStr, searchTerm, clientesNoEncontradosPorFecha, fechaSeleccionada, filtrosPorCartera, clientesFiltrados, nombresCarterasCiudad]);

    const totalClientesDirecto = useMemo(() => {
        let total = 0;
        nombresCarterasCiudad.forEach(nombre => {
            const items = cobrosPorCartera[nombre] || [];
            // Solo contar items que tienen valorRealACobrar > 0 (clientes activos para cobrar hoy)
            const itemsActivos = items.filter(item => item.valorRealACobrar > 0);
            total += itemsActivos.length;
            
            // Depuración: verificar clienteRF de Guillermo Rodriguez y Norberto Serna
            itemsActivos.forEach(item => {
                if (item.clienteNombre === 'Guillermo Rodriguez' || item.clienteNombre === 'Norberto Serna') {
                    console.log(`=== VERIFICACIÓN ${item.clienteNombre} ===`);
                    console.log('clienteRF:', item.clienteRF);
                    console.log('valorRealACobrar:', item.valorRealACobrar);
                    console.log('=====================================');
                }
            });
        });
        
        localStorage.setItem('totalClientesHoy', total.toString());
        return total;
    }, [cobrosPorCartera, nombresCarterasCiudad]);

    // Obtener clientes que pagaron ese día — DINÁMICO
    const clientesPagados = useMemo(() => {
        const itemsMap = new Map();
        clientes.forEach(cliente => {
            if (!cliente.creditos || !cliente.id) return;
            cliente.creditos.forEach(credito => {
                if (!credito || credito.renovado || !credito.cuotas) return;

                // Para clientes finalizados, verificar si pagaron hoy
                const estadoCredito = determinarEstadoCredito(credito.cuotas, credito);
                if (estadoCredito === 'finalizado') {
                    const cuotasPagadasHoy = credito.cuotas.filter(cuota => {
                        if (!cuota.pagada || !cuota.fechaPago) return false;
                        
                        const fechaPago = typeof cuota.fechaPago === 'string'
                            ? cuota.fechaPago.split('T')[0]
                            : format(cuota.fechaPago, 'yyyy-MM-dd');
                        
                        return fechaPago === fechaSeleccionadaStr;
                    });

                    // Agregar pagos de clientes finalizados
                    cuotasPagadasHoy.forEach(cuota => {
                        const key = `${cliente.id}-${credito.id}-${cuota.nroCuota}`;
                        
                        // Depuración: pagos de clientes finalizados
                        console.log(`=== PAGO DE CLIENTE FINALIZADO ===`);
                        console.log(`Cliente: ${cliente.nombre} (Finalizado)`);
                        console.log(`Crédito ID: ${credito.id}`);
                        console.log(`Cuota: ${cuota.nroCuota}`);
                        console.log(`Monto: ${credito.valorCuota}`);
                        console.log('=====================================');
                        
                        itemsMap.set(key, {
                            clienteId: cliente.id, clienteNombre: cliente.nombre, clienteDocumento: cliente.documento,
                            clienteTelefono: cliente.telefono, clienteBarrio: cliente.barrio, clienteCartera: cliente.cartera || 'K1',
                            clientePosicion: cliente.posicion, creditoId: credito.id, creditoMonto: credito.monto,
                            creditoTipo: credito.tipo, valorCuota: credito.valorCuota, nroCuota: cuota.nroCuota,
                            montoPagado: credito.valorCuota, tipoPago: 'completo',
                            montoPagadoMulta: 0, tieneMulta: false
                        });
                    });
                }

                credito.cuotas.forEach(cuota => {
                    let fPagoNorm = cuota.fechaPago ? (typeof cuota.fechaPago === 'string' ? cuota.fechaPago.split('T')[0] : format(new Date(cuota.fechaPago), 'yyyy-MM-dd')) : null;

                    const abonosHoy = (cuota.abonosCuota || []).filter(a => (typeof a.fecha === 'string' ? a.fecha.split('T')[0] : format(new Date(a.fecha), 'yyyy-MM-dd')) === fechaSeleccionadaStr);
                    const mAbonadoHoy = abonosHoy.reduce((s, a) => s + (a.valor || 0), 0);

                    if (mAbonadoHoy > 0 || (cuota.pagado && fPagoNorm === fechaSeleccionadaStr)) {
                        const mAnt = (cuota.abonosCuota || []).filter(a => (typeof a.fecha === 'string' ? a.fecha.split('T')[0] : format(new Date(a.fecha), 'yyyy-MM-dd')) < fechaSeleccionadaStr).reduce((s, a) => s + (a.valor || 0), 0);
                        const saldoAnt = credito.valorCuota - mAnt;
                        const montoP = mAbonadoHoy || credito.valorCuota;
                        const key = `${cliente.id}-${credito.id}-${cuota.nroCuota}`;
                        itemsMap.set(key, {
                            clienteId: cliente.id, clienteNombre: cliente.nombre, clienteDocumento: cliente.documento,
                            clienteTelefono: cliente.telefono, clienteBarrio: cliente.barrio, clienteCartera: cliente.cartera || 'K1',
                            clientePosicion: cliente.posicion, creditoId: credito.id, creditoMonto: credito.monto,
                            creditoTipo: credito.tipo, valorCuota: credito.valorCuota, nroCuota: cuota.nroCuota,
                            montoPagado: montoP, tipoPago: (saldoAnt - montoP) <= 0 ? 'completo' : 'parcial',
                            montoPagadoMulta: 0, tieneMulta: false
                        });
                    }
                });

                if (credito.abonosMulta) {
                    credito.abonosMulta.filter(am => (am.fecha ? (typeof am.fecha === 'string' ? am.fecha.split('T')[0] : format(new Date(am.fecha), 'yyyy-MM-dd')) : null) === fechaSeleccionadaStr).forEach(am => {
                        const key = Array.from(itemsMap.keys()).find(k => k.startsWith(`${cliente.id}-${credito.id}-`)) || `${cliente.id}-${credito.id}-multa-${am.multaId}`;
                        if (itemsMap.has(key)) {
                            const item = itemsMap.get(key);
                            item.montoPagadoMulta += (am.valor || 0);
                            item.tieneMulta = true;
                        } else {
                            const multa = credito.multas?.find(m => String(m.id) === String(am.multaId));
                            itemsMap.set(key, {
                                clienteId: cliente.id, clienteNombre: cliente.nombre, clienteDocumento: cliente.documento,
                                clienteTelefono: cliente.telefono, clienteBarrio: cliente.barrio, clienteCartera: cliente.cartera || 'K1',
                                clientePosicion: cliente.posicion, creditoId: credito.id, creditoMonto: credito.monto,
                                creditoTipo: credito.tipo, valorCuota: credito.valorCuota, nroCuota: null,
                                montoPagado: 0, tipoPago: null, montoPagadoMulta: am.valor || 0, tieneMulta: true,
                                multaMotivo: multa?.motivo || am.descripcion || 'Multa'
                            });
                        }
                    });
                }
            });
        });

        // Resultado dinámico por cartera
        const res = {};
        nombresCarterasCiudad.forEach(nombre => {
            res[nombre] = { items: [], total: 0 };
        });

        itemsMap.forEach(item => {
            // Solo incluir items de carteras de la ciudad seleccionada
            if (!nombresCarterasCiudad.includes(item.clienteCartera)) return;
            const filtro = filtroPagosPorCartera[item.clienteCartera] || 'todos';
            if (filtro === 'todos' || item.creditoTipo === filtro) {
                if (!res[item.clienteCartera]) res[item.clienteCartera] = { items: [], total: 0 };
                res[item.clienteCartera].items.push(item);
                res[item.clienteCartera].total += item.montoPagado + item.montoPagadoMulta;
            }
        });
        return res;
    }, [clientes, fechaSeleccionadaStr, filtroPagosPorCartera, nombresCarterasCiudad]);

    const multasPagadasDia = useMemo(() => {
        const todas = [];
        nombresCarterasCiudad.forEach(nombre => {
            if (clientesPagados[nombre]) {
                todas.push(...clientesPagados[nombre].items);
            }
        });
        return todas.filter(i => i.montoPagadoMulta > 0).map(i => ({
            clienteNombre: i.clienteNombre, creditoTipo: i.creditoTipo, cartera: i.clienteCartera,
            clientePosicion: i.clientePosicion, montoPagadoMulta: i.montoPagadoMulta
        }));
    }, [clientesPagados, nombresCarterasCiudad]);

    return { clientesFiltrados, datosCobro, cobrosPorCartera, totalClientesDirecto, clientesPagados, multasPagadasDia, carterasDeCiudad, nombresCarterasCiudad };
};
