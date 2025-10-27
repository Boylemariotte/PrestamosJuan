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
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-2">Total Ingresos</p>
              <p className="text-3xl font-bold text-white">{formatearMoneda(totalIngresos)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium mb-2">Total Egresos</p>
              <p className="text-3xl font-bold text-white">{formatearMoneda(totalEgresos)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <TrendingDown className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 transform hover:-translate-y-1`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${balance >= 0 ? 'text-blue-100' : 'text-orange-100'} text-sm font-medium mb-2`}>Balance</p>
              <p className="text-3xl font-bold text-white">{formatearMoneda(balance)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Filtros:</span>
          </div>

          {/* Filtro por tipo */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filtroTipo === 'todos'
                  ? 'bg-purple-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('ingreso')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filtroTipo === 'ingreso'
                  ? 'bg-green-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              Ingresos
            </button>
            <button
              onClick={() => setFiltroTipo('egreso')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filtroTipo === 'egreso'
                  ? 'bg-red-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              Egresos
            </button>
          </div>

          <div className="h-8 w-px bg-gray-300"></div>

          {/* Filtro por fecha */}
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroFecha('hoy')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filtroFecha === 'hoy'
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFiltroFecha('semana')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filtroFecha === 'semana'
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setFiltroFecha('mes')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filtroFecha === 'mes'
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setFiltroFecha('todos')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filtroFecha === 'todos'
                  ? 'bg-blue-500 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de movimientos */}
      {movimientosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
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
        <div className="space-y-4">
          {movimientosFiltrados
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map((movimiento) => (
              <div
                key={movimiento.id}
                className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-l-4 ${
                  movimiento.tipo === 'ingreso' ? 'border-green-500' : 'border-red-500'
                } transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        movimiento.tipo === 'ingreso' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {movimiento.tipo === 'ingreso' ? (
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{movimiento.concepto}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                            <Calendar className="h-4 w-4" />
                            {formatearFecha(movimiento.fecha)}
                          </span>
                          {movimiento.categoria && (
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              movimiento.tipo === 'ingreso' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {movimiento.categoria}
                            </span>
                          )}
                        </div>
                        {movimiento.descripcion && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">{movimiento.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${
                        movimiento.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movimiento.tipo === 'ingreso' ? '+' : '-'} {formatearMoneda(movimiento.valor)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEliminar(movimiento.id)}
                      className="text-red-500 hover:text-white hover:bg-red-500 p-3 rounded-xl transition-all duration-200 hover:shadow-md"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold">Nuevo Movimiento</h2>
              </div>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.tipo === 'ingreso' 
                      ? 'border-green-500 bg-green-50 shadow-md transform scale-105' 
                      : 'border-gray-300 hover:border-green-300 hover:bg-green-50/50'
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
                    <span className="font-semibold text-gray-700">Ingreso</span>
                  </label>
                  <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.tipo === 'egreso' 
                      ? 'border-red-500 bg-red-50 shadow-md transform scale-105' 
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50/50'
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
                    <span className="font-semibold text-gray-700">Egreso</span>
                  </label>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Concepto *</label>
                <input
                  type="text"
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Ej: Pago de crédito, Salario, etc."
                  required
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Valor *</label>
                <input
                  type="number"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="0"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white"
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIAS[formData.tipo].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha *</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                  rows="3"
                  placeholder="Detalles adicionales (opcional)"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 hover:shadow-md"
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
