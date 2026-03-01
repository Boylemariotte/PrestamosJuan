import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Users as UsersIcon, Briefcase, Filter, User, Phone, CreditCard, AlertCircle, MapPin, ChevronDown, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ClienteCard from '../components/Clientes/ClienteCard';
import ClienteForm from '../components/Clientes/ClienteForm';
import {
  determinarEstadoCredito,
  formatearMoneda,
  aplicarAbonosAutomaticamente,
  calcularValorPendienteCuota,
  formatearFechaCorta
} from '../utils/creditCalculations';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

const Clientes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientes, agregarCliente, actualizarCliente, asignarEtiquetaCliente, loading, carteras } = useApp();
  const { hasPermission, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formCartera, setFormCartera] = useState(null);
  const [formTipoPago, setFormTipoPago] = useState(null);
  const [formPosicion, setFormPosicion] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCartera, setFiltroCartera] = useState('todas'); // 'todas', 'K1', 'K2', ...
  const [filtroTipoPago, setFiltroTipoPago] = useState('todos'); // 'todos', 'diario', 'semanal', 'quincenal', 'mensual'

  // Determinar carteras visibles según rol y ciudad del usuario
  const carterasVisibles = useMemo(() => {
    if (!user || !carteras) return [];

    // Filtramos solo las carteras activas
    const carterasActivas = carteras.filter(c => c.activa);

    if (user.role === 'administrador' || user.role === 'ceo') {
      return carterasActivas;
    }

    if (user.role === 'domiciliario' || user.role === 'supervisor') {
      // Si tiene ciudad asignada, filtrar por ella. Si no, por defecto Tuluá (compatibilidad)
      const ciudadUsuario = user.ciudad || 'Tuluá';
      // Mapeo de ciudad a nombre real en DB si difieren (ej: 'Tuluá' vs 'Tulua')
      // Asumimos que coinciden o la DB está normalizada.
      return carterasActivas.filter(c => c.ciudad === ciudadUsuario);
    }

    return [];
  }, [user, carteras]);

  // Tipos de pago disponibles según la cartera seleccionada
  const tiposPagoDisponibles = useMemo(() => {
    const tipos = new Set(['todos']);

    if (filtroCartera === 'todas') {
      carterasVisibles.forEach(c => {
        c.secciones?.forEach(s => {
          s.tiposPagoPermitidos.forEach(t => tipos.add(t));
        });
      });
    } else {
      const cartera = carterasVisibles.find(c => c.nombre === filtroCartera);
      if (cartera) {
        cartera.secciones?.forEach(s => {
          s.tiposPagoPermitidos.forEach(t => tipos.add(t));
        });
      }
    }

    // Ordenar: todos primero, luego orden específico si se desea
    const ordered = Array.from(tipos);
    const priority = ['todos', 'diario', 'semanal', 'quincenal', 'mensual'];
    return ordered.sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [filtroCartera, carterasVisibles]);

  // Resetear filtro de tipo de pago si el tipo actual no está disponible en la cartera seleccionada
  useEffect(() => {
    if (!tiposPagoDisponibles.includes(filtroTipoPago)) {
      setFiltroTipoPago('todos');
    }
  }, [filtroCartera, tiposPagoDisponibles, filtroTipoPago]);

  // Manejar datos iniciales desde navegación (ej. desde Visitas)
  useEffect(() => {
    if (location.state?.openForm) {
      setFormCartera(location.state.cartera);
      setInitialData(location.state.clientData);
      setShowForm(true);
      // Limpiar el estado de la navegación para evitar que se reabra al refrescar
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleAgregarCliente = async (clienteData) => {
    try {
      // Si hay posición predefinida, agregarla
      if (formPosicion) {
        clienteData.posicion = formPosicion;
      }
      // Si hay tipo de pago predefinido, guardarlo como tipo de pago esperado (respaldo)
      if (formTipoPago) {
        clienteData.tipoPagoEsperado = formTipoPago;
      }

      await agregarCliente(clienteData);
      setShowForm(false);
      setFormCartera(null);
      setFormTipoPago(null);
      setFormPosicion(null);
      setInitialData(null);
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      alert(error.response?.data?.error || error.message || 'Error al crear el cliente');
    }
  };

  const handleAgregarDesdeCard = (cartera, tipoPago, posicion) => {
    setFormCartera(cartera);
    // Si el tipo de pago es 'general' (K2) o el pool 'quincenalMensual', no predefinir tipo de pago específico
    // Pero si es una sección que admite UN SOLO tipo, predefinirlo.
    const carteraObj = carterasVisibles.find(c => c.nombre === cartera);
    const seccion = carteraObj?.secciones.find(s => s.nombreInterno === tipoPago);

    let tipoPredefinido = null;
    if (seccion && seccion.tiposPagoPermitidos.length === 1) {
      tipoPredefinido = seccion.tiposPagoPermitidos[0];
    } else {
      // Si es pool mixto (ej: semanal, quincenal, mensual), dejar null para que elija
      if (tipoPago !== 'general' && tipoPago !== 'quincenalMensual') {
        tipoPredefinido = tipoPago; // Si el nombre interno coincide con el tipo (ej: semanal)
      }
    }

    setFormTipoPago(tipoPredefinido);
    setFormPosicion(posicion);
    setShowForm(true);
  };

  // Obtener tipos de pago activos del cliente (según créditos activos o en mora)
  const getTiposPagoActivos = (cliente) => {
    const tipos = new Set();
    (cliente.creditos || []).forEach((c) => {
      const estadoC = determinarEstadoCredito(c.cuotas, c);
      if (estadoC === 'activo' || estadoC === 'mora') {
        if (c.tipo) tipos.add(c.tipo);
      }
    });
    return Array.from(tipos);
  };

  // Generar todas las cards posibles según capacidades de las carteras
  const todasLasCards = useMemo(() => {
    const cards = [];

    carterasVisibles.forEach(cartera => {
      cartera.secciones.forEach(seccion => {
        for (let i = 1; i <= seccion.capacidad; i++) {
          cards.push({
            cartera: cartera.nombre,
            tipoPago: seccion.nombreInterno, // Identificador de la sección (ej: 'semanal', 'quincenalMensual', 'general')
            posicion: i,
            cliente: null,
            tiposPermitidos: seccion.tiposPagoPermitidos,
            seccionTitulo: seccion.titulo,
            colorCartera: cartera.color
          });
        }
      });
    });

    // Asignar clientes a las cards correspondientes
    clientes.forEach(cliente => {
      const carteraCliente = cliente.cartera || 'K1';

      // Buscar la cartera en la configuración para saber sus secciones
      const carteraConfig = carterasVisibles.find(c => c.nombre === carteraCliente);
      if (!carteraConfig) return; // Si el cliente es de una cartera no visible, ignorarlo

      const tiposActivos = getTiposPagoActivos(cliente);
      // Si no tiene créditos activos, usar preferencia o default (basado en lógica antigua o heurística)
      const tiposAAsignar = tiposActivos.length > 0
        ? tiposActivos
        : (cliente.tipoPagoEsperado ? [cliente.tipoPagoEsperado] : []);

      // Si no tiene tipo asignable, intentar asignar a la primera sección disponible que lo admita o default
      if (tiposAAsignar.length === 0) {
        // Fallback: asignar a 'general' si existe, o 'quincenalMensual' (lógica antigua K1/K3)
        // O mejor: buscar la sección que admita más tipos
        const seccionGeneral = carteraConfig.secciones.find(s => s.nombreInterno === 'general');
        if (seccionGeneral) {
          tiposAAsignar.push('mensual'); // Asumimos mensual/generic para K2
        } else {
          const seccionPool = carteraConfig.secciones.find(s => s.nombreInterno === 'quincenalMensual');
          if (seccionPool) tiposAAsignar.push('quincenal'); // Asumimos quincenal para pool K1
        }
      }

      tiposAAsignar.forEach(tipo => {
        const posicionCliente = Number(cliente.posicion);
        if (!posicionCliente) return;

        // Buscar la sección que admite este tipo
        const seccion = carteraConfig.secciones.find(s => s.tiposPagoPermitidos.includes(tipo));

        if (seccion) {
          const cardIndex = cards.findIndex(c =>
            c.cartera === carteraCliente &&
            c.tipoPago === seccion.nombreInterno &&
            Number(c.posicion) === posicionCliente &&
            c.cliente === null
          );

          if (cardIndex !== -1) {
            cards[cardIndex].cliente = cliente;
          }
        }
      });
    });

    return cards;
  }, [clientes, carterasVisibles]);

  // Ocupación actual por cartera/sección
  const ocupacion = useMemo(() => {
    const base = {}; // { 'K1': { 'semanal': 0, 'quincenalMensual': 0 }, ... }

    // Inicializar estructura base
    carterasVisibles.forEach(c => {
      base[c.nombre] = {};
      c.secciones.forEach(s => {
        base[c.nombre][s.nombreInterno] = 0;
      });
      base[c.nombre].total = 0; // Total clientes únicos (aprox) en la cartera
    });

    todasLasCards.forEach(card => {
      if (card.cliente) {
        if (base[card.cartera]) {
          if (base[card.cartera][card.tipoPago] !== undefined) {
            base[card.cartera][card.tipoPago]++;
          }
          // Para el total, hay que tener cuidado con contar doble si un cliente tiene múltiples créditos
          // Pero en la visualización de cards, cada card ocupada cuenta.
          // El total de "clientes únicos" es otra métrica. Aquí sumamos ocupación de slots.
          base[card.cartera].total++;
        }
      }
    });

    return base;
  }, [todasLasCards, carterasVisibles]);

  // Total de clientes (ocupación total de slots visibles)
  const totalClientesCalculado = Object.values(ocupacion).reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Conteos por tipo de pago para los botones de filtrado
  const conteosTipoPago = useMemo(() => {
    const counts = { todos: 0, diario: 0, semanal: 0, quincenal: 0, mensual: 0 };

    todasLasCards.forEach(card => {
      // Solo contar cards que coincidan con el filtro de cartera actual
      if (filtroCartera === 'todas' || card.cartera === filtroCartera) {
        if (card.cliente) {
          counts.todos++; // Contar para el total de la cartera seleccionada

          // Para el conteo por tipo, verificamos qué tipo de crédito tiene el cliente en esa card específica
          // Si la card es de una sección 'general' (multitipo), debemos ver el crédito real
          const tipos = getTiposPagoActivos(card.cliente);
          const tipoBase = tipos.length > 0 ? tipos[0] : card.cliente.tipoPagoEsperado;

          if (tipoBase && counts[tipoBase] !== undefined) {
            counts[tipoBase]++;
          } else {
            // Si está en una card de tipo específico (ej: semanal), contar como tal
            // Pero card.tipoPago es el nombreInterno (puede ser 'quincenalMensual').
            // Mejor iterar tipos permitidos de la card
            const tiposPermitidos = card.tiposPermitidos || [];
            if (tiposPermitidos.length === 1 && counts[tiposPermitidos[0]] !== undefined) {
              counts[tiposPermitidos[0]]++;
            }
            // Mapeo para asegurar que quincenal y mensual se cuenten correctamente incluso si vienen de pools compartidos
            if (tipoBase && counts[tipoBase] !== undefined) {
              counts[tipoBase]++;
            } else if (!tipoBase) {
              // Si no tiene tipo definido, lo sumamos a quincenal por defecto si es K1/K3 o dejamos en 0
              if (card.cartera !== 'K2') counts.quincenal++;
            }
          }
        }
      }
    });

    return counts;
  }, [todasLasCards, filtroCartera]);

  // Filtrar cards según búsqueda, cartera y tipo de pago
  const cardsFiltradas = todasLasCards.filter(card => {
    // 1. Verificar filtros
    const coincideCartera = filtroCartera === 'todas' || card.cartera === filtroCartera;

    let coincideTipo = true;
    if (filtroTipoPago !== 'todos') {
      // Si la card tiene cliente, verificar su tipo real
      if (card.cliente) {
        const tipos = getTiposPagoActivos(card.cliente);
        const tipoCliente = tipos.length > 0 ? tipos[0] : card.cliente.tipoPagoEsperado;
        coincideTipo = tipoCliente === filtroTipoPago;
      } else {
        // Si está vacía, mostrarla si SU SECCIÓN permite el tipo filtrado
        coincideTipo = card.tiposPermitidos?.includes(filtroTipoPago);
      }
    }

    if (!coincideCartera || !coincideTipo) {
      return false;
    }

    // 2. Verificar búsqueda
    if (searchTerm) {
      const isNumber = !isNaN(searchTerm) && searchTerm.trim() !== '';
      if (isNumber && Number(card.posicion) === Number(searchTerm)) {
        return true;
      }

      if (!card.cliente) return false;
      const coincideBusqueda = card.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.cliente.documento.includes(searchTerm) ||
        card.cliente.telefono.includes(searchTerm);
      if (!coincideBusqueda) return false;
    }

    return true;
  });

  const getCreditoInfo = (cliente, nombreSeccion) => {
    if (!cliente || !cliente.creditos) return null;

    // Buscar crédito que corresponda a los tipos permitidos de la sección
    // Necesitamos saber qué tipos permite esta sección
    // Como no tenemos el objeto sección aquí directo, podemos inferirlo o pasarlo.
    // Pero `card.tiposPermitidos` no se pasa a esta función, hay que pasarlo.
    // Modificaremos la llamada en el render.

    // Logica fallback: buscar activo
    const credito = cliente.creditos.find(c => {
      const estado = determinarEstadoCredito(c.cuotas, c);
      return estado === 'activo' || estado === 'mora';
    });

    if (!credito) return null;

    const { cuotasActualizadas } = aplicarAbonosAutomaticamente(credito);
    let saldoPendiente = 0;
    let primerCuotaVencidaFecha = null;
    const hoy = startOfDay(new Date());
    let estaVencido = false;
    let cuotasVencidasCount = 0;

    cuotasActualizadas.forEach(cuota => {
      const valorPendiente = calcularValorPendienteCuota(credito.valorCuota, cuota);
      saldoPendiente += valorPendiente;

      if (valorPendiente > 0) {
        const fechaProgramada = startOfDay(parseISO(cuota.fechaProgramada));
        if (isBefore(fechaProgramada, hoy)) {
          estaVencido = true;
          cuotasVencidasCount++;
          if (!primerCuotaVencidaFecha || isBefore(fechaProgramada, startOfDay(parseISO(primerCuotaVencidaFecha)))) {
            primerCuotaVencidaFecha = cuota.fechaProgramada;
          }
        }
      }
    });

    return {
      ...credito,
      saldoPendiente,
      estaVencido,
      fechaVencimiento: primerCuotaVencidaFecha,
      cuotasVencidasCount
    };
  };

  const generarRefCredito = (cliente, credito) => {
    if (!credito) return '-';
    // Si el crédito tiene ID, usarlo, sino generar uno basado en el cliente
    const idBase = credito.id || cliente?.id?.slice(0, 8) || '000000';
    return `PRD${idBase.toString().padStart(10, '0')}`;
  };

  // Helper para gradientes
  const getGradientClass = (color) => {
    const gradients = {
      slate: 'bg-gradient-to-br from-slate-500 to-slate-600',
      gray: 'bg-gradient-to-br from-gray-500 to-gray-600',
      red: 'bg-gradient-to-br from-red-500 to-red-600',
      orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
      amber: 'bg-gradient-to-br from-amber-500 to-amber-600',
      yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      lime: 'bg-gradient-to-br from-lime-500 to-lime-600',
      green: 'bg-gradient-to-br from-green-500 to-green-600',
      emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      teal: 'bg-gradient-to-br from-teal-500 to-teal-600',
      cyan: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      sky: 'bg-gradient-to-br from-sky-500 to-sky-600',
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
      indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      violet: 'bg-gradient-to-br from-violet-500 to-violet-600',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
      fuchsia: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600',
      pink: 'bg-gradient-to-br from-pink-500 to-pink-600',
      rose: 'bg-gradient-to-br from-rose-500 to-rose-600',
    };
    return gradients[color] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const getColorTextClass = (color) => {
    const textColors = {
      slate: 'text-slate-100', gray: 'text-gray-100', red: 'text-red-100',
      orange: 'text-orange-100', amber: 'text-amber-100', yellow: 'text-yellow-100',
      lime: 'text-lime-100', green: 'text-green-100', emerald: 'text-emerald-100',
      teal: 'text-teal-100', cyan: 'text-cyan-100', sky: 'text-sky-100',
      blue: 'text-blue-100', indigo: 'text-indigo-100', violet: 'text-violet-100',
      purple: 'text-purple-100', fuchsia: 'text-fuchsia-100', pink: 'text-pink-100',
      rose: 'text-rose-100',
    };
    return textColors[color] || 'text-gray-100';
  };

  const getColorTextDarkClass = (color) => {
    const darkColors = {
      slate: 'text-slate-800 border-slate-300 ring-slate-400 bg-slate-100',
      gray: 'text-gray-800 border-gray-300 ring-gray-400 bg-gray-100',
      red: 'text-red-800 border-red-300 ring-red-400 bg-red-100',
      orange: 'text-orange-800 border-orange-300 ring-orange-400 bg-orange-100',
      amber: 'text-amber-800 border-amber-300 ring-amber-400 bg-amber-100',
      yellow: 'text-yellow-800 border-yellow-300 ring-yellow-400 bg-yellow-100',
      lime: 'text-lime-800 border-lime-300 ring-lime-400 bg-lime-100',
      green: 'text-green-800 border-green-300 ring-green-400 bg-green-100',
      emerald: 'text-emerald-800 border-emerald-300 ring-emerald-400 bg-emerald-100',
      teal: 'text-teal-800 border-teal-300 ring-teal-400 bg-teal-100',
      cyan: 'text-cyan-800 border-cyan-300 ring-cyan-400 bg-cyan-100',
      sky: 'text-sky-800 border-sky-300 ring-sky-400 bg-sky-100',
      blue: 'text-blue-800 border-blue-300 ring-blue-400 bg-blue-100',
      indigo: 'text-indigo-800 border-indigo-300 ring-indigo-400 bg-indigo-100',
      violet: 'text-violet-800 border-violet-300 ring-violet-400 bg-violet-100',
      purple: 'text-purple-800 border-purple-300 ring-purple-400 bg-purple-100',
      fuchsia: 'text-fuchsia-800 border-fuchsia-300 ring-fuchsia-400 bg-fuchsia-100',
      pink: 'text-pink-800 border-pink-300 ring-pink-400 bg-pink-100',
      rose: 'text-rose-800 border-rose-300 ring-rose-400 bg-rose-100',
    };
    return darkColors[color] || 'text-gray-800 border-gray-300 ring-gray-400 bg-gray-100';
  };

  const getRowColorClass = (color) => {
    const rowColors = {
      slate: 'bg-slate-100 hover:bg-slate-200 border-b',
      gray: 'bg-gray-100 hover:bg-gray-200 border-b',
      red: 'bg-red-100 hover:bg-red-200 border-b',
      orange: 'bg-orange-100 hover:bg-orange-200 border-b',
      amber: 'bg-amber-100 hover:bg-amber-200 border-b',
      yellow: 'bg-yellow-100 hover:bg-yellow-200 border-b',
      lime: 'bg-lime-100 hover:bg-lime-200 border-b',
      green: 'bg-green-100 hover:bg-green-200 border-b',
      emerald: 'bg-emerald-100 hover:bg-emerald-200 border-b',
      teal: 'bg-teal-100 hover:bg-teal-200 border-b',
      cyan: 'bg-cyan-100 hover:bg-cyan-200 border-b',
      sky: 'bg-sky-100 hover:bg-sky-200 border-b',
      blue: 'bg-blue-100 hover:bg-blue-200 border-b',
      indigo: 'bg-indigo-100 hover:bg-indigo-200 border-b',
      violet: 'bg-violet-100 hover:bg-violet-200 border-b',
      purple: 'bg-purple-100 hover:bg-purple-200 border-b',
      fuchsia: 'bg-fuchsia-100 hover:bg-fuchsia-200 border-b',
      pink: 'bg-pink-100 hover:bg-pink-200 border-b',
      rose: 'bg-rose-100 hover:bg-rose-200 border-b',
    };
    return rowColors[color] || 'hover:bg-gray-50 border-b';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información de tus clientes
          </p>
        </div>
      </div>

      {/* Estadísticas por cartera */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {carterasVisibles.map(cartera => (
          <div key={cartera.id || cartera.nombre} className={`card ${getGradientClass(cartera.color)} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${getColorTextClass(cartera.color)}`}>{cartera.ciudad}</p>
                <p className="text-xl font-bold mt-1">Cartera {cartera.nombre}</p>
                <p className={`text-xs mt-1 ${getColorTextClass(cartera.color)}`}>{ocupacion[cartera.nombre]?.total || 0} clientes</p>
                <div className="mt-3 space-y-1 text-[11px]">
                  {cartera.secciones.map(seccion => (
                    <p key={seccion.nombreInterno} className={getColorTextClass(cartera.color)}>
                      {seccion.titulo}: {ocupacion[cartera.nombre]?.[seccion.nombreInterno] || 0}/{seccion.capacidad}
                    </p>
                  ))}
                </div>
              </div>
              <Briefcase className={`h-12 w-12 opacity-80 ${getColorTextClass(cartera.color)}`} />
            </div>
          </div>
        ))}

        {/* Card Total */}
        <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Total Clientes</p>
              <p className="text-3xl font-bold mt-1">{totalClientesCalculado}</p>
              <p className="text-indigo-100 text-xs mt-1">registrados visibles</p>
            </div>
            <UsersIcon className="h-12 w-12 text-indigo-200" />
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Filtros por cartera */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Filtrar por cartera:</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroCartera('todas')}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${filtroCartera === 'todas'
              ? 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-400'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
          >
            Todas ({totalClientesCalculado})
          </button>

          {carterasVisibles.map(cartera => (
            <button
              key={cartera.nombre}
              onClick={() => setFiltroCartera(cartera.nombre)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${filtroCartera === cartera.nombre
                ? getColorTextDarkClass(cartera.color)
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              <Briefcase className="h-4 w-4" />
              Cartera {cartera.nombre} ({ocupacion[cartera.nombre]?.total || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por tipo de pago */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Filtrar por tipo de pago:</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {tiposPagoDisponibles.map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipoPago(tipo)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${filtroTipoPago === tipo
                ? 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-400'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)} ({conteosTipoPago[tipo] !== undefined ? conteosTipoPago[tipo] : 0})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de cards/tabla */}
      {cardsFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron clientes' : 'No hay registros disponibles'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza agregando tu primer cliente'}
          </p>
          {!searchTerm && hasPermission('crearClientes') && user?.role !== 'domiciliario' && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-100 mt-8">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#1e293b] text-white">
              <tr>
                <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">
                  REF. CRÉDITO
                </th>
                <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">
                  CLIENTE
                </th>
                <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">
                  CRÉDITO
                </th>
                <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">
                  VALOR CUOTA
                </th>
                <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">
                  SALDO PENDIENTE
                </th>
                <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300 text-center">
                  VENCIDO
                </th>
                <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300">
                  MODALIDAD
                </th>
                <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300 text-center">
                  RF
                </th>
                {(user.role === 'ceo' || user.role === 'supervisor') && (
                  <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300 text-center">
                    SUPERVISIÓN
                  </th>
                )}
                <th scope="col" className="px-2 py-2 text-left text-[11px] font-black uppercase tracking-widest text-slate-300 text-right">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cardsFiltradas.map((card, index) => {
                const creditoInfo = getCreditoInfo(card.cliente, card.tipoPago);
                const esVacia = !card.cliente;

                let rowColorClass = '';
                if (esVacia) {
                  // Filas vacías siempre blanco
                  rowColorClass = 'bg-white';
                } else {
                  // Determinar clase de color según el color de la cartera
                  rowColorClass = getRowColorClass(card.colorCartera);

                  // Si el cliente tiene RF activo, sobrescribir con color morado claro
                  if (card.cliente.rf === 'RF') {
                    rowColorClass = 'bg-purple-100 hover:bg-purple-200 border-b';
                  }
                }

                return (
                  <tr key={`${card.cartera}-${card.tipoPago}-${card.posicion}`} className={`transition-colors border-b border-white ${rowColorClass}`}>
                    {/* Ref Crédito */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-black">
                      #{card.posicion}
                    </td>

                    {/* Cliente */}
                    <td className="px-6 py-4">
                      {esVacia ? (
                        <span className="text-gray-400 italic">Espacio Disponible ({card.cartera})</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <div className="text-sm font-bold text-gray-900 leading-tight">
                            {card.cliente.nombre}
                          </div>
                          <div className="text-xs font-medium text-gray-500">
                            CC: {card.cliente.documento || 'No registrada'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mt-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {card.cliente.telefono}
                          </div>
                          {card.cliente.barrio && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[140px]">{card.cliente.barrio}, {card.cliente.direccion}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Crédito */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {esVacia ? (
                        <span className="text-black-300">-</span>
                      ) : creditoInfo ? (
                        formatearMoneda(creditoInfo.monto)
                      ) : (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">SIN CRÉDITO</span>
                      )}
                    </td>

                    {/* Valor Cuota */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {creditoInfo ? (
                        <div className="text-sm font-bold text-green-600">
                          {formatearMoneda(creditoInfo.valorCuota)}
                        </div>
                      ) : <span className="text-black-300">-</span>}
                    </td>

                    {/* Saldo Pendiente */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {creditoInfo ? (
                        formatearMoneda(creditoInfo.saldoPendiente)
                      ) : <span className="text-black-300 opacity-50">-</span>}
                    </td>

                    {/* Vencido */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {esVacia || !creditoInfo ? (
                        <span className="text-black-300 opacity-50">-</span>
                      ) : creditoInfo.estaVencido ? (
                        <div className="text-red-600 font-bold text-xs">
                          (SI) - <span>{formatearFechaCorta(creditoInfo.fechaVencimiento)}</span>
                          {creditoInfo.cuotasVencidasCount > 1 && (
                            <div className="text-[10px] text-red-500 mt-0.5 font-normal">
                              ({creditoInfo.cuotasVencidasCount} cuotas)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-green-600 font-bold text-xs">Al día</span>
                      )}
                    </td>

                    {/* Modalidad */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {creditoInfo?.tipo
                        ? (creditoInfo.tipo.charAt(0).toUpperCase() + creditoInfo.tipo.slice(1))
                        : (card.cliente?.tipoPagoEsperado
                          ? (card.cliente.tipoPagoEsperado.charAt(0).toUpperCase() + card.cliente.tipoPagoEsperado.slice(1))
                          : (card.tipoPago === 'quincenalMensual' ? 'Quincenal/Mensual' : card.tipoPago)
                        )
                      }
                    </td>

                    {/* RF Button style */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {!esVacia && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const currentValue = card.cliente.rf || '';
                            const newValue = currentValue === 'RF' ? '' : 'RF';
                            try {
                              await actualizarCliente(card.cliente.id, { rf: newValue });
                            } catch (error) {
                              console.error('Error actualizando RF:', error);
                            }
                          }}
                          className={`px-3 py-1.5 text-[11px] border rounded-md transition-all flex items-center gap-1 min-w-[70px] mx-auto justify-between ${card.cliente.rf === 'RF'
                            ? 'bg-purple-700 border-purple-800 text-white hover:bg-purple-800'
                            : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                          <span className="font-bold">
                            {card.cliente.rf === 'RF' ? 'RF' : '-'}
                          </span>
                          <ChevronDown className={`h-3 w-3 ${card.cliente.rf === 'RF' ? 'text-white' : 'text-gray-400'}`} />
                        </button>
                      )}
                    </td>

                    {/* Supervisión Button style */}
                    {(user.role === 'ceo' || user.role === 'supervisor') && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {!esVacia && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const newValue = !card.cliente.enSupervision;
                              try {
                                await actualizarCliente(card.cliente.id, { enSupervision: newValue });
                              } catch (error) {
                                console.error('Error actualizando supervisión:', error);
                              }
                            }}
                            className={`px-3 py-1.5 text-[11px] border rounded-md transition-all flex items-center gap-1 min-w-[70px] mx-auto justify-between ${card.cliente.enSupervision
                              ? 'bg-emerald-700 border-emerald-800 text-white hover:bg-emerald-800'
                              : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50'
                              }`}
                          >
                            <span className="font-bold">
                              {card.cliente.enSupervision ? 'Sí' : '-'}
                            </span>
                            <ChevronDown className={`h-3 w-3 ${card.cliente.enSupervision ? 'text-white' : 'text-gray-400'}`} />
                          </button>
                        )}
                      </td>
                    )}

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {!esVacia && (
                        <button
                          onClick={() => navigate(`/cliente/${card.cliente.id || card.cliente._id}`)}
                          className="text-indigo-600 hover:text-indigo-900 text-xs font-black uppercase tracking-widest transition-colors"
                        >
                          Ver Detalle
                        </button>
                      )}
                      {esVacia && hasPermission('crearClientes') && user?.role !== 'domiciliario' && (
                        <button
                          onClick={() => handleAgregarDesdeCard(card.cartera, card.tipoPago, card.posicion)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-xs font-bold justify-end ml-auto"
                        >
                          <Plus className="h-4 w-4" /> Agregar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ClienteForm
          cliente={null}
          initialData={initialData}
          onClose={() => {
            setShowForm(false);
            setFormCartera(null);
            setFormTipoPago(null);
            setFormPosicion(null);
            setInitialData(null);
          }}
          onSubmit={handleAgregarCliente}
          carteraPredefinida={formCartera}
          tipoPagoPredefinido={formTipoPago}
        />
      )}
    </div>
  );
};

export default Clientes;