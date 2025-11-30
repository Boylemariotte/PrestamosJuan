import React, { useState } from 'react';
import { Check, Calendar, AlertCircle, Edit2, Plus, DollarSign, Trash2 } from 'lucide-react';
import { 
  formatearMoneda, 
  formatearFechaCorta, 
  calcularTotalMultasCuota, 
  calcularDiasMora,
  formatearFecha 
} from '../../utils/creditCalculations';
import FormularioMulta from './FormularioMulta';
import EditorFecha from './EditorFecha';
import SelectorFechaPago from './SelectorFechaPago';

const ListaCuotas = ({
  cuotasActualizadas,
  credito,
  mostrarEditorFecha,
  nuevaFecha,
  mostrarFormularioMulta,
  valorMulta,
  motivoMulta,
  onEditarFecha,
  onFechaChange,
  onGuardarFecha,
  onCancelarEdicionFecha,
  onMostrarFormularioMulta,
  onValorMultaChange,
  onMotivoMultaChange,
  onAgregarMulta,
  onCancelarMulta,
  onEliminarMulta,
  onPago
}) => {
  const [mostrarSelectorFecha, setMostrarSelectorFecha] = useState(null);

  const handlePago = (nroCuota, pagado) => {
    if (pagado) {
      // Si ya está pagado, cancelar directamente
      onPago(nroCuota, pagado);
    } else {
      // Si no está pagado, mostrar el selector de fecha
      setMostrarSelectorFecha(nroCuota);
    }
  };

  const handleConfirmarPago = (nroCuota, fechaPago) => {
    onPago(nroCuota, false, fechaPago);
    setMostrarSelectorFecha(null);
  };

  const handleCancelarSelectorFecha = () => {
    setMostrarSelectorFecha(null);
  };
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Cuotas</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {cuotasActualizadas.map((cuota) => {
          // Calcular si la cuota está completamente pagada (manual o con abono)
          const totalMultas = calcularTotalMultasCuota(cuota);
          const multasPendientes = totalMultas - (cuota.multasCubiertas || 0);
          const valorPendiente = (credito.valorCuota - (cuota.abonoAplicado || 0)) + multasPendientes;
          const isPaid = cuota.pagado || (valorPendiente <= 0 && cuota.abonoAplicado > 0);
          
          const diasMora = !isPaid ? calcularDiasMora(cuota.fechaProgramada) : 0;
          const enMora = diasMora > 0;

          return (
            <div key={cuota.nroCuota} className="space-y-2">
              <div
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  isPaid
                    ? 'bg-green-50 border-green-200'
                    : enMora
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isPaid
                      ? 'bg-green-500 text-white'
                      : enMora
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isPaid ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{cuota.nroCuota}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Cuota #{cuota.nroCuota}
                    </p>
                    <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatearFechaCorta(cuota.fechaProgramada)}
                      </span>
                      {isPaid && cuota.fechaPago && (
                        <span className="text-green-600">
                          Pagado: {formatearFechaCorta(cuota.fechaPago)}
                        </span>
                      )}
                      {enMora && (
                        <span className="flex items-center text-red-600 font-medium">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {diasMora} día{diasMora !== 1 ? 's' : ''} de mora
                        </span>
                      )}
                    </div>
                    
                    {/* Desglose de valores */}
                    <div className="mt-2 text-sm space-y-1">
                      <div>
                        <span className="text-gray-600">Valor cuota: </span>
                        <span className="font-medium">{formatearMoneda(credito.valorCuota)}</span>
                      </div>
                      
                      {cuota.abonoAplicado > 0 && (
                        <div>
                          <span className="text-blue-600 font-semibold">
                            - Abono aplicado: {formatearMoneda(cuota.abonoAplicado)}
                          </span>
                        </div>
                      )}
                      
                      {totalMultas > 0 && (
                        <div>
                          <span className="text-red-600 font-semibold">
                            + Multas: {formatearMoneda(totalMultas)}
                          </span>
                          {cuota.multasCubiertas > 0 && (
                            <span className="text-blue-600 font-semibold ml-2">
                              (- {formatearMoneda(cuota.multasCubiertas)} cubierto)
                            </span>
                          )}
                        </div>
                      )}
                      
                      {!isPaid && valorPendiente < credito.valorCuota && (
                        <div className="pt-1 border-t">
                          <span className="text-gray-900 font-bold">
                            Pendiente: {formatearMoneda(valorPendiente)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isPaid && (
                    <>
                      <button
                        onClick={() => onEditarFecha(cuota.nroCuota, cuota.fechaProgramada)}
                        className="px-3 py-2 rounded-lg font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors flex items-center"
                        title="Cambiar fecha de vencimiento"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Fecha
                      </button>
                      <button
                        onClick={() => onMostrarFormularioMulta(cuota.nroCuota)}
                        className="px-3 py-2 rounded-lg font-medium bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors flex items-center"
                        title="Agregar multa/recargo"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Multa
                      </button>
                    </>
                  )}
                  <div className="text-right">
                    {isPaid ? (
                      <span className="font-semibold text-green-600 block">
                        ✓ Pagado
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-900 block">
                          {formatearMoneda(valorPendiente)}
                        </span>
                        {/* Advertencia si hay abono parcial */}
                        {cuota.abonoAplicado > 0 && valorPendiente > 0 && (
                          <span className="text-xs text-orange-600 block mt-1">
                            Abono parcial
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Verificar si hay abonos (a cuota o multas) para deshabilitar el botón */}
                  {!isPaid && (cuota.abonoAplicado > 0 || cuota.multasCubiertas > 0) && valorPendiente > 0 ? (
                    <div className="flex flex-col items-end">
                      <button
                        disabled
                        className="px-4 py-2 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                        title="Debes completar el pago con abonos"
                      >
                        Marcar pagado
                      </button>
                      <span className="text-xs text-orange-600 mt-1 text-right max-w-[150px]">
                        Completa con abonos
                      </span>
                    </div>
                  ) : isPaid && (cuota.abonoAplicado > 0 || cuota.multasCubiertas > 0) ? (
                    <div className="flex flex-col items-end">
                      <button
                        disabled
                        className="px-4 py-2 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                        title="Elimina primero los abonos asociados"
                      >
                        Cancelar
                      </button>
                      <span className="text-xs text-orange-600 mt-1 text-right max-w-[150px]">
                        Elimina primero el abono
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePago(cuota.nroCuota, cuota.pagado)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isPaid
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          : 'bg-sky-600 hover:bg-sky-700 text-white'
                      }`}
                    >
                      {isPaid ? 'Cancelar' : 'Marcar pagado'}
                    </button>
                  )}
                </div>
              </div>

              {/* Modal para editar fecha */}
              {mostrarEditorFecha === cuota.nroCuota && (
                <EditorFecha
                  cuota={cuota}
                  credito={credito}
                  nuevaFecha={nuevaFecha}
                  onFechaChange={onFechaChange}
                  onGuardar={onGuardarFecha}
                  onCancelar={onCancelarEdicionFecha}
                />
              )}

              {/* Formulario para agregar multa */}
              {mostrarFormularioMulta === cuota.nroCuota && (
                <FormularioMulta
                  valorMulta={valorMulta}
                  motivoMulta={motivoMulta}
                  onValorChange={onValorMultaChange}
                  onMotivoChange={onMotivoMultaChange}
                  onSubmit={() => onAgregarMulta(cuota.nroCuota)}
                  onCancel={onCancelarMulta}
                />
              )}

              {/* Lista de multas existentes */}
              {cuota.multas && cuota.multas.length > 0 && (
                <div className="ml-14 space-y-2">
                  {cuota.multas.map((multa) => (
                    <div
                      key={multa.id}
                      className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-orange-900">
                            {formatearMoneda(multa.valor)}
                          </span>
                          <span className="text-sm text-gray-600">
                            - {multa.motivo}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Aplicada el {formatearFechaCorta(multa.fecha.split('T')[0])}
                        </p>
                      </div>
                      <button
                        onClick={() => onEliminarMulta(cuota.nroCuota, multa.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar multa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selector de fecha de pago */}
      {mostrarSelectorFecha && (
        <SelectorFechaPago
          cuota={cuotasActualizadas.find(c => c.nroCuota === mostrarSelectorFecha)}
          credito={credito}
          isOpen={true}
          onConfirmar={handleConfirmarPago}
          onCancelar={handleCancelarSelectorFecha}
        />
      )}
    </div>
  );
};

export default ListaCuotas;

