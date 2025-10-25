import React, { useState } from 'react';
import { X, Check, Calendar, DollarSign, AlertCircle, StickyNote, Trash2, Plus, Award, Tag, RefreshCw, Edit2 } from 'lucide-react';
import RenovacionForm from './RenovacionForm';
import TarjetaControlPagos from './TarjetaControlPagos';
import { 
  determinarEstadoCredito, 
  getColorEstado, 
  calcularProgreso,
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
import { useAuth } from '../../context/AuthContext';

const CreditoDetalle = ({ credito: creditoInicial, clienteId, onClose }) => {
  const { registrarPago, cancelarPago, editarFechaCuota, agregarNota, eliminarNota, agregarMulta, eliminarMulta, agregarAbono, eliminarAbono, agregarDescuento, eliminarDescuento, asignarEtiquetaCredito, renovarCredito, eliminarCredito, obtenerCredito } = useApp();
  const { hasPermission } = useAuth();
  
  // Obtener el crédito actualizado del contexto
  const credito = obtenerCredito(clienteId, creditoInicial.id) || creditoInicial;
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
  
  const estado = determinarEstadoCredito(credito.cuotas);
  const progreso = calcularProgreso(credito.cuotas);
  const colorEstado = getColorEstado(estado);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detalle del Crédito</h2>
            <p className="text-sm text-gray-500 font-mono">{credito.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasPermission('eliminarCreditos') && (
              <button
                onClick={handleEliminarCredito}
                className="px-3 py-2 rounded-lg font-medium bg-red-100 hover:bg-red-200 text-red-700 transition-colors flex items-center"
                title="Eliminar crédito"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
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

              {(totalMultasCredito > 0 || totalAbonos > 0 || totalDescuentos > 0) && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500">Saldo pendiente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatearMoneda(credito.totalAPagar + totalMultasCredito - totalAbonos - totalDescuentos)}
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

          {/* Tarjeta de Control de Pagos */}
          <TarjetaControlPagos 
            credito={{...credito, cuotas: cuotasActualizadas}}
            onTogglePago={handlePago}
          />

          {/* Cuotas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Cuotas</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cuotasActualizadas.map((cuota) => {
                const diasMora = !cuota.pagado ? calcularDiasMora(cuota.fechaProgramada) : 0;
                const enMora = diasMora > 0;
                const totalMultas = calcularTotalMultasCuota(cuota);
                const multasPendientes = totalMultas - (cuota.multasCubiertas || 0);
                const valorTotal = calcularValorTotalCuota(credito.valorCuota, cuota);
                const valorPendiente = cuota.pagado ? 0 : (credito.valorCuota - (cuota.abonoAplicado || 0));

                return (
                  <div key={cuota.nroCuota} className="space-y-2">
                    <div
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        cuota.pagado
                          ? 'bg-green-50 border-green-200'
                          : enMora
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          cuota.pagado
                            ? 'bg-green-500 text-white'
                            : enMora
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {cuota.pagado ? (
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
                            {cuota.pagado && cuota.fechaPago && (
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
                            
                            {!cuota.pagado && valorPendiente < credito.valorCuota && (
                              <div className="pt-1 border-t">
                                <span className="text-gray-900 font-bold">
                                  Pendiente: {formatearMoneda(valorPendiente + multasPendientes)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!cuota.pagado && (
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
                          {cuota.pagado ? (
                            <span className="font-semibold text-green-600 block">
                              ✓ Pagado
                            </span>
                          ) : (
                            <span className="font-semibold text-gray-900 block">
                              {formatearMoneda(valorPendiente + multasPendientes)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handlePago(cuota.nroCuota, cuota.pagado)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            cuota.pagado
                              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              : 'bg-sky-600 hover:bg-sky-700 text-white'
                          }`}
                        >
                          {cuota.pagado ? 'Cancelar' : 'Marcar pagado'}
                        </button>
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

          {/* Abonos */}
          {mostrarFormularioAbono && (
            <div className="border-t pt-6">
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
                {credito.abonos.map((abono) => (
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
                    </div>
                    <button
                      onClick={() => handleEliminarAbono(abono.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Eliminar abono"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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
