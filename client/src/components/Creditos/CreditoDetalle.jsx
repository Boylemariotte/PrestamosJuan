import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, Trash2, Award, Check, Calendar } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import RenovacionForm from './RenovacionForm';
import {
  determinarEstadoCredito,
  getColorEstado,
  formatearMoneda,
  calcularTotalMultasCredito,
  aplicarAbonosAutomaticamente,
  formatearFechaCorta
} from '../../utils/creditCalculations';
import { useApp } from '../../context/AppContext';
import CowImage from '../../Icon/Cow.png';

// Componentes
import CreditoDetalleHeader from './CreditoDetalleHeader';
import EncabezadoFormulario from './EncabezadoFormulario';
import FormularioSolicitante from './FormularioSolicitante';
import FormularioCodeudor from './FormularioCodeudor';
import GrillaCuotas from './GrillaCuotas';
import ResumenCredito from './ResumenCredito';
import SelectorEtiquetas from './SelectorEtiquetas';
import BarraProgreso from './BarraProgreso';
import ListaCuotas from './ListaCuotas';
import FormularioDescuento from './FormularioDescuento';
import ListaDescuentos from './ListaDescuentos';
import ListaAbonos from './ListaAbonos';
import ListaNotas from './ListaNotas';
import EditorFecha from './EditorFecha';

