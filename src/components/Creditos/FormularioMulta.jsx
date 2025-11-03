import React from 'react';

const FormularioMulta = ({ 
  valorMulta, 
  motivoMulta, 
  onValorChange, 
  onMotivoChange, 
  onSubmit, 
  onCancel 
}) => {
  return (
    <div className="ml-14 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-3">Agregar Multa/Recargo</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Valor de la multa *</label>
          <input
            type="number"
            value={valorMulta}
            onChange={(e) => onValorChange(e.target.value)}
            placeholder="Ej: 10000"
            className="input-field"
            min="0"
          />
        </div>
        <div>
          <label className="label">Motivo (opcional)</label>
          <input
            type="text"
            value={motivoMulta}
            onChange={(e) => onMotivoChange(e.target.value)}
            placeholder="Ej: Recargo por mora"
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
          Agregar Multa
        </button>
      </div>
    </div>
  );
};

export default FormularioMulta;

