/**
 * Utilidades para manejo de fechas en zona horaria local (Colombia)
 */

/**
 * Obtiene la fecha y hora actual en formato ISO pero usando la zona horaria local
 * @returns {string} Fecha en formato ISO local (YYYY-MM-DDTHH:mm:ss)
 */
export const obtenerFechaHoraLocal = () => {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, '0');
  const day = String(ahora.getDate()).padStart(2, '0');
  const hours = String(ahora.getHours()).padStart(2, '0');
  const minutes = String(ahora.getMinutes()).padStart(2, '0');
  const seconds = String(ahora.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Obtiene solo la fecha actual en formato ISO (YYYY-MM-DD) usando zona horaria local
 * @returns {string} Fecha en formato ISO local
 */
export const obtenerFechaLocal = () => {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, '0');
  const day = String(ahora.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convierte una fecha Date a formato ISO local (YYYY-MM-DD)
 * @param {Date} fecha - Objeto Date
 * @returns {string} Fecha en formato ISO local
 */
export const fechaAFormatoLocal = (fecha) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