const CreditoDetalle = ({ credito: creditoInicial, clienteId, cliente, onClose }) => {
  const { registrarPago, cancelarPago, editarFechaCuota, agregarNota, eliminarNota, agregarMulta, eliminarMulta, agregarAbono, editarAbono, eliminarAbono, agregarDescuento, eliminarDescuento, asignarEtiquetaCredito, renovarCredito, eliminarCredito, obtenerCredito } = useApp();

  // Obtener el crédito actualizado del contexto
  const creditoDesdeContext = obtenerCredito(clienteId, creditoInicial.id);
  const credito = creditoDesdeContext || creditoInicial;

  // Si el crédito desaparece del contexto (p. ej. fue eliminado), cerrar el modal automáticamente
  useEffect(() => {
    if (!creditoDesdeContext) {
      // Llamamos a onClose para evitar error visual cuando el crédito fue borrado externamente
      try {
        onClose();
      } catch (e) {
        // noop
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditoDesdeContext]);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    tipoPago: credito.tipo || 'semanal',
    fechaInicio: credito.fechaInicio || '',
    valorProducto: credito.monto || '',
    valorCuota: credito.valorCuota || '',
    solicitante: {
      nombre: cliente?.nombre || credito.cliente?.nombre || '',
      cedula: cliente?.documento || credito.cliente?.cedula || '',
      direccionCasa: cliente?.direccion || credito.cliente?.direccion || '',
      direccionTrabajo: cliente?.direccionTrabajo || credito.cliente?.direccionTrabajo || '',
      telefono: cliente?.telefono || credito.cliente?.telefono || ''
    },
    codeudor: {
      nombre: cliente?.fiador?.nombre || credito.codeudor?.nombre || '',
      cedula: cliente?.fiador?.documento || credito.codeudor?.cedula || '',
      direccionCasa: cliente?.fiador?.direccion || credito.codeudor?.direccion || '',
      direccionTrabajo: cliente?.fiador?.direccionTrabajo || credito.codeudor?.direccionTrabajo || '',
      telefono: cliente?.fiador?.telefono || credito.codeudor?.telefono || ''
    }
  });

  const [nuevaNota, setNuevaNota] = useState('');
  const [mostrarFormularioMulta, setMostrarFormularioMulta] = useState(null);
  const [valorMulta, setValorMulta] = useState('');
  const [motivoMulta, setMotivoMulta] = useState('');
  const [mostrarFormularioAbono, setMostrarFormularioAbono] = useState(false);
  const [valorAbono, setValorAbono] = useState('');
  const [descripcionAbono, setDescripcionAbono] = useState('');
  const [fechaAbono, setFechaAbono] = useState(new Date().toISOString().split('T')[0]);
  const [mostrarFormularioDescuento, setMostrarFormularioDescuento] = useState(false);
  const [valorDescuento, setValorDescuento] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState('dias');
  const [descripcionDescuento, setDescripcionDescuento] = useState('');
  const [mostrarSelectorEtiqueta, setMostrarSelectorEtiqueta] = useState(false);
  const [mostrarFormularioRenovacion, setMostrarFormularioRenovacion] = useState(false);
  const [mostrarEditorFecha, setMostrarEditorFecha] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');

  // Estado para edición de abonos (pagos)
  const [abonoEnEdicion, setAbonoEnEdicion] = useState(null);

  // Estados para el refactor de pagos/multas en grilla
  const [cuotaParaPagar, setCuotaParaPagar] = useState(null);
  const [mostrarModalNuevaMulta, setMostrarModalNuevaMulta] = useState(false);

  // Ref para el contenedor que se va a imprimir/exportar
  const formularioRef = useRef(null);

  const estado = determinarEstadoCredito(credito.cuotas, credito);
  const colorEstado = getColorEstado(estado);

  // Función para obtener el número de cuotas a mostrar
  const obtenerNumeroCuotas = (tipoPago) => {
    switch (tipoPago) {
      case 'diario':
        return 60;
      case 'semanal':
        return 10;
      case 'quincenal':
        return 5;
      case 'mensual':
        return 3;
      default:
        return 10;
    }
  };

  // Actualizar formulario cuando cambien los datos del cliente
  useEffect(() => {
    if (cliente) {
      setFormData(prev => ({
        ...prev,
        solicitante: {
          nombre: cliente.nombre || prev.solicitante.nombre,
          cedula: cliente.documento || prev.solicitante.cedula,
          direccionCasa: cliente.direccion || prev.solicitante.direccionCasa,
          direccionTrabajo: cliente.direccionTrabajo || prev.solicitante.direccionTrabajo,
          telefono: cliente.telefono || prev.solicitante.telefono
        },
        codeudor: {
          nombre: cliente.fiador?.nombre || prev.codeudor.nombre,
          cedula: cliente.fiador?.documento || prev.codeudor.cedula,
          direccionCasa: cliente.fiador?.direccion || prev.codeudor.direccionCasa,
          direccionTrabajo: cliente.fiador?.direccionTrabajo || prev.codeudor.direccionTrabajo,
          telefono: cliente.fiador?.telefono || prev.codeudor.telefono
        }
      }));
    }
  }, [cliente]);

  // Actualizar tipo de pago cuando cambie el crédito
  useEffect(() => {
    if (credito.tipo) {
      setFormData(prev => ({
        ...prev,
        tipoPago: credito.tipo
      }));
    }
  }, [credito.tipo]);

  // Funciones para manejar cambios en el formulario
  const handleSolicitanteChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      solicitante: {
        ...prev.solicitante,
        [field]: value
      }
    }));
  };

  const handleCodeudorChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      codeudor: {
        ...prev.codeudor,
        [field]: value
      }
    }));
  };

  const handlePago = (nroCuota, pagado, fechaPago = null) => {
    if (pagado) {
      cancelarPago(clienteId, credito.id, nroCuota);
    } else {
      registrarPago(clienteId, credito.id, nroCuota, fechaPago);
    }
  };

  const handleEditarFecha = (nroCuota, fechaActual) => {
    setMostrarEditorFecha(nroCuota);
    // Extraer solo la parte de fecha (YYYY-MM-DD) del ISO string para el input type="date"
    // Si viene como ISO string, tomar los primeros 10 caracteres
    // Si ya es YYYY-MM-DD, usarlo directamente
    let fechaFormateada = fechaActual;
    if (typeof fechaActual === 'string' && fechaActual.includes('T')) {
      fechaFormateada = fechaActual.substring(0, 10);
    } else if (fechaActual instanceof Date) {
      // Si es objeto Date, formatearlo a YYYY-MM-DD en hora local
      const year = fechaActual.getFullYear();
      const month = String(fechaActual.getMonth() + 1).padStart(2, '0');
      const day = String(fechaActual.getDate()).padStart(2, '0');
      fechaFormateada = `${year}-${month}-${day}`;
    }
    setNuevaFecha(fechaFormateada);
  };

  const handleGuardarFecha = () => {
    if (nuevaFecha && mostrarEditorFecha) {
      // Asegurar que la fecha se envía como mediodía local para evitar desfase UTC
      // Crear fecha local a mediodía (12:00) del día seleccionado
      // Usar formato YYYY-MM-DDTHH:mm:ss para crear fecha local explícitamente
      const [year, month, day] = nuevaFecha.split('-').map(Number);
      const fechaLocal = new Date(year, month - 1, day, 12, 0, 0, 0);
      
      editarFechaCuota(clienteId, credito.id, mostrarEditorFecha, fechaLocal.toISOString());
      // Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        setMostrarEditorFecha(null);
        setNuevaFecha('');
      }, 100);
    }
  };

  const handleCancelarEdicionFecha = () => {
    setMostrarEditorFecha(null);
    setNuevaFecha('');
  };

  const handleEliminarCredito = async () => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar este crédito?\n\n` +
      `Crédito ID: ${credito.id}\n` +
      `Monto: ${formatearMoneda(credito.monto)}\n` +
      `Estado: ${estado}\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (confirmacion) {
      try {
        await eliminarCredito(clienteId, credito.id);
      } catch (e) {
        console.error('Error eliminando crédito desde UI:', e);
      }
      // onClose() puede ser llamado por el efecto cuando el contexto se actualice,
      // pero lo llamamos también aquí para cerrar inmediatamente si la eliminación fue local.
      try { onClose(); } catch (e) { /* noop */ }
    }
  };

  const handleAgregarNota = (e) => {
    e.preventDefault();
    if (nuevaNota.trim()) {
      agregarNota(clienteId, credito.id, nuevaNota.trim());
      setNuevaNota('');
    }
  };

  const handleEliminarNota = (notaId) => {
    if (confirm('¿Estás seguro de eliminar esta nota?')) {
      eliminarNota(clienteId, credito.id, notaId);
    }
  };

  const handleAgregarMulta = (nroCuota) => {
    if (!valorMulta || parseFloat(valorMulta) <= 0) {
      alert('Por favor ingresa un valor válido para la multa');
      return;
    }
    agregarMulta(clienteId, credito.id, nroCuota, parseFloat(valorMulta), motivoMulta);
    setMostrarFormularioMulta(null);
    setValorMulta('');
    setMotivoMulta('');
  };

  const handleEliminarMulta = (nroCuota, multaId) => {
    if (confirm('¿Estás seguro de eliminar esta multa?')) {
      eliminarMulta(clienteId, credito.id, nroCuota, multaId);
    }
  };

  const handlePagarMulta = async (multa) => {
    const valorPendiente = multa.valor; // En este modelo simple, no trackeamos parciales de multa individualmente en el objeto multa, sino en cuota.multasCubiertas.
    // Sin embargo, `todasLasMultas` calculado en useMemo no tiene el 'pendiente' exacto por multa individual fácilmente accesible si hay pagos parciales a la bolsa de multas.
    // Pero la lógica de abono 'tipo: multa' distribuirá a la cuota.

    // Simplificación: Pedir el monto total de la multa por defecto
    const monto = prompt(`Ingrese el valor a pagar para la multa de la Cuota #${multa.nroCuota}:`, valorPendiente);

    if (monto && parseFloat(monto) > 0) {
      const descripcion = `Pago Multa Cuota #${multa.nroCuota}`;
      const fecha = new Date().toISOString().split('T')[0];

      // Pasar tipo = 'multa' y usar el nroCuota en la descripción para el targeting
      // NOTA: agregarAbono no fue actualizado en la interface de useApp?
      // Sí, updated in AppContext.jsx definition.
      // Pero agregarAbono en this component calls context.

      await agregarAbono(clienteId, credito.id, parseFloat(monto), descripcion, fecha, 'multa', multa.nroCuota);
    }
  };

  const handleAgregarAbono = () => {
    if (!valorAbono || parseFloat(valorAbono) <= 0) {
      alert('Por favor ingresa un valor válido para el abono');
      return;
    }

    if (!fechaAbono) {
      alert('Por favor selecciona una fecha para el abono');
      return;
    }

    // Simplemente agregar el abono con la fecha especificada
    // aplicarAbonosAutomaticamente se encargará de calcular cómo se distribuye
    agregarAbono(clienteId, credito.id, parseFloat(valorAbono), descripcionAbono, fechaAbono);

    setMostrarFormularioAbono(false);
    setValorAbono('');
    setDescripcionAbono('');
    setFechaAbono(new Date().toISOString().split('T')[0]);
  };

  const handleEliminarAbono = (abonoId) => {
    if (confirm('¿Estás seguro de eliminar este abono?')) {
      eliminarAbono(clienteId, credito.id, abonoId);
    }
  };

  const handleEditarAbono = (abono) => {
    setAbonoEnEdicion(abono);
  };

  const handleGuardarEdicionAbono = ({ valor, fecha, descripcion, nroCuota }) => {
    if (!abonoEnEdicion) return;
    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert('Por favor ingresa un valor válido para el abono');
      return;
    }

    editarAbono(clienteId, credito.id, abonoEnEdicion.id, {
      valor: valorNumerico,
      fecha,
      descripcion,
      nroCuota: nroCuota ? parseInt(nroCuota, 10) : null
    });

    setAbonoEnEdicion(null);
  };

  const handleAgregarDescuento = () => {
    if (!valorDescuento || parseFloat(valorDescuento) <= 0) {
      alert('Por favor ingresa un valor válido para el descuento');
      return;
    }
    agregarDescuento(clienteId, credito.id, parseFloat(valorDescuento), tipoDescuento, descripcionDescuento);
    setMostrarFormularioDescuento(false);
    setValorDescuento('');
    setTipoDescuento('dias');
    setDescripcionDescuento('');
  };

  const handleEliminarDescuento = (descuentoId) => {
    if (confirm('¿Estás seguro de eliminar este descuento?')) {
      eliminarDescuento(clienteId, credito.id, descuentoId);
    }
  };

  const totalMultasCredito = calcularTotalMultasCredito(credito.cuotas);
  const totalAbonos = (credito.abonos || []).reduce((total, abono) => total + abono.valor, 0);
  const totalDescuentos = (credito.descuentos || []).reduce((total, descuento) => total + descuento.valor, 0);
  // Aplicar abonos automáticamente
  const { cuotasActualizadas } = aplicarAbonosAutomaticamente(credito);

  // Handlers para el nuevo sistema de pagos/multas en grilla
  const handleAbrirPago = (nroCuota) => {
    const cuota = cuotasActualizadas.find(c => c.nroCuota === nroCuota);
    if (!cuota) return;

    const totalMultasCuota = cuota.multas ? cuota.multas.reduce((sum, m) => sum + m.valor, 0) : 0;
    const multasCubiertas = cuota.multasCubiertas || 0;
    const multasPendientes = totalMultasCuota - multasCubiertas;
    const valorBaseCuota = credito.valorCuota || 0;
    const abonoYaAplicado = cuota.abonoAplicado || 0;

    const valorRestante = (valorBaseCuota + multasPendientes) - abonoYaAplicado;

    setCuotaParaPagar({
      nroCuota,
      valorPendiente: valorRestante > 0 ? valorRestante : 0
    });
  };

  const handleConfirmarPago = async ({ valor, fecha, descripcion }) => {
    if (!cuotaParaPagar) return;
    const { nroCuota } = cuotaParaPagar;
    const valorNumerico = parseFloat(valor);

    // Aseguramos que la descripción incluya la cuota para el trackeo correcto
    const descFinal = descripcion
      ? (descripcion.includes(`Cuota #${nroCuota}`) ? descripcion : `${descripcion} (Cuota #${nroCuota})`)
      : `Abono a Cuota #${nroCuota}`;

    // Confirmar que valor es número
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert("Valor inválido");
      return;
    }

    // Siempre agregamos como abono para mantener el historial visual y la lógica de asignación específica
    await agregarAbono(clienteId, credito.id, valorNumerico, descFinal, fecha);

    setCuotaParaPagar(null);
  };

  const handleConfirmarMulta = ({ nroCuota, valor, fecha, motivo }) => {
    // Se agrega la multa. Si el backend soporta fecha, genial. Si no, se agrega con fecha actual.
    // Concatenamos fecha al motivo si se desea persistencia visual simple
    const motivoFinal = fecha ? `${motivo} (${fecha})` : motivo;
    // Asegurar enteros y floats correctos
    agregarMulta(clienteId, credito.id, parseInt(nroCuota, 10), parseFloat(valor), motivoFinal);
    setMostrarModalNuevaMulta(false);
  };

  const todasLasMultas = useMemo(() => {
    const lista = [];
    (credito.cuotas || []).forEach((cuota) => {
      // Buscar la cuota actualizada correspondiente
      const cuotaActualizada = cuotasActualizadas.find(c => c.nroCuota === cuota.nroCuota);
      let multasCubiertas = cuotaActualizada?.multasCubiertas || 0;

      (cuota.multas || []).forEach((multa) => {
        // Verificar si esta multa específica está pagada
        // Lógica: Si la cuota está pagada manual, todas sus multas también.
        // Si no, verificamos si el saldo de "multasCubiertas" alcanza para esta multa en orden secuencial.
        let estaMultaPagada = false;

        if (cuota.pagado) {
          estaMultaPagada = true;
        } else {
          // Si hay saldo suficiente para cubrir esta multa
          if (multasCubiertas >= multa.valor) {
            estaMultaPagada = true;
            multasCubiertas -= multa.valor; // Consumimos el saldo
          } else {
            // El saldo no alcanza o es 0, esta multa queda pendiente (o parcialmente pagada, pero la marcamos pendiente para simplificar UI)
            estaMultaPagada = false;
            // No restamos si no alcanza, o restamos lo que hay?
            // Para "pagada" requerimos valor completo.
            // Si multasCubiertas es 3000 y multa es 5000, no se paga.
            // Y el saldo de 3000 ¿se debe guardar para la siguiente? NO, el waterfall es secuencial.
            // Si no cubrimos esta, asumimos que el saldo se queda ahí (o parcial).
            // Pero para simplificar el estado booleano:
            if (multasCubiertas > 0) {
              multasCubiertas = 0; // Ya usamos el remanente parcial aquí, no sigue a la siguiente
            }
          }
        }

        lista.push({
          id: multa.id,
          valor: multa.valor,
          fecha: multa.fecha,
          motivo: multa.motivo,
          nroCuota: cuota.nroCuota,
          pagada: estaMultaPagada
        });
      });
    });
    return lista.sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
      const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
      return fechaB - fechaA;
    });
  }, [credito.cuotas, cuotasActualizadas]);

  // Calcular progreso considerando cuotas pagadas con abonos
  const progreso = (() => {
    const totalCuotas = credito.cuotas.length;
    let cuotasPagadas = 0;

    cuotasActualizadas.forEach((cuota, index) => {
      // Verificar si está pagada manualmente O si el abono cubre completamente la cuota
      const totalMultasCuota = cuota.multas ? cuota.multas.reduce((sum, m) => sum + m.valor, 0) : 0;
      const multasCubiertas = cuota.multasCubiertas || 0;
      const multasPendientes = totalMultasCuota - multasCubiertas;
      const valorRestante = (credito.valorCuota - (cuota.abonoAplicado || 0)) + multasPendientes;

      const isPaid = cuota.pagado || (valorRestante <= 0 && cuota.abonoAplicado > 0);

      if (isPaid) {
        cuotasPagadas++;
      }
    });

    return {
      cuotasPagadas,
      totalCuotas,
      porcentaje: Math.round((cuotasPagadas / totalCuotas) * 100)
    };
  })();

  // Definición de etiquetas
  const ETIQUETAS = {
    excelente: {
      nombre: 'Excelente',
      descripcion: 'Pagó todo a tiempo',
      color: 'bg-green-100 text-green-800 border-green-300',
      icono: Award
    },
    bueno: {
      nombre: 'Bueno',
      descripcion: 'Completó sin problemas',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icono: Check
    },
    atrasado: {
      nombre: 'Atrasado',
      descripcion: 'Completó con retrasos',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icono: Calendar
    },
    incompleto: {
      nombre: 'Incompleto',
      descripcion: 'No terminó de pagar',
      color: 'bg-red-100 text-red-800 border-red-300',
      icono: AlertCircle
    }
  };

  const handleAsignarEtiqueta = (tipoEtiqueta) => {
    asignarEtiquetaCredito(clienteId, credito.id, tipoEtiqueta);
    setMostrarSelectorEtiqueta(false);
  };

  // Verificar si puede renovar
  // Contar cuotas pagadas (tanto manualmente como con abonos)
  const cuotasPagadas = (() => {
    let contador = 0;
    cuotasActualizadas.forEach((cuota) => {
      // Verificar si está pagada manualmente O si el abono cubre completamente la cuota
      const totalMultasCuota = cuota.multas ? cuota.multas.reduce((sum, m) => sum + m.valor, 0) : 0;
      const multasCubiertas = cuota.multasCubiertas || 0;
      const multasPendientes = totalMultasCuota - multasCubiertas;
      const valorRestante = (credito.valorCuota - (cuota.abonoAplicado || 0)) + multasPendientes;

      const isPaid = cuota.pagado || (valorRestante <= 0 && cuota.abonoAplicado > 0);

      if (isPaid) {
        contador++;
      }
    });
    return contador;
  })();

  const puedeRenovar = (() => {
    if (credito.renovado) return false; // Ya fue renovado
    if (estado === 'finalizado') return false; // Ya está finalizado

    switch (credito.tipo) {
      case 'semanal':
        return cuotasPagadas >= 7;
      case 'quincenal':
        return cuotasPagadas >= 3;
      case 'mensual':
        return cuotasPagadas >= 2;
      default:
        return false;
    }
  })();

  const handleRenovar = (datosRenovacion) => {
    renovarCredito(clienteId, credito.id, datosRenovacion);
    setMostrarFormularioRenovacion(false);
    onClose();
  };

  // Función para imprimir/exportar a PDF
  const handlePrint = useReactToPrint({
    contentRef: formularioRef,
    documentTitle: `credito-${cliente?.nombre?.replace(/\s+/g, '-') || 'cliente'}-${credito.id}-${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Evitar que los títulos queden solos al final de la página */
        h3, h2 {
          page-break-after: avoid;
          break-after: avoid;
        }
        
        /* Mantener secciones juntas */
        .print-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Espaciado entre secciones */
        .print-section {
          margin-bottom: 20px;
        }
        
        /* Evitar que la grilla se corte mal */
        .print-grid-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    `
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] flex flex-col">
        <CreditoDetalleHeader onClose={onClose} onPrint={handlePrint} />

        <div className="px-4 md:px-8 pt-6 md:pt-10 pb-8 space-y-6 overflow-y-auto flex-1">
          {/* Contenedor para imprimir - incluye header, formulario y grilla */}
          <div ref={formularioRef}>
            {/* Header para el PDF (solo visible al imprimir) */}
            <div className="hidden print:flex bg-white px-6 py-4 items-center justify-center border-b-2 border-blue-500 mb-16">
              <div className="flex items-center space-x-4">
                <img
                  src={CowImage}
                  alt="Vaca"
                  className="w-20 h-20 object-contain"
                />
                <h1 className="text-3xl font-bold text-blue-600 uppercase tracking-wide">
                  DISTRICARNES
                </h1>
              </div>
            </div>

            {/* NUEVA CARD HORIZONTAL: DATOS GENERALES */}
            <div className="bg-white border-2 border-blue-500 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y-2 md:divide-y-0 md:divide-x-2 divide-blue-200">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 uppercase mb-1">TIPO DE PAGO</span>
                  <span className="text-lg font-bold text-gray-800 capitalize">{formData.tipoPago}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 uppercase mb-1">FECHA INICIO</span>
                  <span className="text-lg font-bold text-gray-800">
                    {formData.fechaInicio ? formatearFechaCorta(formData.fechaInicio) : '-'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 uppercase mb-1">VALOR PRODUCTO</span>
                  <span className="text-lg font-bold text-gray-800">
                    {formatearMoneda(formData.valorProducto || 0)}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 uppercase mb-1">VALOR CUOTA</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatearMoneda(formData.valorCuota || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD PRINCIPAL: SOLICITANTE/CODEUDOR (Izquierda) y CUOTAS (Derecha) */}
            <div className="bg-white border-2 border-blue-500 rounded-lg p-4 md:p-6 flex flex-col lg:flex-row gap-6">

              {/* COLUMNA IZQUIERDA: DATOS PERSONALES */}
              <div className="lg:w-1/3 flex flex-col gap-8 border-b-2 lg:border-b-0 lg:border-r-2 border-blue-100 pb-6 lg:pb-0 lg:pr-6">
                <div className="space-y-6">
                  <FormularioSolicitante
                    solicitante={formData.solicitante}
                    onChange={(field, value) => handleSolicitanteChange(field, value)}
                  />
                  <div className="border-t-2 border-blue-100 pt-6">
                    <FormularioCodeudor
                      codeudor={formData.codeudor}
                      onChange={(field, value) => handleCodeudorChange(field, value)}
                    />
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: GRILLA DE CUOTAS */}
              <div className="lg:w-2/3">
                <GrillaCuotas
                  formData={formData}
                  credito={credito}
                  cuotasActualizadas={cuotasActualizadas}
                  todasLasMultas={todasLasMultas}
                  obtenerNumeroCuotas={obtenerNumeroCuotas}
                  onPagar={handleAbrirPago}
                  onNuevaMulta={() => setMostrarModalNuevaMulta(true)}
                  onEditDate={handleEditarFecha}
                  onEditarAbono={handleEditarAbono}
                  onEliminarAbono={handleEliminarAbono}
                  onPagarMulta={(multa) => handlePagarMulta(multa)}
                  sinContenedor={true}
                />
              </div>
            </div>
          </div>

          {/* Resumen General del Crédito */}
          <div className="mt-6">
            <ResumenCredito
              credito={credito}
              estado={estado}
              colorEstado={colorEstado}
              ETIQUETAS={ETIQUETAS}
              totalMultasCredito={totalMultasCredito}
              totalAbonos={totalAbonos}
              totalDescuentos={totalDescuentos}
              progreso={progreso}
              cuotasActualizadas={cuotasActualizadas}
              mostrarFormularioAbono={mostrarFormularioAbono}
              valorAbono={valorAbono}
              descripcionAbono={descripcionAbono}
              fechaAbono={fechaAbono}
              puedeRenovar={puedeRenovar}
              onMostrarSelectorEtiqueta={() => setMostrarSelectorEtiqueta(!mostrarSelectorEtiqueta)}
              onMostrarFormularioAbono={() => setMostrarFormularioAbono(true)}
              onValorAbonoChange={(value) => setValorAbono(value)}
              onDescripcionAbonoChange={(value) => setDescripcionAbono(value)}
              onFechaAbonoChange={(value) => setFechaAbono(value)}
              onAgregarAbono={handleAgregarAbono}
              onCancelarAbono={() => {
                setMostrarFormularioAbono(false);
                setValorAbono('');
                setDescripcionAbono('');
                setFechaAbono(new Date().toISOString().split('T')[0]);
              }}
              onMostrarFormularioRenovacion={() => setMostrarFormularioRenovacion(true)}
            />
          </div>

          {/* Notas */}
          <div className="mt-6">
            <ListaNotas
              notas={credito.notas}
              nuevaNota={nuevaNota}
              onNotaChange={(value) => setNuevaNota(value)}
              onAgregarNota={handleAgregarNota}
              onEliminarNota={handleEliminarNota}
            />
          </div>

          {/* Zona de Peligro */}
          <div className="border-t pt-6 mt-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Zona de Peligro
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Eliminar este crédito borrará permanentemente toda la información asociada, incluyendo pagos, multas, abonos y notas. Esta acción no se puede deshacer.
              </p>
              <button
                onClick={handleEliminarCredito}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Eliminar Crédito Permanentemente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales de Pago y Multa */}
      {cuotaParaPagar && (
        <ModalPago
          cuota={cuotaParaPagar}
          onClose={() => setCuotaParaPagar(null)}
          onConfirm={handleConfirmarPago}
        />
      )}

      {mostrarModalNuevaMulta && (
        <ModalMulta
          onClose={() => setMostrarModalNuevaMulta(false)}
          onConfirm={handleConfirmarMulta}
          maxCuotas={obtenerNumeroCuotas(formData.tipoPago)}
        />
      )}

      {/* Modal para editar fecha */}
      {mostrarEditorFecha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
            <EditorFecha
              cuota={cuotasActualizadas.find(c => c.nroCuota === mostrarEditorFecha)}
              credito={credito}
              nuevaFecha={nuevaFecha}
              onFechaChange={setNuevaFecha}
              onGuardar={handleGuardarFecha}
              onCancelar={handleCancelarEdicionFecha}
            />
          </div>
        </div>
      )}

      {/* Modal de Renovación */}
      {mostrarFormularioRenovacion && (
        <RenovacionForm
          creditoAnterior={credito}
          onSubmit={handleRenovar}
          onClose={() => setMostrarFormularioRenovacion(false)}
        />
      )}

      {/* Modal para editar abono (pago) */}
      {abonoEnEdicion && (
        <ModalEditarAbono
          abono={abonoEnEdicion}
          maxCuotas={obtenerNumeroCuotas(formData.tipoPago)}
          onClose={() => setAbonoEnEdicion(null)}
          onConfirm={handleGuardarEdicionAbono}
          onDelete={() => {
            handleEliminarAbono(abonoEnEdicion.id);
            setAbonoEnEdicion(null);
          }}
        />
      )}
    </div>
  );
};

