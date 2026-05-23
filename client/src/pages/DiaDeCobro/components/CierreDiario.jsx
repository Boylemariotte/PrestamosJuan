import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Scale, Wallet, Receipt, CheckCircle } from 'lucide-react';
import { formatearMoneda } from '../../../utils/creditCalculations';
import { toast } from 'react-toastify';

const CierreDiario = ({ clientesPagados, fechaSeleccionadaStr, ciudadSeleccionada }) => {
    // Determinar qué carteras mostrar según la ciudad
    const esBuga = ciudadSeleccionada === 'Guadalajara de Buga';
    
    // 1. Obtener cobros brutos según la ciudad
    const totalK1 = esBuga ? 0 : (clientesPagados?.K1?.total || 0);
    const totalK2 = esBuga ? 0 : (clientesPagados?.K2?.total || 0);
    const totalK3 = clientesPagados?.K3?.total || 0;

    // Desglose K1 (solo si no es Buga)
    const k1Semanal = esBuga ? 0 : (clientesPagados?.K1?.modalidades?.semanal?.total || 0);
    const k1Quincenal = esBuga ? 0 : (clientesPagados?.K1?.modalidades?.quincenal?.total || 0);
    const k1Mensual = esBuga ? 0 : (clientesPagados?.K1?.modalidades?.mensual?.total || 0);
    const k1Diario = esBuga ? 0 : (clientesPagados?.K1?.modalidades?.diario?.total || 0);

    // Desglose K2 (solo si no es Buga)
    const k2Quincenal = esBuga ? 0 : (clientesPagados?.K2?.modalidades?.quincenal?.total || 0);
    const k2Mensual = esBuga ? 0 : (clientesPagados?.K2?.modalidades?.mensual?.total || 0);

    // Desglose K3 (solo si es Buga)
    const k3Semanal = esBuga ? (clientesPagados?.K3?.modalidades?.semanal?.total || 0) : 0;
    const k3Quincenal = esBuga ? (clientesPagados?.K3?.modalidades?.quincenal?.total || 0) : 0;
    const k3Mensual = esBuga ? (clientesPagados?.K3?.modalidades?.mensual?.total || 0) : 0;
    const k3Diario = esBuga ? (clientesPagados?.K3?.modalidades?.diario?.total || 0) : 0;

    // 2. Estados para el formulario de Gastos
    const [gastos, setGastos] = useState([]);
    const [carteraSeleccionada, setCarteraSeleccionada] = useState(esBuga ? 'K3' : 'K1');
    const [montoGastoStr, setMontoGastoStr] = useState('');
    const [motivoGasto, setMotivoGasto] = useState('');

    // Cargar gastos guardados para la fecha seleccionada
    useEffect(() => {
        const savedGastos = localStorage.getItem('gastos_cierres_diarios');
        if (savedGastos) {
            try {
                const parsed = JSON.parse(savedGastos);
                const gastosFecha = parsed[fechaSeleccionadaStr];
                if (gastosFecha) {
                    setGastos(gastosFecha);
                } else {
                    setGastos([]);
                }
            } catch (e) {
                console.error('Error al cargar gastos:', e);
            }
        } else {
            setGastos([]);
        }
        // Limpiar formulario al cambiar de fecha
        setMontoGastoStr('');
        setMotivoGasto('');
    }, [fechaSeleccionadaStr]);

    // Guardar lista de gastos en localStorage
    const guardarGastosEnStorage = (nuevosGastos) => {
        try {
            const savedGastos = localStorage.getItem('gastos_cierres_diarios');
            const parsed = savedGastos ? JSON.parse(savedGastos) : {};
            parsed[fechaSeleccionadaStr] = nuevosGastos;
            localStorage.setItem('gastos_cierres_diarios', JSON.stringify(parsed));
            setGastos(nuevosGastos);
        } catch (e) {
            console.error('Error al guardar gastos:', e);
            toast.error('Error al guardar el gasto.');
        }
    };

    // Agregar un gasto nuevo
    const handleAgregarGasto = (e) => {
        e.preventDefault();
        const monto = parseFloat(montoGastoStr);
        if (isNaN(monto) || monto <= 0) {
            toast.warning('Por favor ingresa un valor de gasto válido mayor a 0.');
            return;
        }
        if (!motivoGasto.trim()) {
            toast.warning('Por favor escribe el motivo o descripción del gasto.');
            return;
        }

        const nuevoGasto = {
            id: Date.now().toString(),
            cartera: carteraSeleccionada,
            monto,
            descripcion: motivoGasto.trim(),
            fechaRegistro: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const nuevosGastos = [...gastos, nuevoGasto];
        guardarGastosEnStorage(nuevosGastos);
        
        // Limpiar campos de entrada
        setMontoGastoStr('');
        setMotivoGasto('');
        toast.success(`Gasto de ${formatearMoneda(monto)} agregado a la cartera ${carteraSeleccionada}`);
    };

    // Eliminar un gasto
    const handleEliminarGasto = (gastoId) => {
        if (window.confirm('¿Deseas eliminar este gasto registrado?')) {
            const nuevosGastos = gastos.filter(g => g.id !== gastoId);
            guardarGastosEnStorage(nuevosGastos);
            toast.info('Gasto eliminado correctamente.');
        }
    };

    // 3. Cálculos de Totales y Gastos
    const totalGastosK1 = gastos
        .filter(g => g.cartera === 'K1')
        .reduce((sum, g) => sum + g.monto, 0);

    const totalGastosK2 = gastos
        .filter(g => g.cartera === 'K2')
        .reduce((sum, g) => sum + g.monto, 0);

    const totalGastosK3 = gastos
        .filter(g => g.cartera === 'K3')
        .reduce((sum, g) => sum + g.monto, 0);

    const totalK1Neto = Math.max(0, totalK1 - totalGastosK1);
    const totalK2Neto = Math.max(0, totalK2 - totalGastosK2);
    const totalK3Neto = Math.max(0, totalK3 - totalGastosK3);
    
    // Suma del total neto según la ciudad
    const totalCobradoNeto = esBuga ? totalK3Neto : (totalK1Neto + totalK2Neto);
    
    return (
        <div className="mt-16 border-t-4 border-gray-200 pt-16 pb-12">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden max-w-6xl mx-auto">
                
                {/* Header Premium y Ampliado */}
                <div className="bg-slate-800 text-white px-10 py-7 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-5">
                        <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                            <Scale className="h-9 w-9 text-slate-100" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black uppercase tracking-wide">Cierre de Caja y Egresos</h3>
                            <p className="text-slate-300 text-base font-semibold mt-1">Balance neto con deducción de gastos del día</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm uppercase font-black tracking-widest">{esBuga ? 'Total Neto K3' : 'Total Neto K1 + K2'}</p>
                        <p className="text-4xl sm:text-5xl font-black text-green-400 font-mono mt-1 drop-shadow-md">{formatearMoneda(totalCobradoNeto)}</p>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    
                    {/* Gran Tarjeta de Cierre Neto Ampliada */}
                    <div className="bg-slate-50 rounded-2xl p-8 border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 shadow-sm">
                        <div className="space-y-2">
                            <span className="text-sm sm:text-base font-black text-gray-500 uppercase tracking-widest block">{esBuga ? 'Total Cobrado Neto (K3 - Gastos)' : 'Total Cobrado Neto (K1 + K2 - Gastos)'}</span>
                            <span className="text-5xl sm:text-6xl font-black text-gray-900 font-mono tracking-tight block">
                                {formatearMoneda(totalCobradoNeto)}
                            </span>
                        </div>
                        <div className="bg-green-100 border-2 border-green-300 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-md hover:scale-105 transition-all duration-300">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <span className="text-green-900 text-lg font-extrabold uppercase tracking-wider">Cierre Cuadrado</span>
                        </div>
                    </div>

                    {/* Fila 2: K1 y K2 lado a lado (solo si no es Buga) o K3 (solo si es Buga) */}
                    {!esBuga ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            
                            {/* Cartera K1 (Cabecera Colorizada y Fuentes Grandes) */}
                            <div className="bg-white rounded-3xl border-2 border-blue-100 shadow-xl overflow-hidden flex flex-col justify-between transform hover:translate-y-[-4px] transition-all duration-300">
                                <div className="space-y-6 p-8">
                                    {/* Cabecera estilizada con color de cartera */}
                                    <div className="bg-blue-600 text-white rounded-2xl px-6 py-4.5 flex items-center justify-between shadow-lg">
                                        <span className="text-2xl font-black tracking-widest uppercase">Cartera K1</span>
                                        <span className="text-sm sm:text-base bg-white/20 text-white font-black px-4 py-2 rounded-full border border-white/30 backdrop-blur-sm shadow-inner">
                                            Bruto: {formatearMoneda(totalK1)}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-5 text-lg sm:text-xl text-gray-800 px-2">
                                        <div className="flex justify-between items-center py-2 border-b-2 border-gray-50">
                                            <span className="font-extrabold text-gray-550 uppercase tracking-wide text-sm sm:text-base">K1 Semanal:</span>
                                            <span className="font-mono font-black text-gray-950 text-xl sm:text-2xl">{formatearMoneda(k1Semanal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b-2 border-gray-50">
                                            <span className="font-extrabold text-gray-550 uppercase tracking-wide text-sm sm:text-base">K1 Quincenal:</span>
                                            <span className="font-mono font-black text-gray-950 text-xl sm:text-2xl">{formatearMoneda(k1Quincenal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b-2 border-gray-50">
                                            <span className="font-extrabold text-gray-550 uppercase tracking-wide text-sm sm:text-base">K1 Mensual:</span>
                                            <span className="font-mono font-black text-gray-950 text-xl sm:text-2xl">{formatearMoneda(k1Mensual)}</span>
                                        </div>
                                        {k1Diario > 0 && (
                                            <div className="flex justify-between items-center py-2 text-gray-400 border-t border-dashed border-gray-300 pt-3">
                                                <span className="font-extrabold uppercase tracking-wide text-sm sm:text-base italic">K1 Diario:</span>
                                                <span className="font-mono font-bold text-lg sm:text-xl">{formatearMoneda(k1Diario)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Resumen y Deducción Gastos K1 */}
                                <div className="bg-slate-50 p-8 border-t-2 border-gray-100 space-y-4">
                                    <div className="flex justify-between items-center text-gray-650 text-base font-bold">
                                        <span>Total Recogido K1:</span>
                                        <span className="font-mono font-black text-lg">{formatearMoneda(totalK1)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-red-600 text-base font-bold">
                                        <span>Gastos K1:</span>
                                        <span className="font-mono font-black text-lg">-{formatearMoneda(totalGastosK1)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t-2 border-gray-200 pt-4 text-gray-900">
                                        <span className="font-black text-base sm:text-lg tracking-wider">TOTAL K1 NETO:</span>
                                        <span className="font-mono text-blue-700 text-2xl sm:text-3xl font-black">{formatearMoneda(totalK1Neto)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cartera K2 (Cabecera Colorizada y Fuentes Grandes) */}
                            <div className="bg-white rounded-3xl border-2 border-green-100 shadow-xl overflow-hidden flex flex-col justify-between transform hover:translate-y-[-4px] transition-all duration-300">
                                <div className="space-y-6 p-8">
                                    {/* Cabecera estilizada con color de cartera */}
                                    <div className="bg-green-600 text-white rounded-2xl px-6 py-4.5 flex items-center justify-between shadow-lg">
                                        <span className="text-2xl font-black tracking-widest uppercase">Cartera K2</span>
                                        <span className="text-sm sm:text-base bg-white/20 text-white font-black px-4 py-2 rounded-full border border-white/30 backdrop-blur-sm shadow-inner">
                                            Bruto: {formatearMoneda(totalK2)}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-5 text-lg sm:text-xl text-gray-800 px-2">
                                        <div className="flex justify-between items-center py-2 border-b-2 border-gray-50">
                                            <span className="font-extrabold text-gray-550 uppercase tracking-wide text-sm sm:text-base">K2 Quincenal:</span>
                                            <span className="font-mono font-black text-gray-950 text-xl sm:text-2xl">{formatearMoneda(k2Quincenal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b-2 border-gray-50">
                                            <span className="font-extrabold text-gray-550 uppercase tracking-wide text-sm sm:text-base">K2 Mensual:</span>
                                            <span className="font-mono font-black text-gray-950 text-xl sm:text-2xl">{formatearMoneda(k2Mensual)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Resumen y Deducción Gastos K2 */}
                                <div className="bg-slate-50 p-8 border-t-2 border-gray-100 space-y-4">
                                    <div className="flex justify-between items-center text-gray-650 text-base font-bold">
                                        <span>Total Recogido K2:</span>
                                        <span className="font-mono font-black text-lg">{formatearMoneda(totalK2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-red-600 text-base font-bold">
                                        <span>Gastos K2:</span>
                                        <span className="font-mono font-black text-lg">-{formatearMoneda(totalGastosK2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t-2 border-gray-200 pt-4 text-gray-900">
                                        <span className="font-black text-base sm:text-lg tracking-wider">TOTAL K2 NETO:</span>
                                        <span className="font-mono text-green-700 text-2xl sm:text-3xl font-black">{formatearMoneda(totalK2Neto)}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* Cartera K3 (solo para Buga) */
                        <div className="grid grid-cols-1 gap-10">
                            <div className="bg-white rounded-3xl border-2 border-orange-100 shadow-xl overflow-hidden flex flex-col justify-between transform hover:translate-y-[-4px] transition-all duration-300">
                                <div className="space-y-6 p-8">
                                    {/* Cabecera estilizada con color de cartera */}
                                    <div className="bg-orange-600 text-white rounded-2xl px-6 py-4.5 flex items-center justify-between shadow-lg">
                                        <span className="text-2xl font-black tracking-widest uppercase">Cartera K3</span>
                                        <span className="text-sm sm:text-base bg-white/20 text-white font-black px-4 py-2 rounded-full border border-white/30 backdrop-blur-sm shadow-inner">
                                            Bruto: {formatearMoneda(totalK3)}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-5 text-lg sm:text-xl text-gray-800 px-2">
                                        <div className="flex justify-between items-center py-2 border-b-2 border-gray-50">
                                            <span className="font-extrabold text-gray-550 uppercase tracking-wide text-sm sm:text-base">K3 Semanal:</span>
                                            <span className="font-mono font-black text-gray-950 text-xl sm:text-2xl">{formatearMoneda(k3Semanal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b-2 border-gray-50">
                                            <span className="font-extrabold text-gray-550 uppercase tracking-wide text-sm sm:text-base">K3 Quincenal:</span>
                                            <span className="font-mono font-black text-gray-950 text-xl sm:text-2xl">{formatearMoneda(k3Quincenal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b-2 border-gray-50">
                                            <span className="font-extrabold text-gray-550 uppercase tracking-wide text-sm sm:text-base">K3 Mensual:</span>
                                            <span className="font-mono font-black text-gray-950 text-xl sm:text-2xl">{formatearMoneda(k3Mensual)}</span>
                                        </div>
                                        {k3Diario > 0 && (
                                            <div className="flex justify-between items-center py-2 text-gray-400 border-t border-dashed border-gray-300 pt-3">
                                                <span className="font-extrabold uppercase tracking-wide text-sm sm:text-base italic">K3 Diario:</span>
                                                <span className="font-mono font-bold text-lg sm:text-xl">{formatearMoneda(k3Diario)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Resumen y Deducción Gastos K3 */}
                                <div className="bg-slate-50 p-8 border-t-2 border-gray-100 space-y-4">
                                    <div className="flex justify-between items-center text-gray-650 text-base font-bold">
                                        <span>Total Recogido K3:</span>
                                        <span className="font-mono font-black text-lg">{formatearMoneda(totalK3)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-red-600 text-base font-bold">
                                        <span>Gastos K3:</span>
                                        <span className="font-mono font-black text-lg">-{formatearMoneda(totalGastosK3)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t-2 border-gray-200 pt-4 text-gray-900">
                                        <span className="font-black text-base sm:text-lg tracking-wider">TOTAL K3 NETO:</span>
                                        <span className="font-mono text-orange-700 text-2xl sm:text-3xl font-black">{formatearMoneda(totalK3Neto)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fila 3: Sección de Añadir Gastos y Detalle de Gastos lado a lado */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                        
                        {/* Añadir Gastos del Día */}
                        <div className="bg-slate-50 rounded-3xl p-8 border-2 border-gray-200 flex flex-col justify-between shadow-xl">
                            
                            <form onSubmit={handleAgregarGasto} className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-4 mb-3">
                                    <Wallet className="h-7 w-7 text-gray-700" />
                                    <h4 className="text-lg font-black text-gray-800 uppercase tracking-wider">Añadir Gastos</h4>
                                </div>

                                {/* Selector de Cartera */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                                        Seleccionar Cartera
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {!esBuga ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setCarteraSeleccionada('K1')}
                                                    className={`py-4 px-5 rounded-2xl font-black text-base border-2 transition-all duration-200 ${
                                                        carteraSeleccionada === 'K1'
                                                            ? 'bg-blue-600 border-blue-700 text-white shadow-lg scale-102'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                    }`}
                                                >
                                                    Cartera K1
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCarteraSeleccionada('K2')}
                                                    className={`py-4 px-5 rounded-2xl font-black text-base border-2 transition-all duration-200 ${
                                                        carteraSeleccionada === 'K2'
                                                            ? 'bg-green-600 border-green-700 text-white shadow-lg scale-102'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                    }`}
                                                >
                                                    Cartera K2
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setCarteraSeleccionada('K3')}
                                                className={`py-4 px-5 rounded-2xl font-black text-base border-2 transition-all duration-200 ${
                                                    carteraSeleccionada === 'K3'
                                                        ? 'bg-orange-600 border-orange-700 text-white shadow-lg scale-102'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                            >
                                                Cartera K3
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Monto del Gasto */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                                        Valor del Gasto ($)
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400" />
                                        <input
                                            type="number"
                                            placeholder="Ej: 50000"
                                            value={montoGastoStr}
                                            onChange={(e) => setMontoGastoStr(e.target.value)}
                                            className="w-full pl-12 pr-5 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-800 font-mono font-black text-xl shadow-inner"
                                        />
                                    </div>
                                </div>

                                {/* Motivo o Descripción */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                                        Motivo del Gasto
                                    </label>
                                    <textarea
                                        placeholder="Ej: Gasolina, Almuerzo cobrador, Papelería..."
                                        value={motivoGasto}
                                        onChange={(e) => setMotivoGasto(e.target.value)}
                                        rows="4"
                                        className="w-full p-5 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-800 text-lg shadow-inner"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black text-base py-4.5 rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.02] uppercase tracking-wider flex items-center justify-center gap-3"
                                >
                                    <Plus className="h-6 w-6 text-white" />
                                    Agregar Gasto
                                </button>
                            </form>

                            {/* Indicador de Ayuda */}
                            <div className="mt-8 bg-slate-200/50 rounded-2xl p-5 text-sm text-gray-600 border border-slate-350/20">
                                <p className="font-black text-gray-700 mb-1.5 flex items-center gap-1">💡 Información útil:</p>
                                Los gastos registrados aquí se restarán directamente del cobro bruto de la cartera seleccionada para calcular el balance neto al final de la jornada.
                            </div>

                        </div>

                        {/* Listado de Gastos Registrados / Estado Vacío */}
                        {gastos.length > 0 ? (
                            <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-5 shadow-md flex flex-col justify-between">
                                <div className="space-y-5">
                                    <h4 className="text-lg font-black text-gray-800 uppercase tracking-wider flex items-center gap-3">
                                        <Receipt className="h-6 w-6 text-gray-500 animate-bounce" />
                                        Detalle de Gastos Registrados ({gastos.length})
                                    </h4>
                                    <div className="divide-y-2 divide-gray-550 max-h-[360px] overflow-y-auto pr-3">
                                        {gastos.map((g) => (
                                            <div key={g.id} className="py-4 flex items-center justify-between gap-4 text-lg hover:bg-slate-50 px-4 rounded-2xl transition-all duration-200">
                                                <div className="flex items-start gap-4">
                                                    <span className={`px-3.5 py-1.5 text-xs font-black rounded-full border mt-1 shadow-sm ${
                                                        g.cartera === 'K1' 
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                            : 'bg-green-50 text-green-700 border-green-200'
                                                    }`}>
                                                        {g.cartera}
                                                    </span>
                                                    <div>
                                                        <p className="font-extrabold text-gray-800 text-base sm:text-lg">{g.descripcion}</p>
                                                        <span className="text-gray-400 text-xs font-bold mt-1 block">Registrado a las {g.fechaRegistro}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-5">
                                                    <span className="font-mono font-black text-red-600 text-xl sm:text-2xl">
                                                        -{formatearMoneda(g.monto)}
                                                    </span>
                                                    <button
                                                        onClick={() => handleEliminarGasto(g.id)}
                                                        className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                                                        title="Eliminar gasto"
                                                    >
                                                        <Trash2 className="h-6 w-6" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-8 bg-slate-550 rounded-2xl p-5 text-sm text-gray-500 border border-gray-150">
                                    Resumen de egresos registrados en este día.
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-300 p-8 space-y-5 shadow-inner flex flex-col justify-center items-center text-center min-h-[400px]">
                                <div className="bg-slate-100 p-6 rounded-full text-slate-400 mb-2">
                                    <Receipt className="h-12 w-12" />
                                </div>
                                <h4 className="text-xl font-black text-gray-800 uppercase tracking-wider">Detalle de Gastos</h4>
                                <p className="text-gray-500 text-base max-w-sm font-semibold leading-relaxed">
                                    No se han registrado egresos para la cartera K1 o K2 en esta fecha. Los gastos que agregues en el formulario de al lado aparecerán aquí en tiempo real.
                                </p>
                            </div>
                        )}

                    </div>

                </div>

            </div>
        </div>
    );
};

export default CierreDiario;
