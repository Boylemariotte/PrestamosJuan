import React from 'react';
import { Calendar, Phone, MapPin, ChevronDown } from 'lucide-react';
import { formatearMoneda, formatearFechaCorta } from '../../../utils/creditCalculations';
import OrdenInput from './OrdenInput';

const CollectionTable = ({
    items,
    onCambioOrden,
    ordenFecha,
    onProrroga,
    abrirDetalle,
    actualizarCliente,
    toggleReportado,
    user
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-white uppercase bg-slate-800">
                    <tr>
                        <th scope="col" className="px-2 py-3 w-16 text-center">#</th>
                        <th scope="col" className="px-4 py-3 w-24 text-center">Orden</th>
                        <th scope="col" className="px-4 py-3 w-20 text-center">Ref. Crédito</th>
                        <th scope="col" className="px-4 py-3">Cliente</th>
                        <th scope="col" className="px-4 py-3">Crédito</th>
                        <th scope="col" className="px-4 py-3 text-green-400">Valor Cuota</th>
                        <th scope="col" className="px-4 py-3">Saldo Pendiente (Cuota)</th>
                        <th scope="col" className="px-4 py-3">Saldo Pendiente (Total)</th>
                        <th scope="col" className="px-4 py-3">Vencido</th>
                        <th scope="col" className="px-4 py-3">Modalidad</th>
                        <th scope="col" className="px-4 py-3 text-center">RF</th>
                        <th scope="col" className="px-4 py-3 text-center">Reportado</th>
                        <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {items
                        .map((item, index) => {
                            const numeroLista = index + 1;
                            const rawOrden = ordenFecha[item.clienteId];
                            const valorOrden = rawOrden === undefined || rawOrden === null ? '' : String(rawOrden);

                            let carteraRowClass = item.clienteCartera === 'K2'
                                ? 'bg-green-100 hover:bg-green-200 border-b'
                                : item.clienteCartera === 'K3'
                                    ? 'bg-orange-100 hover:bg-orange-200 border-b'
                                    : 'bg-blue-100 hover:bg-blue-200 border-b';

                            if (item.clienteRF === 'RF') {
                                carteraRowClass = 'bg-purple-100 hover:bg-purple-200 border-b';
                            }
                            
                            if (item.tieneAbonoParcialHoy) {
                                carteraRowClass = 'bg-yellow-100 hover:bg-yellow-200 border-b';
                            }

                            return (
                                <tr key={`${item.clienteId}-${item.creditoId}-${index}`} className={carteraRowClass}>
                                    <td className="px-2 py-4 font-bold text-gray-900 text-center text-base">
                                        {numeroLista}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <OrdenInput
                                            valorInicial={valorOrden}
                                            onGuardar={(nuevoValor) => onCambioOrden(item.clienteId, nuevoValor)}
                                        />
                                    </td>
                                    <td className="px-4 py-4 font-bold text-gray-900 text-center text-lg">
                                        {item.clientePosicion ? `#${item.clientePosicion}` : `#${item.creditoId}`}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-base">{item.clienteNombre}</span>
                                            <span className="text-gray-500 text-xs">CC: {item.clienteDocumento || 'N/A'}</span>
                                            <div className="flex items-center gap-1 text-gray-600 text-xs mt-1 font-medium">
                                                <Phone className="h-3 w-3" />
                                                <span className="bg-yellow-100 text-yellow-800 px-1 rounded">{item.clienteTelefono}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {item.clienteBarrio || 'Sin barrio'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 font-medium text-gray-900">
                                        {formatearMoneda(item.creditoMonto)}
                                    </td>
                                    <td className="px-4 py-4 font-bold text-green-600 text-base">
                                        {item.tipo === 'pendiente'
                                            ? formatearMoneda(item.valorMostrar)
                                            : item.tipo === 'cobrado'
                                                ? <span className="text-green-600">Pagado ({formatearMoneda(item.valorMostrar)})</span>
                                                : <span className="text-yellow-600">Abonado ({formatearMoneda(item.valorMostrar)})</span>
                                        }
                                    </td>
                                    <td className="px-4 py-4 font-medium text-orange-600">
                                        {item.tipo === 'cobrado' ? '-' : formatearMoneda(item.valorRealACobrar)}
                                    </td>
                                    <td className="px-4 py-4 font-medium text-gray-900">
                                        {formatearMoneda(item.saldoTotalCredito)}
                                    </td>
                                    <td className="px-4 py-4">
                                        {item.cuotasVencidasCount > 0 ? (
                                            <div className="text-red-600 font-bold">
                                                (SI) - <span className="text-xs">{formatearFechaCorta(item.primerCuotaVencidaFecha)}</span>
                                                {item.cuotasVencidasCount > 1 && (
                                                    <div className="text-xs text-red-500 mt-0.5 font-normal">
                                                        ({item.cuotasVencidasCount} cuotas)
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-green-600 font-medium">Al día</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 capitalize">
                                        {item.creditoTipo}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="relative flex justify-center">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const currentValue = item.clienteRF || '';
                                                    const newValue = currentValue === 'RF' ? '' : 'RF';
                                                    try {
                                                        await actualizarCliente(item.clienteId, {
                                                            rf: newValue,
                                                            tieneBotonRenovacion: newValue === 'RF'
                                                        });
                                                    } catch (error) {
                                                        console.error('Error actualizando RF:', error);
                                                        alert('Error al actualizar RF');
                                                    }
                                                }}
                                                className={`px-3 py-1.5 text-sm border rounded-md transition-all flex items-center gap-1 min-w-[70px] justify-between focus:outline-none focus:ring-2 focus:ring-offset-1 ${item.clienteRF === 'RF'
                                                    ? 'bg-purple-700 border-purple-800 text-white hover:bg-purple-800 focus:ring-purple-500'
                                                    : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50 focus:ring-blue-500'
                                                    }`}
                                            >
                                                <span className="font-bold">
                                                    {item.clienteRF === 'RF' ? 'RF' : '-'}
                                                </span>
                                                <ChevronDown className={`h-4 w-4 ${item.clienteRF === 'RF' ? 'text-white' : 'text-gray-400'}`} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleReportado(item.clienteId, item.reportado);
                                            }}
                                            className={`px-3 py-1.5 text-sm border rounded-md font-bold transition-all min-w-[70px] ${item.reportado !== false
                                                ? 'bg-green-600 border-green-700 text-white hover:bg-green-700'
                                                : 'bg-red-600 border-red-700 text-white hover:bg-red-700'
                                                }`}
                                        >
                                            {item.reportado !== false ? 'Reportado' : 'No encontrado'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={() => abrirDetalle(item.clienteId, item.creditoId)}
                                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm"
                                            >
                                                Ver Detalle
                                            </button>
                                            <div className="flex items-center gap-1 mt-1">
                                                {(user?.role !== 'domiciliario' || user?.ocultarProrroga === false) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onProrroga(item)}
                                                        className="p-1 rounded-full border border-slate-300 bg-slate-50 hover:bg-slate-100"
                                                        title="Prorrogar fecha"
                                                    >
                                                        <Calendar className="h-4 w-4 text-slate-700" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                </tbody>
            </table>
        </div>
    );
};

export default CollectionTable;
