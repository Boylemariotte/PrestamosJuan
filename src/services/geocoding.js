/**
 * Servicio de geocodificación usando Geoapify
 * Con caché local para evitar llamadas repetidas
 */

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_KEY;
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/geocode/search';
const CACHE_KEY = 'geoapify_cache_v1';
const CACHE_EXPIRY_DAYS = 30; // El caché expira después de 30 días

// Coordenadas de Tuluá, Valle del Cauca, Colombia (centro de la ciudad)
const TULUA_CENTER = {
  lat: 4.0847,
  lon: -76.1954
};

// Bounding box aproximado de Tuluá (lon_min, lat_min, lon_max, lat_max)
const TULUA_BBOX = '-76.25,3.95,-76.15,4.15';

/**
 * Carga el caché desde localStorage
 */
function loadCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return {};
    
    const parsed = JSON.parse(cached);
    const now = Date.now();
    
    // Limpiar entradas expiradas
    const validCache = {};
    Object.keys(parsed).forEach(key => {
      const entry = parsed[key];
      if (entry.timestamp && (now - entry.timestamp) < (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)) {
        validCache[key] = entry;
      }
    });
    
    // Guardar caché limpiado si hubo cambios
    if (Object.keys(validCache).length !== Object.keys(parsed).length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(validCache));
    }
    
    return validCache;
  } catch (error) {
    console.error('Error cargando caché de geocodificación:', error);
    return {};
  }
}

/**
 * Guarda en el caché
 */
