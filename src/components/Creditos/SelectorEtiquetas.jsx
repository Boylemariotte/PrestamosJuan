import React from 'react';
import { Award } from 'lucide-react';

const SelectorEtiquetas = ({ 
  ETIQUETAS, 
  credito, 
  onAsignarEtiqueta, 
  onCancelar 
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Award className="h-5 w-5 mr-2 text-purple-600" />
        Asignar Etiqueta de Desempeño
      </h4>
      <p className="text-sm text-gray-600 mb-4">
        Selecciona una etiqueta para clasificar el comportamiento de pago del cliente:
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(ETIQUETAS).map(([key, etiqueta]) => (
          <button
            key={key}
            onClick={() => onAsignarEtiqueta(key)}
            className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${etiqueta.color} ${credito.etiqueta === key ? 'ring-4 ring-purple-400' : ''}`}
          >
            <div className="flex items-center justify-center mb-2">
              {React.createElement(etiqueta.icono, { className: 'h-8 w-8' })}
            </div>
            <h5 className="font-bold text-center mb-1">{etiqueta.nombre}</h5>
            <p className="text-xs text-center opacity-80">{etiqueta.descripcion}</p>
          </button>
        ))}
      </div>
      <div className="mt-3 text-center">
        <button
          onClick={onCancelar}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default SelectorEtiquetas;

