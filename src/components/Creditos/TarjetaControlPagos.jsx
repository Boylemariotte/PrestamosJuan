import React from 'react';
import { Check, Calendar, DollarSign } from 'lucide-react';
import { formatearFecha, formatearMoneda, calcularValorPendienteCuota, calcularTotalMultasCuota } from '../../utils/creditCalculations';

const TarjetaControlPagos = ({ credito, onTogglePago }) => {
  const { cuotas, valorCuota } = credito;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        Tarjeta de Control de Pagos
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {cuotas.map((cuota) => {
          // USAR LA MISMA FUNCIÓN que calcula "Pendiente:" en CreditoDetalle
          const valorPendiente = calcularValorPendienteCuota(valorCuota, cuota);
          
          // Calcular multas pendientes para mostrar detalles
          const totalMultas = calcularTotalMultasCuota(cuota);
          const multasPendientes = totalMultas - (cuota.multasCubiertas || 0);
          
          const tieneMultasPendientes = multasPendientes > 0;
          const tieneAbonos = (cuota.abonoAplicado || 0) > 0;
          
          return (
            <button
              key={cuota.nroCuota}
              onClick={() => onTogglePago(cuota.nroCuota, cuota.pagado)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
                ${cuota.pagado 
                  ? 'bg-green-50 border-green-500 hover:bg-green-100' 
                  : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
            >
              {/* Número de cuota */}
              <div className="text-center mb-2">
                <span className={`text-xs font-semibold ${cuota.pagado ? 'text-green-700' : 'text-gray-600'}`}>
                  Cuota #{cuota.nroCuota}
                </span>
              </div>

              {/* Fecha */}
              <div className="text-center mb-2">
                <p className={`text-xs ${cuota.pagado ? 'text-green-600' : 'text-gray-500'}`}>
                  {formatearFecha(cuota.fechaProgramada)}
                </p>
              </div>

              {/* Monto */}
              <div className="text-center mb-2">
                {/* Mostrar valor de la cuota o valor pendiente si tiene abonos/multas */}
                <p className={`text-sm font-bold ${
                  cuota.pagado ? 'text-green-700' : 
                  tieneMultasPendientes ? 'text-red-600' : 
                  tieneAbonos ? 'text-blue-600' : 
                  'text-gray-900'
                }`}>
                  {cuota.pagado 
                    ? formatearMoneda(valorCuota)
                    : formatearMoneda(valorPendiente)
                  }
                </p>
                
                {/* Mostrar detalles solo si no está pagado */}
                {!cuota.pagado && (
                  <>
                    {tieneAbonos && (
                      <p className="text-xs text-blue-500 mt-1">
                        -Abono: {formatearMoneda(cuota.abonoAplicado)}
                      </p>
                    )}
                    {tieneMultasPendientes && (
                      <p className="text-xs text-red-500 mt-1">
                        +Multa: {formatearMoneda(multasPendientes)}
                      </p>
                    )}
                  </>
                )}
              </div>

            {/* Indicador de pago */}
            {cuota.pagado && (
              <div className="absolute top-2 right-2">
                <div className="bg-green-500 rounded-full p-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}

              {/* Estado */}
              <div className="text-center">
                <span className={`text-xs font-medium ${cuota.pagado ? 'text-green-600' : 'text-gray-400'}`}>
                  {cuota.pagado ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Resumen */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Cuotas</p>
            <p className="text-lg font-bold text-gray-900">{cuotas.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Pagadas</p>
            <p className="text-lg font-bold text-green-600">
              {cuotas.filter(c => c.pagado).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Pendientes</p>
            <p className="text-lg font-bold text-orange-600">
              {cuotas.filter(c => !c.pagado).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarjetaControlPagos;
