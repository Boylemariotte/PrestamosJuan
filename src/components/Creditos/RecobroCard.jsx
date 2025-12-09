import React from 'react';
import { Check, Plus } from 'lucide-react';
import { formatearMoneda, formatearFechaCorta } from '../../utils/creditCalculations';

const RecobroCard = ({ todasLasMultas, onNuevaMulta, onPagarMulta }) => {
  return (
    <div key="recobro" className="border-2 border-blue-600 rounded-lg p-3 flex flex-col min-h-36 w-full print-grid-item">
      <div className="flex items-center justify-between mb-2">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wide">Recobro</span>
        <div className="flex items-center gap-2">
          {todasLasMultas.length > 0 && (
            <span className="text-blue-500 text-xs font-semibold">
              {todasLasMultas.length} multa{todasLasMultas.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={onNuevaMulta}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded transition-colors"
          >
            <Plus className="h-3 w-3" />
            Nueva multa
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-48">
        {todasLasMultas.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">Sin multas registradas</p>
        ) : (
          todasLasMultas.map((multa) => {
            const fechaBase = multa.fecha ? (multa.fecha.includes('T') ? multa.fecha.split('T')[0] : multa.fecha) : null;
            const fechaFormateada = fechaBase ? formatearFechaCorta(fechaBase) : '-';
            return (
              <div key={`${multa.id}-${multa.nroCuota}`} className={`border rounded-md p-2 text-left ${multa.pagada ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className={multa.pagada ? 'text-green-700' : 'text-red-700'}>Cuota #{multa.nroCuota}</span>
                  <span className={multa.pagada ? 'text-green-700' : 'text-red-700'}>{fechaFormateada}</span>
                </div>
                <div className={`font-bold text-sm mt-1 ${multa.pagada ? 'text-green-900' : 'text-red-900'}`}>
                  {formatearMoneda(multa.valor)}
                </div>
                {multa.pagada ? (
                  <div className="text-[10px] text-green-600 font-semibold mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Pagada
                  </div>
                ) : (
                  <button
                    onClick={() => onPagarMulta(multa)}
                    className="w-full mt-2 py-1 px-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    Pagar
                  </button>
                )}
                {multa.motivo && (
                  <div className={`text-[10px] mt-1 ${multa.pagada ? 'text-green-600' : 'text-red-600'}`}>
                    {multa.motivo}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecobroCard;

