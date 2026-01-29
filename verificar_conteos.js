// Script para verificar conteos de clientes
// Este script analiza la lógica de conteo del archivo Clientes.jsx

console.log("=== ANÁLISIS DE CONTEOS DE CLIENTES ===\n");

// Simulamos los datos que vendrían del contexto
// Basado en los conteos que muestra el sistema:
const conteosSistema = {
  K1: {
    total: 190,
    semanal: 65,
    quincenalMensual: 125
  },
  K2: {
    total: 48,
    general: 48
 },
  K3: {
    total: 0,
    semanal: 0,
    quincenalMensual: 0
  },
  totalGeneral: 238
};

console.log("CONTEOS QUE MUESTRA EL SISTEMA:");
console.log("K1:", conteosSistema.K1);
console.log("K2:", conteosSistema.K2);
console.log("K3:", conteosSistema.K3);
console.log("Total General:", conteosSistema.totalGeneral);

console.log("\nCONTEOS MANUALES DEL USUARIO:");
console.log("K2: 42 (usuario cuenta 42 vs sistema muestra 48)");
console.log("K1 Semanal: 63 (usuario cuenta 63 vs sistema muestra 65)");

console.log("\n=== ANÁLISIS DE LÓGICA DE CONTEO ===");

// Análisis basado en el código de Clientes.jsx líneas 137-196
console.log("\n1. LÓGICA DE OCUPACIÓN (líneas 138-196):");
console.log("- El sistema cuenta clientes con créditos activos/en mora");
console.log("- Si no tiene créditos activos, usa tipoPagoEsperado");
console.log("- Si no tiene nada (K1/K3), asume 'quincenalMensual' por defecto");

console.log("\n2. LÓGICA DE K1 (líneas 184-191):");
console.log("- Para K1, los tipos 'quincenal' y 'mensual' se suman a 'quincenalMensual'");
console.log("- El tipo 'semanal' se cuenta por separado");

console.log("\n3. LÓGICA DE K2 (líneas 178-182):");
console.log("- Para K2, todo cuenta para 'general' sin importar el tipo");

console.log("\n4. POSIBLES DIFERENCIAS:");
console.log("a) Clientes con créditos inactivos (pagados completamente)");
console.log("b) Clientes con múltiples créditos de diferentes tipos");
console.log("c) Clientes sin créditos pero con tipoPagoEsperado definido");
console.log("d) Clientes archivados o eliminados");

console.log("\n=== RECOMENDACIONES PARA VERIFICACIÓN ===");
console.log("\nPara encontrar la diferencia en K2 (48 vs 42):");
console.log("1. Buscar clientes en K2 que el sistema cuenta pero el usuario no ve");
console.log("2. Verificar si hay clientes con créditos inactivos que aún se cuentan");
console.log("3. Revisar si hay clientes duplicados o con datos inconsistentes");

console.log("\nPara encontrar la diferencia en K1 Semanal (65 vs 63):");
console.log("1. Verificar si hay clientes con créditos semanales inactivos");
console.log("2. Revisar clientes con múltiples créditos semanales");
console.log("3. Confirmar si todos los clientes mostrados realmente tienen créditos activos");

console.log("\n=== PRÓXIMOS PASOS ===");
console.log("1. Revisar la base de datos directamente");
console.log("2. Filtrar clientes por cartera y verificar su estado");
console.log("3. Comparar lista de clientes que el sistema cuenta vs los que el usuario ve");
