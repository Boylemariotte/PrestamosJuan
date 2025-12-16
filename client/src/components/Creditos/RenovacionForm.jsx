import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import { 
  MONTOS_DISPONIBLES, 
  calcularTotalAPagar, 
  calcularValorCuota,
  obtenerNumCuotas,
  calcularPapeleria,
  formatearMoneda 
} from '../../utils/creditCalculations';
import { obtenerFechaLocal } from '../../utils/dateUtils';

const RenovacionForm = ({ creditoAnterior, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    monto: MONTOS_DISPONIBLES[0],
    tipo: creditoAnterior.tipo, // Mantener el mismo tipo de pago
    tipoQuincenal: creditoAnterior.tipoQuincenal || '1-16',
    fechaInicio: obtenerFechaLocal()
  });

  // Calcular deuda pendiente del crédito anterior
  const cuotasPendientes = creditoAnterior.cuotas.filter(c => !c.pagado);
  
  // Calcular valor de cuotas pendientes (valor de cuota + multas de cada cuota)
  const valorCuotasPendientes = cuotasPendientes.reduce((sum, cuota) => {
    const multasCuota = (cuota.multas?.reduce((s, m) => s + m.valor, 0) || 0);
    return sum + creditoAnterior.valorCuota + multasCuota;
  }, 0);
  
  // Calcular total de multas del crédito
  const totalMultas = creditoAnterior.cuotas.reduce((sum, cuota) => {
    return sum + (cuota.multas?.reduce((s, m) => s + m.valor, 0) || 0);
  }, 0);
  
  const totalAbonos = (creditoAnterior.abonos || []).reduce((sum, abono) => sum + abono.valor, 0);
  const totalDescuentos = (creditoAnterior.descuentos || []).reduce((sum, desc) => sum + desc.valor, 0);
  
  // Deuda pendiente = valor de cuotas pendientes - abonos aplicados
  const deudaPendiente = valorCuotasPendientes - totalAbonos;

  // Cálculos del nuevo crédito
  const papeleria = calcularPapeleria(formData.monto);
  const totalAPagar = calcularTotalAPagar(formData.monto, formData.tipo);
  const numCuotas = obtenerNumCuotas(formData.monto, formData.tipo);
  const valorCuota = calcularValorCuota(formData.monto, formData.tipo);
  
  // Monto a entregar = Nuevo monto - Papelería - Deuda pendiente
  const montoAEntregar = formData.monto - papeleria - deudaPendiente;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monto' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (montoAEntregar < 0) {
      alert('La deuda pendiente es mayor que el monto de renovación. Por favor, selecciona un monto mayor.');
      return;
    }
    onSubmit({
      ...formData,
      deudaPendiente,
      montoAEntregar: montoAEntregar
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl shrink-0">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            <h2 className="text-xl font-bold">Renovar Crédito</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Información del crédito anterior */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Deuda Pendiente del Crédito Actual
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-orange-700">Cuotas pendientes:</span>
                <span className="font-semibold text-orange-900">
                  {cuotasPendientes.length} de {creditoAnterior.numCuotas}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Valor cuotas pendientes:</span>
                <span className="font-semibold text-orange-900">
                  {formatearMoneda(valorCuotasPendientes)}
                </span>
              </div>
              {totalAbonos > 0 && (
                <div className="flex justify-between">
                  <span className="text-orange-700">- Abonos aplicados:</span>
                  <span className="font-semibold text-green-700">
                    - {formatearMoneda(totalAbonos)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-orange-300">
                <span className="text-orange-800 font-bold">Deuda total:</span>
                <span className="font-bold text-orange-900 text-lg">
                  {formatearMoneda(deudaPendiente)}
                </span>
              </div>
            </div>
          </div>

          {/* Selección de monto */}
          <div>
            <label className="label">Monto de Renovación *</label>
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
            <div className="space-y-2">
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

          {/* Resumen de la renovación */}
          <div className={`p-4 rounded-lg space-y-2 ${montoAEntregar >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className="font-semibold text-gray-900 mb-3">Resumen de Renovación</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monto de renovación:</span>
              <span className="font-semibold text-gray-900">
                {formatearMoneda(formData.monto)}
              </span>
            </div>

            <div className="flex justify-between text-sm text-orange-700 bg-orange-100 -mx-4 px-4 py-2">
              <span className="font-medium">- Papelería ($5,000 c/100k):</span>
              <span className="font-semibold">
                - {formatearMoneda(papeleria)}
              </span>
            </div>

            <div className="flex justify-between text-sm text-red-700 bg-red-100 -mx-4 px-4 py-2">
              <span className="font-medium">- Deuda pendiente:</span>
              <span className="font-semibold">
                - {formatearMoneda(deudaPendiente)}
              </span>
            </div>

            <div className={`flex justify-between text-sm pt-2 border-t ${montoAEntregar >= 0 ? 'border-green-200' : 'border-red-200'}`}>
              <span className={`font-bold ${montoAEntregar >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                Monto a entregar:
              </span>
              <span className={`font-bold text-lg ${montoAEntregar >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatearMoneda(montoAEntregar)}
              </span>
            </div>

            {montoAEntregar < 0 && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ La deuda pendiente es mayor que el monto de renovación. Selecciona un monto mayor.
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-sm text-gray-600 mb-2">Nuevo crédito:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total a pagar:</span>
                  <span className="font-semibold">{formatearMoneda(totalAPagar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de cuotas:</span>
                  <span className="font-semibold">{numCuotas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor por cuota:</span>
                  <span className="font-semibold">{formatearMoneda(valorCuota)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={montoAEntregar < 0}
              className={`flex-1 flex items-center justify-center gap-2 ${
                montoAEntregar >= 0
                  ? 'btn-primary bg-gradient-to-r from-purple-600 to-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Renovar Crédito
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenovacionForm;
