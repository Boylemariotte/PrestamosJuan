import { addWeeks, addDays, format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Tasa de interés mensual
export const INTERES_MENSUAL = 0.20; // 20%

// Montos disponibles
export const MONTOS_DISPONIBLES = [200000, 300000, 400000, 500000, 1000000];

// Configuración de cuotas por monto y tipo de pago
export const CONFIGURACION_CUOTAS = {
  200000: {
    diario: { numCuotas: 60, valorCuota: 5000 },
    semanal: { numCuotas: 10, valorCuota: 30000 },
    quincenal: { numCuotas: 5, valorCuota: 60000 },
    mensual: { numCuotas: 3, valorCuota: 100000 }
  },
  300000: {
    diario: { numCuotas: 60, valorCuota: 7500 },
    semanal: { numCuotas: 10, valorCuota: 45000 },
    quincenal: { numCuotas: 5, valorCuota: 90000 },
    mensual: { numCuotas: 3, valorCuota: 150000 }
  },
  400000: {
    diario: { numCuotas: 60, valorCuota: 10000 },
    semanal: { numCuotas: 10, valorCuota: 60000 },
    quincenal: { numCuotas: 5, valorCuota: 120000 },
    mensual: { numCuotas: 3, valorCuota: 200000 }
  },
  500000: {
    diario: { numCuotas: 60, valorCuota: 12500 },
    semanal: { numCuotas: 10, valorCuota: 75000 },
    quincenal: { numCuotas: 5, valorCuota: 150000 },
    mensual: { numCuotas: 3, valorCuota: 250000 }
  },
  1000000: {
    diario: { numCuotas: 60, valorCuota: 25000 },
    semanal: { numCuotas: 10, valorCuota: 150000 },
    quincenal: { numCuotas: 5, valorCuota: 300000 },
    mensual: { numCuotas: 3, valorCuota: 500000 }
  }
};

// Calcular descuento de papelería: $5,000 por cada $100,000
export const calcularPapeleria = (monto) => {
  return Math.round((monto / 100000) * 5000);
};

// Calcular monto real entregado (monto - papelería)
export const calcularMontoEntregado = (monto) => {
  return monto - calcularPapeleria(monto);
};

// Obtener configuración de cuotas según monto y tipo
export const obtenerConfiguracionCuotas = (monto, tipo) => {
  return CONFIGURACION_CUOTAS[monto]?.[tipo] || { numCuotas: 10, valorCuota: 0 };
};

// Calcular el total a pagar (suma de todas las cuotas)
export const calcularTotalAPagar = (monto, tipo) => {
  const config = obtenerConfiguracionCuotas(monto, tipo);
  return config.numCuotas * config.valorCuota;
};

// Calcular valor por cuota
export const calcularValorCuota = (monto, tipo) => {
  const config = obtenerConfiguracionCuotas(monto, tipo);
  return config.valorCuota;
};

// Obtener número de cuotas
export const obtenerNumCuotas = (monto, tipo) => {
  const config = obtenerConfiguracionCuotas(monto, tipo);
  return config.numCuotas;
};

// Generar fechas de pago diarias (60 días consecutivos)
export const generarFechasPagoDiarias = (fechaInicio, numCuotas) => {
  const fechas = [];
  let fecha = parseISO(fechaInicio);
  
  for (let i = 0; i < numCuotas; i++) {
    fechas.push({
      nroCuota: i + 1,
      fechaProgramada: format(fecha, 'yyyy-MM-dd'),
      pagado: false,
      fechaPago: null
    });
    fecha = addDays(fecha, 1);
  }
  
  return fechas;
};

// Generar fechas de pago semanales (cada sábado)
export const generarFechasPagoSemanales = (fechaInicio, numCuotas) => {
  const fechas = [];
  let fecha = parseISO(fechaInicio);
  
  // Ajustar al próximo sábado si no es sábado
  const diaSemana = fecha.getDay();
  if (diaSemana !== 6) { // 6 = sábado
    const diasHastaSabado = (6 - diaSemana + 7) % 7;
    fecha = addDays(fecha, diasHastaSabado === 0 ? 7 : diasHastaSabado);
  }
  
  // Generar sábados consecutivos
  for (let i = 0; i < numCuotas; i++) {
    fechas.push({
      nroCuota: i + 1,
      fechaProgramada: format(fecha, 'yyyy-MM-dd'),
      pagado: false,
      fechaPago: null
    });
    fecha = addWeeks(fecha, 1);
  }
  
  return fechas;
};

// Generar fechas de pago quincenales
export const generarFechasPagoQuincenales = (fechaInicio, numCuotas, tipo = '1-16') => {
  const fechas = [];
  let fecha = parseISO(fechaInicio);
  
  const dias = tipo === '1-16' ? [1, 16] : [5, 20];
  
  for (let i = 0; i < numCuotas; i++) {
    const mes = fecha.getMonth();
    const año = fecha.getFullYear();
    
    // Determinar cuál día usar (1 o 16, o 5 o 20)
    const diaDelMes = fecha.getDate();
    let diaAPagar;
    
    if (diaDelMes <= dias[0]) {
      diaAPagar = dias[0];
    } else if (diaDelMes <= dias[1]) {
      diaAPagar = dias[1];
    } else {
      // Si ya pasó el segundo día, ir al primer día del siguiente mes
      fecha = new Date(año, mes + 1, dias[0]);
      fecha.setHours(12, 0, 0, 0); // Establecer al mediodía para evitar problemas de zona horaria
      fechas.push({
        nroCuota: i + 1,
        fechaProgramada: format(fecha, 'yyyy-MM-dd'),
        pagado: false,
        fechaPago: null
      });
      continue;
    }
    
    fecha = new Date(año, mes, diaAPagar);
    fecha.setHours(12, 0, 0, 0); // Establecer al mediodía para evitar problemas de zona horaria
    fechas.push({
      nroCuota: i + 1,
      fechaProgramada: format(fecha, 'yyyy-MM-dd'),
      pagado: false,
      fechaPago: null
    });
    
    // Avanzar a la siguiente quincena
    if (diaAPagar === dias[0]) {
      fecha = new Date(año, mes, dias[1]);
    } else {
      fecha = new Date(año, mes + 1, dias[0]);
    }
  }
  
  return fechas;
};

// Generar fechas de pago mensuales (3 cuotas)
export const generarFechasPagoMensuales = (fechaInicio, numCuotas) => {
  const fechas = [];
  let fecha = parseISO(fechaInicio);
  
  for (let i = 0; i < numCuotas; i++) {
    fechas.push({
      nroCuota: i + 1,
      fechaProgramada: format(fecha, 'yyyy-MM-dd'),
      pagado: false,
      fechaPago: null
    });
    // Avanzar un mes
    fecha = new Date(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate());
    fecha.setHours(12, 0, 0, 0); // Establecer al mediodía para evitar problemas de zona horaria
  }
  
  return fechas;
};

// Calcular progreso del crédito
export const calcularProgreso = (cuotas) => {
  const totalCuotas = cuotas.length;
  const cuotasPagadas = cuotas.filter(c => c.pagado).length;
  return {
    cuotasPagadas,
    totalCuotas,
    porcentaje: Math.round((cuotasPagadas / totalCuotas) * 100)
  };
};

// Determinar estado del crédito
export const determinarEstadoCredito = (cuotas) => {
  const hoy = startOfDay(new Date());
  const progreso = calcularProgreso(cuotas);
  
  // Si todas las cuotas están pagadas
  if (progreso.cuotasPagadas === progreso.totalCuotas) {
    return 'finalizado';
  }
  
  // Verificar si hay cuotas vencidas
  const tieneCuotasVencidas = cuotas.some(cuota => {
    if (!cuota.pagado) {
      const fechaProgramada = startOfDay(parseISO(cuota.fechaProgramada));
      return isBefore(fechaProgramada, hoy);
    }
    return false;
  });
  
  if (tieneCuotasVencidas) {
    return 'mora';
  }
  
  return 'activo';
};

// Obtener color según estado
export const getColorEstado = (estado) => {
  switch (estado) {
    case 'activo':
      return 'text-green-600 bg-green-100';
    case 'mora':
      return 'text-red-600 bg-red-100';
    case 'finalizado':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Calcular días de mora
export const calcularDiasMora = (fechaProgramada) => {
  const hoy = startOfDay(new Date());
  const fecha = startOfDay(parseISO(fechaProgramada));
  
  if (isBefore(fecha, hoy)) {
    const diffTime = Math.abs(hoy - fecha);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  return 0;
};

// Aplicar abonos automáticamente a multas y cuotas
export const aplicarAbonosAutomaticamente = (credito) => {
  const totalAbonos = (credito.abonos || []).reduce((total, abono) => total + abono.valor, 0);
  let saldoAbono = totalAbonos;
  
  // Copiar las cuotas para modificarlas
  const cuotasActualizadas = credito.cuotas.map(cuota => ({
    ...cuota,
    multas: cuota.multas ? [...cuota.multas] : [],
    abonoAplicado: 0
  }));
  
  // Paso 1: Aplicar abonos a multas primero
  for (let cuota of cuotasActualizadas) {
    if (saldoAbono <= 0) break;
    
    if (cuota.multas && cuota.multas.length > 0) {
      const totalMultasCuota = cuota.multas.reduce((sum, m) => sum + m.valor, 0);
      
      if (saldoAbono >= totalMultasCuota) {
        // El abono cubre todas las multas de esta cuota
        saldoAbono -= totalMultasCuota;
        cuota.multasCubiertas = totalMultasCuota;
      } else {
        // El abono cubre parcialmente las multas
        cuota.multasCubiertas = saldoAbono;
        saldoAbono = 0;
      }
    }
  }
  
  // Paso 2: Aplicar abonos restantes a cuotas pendientes (en orden)
  for (let cuota of cuotasActualizadas) {
    if (saldoAbono <= 0) break;
    if (cuota.pagado) continue; // Saltar cuotas ya pagadas
    
    const valorCuota = credito.valorCuota;
    
    if (saldoAbono >= valorCuota) {
      // El abono cubre toda la cuota
      cuota.pagado = true;
      cuota.abonoAplicado = valorCuota;
      cuota.fechaPago = new Date().toISOString().split('T')[0];
      saldoAbono -= valorCuota;
    } else {
      // El abono cubre parcialmente la cuota
      cuota.abonoAplicado = saldoAbono;
      saldoAbono = 0;
    }
  }
  
  return {
    cuotasActualizadas,
    saldoAbonoRestante: saldoAbono
  };
};

// Formatear moneda colombiana
export const formatearMoneda = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};

// Formatear fecha
export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return format(parseISO(fecha), "d 'de' MMMM, yyyy", { locale: es });
};

// Formatear fecha corta
export const formatearFechaCorta = (fecha) => {
  if (!fecha) return '-';
  return format(parseISO(fecha), 'dd/MM/yyyy');
};

// Calcular total de multas de una cuota
export const calcularTotalMultasCuota = (cuota) => {
  if (!cuota.multas || cuota.multas.length === 0) return 0;
  return cuota.multas.reduce((total, multa) => total + multa.valor, 0);
};

// Calcular total de multas de un crédito
export const calcularTotalMultasCredito = (cuotas) => {
  return cuotas.reduce((total, cuota) => {
    return total + calcularTotalMultasCuota(cuota);
  }, 0);
};

// Calcular valor total a pagar de una cuota (incluyendo multas)
export const calcularValorTotalCuota = (valorCuota, cuota) => {
  return valorCuota + calcularTotalMultasCuota(cuota);
};

// Calcular valor PENDIENTE de una cuota (valor cuota - abonos + multas pendientes)
// Esta es la función que se usa para mostrar "Pendiente: $X" en el detalle
export const calcularValorPendienteCuota = (valorCuota, cuota) => {
  if (cuota.pagado) return 0;
  
  // Valor de la cuota menos abonos aplicados
  const valorPendiente = valorCuota - (cuota.abonoAplicado || 0);
  
  // Multas totales menos multas cubiertas
  const totalMultas = calcularTotalMultasCuota(cuota);
  const multasPendientes = totalMultas - (cuota.multasCubiertas || 0);
  
  // Retornar valor pendiente + multas pendientes
  return valorPendiente + multasPendientes;
};
