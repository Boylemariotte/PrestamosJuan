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
  const { clientes, agregarCliente, actualizarCliente, loading } = useApp();
  const { hasPermission, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formCartera, setFormCartera] = useState(null);
  const [formTipoPago, setFormTipoPago] = useState(null);
  const [formPosicion, setFormPosicion] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCartera, setFiltroCartera] = useState('todas'); // 'todas', 'K1', 'K2', 'K3'
  const [filtroTipoPago, setFiltroTipoPago] = useState('todos'); // 'todos', 'diario', 'semanal', 'quincenal', 'mensual'

  // Verificar el tipo de usuario para determinar qué carteras mostrar
  const esBuga = user && (user.role === 'domiciliario' || user.role === 'supervisor') && user.ciudad === 'Guadalajara de Buga';
  const esTula = user && (user.role === 'domiciliario' || user.role === 'supervisor') && user.ciudad === 'Tuluá';
  const esAdminOCeo = user && (user.role === 'administrador' || user.role === 'ceo');
  const esCEOoSupervisor = user && (user.role === 'ceo' || user.role === 'supervisor');

  // Tipos de pago disponibles según la cartera seleccionada
  const tiposPagoDisponibles = useMemo(() => {
    if (filtroCartera === 'todas') {
      return ['todos', 'diario', 'semanal', 'quincenal', 'mensual'];
    } else if (filtroCartera === 'K1') {
      return ['todos', 'semanal', 'quincenal', 'mensual'];
    } else if (filtroCartera === 'K2') {
      return ['todos'];
    } else if (filtroCartera === 'K3') {
      return ['todos', 'semanal', 'quincenal', 'mensual']; // K3 maneja semanal, quincenal y mensual
    }
    return ['todos', 'diario', 'semanal', 'quincenal', 'mensual'];
  }, [filtroCartera]);

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

  const handleAgregarCliente = (clienteData) => {
    // Si hay posición predefinida, agregarla
    if (formPosicion) {
      clienteData.posicion = formPosicion;
    }
    // Si hay tipo de pago predefinido, guardarlo como tipo de pago esperado (respaldo)
    if (formTipoPago) {
      clienteData.tipoPagoEsperado = formTipoPago;
    }
    agregarCliente(clienteData);
    setShowForm(false);
    setFormCartera(null);
    setFormTipoPago(null);
    setFormCartera(null);
    setFormTipoPago(null);
    setFormPosicion(null);
    setInitialData(null);
  };

  const handleAgregarDesdeCard = (cartera, tipoPago, posicion) => {
    setFormCartera(cartera);
    // Si el tipo de pago es 'general' (K2), no predefinir tipo de pago
    setFormTipoPago(tipoPago === 'general' ? null : tipoPago);
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

  // Capacidades por cartera/tipo de pago
  const CAPACIDADES = useMemo(() => {
    if (esBuga) {
      // Solo mostrar K3 para domiciliarios de Guadalajara de Buga
      return {
        K3: { semanal: 150, quincenal: 150 } // K3 se comporta como K1
      };
    } else if (esAdminOCeo) {
      // Administradores y CEO ven todas las carteras
      return {
        K1: { semanal: 150, quincenal: 150, mensual: 150 },
        K2: { general: 225 },
        K3: { semanal: 150, quincenal: 150, mensual: 150 } // K3 se comporta como K1
      };
    } else {
      // Domiciliarios de Tuluá (u otros) solo ven K1 y K2
      return {
        K1: { semanal: 150, quincenal: 150, mensual: 150 },
        K2: { general: 225 }
      };
    }
  }, [esBuga, esAdminOCeo]);

  // Ocupación actual por cartera/tipo (considera clientes con créditos activos/en mora o tipoPagoEsperado)
  const ocupacion = useMemo(() => {
    let base;
    if (esBuga) {
      base = { K3: { semanal: 150, quincenal: 150, mensual: 150 } }; // K3 se comporta como K1
    } else if (esAdminOCeo) {
      base = {
        K1: { semanal: 0, quincenal: 0, mensual: 0 },
        K2: { general: 0 },
        K3: { semanal: 0, quincenal: 0, mensual: 0 } // K3 se comporta como K1
      };
    } else {
      base = {
        K1: { semanal: 0, quincenal: 0, mensual: 0 },
        K2: { general: 0 },
        K3: { semanal: 0, quincenal: 0, mensual: 0 } // K3 se comporta como K1
      };
    }
    clientes.forEach((cliente) => {
      const cartera = cliente.cartera || (esBuga ? 'K3' : 'K1');
      const tiposActivos = getTiposPagoActivos(cliente);
      // Si tiene créditos activos, usar esos tipos; si no, usar tipoPagoEsperado
      const tipos = tiposActivos.length > 0
        ? tiposActivos
        : (cliente.tipoPagoEsperado ? [cliente.tipoPagoEsperado] : []);

      if (tipos.length === 0) {
        // Si no tiene tipo definido pero está en una cartera, contar como ocupación general solo para K2
        if (cartera === 'K2') {
          if (base[cartera] && base[cartera].general !== undefined) {
            base[cartera].general += 1;
          }
        }
        return;
      }

      tipos.forEach((t) => {
        if (cartera === 'K2') {
          // Para K2, todo cuenta para general
          if (base[cartera] && base[cartera].general !== undefined) {
            base[cartera].general += 1;
          }
        } else if (base[cartera] && typeof base[cartera][t] === 'number') {
          // Para K1 y K3, contar por tipo de pago específico
          base[cartera][t] += 1;
        }
      });
    });
    return base;
  }, [clientes, esBuga, esAdminOCeo]);

  // Generar todas las cards posibles según capacidades
  const todasLasCards = useMemo(() => {
    const cards = [];

    if (esBuga) {
      // Solo generar cards para K3 (se comporta como K1)
      Object.entries(CAPACIDADES.K3).forEach(([tipo, capacidad]) => {
        for (let i = 1; i <= capacidad; i++) {
          cards.push({
            cartera: 'K3',
            tipoPago: tipo, // 'semanal' o 'quincenal'
            posicion: i,
            cliente: null
          });
        }
      });
    } else {
      // Generar cards para K1
      if (CAPACIDADES.K1) {
        Object.entries(CAPACIDADES.K1).forEach(([tipo, capacidad]) => {
          for (let i = 1; i <= capacidad; i++) {
            cards.push({
              cartera: 'K1',
              tipoPago: tipo,
              posicion: i,
              cliente: null
            });
          }
        });
      }

      // Generar cards para K2
      if (CAPACIDADES.K2) {
        Object.entries(CAPACIDADES.K2).forEach(([tipo, capacidad]) => {
          for (let i = 1; i <= capacidad; i++) {
            cards.push({
              cartera: 'K2',
              tipoPago: tipo, // 'general'
              posicion: i,
              cliente: null
            });
          }
        });
      }

      // Generar cards para K3 (solo para administradores y CEO, se comporta como K1)
      if (CAPACIDADES.K3 && esAdminOCeo) {
        Object.entries(CAPACIDADES.K3).forEach(([tipo, capacidad]) => {
          for (let i = 1; i <= capacidad; i++) {
            cards.push({
              cartera: 'K3',
              tipoPago: tipo, // 'semanal' o 'quincenal'
              posicion: i,
              cliente: null
            });
          }
        });
      }
    }

    // Asignar clientes a las cards correspondientes
    clientes.forEach(cliente => {
      const carteraCliente = cliente.cartera || (esBuga ? 'K3' : 'K1');

      // Lógica especial para K2 (tipo 'general')
      if (carteraCliente === 'K2') {
        const cardIndex = cards.findIndex(c =>
          c.cartera === 'K2' &&
          c.tipoPago === 'general' &&
          Number(c.posicion) === Number(cliente.posicion)
        );

        if (cardIndex !== -1) {
          cards[cardIndex].cliente = cliente;
        }
        return;
      }

      // Para K1 y K3, usar la misma lógica (por tipo de pago específico)
      if (carteraCliente === 'K1' || carteraCliente === 'K3') {

        const tiposActivos = getTiposPagoActivos(cliente);

        // Si el cliente tiene créditos activos, usar esos tipos
        // Si no tiene créditos pero tiene tipoPagoEsperado, usar ese
        const tiposAAsignar = tiposActivos.length > 0
          ? tiposActivos
          : (cliente.tipoPagoEsperado ? [cliente.tipoPagoEsperado] : []);

        // Si no hay tipos para asignar, no hacer nada
        if (tiposAAsignar.length === 0) return;

        tiposAAsignar.forEach(tipo => {
          // Buscar la card correspondiente
          // Convertir posiciones a número para comparación correcta
          const posicionCliente = Number(cliente.posicion);
          const cardIndex = cards.findIndex(c => {
            return c.cartera === carteraCliente &&
              c.tipoPago === tipo &&
              Number(c.posicion) === posicionCliente &&
              c.cliente === null;
          });

          if (cardIndex !== -1) {
            cards[cardIndex].cliente = cliente;
          }
        });
      }
    });


    return cards;
  }, [clientes, esBuga, esAdminOCeo, CAPACIDADES]);

  // Filtrar cards según búsqueda, cartera y tipo de pago
  const cardsFiltradas = todasLasCards.filter(card => {
    // 1. Primero verificar filtros
    const coincideCartera = filtroCartera === 'todas' || card.cartera === filtroCartera;

    let coincideTipo = filtroTipoPago === 'todos' || card.tipoPago === filtroTipoPago;

    // Lógica especial para filtrar tipos en K2 (donde card.tipoPago es 'general')
    // K3 se comporta como K1, con tipos específicos (semanal/quincenal)
    if (card.cartera === 'K2') {
      if (filtroTipoPago === 'todos') {
        coincideTipo = true;
      } else {
        // Si la card tiene cliente, verificar el tipo del cliente
        if (card.cliente) {
          const tipos = getTiposPagoActivos(card.cliente);
          const tipoCliente = tipos.length > 0 ? tipos[0] : card.cliente.tipoPagoEsperado;
          coincideTipo = tipoCliente === filtroTipoPago;
        } else {
          // Si la card está vacía, mostrarla para quincenal y mensual (ya que es 'general')
          coincideTipo = filtroTipoPago === 'quincenal' || filtroTipoPago === 'mensual';
        }
      }
    }

    if (!coincideCartera || !coincideTipo) {
      return false;
    }

    // 2. Luego verificar búsqueda (si aplica)
    if (searchTerm) {
      // Verificar si el término es un número (búsqueda por posición)
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

  // Contar clientes por cartera
  const clientesK1 = (esBuga ? 0 : clientes.filter(c => (c.cartera || 'K1') === 'K1').length);
  const clientesK2 = (esBuga ? 0 : clientes.filter(c => c.cartera === 'K2').length);
  const clientesK3 = (esBuga ? clientes.filter(c => (c.cartera || 'K3') === 'K3').length : (esAdminOCeo ? clientes.filter(c => c.cartera === 'K3').length : 0));

  // Total de clientes para admin/CEO (suma de K1, K2 y K3)
  const totalClientesAdmin = esAdminOCeo ? (clientesK1 + clientesK2 + clientesK3) : 0;

  const getCreditoInfo = (cliente, tipoPago) => {
    if (!cliente || !cliente.creditos) return null;
    // Find credit matching the payment type of the card
    const credito = cliente.creditos.find(c => {
      const estado = determinarEstadoCredito(c.cuotas, c);
      // Si el tipo de pago de la card es 'general', buscar cualquier crédito activo
      if (tipoPago === 'general') {
        return estado === 'activo' || estado === 'mora';
      }
      return c.tipo === tipoPago && (estado === 'activo' || estado === 'mora');
    });

    if (!credito) return null;

    // Calculate additional fields
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
    const idBase = credito.id || cliente.id?.slice(0, 8) || '000000';
    return `PRD${idBase.toString().padStart(10, '0')}`;
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
      <div className={`grid grid-cols-1 gap-6 mb-8 ${esAdminOCeo ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        {esBuga ? (
          // Solo K3 para domiciliarios de Buga y supervisores de Buga
          <>
            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Cartera K3</p>
                  <p className="text-3xl font-bold mt-1">{clientesK3}</p>
                  <p className="text-orange-100 text-xs mt-1">clientes</p>
                  <div className="mt-3 space-y-1 text-[11px]">
                    <p className="text-orange-100">Semanal: {ocupacion.K3?.semanal || 0}/{CAPACIDADES.K3.semanal}</p>
                    <p className="text-orange-100">Quincenal: {ocupacion.K3?.quincenal || 0}/{CAPACIDADES.K3.quincenal}</p>
                    <p className="text-orange-100">Mensual: {ocupacion.K3?.mensual || 0}/{CAPACIDADES.K3.mensual}</p>
                  </div>
                </div>
                <Briefcase className="h-12 w-12 text-orange-200" />
              </div>
            </div>
            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Clientes</p>
                  <p className="text-3xl font-bold mt-1">{clientes.length}</p>
                  <p className="text-purple-100 text-xs mt-1">registrados</p>
                </div>
                <UsersIcon className="h-12 w-12 text-purple-200" />
              </div>
            </div>
            <div></div>
          </>
        ) : esAdminOCeo ? (
          // Administradores y CEO ven las 3 carteras
          <>
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Cartera K1</p>
                  <p className="text-3xl font-bold mt-1">{clientesK1}</p>
                  <p className="text-blue-100 text-xs mt-1">clientes</p>
                  <div className="mt-3 space-y-1 text-[11px]">
                    <p className="text-blue-100">Semanal: {ocupacion.K1?.semanal || 0}/{CAPACIDADES.K1.semanal}</p>
                    <p className="text-blue-100">Quincenal: {ocupacion.K1?.quincenal || 0}/{CAPACIDADES.K1.quincenal}</p>
                    <p className="text-blue-100">Mensual: {ocupacion.K1?.mensual || 0}/{CAPACIDADES.K1.mensual}</p>
                  </div>
                </div>
                <Briefcase className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Cartera K2</p>
                  <p className="text-3xl font-bold mt-1">{clientesK2}</p>
                  <p className="text-green-100 text-xs mt-1">clientes</p>
                  <div className="mt-3 space-y-1 text-[11px]">
                    <p className="text-green-100">General: {ocupacion.K2?.general || 0}/{CAPACIDADES.K2.general}</p>
                  </div>
                </div>
                <Briefcase className="h-12 w-12 text-green-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Cartera K3</p>
                  <p className="text-3xl font-bold mt-1">{clientesK3}</p>
                  <p className="text-orange-100 text-xs mt-1">clientes</p>
                  <div className="mt-3 space-y-1 text-[11px]">
                    <p className="text-orange-100">Semanal: {ocupacion.K3?.semanal || 0}/{CAPACIDADES.K3.semanal}</p>
                    <p className="text-orange-100">Quincenal: {ocupacion.K3?.quincenal || 0}/{CAPACIDADES.K3.quincenal}</p>
                    <p className="text-orange-100">Mensual: {ocupacion.K3?.mensual || 0}/{CAPACIDADES.K3.mensual}</p>
                  </div>
                </div>
                <Briefcase className="h-12 w-12 text-orange-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Clientes</p>
                  <p className="text-3xl font-bold mt-1">{totalClientesAdmin}</p>
                  <div className="mt-3 space-y-1 text-[11px]">
                    <p className='text-purple-100 text-sm'>registrados</p>
                  </div>
                </div>
                <UsersIcon className="h-12 w-12 text-purple-200" />
              </div>
            </div>
          </>
        ) : (
          // Domiciliarios de Tuluá solo ven K1 y K2
          <>
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Cartera K1</p>
                  <p className="text-3xl font-bold mt-1">{clientesK1}</p>
                  <p className="text-blue-100 text-xs mt-1">clientes</p>
                  <div className="mt-3 space-y-1 text-[11px]">
                    <p className="text-blue-100">Semanal: {ocupacion.K1?.semanal || 0}/{CAPACIDADES.K1.semanal}</p>
                    <p className="text-blue-100">Quincenal: {ocupacion.K1?.quincenal || 0}/{CAPACIDADES.K1.quincenal}</p>
                    <p className="text-blue-100">Mensual: {ocupacion.K1?.mensual || 0}/{CAPACIDADES.K1.mensual}</p>
                  </div>
                </div>
                <Briefcase className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Cartera K2</p>
                  <p className="text-3xl font-bold mt-1">{clientesK2}</p>
                  <p className="text-green-100 text-xs mt-1">clientes</p>
                  <div className="mt-3 space-y-1 text-[11px]">
                    <p className="text-green-100">General: {ocupacion.K2?.general || 0}/{CAPACIDADES.K2.general}</p>
                  </div>
                </div>
                <Briefcase className="h-12 w-12 text-green-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Clientes</p>
                  <p className="text-3xl font-bold mt-1">{clientes.length}</p>
                  <p className="text-purple-100 text-xs mt-1">registrados</p>
                </div>
                <UsersIcon className="h-12 w-12 text-purple-200" />
              </div>
            </div>
          </>
        )}
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
          {esBuga ? (
            <>
              <button
                onClick={() => setFiltroCartera('todas')}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${filtroCartera === 'todas'
                  ? 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-400'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
              >
                Todas ({clientes.length})
              </button>
              <button
                onClick={() => setFiltroCartera('K3')}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${filtroCartera === 'K3'
                  ? 'bg-orange-100 text-orange-800 border-orange-300 ring-2 ring-orange-400'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Briefcase className="h-4 w-4" />
                Cartera K3 ({clientesK3})
              </button>
            </>
          ) : esAdminOCeo ? (
            // Administradores y CEO ven todas las carteras
            <>
              <button
                onClick={() => setFiltroCartera('todas')}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${filtroCartera === 'todas'
                  ? 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-400'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
              >
                Todas ({clientes.length})
              </button>
              <button
                onClick={() => setFiltroCartera('K1')}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${filtroCartera === 'K1'
                  ? 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-400'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Briefcase className="h-4 w-4" />
                Cartera K1 ({clientesK1})
              </button>
              <button
                onClick={() => setFiltroCartera('K2')}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${filtroCartera === 'K2'
                  ? 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-400'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Briefcase className="h-4 w-4" />
                Cartera K2 ({clientesK2})
              </button>
              <button
                onClick={() => setFiltroCartera('K3')}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${filtroCartera === 'K3'
                  ? 'bg-orange-100 text-orange-800 border-orange-300 ring-2 ring-orange-400'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Briefcase className="h-4 w-4" />
                Cartera K3 ({clientesK3})
              </button>
            </>
          ) : (
            // Domiciliarios de Tuluá solo ven K1 y K2
            <>
              <button
                onClick={() => setFiltroCartera('todas')}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${filtroCartera === 'todas'
                  ? 'bg-purple-100 text-purple-800 border-purple-300 ring-2 ring-purple-400'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
              >
                Todas ({clientes.length})
              </button>
              <button
                onClick={() => setFiltroCartera('K1')}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${filtroCartera === 'K1'
                  ? 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-400'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Briefcase className="h-4 w-4" />
                Cartera K1 ({clientesK1})
              </button>
              <button
                onClick={() => setFiltroCartera('K2')}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all flex items-center gap-2 ${filtroCartera === 'K2'
                  ? 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-400'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Briefcase className="h-4 w-4" />
                Cartera K2 ({clientesK2})
              </button>
            </>
          )}
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
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
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
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Ref. Crédito
                </th>
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
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Vencido
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Modalidad
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  RF
                </th>
                {esCEOoSupervisor && (
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-center">
                    Supervisión
                  </th>
                )}
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cardsFiltradas.map((card, index) => {
                const creditoInfo = getCreditoInfo(card.cliente, card.tipoPago);
                const esVacia = !card.cliente;

                let carteraRowClass = '';
                if (esVacia) {
                  // Filas vacías siempre blanco
                  carteraRowClass = 'bg-white';
                } else {
                  // Determinar clase de color según la cartera del cliente
                  if (card.cartera === 'K1') {
                    carteraRowClass = 'bg-blue-100 hover:bg-blue-200 border-b';
                  } else if (card.cartera === 'K2') {
                    carteraRowClass = 'bg-green-100 hover:bg-green-200 border-b';
                  } else if (card.cartera === 'K3') {
                    carteraRowClass = 'bg-orange-100 hover:bg-orange-200 border-b';
                  } else {
                    carteraRowClass = 'hover:bg-gray-50 border-b'; // Default for other carteras
                  }

                  // Si el cliente tiene RF activo, sobrescribir con color morado claro
                  if (card.cliente.rf === 'RF') {
                    carteraRowClass = 'bg-purple-100 hover:bg-purple-200 border-b';
                  }
                }

                return (
                  <tr
                    key={`${card.cartera}-${card.tipoPago}-${card.posicion}-${index}`}
                    className={carteraRowClass}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-black text-base text-black">
                        #{card.posicion}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {esVacia ? (
                        <span className="text-gray-400 italic">Espacio Disponible ({card.cartera})</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{card.cliente.nombre}</span>
                          <span className="text-xs text-gray-500">CC: {card.cliente.documento}</span>
                          <span className="flex items-center gap-1 text-gray-500 text-sm">
                            <Phone className="h-3 w-3" /> {card.cliente.telefono}
                          </span>
                          {card.cliente.barrio && (
                            <span className="text-xs flex items-center gap-1 text-gray-600 font-medium">
                              <MapPin className="h-3 w-3" /> {card.cliente.barrio}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {creditoInfo ? formatearMoneda(creditoInfo.monto) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {creditoInfo ? formatearMoneda(creditoInfo.valorCuota) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {creditoInfo ? formatearMoneda(creditoInfo.saldoPendiente) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {esVacia || !creditoInfo ? (
                        '-'
                      ) : creditoInfo.estaVencido ? (
                        <div className="text-red-600 font-bold">
                          (SI) - <span className="text-xs">{formatearFechaCorta(creditoInfo.fechaVencimiento)}</span>
                          {creditoInfo.cuotasVencidasCount > 1 && (
                            <div className="text-xs text-red-500 mt-0.5 font-normal">
                              ({creditoInfo.cuotasVencidasCount} cuotas)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-green-600 font-medium">Al día</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {creditoInfo?.tipo ? (creditoInfo.tipo.charAt(0).toUpperCase() + creditoInfo.tipo.slice(1)) : card.tipoPago}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {esVacia ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const currentValue = card.cliente.rf || '';
                              const newValue = currentValue === 'RF' ? '' : 'RF';

                              try {
                                await actualizarCliente(card.cliente.id, { rf: newValue });
                              } catch (error) {
                                console.error('Error actualizando RF:', error);
                                alert('Error al actualizar RF');
                              }
                            }}
                            className={`px-3 py-1.5 text-sm border rounded-md transition-all flex items-center gap-1 min-w-[80px] justify-between focus:outline-none focus:ring-2 focus:ring-offset-1 ${card.cliente.rf === 'RF'
                              ? 'bg-purple-700 border-purple-800 text-white hover:bg-purple-800 focus:ring-purple-500'
                              : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50 focus:ring-blue-500'
                              }`}
                          >
                            <span className="font-bold">
                              {card.cliente.rf === 'RF' ? 'RF' : '-'}
                            </span>
                            <ChevronDown className={`h-4 w-4 ${card.cliente.rf === 'RF' ? 'text-white' : 'text-gray-400'}`} />
                          </button>
                        </div>
                      )}
                    </td>
                    {esCEOoSupervisor && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        {esVacia ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <div className="relative flex justify-center">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const newValue = !card.cliente.enSupervision;
                                try {
                                  await actualizarCliente(card.cliente.id, { enSupervision: newValue });
                                } catch (error) {
                                  console.error('Error actualizando supervisión:', error);
                                  alert('Error al actualizar supervisión');
                                }
                              }}
                              className={`px-3 py-1.5 text-sm border rounded-md transition-all flex items-center gap-1 min-w-[80px] justify-between focus:outline-none focus:ring-2 focus:ring-offset-1 ${card.cliente.enSupervision
                                ? 'bg-emerald-700 border-emerald-800 text-white hover:bg-emerald-800 focus:ring-emerald-500'
                                : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50 focus:ring-blue-500'
                                }`}
                              title={card.cliente.enSupervision ? 'Quitar de supervisión' : 'Enviar a supervisión'}
                            >
                              <span className="font-bold">
                                {card.cliente.enSupervision ? 'Sí' : '-'}
                              </span>
                              <ChevronDown className={`h-4 w-4 ${card.cliente.enSupervision ? 'text-white' : 'text-gray-400'}`} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      {esVacia ? (
                        hasPermission('crearClientes') && user?.role !== 'domiciliario' && (
                          <button
                            onClick={() => handleAgregarDesdeCard(card.cartera, card.tipoPago, card.posicion)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" /> Agregar
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => navigate(`/cliente/${card.cliente.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ver Detalle
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

      {/* Formulario de cliente */}
      {showForm && (
        <ClienteForm
          onSubmit={handleAgregarCliente}
          onClose={() => {
            setShowForm(false);
            setFormCartera(null);
            setFormTipoPago(null);
            setFormCartera(null);
            setFormTipoPago(null);
            setFormPosicion(null);
            setInitialData(null);
          }}
          carteraPredefinida={formCartera}
          tipoPagoPredefinido={formTipoPago}
          initialData={initialData}
        />
      )}
    </div>
  );
};

export default Clientes;
