import React, { useState } from 'react';
import { X } from 'lucide-react';

const MotivoProrrogaModal = ({ isOpen, onClose, onConfirm, initialDate = '', showDatePicker = true }) => {
    const [motivo, setMotivo] = useState('');
    const [fecha, setFecha] = useState(initialDate);

    // Actualizar fecha local cuando cambie la prop inicial
    React.useEffect(() => {
        setFecha(initialDate);
    }, [initialDate]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (motivo.trim() && (!showDatePicker || fecha)) {
            onConfirm(motivo, fecha);
            setMotivo('');
        }
    };

    const handleClose = () => {
        setMotivo('');
        onClose();
    };

    const isReady = motivo.trim() && (!showDatePicker || fecha);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex justify-between items-center bg-gray-100 px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Prorrogar Fecha de Cobro</h3>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {showDatePicker && (
                        <div className="mb-4">
                            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                                Nueva fecha seleccionada:
                            </label>
                            <input
                                type="date"
                                id="fecha"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
                            Escribe el motivo del cambio:
                        </label>
                        <textarea
                            id="motivo"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Ej: Cliente solicitó cambio por calamidad doméstica..."
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!isReady}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isReady ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
                                }`}
                        >
                            Guardar y Aplicar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MotivoProrrogaModal;
