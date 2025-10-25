import React, { useState } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, Calendar, Trash2, Filter, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatearMoneda, formatearFecha } from '../utils/creditCalculations';
import { obtenerFechaLocal } from '../utils/dateUtils';

const Caja = () => {
  const { movimientosCaja, agregarMovimientoCaja, eliminarMovimientoCaja } = useApp();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'ingreso', 'egreso'
  const [filtroFecha, setFiltroFecha] = useState('mes'); // 'hoy', 'semana', 'mes', 'todos'
  const [formData, setFormData] = useState({
    tipo: 'ingreso',
    concepto: '',
    valor: '',
    categoria: '',
    descripcion: '',
    fecha: obtenerFechaLocal()
  });

  // Categorías predefinidas
  const CATEGORIAS = {
    ingreso: [
      'Pago de Crédito',
      'Intereses',
      'Multas',
      'Renovación',
      'Otro Ingreso'
    ],
    egreso: [
      'Salario',
      'Transporte',
      'Papelería',
      'Servicios',
      'Mantenimiento',
      'Otro Egreso'
    ]
  };

  // Filtrar movimientos
  const movimientosFiltrados = movimientosCaja.filter(mov => {
    // Filtro por tipo
    if (filtroTipo !== 'todos' && mov.tipo !== filtroTipo) return false;

    // Filtro por fecha
    const fechaMov = new Date(mov.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    switch (filtroFecha) {
      case 'hoy':
        const movFecha = new Date(mov.fecha);
        movFecha.setHours(0, 0, 0, 0);
        return movFecha.getTime() === hoy.getTime();
      case 'semana':
        const semanaAtras = new Date(hoy);
        semanaAtras.setDate(hoy.getDate() - 7);
        return fechaMov >= semanaAtras;
      case 'mes':
        const mesAtras = new Date(hoy);
        mesAtras.setMonth(hoy.getMonth() - 1);
        return fechaMov >= mesAtras;
      default:
        return true;
    }
  });

  // Calcular totales
  const totalIngresos = movimientosFiltrados
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.valor, 0);

  const totalEgresos = movimientosFiltrados
    .filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.valor, 0);

  const balance = totalIngresos - totalEgresos;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valor' ? parseFloat(value) || '' : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    agregarMovimientoCaja(formData);
    setFormData({
      tipo: 'ingreso',
      concepto: '',
      valor: '',
      categoria: '',
      descripcion: '',
      fecha: obtenerFechaLocal()
    });
    setMostrarFormulario(false);
  };

  const handleEliminar = (movimientoId) => {
    if (window.confirm('¿Estás seguro de eliminar este movimiento?')) {
      eliminarMovimientoCaja(movimientoId);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caja y Flujo de Efectivo</h1>
          <p className="text-gray-600 mt-1">
            Gestiona ingresos, egresos y el balance de caja
          </p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Movimiento
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Ingresos</p>
              <p className="text-3xl font-bold mt-1">{formatearMoneda(totalIngresos)}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Egresos</p>
              <p className="text-3xl font-bold mt-1">{formatearMoneda(totalEgresos)}</p>
            </div>
            <TrendingDown className="h-12 w-12 text-red-200" />
          </div>
        </div>

        <div className={`card bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Balance</p>
              <p className="text-3xl font-bold mt-1">{formatearMoneda(balance)}</p>
            </div>
            <DollarSign className="h-12 w-12 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Filtros:</span>
          </div>

          {/* Filtro por tipo */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroTipo === 'todos'
                  ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('ingreso')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroTipo === 'ingreso'
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Ingresos
            </button>
            <button
              onClick={() => setFiltroTipo('egreso')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroTipo === 'egreso'
                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Egresos
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Filtro por fecha */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroFecha('hoy')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroFecha === 'hoy'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFiltroFecha('semana')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroFecha === 'semana'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setFiltroFecha('mes')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroFecha === 'mes'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setFiltroFecha('todos')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroFecha === 'todos'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de movimientos */}
      {movimientosFiltrados.length === 0 ? (
        <div className="text-center py-12 card">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay movimientos registrados
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza registrando tu primer ingreso o egreso
          </p>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Movimiento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {movimientosFiltrados
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map((movimiento) => (
              <div
                key={movimiento.id}
                className={`card hover:shadow-lg transition-shadow ${
                  movimiento.tipo === 'ingreso' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-full ${
                        movimiento.tipo === 'ingreso' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {movimiento.tipo === 'ingreso' ? (
                          <TrendingUp className={`h-5 w-5 ${movimiento.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{movimiento.concepto}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatearFecha(movimiento.fecha)}
                          </span>
                          {movimiento.categoria && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {movimiento.categoria}
                            </span>
                          )}
                        </div>
                        {movimiento.descripcion && (
                          <p className="text-sm text-gray-600 mt-1">{movimiento.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        movimiento.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movimiento.tipo === 'ingreso' ? '+' : '-'} {formatearMoneda(movimiento.valor)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEliminar(movimiento.id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar movimiento"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-bold">Nuevo Movimiento</h2>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipo */}
              <div>
                <label className="label">Tipo *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.tipo === 'ingreso' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="tipo"
                      value="ingreso"
                      checked={formData.tipo === 'ingreso'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    <span className="font-medium">Ingreso</span>
                  </label>
                  <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.tipo === 'egreso' ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="tipo"
                      value="egreso"
                      checked={formData.tipo === 'egreso'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                    <span className="font-medium">Egreso</span>
                  </label>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="label">Concepto *</label>
                <input
                  type="text"
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Pago de crédito, Salario, etc."
                  required
                />
              </div>

              {/* Valor */}
              <div>
                <label className="label">Valor *</label>
                <input
                  type="number"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="label">Categoría</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIAS[formData.tipo].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="label">Fecha *</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="label">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="input-field"
                  rows="2"
                  placeholder="Detalles adicionales (opcional)"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caja;
