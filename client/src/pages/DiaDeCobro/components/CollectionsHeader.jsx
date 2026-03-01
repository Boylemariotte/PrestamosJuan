import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearMoneda } from '../../../utils/creditCalculations';

const CollectionsHeader = ({
    fechaSeleccionada,
    ciudadSeleccionada,
    setCiudadSeleccionada,
    irAyer,
    irHoy,
    irMañana,
    cambiarFecha,
    esHoy,
    fechaSeleccionadaStr,
    stats,
    totalClientesDirecto,
    clientesPagados,
    user,
    onProrrogaGlobal
}) => {
    return (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-3 rounded-lg">
                        <Calendar className="h-8 w-8 text-blue-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">Día de Cobro</h1>
                            <div className="relative">
                                <select
                                    value={ciudadSeleccionada}
                                    onChange={(e) => setCiudadSeleccionada(e.target.value)}
                                    className="appearance-none bg-gradient-to-r from-blue-600 to-purple-600 border border-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 backdrop-blur-sm transition-all duration-300 hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-400/30 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-300/70 focus:ring-offset-2 focus:ring-offset-blue-900/50 cursor-pointer pr-8"
                                >
                                    <option value="tuluá" className="bg-gray-900 text-gray-100">Tuluá</option>
                                    <option value="buga" className="bg-gray-900 text-gray-100">Buga</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-300 text-sm">
                            {format(fechaSeleccionada, "EEEE, d 'de' MMMM", { locale: es })} - {ciudadSeleccionada === 'tuluá' ? 'Carteras K1, K2' : 'Carteras K3'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {(user?.role !== 'domiciliario' || user?.ocultarProrroga === false) && (
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={onProrrogaGlobal}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-95"
                                title="Prórroga Global (todos los clientes)"
                            >
                                <Calendar className="h-4 w-4" />
                                <span className="hidden sm:inline">Prórroga global</span>
                            </button>
                        </div>
                    )}
                    <div className="flex bg-slate-700/50 rounded-lg p-1">
                        <button onClick={irAyer} className="p-2 hover:bg-white/10 rounded-md transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="relative">
                            <input
                                type="date"
                                value={fechaSeleccionadaStr}
                                onChange={cambiarFecha}
                                className="bg-transparent text-center font-bold w-32 focus:outline-none cursor-pointer h-full"
                            />
                        </div>
                        <button onClick={irMañana} className="p-2 hover:bg-white/10 rounded-md transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <button
                            onClick={irHoy}
                            className={`ml-2 px-3 text-sm font-bold rounded-md transition-colors ${esHoy ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'}`}
                        >
                            Hoy
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
                <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Por Cobrar</p>
                    <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-orange-300 break-words leading-tight">
                        {formatearMoneda(stats.pendiente)}
                    </p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0 overflow-hidden">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Recogido</p>
                    <p className="text-[10px] sm:text-xs md:text-xl lg:text-2xl font-bold text-green-300 break-words leading-tight">
                        {formatearMoneda(
                            (clientesPagados.K1?.total || 0) +
                            (clientesPagados.K2?.total || 0) +
                            (clientesPagados.K3?.total || 0)
                        )}
                    </p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 md:p-3 min-w-0">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Clientes</p>
                    <p className="text-sm md:text-xl lg:text-2xl font-bold text-blue-300">
                        {totalClientesDirecto}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CollectionsHeader;
