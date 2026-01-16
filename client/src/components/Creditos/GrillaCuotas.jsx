import React, { useMemo } from 'react';
import { formatearMoneda } from '../../utils/creditCalculations';
import CuotaCard from './CuotaCard';
import RecobroCard from './RecobroCard';

const GrillaCuotas = ({
  formData,
  credito,
  cuotasActualizadas,
  todasLasMultas,
  obtenerNumeroCuotas,
  onPagar,
  onNuevaMulta,
  onEditDate,
  onEditarAbono,
  onEliminarAbono,
  onPagarMulta,
  onEditarMulta,
  sinContenedor = false,
  soloLectura = false
}) => {
  // Calcular distribución de abonos para visualización
  const abonosPorCuota = useMemo(() => {
    const mapa = {}; // { nroCuota: [ { fecha, valor } ] }

    // Inicializar mapa
    (credito.cuotas || []).forEach(c => mapa[c.nroCuota] = []);

    // Estado temporal para simulación de waterfall
    const estadoCuotas = (credito.cuotas || []).map(c => ({
      ...c,
      abonoAplicado: 0
    }));

    // Procesar solo abonos de cuotas (abonosMulta está completamente separado)
    (credito.abonos || []).forEach(abono => {
      // Detectar si es un abono específico
      const match = abono.descripcion && abono.descripcion.match(/(?:Cuota|cuota)\s*#(\d+)/);
      const nroCuotaTarget = abono.nroCuota || (match ? parseInt(match[1]) : null);
      let monto = abono.valor;

      if (nroCuotaTarget) {
        const cuota = estadoCuotas.find(c => c.nroCuota === nroCuotaTarget);
        if (cuota) {
          // Es un abono para esta cuota
          if (!mapa[cuota.nroCuota]) mapa[cuota.nroCuota] = [];
          mapa[cuota.nroCuota].push({
            ...abono,
            id: abono.id, // Asegurar que el ID esté presente
            valorAplicado: monto
          });

          // Actualizar estado para que el waterfall sepa cuánto deuda queda
          cuota.abonoAplicado += monto;
        }
      } else {
        // Abono general (Waterfall) - Solo capital, sin multas
        let saldo = monto;
        for (let cuota of estadoCuotas) {
          if (saldo <= 0) break;
          if (cuota.pagado) continue;

          const capitalPend = credito.valorCuota - cuota.abonoAplicado;

          // Solo cubrir capital (ya no multas)
          if (saldo > 0 && capitalPend > 0) {
            const aporte = Math.min(saldo, capitalPend);
            cuota.abonoAplicado += aporte;
            saldo -= aporte;

            if (!mapa[cuota.nroCuota]) mapa[cuota.nroCuota] = [];
            mapa[cuota.nroCuota].push({
              ...abono,
              id: abono.id, // Asegurar que el ID esté presente
              valorAplicado: aporte
            });
          }
        }
      }
    });

    return mapa;
  }, [credito]);

  const content = (
    <>
      <div className={`grid gap-4 mx-auto w-full cuotas-grid ${formData.tipoPago === 'quincenal' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'} auto-rows-fr`}>
        {Array.from({ length: obtenerNumeroCuotas(formData.tipoPago) }, (_, index) => {
          const nroCuota = index + 1;
          const cuota = cuotasActualizadas[index];
          const abonosIndividuales = abonosPorCuota[nroCuota] || [];

          return (
            <div key={nroCuota} className="w-full">
              <CuotaCard
                nroCuota={nroCuota}
                cuota={cuota}
                credito={credito}
                abonosIndividuales={abonosIndividuales}
                valorCuota={formData.valorCuota}
                onPagar={onPagar}
                onEditDate={onEditDate}
                onEditarAbono={onEditarAbono}
                onEliminarAbono={onEliminarAbono}
                soloLectura={soloLectura}
              />
            </div>
          );
        })}
      </div>

      {/* Card de Recobro */}
      <div className="mt-4 w-full recobro-container">
        <RecobroCard
          todasLasMultas={todasLasMultas}
          onNuevaMulta={onNuevaMulta}
          onPagarMulta={onPagarMulta}
          onEditarMulta={onEditarMulta}
          soloLectura={soloLectura}
        />
      </div>
    </>
  );

  if (sinContenedor) {
    return <div className="h-full">{content}</div>;
  }

  return (
    <div className="mt-8 print-section">
      <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
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
        {content}
      </div>
    </div>
  );
};

export default GrillaCuotas;

