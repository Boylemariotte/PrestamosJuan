import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Printer, UserPlus, X, Briefcase, Trash2, PlusCircle, Search, Pencil } from 'lucide-react';
import { BARRIOS_TULUA, BARRIOS_BUGA } from '../constants/barrios';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Visitas = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showCarteraModal, setShowCarteraModal] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Estados para manejar la selección de barrios
    const [showBarriosSolicitanteCasa, setShowBarriosSolicitanteCasa] = useState(false);
    const [barrioSearchSolicitanteCasa, setBarrioSearchSolicitanteCasa] = useState('');
    const [showBarriosSolicitanteTrabajo, setShowBarriosSolicitanteTrabajo] = useState(false);
    const [barrioSearchSolicitanteTrabajo, setBarrioSearchSolicitanteTrabajo] = useState('');
    const [showBarriosFiadorCasa, setShowBarriosFiadorCasa] = useState(false);
    const [barrioSearchFiadorCasa, setBarrioSearchFiadorCasa] = useState('');
    const [showBarriosFiadorTrabajo, setShowBarriosFiadorTrabajo] = useState(false);
    const [barrioSearchFiadorTrabajo, setBarrioSearchFiadorTrabajo] = useState('');

    const barriosRefSolicitanteCasa = useRef(null);
    const barriosRefSolicitanteTrabajo = useRef(null);
    const barriosRefFiadorCasa = useRef(null);
    const barriosRefFiadorTrabajo = useRef(null);

    const [visitas, setVisitas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cerrar dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (barriosRefSolicitanteCasa.current && !barriosRefSolicitanteCasa.current.contains(event.target)) {
                setShowBarriosSolicitanteCasa(false);
            }
            if (barriosRefSolicitanteTrabajo.current && !barriosRefSolicitanteTrabajo.current.contains(event.target)) {
                setShowBarriosSolicitanteTrabajo(false);
            }
            if (barriosRefFiadorCasa.current && !barriosRefFiadorCasa.current.contains(event.target)) {
                setShowBarriosFiadorCasa(false);
            }
            if (barriosRefFiadorTrabajo.current && !barriosRefFiadorTrabajo.current.contains(event.target)) {
                setShowBarriosFiadorTrabajo(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Inicializar búsquedas de barrios con los valores existentes
    useEffect(() => {
        if (formData.solicitante.barrioCasa) {
            setBarrioSearchSolicitanteCasa(formData.solicitante.barrioCasa);
        }
        if (formData.solicitante.barrioTrabajo) {
            setBarrioSearchSolicitanteTrabajo(formData.solicitante.barrioTrabajo);
        }
        if (formData.fiador.barrioCasa) {
            setBarrioSearchFiadorCasa(formData.fiador.barrioCasa);
        }
        if (formData.fiador.barrioTrabajo) {
            setBarrioSearchFiadorTrabajo(formData.fiador.barrioTrabajo);
        }
    }, []);

    // Determinar qué lista de barrios usar según la ciudad del domiciliario
    const barriosDisponibles = useMemo(() => {
        // Si el usuario es domiciliario y tiene ciudad = "Guadalajara de Buga", usar BARRIOS_BUGA
        if (user && user.role === 'domiciliario' && user.ciudad === 'Guadalajara de Buga') {
            return BARRIOS_BUGA;
        }
        // Por defecto, usar BARRIOS_TULUA (para domiciliarios de Tuluá o cualquier otro rol)
        return BARRIOS_TULUA;
    }, [user]);

    // Función auxiliar para normalizar texto (quitar tildes y convertir a minúsculas)
    const normalizeText = (text) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    // Filtrar barrios según el término de búsqueda
    const filterBarrios = (searchTerm) => {
        if (!searchTerm) return [];
        return barriosDisponibles.filter(barrio =>
            normalizeText(barrio).includes(normalizeText(searchTerm))
        );
    };

    // Manejador para cambios en la búsqueda de barrios
    const handleBarrioSearchChange = (e, section, field) => {
        const value = e.target.value;

        // Actualizar el estado de búsqueda correspondiente
        if (section === 'solicitante' && field === 'barrioCasa') {
            setBarrioSearchSolicitanteCasa(value);
            setShowBarriosSolicitanteCasa(true);
        } else if (section === 'solicitante' && field === 'barrioTrabajo') {
            setBarrioSearchSolicitanteTrabajo(value);
            setShowBarriosSolicitanteTrabajo(true);
        } else if (section === 'fiador' && field === 'barrioCasa') {
            setBarrioSearchFiadorCasa(value);
            setShowBarriosFiadorCasa(true);
        } else if (section === 'fiador' && field === 'barrioTrabajo') {
            setBarrioSearchFiadorTrabajo(value);
            setShowBarriosFiadorTrabajo(true);
        }

        // Actualizar el formulario
        handleChange({
            target: {
                name: field,
                value: value
            }
        }, section);
    };

    // Manejador para seleccionar un barrio
    const handleBarrioSelect = (barrio, section, field) => {
        // Actualizar el formulario con el barrio seleccionado
        handleChange({
            target: {
                name: field,
                value: barrio
            }
        }, section);

        // Actualizar el estado de búsqueda correspondiente
        if (section === 'solicitante' && field === 'barrioCasa') {
            setBarrioSearchSolicitanteCasa(barrio);
            setShowBarriosSolicitanteCasa(false);
        } else if (section === 'solicitante' && field === 'barrioTrabajo') {
            setBarrioSearchSolicitanteTrabajo(barrio);
            setShowBarriosSolicitanteTrabajo(false);
        } else if (section === 'fiador' && field === 'barrioCasa') {
            setBarrioSearchFiadorCasa(barrio);
            setShowBarriosFiadorCasa(false);
        } else if (section === 'fiador' && field === 'barrioTrabajo') {
            setBarrioSearchFiadorTrabajo(barrio);
            setShowBarriosFiadorTrabajo(false);
        }
    };

    // Cargar visitas desde el backend
    useEffect(() => {
        const fetchVisitas = async () => {
            try {
                setLoading(true);
                const response = await api.get('/visitas?limit=1000');
                if (response.success) {
                    setVisitas(response.data);
                }
            } catch (error) {
                console.error('Error cargando visitas:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVisitas();
    }, []);

    const handleEditVisit = (visit) => {
        const visitId = visit._id || visit.id;
        setEditingId(visitId);
        setIsEditing(true);

        // Formatear fechas para los inputs de tipo date (YYYY-MM-DD)
        const fechaAgendamiento = visit.fechaAgendamiento ? visit.fechaAgendamiento.split('T')[0] : '';
        const fechaVisita = visit.fechaVisita ? visit.fechaVisita.split('T')[0] : '';

        setFormData({
            fechaAgendamiento,
            fechaVisita,
            tipoPrestamo: visit.tipoPrestamo || '',
            numeroCliente: visit.numeroCliente || '',
            valorPrestamo: visit.valorPrestamo || '',
            valorCuota: visit.valorCuota || '',
            solicitante: {
                nombre: visit.solicitante.nombre || '',
                cc: visit.solicitante.cc || '',
                telefono: visit.solicitante.telefono || '',
                direccionCasa: visit.solicitante.direccionCasa || '',
                barrioCasa: visit.solicitante.barrioCasa || '',
                direccionTrabajo: visit.solicitante.direccionTrabajo || '',
                barrioTrabajo: visit.solicitante.barrioTrabajo || ''
            },
            fiador: {
                nombre: visit.fiador.nombre || '',
                cc: visit.fiador.cc || '',
                telefono: visit.fiador.telefono || '',
                direccionCasa: visit.fiador.direccionCasa || '',
                barrioCasa: visit.fiador.barrioCasa || '',
                direccionTrabajo: visit.fiador.direccionTrabajo || '',
                barrioTrabajo: visit.fiador.barrioTrabajo || ''
            },
            observaciones: visit.observaciones || ''
        });

        // Actualizar búsquedas de barrios
        setBarrioSearchSolicitanteCasa(visit.solicitante.barrioCasa || '');
        setBarrioSearchSolicitanteTrabajo(visit.solicitante.barrioTrabajo || '');
        setBarrioSearchFiadorCasa(visit.fiador.barrioCasa || '');
        setBarrioSearchFiadorTrabajo(visit.fiador.barrioTrabajo || '');

        // Scroll al inicio para ver el formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData(initialFormState);
        setBarrioSearchSolicitanteCasa('');
        setBarrioSearchSolicitanteTrabajo('');
        setBarrioSearchFiadorCasa('');
        setBarrioSearchFiadorTrabajo('');
    };

    // Función helper para obtener la fecha de hoy en formato YYYY-MM-DD (local)
    const obtenerFechaHoyLocal = () => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Función helper para formatear fecha visualmente (DD/MM/YYYY) sin desfase
    const formatearFechaVisual = (fechaISO) => {
        if (!fechaISO) return '';
        // Si viene como string completo ISO (ej: 2025-12-21T12:00:00.000Z), cortamos en la T
        // Esto asume que el servidor guardó la fecha "correcta" en UTC.
        // Al guardar a las 12:00, 2025-12-21T12:00:00 local -> UTC 17:00 (aprox).
        // Cortar el string UTC da "2025-12-21". Correcto.
        const fechaStr = typeof fechaISO === 'string' ? fechaISO.split('T')[0] : new Date(fechaISO).toISOString().split('T')[0];
        const [year, month, day] = fechaStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const initialFormState = {
        fechaAgendamiento: obtenerFechaHoyLocal(),
        fechaVisita: '',
        tipoPrestamo: '',
        numeroCliente: '',
        valorPrestamo: '',
        valorCuota: '',
        solicitante: {
            nombre: '',
            cc: '',
            telefono: '',
            direccionCasa: '',
            barrioCasa: '',
            direccionTrabajo: '',
            barrioTrabajo: ''
        },
        fiador: {
            nombre: '',
            cc: '',
            telefono: '',
            direccionCasa: '',
            barrioCasa: '',
            direccionTrabajo: '',
            barrioTrabajo: ''
        },
        observaciones: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e, section = null) => {
        const { name, value } = e.target;
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [name]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleAddVisit = async (e) => {
        e.preventDefault();
        try {
            // Preparar fechas forzando mediodía (12:00 PM) para evitar desfases de zona horaria
            let fechaAgendamientoISO = formData.fechaAgendamiento;
            if (formData.fechaAgendamiento) {
                const [year, month, day] = formData.fechaAgendamiento.split('-').map(Number);
                const fechaLocal = new Date(year, month - 1, day, 12, 0, 0);
                fechaAgendamientoISO = fechaLocal.toISOString();
            }

            let fechaVisitaISO = formData.fechaVisita;
            if (formData.fechaVisita) {
                const [year, month, day] = formData.fechaVisita.split('-').map(Number);
                const fechaLocal = new Date(year, month - 1, day, 12, 0, 0);
                fechaVisitaISO = fechaLocal.toISOString();
            }

            const visitaData = {
                ...formData,
                fechaAgendamiento: fechaAgendamientoISO,
                fechaVisita: fechaVisitaISO,
            };

            if (isEditing) {
                const response = await api.put(`/visitas/${editingId}`, visitaData);
                if (response.success) {
                    setVisitas(visitas.map(v => (v._id === editingId || v.id === editingId) ? response.data : v));
                    handleCancelEdit();
                }
            } else {
                const response = await api.post('/visitas', { ...visitaData, completada: false });
                if (response.success) {
                    setVisitas([...visitas, response.data]);
                    setFormData(initialFormState);
                    setBarrioSearchSolicitanteCasa('');
                    setBarrioSearchSolicitanteTrabajo('');
                    setBarrioSearchFiadorCasa('');
                    setBarrioSearchFiadorTrabajo('');
                }
            }
        } catch (error) {
            console.error(isEditing ? 'Error actualizando visita:' : 'Error creando visita:', error);
            alert(`Error al ${isEditing ? 'actualizar' : 'crear'} la visita. Por favor intenta de nuevo.`);
        }
    };

    const handleDeleteVisit = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta visita?')) {
            try {
                const response = await api.delete(`/visitas/${id}`);
                if (response.success) {
                    setVisitas(visitas.filter(v => v._id !== id && v.id !== id));
                }
            } catch (error) {
                console.error('Error eliminando visita:', error);
                alert('Error al eliminar la visita. Por favor intenta de nuevo.');
            }
        }
    };

    const openCarteraModal = (visit) => {
        setSelectedVisit(visit);
        setShowCarteraModal(true);
    };

    const handleAddToClients = (cartera) => {
        if (!selectedVisit) return;

        const clientData = {
            nombre: selectedVisit.solicitante.nombre,
            documento: selectedVisit.solicitante.cc,
            telefono: selectedVisit.solicitante.telefono,
            direccion: selectedVisit.solicitante.direccionCasa,
            barrio: selectedVisit.solicitante.barrioCasa,
            direccionTrabajo: selectedVisit.solicitante.direccionTrabajo,
            fiador: {
                nombre: selectedVisit.fiador.nombre,
                documento: selectedVisit.fiador.cc,
                telefono: selectedVisit.fiador.telefono,
                direccion: selectedVisit.fiador.direccionCasa,
                barrio: selectedVisit.fiador.barrioCasa,
                direccionTrabajo: selectedVisit.fiador.direccionTrabajo
            }
        };

        navigate('/', {
            state: {
                openForm: true,
                cartera: cartera,
                clientData: clientData
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 print:p-2 print:space-y-4 print:max-w-full">
            {/* Header Global */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm no-print">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Visitas</h1>
                <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                    onClick={() => window.print()}
                >
                    <Printer size={18} />
                    Imprimir Reporte
                </button>
            </div>

            {/* Formulario de Nueva Visita */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden no-print">
                <div className="px-8 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                        {isEditing ? <Pencil size={20} /> : <PlusCircle size={20} />}
                        {isEditing ? 'Editar Visita' : 'Nueva Visita'}
                    </h2>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold"
                        >
                            <X size={18} />
                            Cancelar Edición
                        </button>
                    )}
                </div>
                <form onSubmit={handleAddVisit} className="p-8 space-y-6">
                    {/* Fechas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Fecha Agendamiento</label>
                            <input
                                type="date"
                                name="fechaAgendamiento"
                                value={formData.fechaAgendamiento}
                                onChange={handleChange}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Fecha de la Visita</label>
                            <input
                                type="date"
                                name="fechaVisita"
                                value={formData.fechaVisita}
                                onChange={handleChange}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Información del Préstamo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div className="flex flex-col">
                                <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Tipo de Préstamo</label>
                                <input
                                    type="text"
                                    name="tipoPrestamo"
                                    value={formData.tipoPrestamo}
                                    onChange={handleChange}
                                    className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                                    placeholder="Ej. Personal, Hipotecario..."
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Valor del Préstamo</label>
                                <div className="relative">
                                    <span className="absolute left-0 top-2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="valorPrestamo"
                                        value={formData.valorPrestamo}
                                        onChange={handleChange}
                                        className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 pl-4 bg-transparent transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex flex-col">
                                <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Número de Cliente</label>
                                <input
                                    type="text"
                                    name="numeroCliente"
                                    value={formData.numeroCliente}
                                    onChange={handleChange}
                                    className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Valor Cuota</label>
                                <div className="relative">
                                    <span className="absolute left-0 top-2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="valorCuota"
                                        value={formData.valorCuota}
                                        onChange={handleChange}
                                        className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 pl-4 bg-transparent transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Solicitante */}
                    <div className="space-y-4 border-t pt-4">
                        <h3 className="text-md font-bold text-gray-700 uppercase">Datos del Solicitante</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input
                                type="text"
                                name="nombre"
                                placeholder="Nombre Completo"
                                value={formData.solicitante.nombre}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <input
                                type="text"
                                name="cc"
                                placeholder="Cédula"
                                value={formData.solicitante.cc}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <input
                                type="tel"
                                name="telefono"
                                placeholder="Teléfono"
                                value={formData.solicitante.telefono}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <input
                                type="text"
                                name="direccionCasa"
                                placeholder="Dirección Casa"
                                value={formData.solicitante.direccionCasa}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <div className="relative" ref={barriosRefSolicitanteCasa}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="barrioCasa"
                                        placeholder="Barrio Casa"
                                        value={barrioSearchSolicitanteCasa}
                                        onChange={(e) => handleBarrioSearchChange(e, 'solicitante', 'barrioCasa')}
                                        onFocus={() => setShowBarriosSolicitanteCasa(true)}
                                        className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent pr-8"
                                    />
                                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                                {showBarriosSolicitanteCasa && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filterBarrios(barrioSearchSolicitanteCasa).length > 0 ? (
                                            filterBarrios(barrioSearchSolicitanteCasa).map((barrio) => (
                                                <div
                                                    key={barrio}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                    onClick={() => handleBarrioSelect(barrio, 'solicitante', 'barrioCasa')}
                                                >
                                                    {barrio}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-gray-500">No se encontraron barrios</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                name="direccionTrabajo"
                                placeholder="Dirección Trabajo"
                                value={formData.solicitante.direccionTrabajo}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <div className="relative" ref={barriosRefSolicitanteTrabajo}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="barrioTrabajo"
                                        placeholder="Barrio Trabajo"
                                        value={barrioSearchSolicitanteTrabajo}
                                        onChange={(e) => handleBarrioSearchChange(e, 'solicitante', 'barrioTrabajo')}
                                        onFocus={() => setShowBarriosSolicitanteTrabajo(true)}
                                        className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent pr-8"
                                    />
                                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                                {showBarriosSolicitanteTrabajo && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filterBarrios(barrioSearchSolicitanteTrabajo).length > 0 ? (
                                            filterBarrios(barrioSearchSolicitanteTrabajo).map((barrio) => (
                                                <div
                                                    key={barrio}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                    onClick={() => handleBarrioSelect(barrio, 'solicitante', 'barrioTrabajo')}
                                                >
                                                    {barrio}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-gray-500">No se encontraron barrios</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fiador */}
                    <div className="space-y-4 border-t pt-4">
                        <h3 className="text-md font-bold text-gray-700 uppercase">Datos del Fiador</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input
                                type="text"
                                name="nombre"
                                placeholder="Nombre Completo"
                                value={formData.fiador.nombre}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <input
                                type="text"
                                name="cc"
                                placeholder="Cédula"
                                value={formData.fiador.cc}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <input
                                type="tel"
                                name="telefono"
                                placeholder="Teléfono"
                                value={formData.fiador.telefono}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <input
                                type="text"
                                name="direccionCasa"
                                placeholder="Dirección Casa"
                                value={formData.fiador.direccionCasa}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <div className="relative" ref={barriosRefFiadorCasa}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="barrioCasa"
                                        placeholder="Barrio Casa"
                                        value={barrioSearchFiadorCasa}
                                        onChange={(e) => handleBarrioSearchChange(e, 'fiador', 'barrioCasa')}
                                        onFocus={() => setShowBarriosFiadorCasa(true)}
                                        className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent pr-8"
                                    />
                                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                                {showBarriosFiadorCasa && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filterBarrios(barrioSearchFiadorCasa).length > 0 ? (
                                            filterBarrios(barrioSearchFiadorCasa).map((barrio) => (
                                                <div
                                                    key={barrio}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                    onClick={() => handleBarrioSelect(barrio, 'fiador', 'barrioCasa')}
                                                >
                                                    {barrio}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-gray-500">No se encontraron barrios</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                name="direccionTrabajo"
                                placeholder="Dirección Trabajo"
                                value={formData.fiador.direccionTrabajo}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent"
                            />
                            <div className="relative" ref={barriosRefFiadorTrabajo}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="barrioTrabajo"
                                        placeholder="Barrio Trabajo"
                                        value={barrioSearchFiadorTrabajo}
                                        onChange={(e) => handleBarrioSearchChange(e, 'fiador', 'barrioTrabajo')}
                                        onFocus={() => setShowBarriosFiadorTrabajo(true)}
                                        className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent pr-8"
                                    />
                                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                                {showBarriosFiadorTrabajo && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filterBarrios(barrioSearchFiadorTrabajo).length > 0 ? (
                                            filterBarrios(barrioSearchFiadorTrabajo).map((barrio) => (
                                                <div
                                                    key={barrio}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                    onClick={() => handleBarrioSelect(barrio, 'fiador', 'barrioTrabajo')}
                                                >
                                                    {barrio}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-gray-500">No se encontraron barrios</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="pt-4 border-t">
                        <textarea
                            name="observaciones"
                            placeholder="Observaciones..."
                            value={formData.observaciones}
                            onChange={handleChange}
                            rows="3"
                            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
                            >
                                <X size={20} />
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            className={`flex items-center gap-2 px-6 py-3 ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors shadow-md`}
                        >
                            {isEditing ? <Save size={20} /> : <PlusCircle size={20} />}
                            {isEditing ? 'Actualizar Visita' : 'Agregar a la Lista'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Lista de Visitas Agendadas */}
            <div className="space-y-6 print:space-y-3 print:text-xs">
                <h2 className="text-2xl font-bold text-gray-800 text-center no-print">Visitas Agendadas ({visitas.length})</h2>

                {loading ? (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300 no-print">
                        <p className="text-gray-500 text-lg">Cargando visitas...</p>
                    </div>
                ) : visitas.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300 no-print">
                        <p className="text-gray-500 text-lg">No hay visitas agendadas para imprimir.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 print:gap-4">
                        {visitas.map((visit, index) => {
                            const visitId = visit._id || visit.id;
                            return (
                                <div key={visitId} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 break-inside-avoid print:shadow-none print:border print:mb-2 print:page-break-inside-avoid">
                                    {/* Encabezado similar al formulario */}
                                    <div className="px-8 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center print:px-4 print:py-2">
                                        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                            <span>Visita #{index + 1}</span>
                                            <span className="text-sm font-normal text-gray-500">- {visit.solicitante.nombre}</span>
                                        </h3>
                                        <div className="flex gap-2 no-print">
                                            <button
                                                onClick={() => handleEditVisit(visit)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={20} />
                                            </button>
                                            <button
                                                onClick={() => openCarteraModal(visit)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                                title="Añadir a Clientes"
                                            >
                                                <UserPlus size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteVisit(visitId)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cuerpo con formato similar al formulario de Nueva Visita */}
                                    <div className="p-8 space-y-6 text-sm print:p-4 print:space-y-3 print:text-[11px]">
                                        {/* Fechas */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-3">
                                            <div className="flex flex-col">
                                                <label className="text-xs font-semibold text-gray-600 mb-1 uppercase">Fecha Agendamiento</label>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800">
                                                    {formatearFechaVisual(visit.fechaAgendamiento)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-xs font-semibold text-gray-600 mb-1 uppercase">Fecha de la Visita</label>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800">
                                                    {formatearFechaVisual(visit.fechaVisita)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Información del Préstamo */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-6">
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 uppercase">Tipo de Préstamo</label>
                                                    <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                        {visit.tipoPrestamo}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 uppercase">Valor del Préstamo</label>
                                                    <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                        {visit.valorPrestamo ? `$ ${visit.valorPrestamo}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 uppercase">Número de Cliente</label>
                                                    <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                        {visit.numeroCliente}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 uppercase">Valor Cuota</label>
                                                    <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                        {visit.valorCuota ? `$ ${visit.valorCuota}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Solicitante */}
                                        <div className="space-y-4 border-t pt-4">
                                            <h3 className="text-md font-bold text-gray-700 uppercase">Datos del Solicitante</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-2">
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.solicitante.nombre}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.solicitante.cc}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.solicitante.telefono}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.solicitante.direccionCasa}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.solicitante.barrioCasa}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.solicitante.direccionTrabajo}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.solicitante.barrioTrabajo}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fiador */}
                                        <div className="space-y-4 border-t pt-4">
                                            <h3 className="text-md font-bold text-gray-700 uppercase">Datos del Fiador</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.fiador.nombre}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.fiador.cc}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.fiador.telefono}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.fiador.direccionCasa}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.fiador.barrioCasa}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.fiador.direccionTrabajo}
                                                </div>
                                                <div className="border-b-2 border-gray-300 py-2 text-gray-800 min-h-[2rem]">
                                                    {visit.fiador.barrioTrabajo}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Observaciones */}
                                        <div className="pt-4 border-t min-h-[3rem]">
                                            <label className="text-xs font-semibold text-gray-600 mb-1 uppercase block">Observaciones</label>
                                            <div className="w-full border-2 border-gray-300 rounded-lg p-3 min-h-[3rem] text-gray-800 whitespace-pre-wrap">
                                                {visit.observaciones}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Selección de Cartera */}
            {showCarteraModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no-print">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Seleccionar Cartera</h3>
                            <button
                                onClick={() => setShowCarteraModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-6">
                                Selecciona la cartera a la que deseas agregar este cliente:
                            </p>
                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => handleAddToClients('K1')}
                                    className="flex items-center p-4 border-2 border-blue-100 bg-blue-50 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all group"
                                >
                                    <div className="bg-blue-200 p-3 rounded-full group-hover:bg-blue-300 transition-colors">
                                        <Briefcase className="h-6 w-6 text-blue-700" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <h4 className="font-bold text-blue-900">Cartera K1</h4>
                                        <p className="text-sm text-blue-700">Cartera Principal</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleAddToClients('K2')}
                                    className="flex items-center p-4 border-2 border-green-100 bg-green-50 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all group"
                                >
                                    <div className="bg-green-200 p-3 rounded-full group-hover:bg-green-300 transition-colors">
                                        <Briefcase className="h-6 w-6 text-green-700" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <h4 className="font-bold text-green-900">Cartera K2</h4>
                                        <p className="text-sm text-green-700">Cartera Secundaria</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Visitas;
