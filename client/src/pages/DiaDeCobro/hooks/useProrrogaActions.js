import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format, addDays, parseISO } from 'date-fns';

export const useProrrogaActions = (
    prorrogaService,
    clientes,
    fetchData,
    agregarNota,
    fechaSeleccionadaStr,
    clientesNoEncontradosPorFecha,
    setClientesNoEncontradosPorFecha
) => {
    const [prorrogasCuotas, setProrrogasCuotas] = useState({});
    const [modalProrrogaOpen, setModalProrrogaOpen] = useState(false);
    const [datosProrrogaPendiente, setDatosProrrogaPendiente] = useState(null);
    const [esProrrogaGlobal, setEsProrrogaGlobal] = useState(false);
    const [procesandoProrrogaGlobal, setProcesandoProrrogaGlobal] = useState(false);
    const [progresoProrroga, setProgresoProrroga] = useState({ actual: 0, total: 0 });

    const cargarProrrogas = async () => {
        try {
            const response = await prorrogaService.obtenerTodas();
            if (response.success && Array.isArray(response.data)) {
                const mapaProrrogas = {};
                response.data.forEach(p => {
                    if (p.fechaProrroga) {
                        const key = `${p.clienteId}-${p.creditoId}-${p.nroCuota}`;
                        const fechaStr = new Date(p.fechaProrroga).toISOString().split('T')[0];
                        mapaProrrogas[key] = fechaStr;
                    }
                });
                setProrrogasCuotas(mapaProrrogas);
            }
        } catch (error) {
            console.error('Error al cargar prórrogas desde el servidor:', error);
            toast.error('No se pudieron sincronizar las extensiones de fecha con el servidor');

            const savedProrrogas = localStorage.getItem('prorrogasCuotas');
            if (savedProrrogas) {
                try {
                    setProrrogasCuotas(JSON.parse(savedProrrogas));
                } catch (e) {
                    console.error('Error fallback localStorage:', e);
                }
            }
        }
    };

    useEffect(() => {
        cargarProrrogas();
    }, []);

    const aplicarProrrogaCuotasDelDia = async (clienteId, creditoId, nuevaFechaStr, nroCuotasTarget = null, silencioso = false) => {
        const cliente = clientes.find(c => c.id === clienteId);
        if (!cliente) return;
        const credito = (cliente.creditos || []).find(c => c.id === creditoId);
        if (!credito || !Array.isArray(credito.cuotas)) return;

        const cuotasParaActualizar = [];
        const nuevasProrrogas = { ...prorrogasCuotas };

        credito.cuotas.forEach(cuota => {
            if (cuota.pagado) return;

            const key = `${clienteId}-${creditoId}-${cuota.nroCuota}`;
            const fechaOriginalStr = typeof cuota.fechaProgramada === 'string'
                ? cuota.fechaProgramada.split('T')[0]
                : '';

            const fechaEfectiva = prorrogasCuotas[key] || fechaOriginalStr;
            const esCuotaTarget = nroCuotasTarget && nroCuotasTarget.includes(cuota.nroCuota);

            if (esCuotaTarget || (fechaEfectiva && fechaEfectiva <= fechaSeleccionadaStr)) {
                nuevasProrrogas[key] = nuevaFechaStr;
                cuotasParaActualizar.push({
                    nroCuota: cuota.nroCuota,
                    fechaProrroga: nuevaFechaStr
                });
            }
        });

        if (cuotasParaActualizar.length === 0) {
            if (!silencioso) toast.info('No hay cuotas pendientes para prorrogar en esta fecha');
            return;
        }

        try {
            const response = await prorrogaService.guardar(clienteId, creditoId, cuotasParaActualizar);

            if (response.success) {
                setProrrogasCuotas(nuevasProrrogas);

                if (clientesNoEncontradosPorFecha[fechaSeleccionadaStr]?.has(clienteId)) {
                    setClientesNoEncontradosPorFecha(prev => {
                        const nuevo = { ...prev };
                        const origenSet = new Set(nuevo[fechaSeleccionadaStr] || []);
                        origenSet.delete(clienteId);
                        nuevo[fechaSeleccionadaStr] = origenSet;

                        const destinoSet = new Set(nuevo[nuevaFechaStr] || []);
                        destinoSet.add(clienteId);
                        nuevo[nuevaFechaStr] = destinoSet;

                        const paraGuardar = {};
                        Object.keys(nuevo).forEach(fecha => {
                            paraGuardar[fecha] = Array.from(nuevo[fecha]);
                        });
                        localStorage.setItem('clientesNoEncontradosPorFecha', JSON.stringify(paraGuardar));

                        return nuevo;
                    });
                }

                if (!silencioso) toast.success('Prórroga aplicada y guardada correctamente');
            } else {
                if (!silencioso) toast.error('Error al guardar la prórroga en el servidor');
            }
        } catch (error) {
            console.error('Error al guardar prórroga:', error);
            if (!silencioso) toast.error('Error de conexión al guardar la prórroga');
        }
    };

    const handleConfirmarProrrogaGlobal = async (motivo, nuevaFecha) => {
        const { clientes: clientesAMover } = datosProrrogaPendiente;
        const total = clientesAMover.length;
        let exitosos = 0;

        setProcesandoProrrogaGlobal(true);
        setProgresoProrroga({ actual: 0, total });

        for (const item of clientesAMover) {
            try {
                await aplicarProrrogaCuotasDelDia(item.clienteId, item.creditoId, nuevaFecha, item.nroCuotasPendientes, true);

                if (agregarNota) {
                    const textoNota = `Prórroga Global: Fecha de cobro pospuesta - ${motivo}`;
                    await agregarNota(item.clienteId, item.creditoId, textoNota);
                }

                exitosos++;
                setProgresoProrroga(prev => ({ ...prev, actual: exitosos }));
            } catch (error) {
                console.error(`Error prorrogando cliente ${item.clienteNombre}:`, error);
            }
        }

        setProcesandoProrrogaGlobal(false);
        await fetchData();
        await cargarProrrogas();

        toast.success(`Prórroga global completada: ${exitosos} de ${total} clientes movidos a ${nuevaFecha}`);
    };

    const handleConfirmarProrroga = async (motivo, nuevaFecha) => {
        if (!datosProrrogaPendiente) return;

        if (esProrrogaGlobal) {
            setModalProrrogaOpen(false);
            await handleConfirmarProrrogaGlobal(motivo, nuevaFecha);
        } else {
            const { clienteId, creditoId, nroCuotas } = datosProrrogaPendiente;
            await aplicarProrrogaCuotasDelDia(clienteId, creditoId, nuevaFecha, nroCuotas);

            if (agregarNota) {
                try {
                    const textoNota = `Fecha de cobro pospuesta - ${motivo}`;
                    await agregarNota(clienteId, creditoId, textoNota);
                } catch (error) {
                    console.error('Error al guardar la nota de prórroga:', error);
                    toast.warning('La prórroga se aplicó pero hubo un error al guardar la nota');
                }
            }
            setModalProrrogaOpen(false);
        }

        setEsProrrogaGlobal(false);
        setDatosProrrogaPendiente(null);
    };

    return {
        prorrogasCuotas,
        modalProrrogaOpen,
        setModalProrrogaOpen,
        datosProrrogaPendiente,
        setDatosProrrogaPendiente,
        esProrrogaGlobal,
        setEsProrrogaGlobal,
        procesandoProrrogaGlobal,
        progresoProrroga,
        handleConfirmarProrroga,
        cargarProrrogas
    };
};
