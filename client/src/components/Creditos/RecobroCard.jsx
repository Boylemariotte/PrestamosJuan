import React from 'react';
import { Check, Plus, Edit2 } from 'lucide-react';
import { formatearMoneda, formatearFechaCorta } from '../../utils/creditCalculations';

const RecobroCard = ({ todasLasMultas, onNuevaMulta, onPagarMulta, onEditarMulta, soloLectura = false }) => {
  return (
    <div key="recobro" className="border-2 border-blue-600 rounded-lg p-3 flex flex-col min-h-36 w-full print-grid-item">
      <div className="flex items-center justify-between mb-2">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wide">RECOBRO</span>
        <div className="flex items-center gap-2">
          {todasLasMultas.length > 0 && (
            <span className="text-blue-500 text-xs font-semibold">
              {todasLasMultas.length} multa{todasLasMultas.length !== 1 ? 's' : ''}
            </span>
          )}
          {!soloLectura && onNuevaMulta && (
            <button
              onClick={onNuevaMulta}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded transition-colors"
            >
              <Plus className="h-3 w-3" />
              Nueva multa
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-48">
        {todasLasMultas.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">Sin multas registradas</p>
        ) : (
          todasLasMultas.map((multa) => {
            const fechaBase = multa.fecha ? (multa.fecha.includes('T') ? multa.fecha.split('T')[0] : multa.fecha) : null;
            const fechaFormateada = fechaBase ? formatearFechaCorta(fechaBase) : '-';
            
            // Determinar el estado de la multa: pagada (verde), parcialmente pagada (amarillo), sin pagar (rojo)
            const esPagada = multa.pagada || (multa.saldoPendiente !== undefined && multa.saldoPendiente <= 0);
            const esParcial = multa.parcialmentePagada || (multa.saldoPendiente !== undefined && multa.saldoPendiente > 0 && multa.saldoPendiente < multa.valor);
            
            // Clases CSS según el estado
            const bgColor = esPagada ? 'bg-green-50 border-green-300' : esParcial ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-200';
            const textColor = esPagada ? 'text-green-700' : esParcial ? 'text-yellow-700' : 'text-red-700';
            const textColorDark = esPagada ? 'text-green-900' : esParcial ? 'text-yellow-900' : 'text-red-900';
            const textColorLight = esPagada ? 'text-green-600' : esParcial ? 'text-yellow-600' : 'text-red-600';
            
            return (
              <div key={multa.id} className={`border rounded-md p-2 text-left ${bgColor}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={textColor}>
                    {multa.nroCuota ? `Cuota #${multa.nroCuota}` : 'Multa'}
                  </span>
                  <span className={textColor}>{fechaFormateada}</span>
                </div>
                <div className={`font-bold text-sm mt-1 ${textColorDark}`}>
                  {formatearMoneda(multa.valor)}
                </div>
                {multa.saldoPendiente !== undefined && multa.saldoPendiente > 0 && (
                  <div className={`text-xs mt-1 ${textColorLight}`}>
                    Pendiente: {formatearMoneda(multa.saldoPendiente)}
                  </div>
                )}
                {multa.motivo && (
                  <div className={`text-xs mt-1 ${textColorLight}`}>
                    {multa.motivo}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {esPagada ? (
                    <>
                      <div className="flex-1 text-[10px] text-green-600 font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Pagada
                      </div>
                      {!soloLectura && onEditarMulta && (
                        <button
                          onClick={() => onEditarMulta(multa)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar multa"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {!soloLectura && onPagarMulta && (
                        <button
                          onClick={() => onPagarMulta(multa)}
                          className={`flex-1 py-1 px-2 ${esParcial ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'} text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors`}
                        >
                          {esParcial ? 'Abonar' : 'Pagar'}
                        </button>
                      )}
                      {!soloLectura && onEditarMulta && (
                        <button
                          onClick={() => onEditarMulta(multa)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar multa"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecobroCard;

