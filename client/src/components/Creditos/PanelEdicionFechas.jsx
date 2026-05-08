import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, X, Check, Settings } from 'lucide-react';
import { validarFechasManuales } from '../../utils/creditCalculations';

const PanelEdicionFechas = ({ 
  cuotasNoPagadas, 
  onGuardarCambios, 
  onCancelar,
  modoEdicionFechas,
  onModoEdicionChange 
}) => {
  const [fechasEditadas, setFechasEditadas] = useState([]);
  const [errores, setErrores] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicionLocal, setModoEdicionLocal] = useState(modoEdicionFechas);

  // Sincronizar modo local con prop externa
  useEffect(() => {
    setModoEdicionLocal(modoEdicionFechas);
  }, [modoEdicionFechas]);

  // Inicializar fechas con los valores actuales
  useEffect(() => {
    const fechasActuales = cuotasNoPagadas.map(cuota => {
      let fechaStr = cuota.fechaProgramada;
      if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
        fechaStr = fechaStr.substring(0, 10);
      } else if (typeof fechaStr === 'string') {
        fechaStr = fechaStr;
      } else if (fechaStr instanceof Date) {
        fechaStr = fechaStr.toISOString().split('T')[0];
      }
      return fechaStr || '';
    });
    setFechasEditadas(fechasActuales);
    setErrores([]);
  }, [cuotasNoPagadas]);

  // Manejar cambio de fecha específica
  const handleFechaChange = (index, fecha) => {
    const nuevasFechas = [...fechasEditadas];
    nuevasFechas[index] = fecha;
    setFechasEditadas(nuevasFechas);
    
    // Validar en tiempo real
    if (fecha) {
      const validacion = validarFechasManuales(nuevasFechas, cuotasNoPagadas[0]?.tipo || 'diario');
      setErrores(validacion.errores);
    } else {
      setErrores([]);
    }
  };

  // Autocompletar fechas basadas en la primera fecha
  const autocompletarFechas = () => {
    if (fechasEditadas.length === 0 || !fechasEditadas[0]) {
      alert('Por favor ingrese la primera fecha primero');
      return;
    }

    const primeraFecha = new Date(fechasEditadas[0]);
    const nuevasFechas = [fechasEditadas[0]];
    const tipo = cuotasNoPagadas[0]?.tipo || 'diario';

    for (let i = 1; i < cuotasNoPagadas.length; i++) {
      let fechaSiguiente;
      
      switch (tipo) {
        case 'diario':
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setDate(primeraFecha.getDate() + i);
          break;
        case 'semanal':
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setDate(primeraFecha.getDate() + (i * 7));
          break;
        case 'quincenal':
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setDate(primeraFecha.getDate() + (i * 15));
          break;
        case 'mensual':
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setMonth(primeraFecha.getMonth() + i);
          break;
        default:
          fechaSiguiente = new Date(primeraFecha);
          fechaSiguiente.setDate(primeraFecha.getDate() + (i * 7));
      }
      
      nuevasFechas.push(fechaSiguiente.toISOString().split('T')[0]);
    }

    setFechasEditadas(nuevasFechas);
    
    // Validar fechas autocompletadas
    const validacion = validarFechasManuales(nuevasFechas, tipo);
    setErrores(validacion.errores);
  };

  // Guardar cambios
  const handleGuardar = async () => {
    if (guardando) return;
    
    // Validar todas las fechas
    const validacion = validarFechasManuales(fechasEditadas, cuotasNoPagadas[0]?.tipo || 'diario');
    if (!validacion.valido) {
      alert('Errores en las fechas:\n' + validacion.errores.join('\n'));
      return;
    }

    setGuardando(true);
    try {
      await onGuardarCambios(fechasEditadas);
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    onCancelar();
  };

  if (!cuotasNoPagadas || cuotasNoPagadas.length === 0) {
    return (
      <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-purple-600 mr-2" />
            <span className="font-medium text-gray-900">Edición Masiva de Fechas</span>
          </div>
          <button onClick={handleCancelar} className="text-purple-600 hover:text-purple-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center py-4 text-gray-500">
          No hay cuotas pendientes por editar
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="font-medium text-gray-900">Edición Masiva de Fechas</h3>
          <span className="ml-2 text-sm text-purple-600">({cuotasNoPagadas.length} cuotas pendientes)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={autocompletarFechas}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            title="Generar fechas automáticamente"
          >
            Autocompletar
          </button>
          <button
            onClick={handleCancelar}
            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || errores.length > 0}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toggle de Modo de Edición dentro del panel */}
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 mb-4">
        <div className="flex items-center mb-3">
          <Settings className="h-5 w-5 text-blue-600 mr-2" />
          <label className="font-medium text-gray-900">Modo de Edición de Fechas</label>
        </div>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="modoEdicionFechas"
              value="automatico"
              checked={modoEdicionLocal === 'automatico'}
              onChange={(e) => {
                setModoEdicionLocal(e.target.value);
                onModoEdicionChange && onModoEdicionChange(e.target.value);
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm">Automático - Ajustar cuotas posteriores</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="modoEdicionFechas"
              value="manual"
              checked={modoEdicionLocal === 'manual'}
              onChange={(e) => {
                setModoEdicionLocal(e.target.value);
                onModoEdicionChange && onModoEdicionChange(e.target.value);
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm">Manual - Editar solo esta cuota</span>
          </label>
        </div>
      </div>
      
      {/* Errores de validación */}
      {errores.length > 0 && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm text-red-800">Errores encontrados:</span>
          </div>
          <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
            {errores.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista de cuotas con inputs */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {cuotasNoPagadas.map((cuota, index) => (
          <div key={cuota.nroCuota} className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
              Cuota {cuota.nroCuota}:
            </label>
            <input
              type="date"
              value={fechasEditadas[index] || ''}
              onChange={(e) => handleFechaChange(index, e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <span className="text-xs text-gray-500 flex-shrink-0">
              {cuota.fechaProgramada && typeof cuota.fechaProgramada === 'string' 
                ? cuota.fechaProgramada.substring(0, 10)
                : cuota.fechaProgramada instanceof Date
                ? cuota.fechaProgramada.toISOString().split('T')[0]
                : ''
              }
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Las fechas deben ser secuenciales y no pueden ser anteriores a hoy. 
        Modifique solo las fechas que necesite cambiar.
      </p>
    </div>
  );
};

export default PanelEdicionFechas;
