import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

const MotivoEliminacionModal = ({ isOpen, onClose, onConfirm, titulo = "Confirmar eliminación" }) => {
    const [motivo, setMotivo] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!motivo.trim()) return;
        onConfirm(motivo);
        setMotivo('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 transition-all duration-300">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-red-50 px-6 py-4 flex items-center justify-between border-b border-red-100">
                    <div className="flex items-center gap-2 text-red-700">
                        <Trash2 className="h-5 w-5" />
                        <h3 className="text-lg font-bold">{titulo}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Esta acción no se puede deshacer. Por favor, indica el motivo de la eliminación para el registro histórico.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Motivo de eliminación <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            autoFocus
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Ej: Error en el monto, duplicado, el cliente canceló el gasto..."
                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none min-h-[120px] resize-none text-gray-700 transition-all bg-slate-50 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!motivo.trim()}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-red-200"
                    >
                        Eliminar permanentemente
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MotivoEliminacionModal;
