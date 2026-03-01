import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, AlertCircle, Users, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { startOfDay, format, addDays, subDays, parseISO } from 'date-fns';

import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import api, { prorrogaService, ordenCobroService } from '../../services/api';
import { formatearMoneda } from '../../utils/creditCalculations';

// Hooks
import { useProrrogaActions } from './hooks/useProrrogaActions';
import { useCollectionsData } from './hooks/useCollectionsData';

// Components
import CollectionsHeader from './components/CollectionsHeader';
import VisitasAlert from './components/VisitasAlert';
import CarteraSection from './components/CarteraSection';
import PagosSection from './components/PagosSection';
import GlobalProrrogaLoading from './components/GlobalProrrogaLoading';
import CreditoDetalle from '../../components/Creditos/CreditoDetalle';
import MotivoProrrogaModal from '../../components/Creditos/MotivoProrrogaModal';

// Utils
import { getCarteraColor, getBgColorClass } from './utils/colorHelpers';

const DiaDeCobro = () => {
    const { clientes, obtenerCliente, obtenerCredito, actualizarCliente, agregarNota, toggleReportado, fetchData, lastSyncTime, carteras } = useApp();
    const { user } = useAuth();
    const hoy = startOfDay(new Date());

    // Ciudades disponibles derivadas de las carteras activas
    const ciudadesDisponibles = useMemo(() => {
        if (!carteras) return [];
        const ciudadesSet = new Set(
            carteras.filter(c => c.activa !== false).map(c => c.ciudad)
        );
        return [...ciudadesSet];
    }, [carteras]);

    // Estado para selector de ciudad
    const [ciudadSeleccionada, setCiudadSeleccionada] = useState(() =>
        localStorage.getItem('ultimaCiudadDiaDeCobro') || ''
    );

    // Auto-seleccionar la primera ciudad si la seleccionada no existe en las disponibles
    useEffect(() => {
        if (ciudadesDisponibles.length > 0 && !ciudadesDisponibles.includes(ciudadSeleccionada)) {
            setCiudadSeleccionada(ciudadesDisponibles[0]);
        }
    }, [ciudadesDisponibles, ciudadSeleccionada]);

    useEffect(() => {
        if (ciudadSeleccionada) {
            localStorage.setItem('ultimaCiudadDiaDeCobro', ciudadSeleccionada);
        }
    }, [ciudadSeleccionada]);

    // Carteras de la ciudad seleccionada
    const carterasDeCiudad = useMemo(() => {
        if (!carteras) return [];
        return carteras
            .filter(c => c.activa !== false && c.ciudad === ciudadSeleccionada)
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }, [carteras, ciudadSeleccionada]);

    // Roles
    const esDomiciliarioBuga = user?.role === 'domiciliario' && user?.ciudad === 'Guadalajara de Buga';

    // Estado para la fecha
    const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
    const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
    const esHoy = fechaSeleccionadaStr === format(hoy, 'yyyy-MM-dd');

    // Visitas
    const [visitas, setVisitas] = useState([]);
    useEffect(() => {
        const cargarVisitas = () => {
            const saved = localStorage.getItem('visitas');
            if (saved) setVisitas(JSON.parse(saved));
        };
        cargarVisitas();
        window.addEventListener('storage', cargarVisitas);
        return () => window.removeEventListener('storage', cargarVisitas);
    }, []);

    const handleCompletarVisita = (id) => {
        if (window.confirm('¿Marcar visita como completada?')) {
            const nuevas = visitas.map(v => v.id === id ? { ...v, completada: true } : v);
            setVisitas(nuevas);
            localStorage.setItem('visitas', JSON.stringify(nuevas));
            toast.success('Visita marcada como completada');
        }
    };

    const visitasDelDia = useMemo(() =>
        visitas.filter(v => !v.completada && (v.fechaVisita === fechaSeleccionadaStr || v.fechaVisita < fechaSeleccionadaStr))
        , [visitas, fechaSeleccionadaStr]);

    // Filtros dinámicos por cartera
    const [filtrosPorCartera, setFiltrosPorCartera] = useState({});
    const [filtroPagosPorCartera, setFiltroPagosPorCartera] = useState({});

    // Búsqueda
    const [searchTerm, setSearchTerm] = useState('');

    // Helpers para actualizar filtros individuales
    const setFiltroCartera = useCallback((nombreCartera, valor) => {
        setFiltrosPorCartera(prev => ({ ...prev, [nombreCartera]: valor }));
    }, []);

    const setFiltroPagosCartera = useCallback((nombreCartera, valor) => {
        setFiltroPagosPorCartera(prev => ({ ...prev, [nombreCartera]: valor }));
    }, []);

    // Orden de cobro
    const [ordenCobro, setOrdenCobro] = useState({});
    const cargarOrdenesCobro = async (fecha) => {
        try {
            const resp = await ordenCobroService.obtenerPorFecha(fecha);
            if (resp.success && resp.data) {
                setOrdenCobro(prev => ({ ...prev, [fecha]: resp.data }));
            }
        } catch (e) { console.error('Error orden:', e); }
    };
    useEffect(() => { cargarOrdenesCobro(fechaSeleccionadaStr); }, [fechaSeleccionadaStr, lastSyncTime]);

    const handleActualizarOrdenManual = async (clienteId, nuevoOrden) => {
        const numeroNuevo = parseInt(nuevoOrden, 10);
        const nuevoMap = { ...(ordenCobro[fechaSeleccionadaStr] || {}) };

        if (nuevoOrden === '' || isNaN(numeroNuevo)) {
            nuevoMap[clienteId] = '';
            setOrdenCobro(prev => ({ ...prev, [fechaSeleccionadaStr]: nuevoMap }));
            try { await ordenCobroService.eliminar(fechaSeleccionadaStr, clienteId); } catch (e) { console.error(e); }
            return;
        }

        nuevoMap[clienteId] = numeroNuevo;
        setOrdenCobro(prev => ({ ...prev, [fechaSeleccionadaStr]: nuevoMap }));
        try { await ordenCobroService.guardar(fechaSeleccionadaStr, nuevoMap); }
        catch (e) { console.error(e); toast.error('Error sincronización orden'); }
    };

    // Clientes no encontrados
    const [clientesNoEncontradosPorFecha, setClientesNoEncontradosPorFecha] = useState({});
    useEffect(() => {
        const saved = localStorage.getItem('clientesNoEncontradosPorFecha');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const conSets = {};
                Object.keys(parsed).forEach(f => conSets[f] = new Set(parsed[f]));
                setClientesNoEncontradosPorFecha(conSets);
            } catch (e) { console.error(e); }
        }
    }, []);

    const handleMarcarComoNoEncontrado = (clienteId, current) => {
        toggleReportado(clienteId, current);
        const mañana = format(addDays(fechaSeleccionada, 1), 'yyyy-MM-dd');
        const hoyStr = fechaSeleccionadaStr;

        if (current !== false) {
            setClientesNoEncontradosPorFecha(prev => {
                const nuevo = { ...prev };
                if (!nuevo[mañana]) nuevo[mañana] = new Set();
                nuevo[mañana].add(clienteId);
                const pg = {}; Object.keys(nuevo).forEach(f => pg[f] = Array.from(nuevo[f]));
                localStorage.setItem('clientesNoEncontradosPorFecha', JSON.stringify(pg));
                return nuevo;
            });
            toast.success('Cliente marcado como no encontrado. Aparecerá mañana.');
        } else {
            setClientesNoEncontradosPorFecha(prev => {
                const nuevo = { ...prev };
                let mod = false;
                if (nuevo[hoyStr]?.has(clienteId)) { nuevo[hoyStr] = new Set(nuevo[hoyStr]); nuevo[hoyStr].delete(clienteId); mod = true; }
                if (nuevo[mañana]?.has(clienteId)) { nuevo[mañana] = new Set(nuevo[mañana]); nuevo[mañana].delete(clienteId); mod = true; }
                if (mod) {
                    const pg = {}; Object.keys(nuevo).forEach(f => pg[f] = Array.from(nuevo[f]));
                    localStorage.setItem('clientesNoEncontradosPorFecha', JSON.stringify(pg));
                }
                return nuevo;
            });
            toast.success('Cliente marcado como reportado');
        }
    };

    // Créditos inválidos
    const [creditosInvalidos, setCreditosInvalidos] = useState(new Set());

    // Custom Hook: Prorroga Actions
    const {
        prorrogasCuotas, modalProrrogaOpen, setModalProrrogaOpen, setDatosProrrogaPendiente,
        setEsProrrogaGlobal, procesandoProrrogaGlobal, progresoProrroga, handleConfirmarProrroga
    } = useProrrogaActions(
        prorrogaService, clientes, fetchData, agregarNota, fechaSeleccionadaStr,
        clientesNoEncontradosPorFecha, setClientesNoEncontradosPorFecha
    );

    // Custom Hook: Data Logic — ahora dinámico
    const {
        datosCobro, cobrosPorCartera, totalClientesDirecto, clientesPagados, multasPagadasDia,
        carterasDeCiudad: _, nombresCarterasCiudad
    } = useCollectionsData({
        clientes, searchTerm, fechaSeleccionada, fechaSeleccionadaStr, creditosInvalidos,
        prorrogasCuotas, clientesNoEncontradosPorFecha, hoy, ciudadSeleccionada,
        carteras, filtrosPorCartera, filtroPagosPorCartera, ordenCobro
    });

    // Modal Detalle
    const [sel, setSel] = useState({ client: null, credit: null });
    const abrirDetalle = async (cid, crid) => {
        const cl = obtenerCliente(cid);
        const cr = obtenerCredito(cid, crid);
        if (cl && cr) {
            try {
                const resp = await api.get(`/creditos/${crid}`);
                if (resp.success) setSel({ client: cl, credit: cr });
                else {
                    setCreditosInvalidos(prev => new Set([...prev, `${cid}-${crid}`]));
                    toast.error('Crédito no existe');
                }
            } catch (e) {
                setCreditosInvalidos(prev => new Set([...prev, `${cid}-${crid}`]));
                toast.error('Crédito no existe');
            }
        }
    };

    const nav = {
        irAyer: () => setFechaSeleccionada(subDays(fechaSeleccionada, 1)),
        irHoy: () => setFechaSeleccionada(hoy),
        irMañana: () => setFechaSeleccionada(addDays(fechaSeleccionada, 1)),
        cambiarFecha: (e) => setFechaSeleccionada(startOfDay(parseISO(e.target.value)))
    };

    // Helper: obtener todos los tipos de pago permitidos de una cartera
    const getTiposPago = (cartera) => {
        if (!cartera.secciones) return [];
        return cartera.secciones.flatMap(s => s.tiposPagoPermitidos || []);
    };

    // Props comunes para CarteraSection
    const carteraSectionCommonProps = {
        onCambioOrden: handleActualizarOrdenManual,
        ordenFecha: ordenCobro[fechaSeleccionadaStr] || {},
        abrirDetalle,
        actualizarCliente,
        toggleReportado: handleMarcarComoNoEncontrado,
        user
    };

    const handleProrrogaItem = (it) => {
        setEsProrrogaGlobal(false);
        setDatosProrrogaPendiente({ clienteId: it.clienteId, creditoId: it.creditoId, nroCuotas: it.nroCuotasPendientes });
        setModalProrrogaOpen(true);
    };

    // Agrupar todos los items para prórroga global
    const handleProrrogaGlobal = () => {
        setEsProrrogaGlobal(true);
        const todosItems = [];
        nombresCarterasCiudad.forEach(nombre => {
            todosItems.push(...(cobrosPorCartera[nombre] || []));
        });
        todosItems.push(...(cobrosPorCartera.NoReportados || []));
        setDatosProrrogaPendiente({ clientes: todosItems });
        setModalProrrogaOpen(true);
    };

    // Determinar color del banner de la ciudad (usar el color de la primera cartera)
    const colorCiudad = carterasDeCiudad.length > 0 ? carterasDeCiudad[0].color || 'blue' : 'blue';

    return (
        <div className="space-y-6 pb-20">
            <CollectionsHeader
                {...nav}
                fechaSeleccionada={fechaSeleccionada}
                ciudadSeleccionada={ciudadSeleccionada}
                setCiudadSeleccionada={setCiudadSeleccionada}
                ciudadesDisponibles={ciudadesDisponibles}
                carterasDeCiudad={carterasDeCiudad}
                esHoy={esHoy}
                fechaSeleccionadaStr={fechaSeleccionadaStr}
                stats={datosCobro.stats}
                totalClientesDirecto={totalClientesDirecto}
                clientesPagados={clientesPagados}
                user={user}
                onProrrogaGlobal={handleProrrogaGlobal}
            />

            <VisitasAlert visitasDelDia={visitasDelDia} handleCompletarVisita={handleCompletarVisita} />

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            <div className="space-y-8">
                {/* Banner de Ciudad */}
                {carterasDeCiudad.length > 0 && (
                    <div className="space-y-6">
                        <div className={`${getBgColorClass(colorCiudad)} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3`}>
                            <Users className="h-8 w-8" />
                            <h2 className="text-2xl font-bold">Día de Cobro {ciudadSeleccionada}</h2>
                        </div>

                        {/* Renderizar una CarteraSection por cada cartera de la ciudad */}
                        {carterasDeCiudad.map(cartera => (
                            <CarteraSection
                                key={cartera._id || cartera.nombre}
                                title={`Cartera ${cartera.nombre}`}
                                color={cartera.color || 'blue'}
                                items={cobrosPorCartera[cartera.nombre] || []}
                                typeFilter={filtrosPorCartera[cartera.nombre] || 'todos'}
                                setTypeFilter={(val) => setFiltroCartera(cartera.nombre, val)}
                                tiposPagoPermitidos={getTiposPago(cartera)}
                                onProrroga={handleProrrogaItem}
                                {...carteraSectionCommonProps}
                            />
                        ))}

                        {/* Clientes no encontrados */}
                        <CarteraSection
                            title="Clientes no encontrados"
                            isNoReportados
                            items={cobrosPorCartera.NoReportados || []}
                            onProrroga={handleProrrogaItem}
                            typeFilter="todos"
                            setTypeFilter={() => { }}
                            {...carteraSectionCommonProps}
                        />
                    </div>
                )}

                {/* Multas pagadas */}
                {multasPagadasDia.length > 0 && (
                    <div className="space-y-4 mt-10 pt-6 border-t-2 border-dashed border-gray-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <h2 className="text-xl font-bold text-gray-900">Multas pagadas</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Total multas</p>
                                <p className="text-xl font-bold text-red-600">{formatearMoneda(multasPagadasDia.reduce((s, i) => s + i.montoPagadoMulta, 0))}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-white uppercase bg-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 text-center">#</th>
                                        <th className="px-4 py-3 text-center">N° Cartera</th>
                                        <th className="px-4 py-3">Cliente</th>
                                        <th className="px-4 py-3 text-center">Tipo de pago</th>
                                        <th className="px-4 py-3 text-center">Cartera</th>
                                        <th className="px-4 py-3 text-right text-red-500">Valor multa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {multasPagadasDia.map((i, idx) => (
                                        <tr key={idx} className="bg-white hover:bg-gray-50">
                                            <td className="px-4 py-3 text-center font-bold text-gray-800">{idx + 1}</td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-800">{i.clientePosicion ? `#${i.clientePosicion}` : '-'}</td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{i.clienteNombre}</td>
                                            <td className="px-4 py-3 text-center capitalize">{i.creditoTipo}</td>
                                            <td className="px-4 py-3 text-center font-semibold">{i.cartera}</td>
                                            <td className="px-4 py-3 text-right font-bold text-red-600">{formatearMoneda(i.montoPagadoMulta)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagos Registrados — dinámico por cartera */}
                {carterasDeCiudad.length > 0 && (
                    <div className="space-y-6 mt-8 pt-8 border-t-2 border-gray-300">
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-600" /> Pagos Registrados
                        </h2>
                        {carterasDeCiudad.map(cartera => (
                            <PagosSection
                                key={cartera._id || cartera.nombre}
                                title={`Pagos ${cartera.nombre}`}
                                color={cartera.color || 'blue'}
                                items={clientesPagados[cartera.nombre]?.items || []}
                                total={clientesPagados[cartera.nombre]?.total || 0}
                                typeFilter={filtroPagosPorCartera[cartera.nombre] || 'todos'}
                                setTypeFilter={(val) => setFiltroPagosCartera(cartera.nombre, val)}
                                tiposPagoPermitidos={getTiposPago(cartera)}
                                abrirDetalle={abrirDetalle}
                            />
                        ))}
                    </div>
                )}
            </div>

            {sel.credit && sel.client && (
                <CreditoDetalle credito={sel.credit} clienteId={sel.client.id} clienteNombre={sel.client.nombre} cliente={sel.client} onClose={() => setSel({ client: null, credit: null })} />
            )}

            <MotivoProrrogaModal isOpen={modalProrrogaOpen} initialDate={fechaSeleccionadaStr} onClose={() => { setModalProrrogaOpen(false); setDatosProrrogaPendiente(null); }} onConfirm={handleConfirmarProrroga} />

            {procesandoProrrogaGlobal && <GlobalProrrogaLoading progresoProrroga={progresoProrroga} />}
        </div>
    );
};

export default DiaDeCobro;
