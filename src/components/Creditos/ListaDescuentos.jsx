import React from 'react';
import { DollarSign, Trash2 } from 'lucide-react';
import { formatearMoneda, formatearFechaCorta } from '../../utils/creditCalculations';

const ListaDescuentos = ({ descuentos, onEliminarDescuento }) => {
  if (!descuentos || descuentos.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <DollarSign className="h-5 w-5 mr-2 text-green-600" />
        Descuentos Aplicados
      </h3>
      <div className="space-y-2">
        {descuentos.map((descuento) => (
          <div
            key={descuento.id}
            className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-bold text-green-900 text-lg">
                  {formatearMoneda(descuento.valor)}
                </span>
                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-medium rounded">
                  {descuento.tipo === 'dias' ? 'Por días' : 'Papelería'}
                </span>
                <span className="text-sm text-gray-600">
                  - {descuento.descripcion}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Aplicado el {formatearFechaCorta(descuento.fecha.split('T')[0])}
              </p>
            </div>
            <button
              onClick={() => onEliminarDescuento(descuento.id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Eliminar descuento"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaDescuentos;

