import React from 'react';
import { Users, AlertCircle } from 'lucide-react';
import CollectionTable from './CollectionTable';
import { getBgColorClass, getFiltroBgClass } from '../utils/colorHelpers';

const CarteraSection = ({
    title,
    subtitle,
    items,
    color,
    typeFilter,
    setTypeFilter,
    isK1,
    isK2,
    isK3,
    isNoReportados,
    onCambioOrden,
    ordenFecha,
    onProrroga,
    abrirDetalle,
    actualizarCliente,
    toggleReportado,
    user
}) => {
    const showFilter = isK1 || isK2 || isK3;

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className={`${isNoReportados ? 'bg-red-600' : getBgColorClass(color)} text-white px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        {isNoReportados ? <AlertCircle className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{title}</h3>
                        <p className={`${isNoReportados ? 'text-red-100' : 'text-blue-100'} text-sm`}>
                            {subtitle || `${items.length} ${items.length === 1 ? 'cliente' : 'clientes'}`}
                            {typeFilter !== 'todos' && showFilter && ` (${typeFilter})`}
                        </p>
                    </div>
                    {showFilter && (
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
                    )}
                </div>
            </div>
            {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No hay cobros para esta sección en esta fecha</p>
                </div>
            ) : (
                <CollectionTable
                    items={items}
                    onCambioOrden={onCambioOrden}
                    ordenFecha={ordenFecha}
                    onProrroga={onProrroga}
                    abrirDetalle={abrirDetalle}
                    actualizarCliente={actualizarCliente}
                    toggleReportado={toggleReportado}
                    user={user}
                />
            )}
        </div>
    );
};

export default CarteraSection;
