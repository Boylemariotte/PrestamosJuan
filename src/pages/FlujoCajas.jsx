import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearMoneda } from '../utils/creditCalculations';

const FlujoCajas = () => {
  const hoy = startOfDay(new Date());
  
  // Estado para la fecha seleccionada
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);

  // Funciones de navegación de fecha
  const irAyer = () => setFechaSeleccionada(subDays(fechaSeleccionada, 1));
  const irHoy = () => setFechaSeleccionada(hoy);
  const irMañana = () => setFechaSeleccionada(addDays(fechaSeleccionada, 1));
  const cambiarFecha = (e) => {
    const nuevaFecha = new Date(e.target.value);
    setFechaSeleccionada(startOfDay(nuevaFecha));
  };

  // Verificar si la fecha seleccionada es hoy
  const esHoy = format(fechaSeleccionada, 'yyyy-MM-dd') === format(hoy, 'yyyy-MM-dd');

  const CajaSection = ({ titulo, color, numero }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`${color} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-white" />
          <h2 className="text-xl font-bold text-white">{titulo}</h2>
        </div>
      </div>
      
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-700 to-gray-800">
                <th className="border-r border-gray-600 px-6 py-4 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">Caja</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Saldo inicial</span>
                  </div>
                </th>
                <th className="border-r border-gray-600 px-6 py-4 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">Gastos</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Egresos del día</span>
                  </div>
                </th>
                <th className="border-r border-gray-600 px-6 py-4 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">Préstamos y RF</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Créditos otorgados</span>
                  </div>
                </th>
                <th className="border-r border-gray-600 px-6 py-4 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">Por</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Por cobrar</span>
                  </div>
                </th>
                <th className="border-r border-gray-600 px-6 py-4 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">PP</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Pagos parciales</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex flex-col">
                    <span className="text-white text-base font-bold uppercase tracking-wide">E</span>
                    <span className="text-gray-300 text-xs font-normal mt-1">Efectivo final</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Fila vacía por ahora - se llenará con datos más adelante */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="border-r border-t border-gray-300 px-6 py-20 text-base text-gray-700 font-medium">
                  {/* Datos de caja */}
                </td>
                <td className="border-r border-t border-gray-300 px-6 py-20 text-base text-gray-700">
                  {/* Datos de gastos */}
                </td>
                <td className="border-r border-t border-gray-300 px-6 py-20 text-base text-gray-700">
                  {/* Datos de préstamos y RF */}
                </td>
                <td className="border-r border-t border-gray-300 px-6 py-20 text-base text-gray-700">
                  {/* Datos de Por */}
                </td>
                <td className="border-r border-t border-gray-300 px-6 py-20 text-base text-gray-700">
                  {/* Datos de PP */}
                </td>
                <td className="border-t border-gray-300 px-6 py-20 text-base text-gray-700">
                  {/* Datos de E */}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  esHoy 
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
              {format(fechaSeleccionada, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
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
        />

        <CajaSection
          titulo="Caja 2"
          color="bg-gradient-to-r from-green-600 to-green-700"
          numero={2}
        />
      </div>
    </div>
  );
};

export default FlujoCajas;