function saveToCache(direccion, coordenadas) {
  try {
    const cache = loadCache();
    cache[direccion] = {
      coordenadas,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error guardando en caché:', error);
  }
}

/**
 * Normaliza una dirección para mejorar la geocodificación
 * @param {string} direccion - Dirección a normalizar
 * @returns {string} Dirección normalizada
 */
function normalizarDireccion(direccion) {
  if (!direccion) return '';
  
  // Convertir a minúsculas y limpiar espacios múltiples
  let normalizada = direccion.trim().replace(/\s+/g, ' ');
  
  // Normalizar abreviaciones comunes
  const reemplazos = [
    { regex: /\bcr\s*\.?\s*/gi, reemplazo: 'Carrera ' },
    { regex: /\bcra\s*\.?\s*/gi, reemplazo: 'Carrera ' },
    { regex: /\bcarrera\s*/gi, reemplazo: 'Carrera ' },
    { regex: /\bcl\s*\.?\s*/gi, reemplazo: 'Calle ' },
    { regex: /\bcalle\s*/gi, reemplazo: 'Calle ' },
    { regex: /\bav\s*\.?\s*/gi, reemplazo: 'Avenida ' },
    { regex: /\bavenida\s*/gi, reemplazo: 'Avenida ' },
    { regex: /\bdiag\s*\.?\s*/gi, reemplazo: 'Diagonal ' },
    { regex: /\bdiagonal\s*/gi, reemplazo: 'Diagonal ' },
    { regex: /\btrans\s*\.?\s*/gi, reemplazo: 'Transversal ' },
    { regex: /\btransversal\s*/gi, reemplazo: 'Transversal ' },
    { regex: /\s*#\s*/g, reemplazo: ' Número ' },
    { regex: /\s*no\.?\s*/gi, reemplazo: ' Número ' },
    { regex: /\s*num\.?\s*/gi, reemplazo: ' Número ' },
    { regex: /\s*nro\.?\s*/gi, reemplazo: ' Número ' }
  ];
  
  reemplazos.forEach(({ regex, reemplazo }) => {
    normalizada = normalizada.replace(regex, reemplazo);
  });
  
  // Capitalizar primera letra de cada palabra
  normalizada = normalizada.split(' ').map((palabra, index) => {
    if (palabra.length === 0) return '';
    // Mantener números y guiones como están
    if (/^\d+$/.test(palabra) || /^[\d-]+$/.test(palabra)) {
      return palabra;
    }
    return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
  }).join(' ').trim();
  
  return normalizada;
}

/**
 * Geocodifica una dirección usando Geoapify
 * @param {string} direccion - Dirección a geocodificar
 * @returns {Promise<{lat: number, lon: number} | null>} Coordenadas o null si no se encuentra
 */
export async function geocodificarDireccion(direccion) {
  if (!direccion || !direccion.trim()) {
    return null;
  }

  // Verificar caché primero
  const cache = loadCache();
  const direccionOriginal = direccion.trim();
  
  if (cache[direccionOriginal]) {
    return cache[direccionOriginal].coordenadas;
  }

  // Verificar que tenemos API key
  if (!GEOAPIFY_API_KEY) {
    console.warn('VITE_GEOAPIFY_KEY no está configurada');
    return null;
  }

  try {
    // Normalizar dirección
    const direccionLimpia = normalizarDireccion(direccionOriginal);
    
    // Construir query con contexto de Tuluá
    const query = `${direccionLimpia}, Tuluá, Valle del Cauca, Colombia`;
    
    const params = new URLSearchParams({
      text: query,
      filter: 'countrycode:co', // Solo Colombia
      bias: `proximity:${TULUA_CENTER.lon},${TULUA_CENTER.lat}`, // Priorizar Tuluá
      bbox: TULUA_BBOX, // Limitar búsqueda a área de Tuluá
      apiKey: GEOAPIFY_API_KEY,
      limit: 5, // Obtener más resultados para filtrar
      lang: 'es' // Idioma español
    });

    const response = await fetch(`${GEOAPIFY_BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error en geocodificación: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      // Filtrar y seleccionar el mejor resultado
      // Priorizar resultados con rank bajo (más precisos) y que estén en Tuluá
      const resultados = data.features
        .filter(feature => {
          // Verificar que esté dentro del área de Tuluá
          const [lon, lat] = feature.geometry.coordinates;
          const lonNum = parseFloat(lon);
          const latNum = parseFloat(lat);
          return lonNum >= -76.25 && lonNum <= -76.15 && latNum >= 3.95 && latNum <= 4.15;
        })
        .map(feature => ({
          feature,
          // Calcular score basado en rank (menor = mejor) y otros factores
          score: calcularScoreResultado(feature)
        }))
        .sort((a, b) => b.score - a.score); // Ordenar por score descendente

      if (resultados.length > 0) {
        const mejorResultado = resultados[0].feature;
        const coordinates = mejorResultado.geometry.coordinates;
        
        const resultado = {
          lat: coordinates[1],
          lon: coordinates[0]
        };
        
        // Guardar en caché (usar la dirección original como clave)
        saveToCache(direccionOriginal, resultado);
        
        return resultado;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error geocodificando dirección:', error);
    return null;
  }
}

/**
 * Calcula un score para un resultado de geocodificación
 * @param {Object} feature - Feature de Geoapify
 * @returns {number} Score del resultado (mayor = mejor)
 */
function calcularScoreResultado(feature) {
  let score = 100;
  const props = feature.properties;
  
  // Penalizar por rank alto (rank bajo = mejor)
  if (props.rank) {
    const rank = props.rank.importance || 0;
    score -= rank * 10; // Penalizar baja importancia
  }
  
  // Bonificar si es un tipo específico (building, street, etc.)
  const tipo = props.result_type;
  if (tipo === 'building') {
    score += 30; // Building es más preciso
  } else if (tipo === 'street') {
    score += 20; // Street es bueno
  } else if (tipo === 'house_number') {
    score += 25; // House number es muy bueno
  }
  
  // Bonificar si tiene house_number
  if (props.housenumber) {
    score += 15;
  }
  
  // Bonificar si tiene street
  if (props.street) {
    score += 10;
  }
  
  return score;
}

/**
 * Geocodifica múltiples direcciones
 * @param {string[]} direcciones - Array de direcciones
 * @returns {Promise<Array<{direccion: string, coordenadas: {lat: number, lon: number} | null}>>}
 */
export async function geocodificarDirecciones(direcciones) {
  const resultados = await Promise.all(
    direcciones.map(async (direccion) => ({
      direccion,
      coordenadas: await geocodificarDireccion(direccion)
    }))
  );
  
  return resultados;
}

/**
 * Autocompletado de direcciones usando Geoapify
 * @param {string} query - Texto de búsqueda
 * @param {number} limit - Número máximo de resultados (default: 5)
 * @returns {Promise<Array<{text: string, formatted: string, coordinates: {lat: number, lon: number}}>>}
 */
export async function autocompletarDireccion(query, limit = 5) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  if (!GEOAPIFY_API_KEY) {
    console.warn('VITE_GEOAPIFY_KEY no está configurada');
    return [];
  }

  try {
    const queryNormalizada = normalizarDireccion(query.trim());
    const busqueda = `${queryNormalizada}, Tuluá, Valle del Cauca, Colombia`;
    
    const params = new URLSearchParams({
      text: busqueda,
      filter: 'countrycode:co',
      bias: `proximity:${TULUA_CENTER.lon},${TULUA_CENTER.lat}`,
      bbox: TULUA_BBOX,
      apiKey: GEOAPIFY_API_KEY,
      limit: limit,
      lang: 'es'
    });

    const response = await fetch(`${GEOAPIFY_BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Error en autocompletado: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features
        .filter(feature => {
          // Filtrar solo resultados dentro de Tuluá
          const [lon, lat] = feature.geometry.coordinates;
          const lonNum = parseFloat(lon);
          const latNum = parseFloat(lat);
          return lonNum >= -76.25 && lonNum <= -76.15 && latNum >= 3.95 && latNum <= 4.15;
        })
        .map(feature => {
          const [lon, lat] = feature.geometry.coordinates;
          const props = feature.properties;
          
          // Construir texto descriptivo
          let texto = '';
          if (props.housenumber && props.street) {
            texto = `${props.street} ${props.housenumber}`;
          } else if (props.street) {
            texto = props.street;
          } else {
            texto = props.formatted || props.name || '';
          }
          
          // Agregar barrio si existe
          if (props.suburb || props.district) {
            texto += `, ${props.suburb || props.district}`;
          }
          
          return {
            text: texto,
            formatted: props.formatted || texto,
            coordinates: {
              lat: lat,
              lon: lon
            },
            type: props.result_type,
            street: props.street,
            housenumber: props.housenumber,
            suburb: props.suburb || props.district
          };
        })
        .slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error('Error en autocompletado:', error);
    return [];
  }
}

/**
 * Limpia el caché de geocodificación
 */
export function limpiarCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error limpiando caché:', error);
  }
}

