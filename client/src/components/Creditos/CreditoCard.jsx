import React from 'react';
import { Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import {
  determinarEstadoCredito,
  getColorEstado,
  calcularProgreso,
  formatearMoneda,
  formatearFechaCorta
} from '../../utils/creditCalculations';

const CreditoCard = ({ credito, onClick }) => {
  const estado = determinarEstadoCredito(credito.cuotas, credito);
  const progreso = calcularProgreso(credito.cuotas, credito);
  const colorEstado = getColorEstado(estado);

  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer hover:scale-[1.02] transition-transform duration-200 ${estado === 'renovado' ? 'opacity-60 saturate-50 bg-gray-50 border-gray-200' : ''
        }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-mono text-gray-500">{credito.id}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado}`}>
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatearMoneda(credito.monto)}
          </h3>
        </div>

        <div className="bg-sky-100 p-3 rounded-full">
          <TrendingUp className="h-6 w-6 text-sky-600" />
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total a pagar:</span>
          <span className="font-semibold text-gray-900">
            {formatearMoneda(credito.totalAPagar)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Valor cuota:</span>
          <span className="font-semibold text-gray-900">
            {formatearMoneda(credito.valorCuota)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            Tipo:
          </div>
          <span className="font-medium text-gray-900 capitalize">
            {credito.tipo} ({credito.numCuotas} cuotas)
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Fecha inicio:</span>
          <span className="text-gray-900">{formatearFechaCorta(credito.fechaInicio)}</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Progreso</span>
          <span className="font-semibold text-gray-900">
            {progreso.cuotasPagadas}/{progreso.totalCuotas} cuotas
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${estado === 'finalizado'
                ? 'bg-blue-500'
                : estado === 'mora'
                  ? 'bg-red-500'
                  : estado === 'renovado'
                    ? 'bg-gray-400'
                    : 'bg-green-500'
              }`}
            style={{ width: `${progreso.porcentaje}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-500 mt-1">
          {progreso.porcentaje}% completado
        </div>
      </div>

      {estado === 'mora' && (
        <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Este crédito tiene cuotas vencidas</span>
        </div>
      )}

      {credito.notas && credito.notas.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">
            {credito.notas.length} nota{credito.notas.length !== 1 ? 's' : ''} registrada{credito.notas.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default CreditoCard;
