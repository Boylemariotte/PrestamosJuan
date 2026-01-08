import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, Search, Calendar as CalendarIcon, Plus, FileDown, Trash2, Edit, ArrowDownCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { totalMultasService } from '../services/api';

const TotalMultas = () => {
    const { user } = useAuth();
    const [multas, setMultas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [totalSum, setTotalSum] = useState(0);

    const [pagina, setPagina] = useState(1);
    const registrosPorPagina = 10;

    const [formData, setFormData] = useState({
        nombrePersona: '',
        valor: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
    });

    const fetchMultas = useCallback(async () => {
        try {
            setLoading(true);
            const response = await totalMultasService.obtenerTodas();
            if (response.success) {
                setMultas(response.data.map(m => ({ ...m, fecha: new Date(m.fecha) })));
                setTotalSum(response.totalSum);
            }
        } catch (error) {
            console.error('Error al cargar multas:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMultas();
    }, [fetchMultas]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            ...formData,
            valor: Number(formData.valor),
            fecha: new Date(formData.fecha + 'T12:00:00') // Avoid timezone issues
        };

        try {
            if (editingId) {
                const response = await totalMultasService.actualizar(editingId, data);
                if (response.success) {
                    fetchMultas(); // Refresh all to get updated totalSum
                }
                setEditingId(null);
            } else {
                const response = await totalMultasService.crear(data);
                if (response.success) {
                    fetchMultas(); // Refresh all to get updated totalSum
                }
            }

            setFormData({
                nombrePersona: '',
                valor: '',
                fecha: format(new Date(), 'yyyy-MM-dd'),
            });
            setShowForm(false);
        } catch (error) {
            console.error("Error guardando multa:", error);
            alert("Error guardando multa");
        }
    };

    const handleEdit = (multa) => {
        setFormData({
            nombrePersona: multa.nombrePersona,
            valor: multa.valor,
            fecha: format(multa.fecha, 'yyyy-MM-dd'),
        });
        setEditingId(multa.id || multa._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta multa?')) {
            try {
                const response = await totalMultasService.eliminar(id);
                if (response.success) {
                    fetchMultas();
                }
            } catch (error) {
                console.error("Error eliminando multa:", error);
                alert("Error eliminando multa");
            }
        }
    };

    const filteredAndSorted = useMemo(() => {
        return multas.filter(multa => {
            const matchesSearch = multa.nombrePersona.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDate = !dateFilter || format(multa.fecha, 'yyyy-MM-dd') === dateFilter;
            return matchesSearch && matchesDate;
        }).sort((a, b) => b.fecha - a.fecha);
    }, [multas, searchTerm, dateFilter]);

    const totalPaginas = Math.ceil(filteredAndSorted.length / registrosPorPagina);
    const indiceFinal = pagina * registrosPorPagina;
    const indiceInicial = indiceFinal - registrosPorPagina;
    const registrosPaginados = filteredAndSorted.slice(indiceInicial, indiceFinal);

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Total de Multas</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Registro y seguimiento histórico de multas aplicadas
                    </p>
                </div>

                <div className="mt-4 md:mt-0">
                    <button
                        onClick={() => {
                            setShowForm(true);
                            setEditingId(null);
                            setFormData({
                                nombrePersona: '',
                                valor: '',
                                fecha: format(new Date(), 'yyyy-MM-dd'),
                            });
                        }}
                        className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Multa
                    </button>
                </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border-2 border-red-200 mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <ArrowDownCircle className="h-6 w-6 text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-800">Suma Total de Multas</h2>
                </div>
                <div className="text-4xl font-bold text-red-700">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalSum)}
                </div>
                <p className="text-sm text-gray-600 mt-1">Acumulado total histórico registrado</p>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingId ? 'Editar Multa' : 'Nueva Multa'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Persona
                                </label>
                                <input
                                    type="text"
                                    name="nombrePersona"
                                    value={formData.nombrePersona}
                                    onChange={handleInputChange}
                                    placeholder="Nombre de quien fue la multa"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor
                                </label>
                                <input
                                    type="number"
                                    name="valor"
                                    value={formData.valor}
                                    onChange={handleInputChange}
                                    placeholder="Ej. 10000"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    required
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha
                                </label>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-slate-500 focus:border-slate-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
                            >
                                {editingId ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-slate-500 focus:border-slate-500"
                            placeholder="Buscar por nombre de persona..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="date"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-slate-500 focus:border-slate-500"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {registrosPaginados.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron multas</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Prueba a cambiar los filtros o agrega una nueva multa.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persona</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado por</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {registrosPaginados.map((multa) => (
                                        <tr key={multa.id || multa._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {format(multa.fecha, "PPP", { locale: es })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {multa.nombrePersona}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(multa.valor)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {multa.registradoPor?.nombre || 'S/N'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(multa)}
                                                    className="text-slate-600 hover:text-slate-900 mr-4"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(multa.id || multa._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPaginas > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                    Mostrando <span className="font-bold text-gray-900">{indiceInicial + 1}</span> a <span className="font-bold text-gray-900">{Math.min(indiceFinal, filteredAndSorted.length)}</span> de <span className="font-bold text-gray-900">{filteredAndSorted.length}</span> multas
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPagina(1)}
                                        disabled={pagina === 1}
                                        className="p-1 border border-gray-200 rounded hover:bg-white disabled:opacity-30"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setPagina(prev => Math.max(1, prev - 1))}
                                        disabled={pagina === 1}
                                        className="p-1 border border-gray-200 rounded hover:bg-white disabled:opacity-30"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-xs font-medium px-2">
                                        {pagina} / {totalPaginas}
                                    </span>
                                    <button
                                        onClick={() => setPagina(prev => Math.min(totalPaginas, prev + 1))}
                                        disabled={pagina === totalPaginas}
                                        className="p-1 border border-gray-200 rounded hover:bg-white disabled:opacity-30"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setPagina(totalPaginas)}
                                        disabled={pagina === totalPaginas}
                                        className="p-1 border border-gray-200 rounded hover:bg-white disabled:opacity-30"
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TotalMultas;
