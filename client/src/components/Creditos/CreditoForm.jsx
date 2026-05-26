import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import {
  MONTOS_DISPONIBLES,
  calcularTotalAPagar,
  calcularValorCuota,
  obtenerNumCuotas,
  calcularPapeleria,
  calcularMontoEntregado,
  formatearMoneda,
  validarFechasManuales,
  crearCuotasDesdeFechas
} from '../../utils/creditCalculations';
import { obtenerFechaLocal } from '../../utils/dateUtils';

const CreditoForm = ({ onSubmit, onClose, carteraCliente = 'K1', tipoPagoPredefinido = null, tipoPagoPreferido = null, carteras = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Obtener tipos de pago permitidos de la cartera del cliente
  const tiposPermitidos = useMemo(() => {
    const carteraObj = carteras?.find(c => c.nombre === carteraCliente);
    if (carteraObj?.secciones) {
      const tipos = [...new Set(carteraObj.secciones.flatMap(s => s.tiposPagoPermitidos || []))];
      if (tipos.length > 0) return tipos;
    }
    // Fallback: si no hay info de secciones, permitir todos
    return ['semanal', 'quincenal', 'mensual'];
  }, [carteras, carteraCliente]);

  // Determinar tipo de pago inicial
  const tipoPagoInicial = tipoPagoPredefinido
    || (tipoPagoPreferido && tiposPermitidos.includes(tipoPagoPreferido) ? tipoPagoPreferido : null)
    || tiposPermitidos[0]
    || 'quincenal';

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
    numCuotasManual: '',
    modoFechas: 'automatico' // 'automatico' | 'manual'
  });

  // Estado para fechas manuales
  const [fechasManuales, setFechasManuales] = useState([]);
  const [erroresFechas, setErroresFechas] = useState([]);

  // Cálculos dinámicos (antes de los useEffect que dependen de ellos)
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

  // Asegurar que el tipo de pago sea válido cuando cambian las props
  useEffect(() => {
    if (tipoPagoPredefinido && tiposPermitidos.includes(tipoPagoPredefinido)) {
      setFormData(prev => ({ ...prev, tipo: tipoPagoPredefinido }));
    } else if (tipoPagoPreferido && tiposPermitidos.includes(tipoPagoPreferido)) {
      setFormData(prev => ({ ...prev, tipo: tipoPagoPreferido }));
    }
  }, [carteraCliente, tipoPagoPredefinido, tipoPagoPreferido, tiposPermitidos]);

  // Inicializar fechas manuales cuando cambia el número de cuotas o el modo
  useEffect(() => {
    if (formData.modoFechas === 'manual') {
      const nuevasFechas = Array.from({ length: numCuotas }, (_, i) => {
        // Si ya existe una fecha, mantenerla, si no, dejar vacía
        return fechasManuales[i] || '';
      });
      setFechasManuales(nuevasFechas);
      setErroresFechas([]);
    }
  }, [numCuotas, formData.modoFechas]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'monto' ? parseInt(value) : value)
    }));
  };

  // Manejar cambio de fecha manual específica
  const handleFechaManualChange = (index, fecha) => {
    const nuevasFechas = [...fechasManuales];
    nuevasFechas[index] = fecha;
    setFechasManuales(nuevasFechas);

    // Validar inmediatamente
    if (fecha) {
      const validacion = validarFechasManuales(nuevasFechas, formData.tipo);
      setErroresFechas(validacion.errores);
    } else {
      setErroresFechas([]);
    }
  };

  // Autocompletar fechas basadas en la primera fecha
  const autocompletarFechas = () => {
    if (fechasManuales.length === 0 || !fechasManuales[0]) {
      alert('Por favor ingrese la primera fecha primero');
      return;
    }

    const primeraFecha = new Date(fechasManuales[0]);
    const nuevasFechas = [fechasManuales[0]];

    for (let i = 1; i < numCuotas; i++) {
      let fechaSiguiente;
      
      switch (formData.tipo) {
        case 'diario':
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setDate(primeraFecha.getDate() + i);
          break;
        case 'semanal':
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setDate(primeraFecha.getDate() + (i * 7));
          break;
        case 'quincenal':
          // Lógica simplificada para quincenal
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setDate(primeraFecha.getDate() + (i * 15));
          break;
        case 'mensual':
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setMonth(primeraFecha.getMonth() + i);
          break;
        default:
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setDate(primeraFecha.getDate() + (i * 7));
      }

      nuevasFechas.push(fechaSiguiente.toISOString().split('T')[0]);
    }

    setFechasManuales(nuevasFechas);
    
    // Validar fechas autocompletadas
    const validacion = validarFechasManuales(nuevasFechas, formData.tipo);
    setErroresFechas(validacion.errores);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Si es manual, validar que los campos estén llenos
    if (formData.usarMontoManual) {
      if (!formData.montoManual || !formData.valorCuotaManual || !formData.numCuotasManual) {
        alert('Por favor complete todos los campos manuales');
        return;
      }
    }

    // Validar fechas manuales si está en modo manual
    if (formData.modoFechas === 'manual') {
      const validacion = validarFechasManuales(fechasManuales, formData.tipo);
      if (!validacion.valido) {
        alert('Errores en las fechas:\n' + validacion.errores.join('\n'));
        return;
      }
    }

    // Preparar cuotas según el modo
    let cuotas;
    if (formData.modoFechas === 'manual') {
      cuotas = crearCuotasDesdeFechas(fechasManuales, valorCuota);
    } else {
      cuotas = [];
    }

    const dataToSubmit = {
      ...formData,
      monto: montoReal,
      valorCuota: valorCuota,
      numCuotas: numCuotas,
      totalAPagar: totalAPagar,
      esManual: formData.usarMontoManual,
      cuotas: cuotas
    };

    setIsSubmitting(true);
    try {
      await onSubmit(dataToSubmit);
    } finally {
      setIsSubmitting(false);
    }
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
              {(tipoPagoPredefinido || (tipoPagoPreferido && tiposPermitidos.includes(tipoPagoPreferido))) ? (
                // Si está predefinido por la card o tiene preferencia fija, mostrar solo lectura
                <div className="p-4 border-2 rounded-lg bg-blue-50 border-blue-300">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full flex items-center justify-center bg-sky-600">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    </div>
                    <div className="ml-3">
                      <span className="font-medium text-gray-900 capitalize">
                        {formData.tipo}
                      </span>
                      <p className="text-sm text-gray-500">
                        {formData.tipo === 'diario' && 'Cuotas diarias'}
                        {formData.tipo === 'semanal' && '10 cuotas - Cada semana'}
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
                // Permitir selección entre los tipos que la cartera permite
                <div className="space-y-3">
                  {tiposPermitidos.length > 1 && (
                    <p className="text-xs font-medium text-blue-600 mb-2">
                      Seleccione la modalidad de pago:
                    </p>
                  )}
                  {tiposPermitidos.map(tipo => {
                    const descripciones = {
                      diario: 'Cuotas diarias',
                      semanal: '10 cuotas - Cada semana',
                      quincenal: '5 cuotas',
                      mensual: '3 cuotas - Cada mes'
                    };
                    return (
                      <label key={tipo} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="tipo"
                          value={tipo}
                          checked={formData.tipo === tipo}
                          onChange={handleChange}
                          className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-gray-900 capitalize">{tipo}</span>
                          <p className="text-sm text-gray-500">{descripciones[tipo] || ''}</p>
                        </div>
                      </label>
                    );
                  })}
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
                disabled={formData.modoFechas === 'manual'}
              />
              {formData.modoFechas === 'manual' && (
                <p className="text-xs text-gray-500 mt-1">
                  La fecha de inicio se ignora en modo manual. Use las fechas específicas de cada cuota abajo.
                </p>
              )}
            </div>

            {/* Modo de Fechas */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center mb-3">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <label className="font-medium text-gray-900">Modo de Fechas de Cuotas</label>
              </div>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="modoFechas"
                    value="automatico"
                    checked={formData.modoFechas === 'automatico'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm">Automático - Generar fechas según tipo de pago</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="modoFechas"
                    value="manual"
                    checked={formData.modoFechas === 'manual'}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm">Manual - Ingresar cada fecha individualmente</span>
                </label>
              </div>
            </div>

            {/* Selector de Fechas Manuales */}
            {formData.modoFechas === 'manual' && (
              <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                    <label className="font-medium text-gray-900">Fechas de Cuotas Manuales</label>
                  </div>
                  <button
                    type="button"
                    onClick={autocompletarFechas}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    Autocompletar
                  </button>
                </div>
                
                {erroresFechas.length > 0 && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm text-red-800">Errores encontrados:</span>
                    </div>
                    <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                      {erroresFechas.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Array.from({ length: numCuotas }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 w-16">
                        Cuota {i + 1}:
                      </label>
                      <input
                        type="date"
                        value={fechasManuales[i] || ''}
                        onChange={(e) => handleFechaManualChange(i, e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Las fechas deben ser secuenciales y no pueden ser anteriores a hoy.
                </p>
              </div>
            )}

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
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando...' : 'Crear Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditoForm;
