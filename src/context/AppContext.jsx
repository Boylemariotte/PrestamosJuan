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
    setClientes(data.clientes || []);
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
    const nuevoCliente = {
      id: Date.now().toString(),
      ...clienteData,
      creditos: [],
      fechaCreacion: obtenerFechaHoraLocal()
    };
    setClientes(prev => [...prev, nuevoCliente]);
    return nuevoCliente;
  };

  const actualizarCliente = (id, clienteData) => {
    setClientes(prev => prev.map(cliente => 
      cliente.id === id ? { ...cliente, ...clienteData } : cliente
    ));
  };

  const eliminarCliente = (id) => {
    setClientes(prev => prev.filter(cliente => cliente.id !== id));
  };

  const obtenerCliente = (id) => {
    return clientes.find(cliente => cliente.id === id);
  };

  // CRUD de Créditos
  const agregarCredito = (clienteId, creditoData) => {
    const { monto, tipo, fechaInicio, tipoQuincenal, papeleriaManual, usarPapeleriaManual } = creditoData;
    
    // Obtener configuración de cuotas según monto y tipo
    const totalAPagar = calcularTotalAPagar(monto, tipo);
    const numCuotas = obtenerNumCuotas(monto, tipo);
    const valorCuota = calcularValorCuota(monto, tipo);
    
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
  const agregarAbono = (clienteId, creditoId, valorAbono, descripcion = '') => {
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
                fecha: obtenerFechaHoraLocal()
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
    const nuevoMovimiento = {
      id: `MOV-${Date.now()}`,
      ...movimientoData,
      fecha: movimientoData.fecha || obtenerFechaLocal().split('T')[0],
      fechaCreacion: obtenerFechaHoraLocal()
    };
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
