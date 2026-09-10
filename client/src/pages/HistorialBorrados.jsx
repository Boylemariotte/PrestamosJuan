import React, { useState, useEffect, useMemo } from 'react';
import { History, Trash2, Search, Calendar as CalendarIcon, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Pencil, Power, PowerOff, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatearFechaCompleta } from '../utils/dateUtils';
import api from '../services/api';

const formatoMoneda = (valor) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor || 0);

// Config visual por categoría unificada (eliminaciones vienen de HistorialBorrado, el resto de HistorialAccion)
const CONFIG_CATEGORIA = {
    eliminar: { label: 'Eliminado', clase: 'bg-red-100 text-red-700', Icono: Trash2 },
    crear: { label: 'Creado', clase: 'bg-green-100 text-green-700', Icono: Plus },
    editar: { label: 'Editado', clase: 'bg-amber-100 text-amber-700', Icono: Pencil },
    activar: { label: 'Activado', clase: 'bg-teal-100 text-teal-700', Icono: Power },
    desactivar: { label: 'Desactivado', clase: 'bg-slate-200 text-slate-700', Icono: PowerOff },
    renovar: { label: 'Renovado', clase: 'bg-indigo-100 text-indigo-700', Icono: RefreshCw }
};

const ETIQUETA_ENTIDAD = {
    cliente: 'Cliente', credito: 'Crédito', nota: 'Nota', abono: 'Abono', abonoMulta: 'Abono a multa',
    multa: 'Multa', descuento: 'Descuento', 'movimiento-caja': 'Caja', visita: 'Visita'
};