export default CreditoDetalle;

const ModalEditarAbono = ({ abono, maxCuotas, onClose, onConfirm, onDelete }) => {
  const [valor, setValor] = useState(abono.valor || '');
  const [fecha, setFecha] = useState(abono.fecha ? abono.fecha.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState(abono.descripcion || '');

  // Intentar deducir nroCuota si no viene explícito
  const obtenerCuotaInicial = () => {
    if (abono.nroCuota) return abono.nroCuota;
    const match = abono.descripcion ? abono.descripcion.match(/(?:Cuota|cuota)\s*#(\d+)/) : null;
    return match ? parseInt(match[1]) : 1;
  };

  const [nroCuota, setNroCuota] = useState(obtenerCuotaInicial());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valor || parseFloat(valor) <= 0) {
      alert('Ingrese un valor válido');
      return;
    }
    // Actualizar descripción si cambia la cuota y la descripción era genérica
    let descFinal = descripcion;
    if (descFinal.includes('Cuota #')) {
      descFinal = descFinal.replace(/Cuota #\d+/, `Cuota #${nroCuota}`);
    } else if (descFinal.includes('cuota #')) {
      descFinal = descFinal.replace(/cuota #\d+/, `cuota #${nroCuota}`);
    }

    onConfirm({ valor, fecha, descripcion: descFinal, nroCuota });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-bold text-blue-600 mb-4">Editar abono</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Valor del abono</label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full border rounded p-2"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Aplicar a Cuota #</label>
            <select
              value={nroCuota}
              onChange={(e) => setNroCuota(e.target.value)}
              className="w-full border rounded p-2"
            >
              {Array.from({ length: maxCuotas || 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>Cuota #{num}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Ej: Abono cuota #1"
            />
          </div>
          <div className="flex justify-between pt-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  // Confirmación está en handleEliminarAbono, pero aquí cerramos el modal si se borra?
                  // handleEliminarAbono tiene su propio confirm. Si el usuario cancela, no cerramos modal?
                  // Mejor llamar a onDelete y que él maneje.
                  onDelete();
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded flex items-center gap-1"
                title="Eliminar pago"
              >
                <Trash2 className="h-4 w-4" /> Eliminar
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const ModalPago = ({ cuota, onClose, onConfirm }) => {
  const [valor, setValor] = useState(cuota.valorPendiente || '');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valor || valor <= 0) return alert('Ingrese un valor válido');
    onConfirm({ valor, fecha, descripcion });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-bold text-blue-600 mb-4">Pagar Cuota #{cuota.nroCuota}</h3>
        <p className="text-sm text-gray-600 mb-4">
          Pendiente: <span className="font-bold text-red-600">${formatearMoneda(cuota.valorPendiente)}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Valor a pagar</label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full border rounded p-2"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de pago</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Descripción (Opcional)</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Ej: Abono parcial"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
            >
              Confirmar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ModalMulta = ({ onClose, onConfirm, maxCuotas }) => {
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [nroCuota, setNroCuota] = useState(1);
  const [motivo, setMotivo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valor || valor <= 0) return alert('Ingrese un valor válido');
    onConfirm({ valor, fecha, nroCuota, motivo });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
        <h3 className="text-lg font-bold text-red-600 mb-4">Nueva Multa</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Valor Multa</label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full border rounded p-2"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Aplicar a Cuota #</label>
            <select
              value={nroCuota}
              onChange={(e) => setNroCuota(e.target.value)}
              className="w-full border rounded p-2"
            >
              {Array.from({ length: maxCuotas }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>Cuota #{num}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Motivo (Opcional)</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
            >
              Crear Multa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
