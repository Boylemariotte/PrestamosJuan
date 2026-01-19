import { addWeeks, addDays, format, parseISO, isBefore, isAfter, startOfDay, isPast } from 'date-fns';
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
    mensual: { numCuotas: 3, valorCuota: 160000 }
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

  // Normalizar a mediodía para evitar problemas de zona horaria/DST
  fecha.setHours(12, 0, 0, 0);

  // Ajustar al próximo sábado (o mismo día si ya es sábado)
  const diaSemana = fecha.getDay(); // 0=Dom, 6=Sáb
  if (diaSemana !== 6) {
    const diasHastaSabado = (6 - diaSemana + 7) % 7;
    fecha = addDays(fecha, diasHastaSabado === 0 ? 7 : diasHastaSabado);
    fecha.setHours(12, 0, 0, 0);
  }

  // Generar sábados consecutivos (corrigiendo desfase de 1 día)
  for (let i = 0; i < numCuotas; i++) {
    // Base: sábado calculado + 7 días por cuota
    let fechaCuota = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + i * 7);
    fechaCuota.setHours(12, 0, 0, 0);

    // Ajuste: sumar 1 día para corregir desfase observado (p.ej. 18 -> 25 en vez de 24)
    fechaCuota = addDays(fechaCuota, 1);

    fechas.push({
      nroCuota: i + 1,
      fechaProgramada: format(fechaCuota, 'yyyy-MM-dd'),
      pagado: false,
      fechaPago: null
    });
  }

  return fechas;
};

