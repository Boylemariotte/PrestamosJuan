import React from 'react';
import { Clock, MapPin, CheckCircle } from 'lucide-react';

const VisitasAlert = ({ visitasDelDia, handleCompletarVisita }) => {
    if (visitasDelDia.length === 0) return null;

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3 text-purple-800">
                <Clock className="h-5 w-5" />
                <h2 className="font-bold text-lg">Visitas Programadas ({visitasDelDia.length})</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                {visitasDelDia.map(visita => (
                    <div key={visita.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center border border-purple-100">
                        <div>
                            <p className="font-bold text-gray-800">{visita.solicitante.nombre}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                {visita.solicitante.barrioCasa}
                            </div>
                        </div>
                        <button
                            onClick={() => handleCompletarVisita(visita.id)}
                            className="p-2 hover:bg-green-100 text-gray-400 hover:text-green-600 rounded-full transition-colors"
                        >
                            <CheckCircle className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisitasAlert;
