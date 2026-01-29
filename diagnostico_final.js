// ANÁLISIS COMPLETO DE DIFERENCIAS EN CONTEOS DE CLIENTES
// Basado en el código real de Clientes.jsx y el controlador del backend

console.log("=== ANÁLISIS DETALLADO DE DIFERENCIAS ===\n");

// Datos reportados por el usuario vs sistema
const sistemaMuestra = {
  K1: { total: 190, semanal: 65, quincenalMensual: 125 },
  K2: { total: 48, general: 48 },
  K3: { total: 0, semanal: 0, quincenalMensual: 0 },
  totalGeneral: 238
};

const usuarioCuenta = {
  K2: 42,
  K1_semanal: 63
};

console.log("DIFERENCIAS IDENTIFICADAS:");
console.log(`K2: Sistema muestra ${sistemaMuestra.K2.general} vs Usuario cuenta ${usuarioCuenta.K2} (diferencia: ${sistemaMuestra.K2.general - usuarioCuenta.K2})`);
console.log(`K1 Semanal: Sistema muestra ${sistemaMuestra.K1.semanal} vs Usuario cuenta ${usuarioCuenta.K1_semanal} (diferencia: ${sistemaMuestra.K1.semanal - usuarioCuenta.K1_semanal})`);

console.log("\n=== ANÁLISIS DE LÓGICA EXACTA DEL SISTEMA ===");

// Función que replica exactamente la lógica del frontend (líneas 103-112 de Clientes.jsx)
function getTiposPagoActivos(cliente) {
  const tipos = new Set();
  (cliente.creditos || []).forEach((c) => {
    const estadoC = determinarEstadoCredito(c.cuotas, c);
    if (estadoC === 'activo' || estadoC === 'mora') {
      if (c.tipo) tipos.add(c.tipo);
    }
  });
  return Array.from(tipos);
}

// Función que replica la lógica de estado (creditCalculations.js)
function determinarEstadoCredito(cuotas, credito) {
  if (!cuotas || cuotas.length === 0) return 'inactivo';
  
  const cuotasPendientes = cuotas.filter(cuota => !cuota.pagado);
  if (cuotasPendientes.length === 0) return 'pagado';
  
  const hoy = new Date();
  const tieneVencidas = cuotasPendientes.some(cuota => {
    const fechaCuota = new Date(cuota.fechaProgramada);
    return fechaCuota < hoy;
  });
  
  return tieneVencidas ? 'mora' : 'activo';
}

console.log("\n1. LÓGICA DE CONTEO DE K1 (líneas 184-191):");
console.log("- Para K1, los tipos 'quincenal' y 'mensual' se suman a 'quincenalMensual'");
console.log("- El tipo 'semanal' se cuenta por separado");
console.log("- Solo cuentan créditos con estado 'activo' o 'mora'");

console.log("\n2. LÓGICA DE CONTEO DE K2 (líneas 178-182):");
console.log("- Para K2, TODO cuenta para 'general' sin importar el tipo");
console.log("- Solo cuentan créditos con estado 'activo' o 'mora'");

console.log("\n3. LÓGICA POR DEFECTO (líneas 160-165):");
console.log("- Si no tiene créditos activos, usa tipoPagoEsperado");
console.log("- Si no tiene nada y es K1/K3, asume 'quincenalMensual'");

console.log("\n=== POSIBLES CAUSAS DE DIFERENCIAS ===");

console.log("\nDIFERENCIA EN K2 (48 vs 42):");
console.log("Posibles clientes que el sistema cuenta pero el usuario no ve:");
console.log("a) Clientes con créditos PAGADOS (estado 'pagado' no debería contar)");
console.log("b) Clientes con créditos INACTIVOS (sin cuotas pendientes)");
console.log("c) Clientes con cartera NULL/UNDEFINED que asumen K1");
console.log("d) Clientes archivados (esArchivado: true) - NO deberían contar");
console.log("e) Clientes sin posición asignada (posicion: null)");

console.log("\nDIFERENCIA EN K1 SEMANAL (65 vs 63):");
console.log("Posibles clientes extra en el conteo:");
console.log("a) Clientes con créditos semanales ya PAGADOS");
console.log("b) Clientes con múltiples créditos semanales (cuenta doble?)");
console.log("c) Clientes con tipoPagoEsperado='semanal' pero sin créditos activos");

console.log("\n=== CONSULTAS SQL/MONGODB PARA VERIFICAR ===");

console.log("\nPARA K2 (encontrar los 6 clientes extra):");
console.log(`
// 1. Todos los clientes K2 no archivados
db.clientes.find({
  cartera: 'K2',
  esArchivado: { $ne: true }
}).count()

// 2. Clientes K2 con créditos activos/en mora
db.clientes.find({
  cartera: 'K2',
  esArchivado: { $ne: true },
  'creditos.cuotas.pagado': false
}).count()

// 3. Clientes K2 que el sistema cuenta pero no tienen créditos activos
db.clientes.find({
  cartera: 'K2',
  esArchivado: { $ne: true },
  $or: [
    { creditos: { $exists: false } },
    { creditos: { $size: 0 } },
    { 'creditos.cuotas': { $exists: false } }
  ]
})
`);

console.log("\nPARA K1 SEMANAL (encontrar los 2 clientes extra):");
console.log(`
// 1. Clientes K1 con créditos semanales activos
db.clientes.find({
  cartera: 'K1',
  esArchivado: { $ne: true },
  'creditos.tipo': 'semanal',
  'creditos.cuotas.pagado': false
}).count()

// 2. Clientes K1 con tipoPagoEsperado='semanal' pero sin créditos activos
db.clientes.find({
  cartera: 'K1',
  esArchivado: { $ne: true },
  tipoPagoEsperado: 'semanal',
  $or: [
    { creditos: { $exists: false } },
    { creditos: { $size: 0 } }
  ]
})
`);

console.log("\n=== SOLUCIONES RECOMENDADAS ===");

console.log("\n1. VERIFICACIÓN INMEDIATA:");
console.log("- Ejecutar las consultas MongoDB arriba mencionadas");
console.log("- Comparar lista de clientes que el sistema cuenta vs los visibles");
console.log("- Revisar si hay clientes con datos inconsistentes");

console.log("\n2. POSIBLES ERRORES EN EL CÓDIGO:");
console.log("- Revisar línea 160-165 de Clientes.jsx: lógica de tipos por defecto");
console.log("- Verificar si clientes archivados están siendo incluidos");
console.log("- Confirmar que clientes sin posición no se cuenten");

console.log("\n3. CORRECCIONES SUGERIDAS:");
console.log("- Agregar filtro explícito para excluir clientes archivados");
console.log("- Validar que solo cuenten clientes con posición asignada");
console.log("- Revisar lógica de conteo para clientes con múltiples créditos");

console.log("\n=== ACCIONES INMEDIATAS ===");
console.log("1. Ejecutar consultas MongoDB para identificar clientes específicos");
console.log("2. Revisar visualmente los clientes identificados");
console.log("3. Corregir datos inconsistentes (archivar, cambiar cartera, etc.)");
console.log("4. Si es error de código, ajustar lógica en Clientes.jsx");

console.log("\nEl problema más probable es que el sistema está contando clientes que");
console.log("no deberían incluirse (archivados, sin créditos activos, o con datos inconsistentes).");
