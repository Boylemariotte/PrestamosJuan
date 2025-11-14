import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { geocodificarDireccion } from '../../services/geocoding';
import { Loader2, MapPin } from 'lucide-react';

// Fix para iconos de Leaflet en React (solo si se necesita como fallback)
try {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
} catch (e) {
  // Ignorar si ya está configurado
}

// Componente para ajustar el zoom del mapa
function MapBounds({ bounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
    }
  }, [bounds, map]);
  
  return null;
}

const MapaUbicaciones = ({ 
  clienteDireccion, 
  clienteDireccionTrabajo, 
  clienteNombre,
  fiadorDireccion,
  fiadorDireccionTrabajo,
  fiadorNombre,
  clienteCoordenadasResidencia,
  clienteCoordenadasTrabajo,
  fiadorCoordenadasResidencia,
  fiadorCoordenadasTrabajo
}) => {
  const [coordenadas, setCoordenadas] = useState({
    clienteResidencia: null,
    clienteTrabajo: null,
    fiadorResidencia: null,
    fiadorTrabajo: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Coordenadas de Tuluá (centro por defecto)
  const TULUA_CENTER = [4.0847, -76.1954];

  useEffect(() => {
    const cargarCoordenadas = async () => {
      setLoading(true);
      setError(null);

      try {
        // Priorizar coordenadas GPS guardadas para el cliente
        const resultados = await Promise.all([
          clienteCoordenadasResidencia 
            ? Promise.resolve({ lat: clienteCoordenadasResidencia.lat, lon: clienteCoordenadasResidencia.lon })
            : (clienteDireccion ? geocodificarDireccion(clienteDireccion) : Promise.resolve(null)),
          clienteCoordenadasTrabajo 
            ? Promise.resolve({ lat: clienteCoordenadasTrabajo.lat, lon: clienteCoordenadasTrabajo.lon })
            : (clienteDireccionTrabajo ? geocodificarDireccion(clienteDireccionTrabajo) : Promise.resolve(null)),
          fiadorCoordenadasResidencia
            ? Promise.resolve({ lat: fiadorCoordenadasResidencia.lat, lon: fiadorCoordenadasResidencia.lon })
            : (fiadorDireccion ? geocodificarDireccion(fiadorDireccion) : Promise.resolve(null)),
          fiadorCoordenadasTrabajo
            ? Promise.resolve({ lat: fiadorCoordenadasTrabajo.lat, lon: fiadorCoordenadasTrabajo.lon })
            : (fiadorDireccionTrabajo ? geocodificarDireccion(fiadorDireccionTrabajo) : Promise.resolve(null))
        ]);

        setCoordenadas({
          clienteResidencia: resultados[0],
          clienteTrabajo: resultados[1],
          fiadorResidencia: resultados[2],
          fiadorTrabajo: resultados[3]
        });
      } catch (err) {
        console.error('Error cargando coordenadas:', err);
        setError('No se pudieron cargar las ubicaciones');
      } finally {
        setLoading(false);
      }
    };

    cargarCoordenadas();
  }, [clienteDireccion, clienteDireccionTrabajo, fiadorDireccion, fiadorDireccionTrabajo, clienteCoordenadasResidencia, clienteCoordenadasTrabajo, fiadorCoordenadasResidencia, fiadorCoordenadasTrabajo]);

  // Crear marcadores y bounds
  const marcadores = [];
  const bounds = [];

  if (coordenadas.clienteResidencia) {
    const pos = [coordenadas.clienteResidencia.lat, coordenadas.clienteResidencia.lon];
    marcadores.push({
      position: pos,
      tipo: 'Cliente - Residencia',
      nombre: clienteNombre,
      direccion: clienteDireccion
    });
    bounds.push(pos);
  }

  if (coordenadas.clienteTrabajo) {
    const pos = [coordenadas.clienteTrabajo.lat, coordenadas.clienteTrabajo.lon];
    marcadores.push({
      position: pos,
      tipo: 'Cliente - Trabajo',
      nombre: clienteNombre,
      direccion: clienteDireccionTrabajo
    });
    bounds.push(pos);
  }

  if (coordenadas.fiadorResidencia) {
    const pos = [coordenadas.fiadorResidencia.lat, coordenadas.fiadorResidencia.lon];
    marcadores.push({
      position: pos,
      tipo: 'Fiador - Residencia',
      nombre: fiadorNombre,
      direccion: fiadorDireccion
    });
    bounds.push(pos);
  }

  if (coordenadas.fiadorTrabajo) {
    const pos = [coordenadas.fiadorTrabajo.lat, coordenadas.fiadorTrabajo.lon];
    marcadores.push({
      position: pos,
      tipo: 'Fiador - Trabajo',
      nombre: fiadorNombre,
      direccion: fiadorDireccionTrabajo
    });
    bounds.push(pos);
  }

  // Colores para diferentes tipos de marcadores
  const getMarkerColor = (tipo) => {
    if (tipo.includes('Cliente')) {
      return tipo.includes('Residencia') ? '#3b82f6' : '#8b5cf6'; // Azul para residencia, púrpura para trabajo
    } else {
      return tipo.includes('Residencia') ? '#10b981' : '#f59e0b'; // Verde para residencia, naranja para trabajo
    }
  };

  // Crear iconos personalizados
  const createCustomIcon = (color) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ">
          <div style="
            transform: rotate(45deg);
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
          "></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  };

  const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

  // Verificar si hay API key
  if (!GEOAPIFY_API_KEY) {
    return (
      <div className="w-full h-80 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-200">
        <div className="text-center max-w-md px-4">
          <MapPin className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm text-yellow-800 font-medium mb-1">
            API Key de Geoapify no configurada
          </p>
          <p className="text-xs text-yellow-700">
            Por favor, asegúrate de tener la variable VITE_GEOAPIFY_KEY en tu archivo .env
          </p>
        </div>
      </div>
    );
  }

  // Verificar si hay API key
  if (!GEOAPIFY_API_KEY) {
    return (
      <div className="w-full h-80 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-200">
        <div className="text-center max-w-md px-4">
          <MapPin className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm text-yellow-800 font-medium mb-1">
            API Key de Geoapify no configurada
          </p>
          <p className="text-xs text-yellow-700">
            Por favor, asegúrate de tener la variable VITE_GEOAPIFY_KEY en tu archivo .env
          </p>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Cargando ubicaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-80 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (marcadores.length === 0) {
    return (
      <div className="w-full h-80 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No hay direcciones disponibles para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300 shadow-md">
      <MapContainer
        center={bounds.length > 0 ? bounds[0] : TULUA_CENTER}
        zoom={bounds.length > 0 ? 13 : 12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* TileLayer de OpenStreetMap - Gratuito, no consume créditos */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Ajustar bounds si hay múltiples marcadores */}
        {bounds.length > 1 && <MapBounds bounds={bounds} />}

        {/* Marcadores */}
        {marcadores.map((marcador, index) => {
          const color = getMarkerColor(marcador.tipo);
          return (
            <Marker
              key={index}
              position={marcador.position}
              icon={createCustomIcon(color)}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">{marcador.tipo}</p>
                  {marcador.nombre && (
                    <p className="text-gray-700 mt-1">{marcador.nombre}</p>
                  )}
                  <p className="text-gray-600 mt-1 text-xs">{marcador.direccion}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapaUbicaciones;

