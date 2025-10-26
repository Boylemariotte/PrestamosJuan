import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, User, Phone, MapPin, Mail, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ClienteForm from '../components/Clientes/ClienteForm';
import CreditoCard from '../components/Creditos/CreditoCard';
import CreditoForm from '../components/Creditos/CreditoForm';
import CreditoDetalle from '../components/Creditos/CreditoDetalle';

const ClienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtenerCliente, actualizarCliente, eliminarCliente, agregarCredito } = useApp();
  
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

  const handleAgregarCredito = (creditoData) => {
    agregarCredito(id, creditoData);
    setShowCreditoForm(false);
  };

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

        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="bg-sky-100 p-4 rounded-full">
              <User className="h-8 w-8 text-sky-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">{cliente.nombre}</h1>
              <p className="text-gray-600">CC: {cliente.documento}</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowEditForm(true)}
              className="btn-secondary flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </button>
            <button
              onClick={handleEliminarCliente}
              className="btn-danger flex items-center"
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
