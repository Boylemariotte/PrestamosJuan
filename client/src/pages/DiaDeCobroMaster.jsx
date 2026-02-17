import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays, addDays, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, ChevronDown, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VistaTuluá from '../components/DiaDeCobro/VistaTuluá';
import VistaBuga from '../components/DiaDeCobro/VistaBuga';
import api, { prorrogaService, ordenCobroService } from '../services/api';
import { toast } from 'react-toastify';

// Componente de input local para evitar re-renderizados mientras se escribe
const OrdenInput = ({ valorInicial, onGuardar }) => {
  const [valor, setValor] = useState(valorInicial);

  useEffect(() => {
    setValor(valorInicial);
  }, [valorInicial]);

  const handleBlur = () => {
    if (valor !== valorInicial) {
      onGuardar(valor);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <input
      type="text"
      className="w-16 text-center border-2 border-gray-500 rounded-md text-base font-bold py-1 px-1 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

// Componente de tabla de cobros reutilizable
const TablaCobrosLista = ({ items, onCambioOrden, ordenFecha, setCreditoSeleccionado, setClienteSeleccionado, color = "blue" }) => {
  const colorClasses = {
    blue: {
      header: "bg-blue-600",
      row: "bg-blue-50 hover:bg-blue-100",
      button: "text-blue-600 hover:text-blue-800"
    },
    green: {
      header: "bg-green-600", 
      row: "bg-green-50 hover:bg-green-100",
      button: "text-green-600 hover:text-green-800"
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  // Ordenar por número de orden manual si existe, sino por posición
  const itemsOrdenados = [...items].sort((a, b) => {
    const ordenA = ordenFecha[a.clienteId] || '';
    const ordenB = ordenFecha[b.clienteId] || '';
    
    if (ordenA && ordenB) {
      return parseInt(ordenA) - parseInt(ordenB);
    }
    if (ordenA) return -1;
    if (ordenB) return 1;
    
    // Si no hay orden manual, ordenar por posición
    const posA = a.clientePosicion || '999';
    const posB = b.clientePosicion || '999';
    return parseInt(posA) - parseInt(posB);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className={`text-xs text-white uppercase ${colors.header}`}>
          <tr>
            <th scope="col" className="px-4 py-3 w-12 text-center">#</th>
            <th scope="col" className="px-4 py-3 text-center">Orden</th>
            <th scope="col" className="px-4 py-3 text-center">Ref.</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Crédito</th>
            <th scope="col" className="px-4 py-3 text-green-400">A Cobrar</th>
            <th scope="col" className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {itemsOrdenados.map((item, index) => {
            const numeroLista = index + 1;
            const rawOrden = ordenFecha[item.clienteId];
            const valorOrden = rawOrden === undefined || rawOrden === null ? '' : String(rawOrden);

            return (
              <tr key={item.key} className={colors.row}>
                <td className="px-2 py-4 font-bold text-gray-900 text-center text-base">
                  {numeroLista}
                </td>
                <td className="px-4 py-4 text-center">
                  <OrdenInput
                    valorInicial={valorOrden}
                    onGuardar={(nuevoValor) => onCambioOrden(item.clienteId, nuevoValor, items)}
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
                      <span className="bg-yellow-100 text-yellow-800 px-1 rounded">{item.clienteTelefono || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                      {item.clienteBarrio || 'Sin barrio'}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-medium text-gray-900">
                  {item.valorCuota ? `$${item.valorCuota.toLocaleString()}` : 'N/A'}
                </td>
                <td className="px-4 py-4 font-bold text-green-600 text-base">
                  ${item.valorRealACobrar.toLocaleString()}
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => {
                      setCreditoSeleccionado(item.credito);
                      setClienteSeleccionado(item.cliente);
                    }}
                    className={`${colors.button} font-medium hover:underline text-sm`}
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
  );
};

const DiaDeCobroMaster = () => {
  const { user } = useAuth();
  
  // Estados principales
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('tuluá'); // 'tuluá' o 'buga'
  const [clientes, setClientes] = useState([]);
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(startOfDay(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para filtros de tipo de pago por cartera
  const [filtroK1, setFiltroK1] = useState('todos'); // 'todos', 'semanal', 'quincenal', 'mensual'
  const [filtroK2, setFiltroK2] = useState('todos'); // 'todos', 'quincenal', 'mensual'
  const [filtroK3, setFiltroK3] = useState('todos'); // 'todos', 'semanal', 'quincenal', 'mensual'

  // Estado para orden de cobro por fecha y cliente
  const [ordenCobro, setOrdenCobro] = useState({});

  // Estado para prórrogas de cuotas
  const [prorrogasCuotas, setProrrogasCuotas] = useState({});

  // Verificar permisos
  const puedeVerDiaDeCobro = user && (
    user.role === 'ceo' || 
    user.role === 'administrador' || 
    user.role === 'secretario'
  );

  // Cargar última ciudad seleccionada desde localStorage
  useEffect(() => {
    const ultimaCiudad = localStorage.getItem('ultimaCiudadDiaDeCobro');
    if (ultimaCiudad && ['tuluá', 'buga'].includes(ultimaCiudad)) {
      setCiudadSeleccionada(ultimaCiudad);
    }
  }, []);

  // Guardar ciudad seleccionada en localStorage
  useEffect(() => {
    localStorage.setItem('ultimaCiudadDiaDeCobro', ciudadSeleccionada);
  }, [ciudadSeleccionada]);

  // Cargar clientes desde el backend
  useEffect(() => {
    if (!puedeVerDiaDeCobro) return;

    const cargarClientes = async () => {
      try {
        setLoading(true);
        const response = await api.get('/clientes');
        if (response.success) {
          setClientes(response.data);
        }
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        toast.error('Error al cargar los clientes');
      } finally {
        setLoading(false);
      }
    };

    cargarClientes();
  }, [puedeVerDiaDeCobro]);

  // Cargar órdenes de cobro desde el backend
  const cargarOrdenesCobro = async (fecha) => {
    try {
      const response = await ordenCobroService.obtenerPorFecha(fecha);
      if (response.success && response.data) {
        setOrdenCobro(prev => ({
          ...prev,
          [fecha]: response.data
        }));
      }
    } catch (error) {
      console.error('Error al cargar órdenes de cobro:', error);
    }
  };

  // Cargar órdenes cuando cambia la fecha
  useEffect(() => {
    const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
    cargarOrdenesCobro(fechaStr);
  }, [fechaSeleccionada]);

  // Cargar prórrogas desde el backend
  const cargarProrrogas = async () => {
    try {
      const response = await prorrogaService.obtenerTodas();
      if (response.success && response.data) {
        const prorrogasMap = {};
        response.data.forEach(prorroga => {
          const key = `${prorroga.clienteId}-${prorroga.creditoId}-${prorroga.nroCuota}`;
          prorrogasMap[key] = prorroga;
        });
        setProrrogasCuotas(prorrogasMap);
      }
    } catch (error) {
      console.error('Error al cargar prorrogas:', error);
    }
  };

  useEffect(() => {
    cargarProrrogas();
  }, []);

  // Funciones de navegación de fecha
  const irAyer = () => setFechaSeleccionada(subDays(fechaSeleccionada, 1));
  const irHoy = () => setFechaSeleccionada(startOfDay(new Date()));
  const irMañana = () => setFechaSeleccionada(addDays(fechaSeleccionada, 1));
  const cambiarFecha = (e) => {
    const nuevaFecha = parseISO(e.target.value);
    setFechaSeleccionada(startOfDay(nuevaFecha));
  };

  // Función para actualizar orden manual
  const handleActualizarOrdenManual = async (clienteId, nuevoOrden) => {
    const numeroNuevo = parseInt(nuevoOrden, 10);
    const fechaStr = format(fechaSeleccionada, 'yyyy-MM-dd');

    if (nuevoOrden === '' || isNaN(numeroNuevo)) {
      setOrdenCobro(prev => {
        const ordenFechaActual = { ...(prev[fechaStr] || {}) };
        ordenFechaActual[clienteId] = '';
        return { ...prev, [fechaStr]: ordenFechaActual };
      });

      try {
        await ordenCobroService.eliminar(fechaStr, clienteId);
      } catch (error) {
        console.error('Error al eliminar orden de cobro:', error);
      }
      return;
    }

    const nuevoOrdenMap = { ...(ordenCobro[fechaStr] || {}) };
    nuevoOrdenMap[clienteId] = numeroNuevo;

    setOrdenCobro(prev => ({
      ...prev,
      [fechaStr]: nuevoOrdenMap
    }));

    try {
      await ordenCobroService.guardar(fechaStr, nuevoOrdenMap);
    } catch (error) {
      console.error('Error al guardar orden en el servidor:', error);
      toast.error('Error al sincronizar el orden con el servidor');
    }
  };

  // Si no tiene permisos, mostrar mensaje de acceso denegado
  if (!puedeVerDiaDeCobro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 text-center mb-6">
            No tienes permisos para acceder a esta sección. Solo usuarios con rol de CEO, Administrador o Secretario pueden ver el Día de Cobro.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Tu rol actual:</p>
                <p className="text-sm text-blue-600">{user?.role || 'No definido'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si está cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con Selector de Ciudad */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Día de Cobro</h1>
                <p className="text-gray-600 text-sm">Gestión de cobros por ciudad</p>
              </div>
            </div>

            {/* Selector de Ciudad */}
            <div className="relative">
              <select
                value={ciudadSeleccionada}
                onChange={(e) => setCiudadSeleccionada(e.target.value)}
                className="appearance-none bg-gradient-to-r from-blue-600 to-purple-600 border border-blue-500 text-white px-6 py-3 rounded-xl text-sm font-medium shadow-lg shadow-blue-500/25 backdrop-blur-sm transition-all duration-300 hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-400/30 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-300/70 focus:ring-offset-2 focus:ring-offset-blue-900/50 cursor-pointer pr-10"
              >
                <option value="tuluá" className="bg-gray-900 text-gray-100">🏙️ Tuluá</option>
                <option value="buga" className="bg-gray-900 text-gray-100">🌆 Buga</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Información de la ciudad seleccionada */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Ciudad actual: <span className="font-bold">{ciudadSeleccionada === 'tuluá' ? 'Tuluá' : 'Buga'}</span>
              </span>
              <span className="text-sm text-blue-700">
                ({ciudadSeleccionada === 'tuluá' ? 'Carteras K1 y K2' : 'Cartera K3'})
              </span>
            </div>
          </div>
        </div>

        {/* Renderizar la vista correspondiente */}
        {ciudadSeleccionada === 'tuluá' ? (
          <VistaTuluá
            fechaSeleccionada={fechaSeleccionada}
            searchTerm={searchTerm}
            filtroK1={filtroK1}
            filtroK2={filtroK2}
            clientes={clientes}
            ordenCobro={ordenCobro}
            creditoSeleccionado={creditoSeleccionado}
            clienteSeleccionado={clienteSeleccionado}
            setCreditoSeleccionado={setCreditoSeleccionado}
            setClienteSeleccionado={setClienteSeleccionado}
            irAyer={irAyer}
            irHoy={irHoy}
            irMañana={irMañana}
            cambiarFecha={cambiarFecha}
            setSearchTerm={setSearchTerm}
            setFiltroK1={setFiltroK1}
            setFiltroK2={setFiltroK2}
            handleActualizarOrdenManual={handleActualizarOrdenManual}
            OrdenInput={OrdenInput}
            TablaCobrosLista={TablaCobrosLista}
          />
        ) : (
          <VistaBuga
            fechaSeleccionada={fechaSeleccionada}
            searchTerm={searchTerm}
            filtroK3={filtroK3}
            clientes={clientes}
            ordenCobro={ordenCobro}
            prorrogasCuotas={prorrogasCuotas}
            creditoSeleccionado={creditoSeleccionado}
            clienteSeleccionado={clienteSeleccionado}
            setCreditoSeleccionado={setCreditoSeleccionado}
            setClienteSeleccionado={setClienteSeleccionado}
            irAyer={irAyer}
            irHoy={irHoy}
            irMañana={irMañana}
            cambiarFecha={cambiarFecha}
            setSearchTerm={setSearchTerm}
            setFiltroK3={setFiltroK3}
            handleActualizarOrdenManual={handleActualizarOrdenManual}
            OrdenInput={OrdenInput}
          />
        )}
      </div>
    </div>
  );
};

export default DiaDeCobroMaster;
