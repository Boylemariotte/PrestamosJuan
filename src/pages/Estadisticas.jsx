import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle, Percent, Target, Calendar, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { determinarEstadoCredito, formatearMoneda } from '../utils/creditCalculations';

const Estadisticas = () => {
  const { clientes, movimientosCaja } = useApp();

  // Calcular estadísticas con useMemo para optimizar
  const estadisticas = useMemo(() => {
    const todosLosCreditos = clientes.flatMap(c => c.creditos || []);
  
  const creditosPorEstado = {
    activos: todosLosCreditos.filter(c => determinarEstadoCredito(c.cuotas, c) === 'activo').length,
    mora: todosLosCreditos.filter(c => determinarEstadoCredito(c.cuotas, c) === 'mora').length,
    finalizados: todosLosCreditos.filter(c => determinarEstadoCredito(c.cuotas, c) === 'finalizado').length,
  };

  const creditosPorTipo = {
    semanal: todosLosCreditos.filter(c => c.tipo === 'semanal').length,
    quincenal: todosLosCreditos.filter(c => c.tipo === 'quincenal').length,
  };

  const totalPrestado = todosLosCreditos.reduce((sum, c) => sum + c.monto, 0);
  const totalACobrar = todosLosCreditos
    .filter(c => determinarEstadoCredito(c.cuotas, c) !== 'finalizado')
    .reduce((sum, c) => sum + c.totalAPagar, 0);
  const totalCobrado = todosLosCreditos
    .filter(c => determinarEstadoCredito(c.cuotas, c) === 'finalizado')
    .reduce((sum, c) => sum + c.totalAPagar, 0);

  // Datos para gráficos
  const dataEstados = [
    { name: 'Activos', value: creditosPorEstado.activos, color: '#10b981' },
    { name: 'En Mora', value: creditosPorEstado.mora, color: '#ef4444' },
    { name: 'Finalizados', value: creditosPorEstado.finalizados, color: '#3b82f6' },
  ];

  const dataTipos = [
    { name: 'Semanal', cantidad: creditosPorTipo.semanal },
    { name: 'Quincenal', cantidad: creditosPorTipo.quincenal },
  ];

  const dataMontos = [
    { name: 'Prestado', monto: totalPrestado },
    { name: 'Cobrado', monto: totalCobrado },
    { name: 'Por Cobrar', monto: totalACobrar },
  ];

    // Calcular tasa de mora
    const creditosActivos = todosLosCreditos.filter(c => {
      const estado = determinarEstadoCredito(c.cuotas, c);
      return estado === 'activo' || estado === 'mora';
    });
    const tasaMora = creditosActivos.length > 0 
      ? (creditosPorEstado.mora / creditosActivos.length) * 100 
      : 0;

    // Calcular tasa de recuperación
    const totalCreditos = todosLosCreditos.length;
    const tasaRecuperacion = totalCreditos > 0
      ? (creditosPorEstado.finalizados / totalCreditos) * 100
      : 0;

    // Calcular rentabilidad (intereses ganados)
    const interesesGanados = todosLosCreditos.reduce((sum, c) => {
      return sum + (c.totalAPagar - c.monto);
    }, 0);

    // Calcular promedio de crédito
    const promedioCredito = totalCreditos > 0 ? totalPrestado / totalCreditos : 0;

    // Calcular clientes activos (con créditos activos o en mora)
    const clientesActivos = clientes.filter(cliente => {
      return (cliente.creditos || []).some(c => {
        const estado = determinarEstadoCredito(c.cuotas, c);
        return estado === 'activo' || estado === 'mora';
      });
    }).length;

    // Calcular total de cuotas pendientes
    const cuotasPendientes = todosLosCreditos.reduce((sum, c) => {
      return sum + c.cuotas.filter(cuota => !cuota.pagado).length;
    }, 0);

    // Calcular total de cuotas pagadas
    const cuotasPagadas = todosLosCreditos.reduce((sum, c) => {
      return sum + c.cuotas.filter(cuota => cuota.pagado).length;
    }, 0);

    // Calcular tasa de cumplimiento de pagos
    const totalCuotas = cuotasPagadas + cuotasPendientes;
    const tasaCumplimiento = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;

    // Calcular balance de caja (si hay movimientos)
    const totalIngresosCaja = (movimientosCaja || []).filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.valor, 0);
    const totalEgresosCaja = (movimientosCaja || []).filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.valor, 0);
    const balanceCaja = totalIngresosCaja - totalEgresosCaja;

    return {
      todosLosCreditos,
      creditosPorEstado,
      creditosPorTipo,
      totalPrestado,
      totalACobrar,
      totalCobrado,
      tasaMora,
      tasaRecuperacion,
      interesesGanados,
      promedioCredito,
      clientesActivos,
      cuotasPendientes,
      cuotasPagadas,
      tasaCumplimiento,
      balanceCaja,
      dataEstados,
      dataTipos,
      dataMontos
    };
  }, [clientes, movimientosCaja]);

  const COLORS = ['#10b981', '#ef4444', '#3b82f6'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-gray-600 mt-1">
          Análisis general de tu cartera de créditos
        </p>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Clientes</p>
              <p className="text-3xl font-bold mt-1">{clientes.length}</p>
              <p className="text-xs text-blue-200 mt-1">{estadisticas.clientesActivos} activos</p>
            </div>
            <Users className="h-10 w-10 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Créditos</p>
              <p className="text-3xl font-bold mt-1">{estadisticas.todosLosCreditos.length}</p>
              <p className="text-xs text-purple-200 mt-1">{estadisticas.creditosPorEstado.activos} activos</p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Cobrado</p>
              <p className="text-2xl font-bold mt-1">{formatearMoneda(estadisticas.totalCobrado)}</p>
              <p className="text-xs text-green-200 mt-1">{estadisticas.creditosPorEstado.finalizados} créditos</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Por Cobrar</p>
              <p className="text-2xl font-bold mt-1">{formatearMoneda(estadisticas.totalACobrar)}</p>
              <p className="text-xs text-orange-200 mt-1">{estadisticas.cuotasPendientes} cuotas</p>
            </div>
            <DollarSign className="h-10 w-10 text-orange-200" />
          </div>
        </div>
      </div>

      {/* KPIs Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasa de Mora</p>
              <p className="text-3xl font-bold text-red-600">{estadisticas.tasaMora.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{estadisticas.creditosPorEstado.mora} en mora</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="card border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasa de Recuperación</p>
              <p className="text-3xl font-bold text-green-600">{estadisticas.tasaRecuperacion.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{estadisticas.creditosPorEstado.finalizados} finalizados</p>
            </div>
            <Target className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="card border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasa de Cumplimiento</p>
              <p className="text-3xl font-bold text-blue-600">{estadisticas.tasaCumplimiento.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{estadisticas.cuotasPagadas} de {estadisticas.cuotasPagadas + estadisticas.cuotasPendientes}</p>
            </div>
            <Percent className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="card border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Intereses Ganados</p>
              <p className="text-2xl font-bold text-purple-600">{formatearMoneda(estadisticas.interesesGanados)}</p>
              <p className="text-xs text-gray-500 mt-1">Rentabilidad total</p>
            </div>
            <Award className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* KPIs de Análisis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-cyan-50 to-cyan-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-700 mb-1">Promedio por Crédito</p>
              <p className="text-2xl font-bold text-cyan-900">{formatearMoneda(estadisticas.promedioCredito)}</p>
              <p className="text-xs text-cyan-600 mt-1">Monto promedio prestado</p>
            </div>
            <DollarSign className="h-10 w-10 text-cyan-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-700 mb-1">Balance de Caja</p>
              <p className={`text-2xl font-bold ${estadisticas.balanceCaja >= 0 ? 'text-indigo-900' : 'text-red-600'}`}>
                {formatearMoneda(estadisticas.balanceCaja)}
              </p>
              <p className="text-xs text-indigo-600 mt-1">Ingresos - Egresos</p>
            </div>
            <BarChart3 className="h-10 w-10 text-indigo-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-pink-50 to-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-700 mb-1">Total Prestado</p>
              <p className="text-2xl font-bold text-pink-900">{formatearMoneda(estadisticas.totalPrestado)}</p>
              <p className="text-xs text-pink-600 mt-1">Capital en circulación</p>
            </div>
            <TrendingUp className="h-10 w-10 text-pink-600" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de estados */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Créditos por Estado
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={estadisticas.dataEstados}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {estadisticas.dataEstados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de tipos */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Créditos por Tipo de Pago
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={estadisticas.dataTipos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de montos */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Análisis de Montos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={estadisticas.dataMontos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatearMoneda(value)}
            />
            <Bar dataKey="monto" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla de resumen */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen Detallado
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Métrica
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total de clientes registrados
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {clientes.length}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total de créditos
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {estadisticas.todosLosCreditos.length}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Créditos activos
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  {estadisticas.creditosPorEstado.activos}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Créditos en mora
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                  {estadisticas.creditosPorEstado.mora}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Créditos finalizados
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {estadisticas.creditosPorEstado.finalizados}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total prestado
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatearMoneda(estadisticas.totalPrestado)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total cobrado
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  {formatearMoneda(estadisticas.totalCobrado)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total por cobrar
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                  {formatearMoneda(estadisticas.totalACobrar)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
