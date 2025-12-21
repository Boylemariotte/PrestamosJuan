import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, User, Phone, MapPin, Mail, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ClienteForm from '../components/Clientes/ClienteForm';
import CreditoCard from '../components/Creditos/CreditoCard';
import CreditoForm from '../components/Creditos/CreditoForm';
import CreditoDetalle from '../components/Creditos/CreditoDetalle';
import MapaUbicaciones from '../components/Clientes/MapaUbicaciones';
import ActualizarUbicacion from '../components/Clientes/ActualizarUbicacion';
import { determinarEstadoCredito } from '../utils/creditCalculations';

const ClienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtenerCliente, actualizarCliente, eliminarCliente, agregarCredito, actualizarCoordenadasGPS } = useApp();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showCreditoForm, setShowCreditoForm] = useState(false);
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);

  const cliente = obtenerCliente(id);

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cliente no encontrado</h2>
        <button onClick={() => navigate('/')} className="btn-primary">
          Volver a Clientes
        </button>
      </div>
    );
  }

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

  const handleAgregarCredito = async (creditoData) => {
    try {
      await agregarCredito(id, creditoData);
      setShowCreditoForm(false);
    } catch (e) {
      alert(e.message || 'No fue posible crear el crédito.');
    }
  };

  // Determinar el tipo de pago predefinido (OBLIGATORIO) para el cliente
  // Solo se fuerza si tiene créditos activos o en mora
  const tipoPagoPredefinido = useMemo(() => {
    const creditosActivos = (cliente.creditos || []).filter(c => {
      const estado = determinarEstadoCredito(c.cuotas, c);
      return estado === 'activo' || estado === 'mora';
    });

    if (creditosActivos.length > 0) {
      return creditosActivos[0].tipo;
    }

    return null;
  }, [cliente]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a Clientes
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center">
            <div className="bg-sky-100 p-4 rounded-full shrink-0">
              <User className="h-8 w-8 text-sky-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-all">{cliente.nombre}</h1>
              <p className="text-gray-600">CC: {cliente.documento}</p>
            </div>
          </div>

          <div className="flex space-x-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowEditForm(true)}
              className="btn-secondary flex items-center justify-center flex-1 md:flex-none"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </button>
            <button
              onClick={handleEliminarCliente}
              className="btn-danger flex items-center justify-center flex-1 md:flex-none"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </button>
          </div>
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
                  onActualizar={(tipo, coords) => actualizarCoordenadasGPS(cliente.id, tipo, coords, 'cliente')}
                  coordenadasActuales={cliente.coordenadasResidencia}
                  label="Actualizar ubicación GPS de residencia"
                />
              )}
              {cliente.direccionTrabajo && (
                <ActualizarUbicacion
                  tipo="trabajo"
                  onActualizar={(tipo, coords) => actualizarCoordenadasGPS(cliente.id, tipo, coords, 'cliente')}
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
                  onActualizar={(tipo, coords) => actualizarCoordenadasGPS(cliente.id, tipo, coords, 'fiador')}
                  coordenadasActuales={cliente.fiador?.coordenadasResidencia}
                  label="Actualizar ubicación GPS de residencia del fiador"
                />
              )}
              {cliente.fiador?.direccionTrabajo && (
                <ActualizarUbicacion
                  tipo="trabajo"
                  onActualizar={(tipo, coords) => actualizarCoordenadasGPS(cliente.id, tipo, coords, 'fiador')}
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
          <button
            onClick={() => setShowCreditoForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Crédito
          </button>
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
            <button
              onClick={() => setShowCreditoForm(true)}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Crédito
            </button>
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
        />
      )}

    </div>
  );
};

export default ClienteDetalle;
