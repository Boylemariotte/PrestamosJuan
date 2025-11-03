import React from 'react';

const FormularioAbono = ({ 
  valorAbono, 
  descripcionAbono, 
  onValorChange, 
  onDescripcionChange, 
  onSubmit, 
  onCancel 
}) => {
  return (
    <div className="mt-4">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Agregar Abono al Crédito</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Valor del abono *</label>
            <input
              type="number"
              value={valorAbono}
              onChange={(e) => onValorChange(e.target.value)}
              placeholder="Ej: 50000"
              className="input-field"
              min="0"
            />
          </div>
          <div>
            <label className="label">Descripción (opcional)</label>
            <input
              type="text"
              value={descripcionAbono}
              onChange={(e) => onDescripcionChange(e.target.value)}
              placeholder="Ej: Pago parcial"
              className="input-field"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-3">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="btn-primary"
          >
            Agregar Abono
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormularioAbono;

