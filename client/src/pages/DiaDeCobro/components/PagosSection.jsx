import React from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { formatearMoneda } from '../../../utils/creditCalculations';

const PagosSection = ({
    title,
    modalidades,
    total,
    color,
    abrirDetalle
}) => {
    // Determinar modalidades según cartera
    const esK2 = title.includes('K2');
    const ordenModalidades = esK2 ? ['quincenal', 'mensual'] : ['semanal', 'quincenal', 'mensual', 'diario'];
    const nombresModalidades = {
        semanal: 'Semanales',
        quincenal: 'Quincenales',
        mensual: 'Mensuales',
        diario: 'Diarios'
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className={`${color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : color === 'orange' ? 'bg-orange-600' : `bg-${color}-600`} text-white px-6 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{title}</h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-100 text-sm">Total Recogido</p>
                        <p className="text-2xl font-bold">{formatearMoneda(total)}</p>
                    </div>
                </div>
            </div>

            {ordenModalidades.map(modalidad => {
                const datosModalidad = modalidades[modalidad];
                if (!datosModalidad) return null;

                return (
                    <div key={modalidad} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className={`${color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : color === 'orange' ? 'bg-orange-600' : `bg-${color}-600`} text-white px-6 py-4 text-center`}>
                            <h4 className="text-xl font-bold">
                                {nombresModalidades[modalidad]}
                            </h4>
                        </div>
                        {datosModalidad.items.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm">No hay pagos registrados</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-white uppercase bg-slate-800">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 w-20 text-center">Ref. Crédito</th>
                                            <th scope="col" className="px-4 py-3">Cliente</th>
                                            <th scope="col" className="px-4 py-3 text-center">Cuota</th>
                                            <th scope="col" className="px-4 py-3 text-center">Tipo de Pago</th>
                                            <th scope="col" className="px-4 py-3 text-center">Multa</th>
                                            <th scope="col" className="px-4 py-3 text-center">Monto Pagado Multa</th>
                                            <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                                            <th scope="col" className="px-4 py-3 text-green-400 text-right">Monto Pagado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {datosModalidad.items.map((item, index) => (
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
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-xl font-bold text-green-600">
                                                        {formatearMoneda(item.montoPagado)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                            <span className="text-gray-500 text-sm">Total cobrado {nombresModalidades[modalidad].toLowerCase()} {title}</span>
                            <span className={`text-2xl font-bold ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'orange' ? 'text-orange-600' : `text-${color}-600`}`}>{formatearMoneda(datosModalidad.total)}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PagosSection;
