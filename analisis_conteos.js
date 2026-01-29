// Script para simular la lógica exacta de conteo de clientes
// Basado en las funciones del archivo Clientes.jsx

// Función simulada para determinar estado de crédito (basada en líneas 105-111)
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

// Función para obtener tipos de pago activos (líneas 103-112)
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

// Función para simular la lógica de ocupación (líneas 138-196)
function calcularOcupacion(clientes, esAdminOCeo = true, esBuga = false) {
  let base;
  if (esBuga) {
    base = { K3: { semanal: 0, quincenalMensual: 0 } };
  } else if (esAdminOCeo) {
    base = {
      K1: { semanal: 0, quincenalMensual: 0 },
      K2: { general: 0 },
      K3: { semanal: 0, quincenalMensual: 0 }
    };
  } else {
    base = {
      K1: { semanal: 0, quincenalMensual: 0 },
      K2: { general: 0 },
      K3: { semanal: 0, quincenalMensual: 0 }
    };
  }

  clientes.forEach((cliente) => {
    const cartera = cliente.cartera || (esBuga ? 'K3' : 'K1');
    const tiposActivos = getTiposPagoActivos(cliente);
    
    // Si tiene créditos activos, usar esos tipos; si no, usar tipoPagoEsperado
    // Si no tiene nada (sin preferencia) y es K1 o K3, asumimos quincenalMensual para el conteo
    const tipos = tiposActivos.length > 0
      ? tiposActivos
      : (cliente.tipoPagoEsperado
        ? [cliente.tipoPagoEsperado]
        : (cartera === 'K2' ? [] : ['quincenalMensual'])
      );

    if (tipos.length === 0) {
      // En K2 o carteras desconocidas sin tipo definido
      if (cartera === 'K2') {
        if (base[cartera] && base[cartera].general !== undefined) {
          base[cartera].general += 1;
        }
      }
      return;
    }

    tipos.forEach((t) => {
      if (cartera === 'K2') {
        // Para K2, todo cuenta para general
        if (base[cartera] && base[cartera].general !== undefined) {
          base[cartera].general += 1;
        }
      } else if (base[cartera]) {
        // Para K1 y K3, quincenal y mensual se suman a quincenalMensual
        if (t === 'quincenal' || t === 'mensual') {
          if (typeof base[cartera].quincenalMensual === 'number') {
            base[cartera].quincenalMensual += 1;
          }
        } else if (typeof base[cartera][t] === 'number') {
          base[cartera][t] += 1;
        }
      }
    });
  });
  
  return base;
}

// Función para contar clientes por cartera (líneas 377-379)
function contarClientesPorCartera(clientes, esAdminOCeo = true, esBuga = false) {
  const clientesK1 = (esBuga ? 0 : clientes.filter(c => (c.cartera || 'K1') === 'K1').length);
  const clientesK2 = (esBuga ? 0 : clientes.filter(c => c.cartera === 'K2').length);
  const clientesK3 = (esBuga ? clientes.filter(c => (c.cartera || 'K3') === 'K3').length : (esAdminOCeo ? clientes.filter(c => c.cartera === 'K3').length : 0));
  
  return { clientesK1, clientesK2, clientesK3 };
}

console.log("=== SIMULACIÓN DE LÓGICA DE CONTEO ===\n");

// Como no tenemos acceso a los datos reales, mostraremos cómo verificaría
console.log("Para verificar los conteos exactos, necesito acceso a los datos de clientes.");
console.log("Sin embargo, puedo mostrar la lógica exacta que usa el sistema:\n");

console.log("PASO 1: Contar clientes por cartera (líneas 377-379):");
console.log("- clientesK1 = clientes.filter(c => (c.cartera || 'K1') === 'K1').length");
console.log("- clientesK2 = clientes.filter(c => c.cartera === 'K2').length");
console.log("- clientesK3 = clientes.filter(c => c.cartera === 'K3').length");

console.log("\nPASO 2: Calcular ocupación por tipo (líneas 138-196):");
console.log("- Para cada cliente, obtener tipos de pago activos");
console.log("- Si no tiene créditos activos, usar tipoPagoEsperado");
console.log("- Si no tiene nada, asumir 'quincenalMensual' para K1/K3");

console.log("\nPASO 3: Lógica específica por cartera:");
console.log("- K2: Todo cuenta como 'general'");
console.log("- K1/K3: 'quincenal' y 'mensual' → 'quincenalMensual'");
console.log("- K1/K3: 'semanal' → 'semanal'");

console.log("\n=== DIFERENCIAS POSIBLES ===");
console.log("\nK2: Sistema muestra 48 vs Usuario cuenta 42");
console.log("Posibles causas:");
console.log("1. Clientes con créditos ya pagados pero aún en K2");
console.log("2. Clientes sin créditos pero con tipoPagoEsperado");
console.log("3. Clientes con cartera null/undefined que asumen K1");

console.log("\nK1 Semanal: Sistema muestra 65 vs Usuario cuenta 63");
console.log("Posibles causas:");
console.log("1. Clientes con créditos semanales ya pagados");
console.log("2. Clientes con múltiples créditos semanales");
console.log("3. Clientes con tipoPagoEsperado='semanal' pero sin créditos activos");

console.log("\n=== RECOMENDACIÓN ===");
console.log("Para encontrar exactamente la diferencia:");
console.log("1. Ejecutar una consulta directa a la base de datos");
console.log("2. Filtrar clientes por cartera y estado de créditos");
console.log("3. Comparar la lista exacta de clientes que el sistema cuenta");
