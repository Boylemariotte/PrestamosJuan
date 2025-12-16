import React from 'react';
import { Check, Edit2, Trash2 } from 'lucide-react';
import { formatearMoneda, formatearFechaCorta, calcularTotalMultasCuota } from '../../utils/creditCalculations';
import { isBefore, startOfDay, parseISO } from 'date-fns';

const CuotaCard = ({
  nroCuota,
  cuota,
  credito,
  abonosIndividuales,
  valorCuota,
  onPagar,
  onEditDate,
  onEditarAbono,
  onEliminarAbono
}) => {
  // Verificar si está pagada manualmente O si el abono cubre completamente la cuota
  // Verificar si está pagada manualmente O si el abono cubre completamente la cuota
  const abonoCuota = cuota?.abonoAplicado || 0;

  // Calcular multas
  const totalMultas = cuota?.multas ? cuota.multas.reduce((acc, m) => acc + m.valor, 0) : 0;
  const multasCubiertas = cuota?.multasCubiertas || 0;
  const multasPendientes = totalMultas - multasCubiertas;

  // Valor restante = (Capital - AbonosCapital) + (Multas - MultasPagadas)
  // Nota: abonoAplicado en utils ya considera solo capital si así se definió, o mix.
  // Asumiendo que abonoAplicado es 'capital cubierto' basado en la lógica de creditCalculations
  const capitalPendiente = Math.max(0, (valorCuota || 0) - abonoCuota);
  const valorRestante = capitalPendiente + multasPendientes;

  const isPaid = cuota?.pagado || valorRestante <= 0;
  // Si está pagado, mostrar 0. Si no, mostrar lo que falta.
  const valorRestanteDisplay = isPaid ? 0 : valorRestante;

  // Determinar estado para colores
  const fechaCuota = cuota?.fechaProgramada ? parseISO(cuota.fechaProgramada) : null;
  const isOverdue = !isPaid && fechaCuota && isBefore(fechaCuota, startOfDay(new Date()));
  const hasPartialPayment = !isPaid && abonoCuota > 0;

  // Clases de contenedor según estado
  let containerClasses = "border-2 rounded-lg p-3 flex flex-col h-64 w-full print-grid-item transition-colors duration-200 ";
  let textClasses = "font-bold text-xs ";
  let amountClasses = "font-bold text-lg ";

  if (isPaid) {
    containerClasses += "bg-green-100 border-green-500";
    textClasses += "text-green-700";
    amountClasses += "text-green-800";
  } else if (hasPartialPayment) {
    containerClasses += "bg-yellow-100 border-yellow-500";
    textClasses += "text-yellow-700";
    amountClasses += "text-yellow-800";
  } else if (isOverdue) {
    containerClasses += "bg-red-100 border-red-500";
    textClasses += "text-red-700";
    amountClasses += "text-red-800";
  } else {
    containerClasses += "bg-white border-blue-600";
    textClasses += "text-blue-600";
    amountClasses += "text-blue-600";
  }

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-start mb-1">
        <span className={textClasses}>#{nroCuota}</span>
        {isPaid && (
          <Check className="h-3 w-3 text-green-600" />
        )}
      </div>
      <div className={`border-b ${isPaid ? 'border-green-400' : hasPartialPayment ? 'border-yellow-400' : isOverdue ? 'border-red-400' : 'border-blue-600'} h-5 flex items-center justify-center mb-1 relative group`}>
        <span className={`${textClasses} font-normal text-xs md:text-sm`}>
          {cuota ? formatearFechaCorta(cuota.fechaProgramada) : ''}
        </span>
        {!isPaid && onEditDate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditDate(nroCuota, cuota.fechaProgramada);
            }}
            className="absolute right-1 p-0.5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Editar fecha"
          >
            <Edit2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Información de abonos */}
      <div className="flex-1 flex flex-col justify-center items-center text-center py-2 min-h-0">
        {/* Valor a pagar (restante después de abonos + multas pendientes o 0 si está pagada) */}
        <div className={`${amountClasses} mb-1 shrink-0`}>
          ${formatearMoneda(valorRestanteDisplay).replace('$', '').replace(/,/g, '')}
        </div>

        {/* Abonos aplicados a la cuota - Desglose individual */}
        {abonosIndividuales.length > 0 && (
          <div className="overflow-y-auto w-full space-y-0.5 pr-1">
            {abonosIndividuales.map((abono, idx) => {
              const [año, mes, dia] = abono.fecha.split('T')[0].split('-');
              return (
                <div key={idx} className="text-green-600 text-[10px] font-medium leading-tight flex justify-between items-center group/abono">
                  <span>-Abono: ${formatearMoneda(abono.valorAplicado ?? abono.valor).replace('$', '').replace(/,/g, '')} ({dia}/{mes})</span>
                  {onEditarAbono && (
                    <div className="flex gap-1 opacity-0 group-hover/abono:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditarAbono(abono);
                        }}
                        className="px-1 text-blue-500 hover:text-blue-700"
                        title="Editar pago"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-auto pt-2">
        {isPaid ? (
          <div className="flex flex-col gap-1">
            <div className="w-full py-2 px-2 text-sm font-bold text-center rounded bg-green-200 text-green-800">
              Pagada
            </div>
            {onEditarAbono && abonosIndividuales.length > 0 && (
              <div className="flex gap-1">
                <button
                  onClick={() => onEditarAbono(abonosIndividuales[abonosIndividuales.length - 1])}
                  className="flex-1 py-1.5 px-2 text-xs font-semibold text-center rounded border border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 className="h-3 w-3" /> Editar
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => onPagar(nroCuota)}
            className={`w-full py-2 px-2 text-sm font-bold text-center rounded transition-colors shadow-sm ${isOverdue
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : hasPartialPayment
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            Pagar
          </button>
        )}
      </div>
    </div >
  );
};

export default CuotaCard;

