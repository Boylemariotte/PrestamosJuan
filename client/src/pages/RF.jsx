import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Search, Filter, Phone, MapPin, Award, Check, Calendar, AlertCircle, Ban, AlertOctagon, ChevronDown, Clock, Edit2, Save, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatearMoneda, determinarEstadoCredito, aplicarAbonosAutomaticamente, calcularValorPendienteCuota } from '../utils/creditCalculations';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const RF = () => {
    const navigate = useNavigate();
    const { loading, fetchData } = useApp();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCartera, setFiltroCartera] = useState('todas');
    const [clientesRF, setClientesRF] = useState([]);
    const [cargandoRF, setCargandoRF] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [tempDate, setTempDate] = useState('');

    // Definición de etiquetas
    const ETIQUETAS = {
        excelente: {
            nombre: 'Excelente',
            color: 'bg-green-100 text-green-800 border-green-300',
            icono: Award
        },
        bueno: {
            nombre: 'Bueno',
            color: 'bg-blue-100 text-blue-800 border-blue-300',
            icono: Check
        },
        atrasado: {
            nombre: 'Atrasado',
            color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            icono: Calendar
        },
        incompleto: {
            nombre: 'Incompleto',
            color: 'bg-red-100 text-red-800 border-red-300',
            icono: AlertCircle
        },
        vetado: {
            nombre: 'Vetado',
            color: 'bg-gray-800 text-white border-gray-900',
            icono: Ban
        },
        perdido: {
            nombre: 'Perdido',
            color: 'bg-rose-100 text-rose-800 border-rose-300',
            icono: AlertOctagon
        },
        'sin-etiqueta': {
            nombre: 'Sin etiqueta',
            color: 'bg-gray-100 text-gray-800 border-gray-300',
            icono: null
        }
    };

    // Cargar clientes RF
    const cargarRF = async () => {
        try {
            setCargandoRF(true);
            const response = await api.get('/clientes?rf=RF&limit=1000');
            if (response.success) {
                setClientesRF(response.data);
            }
        } catch (error) {
            console.error('Error cargando clientes RF:', error);
        } finally {
            setCargandoRF(false);
        }
    };

    useEffect(() => {
        cargarRF();
    }, []);

    // Filtrar clientes según búsqueda y filtros
    const clientesFiltrados = useMemo(() => {
        let filtrados = clientesRF;

        // Filtro por cartera
        if (filtroCartera !== 'todas') {
            filtrados = filtrados.filter(c => c.cartera === filtroCartera);
        }

        // Filtro por búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtrados = filtrados.filter(c => {
                const nombreMatch = c.nombre?.toLowerCase().includes(term);
                const documentoMatch = c.documento?.toLowerCase().includes(term);
                const telefonoMatch = c.telefono?.toLowerCase().includes(term);
                const barrioMatch = c.barrio?.toLowerCase().includes(term);
                return nombreMatch || documentoMatch || telefonoMatch || barrioMatch;
            });
        }

        return filtrados;
    }, [clientesRF, searchTerm, filtroCartera]);

    // Obtener información del crédito del cliente
    const getCreditoInfo = (cliente) => {
        if (!cliente || !cliente.creditos || cliente.creditos.length === 0) return null;
        // Obtener el último crédito o el más reciente que esté activo o en mora
        const creditoActivo = cliente.creditos.find(c => {
            const estado = determinarEstadoCredito(c.cuotas, c);
            return estado === 'activo' || estado === 'mora';
        });
        return creditoActivo || cliente.creditos[cliente.creditos.length - 1];
    };

    // Calcular saldo pendiente total del cliente (todos los créditos)
    const calcularSaldoPendienteTotal = (cliente) => {
        if (!cliente || !cliente.creditos || cliente.creditos.length === 0) {
            return 0;
        }

        let saldoTotal = 0;

        // Calcular saldo pendiente de cada crédito
        cliente.creditos.forEach(credito => {
            const { cuotasActualizadas } = aplicarAbonosAutomaticamente(credito);
            cuotasActualizadas.forEach(cuota => {
                const valorPendiente = calcularValorPendienteCuota(credito.valorCuota, cuota);
                saldoTotal += valorPendiente;
            });

            if (credito.multas && credito.multas.length > 0) {
                credito.multas.forEach(multa => {
                    const totalAbonadoMulta = (credito.abonosMulta || [])
                        .filter(abono => abono.multaId === multa.id)
                        .reduce((sum, abono) => sum + (abono.valor || 0), 0);

                    const multaPendiente = Math.max(0, (multa.valor || 0) - totalAbonadoMulta);
                    saldoTotal += multaPendiente;
                });
            }
        });

        return saldoTotal;
    };

    const toggleRF = async (cliente) => {
        const newValue = cliente.rf === 'RF' ? '' : 'RF';
        try {
            const response = await api.put(`/clientes/${cliente.id || cliente._id}`, { rf: newValue });
            if (response.success) {
                // Actualizar lista local o recargar
                if (newValue !== 'RF') {
                    // Si se quitó de RF, remover de la lista local
                    setClientesRF(prev => prev.filter(c => (c.id || c._id) !== (cliente.id || cliente._id)));
                } else {
                    await fetchData(); // Recargar si se activa (raro aquí, pero posible)
                }
            }
        } catch (error) {
            console.error('Error actualizando RF:', error);
            alert('Error al actualizar RF');
        }
    };

    const startEditingDate = (cliente) => {
        setEditingId(cliente.id || cliente._id);
        // Formatear para input datetime-local: YYYY-MM-DDThh:mm
        const dateObj = cliente.fechaRF ? new Date(cliente.fechaRF) : new Date();
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        setTempDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    };

    const cancelEditingDate = () => {
        setEditingId(null);
        setTempDate('');
    };

    const saveDate = async (cliente) => {
        try {
            const response = await api.put(`/clientes/${cliente.id || cliente._id}`, {
                rf: 'RF', // Asegurar que sigue siendo RF
                fechaRF: new Date(tempDate)
            });
            if (response.success) {
                // Actualizar en la lista local
                setClientesRF(prev => prev.map(c => {
                    if ((c.id || c._id) === (cliente.id || cliente._id)) {
                        return { ...c, fechaRF: new Date(tempDate) };
                    }
                    return c;
                }));
                setEditingId(null);
            }
        } catch (error) {
            console.error('Error actualizando fecha:', error);
            alert('Error al actualizar fecha');
        }
    };

    if (cargandoRF || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Cargando clientes RF...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-3 rounded-full">
                            <Clock className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Clientes RF</h1>
                            <p className="text-gray-600 mt-1">
                                {clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'cliente' : 'clientes'} registrados de tipo RF
                            </p>
                        </div>
                    </div>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, documento, teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <select
                                value={filtroCartera}
                                onChange={(e) => setFiltroCartera(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="todas">Todas las carteras</option>
                                <option value="K1">K1</option>
                                <option value="K2">K2</option>
                                <option value="K3">K3</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de clientes */}
            {clientesFiltrados.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Crédito
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Valor Cuota
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Saldo Pendiente
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-center">
                                    RF
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Fecha Solicitud
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clientesFiltrados.map((cliente) => {
                                const creditoInfo = getCreditoInfo(cliente);
                                const carteraRowClass = cliente.cartera === 'K1'
                                    ? 'bg-blue-100 hover:bg-blue-200'
                                    : cliente.cartera === 'K2'
                                        ? 'bg-green-100 hover:bg-green-200'
                                        : cliente.cartera === 'K3'
                                            ? 'bg-orange-100 hover:bg-orange-200'
                                            : 'hover:bg-gray-50';

                                return (
                                    <tr
                                        key={cliente.id || cliente._id}
                                        className={carteraRowClass}
                                    >
                                        <td className="px-4 py-4 text-sm text-gray-500">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{cliente.nombre}</span>
                                                <span className="text-xs text-gray-500">CC: {cliente.documento}</span>
                                                <span className="flex items-center gap-1 text-gray-500 text-sm">
                                                    <Phone className="h-3 w-3" /> {cliente.telefono}
                                                </span>
                                                {cliente.barrio && (
                                                    <span className="text-xs flex items-center gap-1 text-gray-600 font-medium">
                                                        <MapPin className="h-3 w-3" /> {cliente.barrio}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {creditoInfo ? formatearMoneda(creditoInfo.monto) : '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                            {creditoInfo ? formatearMoneda(creditoInfo.valorCuota) : '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatearMoneda(calcularSaldoPendienteTotal(cliente))}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                            <div className="relative flex justify-center">
                                                <button
                                                    onClick={() => toggleRF(cliente)}
                                                    className={`px-3 py-1.5 text-sm border rounded-md transition-all flex items-center gap-1 min-w-[80px] justify-between focus:outline-none focus:ring-2 focus:ring-offset-1 ${cliente.rf === 'RF'
                                                        ? 'bg-purple-700 border-purple-800 text-white hover:bg-purple-800 focus:ring-purple-500'
                                                        : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50 focus:ring-blue-500'
                                                        }`}
                                                    title={cliente.rf === 'RF' ? 'Quitar RF' : 'Marcar como RF'}
                                                >
                                                    <span className="font-bold">
                                                        {cliente.rf === 'RF' ? 'RF' : '-'}
                                                    </span>
                                                    <ChevronDown className={`h-4 w-4 ${cliente.rf === 'RF' ? 'text-white' : 'text-gray-400'}`} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {editingId === (cliente.id || cliente._id) ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="datetime-local"
                                                        value={tempDate}
                                                        onChange={(e) => setTempDate(e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                    />
                                                    <button onClick={() => saveDate(cliente)} className="text-green-600 hover:text-green-800">
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={cancelEditingDate} className="text-red-500 hover:text-red-700">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 group">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        {cliente.fechaRF ? format(new Date(cliente.fechaRF), 'dd/MM/yyyy HH:mm', { locale: es }) : '-'}
                                                    </div>
                                                    <button
                                                        onClick={() => startEditingDate(cliente)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600"
                                                        title="Editar fecha"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/cliente/${cliente.id || cliente._id}`)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-md">
                    <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay clientes RF
                    </h3>
                    <p className="text-gray-600">
                        {searchTerm || filtroCartera !== 'todas'
                            ? 'No se encontraron clientes con los filtros aplicados'
                            : 'Los clientes marcados como RF aparecerán aquí'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default RF;
