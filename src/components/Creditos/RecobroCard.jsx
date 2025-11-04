import React from 'react';
import { Check } from 'lucide-react';
import { formatearMoneda, formatearFechaCorta } from '../../utils/creditCalculations';

const RecobroCard = ({ todasLasMultas }) => {
  return (
    <div key="recobro" className="border-2 border-blue-600 rounded-lg p-3 flex flex-col min-h-36 col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6 print-grid-item">
      <div className="flex items-center justify-between mb-2">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wide">Recobro</span>
        {todasLasMultas.length > 0 && (
          <span className="text-blue-500 text-xs font-semibold">
            {todasLasMultas.length} multa{todasLasMultas.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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
                {multa.pagada && (
                  <div className="text-[10px] text-green-600 font-semibold mt-1 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Pagada
                  </div>
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

