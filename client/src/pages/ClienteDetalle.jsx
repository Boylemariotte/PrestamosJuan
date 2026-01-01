import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, User, Phone, MapPin, Mail, UserCheck, Loader2, Archive, Award, Check, Calendar, AlertCircle, Ban, AlertOctagon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ClienteForm from '../components/Clientes/ClienteForm';
import CreditoCard from '../components/Creditos/CreditoCard';
import CreditoForm from '../components/Creditos/CreditoForm';
import CreditoDetalle from '../components/Creditos/CreditoDetalle';
import MapaUbicaciones from '../components/Clientes/MapaUbicaciones';
import ActualizarUbicacion from '../components/Clientes/ActualizarUbicacion';
import { determinarEstadoCredito } from '../utils/creditCalculations';
import api from '../services/api';

const ClienteDetalle = ({ soloLectura = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtenerCliente, actualizarCliente, eliminarCliente, archivarCliente, agregarCredito, actualizarCoordenadasGPS, asignarEtiquetaCliente, loading, clientes } = useApp();
  const { user } = useAuth();
  const esDomiciliario = user?.role === 'domiciliario';
  const esSupervisor = user?.role === 'supervisor';
  const esDomiciliarioOSupervisor = esDomiciliario || esSupervisor;

  const [showEditForm, setShowEditForm] = useState(false);
  const [showCreditoForm, setShowCreditoForm] = useState(false);
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
  const [clienteLocal, setClienteLocal] = useState(null);
  const [cargandoCliente, setCargandoCliente] = useState(true);
  const [clienteNoEncontrado, setClienteNoEncontrado] = useState(false);
  const [mostrarSelectorEtiqueta, setMostrarSelectorEtiqueta] = useState(false);

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

  // Intentar obtener el cliente del contexto primero
  const clienteDelContexto = obtenerCliente(id);

  // Si el contexto está cargando o el cliente no está en el contexto, intentar cargarlo directamente
  useEffect(() => {
    const cargarCliente = async () => {
      // Si ya está en el contexto y no está cargando, usarlo
      if (clienteDelContexto && !loading) {
        setClienteLocal(clienteDelContexto);
        setCargandoCliente(false);
        return;
      }

      // Si el contexto está cargando, esperar un poco más
      if (loading) {
        // Esperar a que termine la carga del contexto
        return;
      }

      // Si no está en el contexto y ya terminó de cargar, intentar cargarlo directamente
      if (!clienteDelContexto && !loading) {
        try {
          setCargandoCliente(true);
          const response = await api.get(`/clientes/${id}`);
          if (response.success && response.data) {
            setClienteLocal(response.data);
            setClienteNoEncontrado(false);
          } else {
            setClienteNoEncontrado(true);
          }
        } catch (error) {
          console.error('Error cargando cliente:', error);
          setClienteNoEncontrado(true);
        } finally {
          setCargandoCliente(false);
        }
      }
    };

    cargarCliente();
  }, [id, clienteDelContexto, loading, clientes]);

  // Usar el cliente del contexto si está disponible, sino el local
  const cliente = clienteDelContexto || clienteLocal;

  // Determinar el tipo de pago predefinido (OBLIGATORIO) para el cliente
  // Solo se fuerza si tiene créditos activos o en mora
  // IMPORTANTE: Este hook debe estar antes de cualquier return condicional
  const tipoPagoPredefinido = useMemo(() => {
    if (!cliente) return null;

    const creditosActivos = (cliente.creditos || []).filter(c => {
      const estado = determinarEstadoCredito(c.cuotas, c);
      return estado === 'activo' || estado === 'mora';
    });

    if (creditosActivos.length > 0) {
      return creditosActivos[0].tipo;
    }

    return null;
  }, [cliente]);


  // Handlers - deben estar antes de los returns condicionales
  const handleActualizarCliente = (clienteData) => {
    actualizarCliente(id, clienteData);
    setShowEditForm(false);
  };

  const handleEliminarCliente = () => {
    if (confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
      eliminarCliente(id);
      navigate('/');
    }
  };

  const handleArchivarCliente = async () => {
    if (confirm('¿Estás seguro de archivar este cliente? Se liberará su posición pero se mantendrá toda su información.')) {
      try {
        await archivarCliente(id);
        navigate('/');
      } catch (error) {
        alert(error.response?.data?.error || 'No se pudo archivar el cliente.');
      }
    }
  };

  const handleAgregarCredito = async (creditoData) => {
    try {
      await agregarCredito(id, creditoData);
      setShowCreditoForm(false);
    } catch (e) {
      alert(e.message || 'No fue posible crear el crédito.');
    }
  };

  const handleAsignarEtiqueta = async (etiqueta) => {
    try {
      await asignarEtiquetaCliente(id, etiqueta);
      setMostrarSelectorEtiqueta(false);
    } catch (error) {
      alert('No se pudo asignar la etiqueta al cliente.');
    }
  };

  // Mostrar carga mientras se obtiene el cliente
  if (loading || cargandoCliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  // Mostrar error solo si realmente no se encontró
  if (clienteNoEncontrado || !cliente) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cliente no encontrado</h2>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver a Clientes
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(soloLectura ? '/archivados' : '/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver {soloLectura ? 'a Archivados' : 'a Clientes'}
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center">
            <div className="bg-sky-100 p-4 rounded-full shrink-0">
              <User className="h-8 w-8 text-sky-600" />
            </div>
            <div className="ml-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-all">{cliente.nombre}</h1>
                {/* Etiqueta del cliente */}
                {cliente.etiqueta && ETIQUETAS[cliente.etiqueta] && (
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium border-2 flex items-center gap-1 ${ETIQUETAS[cliente.etiqueta].color}`}>
                    {ETIQUETAS[cliente.etiqueta].icono && React.createElement(ETIQUETAS[cliente.etiqueta].icono, { className: 'h-4 w-4' })}
                    {ETIQUETAS[cliente.etiqueta].nombre}
                  </span>
                )}
                {/* Botón para asignar etiqueta (solo si no está en modo solo lectura y no es domiciliario ni supervisor) */}
                {!soloLectura && !esDomiciliarioOSupervisor && (
                  <button
                    onClick={() => setMostrarSelectorEtiqueta(true)}
                    className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-300 flex items-center gap-1 transition-colors"
                    title="Asignar etiqueta"
                  >
                    <Award className="h-4 w-4" />
                    {cliente.etiqueta && cliente.etiqueta !== 'sin-etiqueta' ? 'Cambiar' : 'Etiquetar'}
                  </button>
                )}
              </div>
              <p className="text-gray-600">CC: {cliente.documento}</p>
            </div>
          </div>

          {!soloLectura && !esDomiciliarioOSupervisor && (
            <div className="flex space-x-3 w-full md:w-auto justify-end">
              <button
                onClick={() => setShowEditForm(true)}
                className="btn-secondary flex items-center justify-center flex-1 md:flex-none"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
              {!cliente.esArchivado && (
                <button
                  onClick={handleArchivarCliente}
                  className="btn-secondary flex items-center justify-center flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archivar
                </button>
              )}
              <button
                onClick={handleEliminarCliente}
                className="btn-danger flex items-center justify-center flex-1 md:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Información del cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Columna Izquierda: Información de Contacto */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información de Contacto
          </h2>
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <Phone className="h-5 w-5 mr-3 text-gray-400" />
              <span>{cliente.telefono}</span>
            </div>

            {cliente.direccion && (
              <div className="flex items-start text-gray-700">
                <MapPin className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Residencia</p>
                  <span>{cliente.direccion}</span>
                </div>
              </div>
            )}

            {cliente.direccionTrabajo && (
              <div className="flex items-start text-gray-700">
                <MapPin className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Trabajo</p>
                  <span>{cliente.direccionTrabajo}</span>
                </div>
              </div>
            )}

            {cliente.correo && (
              <div className="flex items-center text-gray-700">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <span>{cliente.correo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Fiador */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Fiador
          </h2>
          {cliente.fiador ? (
            <div className="space-y-3">
              <p className="font-medium text-gray-900">{cliente.fiador.nombre}</p>
              <p className="text-sm text-gray-600">CC: {cliente.fiador.documento}</p>
              <p className="text-sm text-gray-600">Tel: {cliente.fiador.telefono}</p>
              {cliente.fiador.direccion && (
                <div>
                  <p className="text-xs text-gray-500">Residencia</p>
                  <p className="text-sm text-gray-600">{cliente.fiador.direccion}</p>
                </div>
              )}
              {cliente.fiador.direccionTrabajo && (
                <div>
                  <p className="text-xs text-gray-500">Trabajo</p>
                  <p className="text-sm text-gray-600">{cliente.fiador.direccionTrabajo}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No hay información del fiador</p>
          )}
        </div>
      </div>

      {/* Sección de actualización de ubicaciones GPS */}
      <div className="mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Actualizar ubicaciones GPS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">Cliente</p>
              {cliente.direccion && (
                <ActualizarUbicacion
                  tipo="residencia"
                  onActualizar={(tipo, coords) => actualizarCoordenadasGPS(id, tipo, coords, 'cliente')}
                  coordenadasActuales={cliente.coordenadasResidencia}
                  label="Actualizar ubicación GPS de residencia"
                />
              )}
              {cliente.direccionTrabajo && (
                <ActualizarUbicacion
                  tipo="trabajo"
                  onActualizar={(tipo, coords) => actualizarCoordenadasGPS(id, tipo, coords, 'cliente')}
                  coordenadasActuales={cliente.coordenadasTrabajo}
                  label="Actualizar ubicación GPS de trabajo"
                />
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">Fiador</p>
              {cliente.fiador?.direccion && (
                <ActualizarUbicacion
                  tipo="residencia"
                  onActualizar={(tipo, coords) => actualizarCoordenadasGPS(id, tipo, coords, 'fiador')}
                  coordenadasActuales={cliente.fiador?.coordenadasResidencia}
                  label="Actualizar ubicación GPS de residencia del fiador"
                />
              )}
              {cliente.fiador?.direccionTrabajo && (
                <ActualizarUbicacion
                  tipo="trabajo"
                  onActualizar={(tipo, coords) => actualizarCoordenadasGPS(id, tipo, coords, 'fiador')}
                  coordenadasActuales={cliente.fiador?.coordenadasTrabajo}
                  label="Actualizar ubicación GPS de trabajo del fiador"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mapa de Ubicaciones - Ocupa todo el ancho */}
      {((cliente.direccion || cliente.direccionTrabajo) ||
        (cliente.fiador && (cliente.fiador.direccion || cliente.fiador.direccionTrabajo))) &&
        !showEditForm && !showCreditoForm && !creditoSeleccionado && (
          <div className="mb-8">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Ubicaciones en el Mapa
              </h2>
              <MapaUbicaciones
                clienteDireccion={cliente.direccion}
                clienteDireccionTrabajo={cliente.direccionTrabajo}
                clienteNombre={cliente.nombre}
                fiadorDireccion={cliente.fiador?.direccion}
                fiadorDireccionTrabajo={cliente.fiador?.direccionTrabajo}
                fiadorNombre={cliente.fiador?.nombre}
                clienteCoordenadasResidencia={cliente.coordenadasResidencia}
                clienteCoordenadasTrabajo={cliente.coordenadasTrabajo}
                fiadorCoordenadasResidencia={cliente.fiador?.coordenadasResidencia}
                fiadorCoordenadasTrabajo={cliente.fiador?.coordenadasTrabajo}
              />
            </div>
          </div>
        )}

      {/* Créditos */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Créditos</h2>
          {!soloLectura && !esDomiciliarioOSupervisor && (
            <button
              onClick={() => setShowCreditoForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Crédito
            </button>
          )}
        </div>

        {cliente.creditos && cliente.creditos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cliente.creditos.map((credito) => (
              <CreditoCard
                key={credito.id}
                credito={credito}
                onClick={() => setCreditoSeleccionado(credito)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay créditos registrados
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando el primer crédito para este cliente
            </p>
            {!soloLectura && !esDomiciliarioOSupervisor && (
              <button
                onClick={() => setShowCreditoForm(true)}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Crédito
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {showEditForm && (
        <ClienteForm
          cliente={cliente}
          onSubmit={handleActualizarCliente}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {showCreditoForm && (
        <CreditoForm
          onSubmit={handleAgregarCredito}
          onClose={() => setShowCreditoForm(false)}
          carteraCliente={cliente.cartera || 'K1'}
          tipoPagoPredefinido={tipoPagoPredefinido}
          tipoPagoPreferido={cliente.tipoPagoEsperado}
        />
      )}

      {creditoSeleccionado && (
        <CreditoDetalle
          credito={creditoSeleccionado}
          clienteId={id}
          cliente={cliente}
          onClose={() => setCreditoSeleccionado(null)}
          soloLectura={soloLectura}
        />
      )}

      {/* Modal para seleccionar etiqueta */}
      {mostrarSelectorEtiqueta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-600" />
              Asignar Etiqueta a {cliente.nombre}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona una etiqueta para clasificar el comportamiento del cliente:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {Object.entries(ETIQUETAS).map(([key, etiqueta]) => (
                <button
                  key={key}
                  onClick={() => handleAsignarEtiqueta(key)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${etiqueta.color} ${cliente.etiqueta === key ? 'ring-4 ring-purple-400' : ''}`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {etiqueta.icono && React.createElement(etiqueta.icono, { className: 'h-8 w-8' })}
                  </div>
                  <h5 className="font-bold text-center">{etiqueta.nombre}</h5>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setMostrarSelectorEtiqueta(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClienteDetalle;
