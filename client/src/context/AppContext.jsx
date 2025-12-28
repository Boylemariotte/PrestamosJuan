import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { obtenerFechaHoraLocal, obtenerFechaLocal } from '../utils/dateUtils';
import {
  calcularTotalAPagar,
  calcularValorCuota,
  obtenerNumCuotas,
  generarFechasPagoDiarias,
  generarFechasPagoSemanales,
  generarFechasPagoQuincenales,
  generarFechasPagoMensuales,
  calcularPapeleria,
  determinarEstadoCredito
} from '../utils/creditCalculations';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [movimientosCaja, setMovimientosCaja] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar todos los datos
  const fetchData = useCallback(async () => {
    // Solo cargar datos si el usuario está autenticado
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Cargar clientes (limit alto para traer todos)
      const clientesRes = await api.get('/clientes?limit=1000');
      if (clientesRes.success) {
        setClientes(clientesRes.data);
      }

      // Cargar movimientos de caja
      const movimientosRes = await api.get('/movimientos-caja');
      if (movimientosRes.success) {
        setMovimientosCaja(movimientosRes.data);
      }

      // Cargar alertas
      const alertasRes = await api.get('/alertas');
      if (alertasRes.success) {
        setAlertas(alertasRes.data);
      }
    } catch (error) {
      // Si es error de autenticación, no hacer nada (el usuario será redirigido)
      if (error.message && error.message.includes('No autorizado')) {
        console.warn('No autorizado para cargar datos');
      } else {
        console.error('Error cargando datos iniciales:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    // Esperar a que la autenticación termine de cargar
    if (authLoading) return;

    fetchData();
  }, [fetchData, authLoading]);

  // --- CLIENTES ---

  const agregarCliente = async (clienteData) => {
    try {
      // 1. Calcular posición si no viene definida
      let posicion = clienteData.posicion;
      const cartera = clienteData.cartera || 'K1';
      const tipoPagoEsperado = clienteData.tipoPagoEsperado;

      if (!posicion) {
        if (cartera === 'K2') {
          const clientesK2 = clientes.filter(c => c.cartera === 'K2');
          const posicionesOcupadas = clientesK2.map(c => c.posicion).filter(Boolean);
          const capacidadMaxima = 225;
          posicion = 1;
          while (posicionesOcupadas.includes(posicion) && posicion <= capacidadMaxima) {
            posicion++;
          }
          if (posicion > capacidadMaxima) throw new Error('Cupo lleno en K2');
        } else {
          const clientesMismoTipo = clientes.filter(c => {
            if ((c.cartera || 'K1') !== cartera) return false;
            if (tipoPagoEsperado && c.creditos && c.creditos.length > 0) {
              return c.creditos.some(cred => {
                const estado = determinarEstadoCredito(cred.cuotas, cred);
                return (estado === 'activo' || estado === 'mora') && cred.tipo === tipoPagoEsperado;
              });
            }
            return c.tipoPagoEsperado === tipoPagoEsperado;
          });
          const posicionesOcupadas = clientesMismoTipo.map(c => c.posicion).filter(Boolean);
          const capacidadMaxima = 150;
          posicion = 1;
          while (posicionesOcupadas.includes(posicion) && posicion <= capacidadMaxima) {
            posicion++;
          }
          if (posicion > capacidadMaxima) throw new Error('Cupo lleno en K1');
        }
        clienteData.posicion = posicion;
      }

      // 2. Enviar a backend
      const response = await api.post('/clientes', clienteData);
      if (response.success) {
        // Recargar clientes para asegurar consistencia
        await fetchData();
        return response.data;
      }
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  };

  const actualizarCliente = async (id, clienteData) => {
    try {
      const response = await api.put(`/clientes/${id}`, clienteData);
      if (response.success) {
        setClientes(prev => prev.map(c => (c?.id === id || c?._id === id) ? response.data : c));
        return response.data;
      }
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      throw error;
    }
  };

  const eliminarCliente = async (id) => {
    try {
      const response = await api.delete(`/clientes/${id}`);
      if (response.success) {
        setClientes(prev => prev.filter(c => !(c?.id === id || c?._id === id)));
      }
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      throw error;
    }
  };

  const archivarCliente = async (id) => {
    try {
      const response = await api.put(`/clientes/${id}/archivar`);
      if (response.success) {
        // Remover el cliente de la lista actual (ya que está archivado)
        setClientes(prev => prev.filter(c => !(c?.id === id || c?._id === id)));
        return response.data;
      }
    } catch (error) {
      console.error('Error archivando cliente:', error);
      throw error;
    }
  };

  const desarchivarCliente = async (id, posicion = null) => {
    try {
      const response = await api.put(`/clientes/${id}/desarchivar`, {
        ...(posicion && { posicion })
      });
      if (response.success) {
        // Recargar clientes para incluir el desarchivado
        await fetchData();
        return response.data;
      }
    } catch (error) {
      console.error('Error desarchivando cliente:', error);
      throw error;
    }
  };

  const obtenerCliente = (id) => {
    return clientes.find(cliente => cliente?.id === id || cliente?._id === id);
  };

  const actualizarCoordenadasGPS = async (clienteId, tipo, coordenadas, entidad = 'cliente') => {
    try {
      const response = await api.put(`/clientes/${clienteId}/coordenadas`, {
        tipo: tipo === 'trabajo' ? 'trabajo' : 'residencia',
        coordenadas,
        entidad
      });
      if (response.success) {
        // Actualización optimista o recarga pequeña
        setClientes(prev => prev.map(c => (c?.id === clienteId || c?._id === clienteId) ? response.data : c));
      }
    } catch (error) {
      console.error('Error actualizando GPS:', error);
    }
  };

  // --- CRÉDITOS ---

  const agregarCredito = async (clienteId, creditoData) => {
    try {
      const { monto, tipo, fechaInicio, tipoQuincenal, papeleriaManual, usarPapeleriaManual, esManual, valorCuota: valorCuotaManual, numCuotas: numCuotasManual, totalAPagar: totalAPagarManual } = creditoData;

      // Cálculos preliminares (similares al original para asegurar datos correctos)
      const papeleriaAutomatica = calcularPapeleria(monto);
      const papeleria = usarPapeleriaManual && papeleriaManual ? parseFloat(papeleriaManual) : papeleriaAutomatica;
      const montoEntregado = monto - papeleria;

      const totalAPagar = esManual ? totalAPagarManual : calcularTotalAPagar(monto, tipo);
      const numCuotas = esManual ? numCuotasManual : obtenerNumCuotas(monto, tipo);
      const valorCuota = esManual ? valorCuotaManual : calcularValorCuota(monto, tipo);

      let cuotas;
      switch (tipo) {
        case 'diario': cuotas = generarFechasPagoDiarias(fechaInicio, numCuotas); break;
        case 'semanal': cuotas = generarFechasPagoSemanales(fechaInicio, numCuotas); break;
        case 'quincenal': cuotas = generarFechasPagoQuincenales(fechaInicio, numCuotas, tipoQuincenal || '1-16'); break;
        case 'mensual': cuotas = generarFechasPagoMensuales(fechaInicio, numCuotas); break;
        default: cuotas = generarFechasPagoSemanales(fechaInicio, numCuotas);
      }

      const payload = {
        clienteId,
        monto,
        papeleria,
        montoEntregado,
        tipo,
        tipoQuincenal: tipo === 'quincenal' ? (tipoQuincenal || '1-16') : null,
        fechaInicio,
        totalAPagar,
        valorCuota,
        numCuotas,
        cuotas,
        etiqueta: creditoData.etiqueta,
        esRenovacion: creditoData.esRenovacion || false,
        creditoAnteriorId: creditoData.creditoAnteriorId
      };

      const response = await api.post('/creditos', payload);
      if (response.success) {
        await fetchData(); // Recargar para ver el crédito en el cliente
        return response.data;
      }
    } catch (error) {
      console.error('Error creando crédito:', error);
      throw error;
    }
  };

  const actualizarCredito = async (clienteId, creditoId, creditoData) => {
    try {
      const response = await api.put(`/creditos/${creditoId}`, creditoData);
      if (response.success) {
        await fetchData();
        return response.data;
      }
    } catch (error) {
      console.error('Error actualizando crédito:', error);
      throw error;
    }
  };

  const eliminarCredito = async (clienteId, creditoId) => {
    try {
      const response = await api.delete(`/creditos/${creditoId}`);
      if (response.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error eliminando crédito:', error);
      throw error;
    }
  };

  const obtenerCredito = (clienteId, creditoId) => {
    const cliente = obtenerCliente(clienteId);
    return cliente?.creditos?.find(c => c.id === creditoId);
  };

  const asignarEtiquetaCredito = async (clienteId, creditoId, etiqueta) => {
    await actualizarCredito(clienteId, creditoId, { etiqueta, fechaEtiqueta: new Date() });
  };

  const asignarEtiquetaCliente = async (clienteId, etiqueta) => {
    try {
      const response = await api.put(`/clientes/${clienteId}`, { etiqueta });
      if (response.success) {
        setClientes(prev => prev.map(c => (c?.id === clienteId || c?._id === clienteId) ? response.data : c));
        return response.data;
      }
    } catch (error) {
      console.error('Error asignando etiqueta al cliente:', error);
      throw error;
    }
  };

  const renovarCredito = async (clienteId, creditoAnteriorId, nuevoCreditoData) => {
    try {
      // 1. Marcar anterior como renovado
      await api.put(`/creditos/${creditoAnteriorId}`, {
        renovado: true,
        fechaRenovacion: new Date(),
        // creditoRenovacionId se asignaría idealmente después de crear el nuevo, 
        // pero aquí hay dependencia circular si queremos atomicidad perfecta. 
        // Lo obviaremos o haremos update luego.
      });

      // 2. Crear nuevo
      const nuevoCredito = await agregarCredito(clienteId, {
        ...nuevoCreditoData,
        esRenovacion: true,
        creditoAnteriorId
      });

      // 2.1 ELIMINADO: Ya no se registra movimiento de caja automático al renovar
      // Por solicitud del usuario, las renovaciones no deben afectar la caja ni la papelería automática.
      // Si se desea afectar caja, se debe hacer manualmente.

      // 3. Actualizar referencia en el viejo (opcional pero bueno para trazar)
      if (nuevoCredito && nuevoCredito.id) {
        await api.put(`/creditos/${creditoAnteriorId}`, {
          creditoRenovacionId: nuevoCredito.id
        });
      }

      return nuevoCredito;
    } catch (error) {
      console.error('Error en renovación:', error);
      throw error;
    }
  };

  // --- PAGOS Y ABONOS ---

  const registrarPago = async (clienteId, creditoId, nroCuota, fechaPago = null) => {
    try {
      // Normalizar la fecha: si viene como string YYYY-MM-DD, enviarla así; si es Date, convertir a string
      let fechaEnviar = null;
      if (fechaPago) {
        if (typeof fechaPago === 'string') {
          fechaEnviar = fechaPago;
        } else if (fechaPago instanceof Date) {
          // Convertir Date a string YYYY-MM-DD usando fecha local
          const year = fechaPago.getFullYear();
          const month = String(fechaPago.getMonth() + 1).padStart(2, '0');
          const day = String(fechaPago.getDate()).padStart(2, '0');
          fechaEnviar = `${year}-${month}-${day}`;
        } else {
          fechaEnviar = fechaPago;
        }
      } else {
        // Si no hay fecha, usar fecha actual en formato YYYY-MM-DD
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        fechaEnviar = `${year}-${month}-${day}`;
      }

      const response = await api.put(`/creditos/${creditoId}/pagos`, {
        nroCuota,
        fechaPago: fechaEnviar
      });
      if (response.success) {
        await fetchData(); // Actualizar estado general
      }
    } catch (error) {
      console.error('Error registrando pago:', error);
      throw error;
    }
  };

  const cancelarPago = async (clienteId, creditoId, nroCuota) => {
    // Backend no tiene endpoint específico de cancelar pago, 
    // pero podemos usar updateCredito manipulando la cuota.
    // Ojo: esto es arriesgado sin endpoint específico.
    // Lo ideal sería endpoint DELETE /pagos o similar.
    // Por simplicidad y robustez, buscaré el crédito, modificaré la cuota y haré PUT.
    try {
      const credito = obtenerCredito(clienteId, creditoId);
      if (!credito) return;

      const nuevasCuotas = credito.cuotas.map(c => {
        if (c.nroCuota === nroCuota) {
          return { ...c, pagado: false, fechaPago: null, abonosCuota: [], saldoPendiente: 0, tieneAbono: false }; // Reset total? O solo pago full?
          // Si era un pago full, reset total. Si tenía abonos, es complejo. 
          // Asumiremos reset simple del flag pagado.
        }
        return c;
      });

      await actualizarCredito(clienteId, creditoId, { cuotas: nuevasCuotas });
    } catch (error) {
      console.error('Error cancelando pago:', error);
      throw error;
    }
  };

  const registrarAbonoCuota = async (clienteId, creditoId, nroCuota, valorAbono, fechaAbono = null) => {
    return agregarAbono(clienteId, creditoId, valorAbono, 'Abono a cuota', fechaAbono, 'abono', nroCuota);
  };

  const agregarAbono = async (clienteId, creditoId, valorAbono, descripcion, fechaAbono, tipo = 'abono', nroCuota = null, multaId = null) => {
    try {
      const payload = {
        valor: valorAbono,
        descripcion,
        fecha: fechaAbono,
        tipo,
        nroCuota,
        multaId
      };
      const response = await api.post(`/creditos/${creditoId}/abonos`, payload);
      if (response.success) await fetchData();
    } catch (error) {
      console.error('Error agregando abono:', error);
      throw error;
    }
  };

  const editarAbono = async (clienteId, creditoId, abonoId, datosActualizados) => {
    try {
      const response = await api.put(`/creditos/${creditoId}/abonos/${abonoId}`, datosActualizados);
      if (response.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error editando abono:', error);
      throw error;
    }
  };

  const eliminarAbono = async (clienteId, creditoId, abonoId) => {
    try {
      const response = await api.delete(`/creditos/${creditoId}/abonos/${abonoId}`);
      if (response.success) await fetchData();
    } catch (error) {
      console.error('Error eliminando abono:', error);
      throw error;
    }
  };

  const editarFechaCuota = async (clienteId, creditoId, nroCuota, nuevaFecha) => {
    try {
      const credito = obtenerCredito(clienteId, creditoId);
      if (!credito) return;

      // Extraer la fecha anterior y convertirla a fecha local
      const cuotaAnterior = credito.cuotas.find(c => c.nroCuota === nroCuota);
      if (!cuotaAnterior) return;

      // Parsear fecha anterior: extraer YYYY-MM-DD y crear Date local
      let fechaAnteriorStr = cuotaAnterior.fechaProgramada;
      if (typeof fechaAnteriorStr === 'string' && fechaAnteriorStr.includes('T')) {
        fechaAnteriorStr = fechaAnteriorStr.substring(0, 10); // YYYY-MM-DD
      }
      // Crear fecha local usando constructor Date(year, month, day) para evitar UTC
      const [yearA, monthA, dayA] = fechaAnteriorStr.split('-').map(Number);
      const fechaAnterior = new Date(yearA, monthA - 1, dayA, 12, 0, 0, 0);

      // Parsear nueva fecha: extraer YYYY-MM-DD del ISO string recibido
      let nuevaFechaStr = nuevaFecha;
      if (typeof nuevaFechaStr === 'string' && nuevaFechaStr.includes('T')) {
        nuevaFechaStr = nuevaFechaStr.substring(0, 10); // YYYY-MM-DD
      }
      // Crear fecha local usando constructor Date(year, month, day) para evitar UTC
      const [yearN, monthN, dayN] = nuevaFechaStr.split('-').map(Number);
      const fechaNueva = new Date(yearN, monthN - 1, dayN, 12, 0, 0, 0);

      // Calcular diferencia en días usando fechas locales
      const diferenciaDias = Math.floor((fechaNueva - fechaAnterior) / (1000 * 60 * 60 * 24));

      // Preparar la nueva fecha para guardar (usar la fecha recibida como ISO string)
      // La fecha ya viene como ISO string desde handleGuardarFecha, así que la usamos directamente
      const fechaNuevaISO = nuevaFecha;

      const nuevasCuotas = credito.cuotas.map(cuota => {
        if (cuota.nroCuota === nroCuota) {
          return { ...cuota, fechaProgramada: fechaNuevaISO };
        } else if (cuota.nroCuota > nroCuota) {
          // Para las cuotas posteriores, también usar constructor local para evitar desfase
          let fechaCuotaStr = cuota.fechaProgramada;
          if (typeof fechaCuotaStr === 'string' && fechaCuotaStr.includes('T')) {
            fechaCuotaStr = fechaCuotaStr.substring(0, 10); // YYYY-MM-DD
          }
          const [yearC, monthC, dayC] = fechaCuotaStr.split('-').map(Number);
          const fechaCuota = new Date(yearC, monthC - 1, dayC, 12, 0, 0, 0);
          fechaCuota.setDate(fechaCuota.getDate() + diferenciaDias);
          return { ...cuota, fechaProgramada: fechaCuota.toISOString() };
        }
        return cuota;
      });

      await actualizarCredito(clienteId, creditoId, { cuotas: nuevasCuotas });
    } catch (error) {
      console.error('Error editando fechas:', error);
      throw error;
    }
  };

  // --- MULTAS, DESCUENTOS, NOTAS ---

  const agregarMulta = async (clienteId, creditoId, valorMulta, motivo, nroCuota = null) => {
    try {
      // nroCuota es opcional, solo para referencia informativa
      const response = await api.post(`/creditos/${creditoId}/multas`, {
        valor: valorMulta,
        motivo,
        nroCuota: nroCuota || undefined
      });
      if (response.success) {
        // Devolver el crédito actualizado de la respuesta
        await fetchData();
        return response.data;
      }
    } catch (error) {
      console.error('Error agregando multa:', error);
      throw error;
    }
  };

  const editarMulta = async (clienteId, creditoId, multaId, valor, fecha, motivo) => {
    try {
      const response = await api.put(`/creditos/${creditoId}/multas/${multaId}`, {
        valor,
        fecha,
        motivo
      });
      if (response.success) {
        await fetchData();
        return response.data;
      }
    } catch (error) {
      console.error('Error editando multa:', error);
      throw error;
    }
  };

  const eliminarMulta = async (clienteId, creditoId, multaId) => {
    try {
      const response = await api.delete(`/creditos/${creditoId}/multas/${multaId}`);
      if (response.success) {
        await fetchData();
        return response.data;
      }
    } catch (error) {
      console.error('Error eliminando multa:', error);
      throw error;
    }
  };

  const agregarDescuento = async (clienteId, creditoId, valor, tipo, descripcion) => {
    try {
      const response = await api.post(`/creditos/${creditoId}/descuentos`, { valor, tipo, descripcion });
      if (response.success) await fetchData();
    } catch (error) {
      console.error('Error agregando descuento:', error);
      throw error;
    }
  };

  const eliminarDescuento = async () => { /* Implementar DELETE si necesario */ };

  const agregarNota = async (clienteId, creditoId, texto) => {
    try {
      const response = await api.post(`/creditos/${creditoId}/notas`, { texto });
      if (response.success) await fetchData();
    } catch (error) {
      console.error('Error agregando nota:', error);
      throw error;
    }
  };

  const eliminarNota = async () => { /* Implementar DELETE si necesario */ };

  // --- CAJA ---

  const agregarMovimientoCaja = async (movimientoData) => {
    try {
      // Normalización: solo recalcular montoEntregado si no viene ya calculado correctamente
      if (movimientoData.tipo === 'prestamo' && movimientoData.papeleria !== undefined) {
        // Si ya viene montoEntregado calculado (con valorCuotasPendientes), no sobrescribirlo
        if (movimientoData.montoEntregado === undefined || movimientoData.montoEntregado === null) {
          // Cálculo retrocompatible: solo restar papelería si no hay valorCuotasPendientes
          const valorCuotasPendientes = movimientoData.valorCuotasPendientes || 0;
          movimientoData.montoEntregado = Math.max(0, movimientoData.valor - (movimientoData.papeleria || 0) - valorCuotasPendientes);
        }
      }
      const response = await api.post('/movimientos-caja', movimientoData);
      if (response.success) {
        await fetchData(); // Recargar caja
        return response.data;
      }
    } catch (error) {
      console.error('Error caja:', error);
      throw error;
    }
  };

  const eliminarMovimientoCaja = async (id) => {
    try {
      await api.delete(`/movimientos-caja/${id}`);
      setMovimientosCaja(prev => prev.filter(m => (m.id !== id && m._id !== id)));
    } catch (error) {
      console.error('Error eliminando caja:', error);
    }
  };

  const actualizarMovimientoCaja = async (id, data) => {
    try {
      const response = await api.put(`/movimientos-caja/${id}`, data);
      if (response.success) {
        setMovimientosCaja(prev => prev.map(m => m.id === id ? response.data : m));
      }
    } catch (error) {
      console.error('Error actualizando caja:', error);
    }
  };

  // --- ALERTAS ---

  const agregarAlerta = async (alertaData) => {
    try {
      const response = await api.post('/alertas', alertaData);
      if (response.success) setAlertas(prev => [...prev, response.data]);
    } catch (error) { console.error(error); }
  };

  const actualizarAlerta = async (id, data) => {
    try {
      const response = await api.put(`/alertas/${id}`, data);
      if (response.success) setAlertas(prev => prev.map(a => a.id === id ? response.data : a));
    } catch (error) { console.error(error); }
  };

  const eliminarAlerta = async (id) => {
    try {
      await api.delete(`/alertas/${id}`);
      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (error) { console.error(error); }
  };

  const marcarAlertaComoNotificada = async (id) => {
    try {
      await api.put(`/alertas/${id}/notificar`);
      setAlertas(prev => prev.map(a => a.id === id ? { ...a, notificada: true } : a));
    } catch (error) { console.error(error); }
  };

  const desactivarAlerta = async (id) => {
    actualizarAlerta(id, { activa: false });
  };


  const exportarDatos = async () => {
    try {
      const response = await api.get('/backup/export');
      if (response) {
        // Helper to trigger download
        const dataStr = JSON.stringify(response, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `reservas_juan_backup_${new Date().toISOString().slice(0, 10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al exportar datos');
    }
  };

  const importarDatos = async (jsonData) => {
    try {
      const response = await api.post('/backup/import', { data: jsonData });
      if (response.success) {
        await fetchData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importando:', error);
      return false;
    }
  };

  const limpiarDatos = async () => {
    try {
      const response = await api.delete('/backup/reset');
      if (response.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error limpiando datos:', error);
    }
  };

  const value = {
    clientes,
    movimientosCaja,
    alertas,
    loading,
    fetchData,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    archivarCliente,
    desarchivarCliente,
    obtenerCliente,
    actualizarCoordenadasGPS,
    agregarCredito,
    actualizarCredito,
    eliminarCredito,
    obtenerCredito,
    asignarEtiquetaCredito,
    asignarEtiquetaCliente,
    renovarCredito,
    registrarPago,
    cancelarPago,
    registrarAbonoCuota,
    editarFechaCuota,
    agregarAbono,
    editarAbono,
    eliminarAbono,
    agregarDescuento,
    eliminarDescuento,
    agregarMulta,
    editarMulta,
    eliminarMulta,
    agregarNota,
    eliminarNota,
    agregarMovimientoCaja,
    eliminarMovimientoCaja,
    actualizarMovimientoCaja,
    agregarAlerta,
    actualizarAlerta,
    eliminarAlerta,
    marcarAlertaComoNotificada,
    desactivarAlerta,
    exportarDatos,
    importarDatos,
    limpiarDatos
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
