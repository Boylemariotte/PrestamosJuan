import mongoose from 'mongoose';
import Cliente from '../models/Cliente.js';
import Credito from '../models/Credito.js';
import MovimientoCaja from '../models/MovimientoCaja.js';
import Alerta from '../models/Alerta.js';
import Persona from '../models/Persona.js';

/**
 * @desc    Exportar todos los datos (Backup)
 * @route   GET /api/backup/export
 * @access  Private (CEO)
 */
export const exportData = async (req, res, next) => {
    try {
        // Exportar clientes con créditos embebidos (estructura JSON original)
        const clientes = await Cliente.find();
        const creditos = await Credito.find();
        const movimientosCajaRaw = await MovimientoCaja.find();
        const alertas = await Alerta.find();
        const personas = await Persona.find().select('+password');

        // Transformar movimientos para incluir campo id
        const movimientosCaja = movimientosCajaRaw.map(mov => ({
            ...mov,
            id: mov.id || mov._id?.toString() || mov._id
        }));

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
            coordenadasTrabajo: cliente.coordenadasTrabajo,
            coordenadasResidenciaActualizada: cliente.coordenadasResidenciaActualizada,
            coordenadasTrabajoActualizada: cliente.coordenadasTrabajoActualizada,
            esArchivado: cliente.esArchivado,
            etiqueta: cliente.etiqueta,
            rf: cliente.rf || ""
        }));

        // Formato de backup compatible con el JSON original
        const backup = {
            metadata: {
                generadoEn: new Date().toISOString(),
                version: '1.0.0',
                colecciones: ['clientes', 'creditos', 'movimientosCaja', 'alertas', 'personas']
            },
            clientes: clientesExport,
            creditos,
            movimientosCaja,
            alertas,
            personas
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
    // Modo merge: no borrar colecciones; se hace upsert para no perder datos existentes.

    // Importación por lotes para escalabilidad (Batch Size)
    const BATCH_SIZE = 500; // Procesar de a 500 registros para no bloquear ni saturar memoria en inserts

    if (data.clientes?.length) {
        console.log(`Iniciando importación (merge) de ${data.clientes.length} clientes...`);
        let importedClientesCount = 0;
        let importedCreditosCount = 0;
        let errorCount = 0;

        // Procesar en lotes
        for (let i = 0; i < data.clientes.length; i += BATCH_SIZE) {
            const clientesBatch = data.clientes.slice(i, i + BATCH_SIZE);
            const clientesProcesados = [];
            const creditosParaColeccion = [];

            for (const clienteRaw of clientesBatch) {
                const clienteId = clienteRaw.id || clienteRaw._id || new mongoose.Types.ObjectId().toString();

                if (clienteRaw.esArchivado) {
                    console.log(`[Backup Import] Procesando cliente archivado: ${clienteRaw.nombre}, esArchivado value: ${clienteRaw.esArchivado}`);
                }

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
                    coordenadasTrabajo: clienteRaw.coordenadasTrabajo,
                    coordenadasResidenciaActualizada: clienteRaw.coordenadasResidenciaActualizada,
                    coordenadasTrabajoActualizada: clienteRaw.coordenadasTrabajoActualizada,
                    coordenadasTrabajoActualizada: clienteRaw.coordenadasTrabajoActualizada,
                    esArchivado: (clienteRaw.esArchivado === true || clienteRaw.esArchivado === 'true'),
                    etiqueta: clienteRaw.etiqueta,
                    rf: clienteRaw.rf
                });
            }

            // Upsert de clientes (merge, sin borrar existentes)
            if (clientesProcesados.length > 0) {
                const opsClientes = clientesProcesados.map(c => ({
                    updateOne: {
                        filter: { _id: c._id },
                        update: { $set: c },
                        upsert: true
                    }
                }));
                const resultClientes = await Cliente.bulkWrite(opsClientes, { ordered: false });
                importedClientesCount += (resultClientes.upsertedCount || 0) + (resultClientes.modifiedCount || 0);
            }

            if (creditosParaColeccion.length > 0) {
                const opsCreditos = creditosParaColeccion.map(c => ({
                    updateOne: {
                        filter: { _id: c._id },
                        update: { $set: c },
                        upsert: true
                    }
                }));
                const resultCreditos = await Credito.bulkWrite(opsCreditos, { ordered: false });
                importedCreditosCount += (resultCreditos.upsertedCount || 0) + (resultCreditos.modifiedCount || 0);
            }

            // Liberar memoria explícitamente (opcional)
        }
        console.log(`Importación (merge) finalizada. Clientes procesados: ${importedClientesCount}, Errores: ${errorCount}`);
    }

    if (data.movimientosCaja?.length) {
        console.log(`Importando/merge de ${data.movimientosCaja.length} movimientosCaja...`);
        const movimientos = data.movimientosCaja.map(m => {
            const mov = { ...m };
            // Asegurar que tenemos un id válido
            mov.id = m.id || m._id?.toString() || m._id || `MOV-${new mongoose.Types.ObjectId().toString()}`;
            // Si no hay _id, usar el id como _id también
            if (!mov._id) {
                mov._id = mov.id;
            } else if (typeof mov._id === 'object') {
                mov._id = mov._id.toString();
            }
            // Normalizar tipos
            if (mov.valor !== undefined) mov.valor = Number(mov.valor);
            if (mov.papeleria !== undefined) mov.papeleria = Number(mov.papeleria);
            if (mov.montoEntregado !== undefined) mov.montoEntregado = Number(mov.montoEntregado);
            if (mov.caja !== undefined) mov.caja = Number(mov.caja);
            if (mov.fecha) {
                const f = new Date(mov.fecha);
                f.setHours(0, 0, 0, 0);
                mov.fecha = f;
            }
            if (mov.fechaCreacion) {
                mov.fechaCreacion = new Date(mov.fechaCreacion);
            }
            if (!mov.tipoMovimiento) mov.tipoMovimiento = 'flujoCaja';
            // Eliminar campos que no deben estar en el documento
            delete mov.__v;
            return mov;
        });
        const opsMovs = movimientos.map(m => ({
            updateOne: {
                filter: { id: m.id }, // usar campo id textual para upsert
                update: {
                    $set: {
                        ...m,
                        _id: m._id || m.id // Asegurar que _id esté presente
                    }
                },
                upsert: true
            }
        }));
        try {
            const resMovs = await MovimientoCaja.bulkWrite(opsMovs, { ordered: false });
            console.log(`Movimientos upsertados: ins=${resMovs.upsertedCount || 0}, mod=${resMovs.modifiedCount || 0}, matched=${resMovs.matchedCount || 0}`);
        } catch (e) {
            console.error('Error importando movimientos:', e);
            // Si falla por campo id único, intentar sin el campo id en el update
            const opsMovsFallback = movimientos.map(m => ({
                updateOne: {
                    filter: { _id: m._id || m.id },
                    update: { $set: m },
                    upsert: true
                }
            }));
            try {
                const resMovsFallback = await MovimientoCaja.bulkWrite(opsMovsFallback, { ordered: false });
                console.log(`Movimientos upsertados (fallback): ins=${resMovsFallback.upsertedCount || 0}, mod=${resMovsFallback.modifiedCount || 0}`);
            } catch (e2) {
                console.error('Error en fallback de importación de movimientos:', e2);
            }
        }
    }

    if (data.alertas?.length) {
        const alertas = data.alertas.map(a => {
            const al = { ...a, _id: a.id || a._id };
            if (al.fechaVencimiento) al.fechaVencimiento = new Date(al.fechaVencimiento);
            if (al.fechaCreacion) al.fechaCreacion = new Date(al.fechaCreacion);
            return al;
        });
        const opsAlertas = alertas.map(a => ({
            updateOne: {
                filter: { _id: a._id },
                update: { $set: a },
                upsert: true
            }
        }));
        try {
            await Alerta.bulkWrite(opsAlertas, { ordered: false });
        } catch (e) { console.error('Error importando alertas:', e.message); }
    }

    if (data.personas?.length) {
        // Upsert sin borrar existentes: si username ya existe, se deja y no se borra nada.
        const ops = data.personas.map(p => {
            const personaData = { ...p, _id: p.id || p._id };
            // Eliminar timestamps para evitar conflicto con la gestión automática de Mongoose
            delete personaData.createdAt;
            delete personaData.updatedAt;
            delete personaData.__v;

            return {
                updateOne: {
                    filter: { username: p.username },
                    update: { $setOnInsert: personaData },
                    upsert: true
                }
            };
        });
        try {
            await Persona.bulkWrite(ops, { ordered: false });
        } catch (e) { console.error('Error importando personas:', e.message); }
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
        // NO eliminar usuarios/personas para conservar credenciales y accesos

        res.status(200).json({ success: true, message: 'Todos los datos han sido eliminados' });
    } catch (error) {
        next(error);
    }
};
