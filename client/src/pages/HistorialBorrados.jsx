import React, { useState, useEffect, useMemo } from 'react';
import { History, Trash2, Search, Filter, Calendar as CalendarIcon, ArrowRight, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatearFechaCompleta } from '../utils/dateUtils';
import api from '../services/api';

const HistorialBorrados = () => {
    const { user } = useAuth();
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);
    const registrosPorPagina = 10;

    const fetchHistorial = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filtroTipo) params.append('tipo', filtroTipo);

            const response = await api.get(`/historial-borrados?${params.toString()}`);
            if (response.success) {
                setHistorial(response.data);
            }
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
                setHistorial(prev => prev.filter(reg => reg._id !== id));
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
                setHistorial([]);
            }
        } catch (error) {
            console.error("Error al vaciar historial:", error);
            alert("Error al vaciar el historial. Verifica que tengas permisos de CEO.");
        }
    };

    useEffect(() => {
        fetchHistorial();
        setPaginaActual(1);
    }, [filtroTipo]);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda]);

    const historialFiltrado = useMemo(() => {
        let filtrados = historial.filter(reg => {
            const query = busqueda.toLowerCase();
            return (
                reg.usuarioNombre?.toLowerCase().includes(query) ||
                reg.tipo?.toLowerCase().includes(query) ||
                reg.metadata?.nombreItem?.toLowerCase().includes(query) ||
                reg.idOriginal?.toLowerCase().includes(query) ||
                JSON.stringify(reg.detalles).toLowerCase().includes(query)
            );
        });

        // Ordenar por fecha de borrado (más reciente primero)
        return filtrados.sort((a, b) => new Date(b.fechaBorrado) - new Date(a.fechaBorrado));
    }, [historial, busqueda]);

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
                        <h1 className="text-2xl font-bold">Historial de Borrados</h1>
                        <p className="text-slate-300 text-sm">
                            Registro de elementos eliminados del sistema
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
                            placeholder="Buscar por nombre, ID o detalles..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="cliente">Clientes</option>
                            <option value="credito">Créditos</option>
                            <option value="nota">Notas</option>
                            <option value="abono">Abonos</option>
                            <option value="multa">Multas</option>
                            <option value="movimiento-caja">Caja</option>
                        </select>
                        <button
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de que quieres VACIAR TODO el historial? Esta acción no se puede deshacer.')) {
                                    handleVaciarHistorial();
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-bold"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Eliminar todo</span>
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
                            <Trash2 className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No hay registros</h3>
                        <p className="text-gray-500">
                            {busqueda ? 'No hay resultados para tu búsqueda.' : 'Aún no se han registrado eliminaciones o no hay coincidencias con los filtros.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-white uppercase bg-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Detalles</th>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {registrosPaginados.map((reg) => (
                                    <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {formatearFechaCompleta(reg.fechaBorrado)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${reg.tipo === 'cliente' ? 'bg-blue-100 text-blue-700' :
                                                reg.tipo === 'credito' ? 'bg-purple-100 text-purple-700' :
                                                    reg.tipo === 'nota' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {reg.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 font-medium">
                                                    {reg.tipo === 'nota' ? (
                                                        <>
                                                            <div className="font-bold text-slate-700">
                                                                {reg.metadata?.nombreCliente ? `Cliente: ${reg.metadata.nombreCliente}` : (reg.metadata?.nombreItem || reg.idOriginal)}
                                                            </div>
                                                            <div className="text-gray-600 text-xs italic mt-1">
                                                                Nota: "{reg.metadata?.textoNota || reg.detalles?.texto || 'Sin texto'}"
                                                            </div>
                                                        </>
                                                    ) : reg.tipo === 'credito' ? (
                                                        <>
                                                            <div className="font-bold text-slate-700">
                                                                {reg.metadata?.nombreCliente ? `Cliente: ${reg.metadata.nombreCliente}` : (reg.metadata?.nombreItem || reg.idOriginal)}
                                                            </div>
                                                            <div className="text-indigo-600 text-xs font-bold mt-1">
                                                                Crédito por: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(reg.metadata?.monto || reg.detalles?.monto || 0)}
                                                            </div>
                                                        </>
                                                    ) : reg.tipo === 'abono' ? (
                                                        <>
                                                            <div className="font-bold text-slate-700">
                                                                {reg.metadata?.nombreCliente ? `Cliente: ${reg.metadata.nombreCliente}` : 'Abono'}
                                                            </div>
                                                            <div className="text-green-600 text-xs font-bold mt-1">
                                                                Valor abono: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(reg.metadata?.valorAbono || reg.detalles?.valor || 0)}
                                                            </div>
                                                        </>
                                                    ) : reg.tipo === 'multa' ? (
                                                        <>
                                                            <div className="font-bold text-slate-700">
                                                                {reg.metadata?.nombreCliente ? `Cliente: ${reg.metadata.nombreCliente}` : 'Multa'}
                                                            </div>
                                                            <div className="text-orange-600 text-xs font-bold mt-1">
                                                                Valor multa: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(reg.metadata?.valorMulta || reg.detalles?.valor || 0)}
                                                            </div>
                                                        </>
                                                    ) : reg.tipo === 'cliente' ? (
                                                        <>
                                                            <div className="font-bold text-slate-700">
                                                                {reg.metadata?.nombreItem || reg.detalles?.nombre || 'Desconocido'}
                                                            </div>
                                                            <div className="text-blue-600 text-[10px] mt-1">
                                                                Documento: {reg.metadata?.documento || reg.detalles?.documento || 'N/A'}
                                                            </div>
                                                        </>
                                                    ) : reg.tipo === 'movimiento-caja' ? (
                                                        <>
                                                            <span>{reg.metadata?.nombreItem || 'Sin descripción'}</span>
                                                            {reg.metadata?.motivo && (
                                                                <span className="text-red-600 font-bold ml-2 italic">
                                                                    - Motivo: {reg.metadata.motivo}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        reg.metadata?.nombreItem || reg.idOriginal
                                                    )}
                                                </span>
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

                                            <button
                                                onClick={() => {
                                                    if (window.confirm('¿Eliminar este registro permanentemente del historial?')) {
                                                        handleEliminarRegistro(reg._id);
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-800 font-medium ml-4 transition-colors"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
