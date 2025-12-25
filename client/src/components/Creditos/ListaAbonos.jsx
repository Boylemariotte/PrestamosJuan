import React from 'react';
import { DollarSign, Trash2, Edit2 } from 'lucide-react';
import { formatearMoneda, formatearFechaCorta } from '../../utils/creditCalculations';

const ListaAbonos = ({ abonos, credito, cuotas, onEliminarAbono, onEditarAbono, soloLectura = false }) => {
  if (!abonos || abonos.length === 0) {
    return null;
  }

  const calcularCuotasAfectadas = (abono, abonoIndex) => {
    const cuotasAfectadas = [];
    
    // Restar los abonos anteriores
    let abonosAnteriores = 0;
    for (let i = 0; i < abonoIndex; i++) {
      abonosAnteriores += credito.abonos[i].valor;
    }
    
    // Simular aplicación de abonos para encontrar qué cuotas cubre este abono específico
    let saldoDeEsteAbono = abono.valor; // Solo el valor de ESTE abono
    let saldoAnterioresTemp = abonosAnteriores;
    
    for (let cuota of cuotas) {
      if (saldoDeEsteAbono <= 0) break;
      
      // Si la cuota está pagada manualmente (con el botón), saltarla
      if (cuota.pagado) {
        continue; // Saltar cuotas pagadas con el botón "Marcar pagado"
      }
      
      const totalMultasCuota = cuota.multas && cuota.multas.length > 0 
        ? cuota.multas.reduce((sum, m) => sum + m.valor, 0) 
        : 0;
      const totalNecesario = totalMultasCuota + credito.valorCuota;
      
      // Si los abonos anteriores ya cubrieron esta cuota completamente, continuar
      if (saldoAnterioresTemp >= totalNecesario) {
        saldoAnterioresTemp -= totalNecesario;
        continue;
      }
      
      // Calcular cuánto falta en esta cuota después de abonos anteriores
      const faltabaEnEstaCuota = totalNecesario - saldoAnterioresTemp;
      
      // Este abono cubre (parcial o totalmente) lo que falta en esta cuota
      const montoAplicadoAEstaCuota = Math.min(saldoDeEsteAbono, faltabaEnEstaCuota);
      
      if (montoAplicadoAEstaCuota > 0) {
        cuotasAfectadas.push({
          nroCuota: cuota.nroCuota,
          monto: montoAplicadoAEstaCuota,
          completa: montoAplicadoAEstaCuota >= faltabaEnEstaCuota
        });
        
        saldoDeEsteAbono -= montoAplicadoAEstaCuota;
        saldoAnterioresTemp = 0; // Ya no hay saldo anterior en esta cuota
      }
    }
    
    return cuotasAfectadas;
  };

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
        Abonos Realizados
      </h3>
      <div className="space-y-2">
        {abonos.map((abono, abonoIndex) => {
          const cuotasAfectadas = calcularCuotasAfectadas(abono, abonoIndex);
          
          return (
            <div
              key={abono.id}
              className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-blue-900 text-lg">
                    {formatearMoneda(abono.valor)}
                  </span>
                  <span className="text-sm text-gray-600">
                    - {abono.descripcion}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Registrado el {formatearFechaCorta(abono.fecha.split('T')[0])}
                </p>
                {/* Mostrar a qué cuota(s) se aplicó */}
                {cuotasAfectadas.length > 0 && (
                  <div className="text-xs text-blue-600 mt-1 ml-7">
                    Aplicado a: {cuotasAfectadas.map(c => 
                      `Cuota #${c.nroCuota} (${formatearMoneda(c.monto)}${c.completa ? ' - completa' : ' - parcial'})`
                    ).join(', ')}
                  </div>
                )}
              </div>
              {!soloLectura && (
                <div className="flex items-center gap-2">
                  {onEditarAbono && (
                    <button
                      onClick={() => onEditarAbono(abono)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Editar abono"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {onEliminarAbono && (
                    <button
                      onClick={() => onEliminarAbono(abono.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Eliminar abono"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListaAbonos;

