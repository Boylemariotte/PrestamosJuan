import React from 'react';
import { Calendar } from 'lucide-react';
import { formatearFecha } from '../../utils/creditCalculations';

const EditorFecha = ({ 
  cuota, 
  credito, 
  nuevaFecha, 
  onFechaChange, 
  onGuardar, 
  onCancelar 
}) => {
  return (
    <div className="ml-14 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
        Cambiar Fecha de Vencimiento
      </h4>
      <div className="space-y-3">
        <div>
          <label className="label">Fecha actual</label>
          <input
            type="text"
            value={formatearFecha(cuota.fechaProgramada)}
            disabled
            className="input-field bg-gray-100"
          />
        </div>
        <div>
          <label className="label">Nueva fecha *</label>
          <input
            type="date"
            value={nuevaFecha}
            onChange={(e) => onFechaChange(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Al cambiar esta fecha, todas las cuotas posteriores se ajustarán automáticamente manteniendo el intervalo de {credito.tipo === 'semanal' ? '7' : '15'} días.
          </p>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={onCancelar}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <button
          onClick={onGuardar}
          className="btn-primary"
          disabled={!nuevaFecha}
        >
          Guardar Fecha
        </button>
      </div>
    </div>
  );
};

export default EditorFecha;

