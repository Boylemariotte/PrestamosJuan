import React from 'react';
import { Tag, RefreshCw } from 'lucide-react';
import { formatearMoneda, formatearFechaCorta } from '../../utils/creditCalculations';


const ResumenCredito = ({
  credito,
  estado,
  colorEstado,
  ETIQUETAS,
  totalMultasCredito,
  totalAbonos,
  totalDescuentos,
  progreso,
  cuotasActualizadas,
  mostrarFormularioAbono,
  valorAbono,
  descripcionAbono,
  fechaAbono,
  puedeRenovar,
  onMostrarSelectorEtiqueta,
  onMostrarFormularioAbono,
  onValorAbonoChange,
  onDescripcionAbonoChange,
  onFechaAbonoChange,
  onAgregarAbono,
  onCancelarAbono,
  onMostrarFormularioRenovacion
}) => {
  // Calcular saldo pendiente
  // IMPORTANTE: credito.totalAPagar ya incluye las multas pendientes (calculado en el backend)
  // El totalAPagar = (valorCuota * numCuotas) + saldoPendienteMultas
  // Donde saldoPendienteMultas ya considera los abonos parciales a multas
  // Por lo tanto, el saldo pendiente es simplemente totalAPagar menos los abonos aplicados a cuotas
  const calcularSaldoPendiente = () => {
    // Calcular abonos aplicados a cuotas (sumar todos los abonoAplicado de las cuotas)
    let totalAbonosAplicadosCuotas = 0;
    if (cuotasActualizadas) {
      cuotasActualizadas.forEach(cuota => {
        totalAbonosAplicadosCuotas += (cuota.abonoAplicado || 0);
      });
    }
    
    // NOTA: Los abonos a multas NO se restan aquí porque ya están considerados en el totalAPagar
    // El totalAPagar incluye saldoPendienteMultas = suma de (multa.valor - multa.abonoAplicado)
    // Por lo tanto, el totalAPagar ya refleja el saldo pendiente de multas correctamente

    // Saldo pendiente = Total a pagar (ya incluye multas pendientes) - Descuentos - Abonos aplicados a cuotas
    const saldoPendiente = credito.totalAPagar - totalDescuentos - totalAbonosAplicadosCuotas;
    return formatearMoneda(Math.max(0, saldoPendiente));
  };

  const saldoPendiente = calcularSaldoPendiente();

  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-4">
      {/* Información general */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorEstado}`}>
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </span>

            {/* Etiqueta actual */}
            {credito.etiqueta && ETIQUETAS[credito.etiqueta] && (
              <span className={`px-3 py-1 rounded-lg text-sm font-medium border-2 flex items-center gap-1 ${ETIQUETAS[credito.etiqueta].color}`}>
                {React.createElement(ETIQUETAS[credito.etiqueta].icono, { className: 'h-4 w-4' })}
                {ETIQUETAS[credito.etiqueta].nombre}
              </span>
            )}

            {/* Botón para asignar etiqueta (solo si el crédito está finalizado) */}
            {estado === 'finalizado' && (
              <button
                onClick={onMostrarSelectorEtiqueta}
                className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-300 flex items-center gap-1 transition-colors"
                title="Asignar etiqueta"
              >
                <Tag className="h-4 w-4" />
                {credito.etiqueta ? 'Cambiar' : 'Etiquetar'}
              </button>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">Monto del crédito</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatearMoneda(credito.monto)}
            </p>
          </div>

          {credito.papeleria && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 -mx-2">
              <p className="text-xs text-orange-600 font-medium">Descuento de papelería</p>
              <p className="text-lg font-bold text-orange-700">
                - {formatearMoneda(credito.papeleria)}
              </p>
            </div>
          )}

          {credito.montoEntregado && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 -mx-2">
              <p className="text-xs text-green-600 font-medium">Monto entregado al cliente</p>
              <p className="text-2xl font-bold text-green-700">
                {formatearMoneda(credito.montoEntregado)}
              </p>
            </div>
          )}

          <div className="pt-3 border-t">
            <p className="text-sm text-gray-500">Total a pagar</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatearMoneda(credito.totalAPagar)}
            </p>
          </div>

          {totalDescuentos > 0 && (
            <div>
              <p className="text-sm text-green-600">Total descuentos</p>
              <p className="text-xl font-bold text-green-600">
                - {formatearMoneda(totalDescuentos)}
              </p>
            </div>
          )}



          {totalMultasCredito > 0 && (
            <div>
              <p className="text-sm text-red-600">Total multas/recargos</p>
              <p className="text-xl font-bold text-red-600">
                + {formatearMoneda(totalMultasCredito)}
              </p>
            </div>
          )}

          {saldoPendiente && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-500">Saldo pendiente</p>
              <p className="text-2xl font-bold text-gray-900">
                {saldoPendiente}
              </p>
            </div>
          )}

          <div className="space-y-2 mt-4">


            {/* Botón de Renovación */}
            {puedeRenovar && (
              <button
                onClick={onMostrarFormularioRenovacion}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-lg"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Renovar Crédito
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tipo de pago:</span>
            <span className="text-sm font-medium capitalize">{credito.tipo}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Número de cuotas:</span>
            <span className="text-sm font-medium">{credito.numCuotas}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Valor por cuota:</span>
            <span className="text-sm font-medium">{formatearMoneda(credito.valorCuota)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Fecha de inicio:</span>
            <span className="text-sm font-medium">{formatearFechaCorta(credito.fechaInicio)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Interés aplicado:</span>
            <span className="text-sm font-medium">20% mensual</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumenCredito;

