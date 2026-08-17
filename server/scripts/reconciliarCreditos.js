/**
 * Script de reconciliación: Credito (fuente de verdad) -> Cliente.creditos[] (copia embebida)
 * ---------------------------------------------------------------------------------------
 * Motivo: por un bug ya corregido en `syncCreditoToCliente` (server/controllers/creditoController.js),
 * algunos pagos/abonos quedaron guardados correctamente en la colección `Credito` pero nunca se
 * replicaron a la copia embebida en `Cliente.creditos[]`, que es de donde leen Día de Cobro, Cartera
 * y los listados de clientes. Este script detecta esos casos y los corrige.
 *
 * Uso:
 *   node server/scripts/reconciliarCreditos.js            -> modo reporte (no modifica nada)
 *   node server/scripts/reconciliarCreditos.js --apply     -> corrige los casos encontrados
 *
 * Se recomienda correrlo primero SIN --apply para revisar el reporte antes de aplicar cambios.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar server/.env sin importar desde dónde se ejecute el script
dotenv.config({ path: join(__dirname, '..', '.env') });

import Credito from '../models/Credito.js';
import Cliente from '../models/Cliente.js';
import SyncError from '../models/SyncError.js';
import { syncCreditoToCliente, construirCreditoEmbebido } from '../controllers/creditoController.js';

const APLICAR = process.argv.includes('--apply');

// Campos que realmente importan para detectar un pago "perdido" en la copia embebida.
// (Se ignoran diferencias irrelevantes de orden/serialización comparando JSON normalizado.)
const camposClave = ['cuotas', 'abonos', 'abonosMulta', 'multas', 'totalAPagar', 'desactivado'];

function normalizar(valor) {
  return JSON.parse(JSON.stringify(valor ?? null));
}

function difiere(creditoEmbebidoActual, creditoEmbebidoCorrecto) {
  if (!creditoEmbebidoActual) return true;
  return camposClave.some(
    (campo) => JSON.stringify(normalizar(creditoEmbebidoActual[campo])) !== JSON.stringify(normalizar(creditoEmbebidoCorrecto[campo]))
  );
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ No se encontró MONGO_URI. Ejecuta este script desde una máquina/entorno con acceso a la base de datos (server/.env).');
    process.exit(1);
  }

  console.log(`Modo: ${APLICAR ? 'APLICAR CORRECCIONES' : 'SOLO REPORTE (dry-run)'}`);
  console.log('Conectando a MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Conectado.\n');

  const creditos = await Credito.find({});
  console.log(`Créditos a revisar: ${creditos.length}\n`);

  const afectados = [];
  let clientesNoEncontrados = 0;

  for (const credito of creditos) {
    const cliente = await Cliente.findById(credito.cliente).select('nombre documento creditos');
    if (!cliente) {
      clientesNoEncontrados++;
      console.warn(`⚠️  Crédito ${credito._id} referencia un cliente inexistente (${credito.cliente})`);
      continue;
    }

    const embebidoActual = cliente.creditos.find((c) => c.id === credito._id.toString());
    const embebidoCorrecto = construirCreditoEmbebido(credito, credito._id.toString());

    if (difiere(embebidoActual, embebidoCorrecto)) {
      // Contar cuotas que aparecen pagadas en Credito pero no en la copia del cliente:
      // es el síntoma exacto que reportó el cliente (pagos que "desaparecen").
      const cuotasCorrectas = embebidoCorrecto.cuotas || [];
      const cuotasActuales = embebidoActual?.cuotas || [];
      const cuotasPagadasQueSeVeianSinPagar = cuotasCorrectas.filter((cc) => {
        const actual = cuotasActuales.find((ca) => ca.nroCuota === cc.nroCuota);
        return cc.pagado && (!actual || !actual.pagado);
      }).length;

      afectados.push({
        clienteId: cliente._id,
        nombre: cliente.nombre,
        documento: cliente.documento,
        creditoId: credito._id.toString(),
        existiaEmbebido: !!embebidoActual,
        cuotasPagadasQueSeVeianSinPagar
      });
    }
  }

  console.log('=== REPORTE ===');
  console.log(`Clientes referenciados que ya no existen: ${clientesNoEncontrados}`);
  console.log(`Créditos desincronizados encontrados: ${afectados.length}\n`);

  if (afectados.length > 0) {
    afectados.forEach((a, i) => {
      console.log(
        `${i + 1}. ${a.nombre} (doc. ${a.documento}) - crédito ${a.creditoId} - ` +
        `${a.existiaEmbebido ? 'copia desactualizada' : 'NO estaba embebido en el cliente'} - ` +
        `${a.cuotasPagadasQueSeVeianSinPagar} cuota(s) pagada(s) que se veían como pendientes`
      );
    });
    console.log('');
  }

  if (APLICAR && afectados.length > 0) {
    console.log('Aplicando correcciones...');
    let corregidos = 0;
    for (const a of afectados) {
      await syncCreditoToCliente(a.creditoId);
      corregidos++;
    }
    console.log(`✅ ${corregidos} crédito(s) resincronizado(s).`);

    // Marcar como resueltos los SyncError previos de estos créditos, si existían.
    const idsCreditos = afectados.map((a) => a.creditoId);
    const resultado = await SyncError.updateMany(
      { creditoId: { $in: idsCreditos }, resuelto: false },
      { resuelto: true, fechaResuelto: new Date() }
    );
    if (resultado.modifiedCount > 0) {
      console.log(`✅ ${resultado.modifiedCount} registro(s) de SyncError marcados como resueltos.`);
    }
  } else if (!APLICAR && afectados.length > 0) {
    console.log('Esto fue solo un reporte. Para corregir estos créditos, corre:');
    console.log('  node server/scripts/reconciliarCreditos.js --apply');
  } else {
    console.log('✅ No se encontraron inconsistencias. Todo está sincronizado.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error ejecutando la reconciliación:', err);
  process.exit(1);
});
