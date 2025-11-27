import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Printer, UserPlus, X, Briefcase } from 'lucide-react';

const Visitas = () => {
    const navigate = useNavigate();
    const [showCarteraModal, setShowCarteraModal] = useState(false);
    const [formData, setFormData] = useState({
        fechaAgendamiento: '',
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
    });

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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Data:', formData);
        // Aquí iría la lógica para guardar
        alert('Información guardada (Simulación)');
    };

    const handleAddToClients = (cartera) => {
        const clientData = {
            nombre: formData.solicitante.nombre,
            documento: formData.solicitante.cc,
            telefono: formData.solicitante.telefono,
            direccion: formData.solicitante.direccionCasa,
            barrio: formData.solicitante.barrioCasa,
            direccionTrabajo: formData.solicitante.direccionTrabajo,
            fiador: {
                nombre: formData.fiador.nombre,
                documento: formData.fiador.cc,
                telefono: formData.fiador.telefono,
                direccion: formData.fiador.direccionCasa,
                direccionTrabajo: formData.fiador.direccionTrabajo
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
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 no-print">
                <h1 className="text-2xl font-bold text-gray-800">Formulario de Visitas</h1>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => window.print()}
                    >
                        <Printer size={18} />
                        Imprimir
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        onClick={() => setShowCarteraModal(true)}
                    >
                        <UserPlus size={18} />
                        Añadir a Clientes
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Save size={18} />
                        Guardar
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
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
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-center text-gray-800 uppercase tracking-wider border-b pb-2">Solicitante</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.solicitante.nombre}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">C.C.</label>
                            <input
                                type="text"
                                name="cc"
                                value={formData.solicitante.cc}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Teléfono</label>
                        <input
                            type="tel"
                            name="telefono"
                            value={formData.solicitante.telefono}
                            onChange={(e) => handleChange(e, 'solicitante')}
                            className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Dirección Casa</label>
                            <input
                                type="text"
                                name="direccionCasa"
                                value={formData.solicitante.direccionCasa}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Barrio</label>
                            <input
                                type="text"
                                name="barrioCasa"
                                value={formData.solicitante.barrioCasa}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Dirección Trabajo</label>
                            <input
                                type="text"
                                name="direccionTrabajo"
                                value={formData.solicitante.direccionTrabajo}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Barrio</label>
                            <input
                                type="text"
                                name="barrioTrabajo"
                                value={formData.solicitante.barrioTrabajo}
                                onChange={(e) => handleChange(e, 'solicitante')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Fiador */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-xl font-bold text-center text-gray-800 uppercase tracking-wider border-b pb-2">Fiador</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.fiador.nombre}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">C.C.</label>
                            <input
                                type="text"
                                name="cc"
                                value={formData.fiador.cc}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Teléfono</label>
                        <input
                            type="tel"
                            name="telefono"
                            value={formData.fiador.telefono}
                            onChange={(e) => handleChange(e, 'fiador')}
                            className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Dirección Casa</label>
                            <input
                                type="text"
                                name="direccionCasa"
                                value={formData.fiador.direccionCasa}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Barrio</label>
                            <input
                                type="text"
                                name="barrioCasa"
                                value={formData.fiador.barrioCasa}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Dirección Trabajo</label>
                            <input
                                type="text"
                                name="direccionTrabajo"
                                value={formData.fiador.direccionTrabajo}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-600 mb-1 uppercase">Barrio</label>
                            <input
                                type="text"
                                name="barrioTrabajo"
                                value={formData.fiador.barrioTrabajo}
                                onChange={(e) => handleChange(e, 'fiador')}
                                className="border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 bg-transparent transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Observaciones */}
                <div className="pt-4">
                    <h2 className="text-xl font-bold text-center text-gray-800 uppercase tracking-wider border-b pb-2 mb-4">Observaciones</h2>
                    <textarea
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleChange}
                        rows="4"
                        className="w-full border-2 border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                    ></textarea>
                </div>
            </form>

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
