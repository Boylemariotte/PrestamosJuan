import React from 'react';

const BarraProgreso = ({ progreso, estado }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Progreso del crédito</span>
        <span className="text-sm font-bold text-gray-900">
          {progreso.cuotasPagadas}/{progreso.totalCuotas} cuotas pagadas
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            estado === 'finalizado'
              ? 'bg-blue-500'
              : estado === 'mora'
              ? 'bg-red-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${progreso.porcentaje}%` }}
        />
      </div>
      <div className="text-right text-sm text-gray-600 mt-2">
        {progreso.porcentaje}% completado
      </div>
    </div>
  );
};

export default BarraProgreso;