const HistorialBorrados = () => {
    const { user } = useAuth();
    const [borrados, setBorrados] = useState([]);
    const [acciones, setAcciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const registrosPorPagina = 10;

    const fetchHistorial = async () => {
        try {
            setLoading(true);
            const [resBorrados, resAcciones] = await Promise.all([
                api.get('/historial-borrados'),
                api.get('/historial-acciones?limit=200')
            ]);
            if (resBorrados.success) setBorrados(resBorrados.data);
            if (resAcciones.success) setAcciones(resAcciones.data);
        } catch (error) {
            console.error("Error al cargar historial:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminarRegistro = async (id) => {
        try {
            const response = await api.delete(`/historial-borrados/${id}`);
            if (response.success) {
                setBorrados(prev => prev.filter(reg => reg._id !== id));
            }
        } catch (error) {
            console.error("Error al eliminar registro:", error);
            alert("Error al eliminar el registro.");
        }
    };

    const handleVaciarHistorial = async () => {
        try {
            const response = await api.delete('/historial-borrados');
            if (response.success) {
                setBorrados([]);
            }
        } catch (error) {
            console.error("Error al vaciar historial:", error);
            alert("Error al vaciar el historial. Verifica que tengas permisos de CEO.");
        }
    };

    useEffect(() => {
        fetchHistorial();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, filtroCategoria]);

    // Unifica ambas fuentes en una sola lista con la misma forma para renderizar
    const historialUnificado = useMemo(() => {
        const deBorrados = borrados.map(reg => ({
            _id: reg._id,
            fecha: reg.fechaBorrado,
            categoria: 'eliminar',
            entidad: reg.tipo,
            tituloPrincipal: reg.metadata?.nombreCliente || reg.metadata?.nombreItem || reg.detalles?.nombre || reg.idOriginal,
            detalleSecundario: reg.tipo === 'nota' ? `Nota: "${reg.metadata?.textoNota || reg.detalles?.texto || 'Sin texto'}"`
                : reg.tipo === 'credito' ? `Crédito por: ${formatoMoneda(reg.metadata?.monto || reg.detalles?.monto)}`
                : reg.tipo === 'abono' ? `Valor abono: ${formatoMoneda(reg.metadata?.valorAbono || reg.detalles?.valor)}`
                : reg.tipo === 'multa' ? `Valor multa: ${formatoMoneda(reg.metadata?.valorMulta || reg.detalles?.valor)}`
                : reg.tipo === 'cliente' ? `Documento: ${reg.metadata?.documento || reg.detalles?.documento || 'N/A'}`
                : reg.tipo === 'movimiento-caja' ? (reg.metadata?.motivo ? `Motivo: ${reg.metadata.motivo}` : 'Sin descripción')
                : null,
            usuarioNombre: reg.usuarioNombre,
            permiteEliminarRegistro: true,
            idBorrado: reg._id
        }));

        const deAcciones = acciones.map(reg => ({
            _id: reg._id,
            fecha: reg.createdAt,
            categoria: reg.accion,
            entidad: reg.entidad,
            tituloPrincipal: reg.clienteNombre || reg.entidadId,
            detalleSecundario: reg.descripcion,
            usuarioNombre: reg.usuarioNombre,
            permiteEliminarRegistro: false
        }));

        return [...deBorrados, ...deAcciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [borrados, acciones]);

    const historialFiltrado = useMemo(() => {
        return historialUnificado.filter(reg => {
            if (filtroCategoria && reg.categoria !== filtroCategoria) return false;
            const query = busqueda.toLowerCase();
            if (!query) return true;
            return (
                reg.usuarioNombre?.toLowerCase().includes(query) ||
                reg.entidad?.toLowerCase().includes(query) ||
                reg.tituloPrincipal?.toLowerCase().includes(query) ||
                reg.detalleSecundario?.toLowerCase().includes(query)
            );
        });
    }, [historialUnificado, busqueda, filtroCategoria]);

    // Lógica de paginación
    const totalPaginas = Math.ceil(historialFiltrado.length / registrosPorPagina);
    const indiceFinal = paginaActual * registrosPorPagina;
    const indiceInicial = indiceFinal - registrosPorPagina;
    const registrosPaginados = historialFiltrado.slice(indiceInicial, indiceFinal);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-lg flex-shrink-0">
                        <History className="h-8 w-8 text-blue-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Historial</h1>
                        <p className="text-slate-300 text-sm">
                            Creaciones, ediciones, activaciones, renovaciones y eliminaciones del sistema
                        </p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, usuario o detalles..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                        >
                            <option value="">Todas las acciones</option>
                            <option value="crear">Creaciones</option>
                            <option value="editar">Ediciones</option>
                            <option value="renovar">Renovaciones</option>
                            <option value="activar">Activaciones</option>
                            <option value="desactivar">Desactivaciones</option>
                            <option value="eliminar">Eliminaciones</option>
                        </select>
                        <button
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de que quieres VACIAR el historial de ELIMINACIONES? Esta acción no se puede deshacer. (Las creaciones, ediciones y demás acciones no se ven afectadas.)')) {
                                    handleVaciarHistorial();
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-bold"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Vaciar eliminaciones</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla / Lista */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Cargando registros...</p>
                    </div>
                ) : historialFiltrado.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No hay registros</h3>
                        <p className="text-gray-500">
                            {busqueda ? 'No hay resultados para tu búsqueda.' : 'Aún no se han registrado acciones o no hay coincidencias con los filtros.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-white uppercase bg-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Acción</th>
                                    <th className="px-6 py-4">Detalles</th>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4 text-center">Opciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {registrosPaginados.map((reg) => {
                                    const config = CONFIG_CATEGORIA[reg.categoria] || CONFIG_CATEGORIA.editar;
                                    const Icono = config.Icono;
                                    return (
                                        <tr key={`${reg.categoria}-${reg._id}`} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {formatearFechaCompleta(reg.fecha)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${config.clase}`}>
                                                    <Icono className="h-3 w-3" />
                                                    {config.label} · {ETIQUETA_ENTIDAD[reg.entidad] || reg.entidad}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">
                                                        {reg.tituloPrincipal || 'Desconocido'}
                                                    </span>
                                                    {reg.detalleSecundario && (
                                                        <span className="text-gray-600 text-xs mt-1">
                                                            {reg.detalleSecundario}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                                                        <User className="h-3 w-3 text-slate-500" />
                                                    </div>
                                                    <span className="text-sm text-gray-600">{reg.usuarioNombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {reg.permiteEliminarRegistro ? (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('¿Eliminar este registro permanentemente del historial?')) {
                                                                handleEliminarRegistro(reg.idBorrado);
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-800 font-medium transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Paginación */}
            {!loading && totalPaginas > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500">
                        Mostrando <span className="font-bold text-gray-900">{indiceInicial + 1}</span> a <span className="font-bold text-gray-900">{Math.min(indiceFinal, historialFiltrado.length)}</span> de <span className="font-bold text-gray-900">{historialFiltrado.length}</span> registros
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPaginaActual(1)}
                            disabled={paginaActual === 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                            disabled={paginaActual === 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1 px-4 text-sm font-medium">
                            <span>Página</span>
                            <span className="bg-blue-600 text-white px-2 py-1 rounded min-w-[28px] text-center">{paginaActual}</span>
                            <span>de {totalPaginas}</span>
                        </div>

                        <button
                            onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setPaginaActual(totalPaginas)}
                            disabled={paginaActual === totalPaginas}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorialBorrados;
