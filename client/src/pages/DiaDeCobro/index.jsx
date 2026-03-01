import React, { useState, useEffect, useMemo } from 'react';
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
import { getCarteraColor } from './utils/colorHelpers';

const DiaDeCobro = () => {
    const { clientes, obtenerCliente, obtenerCredito, actualizarCliente, agregarNota, toggleReportado, fetchData, lastSyncTime, carteras } = useApp();
    const { user } = useAuth();
    const hoy = startOfDay(new Date());

    // Estado para selector de ciudad
    const [ciudadSeleccionada, setCiudadSeleccionada] = useState(() =>
        localStorage.getItem('ultimaCiudadDiaDeCobro') || 'tuluá'
    );

    useEffect(() => {
        localStorage.setItem('ultimaCiudadDiaDeCobro', ciudadSeleccionada);
    }, [ciudadSeleccionada]);

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

    // Filtros y Búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroK1, setFiltroK1] = useState('todos');
    const [filtroK2, setFiltroK2] = useState('todos');
    const [filtroK3, setFiltroK3] = useState('todos');
    const [filtroPagosK1, setFiltroPagosK1] = useState('todos');
    const [filtroPagosK2, setFiltroPagosK2] = useState('todos');
    const [filtroPagosK3, setFiltroPagosK3] = useState('todos');

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

        if (current !== false) { // Se marca como NO encontrado
            setClientesNoEncontradosPorFecha(prev => {
                const nuevo = { ...prev };
                if (!nuevo[mañana]) nuevo[mañana] = new Set();
                nuevo[mañana].add(clienteId);
                const pg = {}; Object.keys(nuevo).forEach(f => pg[f] = Array.from(nuevo[f]));
                localStorage.setItem('clientesNoEncontradosPorFecha', JSON.stringify(pg));
                return nuevo;
            });
            toast.success('Cliente marcado como no encontrado. Aparecerá mañana.');
        } else { // Se marca como reportado
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

    // Custom Hook: Data Logic
    const {
        datosCobro, cobrosPorCartera, totalClientesDirecto, clientesPagados, multasPagadasDia
    } = useCollectionsData({
        clientes, searchTerm, fechaSeleccionada, fechaSeleccionadaStr, creditosInvalidos,
        prorrogasCuotas, clientesNoEncontradosPorFecha, hoy, ciudadSeleccionada,
        filtroK1, filtroK2, filtroK3, filtroPagosK1, filtroPagosK2, filtroPagosK3, ordenCobro
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

    return (
        <div className="space-y-6 pb-20">
            <CollectionsHeader
                {...nav} {...{ fechaSeleccionada, ciudadSeleccionada, setCiudadSeleccionada, esHoy, fechaSeleccionadaStr, stats: datosCobro.stats, totalClientesDirecto, clientesPagados, user }}
                onProrrogaGlobal={() => { setEsProrrogaGlobal(true); setDatosProrrogaPendiente({ clientes: [...cobrosPorCartera.K1, ...cobrosPorCartera.K2, ...cobrosPorCartera.K3, ...cobrosPorCartera.NoReportados] }); setModalProrrogaOpen(true); }}
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
                {ciudadSeleccionada === 'tuluá' && (
                    <div className="space-y-6">
                        <div className="bg-blue-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                            <Users className="h-8 w-8" />
                            <h2 className="text-2xl font-bold">Día de Cobro Tuluá</h2>
                        </div>
                        <CarteraSection title="Cartera K1" color={getCarteraColor('K1', carteras)} items={cobrosPorCartera.K1} typeFilter={filtroK1} setTypeFilter={setFiltroK1} isK1 onCambioOrden={handleActualizarOrdenManual} ordenFecha={ordenCobro[fechaSeleccionadaStr] || {}} onProrroga={(it) => { setEsProrrogaGlobal(false); setDatosProrrogaPendiente({ clienteId: it.clienteId, creditoId: it.creditoId, nroCuotas: it.nroCuotasPendientes }); setModalProrrogaOpen(true); }} abrirDetalle={abrirDetalle} actualizarCliente={actualizarCliente} toggleReportado={handleMarcarComoNoEncontrado} user={user} />
                        <CarteraSection title="Clientes no encontrados" isNoReportados items={cobrosPorCartera.NoReportados} onCambioOrden={handleActualizarOrdenManual} ordenFecha={ordenCobro[fechaSeleccionadaStr] || {}} onProrroga={(it) => { setEsProrrogaGlobal(false); setDatosProrrogaPendiente({ clienteId: it.clienteId, creditoId: it.creditoId, nroCuotas: it.nroCuotasPendientes }); setModalProrrogaOpen(true); }} abrirDetalle={abrirDetalle} actualizarCliente={actualizarCliente} toggleReportado={handleMarcarComoNoEncontrado} user={user} />
                        <CarteraSection title="Cartera K2" color={getCarteraColor('K2', carteras)} items={cobrosPorCartera.K2} typeFilter={filtroK2} setTypeFilter={setFiltroK2} isK2 onCambioOrden={handleActualizarOrdenManual} ordenFecha={ordenCobro[fechaSeleccionadaStr] || {}} onProrroga={(it) => { setEsProrrogaGlobal(false); setDatosProrrogaPendiente({ clienteId: it.clienteId, creditoId: it.creditoId, nroCuotas: it.nroCuotasPendientes }); setModalProrrogaOpen(true); }} abrirDetalle={abrirDetalle} actualizarCliente={actualizarCliente} toggleReportado={handleMarcarComoNoEncontrado} user={user} />
                    </div>
                )}

                {ciudadSeleccionada === 'buga' && (
                    <div className="space-y-6">
                        <div className="bg-orange-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
                            <Users className="h-8 w-8" />
                            <h2 className="text-2xl font-bold">Día de Cobro Buga</h2>
                        </div>
                        <CarteraSection title="Cartera K3" color={getCarteraColor('K3', carteras)} items={cobrosPorCartera.K3} typeFilter={filtroK3} setTypeFilter={setFiltroK3} isK3 onCambioOrden={handleActualizarOrdenManual} ordenFecha={ordenCobro[fechaSeleccionadaStr] || {}} onProrroga={(it) => { setEsProrrogaGlobal(false); setDatosProrrogaPendiente({ clienteId: it.clienteId, creditoId: it.creditoId, nroCuotas: it.nroCuotasPendientes }); setModalProrrogaOpen(true); }} abrirDetalle={abrirDetalle} actualizarCliente={actualizarCliente} toggleReportado={handleMarcarComoNoEncontrado} user={user} />
                        <CarteraSection title="Clientes no encontrados" isNoReportados items={cobrosPorCartera.NoReportados.filter(i => i.clienteCartera === 'K3')} onCambioOrden={handleActualizarOrdenManual} ordenFecha={ordenCobro[fechaSeleccionadaStr] || {}} onProrroga={(it) => { setEsProrrogaGlobal(false); setDatosProrrogaPendiente({ clienteId: it.clienteId, creditoId: it.creditoId, nroCuotas: it.nroCuotasPendientes }); setModalProrrogaOpen(true); }} abrirDetalle={abrirDetalle} actualizarCliente={actualizarCliente} toggleReportado={handleMarcarComoNoEncontrado} user={user} />
                    </div>
                )}

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

                {ciudadSeleccionada === 'tuluá' && (
                    <div className="space-y-6 mt-8 pt-8 border-t-2 border-gray-300">
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-600" /> Pagos Registrados
                        </h2>
                        <PagosSection title="Pagos K1" color="blue" items={clientesPagados.K1.items} total={clientesPagados.K1.total} typeFilter={filtroPagosK1} setTypeFilter={setFiltroPagosK1} isK1 abrirDetalle={abrirDetalle} />
                        <PagosSection title="Pagos K2" color="green" items={clientesPagados.K2.items} total={clientesPagados.K2.total} typeFilter={filtroPagosK2} setTypeFilter={setFiltroPagosK2} isK2 abrirDetalle={abrirDetalle} />
                    </div>
                )}

                {ciudadSeleccionada === 'buga' && (
                    <div className="space-y-6 mt-8 pt-8 border-t-2 border-gray-300">
                        <PagosSection title="Pagos K3" color="orange" items={clientesPagados.K3.items} total={clientesPagados.K3.total} typeFilter={filtroPagosK3} setTypeFilter={setFiltroPagosK3} isK3 abrirDetalle={abrirDetalle} />
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
