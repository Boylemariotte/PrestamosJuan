import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';
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
  calcularMontoEntregado
} from '../utils/creditCalculations';
import { determinarEstadoCredito } from '../utils/creditCalculations';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [clientes, setClientes] = useState([]);
  const [movimientosCaja, setMovimientosCaja] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);


  // Cargar datos al iniciar
  useEffect(() => {
    const data = storage.getData();
    let clientesData = data.clientes || [];

    // MIGRACIÓN: Unificar carteras K2 (Restaurar posiciones originales)
    // Mover clientes que fueron migrados a > 150 de vuelta a su posición original (restar 150)
    let dataChanged = false;
    const clientesMigrados = clientesData.map(c => {
      if (c.cartera === 'K2' && c.posicion > 150) {
        // Verificar si la posición original (pos - 150) está libre
        const posicionOriginal = c.posicion - 150;
        const posicionOcupada = clientesData.some(other =>
          other.id !== c.id &&
          other.cartera === 'K2' &&
          other.posicion === posicionOriginal
        );

        if (!posicionOcupada) {
          console.log(`Restaurando cliente K2 ${c.nombre} de pos ${c.posicion} a ${posicionOriginal}`);
          dataChanged = true;
          return { ...c, posicion: posicionOriginal };
        } else {
          console.warn(`No se pudo restaurar cliente K2 ${c.nombre} a pos ${posicionOriginal} porque está ocupada.`);
        }
      }
      return c;
    });

    setClientes(dataChanged ? clientesMigrados : clientesData);
    setMovimientosCaja(data.movimientosCaja || []);
    setAlertas(data.alertas || []);
    setLoading(false);
  }, []);

  // Guardar cambios en storage
  useEffect(() => {
    if (!loading) {
      storage.saveData({ clientes, movimientosCaja, alertas });
    }
  }, [clientes, movimientosCaja, alertas, loading]);
  // CRUD de Clientes
  const agregarCliente = (clienteData) => {
    let posicion = clienteData.posicion; // Usar posición predefinida si existe
    const cartera = clienteData.cartera || 'K1';
    const tipoPagoEsperado = clienteData.tipoPagoEsperado;

    // Si no hay posición predefinida, buscar la siguiente disponible para la cartera y tipo de pago
    if (!posicion) {
      if (cartera === 'K2') {
        // Para K2, buscar cualquier posición libre entre 1 y 225
        const clientesK2 = clientes.filter(c => c.cartera === 'K2');
        const posicionesOcupadas = clientesK2.map(c => c.posicion).filter(Boolean);

        const capacidadMaxima = 225;
        posicion = 1;
        while (posicionesOcupadas.includes(posicion) && posicion <= capacidadMaxima) {
          posicion++;
        }

        if (posicion > capacidadMaxima) {
          throw new Error(`No hay cupos disponibles para la cartera K2. Límite alcanzado.`);
        }
      } else {
        // Lógica existente para K1 (por tipo de pago)
        const clientesMismoTipo = clientes.filter(c => {
          const carteraCliente = c.cartera || 'K1';
          if (carteraCliente !== cartera) return false;

          if (tipoPagoEsperado && c.creditos && c.creditos.length > 0) {
            const tieneTipo = c.creditos.some(cred => {
              const estado = determinarEstadoCredito(cred.cuotas, cred);
              return (estado === 'activo' || estado === 'mora') && cred.tipo === tipoPagoEsperado;
            });
            if (tieneTipo) return true;
          }

          return c.tipoPagoEsperado === tipoPagoEsperado;
        });

        const posicionesOcupadas = clientesMismoTipo.map(c => c.posicion).filter(Boolean);
        const capacidadMaxima = tipoPagoEsperado === 'diario' ? 75 : 150;

        posicion = 1;
        while (posicionesOcupadas.includes(posicion) && posicion <= capacidadMaxima) {
          posicion++;
        }

        if (posicion > capacidadMaxima) {
          throw new Error(`No hay cupos disponibles para la cartera ${cartera} con tipo de pago ${tipoPagoEsperado || 'sin tipo'}. Límite alcanzado.`);
        }
      }
    } else {
      // Verificar que la posición no esté ocupada por otro cliente con la misma cartera + tipo de pago
      const posicionOcupada = clientes.some(c => {
        const carteraCliente = c.cartera || 'K1';
        if (carteraCliente !== cartera) return false;
        if (c.posicion !== posicion) return false;

        // Para K2, la posición es única en toda la cartera
        if (cartera === 'K2') return true;

        // Para K1, verificar si comparten el mismo tipo de pago
        if (tipoPagoEsperado) {
          if (c.creditos && c.creditos.length > 0) {
            const tieneTipo = c.creditos.some(cred => {
              const estado = determinarEstadoCredito(cred.cuotas, cred);
              return (estado === 'activo' || estado === 'mora') && cred.tipo === tipoPagoEsperado;
            });
            if (tieneTipo) return true;
          }
          if (c.tipoPagoEsperado === tipoPagoEsperado) return true;
        }

        return false;
      });

      if (posicionOcupada) {
        throw new Error(`La posición ${posicion} ya está ocupada en la cartera ${cartera} para el tipo de pago ${tipoPagoEsperado || 'sin tipo'}.`);
      }
    }

    const nuevoCliente = {
      id: Date.now().toString(),
      ...clienteData,
      posicion,
      creditos: [],
      fechaCreacion: obtenerFechaHoraLocal()
    };

    setClientes(prev => [...prev, nuevoCliente]);
    return nuevoCliente;
  };

  const actualizarCliente = (id, clienteData) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === id) {
        const clienteActualizado = { ...cliente, ...clienteData };

        // Limpiar coordenadas GPS si las direcciones cambiaron o fueron eliminadas

        // Para el cliente - Residencia
        const direccionResidenciaCambio = cliente.direccion !== clienteActualizado.direccion;
        const direccionResidenciaEliminada = !clienteActualizado.direccion || clienteActualizado.direccion.trim() === '';
        if (direccionResidenciaCambio || direccionResidenciaEliminada) {
          delete clienteActualizado.coordenadasResidencia;
          delete clienteActualizado.coordenadasResidenciaActualizada;
        }

        // Para el cliente - Trabajo
        const direccionTrabajoCambio = cliente.direccionTrabajo !== clienteActualizado.direccionTrabajo;
        const direccionTrabajoEliminada = !clienteActualizado.direccionTrabajo || clienteActualizado.direccionTrabajo.trim() === '';
        if (direccionTrabajoCambio || direccionTrabajoEliminada) {
          delete clienteActualizado.coordenadasTrabajo;
          delete clienteActualizado.coordenadasTrabajoActualizada;
        }

        // Para el fiador - Residencia
        const fiadorResidenciaCambio = cliente.fiador?.direccion !== clienteActualizado.fiador?.direccion;
        const fiadorResidenciaEliminada = !clienteActualizado.fiador?.direccion || clienteActualizado.fiador.direccion.trim() === '';
        if ((fiadorResidenciaCambio || fiadorResidenciaEliminada) && clienteActualizado.fiador) {
          clienteActualizado.fiador = { ...clienteActualizado.fiador };
          delete clienteActualizado.fiador.coordenadasResidencia;
          delete clienteActualizado.fiador.coordenadasResidenciaActualizada;
        }

        // Para el fiador - Trabajo
        const fiadorTrabajoCambio = cliente.fiador?.direccionTrabajo !== clienteActualizado.fiador?.direccionTrabajo;
        const fiadorTrabajoEliminada = !clienteActualizado.fiador?.direccionTrabajo || clienteActualizado.fiador.direccionTrabajo.trim() === '';
        if ((fiadorTrabajoCambio || fiadorTrabajoEliminada) && clienteActualizado.fiador) {
          clienteActualizado.fiador = { ...clienteActualizado.fiador };
          delete clienteActualizado.fiador.coordenadasTrabajo;
          delete clienteActualizado.fiador.coordenadasTrabajoActualizada;
        }

        return clienteActualizado;
      }
      return cliente;
    }));
  };

  const eliminarCliente = (id) => {
    setClientes(prev => prev.filter(cliente => cliente.id !== id));
  };

  const obtenerCliente = (id) => {
    return clientes.find(cliente => cliente.id === id);
  };

  // Actualizar coordenadas GPS del cliente o fiador (residencia o trabajo)
  // entidad: 'cliente' (default) o 'fiador'
  const actualizarCoordenadasGPS = (clienteId, tipo, coordenadas, entidad = 'cliente') => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        const campo = tipo === 'trabajo' ? 'coordenadasTrabajo' : 'coordenadasResidencia';
        const campoFecha = tipo === 'trabajo' ? 'coordenadasTrabajoActualizada' : 'coordenadasResidenciaActualizada';

        if (entidad === 'fiador') {
          const fiadorActual = cliente.fiador || {};
          return {
            ...cliente,
            fiador: {
              ...fiadorActual,
              [campo]: {
                lat: coordenadas.lat,
                lon: coordenadas.lon,
                precision: coordenadas.precision,
                timestamp: coordenadas.timestamp
              },
              [campoFecha]: new Date().toISOString()
            }
          };
        }

        return {
          ...cliente,
          [campo]: {
            lat: coordenadas.lat,
            lon: coordenadas.lon,
            precision: coordenadas.precision,
            timestamp: coordenadas.timestamp
          },
          [campoFecha]: new Date().toISOString()
        };
      }
      return cliente;
    }));
  };

  // CRUD de Créditos
  const agregarCredito = (clienteId, creditoData) => {
    const { monto, tipo, fechaInicio, tipoQuincenal, papeleriaManual, usarPapeleriaManual } = creditoData;
    // Validación de cupos por cartera/tipo de pago y asignación de cartera
    const CAPACIDADES = {
      K1: { diario: 75, semanal: 150, quincenal: 150 },
      K2: { general: 225 }
    };

    const clienteActual = obtenerCliente(clienteId);
    let carteraObjetivo = clienteActual?.cartera || 'K1';

    // Ajustar cartera según tipo de pago (solo para K1/K2 lógica base)
    if (tipo === 'mensual') {
      carteraObjetivo = 'K2';
    } else if (tipo === 'diario' || tipo === 'semanal') {
      carteraObjetivo = 'K1';
    } else if (tipo === 'quincenal') {
      // Quincenal puede ser K1 o K2, mantener la actual si es válida
      carteraObjetivo = carteraObjetivo === 'K2' ? 'K2' : 'K1';
    }

    // Validar si el tipo está permitido en la cartera
    if (carteraObjetivo === 'K1' && !CAPACIDADES.K1[tipo]) {
      throw new Error(`El tipo de pago "${tipo}" no está permitido en la cartera K1.`);
    }
    // Para K2, permitimos quincenal y mensual (ya validado en CreditoForm, pero doble check aquí)
    if (carteraObjetivo === 'K2' && tipo !== 'quincenal' && tipo !== 'mensual') {
      throw new Error(`El tipo de pago "${tipo}" no está permitido en la cartera K2.`);
    }

    // Verificar cupos
    if (carteraObjetivo === 'K2') {
      const capacidad = CAPACIDADES.K2.general;
      // Contar total de clientes en K2 (independientemente del tipo de pago)
      // Nota: Al agregar un crédito a un cliente existente, no aumentamos el número de clientes.
      // Pero si estuviéramos moviendo de cartera, sí. 
      // Asumimos que el cliente ya está en la cartera correcta o se moverá.
      // Si el cliente ya está en K2, no cuenta como nuevo.
      const clientesK2 = clientes.filter(c => c.cartera === 'K2');
      const yaEnK2 = clienteActual?.cartera === 'K2';

      if (!yaEnK2 && clientesK2.length >= capacidad) {
        throw new Error(`Cupo lleno en cartera K2. (${clientesK2.length}/${capacidad})`);
      }
    } else {
      // Lógica existente para K1
      const ocupacionActual = new Set();
      clientes.forEach((c) => {
        const carteraCliente = c.cartera || 'K1';
        if (carteraCliente !== carteraObjetivo) return;
        const tieneTipo = (c.creditos || []).some((cred) => {
          const estado = determinarEstadoCredito(cred.cuotas, cred);
          return (estado === 'activo' || estado === 'mora') && cred.tipo === tipo;
        });
        if (tieneTipo) ocupacionActual.add(c.id);
      });

      const capacidad = CAPACIDADES[carteraObjetivo][tipo];
      // Si el cliente ya tiene un crédito activo de este tipo, no cuenta como nuevo cupo
      const yaTieneTipo = (clienteActual?.creditos || []).some(cred => {
        const estado = determinarEstadoCredito(cred.cuotas, cred);
        return (estado === 'activo' || estado === 'mora') && cred.tipo === tipo;
      });

      if (!yaTieneTipo && ocupacionActual.size >= capacidad) {
        throw new Error(`Cupo lleno en cartera ${carteraObjetivo} para pagos ${tipo}. (${ocupacionActual.size}/${capacidad})`);
      }
    }

    // Obtener configuración de cuotas según monto y tipo (o usar manuales)
    const esManual = creditoData.esManual;
    const totalAPagar = esManual ? creditoData.totalAPagar : calcularTotalAPagar(monto, tipo);
    const numCuotas = esManual ? creditoData.numCuotas : obtenerNumCuotas(monto, tipo);
    const valorCuota = esManual ? creditoData.valorCuota : calcularValorCuota(monto, tipo);

    // Generar fechas según el tipo de pago
    let cuotas;
    switch (tipo) {
      case 'diario':
        cuotas = generarFechasPagoDiarias(fechaInicio, numCuotas);
        break;
      case 'semanal':
        cuotas = generarFechasPagoSemanales(fechaInicio, numCuotas);
        break;
      case 'quincenal':
        cuotas = generarFechasPagoQuincenales(fechaInicio, numCuotas, tipoQuincenal || '1-16');
        break;
      case 'mensual':
        cuotas = generarFechasPagoMensuales(fechaInicio, numCuotas);
        break;
      default:
        cuotas = generarFechasPagoSemanales(fechaInicio, numCuotas);
    }

    // Usar papelería manual si está habilitada, sino usar automática
    const papeleriaAutomatica = calcularPapeleria(monto);
    const papeleria = usarPapeleriaManual && papeleriaManual ? parseFloat(papeleriaManual) : papeleriaAutomatica;
    const montoEntregado = monto - papeleria;

    const nuevoCredito = {
      id: `CRED-${Date.now()}`,
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
      notas: [],
      fechaCreacion: obtenerFechaHoraLocal()
    };

    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          cartera: carteraObjetivo,
          creditos: [...(cliente.creditos || []), nuevoCredito]
        };
      }
      return cliente;
    }));

    return nuevoCredito;
  };

  const actualizarCredito = (clienteId, creditoId, creditoData) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito =>
            credito.id === creditoId ? { ...credito, ...creditoData } : credito
          )
        };
      }
      return cliente;
    }));
  };

  const eliminarCredito = (clienteId, creditoId) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.filter(credito => credito.id !== creditoId)
        };
      }
      return cliente;
    }));
  };

  const obtenerCredito = (clienteId, creditoId) => {
    const cliente = obtenerCliente(clienteId);
    if (!cliente) return null;
    return cliente.creditos?.find(credito => credito.id === creditoId);
  };

  const asignarEtiquetaCredito = (clienteId, creditoId, etiqueta) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                etiqueta: etiqueta,
                fechaEtiqueta: obtenerFechaHoraLocal()
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  const renovarCredito = (clienteId, creditoAnteriorId, nuevoCreditoData) => {
    // Marcar crédito anterior como renovado
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoAnteriorId) {
              return {
                ...credito,
                renovado: true,
                fechaRenovacion: obtenerFechaHoraLocal(),
                creditoRenovacionId: `CRED-${Date.now()}`
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));

    // Crear nuevo crédito con los datos de renovación
    return agregarCredito(clienteId, {
      ...nuevoCreditoData,
      esRenovacion: true,
      creditoAnteriorId: creditoAnteriorId
    });
  };

  // Gestión de Pagos
  const registrarPago = (clienteId, creditoId, nroCuota, fechaPago = null) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                cuotas: credito.cuotas.map(cuota => {
                  if (cuota.nroCuota === nroCuota) {
                    return {
                      ...cuota,
                      pagado: true,
                      fechaPago: fechaPago || obtenerFechaLocal()
                    };
                  }
                  return cuota;
                })
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  const cancelarPago = (clienteId, creditoId, nroCuota) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                cuotas: credito.cuotas.map(cuota => {
                  if (cuota.nroCuota === nroCuota) {
                    return {
                      ...cuota,
                      pagado: false,
                      fechaPago: null
                    };
                  }
                  return cuota;
                })
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  const registrarAbonoCuota = (clienteId, creditoId, nroCuota, valorAbono, fechaAbono = null) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              const cuotaActual = credito.cuotas.find(c => c.nroCuota === nroCuota);
              if (!cuotaActual) return credito;

              const abonosPrevios = cuotaActual.abonosCuota || [];
              const totalAbonado = abonosPrevios.reduce((sum, a) => sum + a.valor, 0) + valorAbono;
              const valorCuota = credito.valorCuota;
              const saldoPendiente = valorCuota - totalAbonado;

              const nuevoAbono = {
                id: Date.now().toString(),
                valor: valorAbono,
                fecha: fechaAbono || obtenerFechaLocal(),
                fechaCreacion: obtenerFechaHoraLocal()
              };

              return {
                ...credito,
                cuotas: credito.cuotas.map(cuota => {
                  if (cuota.nroCuota === nroCuota) {
                    return {
                      ...cuota,
                      abonosCuota: [...abonosPrevios, nuevoAbono],
                      saldoPendiente: saldoPendiente > 0 ? saldoPendiente : 0,
                      tieneAbono: true,
                      pagado: saldoPendiente <= 0,
                      fechaPago: saldoPendiente <= 0 ? (fechaAbono || obtenerFechaLocal()) : null
                    };
                  }
                  return cuota;
                })
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  const editarFechaCuota = (clienteId, creditoId, nroCuota, nuevaFecha) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              const cuotaEditada = credito.cuotas.find(c => c.nroCuota === nroCuota);
              if (!cuotaEditada) return credito;

              const fechaAnterior = new Date(cuotaEditada.fechaProgramada);
              const fechaNueva = new Date(nuevaFecha);
              const diferenciaDias = Math.floor((fechaNueva - fechaAnterior) / (1000 * 60 * 60 * 24));

              // Calcular el intervalo según el tipo de crédito
              const diasIntervalo = credito.tipo === 'semanal' ? 7 : 15;

              return {
                ...credito,
                cuotas: credito.cuotas.map(cuota => {
                  if (cuota.nroCuota === nroCuota) {
                    // Actualizar la cuota seleccionada
                    return {
                      ...cuota,
                      fechaProgramada: nuevaFecha
                    };
                  } else if (cuota.nroCuota > nroCuota) {
                    // Actualizar las cuotas posteriores
                    const fechaOriginal = new Date(cuota.fechaProgramada);
                    fechaOriginal.setDate(fechaOriginal.getDate() + diferenciaDias);
                    return {
                      ...cuota,
                      fechaProgramada: fechaOriginal.getFullYear() + '-' +
                        String(fechaOriginal.getMonth() + 1).padStart(2, '0') + '-' +
                        String(fechaOriginal.getDate()).padStart(2, '0')
                    };
                  }
                  return cuota;
                })
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  // Gestión de Abonos
  const agregarAbono = (clienteId, creditoId, valorAbono, descripcion = '', fechaAbono = null) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              const nuevoAbono = {
                id: Date.now().toString(),
                valor: valorAbono,
                descripcion: descripcion || 'Abono al crédito',
                fecha: fechaAbono || obtenerFechaHoraLocal()
              };
              return {
                ...credito,
                abonos: [...(credito.abonos || []), nuevoAbono]
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  const editarAbono = (clienteId, creditoId, abonoId, datosActualizados) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                abonos: (credito.abonos || []).map(abono =>
                  abono.id === abonoId
                    ? {
                        ...abono,
                        valor: datosActualizados.valor !== undefined ? datosActualizados.valor : abono.valor,
                        descripcion: datosActualizados.descripcion !== undefined ? datosActualizados.descripcion : abono.descripcion,
                        fecha: datosActualizados.fecha !== undefined ? datosActualizados.fecha : abono.fecha
                      }
                    : abono
                )
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  const eliminarAbono = (clienteId, creditoId, abonoId) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                abonos: (credito.abonos || []).filter(abono => abono.id !== abonoId)
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  // Gestión de Descuentos
  const agregarDescuento = (clienteId, creditoId, valorDescuento, tipo = 'dias', descripcion = '') => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              const nuevoDescuento = {
                id: Date.now().toString(),
                valor: valorDescuento,
                tipo: tipo, // 'dias' o 'papeleria'
                descripcion: descripcion || (tipo === 'dias' ? 'Descuento por días' : 'Descuento por papelería'),
                fecha: obtenerFechaHoraLocal()
              };
              return {
                ...credito,
                descuentos: [...(credito.descuentos || []), nuevoDescuento]
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  const eliminarDescuento = (clienteId, creditoId, descuentoId) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                descuentos: (credito.descuentos || []).filter(descuento => descuento.id !== descuentoId)
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  // Gestión de Multas
  const agregarMulta = (clienteId, creditoId, nroCuota, valorMulta, motivo = '') => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                cuotas: credito.cuotas.map(cuota => {
                  if (cuota.nroCuota === nroCuota) {
                    const nuevaMulta = {
                      id: Date.now().toString(),
                      valor: valorMulta,
                      motivo: motivo || 'Recargo por mora',
                      fecha: obtenerFechaHoraLocal()
                    };
                    return {
                      ...cuota,
                      multas: [...(cuota.multas || []), nuevaMulta]
                    };
                  }
                  return cuota;
                })
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  const eliminarMulta = (clienteId, creditoId, nroCuota, multaId) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                cuotas: credito.cuotas.map(cuota => {
                  if (cuota.nroCuota === nroCuota) {
                    return {
                      ...cuota,
                      multas: (cuota.multas || []).filter(multa => multa.id !== multaId)
                    };
                  }
                  return cuota;
                })
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  // Gestión de Notas
  const agregarNota = (clienteId, creditoId, texto) => {
    const nuevaNota = {
      id: Date.now().toString(),
      texto,
      fecha: obtenerFechaHoraLocal()
    };

    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                notas: [...(credito.notas || []), nuevaNota]
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));

    return nuevaNota;
  };

  const eliminarNota = (clienteId, creditoId, notaId) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        return {
          ...cliente,
          creditos: cliente.creditos.map(credito => {
            if (credito.id === creditoId) {
              return {
                ...credito,
                notas: credito.notas.filter(nota => nota.id !== notaId)
              };
            }
            return credito;
          })
        };
      }
      return cliente;
    }));
  };

  // Gestión de Caja
  const agregarMovimientoCaja = (movimientoData) => {
    // Si es un préstamo y ya tiene papelería definida, asegurarse de que el montoEntregado sea correcto
    if (movimientoData.tipo === 'prestamo' && movimientoData.papeleria !== undefined) {
      movimientoData = {
        ...movimientoData,
        montoEntregado: movimientoData.valor - (movimientoData.papeleria || 0)
      };
    }

    const nuevoMovimiento = {
      id: `MOV-${Date.now()}`,
      ...movimientoData,
      fecha: movimientoData.fecha || obtenerFechaLocal().split('T')[0],
      fechaCreacion: obtenerFechaHoraLocal()
    };

    console.log('Nuevo movimiento de caja:', nuevoMovimiento); // Para depuración

    setMovimientosCaja(prev => [...prev, nuevoMovimiento]);
    return nuevoMovimiento;
  };

  const eliminarMovimientoCaja = (movimientoId) => {
    setMovimientosCaja(prev => prev.filter(mov => mov.id !== movimientoId));
  };

  const actualizarMovimientoCaja = (movimientoId, movimientoData) => {
    setMovimientosCaja(prev => prev.map(mov =>
      mov.id === movimientoId ? { ...mov, ...movimientoData } : mov
    ));
  };

  // Utilidades
  const exportarDatos = () => {
    storage.exportData();
  };

  const importarDatos = (jsonData) => {
    const success = storage.importData(jsonData);
    if (success) {
      const data = storage.getData();
      setClientes(data.clientes || []);
    }
    return success;
  };

  const limpiarDatos = () => {
    storage.clearData();
    setClientes([]);
    setMovimientosCaja([]);
    setAlertas([]);
  };

  // Gestión de Alertas
  const agregarAlerta = (alertaData) => {
    const nuevaAlerta = {
      id: `ALERT-${Date.now()}`,
      ...alertaData,
      fechaCreacion: obtenerFechaHoraLocal(),
      activa: true,
      notificada: false
    };
    setAlertas(prev => [...prev, nuevaAlerta]);
    return nuevaAlerta;
  };

  const actualizarAlerta = (alertaId, alertaData) => {
    setAlertas(prev => prev.map(alerta =>
      alerta.id === alertaId ? { ...alerta, ...alertaData } : alerta
    ));
  };

  const eliminarAlerta = (alertaId) => {
    setAlertas(prev => prev.filter(alerta => alerta.id !== alertaId));
  };

  const marcarAlertaComoNotificada = (alertaId) => {
    setAlertas(prev => prev.map(alerta =>
      alerta.id === alertaId ? { ...alerta, notificada: true } : alerta
    ));
  };

  const desactivarAlerta = (alertaId) => {
    setAlertas(prev => prev.map(alerta =>
      alerta.id === alertaId ? { ...alerta, activa: false } : alerta
    ));
  };

  const value = {
    clientes,
    movimientosCaja,
    alertas,
    loading,
    // Clientes
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    obtenerCliente,
    actualizarCoordenadasGPS,
    // Créditos
    agregarCredito,
    actualizarCredito,
    eliminarCredito,
    obtenerCredito,
    asignarEtiquetaCredito,
    renovarCredito,
    // Pagos
    registrarPago,
    cancelarPago,
    registrarAbonoCuota,
    editarFechaCuota,
    // Abonos
    agregarAbono,
    eliminarAbono,
    // Descuentos
    agregarDescuento,
    eliminarDescuento,
    // Multas
    agregarMulta,
    eliminarMulta,
    // Notas
    agregarNota,
    eliminarNota,
    // Caja
    agregarMovimientoCaja,
    eliminarMovimientoCaja,
    actualizarMovimientoCaja,
    // Alertas
    agregarAlerta,
    actualizarAlerta,
    eliminarAlerta,
    marcarAlertaComoNotificada,
    desactivarAlerta,
    // Utilidades
    exportarDatos,
    importarDatos,
    limpiarDatos
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
