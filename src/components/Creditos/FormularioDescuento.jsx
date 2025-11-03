import React from 'react';

const FormularioDescuento = ({ 
  valorDescuento, 
  tipoDescuento, 
  descripcionDescuento, 
  onValorChange, 
  onTipoChange, 
  onDescripcionChange, 
  onSubmit, 
  onCancel 
}) => {
  return (
    <div className="border-t pt-6">
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Agregar Descuento Manual</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Tipo de descuento *</label>
            <select
              value={tipoDescuento}
              onChange={(e) => onTipoChange(e.target.value)}
              className="input-field"
            >
              <option value="dias">Descuento por días</option>
              <option value="papeleria">Descuento por papelería</option>
            </select>
          </div>
          <div>
            <label className="label">Valor del descuento *</label>
            <input
              type="number"
              value={valorDescuento}
              onChange={(e) => onValorChange(e.target.value)}
              placeholder="Ej: 10000"
              className="input-field"
              min="0"
            />
          </div>
          <div>
            <label className="label">Descripción (opcional)</label>
            <input
              type="text"
              value={descripcionDescuento}
              onChange={(e) => onDescripcionChange(e.target.value)}
              placeholder="Ej: Fecha próxima"
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
            className="btn-primary bg-green-600 hover:bg-green-700"
          >
            Agregar Descuento
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormularioDescuento;

