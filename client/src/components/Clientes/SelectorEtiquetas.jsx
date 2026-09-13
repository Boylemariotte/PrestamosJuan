import React from 'react';
import { Award, Check, Calendar, AlertCircle, Ban, AlertOctagon } from 'lucide-react';

// Definición de etiquetas
export const ETIQUETAS = {
  excelente: {
    nombre: 'Excelente',
    color: 'bg-green-100 text-green-800 border-green-300',
    icono: Award
  },
  bueno: {
    nombre: 'Bueno',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icono: Check
  },
  atrasado: {
    nombre: 'Atrasado',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icono: Calendar
  },
  incompleto: {
    nombre: 'Incompleto',
    color: 'bg-red-100 text-red-800 border-red-300',
    icono: AlertCircle
  },
  vetado: {
    nombre: 'Vetado',
    color: 'bg-gray-800 text-white border-gray-900',
    icono: Ban
  },
  perdido: {
    nombre: 'Perdido',
    color: 'bg-rose-100 text-rose-800 border-rose-300',
    icono: AlertOctagon
  },
  'sin-etiqueta': {
    nombre: 'Sin etiqueta',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icono: null
  }
};

const SelectorEtiquetas = ({
  cliente,
  onAsignarEtiqueta,
  onCancelar,
  onClose
}) => {
  const handleCancelar = onCancelar || onClose;
  const nombreCliente = cliente?.nombre || '';
  const etiquetaActual = cliente?.etiqueta;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-purple-600" />
          Asignar Etiqueta {nombreCliente ? `a ${nombreCliente}` : ''}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona una etiqueta para clasificar el comportamiento del cliente:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {Object.entries(ETIQUETAS).map(([key, etiqueta]) => (
            <button
              key={key}
              onClick={() => onAsignarEtiqueta(key)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${etiqueta.color} ${etiquetaActual === key ? 'ring-4 ring-purple-400' : ''}`}
            >
              <div className="flex items-center justify-center mb-2">
                {etiqueta.icono && React.createElement(etiqueta.icono, { className: 'h-8 w-8' })}
              </div>
              <h5 className="font-bold text-center">{etiqueta.nombre}</h5>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleCancelar}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectorEtiquetas;
