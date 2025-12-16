import React from 'react';
import { formatearMoneda, formatearFechaCorta } from '../../utils/creditCalculations';

const EncabezadoFormulario = ({ formData }) => {
  return (
    <>
      {/* Primera fila: Tipo de pago y Fecha inicio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tipo de pago - Solo lectura */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-blue-600">TIPO DE PAGO</h3>
          <div className="flex items-center">
            <div className="border-b-2 border-blue-600 h-8 px-2 flex items-center bg-gray-50">
              <span className="text-blue-600 font-bold text-lg capitalize">
                {formData.tipoPago}
              </span>
            </div>
          </div>
        </div>

        {/* Fecha inicio - Solo lectura */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-blue-600">FECHA INICIO</h3>
          <div className="flex items-center">
            <div className="border-b-2 border-blue-600 h-8 px-2 flex items-center bg-gray-50">
              <span className="text-blue-600 font-bold text-lg">
                {formData.fechaInicio ? formatearFechaCorta(formData.fechaInicio) : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila: Valores - Solo lectura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <label className="block text-lg font-bold text-blue-600 mb-2">VALOR PRODUCTO</label>
          <div className="flex items-center">
            <span className="text-blue-600 font-bold text-xl mr-2">$</span>
            <div className="flex-1 border-b-2 border-blue-600 h-8 bg-gray-50 flex items-center px-2">
              <span className="text-blue-600 font-bold text-lg">
                {formatearMoneda(formData.valorProducto || 0).replace('$', '').replace(/,/g, '')}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-lg font-bold text-blue-600 mb-2">VALOR CUOTA</label>
          <div className="flex items-center">
            <span className="text-blue-600 font-bold text-xl mr-2">$</span>
            <div className="flex-1 border-b-2 border-blue-600 h-8 bg-gray-50 flex items-center px-2">
              <span className="text-blue-600 font-bold text-lg">
                {formatearMoneda(formData.valorCuota || 0).replace('$', '').replace(/,/g, '')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EncabezadoFormulario;