// Generar fechas de pago quincenales
export const generarFechasPagoQuincenales = (fechaInicio, numCuotas, tipo = '1-16') => {
  const fechas = [];
  let fecha = parseISO(fechaInicio);

  const dias = tipo === '1-16' ? [1, 16] : [5, 20];

  for (let i = 0; i < numCuotas; i++) {
    let mes = fecha.getMonth();
    let año = fecha.getFullYear();
    const diaDelMes = fecha.getDate();

    // Determinar cuál día usar (1 o 16, o 5 o 20)
    let diaAPagar;

    if (diaDelMes <= dias[0]) {
      diaAPagar = dias[0];
    } else if (diaDelMes <= dias[1]) {
      diaAPagar = dias[1];
    } else {
      // Si ya pasó el segundo día, ir al primer día del siguiente mes
      mes = mes + 1;
      diaAPagar = dias[0];
    }

    // Crear la fecha de pago para esta cuota
    const fechaPago = new Date(año, mes, diaAPagar);
    fechaPago.setHours(12, 0, 0, 0); // Establecer al mediodía para evitar problemas de zona horaria

    fechas.push({
      nroCuota: i + 1,
      fechaProgramada: format(fechaPago, 'yyyy-MM-dd'),
      pagado: false,
      fechaPago: null
    });

    // Avanzar a la siguiente quincena para la próxima iteración
    if (diaAPagar === dias[0]) {
      // Si estamos en el primer día, la siguiente cuota es en el segundo día del mismo mes
      fecha = new Date(año, mes, dias[1]);
    } else {
      // Si estamos en el segundo día, la siguiente cuota es en el primer día del siguiente mes
      fecha = new Date(año, mes + 1, dias[0]);
    }
    fecha.setHours(12, 0, 0, 0);
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
export const calcularProgreso = (cuotas, credito = null) => {
  const totalCuotas = cuotas.length;
  let cuotasPagadas = cuotas.filter(c => c.pagado).length;

  // Si se proporciona el crédito completo, verificar cuotas cubiertas por abonos
  if (credito && credito.abonos && credito.abonos.length > 0) {
    const resultado = aplicarAbonosAutomaticamente(credito);
    const cuotasActualizadas = resultado.cuotasActualizadas;

    // Contar cuotas no pagadas manualmente pero cubiertas por abonos
    cuotasActualizadas.forEach((cuota, index) => {
      const cuotaOriginal = cuotas[index];
      if (!cuotaOriginal.pagado) {
        // Verificar si está completamente cubierta por abonos
        const totalMultasCuota = cuota.multas && cuota.multas.length > 0
          ? cuota.multas.reduce((sum, m) => sum + m.valor, 0)
          : 0;
        const multasCubiertas = cuota.multasCubiertas || 0;
        const multasPendientes = totalMultasCuota - multasCubiertas;
        const valorPendiente = (credito.valorCuota - (cuota.abonoAplicado || 0)) + multasPendientes;

        // Si el valor pendiente es 0 o menos, la cuota está cubierta
        if (valorPendiente <= 0) {
          cuotasPagadas++;
        }
      }
    });
  }

  return {
    cuotasPagadas,
    totalCuotas,
    porcentaje: Math.round((cuotasPagadas / totalCuotas) * 100)
  };
};

// Determinar estado del crédito
export const determinarEstadoCredito = (cuotas, credito = null) => {
  const hoy = startOfDay(new Date());
  const progreso = calcularProgreso(cuotas, credito);

  // Si el crédito fue renovado explícitamente, usar estado especial
  if (credito && credito.renovado) {
    return 'renovado';
  }

  // Si todas las cuotas están pagadas
  if (progreso.cuotasPagadas === progreso.totalCuotas) {
    return 'finalizado';
  }

  // Si se proporciona el crédito completo, verificar abonos
  let cuotasActualizadas = cuotas;
  if (credito && credito.abonos && credito.abonos.length > 0) {
    const resultado = aplicarAbonosAutomaticamente(credito);
    cuotasActualizadas = resultado.cuotasActualizadas;
  }

  // Verificar si hay cuotas vencidas (considerando abonos)
  const tieneCuotasVencidas = cuotasActualizadas.some((cuota, index) => {
    const cuotaOriginal = cuotas[index];
    if (!cuotaOriginal.pagado) {
      const fechaProgramada = startOfDay(parseISO(cuotaOriginal.fechaProgramada));
      if (isBefore(fechaProgramada, hoy)) {
        // Verificar si la cuota está completamente cubierta por abonos
        if (credito) {
          const totalMultasCuota = cuota.multas && cuota.multas.length > 0
            ? cuota.multas.reduce((sum, m) => sum + m.valor, 0)
            : 0;
          const multasCubiertas = cuota.multasCubiertas || 0;
          const multasPendientes = totalMultasCuota - multasCubiertas;
          const valorPendiente = (credito.valorCuota - (cuota.abonoAplicado || 0)) + multasPendientes;

          // Si el valor pendiente es 0 o menos, la cuota está cubierta
          return valorPendiente > 0;
        }
        return true;
      }
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
    case 'renovado':
      return 'text-gray-600 bg-gray-200';
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
  // 1. Inicializar cuotas
  const cuotasActualizadas = credito.cuotas.map(cuota => ({
    ...cuota,
    multas: cuota.multas ? [...cuota.multas] : [],
    abonoAplicado: 0,
    multasCubiertas: 0
  }));

  let saldoAbonoGeneral = 0;

  // Procesar solo abonos de cuotas (abonosMulta está completamente separado y se maneja en el backend)
  (credito.abonos || []).forEach(abono => {
    // PAGOS DE CUOTAS / GENERALES (Solo cubren capital)
    const match = abono.descripcion && abono.descripcion.match(/(?:Cuota|cuota)\s*#(\d+)/);
    const nroCuotaTarget = abono.nroCuota || (match ? parseInt(match[1]) : null);

    if (nroCuotaTarget) {
      const cuota = cuotasActualizadas.find(c => c.nroCuota === nroCuotaTarget);
      if (cuota) {
        // Solo aplicar a capital
        cuota.abonoAplicado += abono.valor;
      } else {
        saldoAbonoGeneral += abono.valor;
      }
    } else {
      saldoAbonoGeneral += abono.valor;
    }
  });

  // 3. Procesar abonos generales (Waterfall - Cascada) - SOLO CAPITAL
  // Solo se aplican a cuotas NO pagadas manualmente
  for (let cuota of cuotasActualizadas) {
    if (saldoAbonoGeneral <= 0) break;
    if (cuota.pagado) continue;

    // NO cubrimos multas con saldo general, solo capital

    // Después cubrir el valor pendiente de la cuota
    const valorCuota = credito.valorCuota;
    const capitalPendiente = valorCuota - cuota.abonoAplicado;

    if (capitalPendiente > 0) {
      const aporte = Math.min(saldoAbonoGeneral, capitalPendiente);
      cuota.abonoAplicado += aporte;
      saldoAbonoGeneral -= aporte;
    }
  }

  return {
    cuotasActualizadas,
    saldoAbonoRestante: saldoAbonoGeneral
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

// Calcular total de multas de una cuota (Deprecado/Fallback)
export const calcularTotalMultasCuota = (cuota) => {
  return 0; // Las multas ya no pertenecen a la cuota
};

// Calcular total de multas de un crédito (Multas globales)
export const calcularTotalMultasCredito = (cuotas, credito = null) => {
  // Si se pasa el objeto crédito completo, sumar sus multas globales
  if (credito && credito.multas) {
    return credito.multas.reduce((total, multa) => total + multa.valor, 0);
  }
  // Fallback para estructura antigua (multas en cuotas)
  return cuotas.reduce((total, cuota) => {
    return total + (cuota.multas ? cuota.multas.reduce((sum, m) => sum + m.valor, 0) : 0);
  }, 0);
};

// Calcular valor total a pagar de una cuota (Solo capital, multas son aparte)
export const calcularValorTotalCuota = (valorCuota, cuota) => {
  return valorCuota;
};

// Verificar si una fecha ha pasado
export const isFechaPasada = (fecha) => {
  if (!fecha) return false;
  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : new Date(fecha);
    return isPast(startOfDay(fechaObj));
  } catch (error) {
    console.error('Error al verificar fecha:', error);
    return false;
  }
};

// Calcular valor PENDIENTE de una cuota (valor cuota - abonos)
// Las multas ya no se suman a la cuota
export const calcularValorPendienteCuota = (valorCuota, cuota) => {
  if (cuota.pagado) return 0;

  // Valor de la cuota menos abonos aplicados
  const capitalPendiente = valorCuota - (cuota.abonoAplicado || 0);

  return Math.max(0, capitalPendiente);
};
