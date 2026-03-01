import React from 'react';

const GlobalProrrogaLoading = ({ progresoProrroga }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform scale-100 transition-transform">
                <div className="mb-8 relative flex justify-center">
                    {/* Spinner animado premium */}
                    <div className="w-28 h-28 border-[6px] border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-800">
                            {Math.round((progresoProrroga.actual / (progresoProrroga.total || 1)) * 100)}%
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Completado</span>
                    </div>
                </div>

                <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Prorrogando Clientes</h3>
                <p className="text-slate-500 font-medium mb-6">
                    Procesando: <span className="text-blue-600 font-bold">{progresoProrroga.actual}</span> de <span className="text-slate-700 font-bold">{progresoProrroga.total}</span>
                </p>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-100 rounded-full h-4 mb-4 overflow-hidden border border-slate-50">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out shadow-inner"
                        style={{ width: `${(progresoProrroga.actual / (progresoProrroga.total || 1)) * 100}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-tighter">Sincronizando con el servidor...</p>
                </div>
            </div>
        </div>
    );
};

export default GlobalProrrogaLoading;
