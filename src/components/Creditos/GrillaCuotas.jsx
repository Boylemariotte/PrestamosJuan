import React from 'react';
import { formatearMoneda } from '../../utils/creditCalculations';
import CuotaCard from './CuotaCard';
import RecobroCard from './RecobroCard';

const GrillaCuotas = ({ 
  formData, 
  credito, 
  cuotasActualizadas, 
  todasLasMultas,
  obtenerNumeroCuotas 
}) => {
  // Calcular qué abonos individuales se aplicaron a cada cuota
  const calcularAbonosIndividuales = (cuota) => {
    const abonosIndividuales = [];
    if (credito.abonos && credito.abonos.length > 0 && cuota) {
      credito.abonos.forEach((abono, abonoIdx) => {
        // Calcular abonos anteriores a este
        let abonosAnteriores = 0;
        for (let i = 0; i < abonoIdx; i++) {
          abonosAnteriores += credito.abonos[i].valor;
        }
        
        let saldoAbono = abono.valor;
        let saldoPrevio = abonosAnteriores;
        
        for (let c of credito.cuotas) {
          if (saldoAbono <= 0) break;
          if (c.pagado) continue;
          
          const multasC = c.multas && c.multas.length > 0 
            ? c.multas.reduce((sum, m) => sum + m.valor, 0) 
            : 0;
          const necesario = multasC + credito.valorCuota;
          
          if (saldoPrevio >= necesario) {
            saldoPrevio -= necesario;
            continue;
          }
          
          const falta = necesario - saldoPrevio;
          const aplicado = Math.min(saldoAbono, falta);
          
          if (aplicado > 0 && c.nroCuota === cuota.nroCuota) {
            abonosIndividuales.push({
              fecha: abono.fecha,
              valor: aplicado
            });
          }
          
          saldoAbono -= aplicado;
          saldoPrevio = 0;
        }
      });
    }
    return abonosIndividuales;
  };

  return (
    <div className="mt-8 print-section">
      <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
        {/* VALOR CUOTA */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-blue-600 text-center mb-2">VALOR CUOTA $</h3>
          <div className="flex justify-center">
            <div className="border-b-2 border-blue-600 w-48 h-8 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">
                {formatearMoneda(formData.valorCuota || 0).replace('$', '').replace(/,/g, '')}
              </span>
            </div>
          </div>
        </div>

        {/* Grilla de cuotas */}
        <div className={`grid gap-4 mx-auto ${
          obtenerNumeroCuotas(formData.tipoPago) === 60 
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 max-w-7xl' 
            : obtenerNumeroCuotas(formData.tipoPago) === 10
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 max-w-6xl'
            : obtenerNumeroCuotas(formData.tipoPago) === 5
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-5xl'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl'
        }`}>
          {Array.from({ length: obtenerNumeroCuotas(formData.tipoPago) }, (_, index) => {
            const nroCuota = index + 1;
            const cuota = cuotasActualizadas[index];
            const abonosIndividuales = calcularAbonosIndividuales(cuota);
            
            return (
              <CuotaCard
                key={nroCuota}
                nroCuota={nroCuota}
                cuota={cuota}
                credito={credito}
                abonosIndividuales={abonosIndividuales}
                valorCuota={formData.valorCuota}
              />
            );
          })}
          <RecobroCard todasLasMultas={todasLasMultas} />
        </div>
      </div>
    </div>
  );
};

export default GrillaCuotas;

