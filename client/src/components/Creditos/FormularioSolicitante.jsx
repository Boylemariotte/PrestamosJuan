import React from 'react';

const FormularioSolicitante = ({ solicitante, onChange }) => {
  const handleChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-4 print-section solicitante-section">
      <h3 className="text-xl font-bold text-blue-600 text-center">SOLICITANTE</h3>
      <div className="space-y-3 solicitante-fields">
        <div className="solicitante-field">
          <label className="block text-blue-600 font-medium mb-1">Nombre:</label>
          <input
            type="text"
            value={solicitante.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
            placeholder="Ingrese el nombre"
          />
        </div>
        <div className="solicitante-field">
          <label className="block text-blue-600 font-medium mb-1">C.C.:</label>
          <input
            type="text"
            value={solicitante.cedula}
            onChange={(e) => handleChange('cedula', e.target.value)}
            className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
            placeholder="Ingrese la cédula"
          />
        </div>
        <div className="solicitante-field">
          <label className="block text-blue-600 font-medium mb-1">Dirección Casa:</label>
          <input
            type="text"
            value={solicitante.direccionCasa}
            onChange={(e) => handleChange('direccionCasa', e.target.value)}
            className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
            placeholder="Ingrese la dirección de casa"
          />
        </div>
        <div className="solicitante-field">
          <label className="block text-blue-600 font-medium mb-1">Dirección Trabajo:</label>
          <input
            type="text"
            value={solicitante.direccionTrabajo}
            onChange={(e) => handleChange('direccionTrabajo', e.target.value)}
            className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
            placeholder="Ingrese la dirección de trabajo"
          />
        </div>
        <div className="solicitante-field">
          <label className="block text-blue-600 font-medium mb-1">Teléfono:</label>
          <input
            type="text"
            value={solicitante.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
            placeholder="Ingrese el teléfono"
          />
        </div>
      </div>
    </div>
  );
};

export default FormularioSolicitante;

