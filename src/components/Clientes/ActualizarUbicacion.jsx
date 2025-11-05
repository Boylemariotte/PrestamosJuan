import React, { useState } from 'react';
import { MapPin, Loader2, Check, AlertCircle } from 'lucide-react';

const ActualizarUbicacion = ({ tipo = 'residencia', onActualizar, coordenadasActuales, label }) => {
  const [obteniendo, setObteniendo] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  const obtenerUbicacionGPS = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setObteniendo(true);
    setError(null);
    setExito(false);

    const opciones = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordenadas = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          precision: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        onActualizar(tipo, coordenadas);
        setObteniendo(false);
        setExito(true);
        setTimeout(() => setExito(false), 2500);
      },
      (err) => {
        setObteniendo(false);
        let mensaje = 'No se pudo obtener la ubicación';
        if (err && typeof err.code !== 'undefined') {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              mensaje = 'Permiso de ubicación denegado';
              break;
            case err.POSITION_UNAVAILABLE:
              mensaje = 'Ubicación no disponible';
              break;
            case err.TIMEOUT:
              mensaje = 'Tiempo de espera agotado';
              break;
            default:
              mensaje = 'Error de geolocalización';
          }
        }
        setError(mensaje);
      },
      opciones
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={obtenerUbicacionGPS}
        disabled={obteniendo}
        className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={label || (tipo === 'residencia' ? 'Actualizar ubicación de residencia' : 'Actualizar ubicación de trabajo')}
      >
        {obteniendo ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Obteniendo GPS...</span>
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" />
            <span>{label || 'Actualizar ubicación GPS'}</span>
          </>
        )}
      </button>

      {coordenadasActuales && (
        <span className="text-[11px] md:text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" />
          GPS actualizado
        </span>
      )}

      {error && (
        <div className="flex items-center gap-1 text-[11px] md:text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}

      {exito && (
        <div className="flex items-center gap-1 text-[11px] md:text-xs text-green-600">
          <Check className="h-3 w-3" />
          <span>Ubicación actualizada</span>
        </div>
      )}
    </div>
  );
};

export default ActualizarUbicacion;


