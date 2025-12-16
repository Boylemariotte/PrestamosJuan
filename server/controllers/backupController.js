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
    await Cliente.deleteMany({});
    await Credito.deleteMany({});
    await MovimientoCaja.deleteMany({});
    await Alerta.deleteMany({});

    if (data.clientes?.length) {
        const clientesProcesados = [];
        const creditosParaColeccion = [];

        for (const clienteRaw of data.clientes) {
            const clienteId = clienteRaw.id || clienteRaw._id || Date.now().toString();

            // Procesar créditos embebidos
            const creditosEmbebidos = [];
            if (clienteRaw.creditos && Array.isArray(clienteRaw.creditos)) {
                for (const creditoRaw of clienteRaw.creditos) {
                    const creditoId = creditoRaw.id || creditoRaw._id || `CRED-${Date.now()}`;

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
                telefono: clienteRaw.telefono,
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

        // Insertar clientes con créditos embebidos
        if (clientesProcesados.length > 0) {
            await Cliente.insertMany(clientesProcesados);
        }

        // Insertar créditos en su colección separada
        if (creditosParaColeccion.length > 0) {
            await Credito.insertMany(creditosParaColeccion);
        }
    }

    if (data.movimientosCaja?.length) {
        const movimientos = data.movimientosCaja.map(m => ({ ...m, _id: m.id || m._id }));
        await MovimientoCaja.insertMany(movimientos);
    }

    if (data.alertas?.length) {
        const alertas = data.alertas.map(a => ({ ...a, _id: a.id || a._id }));
        await Alerta.insertMany(alertas);
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
