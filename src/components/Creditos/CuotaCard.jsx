import React from 'react';
import { Check } from 'lucide-react';
import { formatearMoneda, formatearFechaCorta, calcularTotalMultasCuota } from '../../utils/creditCalculations';

const CuotaCard = ({ 
  nroCuota, 
  cuota, 
  credito, 
  abonosIndividuales, 
  valorCuota 
}) => {
  // Verificar si está pagada manualmente O si el abono cubre completamente la cuota
  const abonoCuota = cuota?.abonoAplicado || 0;
  const totalMultasCuota = cuota?.multas ? calcularTotalMultasCuota(cuota) : 0;
  const multasCubiertas = cuota?.multasCubiertas || 0;
  const multasPendientes = totalMultasCuota - multasCubiertas;
  const valorRestante = (valorCuota || 0) - abonoCuota + multasPendientes;
  
  const isPaid = cuota?.pagado || (valorRestante <= 0 && abonoCuota > 0);
  const valorRestanteDisplay = isPaid ? 0 : valorRestante;

  return (
    <div className="border-2 border-blue-600 rounded-lg p-3 flex flex-col min-h-36 w-full print-grid-item">
      <div className="flex justify-between items-start mb-1">
        <span className="text-blue-600 font-bold text-xs">#{nroCuota}</span>
        {isPaid && (
          <Check className="h-3 w-3 text-green-600" />
        )}
      </div>
      <div className="border-b border-blue-600 h-4 flex items-center justify-center mb-1">
        <span className="text-blue-600 text-xs">
          {cuota ? formatearFechaCorta(cuota.fechaProgramada) : ''}
        </span>
      </div>
      
      {/* Información de abonos */}
      <div className="flex-1 flex flex-col justify-center text-center space-y-1 py-2">
        {/* Valor a pagar (restante después de abonos + multas pendientes o 0 si está pagada) */}
        <div className="text-blue-600 font-bold text-lg">
          ${formatearMoneda(valorRestanteDisplay).replace('$', '').replace(/,/g, '')}
        </div>
        
        {/* Abonos aplicados a la cuota - Desglose individual */}
        {!isPaid && abonosIndividuales.length > 0 && (
          <div className="space-y-0.5">
            {abonosIndividuales.map((abono, idx) => {
              const [año, mes, dia] = abono.fecha.split('T')[0].split('-');
              return (
                <div key={idx} className="text-green-600 text-[10px] font-medium leading-tight">
                  -Abono: ${formatearMoneda(abono.valor).replace('$', '').replace(/,/g, '')} ({dia}/{mes})
                </div>
              );
            })}
          </div>
        )}
        
        {/* Mostrar abonos cuando está pagada */}
        {isPaid && abonosIndividuales.length > 0 && (
          <div className="space-y-0.5">
            {abonosIndividuales.map((abono, idx) => {
              const [año, mes, dia] = abono.fecha.split('T')[0].split('-');
              return (
                <div key={idx} className="text-green-600 text-[10px] font-medium leading-tight">
                  -Abono: ${formatearMoneda(abono.valor).replace('$', '').replace(/,/g, '')} ({dia}/{mes})
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-2">
        <div className={`w-full py-2 px-2 text-sm font-bold text-center rounded ${
          isPaid 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isPaid ? '✓ Pagado' : 'Pendiente'}
        </div>
      </div>
    </div>
  );
};

export default CuotaCard;

