import React, { useState } from 'react';
import { X } from 'lucide-react';
import { 
  MONTOS_DISPONIBLES, 
  calcularTotalAPagar, 
  calcularValorCuota,
  obtenerNumCuotas,
  calcularPapeleria,
  calcularMontoEntregado,
  formatearMoneda 
} from '../../utils/creditCalculations';
import { obtenerFechaLocal } from '../../utils/dateUtils';

const CreditoForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    monto: MONTOS_DISPONIBLES[0],
    tipo: 'semanal',
    tipoQuincenal: '1-16',
    fechaInicio: obtenerFechaLocal(),
    papeleriaManual: '',
    usarPapeleriaManual: false
  });

  const papeleriaAutomatica = calcularPapeleria(formData.monto);
  const papeleria = formData.usarPapeleriaManual && formData.papeleriaManual 
    ? parseFloat(formData.papeleriaManual) 
    : papeleriaAutomatica;
  const montoEntregado = formData.monto - papeleria;
  const totalAPagar = calcularTotalAPagar(formData.monto, formData.tipo);
  const numCuotas = obtenerNumCuotas(formData.monto, formData.tipo);
  const valorCuota = calcularValorCuota(formData.monto, formData.tipo);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monto' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Nuevo Crédito</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Monto del préstamo */}
          <div>
            <label className="label">Monto del Préstamo *</label>
            <select
              name="monto"
              value={formData.monto}
              onChange={handleChange}
              className="input-field"
              required
            >
              {MONTOS_DISPONIBLES.map(monto => (
                <option key={monto} value={monto}>
                  {formatearMoneda(monto)}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de pago */}
          <div>
            <label className="label">Tipo de Pago *</label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipo"
                  value="diario"
                  checked={formData.tipo === 'diario'}
                  onChange={handleChange}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Diario</span>
                  <p className="text-sm text-gray-500">60 cuotas - Cada día</p>
                </div>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipo"
                  value="semanal"
                  checked={formData.tipo === 'semanal'}
                  onChange={handleChange}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Semanal</span>
                  <p className="text-sm text-gray-500">10 cuotas - Cada sábado</p>
                </div>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipo"
                  value="quincenal"
                  checked={formData.tipo === 'quincenal'}
                  onChange={handleChange}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Quincenal</span>
                  <p className="text-sm text-gray-500">5 cuotas</p>
                </div>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipo"
                  value="mensual"
                  checked={formData.tipo === 'mensual'}
                  onChange={handleChange}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Mensual</span>
                  <p className="text-sm text-gray-500">3 cuotas - Cada mes</p>
                </div>
              </label>
            </div>
          </div>

          {/* Opciones quincenales */}
          {formData.tipo === 'quincenal' && (
            <div>
              <label className="label">Días de Cobro Quincenal *</label>
              <select
                name="tipoQuincenal"
                value={formData.tipoQuincenal}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="1-16">Días 1 y 16 de cada mes</option>
                <option value="5-20">Días 5 y 20 de cada mes</option>
              </select>
            </div>
          )}

          {/* Fecha de inicio */}
          <div>
            <label className="label">Fecha de Inicio *</label>
            <input
              type="date"
              name="fechaInicio"
              value={formData.fechaInicio}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          {/* Papelería/Ajuste Manual */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="usarPapeleriaManual"
                checked={formData.usarPapeleriaManual}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  usarPapeleriaManual: e.target.checked,
                  papeleriaManual: e.target.checked ? prev.papeleriaManual : ''
                }))}
                className="h-4 w-4 text-sky-600 focus:ring-sky-500 rounded"
              />
              <label htmlFor="usarPapeleriaManual" className="ml-2 text-sm font-medium text-gray-700">
                Usar valor manual de papelería/ajuste
              </label>
            </div>
            
            {formData.usarPapeleriaManual && (
              <div>
                <label className="label">Valor Manual (Papelería/Ajuste)</label>
                <input
                  type="number"
                  name="papeleriaManual"
                  value={formData.papeleriaManual}
                  onChange={handleChange}
                  placeholder={`Automático: ${formatearMoneda(papeleriaAutomatica)}`}
                  className="input-field"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Ejemplo: Si el cliente paga más tarde, puedes cobrar más. Si paga antes, puedes cobrar menos.
                </p>
              </div>
            )}
          </div>

          {/* Resumen del crédito */}
          <div className="bg-sky-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen del Crédito</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monto del crédito:</span>
              <span className="font-semibold text-gray-900">
                {formatearMoneda(formData.monto)}
              </span>
            </div>

            <div className="flex justify-between text-sm text-orange-700 bg-orange-100 -mx-4 px-4 py-2">
              <span className="font-medium">
                - Papelería {formData.usarPapeleriaManual ? '(Manual)' : '($5,000 c/100k)'}:
              </span>
              <span className="font-semibold">
                - {formatearMoneda(papeleria)}
              </span>
            </div>

            <div className="flex justify-between text-sm pt-2 border-t border-sky-200">
              <span className="text-green-700 font-bold">Monto a entregar:</span>
              <span className="font-bold text-green-700 text-lg">
                {formatearMoneda(montoEntregado)}
              </span>
            </div>

            <div className="h-px bg-sky-300 my-3"></div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Interés (20% mensual):</span>
              <span className="font-semibold text-gray-900">
                {formatearMoneda(totalAPagar - formData.monto)}
              </span>
            </div>

            <div className="flex justify-between text-sm pt-2 border-t border-sky-200">
              <span className="text-gray-900 font-medium">Total a pagar:</span>
              <span className="font-bold text-gray-900">
                {formatearMoneda(totalAPagar)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Número de cuotas:</span>
              <span className="font-semibold text-gray-900">{numCuotas}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor por cuota:</span>
              <span className="font-semibold text-gray-900">
                {formatearMoneda(valorCuota)}
              </span>
            </div>
          </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 p-6 pt-4 border-t shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Crear Crédito
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditoForm;
