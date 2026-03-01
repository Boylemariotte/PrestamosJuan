import React from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { formatearMoneda } from '../../../utils/creditCalculations';
import { getFiltroBgClass } from '../utils/colorHelpers';

const PagosSection = ({
    title,
    items,
    total,
    color,
    typeFilter,
    setTypeFilter,
    abrirDetalle,
    isK1,
    isK2,
    isK3
}) => {
    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className={`${color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : 'bg-orange-600'} text-white px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{title}</h3>
                        <p className="text-blue-100 text-sm">{items.length} {items.length === 1 ? 'pago' : 'pagos'}</p>
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className={`bg-gradient-to-r ${getFiltroBgClass(color)} text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-offset-2 cursor-pointer`}
                    >
                        <option value="todos" className="bg-gray-900 text-gray-100">Todos</option>
                        {isK1 || isK3 ? <option value="semanal" className="bg-gray-900 text-gray-100">Semanal</option> : null}
                        <option value="quincenal" className="bg-gray-900 text-gray-100">Quincenal</option>
                        <option value="mensual" className="bg-gray-900 text-gray-100">Mensual</option>
                    </select>
                </div>
                <div className="text-right">
                    <p className="text-blue-100 text-sm">Total Recogido</p>
                    <p className="text-2xl font-bold">{formatearMoneda(total)}</p>
                </div>
            </div>
            {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No hay pagos registrados</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-white uppercase bg-slate-800">
                            <tr>
                                <th scope="col" className="px-4 py-3 w-20 text-center">Ref. Crédito</th>
                                <th scope="col" className="px-4 py-3">Cliente</th>
                                <th scope="col" className="px-4 py-3 text-green-400">Monto Pagado</th>
                                <th scope="col" className="px-4 py-3 text-center">Cuota</th>
                                <th scope="col" className="px-4 py-3 text-center">Tipo de Pago</th>
                                <th scope="col" className="px-4 py-3 text-center">Multa</th>
                                <th scope="col" className="px-4 py-3 text-center">Monto Pagado Multa</th>
                                <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {items.map((item, index) => (
                                <tr key={`${item.clienteId}-${item.creditoId}-${index}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 font-bold text-gray-900 text-center text-lg">
                                        {item.clientePosicion ? `#${item.clientePosicion}` : `#${item.creditoId}`}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-base">{item.clienteNombre}</span>
                                            <span className="text-gray-500 text-xs">CC: {item.clienteDocumento || 'N/A'}</span>
                                            <div className="flex items-center gap-1 text-gray-600 text-xs mt-1 font-medium">
                                                <span className="bg-yellow-100 text-yellow-800 px-1 rounded">{item.clienteTelefono || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                                                {item.clienteBarrio || 'Sin barrio'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 font-medium text-gray-900">
                                        {formatearMoneda(item.montoPagado)}
                                    </td>
                                    <td className="px-4 py-4 font-bold text-green-600 text-base text-center">
                                        {item.nroCuota ? `#${item.nroCuota}` : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {item.tipoPago ? (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.tipoPago === 'completo'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.tipoPago === 'completo' ? 'Completo' : 'Parcial'}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {item.tieneMulta ? (
                                            <span className="text-red-600 font-medium">
                                                {item.multaMotivo || 'Multa'}
                                                {item.multaFecha && <span className="block text-xs text-gray-500">({item.multaFecha})</span>}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-4 font-bold text-red-600 text-center">
                                        {item.montoPagadoMulta > 0 ? formatearMoneda(item.montoPagadoMulta) : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => abrirDetalle(item.clienteId, item.creditoId)}
                                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm"
                                        >
                                            Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PagosSection;
