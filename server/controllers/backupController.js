import mongoose from 'mongoose';
import Cliente from '../models/Cliente.js';
import Credito from '../models/Credito.js';
import MovimientoCaja from '../models/MovimientoCaja.js';
import Alerta from '../models/Alerta.js';

/**
 * @desc    Exportar todos los datos (Backup)
 * @route   GET /api/backup/export
 * @access  Private (CEO)
 */
export const exportData = async (req, res, next) => {
    try {
        // Exportar clientes con créditos embebidos (estructura JSON original)
        const clientes = await Cliente.find().lean();
        const movimientosCaja = await MovimientoCaja.find().lean();
        const alertas = await Alerta.find().lean();

        // Transformar clientes para que tengan la estructura JSON esperada
        const clientesExport = clientes.map(cliente => ({
            id: cliente._id.toString(),
            nombre: cliente.nombre,
            documento: cliente.documento,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            barrio: cliente.barrio,
            direccionTrabajo: cliente.direccionTrabajo,
            correo: cliente.correo,
            cartera: cliente.cartera,
            tipoPago: cliente.tipoPago,
            tipoPagoEsperado: cliente.tipoPagoEsperado,
            fiador: cliente.fiador,
            posicion: cliente.posicion,
            creditos: cliente.creditos || [],
            fechaCreacion: cliente.fechaCreacion,
            coordenadasResidencia: cliente.coordenadasResidencia,
            coordenadasTrabajo: cliente.coordenadasTrabajo
        }));

        // Formato de backup compatible con el JSON original
        const backup = {
            clientes: clientesExport,
            movimientosCaja,
            alertas
        };

        res.status(200).json(backup);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Importar datos (Restore)
 * @route   POST /api/backup/import
 * @access  Private (CEO)
 */
export const importData = async (req, res, next) => {
    try {
        let dataToImport = req.body;

        // Si viene envuelto en { data: {...} }
        if (req.body.data && req.body.data.clientes) {
            dataToImport = req.body.data;
        }

        if (!dataToImport.clientes) {
            return res.status(400).json({ success: false, error: 'Formato de datos inválido o sin datos' });
        }

        await performImport(dataToImport);

        res.status(200).json({ success: true, message: 'Datos importados correctamente' });
    } catch (error) {
        console.error('Error en importación:', error);
        next(error);
    }
};

const performImport = async (data) => {
    // Limpiar base de datos
    // NOTA: Si se desea hacer un "merge", se debería quitar esto, pero "Import/Restore" suele implicar reemplazo o append.
    // Dado que el código anterior borraba, mantenemos ese comportamiento.
    await Cliente.deleteMany({});

    // IMPORTANTE: Eliminar índices únicos viejos que puedan causar conflicto (ej: documento_1)
    try {
        await Cliente.collection.dropIndex('documento_1');
        console.log('Índice documento_1 eliminado correctamente para permitir duplicados.');
    } catch (e) {
        // Ignorar error si el índice no existe
        if (e.code !== 27) {
            console.log('Nota: El índice documento_1 no existía o no se pudo borrar:', e.message);
        }
    }

    await Credito.deleteMany({});
    await MovimientoCaja.deleteMany({});
    await Alerta.deleteMany({});

    // Importación por lotes para escalabilidad (Batch Size)
    const BATCH_SIZE = 500; // Procesar de a 500 registros para no bloquear ni saturar memoria en inserts

    if (data.clientes?.length) {
        console.log(`Iniciando importación de ${data.clientes.length} clientes...`);
        let importedClientesCount = 0;
        let importedCreditosCount = 0;
        let errorCount = 0;

        // Procesar en lotes
        for (let i = 0; i < data.clientes.length; i += BATCH_SIZE) {
            const clientesBatch = data.clientes.slice(i, i + BATCH_SIZE);
            const clientesProcesados = [];
            const creditosParaColeccion = [];

            for (const clienteRaw of clientesBatch) {
                // Usar ID existente o generar uno ROBUSTO (evitar Date.now() en loops rápidos)
                const clienteId = clienteRaw.id || clienteRaw._id || new mongoose.Types.ObjectId().toString();

                // Procesar créditos embebidos
                const creditosEmbebidos = [];
                if (clienteRaw.creditos && Array.isArray(clienteRaw.creditos)) {
                    for (const creditoRaw of clienteRaw.creditos) {
                        const creditoId = creditoRaw.id || creditoRaw._id || `CRED-${new mongoose.Types.ObjectId().toString()}`;

                        // Corregir cuotas y saldos
                        const cuotasProcesadas = (creditoRaw.cuotas || []).map(cuota => {
                            let saldoCalculado = cuota.saldoPendiente;

                            if (saldoCalculado === undefined || saldoCalculado === null) {
                                if (cuota.pagado) {
                                    saldoCalculado = 0;
                                } else {
                                    const abonosCuota = cuota.abonosCuota || [];
                                    const totalAbonado = abonosCuota.reduce((sum, a) => sum + (a.valor || 0), 0);
                                    saldoCalculado = (creditoRaw.valorCuota || 0) - totalAbonado;
                                    if (saldoCalculado < 0) saldoCalculado = 0;
                                }
                            }

                            return {
                                ...cuota,
                                saldoPendiente: saldoCalculado,
                                pagado: saldoCalculado <= 0 ? true : (cuota.pagado || false)
                            };
                        });

                        // Crédito embebido para el cliente
                        const creditoEmbebido = {
                            id: creditoId,
                            monto: creditoRaw.monto,
                            papeleria: creditoRaw.papeleria || 0,
                            montoEntregado: creditoRaw.montoEntregado,
                            tipo: creditoRaw.tipo,
                            tipoQuincenal: creditoRaw.tipoQuincenal,
                            fechaInicio: creditoRaw.fechaInicio,
                            totalAPagar: creditoRaw.totalAPagar,
                            valorCuota: creditoRaw.valorCuota,
                            numCuotas: creditoRaw.numCuotas,
                            cuotas: cuotasProcesadas,
                            abonos: creditoRaw.abonos || [],
                            descuentos: creditoRaw.descuentos || [],
                            notas: creditoRaw.notas || [],
                            etiqueta: creditoRaw.etiqueta,
                            renovado: creditoRaw.renovado || false,
                            esRenovacion: creditoRaw.esRenovacion || false,
                            creditoAnteriorId: creditoRaw.creditoAnteriorId,
                            fechaCreacion: creditoRaw.fechaCreacion
                        };

                        creditosEmbebidos.push(creditoEmbebido);

                        // También preparar para la colección Creditos
                        creditosParaColeccion.push({
                            _id: creditoId,
                            cliente: clienteId,
                            monto: creditoRaw.monto,
                            papeleria: creditoRaw.papeleria || 0,
                            montoEntregado: creditoRaw.montoEntregado,
                            tipo: creditoRaw.tipo,
                            tipoQuincenal: creditoRaw.tipoQuincenal,
                            fechaInicio: creditoRaw.fechaInicio,
                            totalAPagar: creditoRaw.totalAPagar,
                            valorCuota: creditoRaw.valorCuota,
                            numCuotas: creditoRaw.numCuotas,
                            cuotas: cuotasProcesadas,
                            abonos: creditoRaw.abonos || [],
                            descuentos: creditoRaw.descuentos || [],
                            notas: creditoRaw.notas || [],
                            etiqueta: creditoRaw.etiqueta,
                            renovado: creditoRaw.renovado || false,
                            esRenovacion: creditoRaw.esRenovacion || false,
                            creditoAnteriorId: creditoRaw.creditoAnteriorId,
                            fechaCreacion: creditoRaw.fechaCreacion
                        });
                    }
                }

                // Cliente con créditos embebidos
                clientesProcesados.push({
                    _id: clienteId,
                    nombre: clienteRaw.nombre,
                    documento: clienteRaw.documento,
                    telefono: clienteRaw.telefono, // Asegurar que sea string
                    direccion: clienteRaw.direccion,
                    barrio: clienteRaw.barrio,
                    direccionTrabajo: clienteRaw.direccionTrabajo,
                    correo: clienteRaw.correo,
                    cartera: clienteRaw.cartera,
                    tipoPago: clienteRaw.tipoPago,
                    tipoPagoEsperado: clienteRaw.tipoPagoEsperado,
                    fiador: clienteRaw.fiador,
                    posicion: clienteRaw.posicion,
                    creditos: creditosEmbebidos,
                    fechaCreacion: clienteRaw.fechaCreacion,
                    coordenadasResidencia: clienteRaw.coordenadasResidencia,
                    coordenadasTrabajo: clienteRaw.coordenadasTrabajo
                });
            }

            // Insertar lotes con { ordered: false } para que no se detenga si uno falla
            if (clientesProcesados.length > 0) {
                try {
                    const resultClientes = await Cliente.insertMany(clientesProcesados, { ordered: false });
                    importedClientesCount += resultClientes.length;
                } catch (e) {
                    // Si hay partial failures, insertMany lanza error pero incluye lo insertado en e.result o e.insertedDocs (dependiendo version driver)
                    // o e.writeErrors
                    console.error(`Error parcial importando lote de clientes ${i}:`, e.message);
                    if (e.writeErrors) {
                        errorCount += e.writeErrors.length;
                    }
                    if (e.insertedDocs) {
                        importedClientesCount += e.insertedDocs.length;
                    }
                }
            }

            if (creditosParaColeccion.length > 0) {
                try {
                    const resultCreditos = await Credito.insertMany(creditosParaColeccion, { ordered: false });
                    importedCreditosCount += resultCreditos.length;
                } catch (e) {
                    console.error(`Error parcial importando lote de creditos ${i}:`, e.message);
                    // Manejo similar de errores parciales de MongoDB
                }
            }

            // Liberar memoria explícitamente (opcional, el GC lo hace, pero ayuda en loops grandes)
            // clientesBatch, clientesProcesados, creditosParaColeccion salen de scope aquí.
        }
        console.log(`Importación finalizada. Clientes: ${importedClientesCount}, Errores: ${errorCount}`);
    }

    if (data.movimientosCaja?.length) {
        // También procesar movimientos en batch si fueran muchos, pero suele ser tabla pequeña
        const movimientos = data.movimientosCaja.map(m => ({ ...m, _id: m.id || m._id }));
        try {
            await MovimientoCaja.insertMany(movimientos, { ordered: false });
        } catch (e) { console.error('Error importando movimientos:', e.message); }
    }

    if (data.alertas?.length) {
        const alertas = data.alertas.map(a => ({ ...a, _id: a.id || a._id }));
        try {
            await Alerta.insertMany(alertas, { ordered: false });
        } catch (e) { console.error('Error importando alertas:', e.message); }
    }
};

/**
 * @desc    Eliminar todos los datos (Factory Reset)
 * @route   DELETE /api/backup/reset
 * @access  Private (CEO)
 */
export const resetData = async (req, res, next) => {
    try {
        await Cliente.deleteMany({});
        await Credito.deleteMany({});
        await MovimientoCaja.deleteMany({});
        await Alerta.deleteMany({});

        res.status(200).json({ success: true, message: 'Todos los datos han sido eliminados' });
    } catch (error) {
        next(error);
    }
};
