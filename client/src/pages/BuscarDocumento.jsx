import React, { useState, useCallback } from 'react';
import { Search, AlertTriangle, User, FileText, Trash2, Calendar, MapPin, Phone, Archive, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatearFechaCompleta } from '../utils/dateUtils';

const BuscarDocumento = () => {
    const [documento, setDocumento] = useState('');
    const [loading, setLoading] = useState(false);
    const [historial, setHistorial] = useState(null);
    const [error, setError] = useState('');
    const [buscado, setBuscado] = useState(false);

    const buscarHistorial = useCallback(async () => {
        if (!documento || documento.length < 3) {
            setError('Ingresa al menos 3 caracteres');
            return;
        }

        setLoading(true);
        setError('');
        setBuscado(true);

        try {
            const response = await api.get(`/clientes/historial-documento/${documento}`);
            if (response.success) {
                setHistorial(response.data);
            } else {
                setError('Error al buscar historial');
            }
        } catch (err) {
            console.error('Error al buscar:', err);
            setError('Error al realizar la búsqueda');
        } finally {
            setLoading(false);
        }
    }, [documento]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            buscarHistorial();
        }
    };

    const getEtiquetaColor = (etiqueta) => {
        switch (etiqueta) {
            case 'vetado':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'perdido':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'excelente':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'bueno':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'atrasado':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'incompleto':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-lg flex-shrink-0">
                        <Search className="h-8 w-8 text-blue-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Buscar por Documento</h1>
                        <p className="text-slate-300 text-sm">
                            Consulta el historial completo de un número de cédula
                        </p>
                    </div>
                </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Número de Documento (Cédula)
                </label>
                <div className="flex gap-3">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Ej: 1234567890"
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                            value={documento}
                            onChange={(e) => setDocumento(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </div>
                    <button
                        onClick={buscarHistorial}
                        disabled={loading || documento.length < 3}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                            <Search className="h-5 w-5" />
                        )}
                        <span>Buscar</span>
                    </button>
                </div>
                {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
            </div>

            {/* Resultados */}
            {buscado && !loading && historial && (
                <>
                    {/* Alertas importantes */}
                    {historial.hayVetados && (
                        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                            <div className="bg-red-500 p-3 rounded-lg">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-red-700">⚠️ CLIENTE VETADO</h3>
                                <p className="text-red-600 text-sm">
                                    Este documento tiene un cliente marcado como VETADO. Procede con precaución.
                                </p>
                            </div>
                        </div>
                    )}

                    {historial.hayPerdidos && (
                        <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-4 flex items-center gap-4">
                            <div className="bg-orange-400 p-3 rounded-lg">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-orange-700">Cliente Perdido</h3>
                                <p className="text-orange-600 text-sm">
                                    Este documento tiene un cliente marcado como PERDIDO.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Resumen */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen del Historial</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-slate-50 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-slate-800">{historial.resumen.totalClientes}</p>
                                <p className="text-xs text-slate-500 font-medium">Clientes encontrados</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-green-600">{historial.resumen.clientesActivos}</p>
                                <p className="text-xs text-green-600 font-medium">Activos</p>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-amber-600">{historial.resumen.clientesArchivados}</p>
                                <p className="text-xs text-amber-600 font-medium">Archivados</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-red-600">{historial.resumen.vecesBorrado}</p>
                                <p className="text-xs text-red-600 font-medium">Eliminados</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                <p className="text-2xl font-bold text-blue-600">{historial.resumen.totalNotas}</p>
                                <p className="text-xs text-blue-600 font-medium">Notas totales</p>
                            </div>
                        </div>
                    </div>

                    {/* Sin historial */}
                    {!historial.tieneHistorial && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Sin historial</h3>
                            <p className="text-gray-500">
                                No se encontraron registros para el documento "{documento}"
                            </p>
                        </div>
                    )}

                    {/* Clientes encontrados */}
                    {historial.clientes.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />
                                    Clientes Encontrados ({historial.clientes.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {historial.clientes.map((cliente) => (
                                    <div key={cliente._id} className="p-6">
                                        {/* Info del cliente */}
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${cliente.esArchivado ? 'bg-amber-100' : 'bg-blue-100'}`}>
                                                    {cliente.esArchivado ? (
                                                        <Archive className="h-6 w-6 text-amber-600" />
                                                    ) : (
                                                        <User className="h-6 w-6 text-blue-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{cliente.nombre}</h3>
                                                    <p className="text-sm text-gray-500">Doc: {cliente.documento}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getEtiquetaColor(cliente.etiqueta)}`}>
                                                            {cliente.etiqueta?.toUpperCase() || 'SIN ETIQUETA'}
                                                        </span>
                                                        {cliente.esArchivado && (
                                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                                                ARCHIVADO
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                                            Cartera {cliente.cartera}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Link
                                                    to={cliente.esArchivado ? `/archivados/cliente/${cliente._id}` : `/cliente/${cliente._id}`}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    Ver cliente
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Detalles */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                                            {cliente.telefono && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    <span>{cliente.telefono}</span>
                                                </div>
                                            )}
                                            {cliente.direccion && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <span className="truncate">{cliente.direccion}</span>
                                                </div>
                                            )}
                                            {cliente.fechaCreacion && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span>Creado: {formatearFechaCompleta(cliente.fechaCreacion)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info créditos */}
                                        <div className="bg-slate-50 rounded-lg p-3 mb-4">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-bold text-gray-900">{cliente.totalCreditos}</span> créditos registrados
                                            </p>
                                        </div>

                                        {/* Notas de créditos */}
                                        {cliente.notasCreditos.length > 0 && (
                                            <div className="border-t border-gray-100 pt-4">
                                                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-amber-500" />
                                                    Notas de Créditos ({cliente.notasCreditos.length})
                                                </h4>
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    {cliente.notasCreditos.map((nota, idx) => (
                                                        <div key={idx} className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                                                            <p className="text-gray-800 text-sm">{nota.texto}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Crédito #{nota.creditoIndex} ({nota.creditoTipo}) - {formatearFechaCompleta(nota.fecha)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Historial de borrados */}
                    {historial.borrados.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                                <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                                    <Trash2 className="h-5 w-5" />
                                    Clientes Eliminados Anteriormente ({historial.borrados.length})
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {historial.borrados.map((borrado, idx) => (
                                    <div key={idx} className="p-4 flex items-center gap-4">
                                        <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                            <Trash2 className="h-5 w-5 text-red-500" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-gray-900">{borrado.nombreOriginal}</p>
                                            <p className="text-sm text-gray-500">Doc: {borrado.documentoOriginal}</p>
                                            {borrado.etiquetaOriginal && (
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${getEtiquetaColor(borrado.etiquetaOriginal)}`}>
                                                    {borrado.etiquetaOriginal.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="text-gray-500">Eliminado por:</p>
                                            <p className="font-medium text-gray-700">{borrado.usuarioBorrado}</p>
                                            <p className="text-xs text-gray-400">{formatearFechaCompleta(borrado.fechaBorrado)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BuscarDocumento;
