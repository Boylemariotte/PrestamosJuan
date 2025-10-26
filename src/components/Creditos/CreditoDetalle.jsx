import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Calendar, DollarSign, AlertCircle, StickyNote, Trash2, Plus, Award, Tag, RefreshCw, Edit2, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import RenovacionForm from './RenovacionForm';
import TarjetaControlPagos from './TarjetaControlPagos';
import CowImage from '../../Icon/Cow.png';
import { 
  determinarEstadoCredito, 
  getColorEstado, 
  formatearMoneda,
  formatearFechaCorta,
  formatearFecha,
  calcularDiasMora,
  calcularTotalMultasCuota,
  calcularTotalMultasCredito,
  calcularValorTotalCuota,
  aplicarAbonosAutomaticamente
} from '../../utils/creditCalculations';
import { useApp } from '../../context/AppContext';

const CreditoDetalle = ({ credito: creditoInicial, clienteId, cliente, onClose }) => {
  const { registrarPago, cancelarPago, editarFechaCuota, agregarNota, eliminarNota, agregarMulta, eliminarMulta, agregarAbono, eliminarAbono, agregarDescuento, eliminarDescuento, asignarEtiquetaCredito, renovarCredito, eliminarCredito, obtenerCredito } = useApp();
  
  // Obtener el crédito actualizado del contexto
  const credito = obtenerCredito(clienteId, creditoInicial.id) || creditoInicial;
  
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
  const [mostrarFormularioDescuento, setMostrarFormularioDescuento] = useState(false);
  const [valorDescuento, setValorDescuento] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState('dias');
  const [descripcionDescuento, setDescripcionDescuento] = useState('');
  const [mostrarSelectorEtiqueta, setMostrarSelectorEtiqueta] = useState(false);
  const [mostrarFormularioRenovacion, setMostrarFormularioRenovacion] = useState(false);
  const [mostrarEditorFecha, setMostrarEditorFecha] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  
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

  const handlePago = (nroCuota, pagado) => {
    if (pagado) {
      cancelarPago(clienteId, credito.id, nroCuota);
    } else {
      registrarPago(clienteId, credito.id, nroCuota);
    }
  };

  const handleEditarFecha = (nroCuota, fechaActual) => {
    setMostrarEditorFecha(nroCuota);
    setNuevaFecha(fechaActual);
  };

  const handleGuardarFecha = () => {
    if (nuevaFecha && mostrarEditorFecha) {
      editarFechaCuota(clienteId, credito.id, mostrarEditorFecha, nuevaFecha);
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

  const handleEliminarCredito = () => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar este crédito?\n\n` +
      `Crédito ID: ${credito.id}\n` +
      `Monto: ${formatearMoneda(credito.monto)}\n` +
      `Estado: ${estado}\n\n` +
      `Esta acción no se puede deshacer.`
    );
    
    if (confirmacion) {
      eliminarCredito(clienteId, credito.id);
      onClose();
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

  const handleAgregarAbono = () => {
    if (!valorAbono || parseFloat(valorAbono) <= 0) {
      alert('Por favor ingresa un valor válido para el abono');
      return;
    }
    
    // Simplemente agregar el abono
    // aplicarAbonosAutomaticamente se encargará de calcular cómo se distribuye
    agregarAbono(clienteId, credito.id, parseFloat(valorAbono), descripcionAbono);
    
    setMostrarFormularioAbono(false);
    setValorAbono('');
    setDescripcionAbono('');
  };

  const handleEliminarAbono = (abonoId) => {
    if (confirm('¿Estás seguro de eliminar este abono?')) {
      eliminarAbono(clienteId, credito.id, abonoId);
    }
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
  const cuotasPagadas = credito.cuotas.filter(c => c.pagado).length;
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
        {/* Header con logo, título y botones */}
        <div className="bg-white px-6 py-4 flex items-center justify-between rounded-t-xl border-b-2 border-blue-500">
          <div className="flex-1 flex justify-center">
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
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center"
              title="Imprimir / Guardar como PDF"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-6 overflow-y-auto flex-1">
          {/* Contenedor para imprimir - incluye header, formulario y grilla */}
          <div ref={formularioRef}>
            {/* Header para el PDF (solo visible al imprimir) */}
            <div className="hidden print:flex bg-white px-6 py-4 items-center justify-center border-b-2 border-blue-500 mb-6">
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

            {/* Formulario principal */}
            <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
            <div className="space-y-8">
              {/* Primera fila: Tipo de pago y Fecha inicio */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tipo de pago - Solo lectura */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-blue-600">TIPO DE PAGO</h3>
                  <div className="flex items-center">
                    <div className="border-b-2 border-blue-600 h-8 px-2 flex items-center bg-gray-50">
                      <span className="text-blue-600 font-bold text-lg capitalize">
                        {formData.tipoPago}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fecha inicio - Solo lectura */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-blue-600">FECHA INICIO</h3>
                  <div className="flex items-center">
                    <div className="border-b-2 border-blue-600 h-8 px-2 flex items-center bg-gray-50">
                      <span className="text-blue-600 font-bold text-lg">
                        {formData.fechaInicio ? formatearFechaCorta(formData.fechaInicio) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Segunda fila: Valores - Solo lectura */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-lg font-bold text-blue-600 mb-2">VALOR PRODUCTO</label>
                  <div className="flex items-center">
                    <span className="text-blue-600 font-bold text-xl mr-2">$</span>
                    <div className="flex-1 border-b-2 border-blue-600 h-8 bg-gray-50 flex items-center px-2">
                      <span className="text-blue-600 font-bold text-lg">
                        {formatearMoneda(formData.valorProducto || 0).replace('$', '').replace(/,/g, '')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-blue-600 mb-2">VALOR CUOTA</label>
                  <div className="flex items-center">
                    <span className="text-blue-600 font-bold text-xl mr-2">$</span>
                    <div className="flex-1 border-b-2 border-blue-600 h-8 bg-gray-50 flex items-center px-2">
                      <span className="text-blue-600 font-bold text-lg">
                        {formatearMoneda(formData.valorCuota || 0).replace('$', '').replace(/,/g, '')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tercera fila: SOLICITANTE y DATOS CODEUDOR */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SOLICITANTE */}
                <div className="space-y-4 print-section">
                  <h3 className="text-xl font-bold text-blue-600 text-center">SOLICITANTE</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">Nombre:</label>
                      <input
                        type="text"
                        value={formData.solicitante.nombre}
                        onChange={(e) => handleSolicitanteChange('nombre', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese el nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">C.C.:</label>
                      <input
                        type="text"
                        value={formData.solicitante.cedula}
                        onChange={(e) => handleSolicitanteChange('cedula', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese la cédula"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">Dirección Casa:</label>
                      <input
                        type="text"
                        value={formData.solicitante.direccionCasa}
                        onChange={(e) => handleSolicitanteChange('direccionCasa', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese la dirección de casa"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">Dirección Trabajo:</label>
                      <input
                        type="text"
                        value={formData.solicitante.direccionTrabajo}
                        onChange={(e) => handleSolicitanteChange('direccionTrabajo', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese la dirección de trabajo"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">Teléfono:</label>
                      <input
                        type="text"
                        value={formData.solicitante.telefono}
                        onChange={(e) => handleSolicitanteChange('telefono', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese el teléfono"
                      />
                    </div>
                  </div>
                </div>

                {/* DATOS CODEUDOR */}
                <div className="space-y-4 print-section">
                  <h3 className="text-xl font-bold text-blue-600 text-center">DATOS CODEUDOR</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">Nombre:</label>
                      <input
                        type="text"
                        value={formData.codeudor.nombre}
                        onChange={(e) => handleCodeudorChange('nombre', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese el nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">C.C.:</label>
                      <input
                        type="text"
                        value={formData.codeudor.cedula}
                        onChange={(e) => handleCodeudorChange('cedula', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese la cédula"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">Dirección Casa:</label>
                      <input
                        type="text"
                        value={formData.codeudor.direccionCasa}
                        onChange={(e) => handleCodeudorChange('direccionCasa', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese la dirección de casa"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">Dirección Trabajo:</label>
                      <input
                        type="text"
                        value={formData.codeudor.direccionTrabajo}
                        onChange={(e) => handleCodeudorChange('direccionTrabajo', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese la dirección de trabajo"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-600 font-medium mb-1">Teléfono:</label>
                      <input
                        type="text"
                        value={formData.codeudor.telefono}
                        onChange={(e) => handleCodeudorChange('telefono', e.target.value)}
                        className="w-full border-b-2 border-blue-600 h-8 bg-transparent text-blue-600 font-medium focus:outline-none focus:border-blue-800"
                        placeholder="Ingrese el teléfono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Control de Pagos - Diseño de la imagen */}
              <div className="mt-8 print-section">
                <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
                  {/* VALOR CUOTA */}
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

                  {/* Grilla de cuotas */}
                  <div className={`grid gap-4 mx-auto ${
                    obtenerNumeroCuotas(formData.tipoPago) === 60 
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 max-w-7xl' 
                      : obtenerNumeroCuotas(formData.tipoPago) === 10
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 max-w-6xl'
                      : obtenerNumeroCuotas(formData.tipoPago) === 5
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-5xl'
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl'
                  }`}>
                    {Array.from({ length: obtenerNumeroCuotas(formData.tipoPago) }, (_, index) => {
                      const nroCuota = index + 1;
                      const cuota = cuotasActualizadas[index];
                      
                      // Verificar si está pagada manualmente O si el abono cubre completamente la cuota
                      const abonoCuota = cuota?.abonoAplicado || 0;
                      const totalMultasCuota = cuota?.multas ? calcularTotalMultasCuota(cuota) : 0;
                      const multasCubiertas = cuota?.multasCubiertas || 0;
                      const multasPendientes = totalMultasCuota - multasCubiertas;
                      const valorRestante = (formData.valorCuota || 0) - abonoCuota + multasPendientes;
                      
                      const isPaid = cuota?.pagado || (valorRestante <= 0 && abonoCuota > 0);

                      // Calcular qué abonos individuales se aplicaron a esta cuota (para mostrar el desglose)
                      const abonosIndividuales = [];
                      if (credito.abonos && credito.abonos.length > 0 && cuota) {
                        credito.abonos.forEach((abono, abonoIdx) => {
                          // Calcular abonos anteriores a este
                          let abonosAnteriores = 0;
                          for (let i = 0; i < abonoIdx; i++) {
                            abonosAnteriores += credito.abonos[i].valor;
                          }
                          
                          let saldoAbono = abono.valor;
                          let saldoPrevio = abonosAnteriores;
                          
                          for (let c of credito.cuotas) {
                            if (saldoAbono <= 0) break;
                            if (c.pagado) continue;
                            
                            const multasC = c.multas && c.multas.length > 0 
                              ? c.multas.reduce((sum, m) => sum + m.valor, 0) 
                              : 0;
                            const necesario = multasC + credito.valorCuota;
                            
                            if (saldoPrevio >= necesario) {
                              saldoPrevio -= necesario;
                              continue;
                            }
                            
                            const falta = necesario - saldoPrevio;
                            const aplicado = Math.min(saldoAbono, falta);
                            
                            if (aplicado > 0 && c.nroCuota === cuota.nroCuota) {
                              abonosIndividuales.push({
                                fecha: abono.fecha,
                                valor: aplicado
                              });
                            }
                            
                            saldoAbono -= aplicado;
                            saldoPrevio = 0;
                          }
                        });
                      }
                      
                      return (
                        <div key={nroCuota} className="border-2 border-blue-600 rounded-lg p-3 flex flex-col min-h-36 w-full print-grid-item">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-blue-600 font-bold text-xs">#{nroCuota}</span>
                            {isPaid && (
                              <Check className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <div className="border-b border-blue-600 h-4 flex items-center justify-center mb-1">
                            <span className="text-blue-600 text-xs">
                              {cuota ? formatearFechaCorta(cuota.fechaProgramada) : ''}
                            </span>
                          </div>
                          
                          {/* Información de abonos y multas */}
                          <div className="flex-1 flex flex-col justify-center text-center space-y-1 py-2">
                            {(() => {
                              // Usar los valores ya calculados arriba
                              const valorRestanteDisplay = isPaid ? 0 : valorRestante;
                              
                              return (
                                <>
                                  {/* Valor a pagar (restante después de abonos + multas pendientes o 0 si está pagada) */}
                                  <div className="text-blue-600 font-bold text-lg">
                                    ${formatearMoneda(valorRestanteDisplay).replace('$', '').replace(/,/g, '')}
                                  </div>
                                  
                                  {/* Abonos aplicados a multas */}
                                  {multasCubiertas > 0 && !isPaid && (
                                    <div className="text-green-600 text-xs font-medium">
                                      -Abono a multa: ${formatearMoneda(multasCubiertas).replace('$', '').replace(/,/g, '')}
                                    </div>
                                  )}
                                  
                                  {/* Abonos aplicados a la cuota - Desglose individual */}
                                  {!isPaid && abonosIndividuales.length > 0 && (
                                    <div className="space-y-0.5">
                                      {abonosIndividuales.map((abono, idx) => {
                                        const [año, mes, dia] = abono.fecha.split('T')[0].split('-');
                                        return (
                                          <div key={idx} className="text-green-600 text-[10px] font-medium leading-tight">
                                            -Abono: ${formatearMoneda(abono.valor).replace('$', '').replace(/,/g, '')} ({dia}/{mes})
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {/* Multas pendientes */}
                                  {multasPendientes > 0 && !isPaid && (
                                    <div className="text-red-600 text-xs font-medium">
                                      +Multa: ${formatearMoneda(multasPendientes).replace('$', '').replace(/,/g, '')}
                                      {cuota.multas && cuota.multas.length > 0 && (
                                        <div className="text-xs text-red-500 mt-0.5">
                                          {cuota.multas[0].motivo || 'Mora'}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Mostrar abonos cuando está pagada */}
                                  {isPaid && abonosIndividuales.length > 0 && (
                                    <div className="space-y-0.5">
                                      {abonosIndividuales.map((abono, idx) => {
                                        const [año, mes, dia] = abono.fecha.split('T')[0].split('-');
                                        return (
                                          <div key={idx} className="text-green-600 text-[10px] font-medium leading-tight">
                                            -Abono: ${formatearMoneda(abono.valor).replace('$', '').replace(/,/g, '')} ({dia}/{mes})
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          
                          <div className="mt-auto pt-2">
                            <div className={`w-full py-2 px-2 text-sm font-bold text-center rounded ${
                              isPaid 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isPaid ? '✓ Pagado' : 'Pendiente'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
          </div>
          {/* Fin del contenedor para imprimir */}

          {/* Información adicional del crédito (mantener funcionalidad existente) */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorEstado}`}>
                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </span>
                  
                  {/* Etiqueta actual */}
                  {credito.etiqueta && ETIQUETAS[credito.etiqueta] && (
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium border-2 flex items-center gap-1 ${ETIQUETAS[credito.etiqueta].color}`}>
                      {React.createElement(ETIQUETAS[credito.etiqueta].icono, { className: 'h-4 w-4' })}
                      {ETIQUETAS[credito.etiqueta].nombre}
                    </span>
                  )}
                  
                  {/* Botón para asignar etiqueta (solo si el crédito está finalizado) */}
                  {estado === 'finalizado' && (
                    <button
                      onClick={() => setMostrarSelectorEtiqueta(!mostrarSelectorEtiqueta)}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-300 flex items-center gap-1 transition-colors"
                      title="Asignar etiqueta"
                    >
                      <Tag className="h-4 w-4" />
                      {credito.etiqueta ? 'Cambiar' : 'Etiquetar'}
                    </button>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Monto del crédito</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearMoneda(credito.monto)}
                  </p>
                </div>

                {credito.papeleria && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 -mx-2">
                    <p className="text-xs text-orange-600 font-medium">Descuento de papelería</p>
                    <p className="text-lg font-bold text-orange-700">
                      - {formatearMoneda(credito.papeleria)}
                    </p>
                  </div>
                )}

                {credito.montoEntregado && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 -mx-2">
                    <p className="text-xs text-green-600 font-medium">Monto entregado al cliente</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatearMoneda(credito.montoEntregado)}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500">Total a pagar</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatearMoneda(credito.totalAPagar)}
                  </p>
                </div>

                {totalDescuentos > 0 && (
                  <div>
                    <p className="text-sm text-green-600">Total descuentos</p>
                    <p className="text-xl font-bold text-green-600">
                      - {formatearMoneda(totalDescuentos)}
                    </p>
                  </div>
                )}

                {totalAbonos > 0 && (
                  <div>
                    <p className="text-sm text-blue-600">Total abonos</p>
                    <p className="text-xl font-bold text-blue-600">
                      - {formatearMoneda(totalAbonos)}
                    </p>
                  </div>
                )}

                {totalMultasCredito > 0 && (
                  <div>
                    <p className="text-sm text-red-600">Total multas/recargos</p>
                    <p className="text-xl font-bold text-red-600">
                      + {formatearMoneda(totalMultasCredito)}
                    </p>
                  </div>
                )}

                {(totalMultasCredito > 0 || totalAbonos > 0 || totalDescuentos > 0 || progreso.cuotasPagadas > 0) && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500">Saldo pendiente</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(() => {
                        // Calcular cuánto se ha pagado realmente por cada cuota pagada
                        let totalPagadoReal = 0;
                        
                        credito.cuotas.forEach(cuota => {
                          if (cuota.pagado) {
                            // Para cada cuota pagada, calcular cuánto debía (cuota + multas - abonos)
                            const valorCuota = credito.valorCuota;
                            const multasCuota = cuota.multas && cuota.multas.length > 0
                              ? cuota.multas.reduce((sum, m) => sum + m.valor, 0)
                              : 0;
                            
                            // Obtener abonos aplicados a esta cuota
                            const cuotaActualizada = cuotasActualizadas.find(c => c.nroCuota === cuota.nroCuota);
                            const abonoAplicado = cuotaActualizada?.abonoAplicado || 0;
                            const multasCubiertas = cuotaActualizada?.multasCubiertas || 0;
                            
                            // Lo que se pagó realmente = (cuota + multas) - (abonos a cuota + abonos a multas)
                            // Pero los abonos ya están restados del total, así que solo sumamos cuota + multas
                            totalPagadoReal += valorCuota + multasCuota;
                          }
                        });
                        
                        // Calcular abonos aplicados a cuotas pendientes (no pagadas)
                        let abonosEnCuotasPendientes = 0;
                        credito.cuotas.forEach(cuota => {
                          if (!cuota.pagado) {
                            const cuotaActualizada = cuotasActualizadas.find(c => c.nroCuota === cuota.nroCuota);
                            if (cuotaActualizada) {
                              abonosEnCuotasPendientes += (cuotaActualizada.abonoAplicado || 0);
                              abonosEnCuotasPendientes += (cuotaActualizada.multasCubiertas || 0);
                            }
                          }
                        });
                        
                        // Saldo = Total a pagar + Multas - Descuentos - Total pagado real - Abonos en cuotas pendientes
                        const saldoPendiente = credito.totalAPagar + totalMultasCredito - totalDescuentos - totalPagadoReal - abonosEnCuotasPendientes;
                        return formatearMoneda(Math.max(0, saldoPendiente));
                      })()}
                    </p>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => setMostrarFormularioAbono(true)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Abono
                  </button>
                  
                  {/* Formulario de Abonos - Justo después del botón */}
                  {mostrarFormularioAbono && (
                    <div className="mt-4">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Agregar Abono al Crédito</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="label">Valor del abono *</label>
                            <input
                              type="number"
                              value={valorAbono}
                              onChange={(e) => setValorAbono(e.target.value)}
                              placeholder="Ej: 50000"
                              className="input-field"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="label">Descripción (opcional)</label>
                            <input
                              type="text"
                              value={descripcionAbono}
                              onChange={(e) => setDescripcionAbono(e.target.value)}
                              placeholder="Ej: Pago parcial"
                              className="input-field"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-3">
                          <button
                            onClick={() => {
                              setMostrarFormularioAbono(false);
                              setValorAbono('');
                              setDescripcionAbono('');
                            }}
                            className="btn-secondary"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleAgregarAbono}
                            className="btn-primary"
                          >
                            Agregar Abono
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Botón de Renovación */}
                  {puedeRenovar && (
                    <button
                      onClick={() => setMostrarFormularioRenovacion(true)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center shadow-lg"
                    >
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Renovar Crédito
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tipo de pago:</span>
                  <span className="text-sm font-medium capitalize">{credito.tipo}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Número de cuotas:</span>
                  <span className="text-sm font-medium">{credito.numCuotas}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor por cuota:</span>
                  <span className="text-sm font-medium">{formatearMoneda(credito.valorCuota)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fecha de inicio:</span>
                  <span className="text-sm font-medium">{formatearFechaCorta(credito.fechaInicio)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Interés aplicado:</span>
                  <span className="text-sm font-medium">20% mensual</span>
                </div>
              </div>
            </div>

            {/* Selector de Etiquetas */}
            {mostrarSelectorEtiqueta && estado === 'finalizado' && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  Asignar Etiqueta de Desempeño
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Selecciona una etiqueta para clasificar el comportamiento de pago del cliente:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(ETIQUETAS).map(([key, etiqueta]) => (
                    <button
                      key={key}
                      onClick={() => handleAsignarEtiqueta(key)}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${etiqueta.color} ${credito.etiqueta === key ? 'ring-4 ring-purple-400' : ''}`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {React.createElement(etiqueta.icono, { className: 'h-8 w-8' })}
                      </div>
                      <h5 className="font-bold text-center mb-1">{etiqueta.nombre}</h5>
                      <p className="text-xs text-center opacity-80">{etiqueta.descripcion}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setMostrarSelectorEtiqueta(false)}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Progreso */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Progreso del crédito</span>
                <span className="text-sm font-bold text-gray-900">
                  {progreso.cuotasPagadas}/{progreso.totalCuotas} cuotas pagadas
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    estado === 'finalizado'
                      ? 'bg-blue-500'
                      : estado === 'mora'
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${progreso.porcentaje}%` }}
                />
              </div>
              <div className="text-right text-sm text-gray-600 mt-2">
                {progreso.porcentaje}% completado
              </div>
            </div>


            {/* Cuotas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Cuotas</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cuotasActualizadas.map((cuota) => {
                  // Calcular si la cuota está completamente pagada (manual o con abono)
                  const totalMultas = calcularTotalMultasCuota(cuota);
                  const multasPendientes = totalMultas - (cuota.multasCubiertas || 0);
                  const valorPendiente = (credito.valorCuota - (cuota.abonoAplicado || 0)) + multasPendientes;
                  const isPaid = cuota.pagado || (valorPendiente <= 0 && cuota.abonoAplicado > 0);
                  
                  const diasMora = !isPaid ? calcularDiasMora(cuota.fechaProgramada) : 0;
                  const enMora = diasMora > 0;
                  const valorTotal = calcularValorTotalCuota(credito.valorCuota, cuota);

                  return (
                    <div key={cuota.nroCuota} className="space-y-2">
                      <div
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          isPaid
                            ? 'bg-green-50 border-green-200'
                            : enMora
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                            isPaid
                              ? 'bg-green-500 text-white'
                              : enMora
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {isPaid ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <span className="font-semibold">{cuota.nroCuota}</span>
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              Cuota #{cuota.nroCuota}
                            </p>
                            <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatearFechaCorta(cuota.fechaProgramada)}
                              </span>
                              {isPaid && cuota.fechaPago && (
                                <span className="text-green-600">
                                  Pagado: {formatearFechaCorta(cuota.fechaPago)}
                                </span>
                              )}
                              {enMora && (
                                <span className="flex items-center text-red-600 font-medium">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  {diasMora} día{diasMora !== 1 ? 's' : ''} de mora
                                </span>
                              )}
                            </div>
                            
                            {/* Desglose de valores */}
                            <div className="mt-2 text-sm space-y-1">
                              <div>
                                <span className="text-gray-600">Valor cuota: </span>
                                <span className="font-medium">{formatearMoneda(credito.valorCuota)}</span>
                              </div>
                              
                              {cuota.abonoAplicado > 0 && (
                                <div>
                                  <span className="text-blue-600 font-semibold">
                                    - Abono aplicado: {formatearMoneda(cuota.abonoAplicado)}
                                  </span>
                                </div>
                              )}
                              
                              {totalMultas > 0 && (
                                <div>
                                  <span className="text-red-600 font-semibold">
                                    + Multas: {formatearMoneda(totalMultas)}
                                  </span>
                                  {cuota.multasCubiertas > 0 && (
                                    <span className="text-blue-600 font-semibold ml-2">
                                      (- {formatearMoneda(cuota.multasCubiertas)} cubierto)
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {!isPaid && valorPendiente < credito.valorCuota && (
                                <div className="pt-1 border-t">
                                  <span className="text-gray-900 font-bold">
                                    Pendiente: {formatearMoneda(valorPendiente)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!isPaid && (
                            <>
                              <button
                                onClick={() => handleEditarFecha(cuota.nroCuota, cuota.fechaProgramada)}
                                className="px-3 py-2 rounded-lg font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors flex items-center"
                                title="Cambiar fecha de vencimiento"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Fecha
                              </button>
                              <button
                                onClick={() => setMostrarFormularioMulta(cuota.nroCuota)}
                                className="px-3 py-2 rounded-lg font-medium bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors flex items-center"
                                title="Agregar multa/recargo"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Multa
                              </button>
                            </>
                          )}
                          <div className="text-right">
                            {isPaid ? (
                              <span className="font-semibold text-green-600 block">
                                ✓ Pagado
                              </span>
                            ) : (
                              <>
                                <span className="font-semibold text-gray-900 block">
                                  {formatearMoneda(valorPendiente)}
                                </span>
                                {/* Advertencia si hay abono parcial */}
                                {cuota.abonoAplicado > 0 && valorPendiente > 0 && (
                                  <span className="text-xs text-orange-600 block mt-1">
                                    Abono parcial
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Verificar si hay abonos (a cuota o multas) para deshabilitar el botón */}
                          {!isPaid && (cuota.abonoAplicado > 0 || cuota.multasCubiertas > 0) && valorPendiente > 0 ? (
                            <div className="flex flex-col items-end">
                              <button
                                disabled
                                className="px-4 py-2 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                                title="Debes completar el pago con abonos"
                              >
                                Marcar pagado
                              </button>
                              <span className="text-xs text-orange-600 mt-1 text-right max-w-[150px]">
                                Completa con abonos
                              </span>
                            </div>
                          ) : isPaid && (cuota.abonoAplicado > 0 || cuota.multasCubiertas > 0) ? (
                            <div className="flex flex-col items-end">
                              <button
                                disabled
                                className="px-4 py-2 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                                title="Elimina primero los abonos asociados"
                              >
                                Cancelar
                              </button>
                              <span className="text-xs text-orange-600 mt-1 text-right max-w-[150px]">
                                Elimina primero el abono
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handlePago(cuota.nroCuota, cuota.pagado)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                isPaid
                                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                  : 'bg-sky-600 hover:bg-sky-700 text-white'
                              }`}
                            >
                              {isPaid ? 'Cancelar' : 'Marcar pagado'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Modal para editar fecha */}
                      {mostrarEditorFecha === cuota.nroCuota && (
                        <div className="ml-14 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                            Cambiar Fecha de Vencimiento
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="label">Fecha actual</label>
                              <input
                                type="text"
                                value={formatearFecha(cuota.fechaProgramada)}
                                disabled
                                className="input-field bg-gray-100"
                              />
                            </div>
                            <div>
                              <label className="label">Nueva fecha *</label>
                              <input
                                type="date"
                                value={nuevaFecha}
                                onChange={(e) => setNuevaFecha(e.target.value)}
                                className="input-field"
                                required
                              />
                            </div>
                            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                              <p className="text-sm text-blue-800">
                                <strong>Nota:</strong> Al cambiar esta fecha, todas las cuotas posteriores se ajustarán automáticamente manteniendo el intervalo de {credito.tipo === 'semanal' ? '7' : '15'} días.
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={handleCancelarEdicionFecha}
                              className="btn-secondary"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleGuardarFecha}
                              className="btn-primary"
                              disabled={!nuevaFecha}
                            >
                              Guardar Fecha
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Formulario para agregar multa */}
                      {mostrarFormularioMulta === cuota.nroCuota && (
                        <div className="ml-14 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Agregar Multa/Recargo</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="label">Valor de la multa *</label>
                              <input
                                type="number"
                                value={valorMulta}
                                onChange={(e) => setValorMulta(e.target.value)}
                                placeholder="Ej: 10000"
                                className="input-field"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="label">Motivo (opcional)</label>
                              <input
                                type="text"
                                value={motivoMulta}
                                onChange={(e) => setMotivoMulta(e.target.value)}
                                placeholder="Ej: Recargo por mora"
                                className="input-field"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-3">
                            <button
                              onClick={() => {
                                setMostrarFormularioMulta(null);
                                setValorMulta('');
                                setMotivoMulta('');
                              }}
                              className="btn-secondary"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleAgregarMulta(cuota.nroCuota)}
                              className="btn-primary"
                            >
                              Agregar Multa
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Lista de multas existentes */}
                      {cuota.multas && cuota.multas.length > 0 && (
                        <div className="ml-14 space-y-2">
                          {cuota.multas.map((multa) => (
                            <div
                              key={multa.id}
                              className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="h-4 w-4 text-orange-600" />
                                  <span className="font-semibold text-orange-900">
                                    {formatearMoneda(multa.valor)}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    - {multa.motivo}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Aplicada el {formatearFechaCorta(multa.fecha.split('T')[0])}
                                </p>
                              </div>
                              <button
                                onClick={() => handleEliminarMulta(cuota.nroCuota, multa.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Eliminar multa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


            {/* Formulario de Descuentos */}
            {mostrarFormularioDescuento && (
              <div className="border-t pt-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Agregar Descuento Manual</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="label">Tipo de descuento *</label>
                      <select
                        value={tipoDescuento}
                        onChange={(e) => setTipoDescuento(e.target.value)}
                        className="input-field"
                      >
                        <option value="dias">Descuento por días</option>
                        <option value="papeleria">Descuento por papelería</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Valor del descuento *</label>
                      <input
                        type="number"
                        value={valorDescuento}
                        onChange={(e) => setValorDescuento(e.target.value)}
                        placeholder="Ej: 10000"
                        className="input-field"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="label">Descripción (opcional)</label>
                      <input
                        type="text"
                        value={descripcionDescuento}
                        onChange={(e) => setDescripcionDescuento(e.target.value)}
                        placeholder="Ej: Fecha próxima"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => {
                        setMostrarFormularioDescuento(false);
                        setValorDescuento('');
                        setTipoDescuento('dias');
                        setDescripcionDescuento('');
                      }}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAgregarDescuento}
                      className="btn-primary bg-green-600 hover:bg-green-700"
                    >
                      Agregar Descuento
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Descuentos */}
            {credito.descuentos && credito.descuentos.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Descuentos Aplicados
                </h3>
                <div className="space-y-2">
                  {credito.descuentos.map((descuento) => (
                    <div
                      key={descuento.id}
                      className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-bold text-green-900 text-lg">
                            {formatearMoneda(descuento.valor)}
                          </span>
                          <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-medium rounded">
                            {descuento.tipo === 'dias' ? 'Por días' : 'Papelería'}
                          </span>
                          <span className="text-sm text-gray-600">
                            - {descuento.descripcion}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-7">
                          Aplicado el {formatearFechaCorta(descuento.fecha.split('T')[0])}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEliminarDescuento(descuento.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar descuento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Abonos */}
            {credito.abonos && credito.abonos.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                  Abonos Realizados
                </h3>
                <div className="space-y-2">
                  {credito.abonos.map((abono, abonoIndex) => {
                    // Calcular a qué cuota(s) se aplicó este abono
                    const cuotasAfectadas = [];
                    let saldoAbonoTemp = 0;
                    
                    // Sumar todos los abonos hasta este (inclusive)
                    for (let i = 0; i <= abonoIndex; i++) {
                      saldoAbonoTemp += credito.abonos[i].valor;
                    }
                    
                    // Restar los abonos anteriores
                    let abonosAnteriores = 0;
                    for (let i = 0; i < abonoIndex; i++) {
                      abonosAnteriores += credito.abonos[i].valor;
                    }
                    
                    // Simular aplicación de abonos para encontrar qué cuotas cubre este abono específico
                    let saldoDeEsteAbono = abono.valor; // Solo el valor de ESTE abono
                    let saldoAnterioresTemp = abonosAnteriores;
                    
                    for (let cuota of credito.cuotas) {
                      if (saldoDeEsteAbono <= 0) break;
                      
                      // Si la cuota está pagada manualmente (con el botón), saltarla
                      if (cuota.pagado) {
                        continue; // Saltar cuotas pagadas con el botón "Marcar pagado"
                      }
                      
                      const totalMultasCuota = cuota.multas && cuota.multas.length > 0 
                        ? cuota.multas.reduce((sum, m) => sum + m.valor, 0) 
                        : 0;
                      const totalNecesario = totalMultasCuota + credito.valorCuota;
                      
                      // Si los abonos anteriores ya cubrieron esta cuota completamente, continuar
                      if (saldoAnterioresTemp >= totalNecesario) {
                        saldoAnterioresTemp -= totalNecesario;
                        continue;
                      }
                      
                      // Calcular cuánto falta en esta cuota después de abonos anteriores
                      const faltabaEnEstaCuota = totalNecesario - saldoAnterioresTemp;
                      
                      // Este abono cubre (parcial o totalmente) lo que falta en esta cuota
                      const montoAplicadoAEstaCuota = Math.min(saldoDeEsteAbono, faltabaEnEstaCuota);
                      
                      if (montoAplicadoAEstaCuota > 0) {
                        cuotasAfectadas.push({
                          nroCuota: cuota.nroCuota,
                          monto: montoAplicadoAEstaCuota,
                          completa: montoAplicadoAEstaCuota >= faltabaEnEstaCuota
                        });
                        
                        saldoDeEsteAbono -= montoAplicadoAEstaCuota;
                        saldoAnterioresTemp = 0; // Ya no hay saldo anterior en esta cuota
                      }
                    }
                    
                    return (
                      <div
                        key={abono.id}
                        className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                            <span className="font-bold text-blue-900 text-lg">
                              {formatearMoneda(abono.valor)}
                            </span>
                            <span className="text-sm text-gray-600">
                              - {abono.descripcion}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-7">
                            Registrado el {formatearFechaCorta(abono.fecha.split('T')[0])}
                          </p>
                          {/* Mostrar a qué cuota(s) se aplicó */}
                          {cuotasAfectadas.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1 ml-7">
                              Aplicado a: {cuotasAfectadas.map(c => 
                                `Cuota #${c.nroCuota} (${formatearMoneda(c.monto)}${c.completa ? ' - completa' : ' - parcial'})`
                              ).join(', ')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleEliminarAbono(abono.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Eliminar abono"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notas */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <StickyNote className="h-5 w-5 mr-2" />
                Notas y Comentarios
              </h3>

              <form onSubmit={handleAgregarNota} className="mb-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Agregar una nota..."
                    className="input-field flex-1"
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!nuevaNota.trim()}
                  >
                    Agregar
                  </button>
                </div>
              </form>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {credito.notas && credito.notas.length > 0 ? (
                  credito.notas.map((nota) => (
                    <div
                      key={nota.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-900">{nota.texto}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatearFecha(nota.fecha.split('T')[0])}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEliminarNota(nota.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay notas registradas
                  </p>
                )}
              </div>
            </div>

            {/* Botón de eliminar crédito - Al final */}
            <div className="border-t pt-6">
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
      </div>

      {/* Modal de Renovación */}
      {mostrarFormularioRenovacion && (
        <RenovacionForm
          creditoAnterior={credito}
          onSubmit={handleRenovar}
          onClose={() => setMostrarFormularioRenovacion(false)}
        />
      )}
    </div>
  );
};

export default CreditoDetalle;