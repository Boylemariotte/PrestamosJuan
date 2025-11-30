import React, { useState } from 'react';
import { Calendar, X, Check } from 'lucide-react';
import { formatearFechaCorta } from '../../utils/creditCalculations';

const SelectorFechaPago = ({ 
  cuota, 
  credito, 
  onConfirmar, 
  onCancelar, 
  isOpen 
}) => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    cuota.fechaProgramada || new Date().toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  const handleConfirmar = () => {
    onConfirmar(cuota.nroCuota, fechaSeleccionada);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Seleccionar Fecha de Pago
          </h3>
          <button
            onClick={onCancelar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Cuota:</span> #{cuota.nroCuota}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Fecha programada:</span> {formatearFechaCorta(cuota.fechaProgramada)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Valor:</span> ${credito.valorCuota.toLocaleString('es-CO')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha en que se realizó el pago:
            </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Puedes seleccionar una fecha anterior a hoy para registrar pagos atrasados
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectorFechaPago;
