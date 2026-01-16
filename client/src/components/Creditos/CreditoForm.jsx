import React, { useState, useEffect } from 'react';
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

const CreditoForm = ({ onSubmit, onClose, carteraCliente = 'K1', tipoPagoPredefinido = null, tipoPagoPreferido = null }) => {
  // Para K1 y K3: tipo de pago automático según posición (no se puede seleccionar)
  // Para K2: tipo de pago seleccionable (quincenal o mensual)
  const tipoPagoInicial = (carteraCliente === 'K1' || carteraCliente === 'K3')
    ? (tipoPagoPredefinido || (tipoPagoPreferido && ['semanal', 'quincenal', 'mensual'].includes(tipoPagoPreferido) ? tipoPagoPreferido : 'quincenal'))
    : (tipoPagoPreferido && ['quincenal', 'mensual'].includes(tipoPagoPreferido) ? tipoPagoPreferido : 'quincenal');

  const [formData, setFormData] = useState({
    monto: MONTOS_DISPONIBLES[0],
    tipo: tipoPagoInicial,
    tipoQuincenal: '1-16',
    fechaInicio: obtenerFechaLocal(),
    papeleriaManual: '',
    usarPapeleriaManual: false,
    usarMontoManual: false,
    montoManual: '',
    valorCuotaManual: '',
    numCuotasManual: ''
  });

  // Para K1 y K3: asegurar que el tipo de pago siempre sea el correcto (no se puede cambiar)
  // Para K2: solo actualizar si cambia el preferido inicialmente
  useEffect(() => {
    if (carteraCliente === 'K1' || carteraCliente === 'K3') {
      // Si hay un tipo predefinido (determinado por la card) o preferido, usarlo
      const tipoFijo = tipoPagoPredefinido ||
        (tipoPagoPreferido && ['semanal', 'quincenal', 'mensual'].includes(tipoPagoPreferido) ? tipoPagoPreferido : null);

      if (tipoFijo) {
        setFormData(prev => ({ ...prev, tipo: tipoFijo }));
      }
    } else if (carteraCliente === 'K2') {
      if (tipoPagoPreferido && ['quincenal', 'mensual'].includes(tipoPagoPreferido)) {
        setFormData(prev => ({ ...prev, tipo: tipoPagoPreferido }));
      }
    }
  }, [carteraCliente, tipoPagoPredefinido, tipoPagoPreferido]);

  // Cálculos dinámicos
  const montoReal = formData.usarMontoManual && formData.montoManual
    ? parseFloat(formData.montoManual)
    : formData.monto;

  const papeleriaAutomatica = calcularPapeleria(montoReal);
  const papeleria = formData.usarPapeleriaManual && formData.papeleriaManual
    ? parseFloat(formData.papeleriaManual)
    : papeleriaAutomatica;

  const montoEntregado = montoReal - papeleria;

  // Si es manual, usar valores manuales para cálculos
  const valorCuota = formData.usarMontoManual && formData.valorCuotaManual
    ? parseFloat(formData.valorCuotaManual)
    : calcularValorCuota(montoReal, formData.tipo);

  const numCuotas = formData.usarMontoManual && formData.numCuotasManual
    ? parseInt(formData.numCuotasManual)
    : obtenerNumCuotas(montoReal, formData.tipo);

  const totalAPagar = formData.usarMontoManual
    ? (valorCuota * numCuotas)
    : calcularTotalAPagar(montoReal, formData.tipo);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'monto' ? parseInt(value) : value)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Si es manual, validar que los campos estén llenos
    if (formData.usarMontoManual) {
      if (!formData.montoManual || !formData.valorCuotaManual || !formData.numCuotasManual) {
        alert('Por favor complete todos los campos manuales');
        return;
      }
    }

    // Preparar datos para enviar
    const dataToSubmit = {
      ...formData,
      monto: montoReal, // Enviar el monto real (sea manual o de lista)
      valorCuota: valorCuota, // Enviar valor cuota calculado o manual
      numCuotas: numCuotas, // Enviar num cuotas calculado o manual
      totalAPagar: totalAPagar, // Enviar total calculado
      esManual: formData.usarMontoManual
    };

    onSubmit(dataToSubmit);
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

            {/* Opción Manual */}
            <div className="flex items-center mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <input
                type="checkbox"
                id="usarMontoManual"
                name="usarMontoManual"
                checked={formData.usarMontoManual}
                onChange={handleChange}
                className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 rounded"
              />
              <label htmlFor="usarMontoManual" className="ml-3 text-sm font-medium text-yellow-800 cursor-pointer">
                Ingresar valores manualmente (Monto y Cuota)
              </label>
            </div>

            {/* Monto del préstamo */}
            <div>
              <label className="label">Monto del Préstamo *</label>
              {formData.usarMontoManual ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="montoManual"
                    value={formData.montoManual}
                    onChange={handleChange}
                    className="input-field pl-8"
                    placeholder="Ej: 1000000"
                    required={formData.usarMontoManual}
                  />
                </div>
              ) : (
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
              )}
            </div>

            {/* Campos adicionales si es manual */}
            {formData.usarMontoManual && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Valor de Cuota *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="valorCuotaManual"
                      value={formData.valorCuotaManual}
                      onChange={handleChange}
                      className="input-field pl-8"
                      placeholder="Ej: 50000"
                      required={formData.usarMontoManual}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Número de Cuotas *</label>
                  <input
                    type="number"
                    name="numCuotasManual"
                    value={formData.numCuotasManual}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ej: 10"
                    required={formData.usarMontoManual}
                  />
                </div>
              </div>
            )}

            {/* Tipo de pago */}
            <div>
              <label className="label">
                Tipo de Pago *
                <span className="text-xs text-gray-500 ml-2 font-normal">
                  (Cartera {carteraCliente})
                </span>
              </label>
              {(tipoPagoPredefinido || (tipoPagoPreferido && ['semanal', 'quincenal', 'mensual'].includes(tipoPagoPreferido))) ? (
                // Si está predefinido por la card o tiene preferencia fija, mostrar solo lectura
                <div className={`p-4 border-2 rounded-lg ${carteraCliente === 'K3'
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-blue-50 border-blue-300'
                  }`}>
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center ${carteraCliente === 'K3' ? 'bg-orange-600' : 'bg-sky-600'
                      }`}>
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                    <div className="ml-3">
                      <span className="font-medium text-gray-900 capitalize">
                        {formData.tipo}
                      </span>
                      <p className="text-sm text-gray-500">
                        {formData.tipo === 'semanal' && '10 cuotas - Cada sábado'}
                        {formData.tipo === 'quincenal' && '5 cuotas'}
                        {formData.tipo === 'mensual' && '3 cuotas - Cada mes'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    El tipo de pago está fijo según la configuración del cliente o su posición.
                  </p>
                </div>
              ) : (
                // Si no tiene preferencia (pool mixto o K2), permitir selección
                <div className="space-y-3">
                  {(carteraCliente === 'K1' || carteraCliente === 'K3') && (
                    <p className="text-xs font-medium text-blue-600 mb-2">
                      Este cliente está en un cupo compartido. Seleccione la modalidad:
                    </p>
                  )}
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
              )}
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
                  {formatearMoneda(montoReal)}
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
                <span className="text-gray-600">Interés {formData.usarMontoManual ? '(Manual)' : '(20% mensual)'}:</span>
                <span className="font-semibold text-gray-900">
                  {formatearMoneda(totalAPagar - montoReal)}
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
