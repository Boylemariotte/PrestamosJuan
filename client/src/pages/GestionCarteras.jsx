import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Search, Edit2, Trash2, Save, X,
    MapPin, Hash, Palette, Layout as LayoutIcon,
    CheckCircle2, AlertCircle, ChevronDown, MoveUp, MoveDown
} from 'lucide-react';

const GestionCarteras = () => {
    const {
        carteras,
        agregarCartera,
        actualizarCartera,
        eliminarCartera,
        eliminarCarteraPermanente,
        restaurarCartera,
        loading
    } = useApp();
    const { user } = useAuth();
    const [view, setView] = useState('active'); // 'active' or 'inactive'

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCartera, setEditingCartera] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        ciudad: 'Tuluá',
        orden: 1,
        color: 'blue',
        secciones: [
            { titulo: 'Semanal', nombreInterno: 'semanal', capacidad: 150, tiposPagoPermitidos: ['semanal'] },
            { titulo: 'Quincenal/Mensual', nombreInterno: 'quincenalMensual', capacidad: 150, tiposPagoPermitidos: ['quincenal', 'mensual'] }
        ]
    });

    const carterasFiltradas = useMemo(() => {
        if (!carteras) return [];
        return carteras.filter(c => {
            const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.ciudad.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesView = view === 'active' ? c.activa !== false : c.activa === false;
            return matchesSearch && matchesView;
        }).sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }, [carteras, searchTerm, view]);

    const handleOpenModal = (cartera = null) => {
        if (cartera) {
            setEditingCartera(cartera);
            setFormData({
                nombre: cartera.nombre,
                ciudad: cartera.ciudad,
                orden: cartera.orden || 1,
                color: cartera.color || 'blue',
                secciones: cartera.secciones?.length > 0 ? [...cartera.secciones] : [
                    { titulo: 'Semanal', nombreInterno: 'semanal', capacidad: 150, tiposPagoPermitidos: ['semanal'] },
                    { titulo: 'Quincenal/Mensual', nombreInterno: 'quincenalMensual', capacidad: 150, tiposPagoPermitidos: ['quincenal', 'mensual'] }
                ]
            });
        } else {
            setEditingCartera(null);
            setFormData({
                nombre: '',
                ciudad: 'Tuluá',
                orden: carteras.length + 1,
                color: 'blue',
                secciones: [
                    { titulo: 'Semanal', nombreInterno: 'semanal', capacidad: 150, tiposPagoPermitidos: ['semanal'] },
                    { titulo: 'Quincenal/Mensual', nombreInterno: 'quincenalMensual', capacidad: 150, tiposPagoPermitidos: ['quincenal', 'mensual'] }
                ]
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCartera(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSeccionChange = (index, field, value) => {
        const newSecciones = [...formData.secciones];
        newSecciones[index][field] = value;
        setFormData(prev => ({ ...prev, secciones: newSecciones }));
    };

    const handleTogglePago = (secIndex, tipo) => {
        const newSecciones = [...formData.secciones];
        const tipos = newSecciones[secIndex].tiposPagoPermitidos;
        if (tipos.includes(tipo)) {
            newSecciones[secIndex].tiposPagoPermitidos = tipos.filter(t => t !== tipo);
        } else {
            newSecciones[secIndex].tiposPagoPermitidos = [...tipos, tipo];
        }
        setFormData(prev => ({ ...prev, secciones: newSecciones }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCartera) {
                await actualizarCartera(editingCartera._id, formData);
            } else {
                await agregarCartera(formData);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error guardando cartera:', error);
            alert('Error al guardar la cartera');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas desactivar esta cartera?')) {
            try {
                await eliminarCartera(id);
            } catch (error) {
                console.error('Error desactivando cartera:', error);
            }
        }
    };

    const handlePermanentDelete = async (id) => {
        if (window.confirm('¿ESTÁS SEGURO? Esta acción eliminará permanentemente la cartera de la base de datos y no se puede deshacer.')) {
            try {
                await eliminarCarteraPermanente(id);
            } catch (error) {
                console.error('Error eliminando permanentemente:', error);
            }
        }
    };

    const handleRestore = async (id) => {
        if (window.confirm('¿Deseas restaurar esta cartera?')) {
            try {
                await restaurarCartera(id);
                setView('active');
            } catch (error) {
                console.error('Error restaurando:', error);
            }
        }
    };

    const colorOptions = [
        { label: 'Slate', value: 'slate', bg: 'bg-slate-500' },
        { label: 'Gray', value: 'gray', bg: 'bg-gray-500' },
        { label: 'Red', value: 'red', bg: 'bg-red-500' },
        { label: 'Orange', value: 'orange', bg: 'bg-orange-500' },
        { label: 'Amber', value: 'amber', bg: 'bg-amber-500' },
        { label: 'Yellow', value: 'yellow', bg: 'bg-yellow-500' },
        { label: 'Lime', value: 'lime', bg: 'bg-lime-500' },
        { label: 'Green', value: 'green', bg: 'bg-green-500' },
        { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-500' },
        { label: 'Teal', value: 'teal', bg: 'bg-teal-500' },
        { label: 'Cyan', value: 'cyan', bg: 'bg-cyan-500' },
        { label: 'Sky', value: 'sky', bg: 'bg-sky-500' },
        { label: 'Blue', value: 'blue', bg: 'bg-blue-500' },
        { label: 'Indigo', value: 'indigo', bg: 'bg-indigo-500' },
        { label: 'Violet', value: 'violet', bg: 'bg-violet-500' },
        { label: 'Purple', value: 'purple', bg: 'bg-purple-500' },
        { label: 'Fuchsia', value: 'fuchsia', bg: 'bg-fuchsia-500' },
        { label: 'Pink', value: 'pink', bg: 'bg-pink-500' },
        { label: 'Rose', value: 'rose', bg: 'bg-rose-500' },
    ];

    // Helper to get row color classes based on color name
    const getRowColorClass = (color) => {
        const colors = {
            slate: 'bg-slate-100 hover:bg-slate-200',
            gray: 'bg-gray-100 hover:bg-gray-200',
            red: 'bg-red-100 hover:bg-red-200',
            orange: 'bg-orange-100 hover:bg-orange-200',
            amber: 'bg-amber-100 hover:bg-amber-200',
            yellow: 'bg-yellow-100 hover:bg-yellow-200',
            lime: 'bg-lime-100 hover:bg-lime-200',
            green: 'bg-green-100 hover:bg-green-200',
            emerald: 'bg-emerald-100 hover:bg-emerald-200',
            teal: 'bg-teal-100 hover:bg-teal-200',
            cyan: 'bg-cyan-100 hover:bg-cyan-200',
            sky: 'bg-sky-100 hover:bg-sky-200',
            blue: 'bg-blue-100 hover:bg-blue-200',
            indigo: 'bg-indigo-100 hover:bg-indigo-200',
            violet: 'bg-violet-100 hover:bg-violet-200',
            purple: 'bg-purple-100 hover:bg-purple-200',
            fuchsia: 'bg-fuchsia-100 hover:bg-fuchsia-200',
            pink: 'bg-pink-100 hover:bg-pink-200',
            rose: 'bg-rose-100 hover:bg-rose-200',
        };
        return colors[color] || 'hover:bg-gray-50';
    };

    // Helper for indicator color
    const getIndicatorClass = (color) => {
        const colors = {
            slate: 'bg-slate-500 shadow-slate-200',
            gray: 'bg-gray-500 shadow-gray-200',
            red: 'bg-red-500 shadow-red-200',
            orange: 'bg-orange-500 shadow-orange-200',
            amber: 'bg-amber-500 shadow-amber-200',
            yellow: 'bg-yellow-500 shadow-yellow-200',
            lime: 'bg-lime-500 shadow-lime-200',
            green: 'bg-green-500 shadow-green-200',
            emerald: 'bg-emerald-500 shadow-emerald-200',
            teal: 'bg-teal-500 shadow-teal-200',
            cyan: 'bg-cyan-500 shadow-cyan-200',
            sky: 'bg-sky-500 shadow-sky-200',
            blue: 'bg-blue-500 shadow-blue-200',
            indigo: 'bg-indigo-500 shadow-indigo-200',
            violet: 'bg-violet-500 shadow-violet-200',
            purple: 'bg-purple-500 shadow-purple-200',
            fuchsia: 'bg-fuchsia-500 shadow-fuchsia-200',
            pink: 'bg-pink-500 shadow-pink-200',
            rose: 'bg-rose-500 shadow-rose-200',
        };
        return colors[color] || 'bg-gray-500 shadow-gray-200';
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <LayoutIcon className="h-8 w-8 text-slate-800" />
                        Gestión de Carteras
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Configura las zonas de trabajo y capacidades del sistema</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-200/50 p-1 rounded-xl">
                        <button
                            onClick={() => setView('active')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'active' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Activas
                        </button>
                        <button
                            onClick={() => setView('inactive')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'inactive' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Inactivas
                        </button>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        Nueva Cartera
                    </button>
                </div>
            </div>

            {/* Stats Cards (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                            {view === 'active' ? 'Carteras Activas' : 'Carteras Inactivas'}
                        </p>
                        <p className="text-3xl font-black text-slate-800">
                            {carteras?.filter(c => view === 'active' ? c.activa !== false : c.activa === false).length || 0}
                        </p>
                    </div>
                    <div className={`p-4 rounded-2xl ${view === 'active' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
                        <LayoutIcon className="h-8 w-8" />
                    </div>
                </div>
                {/* Agregaremos más stats si es necesario */}
            </div>

            {/* Search & List */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <table className="min-w-full border-collapse">
                    <thead className="bg-[#1e293b] text-white">
                        <tr>
                            <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">Orden</th>
                            <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">Nombre</th>
                            <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">Ciudad</th>
                            <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">Configuración</th>
                            <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest text-slate-300">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {carterasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <LayoutIcon className="h-12 w-12 opacity-20" />
                                        <p className="font-medium italic">No se encontraron carteras</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            carterasFiltradas.map((cartera) => {
                                const rowColorClass = getRowColorClass(cartera.color);

                                return (
                                    <tr key={cartera._id} className={`transition-colors border-b border-white ${rowColorClass}`}>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-black">
                                            #{cartera.orden || 0}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${getIndicatorClass(cartera.color)}`}></div>
                                                <span className="font-bold text-gray-900">{cartera.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                                                <MapPin className="h-4 w-4" />
                                                {cartera.ciudad}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-2">
                                                {cartera.secciones?.map((sec, idx) => (
                                                    <div key={idx} className="bg-white/50 border border-black/5 px-3 py-1 rounded-lg">
                                                        <p className="text-[10px] font-black text-gray-500 uppercase leading-none mb-1">{sec.titulo || sec.nombre}</p>
                                                        <p className="text-xs font-bold text-gray-700">Cap: {sec.capacidad}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {view === 'active' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenModal(cartera)}
                                                            className="p-2 text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg shadow-sm transition-all border border-transparent hover:border-gray-100"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(cartera._id)}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Desactivar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestore(cartera._id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
                                                            title="Restaurar"
                                                        >
                                                            <Plus className="h-4 w-4" /> Restaurar
                                                        </button>
                                                        <button
                                                            onClick={() => handlePermanentDelete(cartera._id)}
                                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
                                                            title="Eliminar permanentemente"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Eliminar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-800 p-6 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                {editingCartera ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                {editingCartera ? 'Editar Cartera' : 'Nueva Cartera'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
                            {/* Basic Info Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Nombre de Cartera</label>
                                    <div className="relative">
                                        <LayoutIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="nombre"
                                            required
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            placeholder="Ej: K1, K4, Norte..."
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-slate-800 focus:bg-white rounded-2xl transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Ciudad</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <select
                                            name="ciudad"
                                            value={formData.ciudad}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-transparent focus:border-slate-800 focus:bg-white rounded-2xl transition-all font-bold text-slate-800 appearance-none"
                                        >
                                            <option value="Tuluá">Tuluá</option>
                                            <option value="Guadalajara de Buga">Guadalajara de Buga</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Order & Color Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Orden de Visualización</label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="number"
                                            name="orden"
                                            value={formData.orden}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-slate-800 focus:bg-white rounded-2xl transition-all font-bold text-slate-800"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 px-2 font-medium italic">
                                            * Define la posición en que aparece esta cartera en las listas.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Color Distintivo</label>
                                    <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                                        {colorOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, color: opt.value }))}
                                                className={`h-8 w-8 rounded-full transition-all flex items-center justify-center ${opt.bg} ${formData.color === opt.value ? 'ring-4 ring-slate-800/20 scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                                                title={opt.label}
                                            >
                                                {formData.color === opt.value && <CheckCircle2 className="h-4 w-4 text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sections Config */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Secciones y Capacidades</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            secciones: [...prev.secciones, { titulo: 'Nueva Sección', nombreInterno: 'seccion' + (prev.secciones.length + 1), capacidad: 100, tiposPagoPermitidos: [] }]
                                        }))}
                                        className="text-xs font-bold text-slate-800 hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="h-3 w-3" /> Añadir Sección
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.secciones.map((sec, sIdx) => (
                                        <div key={sIdx} className="p-6 bg-slate-50/80 rounded-3xl border-2 border-dashed border-slate-200 space-y-6 relative group/sec">
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, secciones: prev.secciones.filter((_, i) => i !== sIdx) }))}
                                                className="absolute -top-3 -right-3 h-8 w-8 bg-white border border-rose-100 text-rose-500 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/sec:opacity-100 transition-all hover:bg-rose-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={sec.titulo}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const slug = val.toLowerCase().replace(/\s+/g, '');
                                                            const newSecs = [...formData.secciones];
                                                            newSecs[sIdx].titulo = val;
                                                            newSecs[sIdx].nombreInterno = slug;
                                                            setFormData(p => ({ ...p, secciones: newSecs }));
                                                        }}
                                                        placeholder="Nombre Sección (Ej: Semanal)"
                                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-slate-800 transition-all"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black text-slate-400 uppercase">Capacidad:</span>
                                                    <input
                                                        type="number"
                                                        value={sec.capacidad}
                                                        onChange={(e) => handleSeccionChange(sIdx, 'capacidad', parseInt(e.target.value))}
                                                        className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pagos Permitidos</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {['diario', 'semanal', 'quincenal', 'mensual'].map(tipo => (
                                                        <button
                                                            key={tipo}
                                                            type="button"
                                                            onClick={() => handleTogglePago(sIdx, tipo)}
                                                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border-2 ${sec.tiposPagoPermitidos.includes(tipo)
                                                                ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            {tipo}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:shadow-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    {editingCartera ? 'Actualizar Cartera' : 'Crear Cartera'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionCarteras;
