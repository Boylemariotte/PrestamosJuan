import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Wallet, Plus, DollarSign, FileText, X, Trash2, CheckCircle, ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import { formatearMoneda, calcularPapeleria, calcularMontoEntregado } from '../utils/creditCalculations';
import { savePapeleriaTransaction, getPapeleriaTransactions, deletePapeleriaTransaction } from '../utils/papeleriaStorage';
import MotivoEliminacionModal from '../components/Cajas/MotivoEliminacionModal';

// Componente Modal reutilizable
const Modal = ({ titulo, onClose, children, color = 'blue' }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl p-6 w-full max-w-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{titulo}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// Componente de formulario modal unificado
const ModalForm = ({
  titulo,
  labelMonto,
  placeholderMonto,
  labelDescripcion,
  placeholderDescripcion,
  onClose,
  onSave,
  tipo,
  color = 'blue',
  mostrarMontosPrestamo = false,
  mostrarMensajeDisponible = false,
  montoDisponible = 0,
  montoDisponibleLabel = '',
  textoBotonConfirmar = 'Guardar',
  mostrarBotonCancelar = false
}) => {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [valorCuotasPendientes, setValorCuotasPendientes] = useState('');
  const [papeleriaManual, setPapeleriaManual] = useState(0);
  const [usarPapeleriaManual, setUsarPapeleriaManual] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir la propagación del evento

    if (!monto || parseFloat(monto) <= 0) return;

    // Si es un préstamo, guardar también la papelería manual si se está usando y el valor de cuotas pendientes
    if (tipo === 'prestamo') {
      const datosAdicionales = {
        papeleria: usarPapeleriaManual ? parseFloat(papeleriaManual) : null,
        valorCuotasPendientes: parseFloat(valorCuotasPendientes) || 0
      };
      onSave(tipo, parseFloat(monto), descripcion, datosAdicionales);
    } else {
      onSave(tipo, parseFloat(monto), descripcion);
    }

    setMonto('');
    setDescripcion('');
    setValorCuotasPendientes('');
    setUsarPapeleriaManual(false);
    setPapeleriaManual(0);
    onClose(); // Cerrar el modal después de guardar
  };

  const handleMontoChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount <= 1) {
      setMonto(value);
    }
  };

  const handleMontoBlur = () => {
    const num = parseFloat(monto);
    if (!isNaN(num) && num > 0) {
      setMonto(num.toFixed(2));
    }
  };

  const handleValorCuotasChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount <= 1) {
      setValorCuotasPendientes(value);
    }
  };

  const handleValorCuotasBlur = () => {
    const num = parseFloat(valorCuotasPendientes);
    if (!isNaN(num) && num >= 0) {
      setValorCuotasPendientes(num.toFixed(2));
    } else if (valorCuotasPendientes === '') {
      setValorCuotasPendientes('');
    } else {
      setValorCuotasPendientes('0.00');
    }
  };

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700'
  };

  // Calcular papelería y monto entregado si es préstamo
  const montoNum = parseFloat(monto) || 0;
  const valorCuotasNum = parseFloat(valorCuotasPendientes) || 0;
  const papeleriaCalculada = montoNum > 0 ? calcularPapeleria(montoNum) : 0;
  const papeleria = usarPapeleriaManual ? (parseFloat(papeleriaManual) || 0) : papeleriaCalculada;
  // Monto a entregar = Monto préstamo - Papelería - Valor cuotas pendientes
  const montoEntregado = montoNum > 0 ? (montoNum - papeleria - valorCuotasNum) : 0;

  return (
    <Modal titulo={titulo} onClose={onClose} color={color}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {labelMonto} *
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={monto}
            onChange={handleMontoChange}
            onBlur={handleMontoBlur}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholderMonto}
            autoFocus
            required
          />
        </div>
        {tipo === 'prestamo' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor total de cuotas pendientes
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={valorCuotasPendientes}
                onChange={handleValorCuotasChange}
                onBlur={handleValorCuotasBlur}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Javier - Préstamo nuevo"
              />
            </div>
          </>
        ) : (
          (labelDescripcion || placeholderDescripcion) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {labelDescripcion || 'Descripción'}
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={placeholderDescripcion || 'Descripción'}
              />
            </div>
          )
        )}
        {tipo === 'prestamo' && montoNum > 0 && (
          <div className="bg-gray-50 p-3 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monto Préstamo:</span>
              <span className="font-semibold">{formatearMoneda(montoNum)}</span>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Papelería:</span>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={usarPapeleriaManual}
                      onChange={(e) => setUsarPapeleriaManual(e.target.checked)}
                      className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-1">Editar manual</span>
                  </label>
                  {usarPapeleriaManual ? (
                    <input
                      type="text"
                      value={papeleriaManual}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        const decimalCount = (value.match(/\./g) || []).length;
                        if (decimalCount <= 1) {
                          setPapeleriaManual(value);
                        }
                      }}
                      onBlur={() => {
                        const num = parseFloat(papeleriaManual);
                        if (!isNaN(num) && num >= 0) {
                          setPapeleriaManual(num.toFixed(2));
                        } else {
                          setPapeleriaManual('0.00');
                        }
                      }}
                      className="w-24 px-2 py-1 text-right border border-gray-300 rounded text-sm"
                      placeholder="0.00"
                    />
                  ) : (
                    <span className="font-semibold text-orange-600">- {formatearMoneda(papeleria)}</span>
                  )}
                </div>
              </div>
              {usarPapeleriaManual && (
                <div className="text-xs text-gray-500 italic">
                  Valor automático: {formatearMoneda(papeleriaCalculada)}
                </div>
              )}
            </div>
            {valorCuotasNum > 0 && (
              <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
                <span className="text-gray-600">Valor cuotas pendientes:</span>
                <span className="font-semibold text-red-600">- {formatearMoneda(valorCuotasNum)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
              <span className="text-gray-700 font-medium">Monto a Entregar:</span>
              <span className="font-bold text-green-600">{formatearMoneda(Math.max(0, montoEntregado))}</span>
            </div>
          </div>
        )}
        <div className={`mt-6 flex ${mostrarBotonCancelar ? 'justify-between' : 'justify-end'} space-x-3`}>
          {mostrarBotonCancelar && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={!monto || parseFloat(monto) <= 0}
            className={`px-4 py-2 text-sm font-medium text-white ${colorClasses[color] || colorClasses.blue} border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            <CheckCircle className="h-4 w-4" />
            {textoBotonConfirmar}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Componente para seleccionar ciudad y añadir a papelería
const ModalIngresoPapeleria = ({ onClose, onSave, fechaSeleccionada }) => {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ciudad, setCiudad] = useState('Tuluá');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) return;
    onSave(parseFloat(monto), descripcion, ciudad);
    onClose();
  };

  return (
    <Modal titulo="Añadir Plata a Papelería" onClose={onClose} color="orange">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad *
          </label>
          <select
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          >
            <option value="Tuluá">Tuluá</option>
            <option value="Guadalajara de Buga">Guadalajara de Buga</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto *
          </label>
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="0.00"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ej: Aporte de capital"
          />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Confirmar Ingreso
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Componente Toast para alertas personalizadas
const Toast = ({ mensaje, tipo = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = tipo === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`fixed bottom-8 right-8 ${bgColor} text-white px-6 py-3 rounded-lg shadow-2xl z-[100] flex items-center gap-3 animate-pulse`}>
      {tipo === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      <span className="font-medium">{mensaje}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Componente CajaSection optimizado
const CajaSection = ({
  titulo,
  color,
  numero,
  fechaSeleccionada,
  movimientos,
  papeleriaAcumulada = 0,
  saldoAnterior = 0,
  saldoAcumulado = 0,
  onIniciarCaja,
  onAgregarGasto,
  onAgregarPrestamo,
  onRetirarPapeleria,
  onAgregarPapeleria,
  onEliminarMovimiento,
  movimientosCaja
}) => {
  // Calcular total de retiros de papelería para esta caja
  const totalRetiros = useMemo(() => {
    return movimientos
      .filter(mov => mov.tipo === 'retiroPapeleria' && mov.caja === numero)
      .reduce((sum, mov) => sum + (mov.valor || 0), 0);
  }, [movimientos, numero]);

  // Agrupar todos los movimientos en filas: emparejar inicios de caja, gastos y préstamos
  const filasMovimientos = useMemo(() => {
    let iniciosCaja = [...movimientos].filter(mov => mov.tipo === 'inicioCaja')
      .sort((a, b) => {
        const fechaA = new Date(a.fechaCreacion || a.id);
        const fechaB = new Date(b.fechaCreacion || b.id);
        return fechaA - fechaB;
      });

    // Inyectar Saldo Anterior como un movimiento virtual de "Ingreso"
    if (saldoAnterior > 0) {
      const fechaAnterior = subDays(new Date(fechaSeleccionada), 1);
      const movimientoSaldoAnterior = {
        id: 'saldo-anterior-virtual',
        tipo: 'inicioCaja',
        valor: saldoAnterior,
        descripcion: `Ingreso caja dia ${format(fechaAnterior, 'yyyy-MM-dd')}`,
        isVirtual: true // Flag para identificar que no es de BD y no permitir borrar
      };
      // Agregar al principio
      iniciosCaja = [movimientoSaldoAnterior, ...iniciosCaja];
    }

    const gastos = [...movimientos].filter(mov => mov.tipo === 'gasto')
      .sort((a, b) => {
        const fechaA = new Date(a.fechaCreacion || a.id);
        const fechaB = new Date(b.fechaCreacion || b.id);
        return fechaA - fechaB;
      });

    const prestamos = [...movimientos].filter(mov => mov.tipo === 'prestamo')
      .sort((a, b) => {
        const fechaA = new Date(a.fechaCreacion || a.id);
        const fechaB = new Date(b.fechaCreacion || b.id);
        return fechaA - fechaB;
      });

    // Crear filas emparejando por índice: inicio de caja + gasto + préstamo
    const filas = [];
    const maxLength = Math.max(iniciosCaja.length, gastos.length, prestamos.length);

    for (let i = 0; i < maxLength; i++) {
      filas.push({
        inicioCaja: iniciosCaja[i] || null,
        gasto: gastos[i] || null,
        prestamo: prestamos[i] || null,
        index: i
      });
    }

    return filas;
  }, [movimientos, saldoAnterior, fechaSeleccionada]);

  // Calcular totales
  const totales = useMemo(() => {
    const totalIniciosCaja = filasMovimientos.reduce((sum, fila) =>
      sum + (fila.inicioCaja ? (fila.inicioCaja.valor || 0) : 0), 0
    );
    const totalGastos = filasMovimientos.reduce((sum, fila) =>
      sum + (fila.gasto ? (fila.gasto.valor || 0) : 0), 0
    );
    const totalPor = filasMovimientos.reduce((sum, fila) =>
      sum + (fila.prestamo ? (fila.prestamo.valor || 0) : 0), 0
    );
    const totalPP = filasMovimientos.reduce((sum, fila) => {
      if (fila.prestamo) {
        // Usar el valor de papeleria guardado en el préstamo si existe, de lo contrario calcularlo
        return sum + (fila.prestamo.papeleria !== undefined
          ? fila.prestamo.papeleria
          : calcularPapeleria(fila.prestamo.valor || 0));
      }
      return sum;
    }, 0);
    const totalE = filasMovimientos.reduce((sum, fila) => {
      if (fila.prestamo) {
        // Usar el montoEntregado guardado si existe, de lo contrario calcularlo
        if (fila.prestamo.montoEntregado !== undefined && fila.prestamo.montoEntregado !== null) {
          return sum + fila.prestamo.montoEntregado;
        }
        // Cálculo retrocompatible: valor del préstamo menos la papelería efectiva menos cuotas pendientes
        const valorPrestamo = fila.prestamo.valor || 0;
        const papeleria = fila.prestamo.papeleria !== undefined && fila.prestamo.papeleria !== null
          ? fila.prestamo.papeleria
          : calcularPapeleria(valorPrestamo);
        const valorCuotasPendientes = fila.prestamo.valorCuotasPendientes || 0;
        const montoEntregado = Math.max(0, valorPrestamo - papeleria - valorCuotasPendientes);
        return sum + montoEntregado;
      }
      return sum;
    }, 0);

    return {
      iniciosCaja: totalIniciosCaja,
      gastos: totalGastos,
      por: totalPor,
      pp: totalPP,
      e: totalE
    };
  }, [filasMovimientos]);

  // Calcular saldo final total (todos los movimientos de esta caja, de todos los días)
  const saldoFinal = useMemo(() => {
    // Filtrar todos los movimientos de esta caja, sin importar la fecha
    const todosMovimientosCaja = movimientosCaja.filter(mov =>
      mov.caja === numero && mov.tipoMovimiento === 'flujoCaja'
    );

    // Inicializar con saldo anterior si existe, ya que ahora se visualiza como un ingreso
    // NOTA: Si saldoAnterior ya incluye el cálculo de días previos, sumarlo aquí es correcto
    // para que coincida con la visualización de la tabla que inicia con ese saldo.
    let saldoAcumulado = saldoAnterior > 0 ? parseFloat(saldoAnterior) : 0;

    todosMovimientosCaja.forEach(mov => {
      if (mov.tipo === 'inicioCaja') {
        saldoAcumulado += parseFloat(mov.valor || 0);
      } else if (mov.tipo === 'gasto') {
        saldoAcumulado -= parseFloat(mov.valor || 0);
      } else if (mov.tipo === 'prestamo') {
        // Usar montoEntregado guardado si existe, de lo contrario calcularlo considerando cuotas pendientes
        let montoEntregado = mov.montoEntregado;
        if (montoEntregado === undefined || montoEntregado === null) {
          const valorPrestamo = mov.valor || 0;
          const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
            ? mov.papeleria
            : calcularPapeleria(valorPrestamo);
          const valorCuotasPendientes = mov.valorCuotasPendientes || 0;
          montoEntregado = Math.max(0, valorPrestamo - papeleria - valorCuotasPendientes);
        }
        saldoAcumulado -= parseFloat(montoEntregado || 0);
        // Restar también la papelería del saldo final total
        const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
          ? mov.papeleria
          : calcularPapeleria(mov.valor || 0);
        saldoAcumulado -= parseFloat(papeleria || 0);
      } else if (mov.tipo === 'retiroPapeleria') {
        saldoAcumulado -= parseFloat(mov.valor || 0);
      }
    });

    return saldoAcumulado;
  }, [movimientosCaja, numero, saldoAnterior]);

  // Calcular total de filas para el rowSpan
  // Ya no se usa rowSpan, pero se mantiene por si acaso

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`${color} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-white" />
          <h2 className="text-xl font-bold text-white">{titulo}</h2>
        </div>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-gray-700 to-gray-800">
                <th className="border border-gray-500 px-4 py-3 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">CAJA</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Saldo inicial</span>
                  </div>
                </th>
                <th className="border border-gray-500 px-4 py-3 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">GASTOS</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Egresos del día</span>
                  </div>
                </th>
                <th className="border border-gray-500 px-4 py-3 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">PRÉSTAMOS Y RF</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Créditos otorgados</span>
                  </div>
                </th>
                <th className="border border-gray-500 px-4 py-3 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">POR</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Por cobrar</span>
                  </div>
                </th>
                <th className="border border-gray-500 px-4 py-3 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">PP</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Pagos parciales</span>
                  </div>
                </th>
                <th className="border border-gray-500 px-4 py-3 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">E</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Efectivo final</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Primera fila con botones */}
              <tr className="bg-gray-50 hover:bg-gray-100">
                <td className="border border-gray-400 px-4 py-3 align-top">
                  <button
                    onClick={() => onIniciarCaja(numero)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors text-sm font-medium"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Iniciar/Agregar Caja</span>
                  </button>
                </td>
                <td className="border border-gray-400 px-4 py-3 text-left">
                  <button
                    onClick={() => onAgregarGasto(numero)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Agregar Gasto</span>
                  </button>
                </td>
                <td className="border border-gray-400 px-4 py-3 text-left">
                  <button
                    onClick={() => onAgregarPrestamo(numero)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors text-sm font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Nuevo Préstamo/RF</span>
                  </button>
                </td>
                <td className="border border-gray-400 px-4 py-3"></td>
                <td className="border border-gray-400 px-4 py-3"></td>
                <td className="border border-gray-400 px-4 py-3"></td>
              </tr>

              {/* Filas de movimientos - Inicio de caja, gastos y préstamos en la misma fila */}
              {filasMovimientos.length === 0 && (
                <tr>
                  <td colSpan="6" className="border border-gray-400 px-4 py-8 text-center text-gray-500">
                    No hay movimientos registrados.
                  </td>
                </tr>
              )}
              {filasMovimientos.map((fila) => {
                const { inicioCaja, gasto, prestamo } = fila;
                // Usar la papelería guardada en el préstamo si existe, de lo contrario calcularla
                const papeleria = prestamo
                  ? (prestamo.papeleria !== undefined && prestamo.papeleria !== null
                    ? prestamo.papeleria
                    : calcularPapeleria(prestamo.valor || 0))
                  : 0;

                // Calcular el monto entregado: usar el guardado si existe, de lo contrario calcularlo
                let montoEntregado = 0;
                if (prestamo) {
                  if (prestamo.montoEntregado !== undefined && prestamo.montoEntregado !== null) {
                    montoEntregado = prestamo.montoEntregado;
                  } else {
                    // Cálculo retrocompatible
                    const valorPrestamo = prestamo.valor || 0;
                    const valorCuotasPendientes = prestamo.valorCuotasPendientes || 0;
                    montoEntregado = Math.max(0, valorPrestamo - papeleria - valorCuotasPendientes);
                  }
                }

                return (
                  <tr
                    key={fila.index}
                    className={`${inicioCaja || gasto || prestamo ? 'hover:bg-gray-50' : ''}`}>
                    {/* 1. Caja (ingresos del día) */}
                    <td className="border border-gray-400 px-4 py-3">
                      {inicioCaja ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-gray-800">
                              {formatearMoneda(inicioCaja.valor || 0)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {inicioCaja.descripcion || 'Sin descripción'}
                            </div>
                          </div>
                          {!inicioCaja.isVirtual && (
                            <button
                              onClick={() => onEliminarMovimiento(inicioCaja.id)}
                              className="text-red-500 hover:text-red-700 ml-2"
                              title="Eliminar inicio de caja"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : null}
                    </td>
                    {/* 2. Gastos */}
                    <td className="border border-gray-400 px-4 py-3">
                      {gasto ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-red-600">
                              {formatearMoneda(gasto.valor)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {gasto.descripcion || 'Sin descripción'}
                            </div>
                          </div>
                          <button
                            onClick={() => onEliminarMovimiento(gasto.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </td>
                    {/* 3. Préstamos y RF (descripción) */}
                    <td className="border border-gray-400 px-4 py-3">
                      {prestamo ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {formatearMoneda(prestamo.valor)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {prestamo.descripcion || 'Sin descripción'}
                            </div>
                          </div>
                          <button
                            onClick={() => onEliminarMovimiento(prestamo.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Eliminar préstamo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </td>
                    {/* 4. Por (monto del préstamo) - Ocultar en pantallas pequeñas o mantener como referencia */}
                    <td className="border border-gray-400 px-4 py-3 hidden sm:table-cell">
                      {prestamo ? (
                        <div className="text-sm font-bold text-blue-600">
                          {formatearMoneda(prestamo.valor)}
                        </div>
                      ) : null}
                    </td>
                    {/* 5. PP (papelería) */}
                    <td className="border border-gray-400 px-4 py-3">
                      {prestamo ? (
                        <div className="text-sm font-bold text-orange-600">
                          {formatearMoneda(papeleria)}
                        </div>
                      ) : null}
                    </td>
                    {/* 6. E (monto entregado) */}
                    <td className="border border-gray-400 px-4 py-3">
                      {prestamo ? (
                        <div className="text-sm font-bold text-green-600">
                          {formatearMoneda(montoEntregado)}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}

              {/* Fila de totales (estilo de la maqueta) */}
              {/* Nueva fila: Saldo Total Caja */}
              {/* Nueva estructura reordenada */}
              {/* FILA 1: Encabezados de Totales por Columna */}
              <tr className="bg-gray-100 border-t-2 border-gray-500">
                <td className="border border-gray-400 px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Saldo Total Ingresos Caja
                </td>
                <td className="border border-gray-400 px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Total Gastos
                </td>
                <td className="border border-gray-400 px-4 py-2">
                  {/* Vacío */}
                </td>
                <td className="border border-gray-400 px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Total Préstamos
                </td>
                <td className="border border-gray-400 px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Total Papelería
                </td>
                <td className="border border-gray-400 px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Total Entregado
                </td>
              </tr>

              {/* FILA 2: Valores de Totales por Columna */}
              <tr className="bg-white">
                <td className="border border-gray-400 px-4 py-3">
                  <div className="text-lg font-bold text-green-700">
                    {formatearMoneda(totales.iniciosCaja)}
                  </div>
                </td>
                <td className="border border-gray-400 px-4 py-3">
                  <div className="text-lg font-bold text-red-600">
                    -{formatearMoneda(totales.gastos)}
                  </div>
                </td>
                <td className="border border-gray-400 px-4 py-3">
                  {/* Celda vacía */}
                </td>
                <td className="border border-gray-400 px-4 py-3">
                  <div className="text-lg font-bold text-blue-600">
                    {formatearMoneda(totales.por)}
                  </div>
                </td>
                <td className="border border-gray-400 px-4 py-3">
                  <div className="text-lg font-bold text-orange-600">
                    -{formatearMoneda(totales.pp)}
                  </div>
                </td>
                <td className="border border-gray-400 px-4 py-3">
                  <div className="text-lg font-bold text-green-600">
                    -{formatearMoneda(totales.e)}
                  </div>
                </td>
              </tr>

              {/* Separador visual */}
              <tr className="h-4 bg-gray-200">
                <td colSpan="6" className="border border-gray-400"></td>
              </tr>

              {/* FILA 3: Encabezado Saldo Final (Full Width) */}
              <tr className="bg-blue-100 border-t-2 border-gray-600">
                <td colSpan="6" className="border border-gray-400 px-4 py-2 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Saldo Final Total
                </td>
              </tr>

              {/* FILA 4: Valor Saldo Final (Full Width) */}
              <tr className="bg-white border-b-2 border-gray-400">
                <td colSpan="6" className="border border-gray-400 px-4 py-4 text-center">
                  <div className="text-3xl font-extrabold text-blue-700">
                    {formatearMoneda(saldoAcumulado)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección de Papelería - Versión simplificada */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <div>
              <div className="text-sm font-medium text-gray-700">Fondo de Papelería</div>
              <div className="text-lg font-bold text-orange-600">
                {formatearMoneda(papeleriaAcumulada)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRetirarPapeleria(numero)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Retirar
            </button>
            <button
              onClick={onAgregarPapeleria}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Añadir
            </button>
          </div>
        </div>
      </div>
    </div >
  );
};

const FlujoCajas = () => {
  const { movimientosCaja, agregarMovimientoCaja, eliminarMovimientoCaja, fetchData } = useApp();
  const hoy = useMemo(() => startOfDay(new Date()), []);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [modalAbierto, setModalAbierto] = useState(null);
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [toast, setToast] = useState(null);

  // Normalizar movimientos provenientes del backend (fecha a yyyy-MM-dd y tipoMovimiento por defecto)
  const movimientosFlujo = useMemo(() => {
    return movimientosCaja
      .map((mov) => {
        let fechaNormalizada = mov.fecha;

        if (mov.fecha) {
          // Estrategia: Usar siempre la fecha UTC del servidor (YYYY-MM-DD)
          // Esto evita que la conversión a hora local cambie el día visualizado
          // independientemente de la hora a la que se guardó.
          if (typeof mov.fecha === 'string' && mov.fecha.length >= 10) {
            fechaNormalizada = mov.fecha.substring(0, 10);
          } else if (mov.fecha instanceof Date) {
            // Si ya es objeto Date, formatearlo a ISO y cortar
            fechaNormalizada = mov.fecha.toISOString().substring(0, 10);
          }
        }

        return {
          ...mov,
          fecha: fechaNormalizada,
          tipoMovimiento: mov.tipoMovimiento || 'flujoCaja'
        };
      })
      .filter((mov) => mov.tipoMovimiento === 'flujoCaja');
  }, [movimientosCaja]);

  // Formatear fecha para consultas
  const fechaFormato = useMemo(() =>
    format(fechaSeleccionada, 'yyyy-MM-dd'),
    [fechaSeleccionada]
  );

  // Obtener movimientos por caja para la fecha seleccionada, calcular papelería acumulada e ingresos totales
  const datosCajas = useMemo(() => {
    // Movimientos del día seleccionado
    const movimientosFecha = movimientosFlujo.filter(mov =>
      mov.fecha === fechaFormato
    );

    // Todos los movimientos de préstamos para calcular papelería acumulada
    const todosPrestamos = movimientosFlujo.filter(mov =>
      mov.tipo === 'prestamo'
    );

    // Movimientos de inicio de caja de todos los días
    const todosIniciosCaja = movimientosFlujo.filter(mov =>
      mov.tipo === 'inicioCaja'
    );

    // Movimientos de retiro de papelería
    const retirosPapeleria = movimientosFlujo.filter(mov =>
      mov.tipo === 'retiroPapeleria'
    );

    // Obtener movimientos de días anteriores (hasta la fecha actual)
    const movimientosAnteriores = movimientosFlujo.filter(mov => {
      const movDate = mov.fecha ? new Date(mov.fecha) : null;
      const currentDate = new Date(fechaFormato);
      return movDate && movDate < currentDate;
    });

    const datos = {
      caja1: {
        movimientos: [],
        papeleriaAcumulada: 0,
        ingresosAcumulados: 0,
        retirosPapeleria: 0,
        saldoAnterior: 0,
        saldoAcumulado: 0
      },
      caja2: {
        movimientos: [],
        papeleriaAcumulada: 0,
        ingresosAcumulados: 0,
        retirosPapeleria: 0,
        saldoAnterior: 0,
        saldoAcumulado: 0
      },
      caja3: {
        movimientos: [],
        papeleriaAcumulada: 0,
        ingresosAcumulados: 0,
        retirosPapeleria: 0,
        saldoAnterior: 0,
        saldoAcumulado: 0
      }
    };

    // Procesar movimientos de la fecha seleccionada
    movimientosFecha.forEach(mov => {
      // Usar comparación flexible (==) para caja por seguridad de tipos
      if (mov.caja == 1) {
        datos.caja1.movimientos.push(mov);
      } else if (mov.caja == 2) {
        datos.caja2.movimientos.push(mov);
      } else if (mov.caja == 3) {
        datos.caja3.movimientos.push(mov);
      }
    });

    // Calcular saldo acumulado de días anteriores para cada caja
    movimientosAnteriores.forEach(mov => {
      if (mov.caja == 1) {
        if (mov.tipo === 'inicioCaja') {
          datos.caja1.saldoAnterior += parseFloat(mov.valor || 0);
        } else if (mov.tipo === 'gasto') {
          datos.caja1.saldoAnterior -= parseFloat(mov.valor || 0);
        } else if (mov.tipo === 'prestamo') {
          // Usar montoEntregado guardado si existe, de lo contrario calcularlo considerando cuotas pendientes
          let montoEntregado = mov.montoEntregado;
          if (montoEntregado === undefined || montoEntregado === null) {
            const valorPrestamo = mov.valor || 0;
            const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
              ? mov.papeleria
              : calcularPapeleria(valorPrestamo);
            const valorCuotasPendientes = mov.valorCuotasPendientes || 0;
            montoEntregado = Math.max(0, valorPrestamo - papeleria - valorCuotasPendientes);
          }
          datos.caja1.saldoAnterior -= parseFloat(montoEntregado || 0);
          // Restar también la papelería del saldo anterior
          const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
            ? mov.papeleria
            : calcularPapeleria(mov.valor || 0);
          datos.caja1.saldoAnterior -= parseFloat(papeleria || 0);
        }
      } else if (mov.caja == 2) {
        if (mov.tipo === 'inicioCaja') {
          datos.caja2.saldoAnterior += parseFloat(mov.valor || 0);
        } else if (mov.tipo === 'gasto') {
          datos.caja2.saldoAnterior -= parseFloat(mov.valor || 0);
        } else if (mov.tipo === 'prestamo') {
          // Usar montoEntregado guardado si existe, de lo contrario calcularlo considerando cuotas pendientes
          let montoEntregado = mov.montoEntregado;
          if (montoEntregado === undefined || montoEntregado === null) {
            const valorPrestamo = mov.valor || 0;
            const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
              ? mov.papeleria
              : calcularPapeleria(valorPrestamo);
            const valorCuotasPendientes = mov.valorCuotasPendientes || 0;
            montoEntregado = Math.max(0, valorPrestamo - papeleria - valorCuotasPendientes);
          }
          datos.caja2.saldoAnterior -= parseFloat(montoEntregado || 0);
          // Restar también la papelería del saldo anterior
          const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
            ? mov.papeleria
            : calcularPapeleria(mov.valor || 0);
          datos.caja2.saldoAnterior -= parseFloat(papeleria || 0);
        }
      } else if (mov.caja == 3) {
        if (mov.tipo === 'inicioCaja') {
          datos.caja3.saldoAnterior += parseFloat(mov.valor || 0);
        } else if (mov.tipo === 'gasto') {
          datos.caja3.saldoAnterior -= parseFloat(mov.valor || 0);
        } else if (mov.tipo === 'prestamo') {
          // Usar montoEntregado guardado si existe, de lo contrario calcularlo considerando cuotas pendientes
          let montoEntregado = mov.montoEntregado;
          if (montoEntregado === undefined || montoEntregado === null) {
            const valorPrestamo = mov.valor || 0;
            const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
              ? mov.papeleria
              : calcularPapeleria(valorPrestamo);
            const valorCuotasPendientes = mov.valorCuotasPendientes || 0;
            montoEntregado = Math.max(0, valorPrestamo - papeleria - valorCuotasPendientes);
          }
          datos.caja3.saldoAnterior -= parseFloat(montoEntregado || 0);
          // Restar también la papelería del saldo anterior
          const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
            ? mov.papeleria
            : calcularPapeleria(mov.valor || 0);
          datos.caja3.saldoAnterior -= parseFloat(papeleria || 0);
        }
      }
    });

    // Calcular ingresos acumulados por caja (solo inicios de caja)
    todosIniciosCaja.forEach(mov => {
      if (mov.caja == 1) {
        datos.caja1.ingresosAcumulados += parseFloat(mov.valor || 0);
      } else if (mov.caja == 2) {
        datos.caja2.ingresosAcumulados += parseFloat(mov.valor || 0);
      } else if (mov.caja == 3) {
        datos.caja3.ingresosAcumulados += parseFloat(mov.valor || 0);
      }
    });

    // Calcular papelería acumulada por caja
    todosPrestamos.forEach(mov => {
      // Verificar que papeleria existe y es un número válido (puede ser 0)
      const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
        ? parseFloat(mov.papeleria)
        : 0;

      if (mov.caja == 1) {
        datos.caja1.papeleriaAcumulada += papeleria;
      } else if (mov.caja == 2) {
        datos.caja2.papeleriaAcumulada += papeleria;
      } else if (mov.caja == 3) {
        datos.caja3.papeleriaAcumulada += papeleria;
      }
    });

    // Restar retiros de papelería
    retirosPapeleria.forEach(mov => {
      if (mov.caja == 1) {
        datos.caja1.retirosPapeleria += parseFloat(mov.valor || 0);
        datos.caja1.papeleriaAcumulada -= parseFloat(mov.valor || 0);
      } else if (mov.caja == 2) {
        datos.caja2.retirosPapeleria += parseFloat(mov.valor || 0);
        datos.caja2.papeleriaAcumulada -= parseFloat(mov.valor || 0);
      } else if (mov.caja == 3) {
        datos.caja3.retirosPapeleria += parseFloat(mov.valor || 0);
        datos.caja3.papeleriaAcumulada -= parseFloat(mov.valor || 0);
      }
    });

    // Asegurar que la papelería no sea negativa
    datos.caja1.papeleriaAcumulada = Math.max(0, datos.caja1.papeleriaAcumulada);
    datos.caja2.papeleriaAcumulada = Math.max(0, datos.caja2.papeleriaAcumulada);
    datos.caja3.papeleriaAcumulada = Math.max(0, datos.caja3.papeleriaAcumulada);

    // Calcular saldo acumulado (saldo anterior + ingresos del día - gastos del día)
    datos.caja1.saldoAcumulado = datos.caja1.saldoAnterior;
    datos.caja2.saldoAcumulado = datos.caja2.saldoAnterior;
    datos.caja3.saldoAcumulado = datos.caja3.saldoAnterior;

    // Sumar ingresos del día
    movimientosFecha.forEach(mov => {
      if (mov.tipo === 'inicioCaja') {
        if (mov.caja == 1) datos.caja1.saldoAcumulado += parseFloat(mov.valor || 0);
        if (mov.caja == 2) datos.caja2.saldoAcumulado += parseFloat(mov.valor || 0);
        if (mov.caja == 3) datos.caja3.saldoAcumulado += parseFloat(mov.valor || 0);
      }
    });

    // Restar gastos y préstamos del día
    movimientosFecha.forEach(mov => {
      if (mov.tipo === 'gasto') {
        if (mov.caja == 1) datos.caja1.saldoAcumulado -= parseFloat(mov.valor || 0);
        if (mov.caja == 2) datos.caja2.saldoAcumulado -= parseFloat(mov.valor || 0);
        if (mov.caja == 3) datos.caja3.saldoAcumulado -= parseFloat(mov.valor || 0);
      } else if (mov.tipo === 'prestamo') {
        // Restar el monto entregado del préstamo
        let montoARestar = mov.montoEntregado;
        if (montoARestar === undefined || montoARestar === null) {
          const valorPrestamo = mov.valor || 0;
          const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
            ? mov.papeleria
            : calcularPapeleria(valorPrestamo);
          const valorCuotasPendientes = mov.valorCuotasPendientes || 0;
          montoARestar = Math.max(0, valorPrestamo - papeleria - valorCuotasPendientes);
        }
        if (mov.caja == 1) datos.caja1.saldoAcumulado -= parseFloat(montoARestar || 0);
        if (mov.caja == 2) datos.caja2.saldoAcumulado -= parseFloat(montoARestar || 0);
        if (mov.caja == 3) datos.caja3.saldoAcumulado -= parseFloat(montoARestar || 0);

        // Restar también la papelería del saldo final
        const papeleria = mov.papeleria !== undefined && mov.papeleria !== null
          ? mov.papeleria
          : calcularPapeleria(mov.valor || 0);
        if (mov.caja == 1) datos.caja1.saldoAcumulado -= parseFloat(papeleria || 0);
        if (mov.caja == 2) datos.caja2.saldoAcumulado -= parseFloat(papeleria || 0);
        if (mov.caja == 3) datos.caja3.saldoAcumulado -= parseFloat(papeleria || 0);
      }
    });

    return datos;
  }, [movimientosFlujo, fechaFormato]);

  // Funciones de navegación de fecha
  const irAyer = useCallback(() => setFechaSeleccionada(prev => subDays(prev, 1)), []);
  const irHoy = useCallback(() => setFechaSeleccionada(hoy), [hoy]);
  const irMañana = useCallback(() => setFechaSeleccionada(prev => addDays(prev, 1)), []);
  const cambiarFecha = useCallback((e) => {
    // Solución al problema de timezone: crear la fecha localmente
    // new Date('2025-12-30') crea un UTC 00:00 que en local puede ser día anterior
    // new Date(y, m, d) crea fecha local
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    const nuevaFecha = new Date(year, month - 1, day);
    setFechaSeleccionada(startOfDay(nuevaFecha));
  }, []);

  const esHoy = useMemo(() =>
    format(fechaSeleccionada, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd'),
    [fechaSeleccionada, hoy]
  );

  // Handlers de modales
  const handleIniciarCaja = useCallback((numero) => {
    setCajaSeleccionada(numero);
    setModalAbierto('inicioCaja');
  }, []);

  const handleRetirarPapeleria = useCallback((cajaNumero) => {
    setCajaSeleccionada(cajaNumero);
    setModalAbierto('retiroPapeleria');
  }, []);

  const handleAgregarGasto = useCallback((cajaNumero) => {
    setCajaSeleccionada(cajaNumero);
    setModalAbierto('gasto');
  }, []);

  const handleAgregarPrestamo = useCallback((cajaNumero) => {
    setCajaSeleccionada(cajaNumero);
    setModalAbierto('prestamo');
  }, []);

  const handleCerrarModal = useCallback(() => {
    setModalAbierto(null);
    setCajaSeleccionada(null);
  }, []);

  const handleAgregarPapeleria = useCallback(() => {
    setModalAbierto('ingresoPapeleria');
  }, []);

  const handleGuardar = useCallback(async (tipo, monto, descripcion, datosAdicionales = {}) => {
    if (!monto || monto <= 0) return;

    // Verificar que haya una caja seleccionada para los tipos que lo requieren
    if ((!cajaSeleccionada && tipo !== 'prestamo' && tipo !== 'retiroPapeleria') ||
      (tipo === 'retiroPapeleria' && !cajaSeleccionada)) {
      alert('Por favor selecciona una caja');
      return;
    }

    // Validar que no se retire más de lo disponible en papeleria
    if (tipo === 'retiroPapeleria') {
      const papeleriaDisponible = cajaSeleccionada === 1
        ? datosCajas.caja1.papeleriaAcumulada
        : cajaSeleccionada === 2
          ? datosCajas.caja2.papeleriaAcumulada
          : datosCajas.caja3.papeleriaAcumulada;

      if (monto > papeleriaDisponible) {
        alert(`No hay suficiente saldo en la papelería. Disponible: ${formatearMoneda(papeleriaDisponible)}`);
        return;
      }
    }

    const esPrestamo = tipo === 'prestamo';
    const esRetiroPapeleria = tipo === 'retiroPapeleria';

    // Preparar fecha para guardar: Usar mediodía (12:00) para evitar problemas de zona horaria
    const fechaParaGuardar = new Date(fechaSeleccionada);
    fechaParaGuardar.setHours(12, 0, 0, 0);

    // Calcular papelería automáticamente para préstamos (5,000 por cada 100,000)
    let papeleria = 0;
    let valorCuotasPendientes = 0;
    if (esPrestamo) {
      // Si se proporciona un valor manual, usarlo, de lo contrario calcularlo
      papeleria = datosAdicionales.papeleria !== undefined && datosAdicionales.papeleria !== null
        ? parseFloat(datosAdicionales.papeleria)
        : calcularPapeleria(monto);
      // Obtener el valor de cuotas pendientes si existe
      valorCuotasPendientes = datosAdicionales.valorCuotasPendientes || 0;
    }

    // Monto a entregar = Monto préstamo - Papelería - Valor cuotas pendientes
    const montoEntregado = esPrestamo ? Math.max(0, monto - papeleria - valorCuotasPendientes) : 0;

    const movimientoData = {
      tipo: esRetiroPapeleria ? 'retiroPapeleria' : (tipo === 'inicioCaja' ? 'inicioCaja' : tipo),
      tipoMovimiento: 'flujoCaja',
      concepto: esRetiroPapeleria
        ? `Retiro de Papelería - ${descripcion || 'Sin descripción'}`
        : tipo === 'inicioCaja'
          ? `Inicio Caja ${cajaSeleccionada}`
          : tipo === 'gasto'
            ? `Gasto - ${descripcion || 'Sin descripción'}`
            : `Préstamo - ${descripcion || 'Sin descripción'}`,
      valor: monto,
      descripcion: descripcion || '',
      fecha: fechaParaGuardar.toISOString(),
      caja: cajaSeleccionada,
      categoria: esRetiroPapeleria
        ? 'Retiro de Papelería'
        : tipo === 'gasto'
          ? 'Gasto de Caja'
          : tipo === 'inicioCaja'
            ? 'Inicio de Caja'
            : 'Préstamo',
      ...(esPrestamo ? {
        papeleria: papeleria,
        valorCuotasPendientes: valorCuotasPendientes,
        montoEntregado: montoEntregado
      } : {})
    };

    try {
      // Guardar el movimiento en la caja
      const movimientoCreado = await agregarMovimientoCaja(movimientoData);
      const movimientoId = movimientoCreado?.id || movimientoCreado?._id || movimientoCreado;

      // NOTA: Los préstamos NO crean ingresos en la vista de Papelería
      // Solo se suman al fondo de papelería en FlujoCajas para mostrar el total disponible
      // Los ingresos de papelería solo se crean cuando se registran explícitamente desde la vista de Papelería

      // Si es un retiro de papelería, guardar en el historial de papelería
      if (esRetiroPapeleria) {
        // Determinar ciudad de papelería según la caja: Caja 3 = Buga, otras = Tuluá
        const ciudadPapeleria = cajaSeleccionada === 3 ? 'Guadalajara de Buga' : 'Tuluá';
        savePapeleriaTransaction({
          tipo: 'retiro',
          cantidad: monto,
          descripcion: `Retiro de papelería - ${descripcion || 'Sin descripción'}`,
          fecha: new Date().toISOString(),
          movimientoId: movimientoId,
          caja: cajaSeleccionada,
          tipoMovimiento: 'retiro',
          ciudadPapeleria: ciudadPapeleria
        });
      }

      handleCerrarModal();
    } catch (error) {
      console.error('Error guardando movimiento de caja:', error);
      alert('No se pudo guardar el movimiento. Revisa tu conexión o credenciales.');
    }
  }, [cajaSeleccionada, fechaFormato, agregarMovimientoCaja, handleCerrarModal, datosCajas]);

  const handleGuardarIngresoPapeleria = useCallback(async (monto, descripcion, ciudad) => {
    try {
      const fechaParaGuardar = new Date(fechaSeleccionada);
      fechaParaGuardar.setHours(12, 0, 0, 0);

      await savePapeleriaTransaction({
        tipo: 'ingreso',
        cantidad: monto,
        descripcion: descripcion || 'Ingreso manual papelería',
        fecha: fechaParaGuardar.toISOString(),
        ciudadPapeleria: ciudad
      });

      handleCerrarModal();
      // Recargar datos para ver el nuevo saldo
      fetchData();
      // Mostrar toast de éxito
      setToast({ mensaje: 'Monto añadido correctamente', tipo: 'success' });
    } catch (error) {
      console.error('Error guardando ingreso de papelería:', error);
      setToast({ mensaje: 'No se pudo guardar el ingreso', tipo: 'error' });
    }
  }, [fechaSeleccionada, handleCerrarModal, fetchData]);

  const handleEliminarMovimiento = useCallback((movimientoId) => {
    setMovimientoAEliminar(movimientoId);
    setModalEliminarAbierto(true);
  }, []);

  const confirmarEliminacion = useCallback(async (motivo) => {
    if (!movimientoAEliminar) return;

    try {
      // Llamar al backend pasando el motivo
      await eliminarMovimientoCaja(movimientoAEliminar, motivo);
      setMovimientoAEliminar(null);
      setModalEliminarAbierto(false);
    } catch (error) {
      console.error('Error eliminando movimiento:', error);
      alert('No se pudo eliminar el movimiento.');
    }
  }, [movimientoAEliminar, eliminarMovimientoCaja]);

  const fechaFormateada = useMemo(() =>
    format(fechaSeleccionada, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }),
    [fechaSeleccionada]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Flujo de Cajas</h1>
            </div>

            {/* Selector de Fecha */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={irAyer}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Ayer</span>
              </button>

              <button
                onClick={irHoy}
                disabled={esHoy}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${esHoy
                  ? 'bg-blue-500 text-white cursor-default'
                  : 'bg-white/10 hover:bg-white/20'
                  }`}
              >
                Hoy
              </button>

              <button
                onClick={irMañana}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium">Mañana</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Calendar className="h-4 w-4" />
                <input
                  type="date"
                  value={format(fechaSeleccionada, 'yyyy-MM-dd')}
                  onChange={cambiarFecha}
                  className="bg-transparent border-none text-white text-sm font-medium focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <p className="text-slate-200 text-lg mt-3">
              {fechaFormateada}
            </p>
          </div>
        </div>
      </div>

      {/* Cajas */}
      <div className="space-y-6">
        <CajaSection
          titulo="Caja 1"
          color="bg-gradient-to-r from-blue-600 to-blue-700"
          numero={1}
          fechaSeleccionada={fechaFormato}
          movimientos={datosCajas.caja1.movimientos}
          papeleriaAcumulada={datosCajas.caja1.papeleriaAcumulada}
          saldoAnterior={datosCajas.caja1.saldoAnterior}
          saldoAcumulado={datosCajas.caja1.saldoAcumulado}
          onIniciarCaja={handleIniciarCaja}
          onAgregarGasto={() => handleAgregarGasto(1)}
          onAgregarPrestamo={() => handleAgregarPrestamo(1)}
          onRetirarPapeleria={handleRetirarPapeleria}
          onAgregarPapeleria={handleAgregarPapeleria}
          onEliminarMovimiento={handleEliminarMovimiento}
          movimientosCaja={movimientosFlujo}
        />

        <CajaSection
          titulo="Caja 2"
          color="bg-gradient-to-r from-green-600 to-green-700"
          numero={2}
          fechaSeleccionada={fechaFormato}
          movimientos={datosCajas.caja2.movimientos}
          papeleriaAcumulada={datosCajas.caja2.papeleriaAcumulada}
          saldoAnterior={datosCajas.caja2.saldoAnterior}
          saldoAcumulado={datosCajas.caja2.saldoAcumulado}
          onIniciarCaja={handleIniciarCaja}
          onAgregarGasto={() => handleAgregarGasto(2)}
          onAgregarPrestamo={() => handleAgregarPrestamo(2)}
          onRetirarPapeleria={handleRetirarPapeleria}
          onAgregarPapeleria={handleAgregarPapeleria}
          onEliminarMovimiento={handleEliminarMovimiento}
          movimientosCaja={movimientosFlujo}
        />

        <CajaSection
          titulo="Caja 3"
          color="bg-gradient-to-r from-orange-600 to-orange-700"
          numero={3}
          fechaSeleccionada={fechaFormato}
          movimientos={datosCajas.caja3.movimientos}
          papeleriaAcumulada={datosCajas.caja3.papeleriaAcumulada}
          saldoAnterior={datosCajas.caja3.saldoAnterior}
          saldoAcumulado={datosCajas.caja3.saldoAcumulado}
          onIniciarCaja={handleIniciarCaja}
          onAgregarGasto={() => handleAgregarGasto(3)}
          onAgregarPrestamo={() => handleAgregarPrestamo(3)}
          onRetirarPapeleria={handleRetirarPapeleria}
          onAgregarPapeleria={handleAgregarPapeleria}
          onEliminarMovimiento={handleEliminarMovimiento}
          movimientosCaja={movimientosFlujo}
        />
      </div>

      {/* Modales */}
      {modalAbierto === 'inicioCaja' && (
        <ModalForm
          titulo={`Iniciar Caja ${cajaSeleccionada}`}
          labelMonto="Monto Inicial"
          placeholderMonto="0.00"
          labelDescripcion="Descripción (Opcional)"
          placeholderDescripcion="Ej: Fondo inicial"
          onClose={handleCerrarModal}
          onSave={handleGuardar}
          tipo="inicioCaja"
          color="blue"
        />
      )}

      {modalAbierto === 'gasto' && (
        <ModalForm
          titulo="Agregar Gasto"
          labelMonto="Monto"
          placeholderMonto="Ingrese el monto del gasto"
          labelDescripcion="Descripción"
          placeholderDescripcion="Descripción del gasto"
          onClose={handleCerrarModal}
          onSave={handleGuardar}
          tipo="gasto"
          color="red"
        />
      )}

      {modalAbierto === 'prestamo' && (
        <ModalForm
          titulo={`Nuevo Préstamo/RF - Caja ${cajaSeleccionada}`}
          labelMonto="Monto del Préstamo/Renovación"
          placeholderMonto="Ingrese el monto del préstamo"
          onClose={handleCerrarModal}
          onSave={handleGuardar}
          tipo="prestamo"
          color="green"
        />
      )}

      {modalAbierto === 'retiroPapeleria' && (
        <ModalForm
          titulo={`Retirar de Papelería - Caja ${cajaSeleccionada}`}
          labelMonto="Monto a retirar"
          placeholderMonto="Ingrese el monto a retirar"
          labelDescripcion="Motivo del retiro"
          placeholderDescripcion="Ej: Compra de materiales de oficina"
          onClose={handleCerrarModal}
          onSave={handleGuardar}
          tipo="retiroPapeleria"
          color="purple"
          mostrarMensajeDisponible={true}
          montoDisponible={cajaSeleccionada === 1
            ? datosCajas.caja1.papeleriaAcumulada
            : cajaSeleccionada === 2
              ? datosCajas.caja2.papeleriaAcumulada
              : datosCajas.caja3.papeleriaAcumulada}
          montoDisponibleLabel="Saldo disponible en papelería"
          textoBotonConfirmar="Confirmar Retiro"
          mostrarBotonCancelar={true}
        />
      )}

      {modalAbierto === 'ingresoPapeleria' && (
        <ModalIngresoPapeleria
          onClose={handleCerrarModal}
          onSave={handleGuardarIngresoPapeleria}
          fechaSeleccionada={fechaSeleccionada}
        />
      )}

      {/* Modal de Motivo de Eliminación */}
      <MotivoEliminacionModal
        isOpen={modalEliminarAbierto}
        onClose={() => {
          setModalEliminarAbierto(false);
          setMovimientoAEliminar(null);
        }}
        onConfirm={confirmarEliminacion}
        titulo="Eliminar Movimiento de Caja"
      />

      {toast && (
        <Toast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default FlujoCajas;
