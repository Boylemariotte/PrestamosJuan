import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Mail, UserCheck, CreditCard, AlertCircle, Briefcase, Plus, Trash2 } from 'lucide-react';
import { determinarEstadoCredito, getColorEstado } from '../../utils/creditCalculations';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const ClienteCard = ({ cliente, cardVacia, numeroCard, cartera, tipoPago, onAgregarCliente }) => {
  const navigate = useNavigate();
  const { eliminarCliente } = useApp();
  const { user } = useAuth();
  const esDomiciliario = user?.role === 'domiciliario';

  // Si es una card vacía, mostrar diseño diferente
  if (cardVacia) {
    const carteraColors = {
      K1: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-600',
        badge: 'bg-blue-100 text-blue-700 border-blue-300'
      },
      K2: {
        bg: 'bg-green-100',
        border: 'border-green-300',
        icon: 'bg-green-200 text-green-700',
        badge: 'bg-green-200 text-green-800 border-green-400'
      },
      K3: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'bg-orange-100 text-orange-600',
        badge: 'bg-orange-100 text-orange-700 border-orange-300'
      }
    };
    const colors = carteraColors[cartera] || carteraColors.K1;
    const nombresTipos = {
      diario: 'Diario',
      semanal: 'Semanal',
      quincenal: 'Quincenal',
      mensual: 'Mensual'
    };

    return (
      <div
        className={`card hover:scale-[1.02] transition-transform duration-200 bg-gray-100 border-gray-300 border-2 relative`}
      >
        <div className="absolute top-3 left-3 text-gray-600 text-xl font-bold">
          {numeroCard}
        </div>
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
          <div className="bg-gray-200 p-4 rounded-full mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 mb-2">Card vacía</p>
            <div className="flex items-center gap-2 justify-center mb-2">
              <span className={`px-2 py-1 rounded-md text-xs font-bold border ${colors.badge}`}>
                <Briefcase className="h-3 w-3 inline mr-1" />
                {cartera}
              </span>
              <span className="px-2 py-1 rounded-md text-xs font-medium border bg-gray-200 text-gray-700 border-gray-300">
                {nombresTipos[tipoPago] || tipoPago}
              </span>
            </div>
          </div>
          {!esDomiciliario && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAgregarCliente(cartera, tipoPago, numeroCard);
              }}
              className="btn-primary flex items-center gap-2 w-full justify-center"
            >
              <Plus className="h-4 w-4" />
              Agregar cliente a esta card
            </button>
          )}
        </div>
      </div>
    );
  }

  // Obtener créditos activos con su información
  const creditosActivosLista = cliente.creditos?.filter(c => {
    const estado = determinarEstadoCredito(c.cuotas, c);
    return estado === 'activo' || estado === 'mora';
  }) || [];

  const creditosActivos = creditosActivosLista.length;

  const creditosEnMora = cliente.creditos?.filter(c => {
    const estado = determinarEstadoCredito(c.cuotas, c);
    return estado === 'mora';
  }).length || 0;

  // Obtener tipos únicos de créditos activos
  const tiposCreditosActivos = [...new Set(creditosActivosLista.map(c => c.tipo))];

  // Nombres de tipos de crédito
  const nombresTipos = {
    diario: 'Diario',
    semanal: 'Semanal',
    quincenal: 'Quincenal',
    mensual: 'Mensual'
  };

  // Colores para los tipos de crédito
  const coloresTipos = {
    diario: 'bg-purple-100 text-purple-700 border-purple-300',
    semanal: 'bg-blue-100 text-blue-700 border-blue-300',
    quincenal: 'bg-orange-100 text-orange-700 border-orange-300',
    mensual: 'bg-green-100 text-green-700 border-green-300'
  };

  const handleClick = () => {
    navigate(`/cliente/${cliente.id}`);
  };

  const handleEliminar = (e) => {
    e.stopPropagation(); // Evitar que se active el onClick de la card
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar al cliente "${cliente.nombre}"?\n\nEsta acción eliminará todos los datos del cliente, incluyendo sus créditos, y no se puede deshacer.`
    );
    if (confirmar) {
      eliminarCliente(cliente.id);
    }
  };

  // Colores según cartera
  const carteraColors = {
    K1: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      badge: 'bg-blue-100 text-blue-700 border-blue-300'
    },
    K2: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      icon: 'bg-green-200 text-green-700',
      badge: 'bg-green-200 text-green-800 border-green-400'
    },
    K3: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'bg-orange-100 text-orange-600',
      badge: 'bg-orange-100 text-orange-700 border-orange-300'
    }
  };

  const carteraCliente = cliente.cartera || 'K1';
  const colors = carteraColors[carteraCliente] || carteraColors.K1;

  return (
    <div
      onClick={handleClick}
      className={`card cursor-pointer hover:scale-[1.02] transition-transform duration-200 ${colors.bg} ${colors.border} border-2 relative`}
    >
      <div className="absolute top-3 left-3 text-blue-900 text-xl font-bold">
        {cliente.posicion || 'N/A'}
      </div>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center flex-1">
          <div className={`${colors.icon} p-3 rounded-full`}>
            <User className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{cliente.nombre}</h3>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colors.badge} flex items-center gap-1`}>
                <Briefcase className="h-3 w-3" />
                {carteraCliente}
              </span>
            </div>
            <p className="text-sm text-gray-500">CC: {cliente.documento}</p>
          </div>
        </div>

        {creditosEnMora > 0 && (
          <div className="flex items-center text-red-600 bg-red-100 px-3 py-1 rounded-full ml-2">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">En mora</span>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2 text-gray-400" />
          {cliente.telefono}
        </div>

        {cliente.direccion && (
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500 block">Residencia:</span>
              <span>{cliente.direccion}</span>
            </div>
          </div>
        )}

        {cliente.direccionTrabajo && (
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-gray-500 block">Trabajo:</span>
              <span>{cliente.direccionTrabajo}</span>
            </div>
          </div>
        )}

        {cliente.correo && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2 text-gray-400" />
            {cliente.correo}
          </div>
        )}
      </div>

      {cliente.fiador && (
        <div className="border-t pt-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">Fiador:</span>
          </div>
          <div className="ml-6 space-y-1">
            <p className="text-sm text-gray-700 font-medium">{cliente.fiador.nombre}</p>
            <p className="text-xs text-gray-500">CC: {cliente.fiador.documento}</p>
            <p className="text-xs text-gray-500">Tel: {cliente.fiador.telefono}</p>
            {cliente.fiador.direccion && (
              <div className="text-xs text-gray-500">
                <span className="text-gray-400">Residencia: </span>
                {cliente.fiador.direccion}
              </div>
            )}
            {cliente.fiador.direccionTrabajo && (
              <div className="text-xs text-gray-500">
                <span className="text-gray-400">Trabajo: </span>
                {cliente.fiador.direccionTrabajo}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tipos de créditos activos */}
      {tiposCreditosActivos.length > 0 && (
        <div className="border-t pt-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-600">Tipos de Crédito Activos:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tiposCreditosActivos.map((tipo) => (
              <span
                key={tipo}
                className={`px-2 py-1 rounded-md text-xs font-medium border ${coloresTipos[tipo] || 'bg-gray-100 text-gray-700 border-gray-300'}`}
              >
                {nombresTipos[tipo] || tipo}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-3 flex items-center justify-between">
        <div className="flex items-center text-sm">
          <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-gray-600">
            {creditosActivos} crédito{creditosActivos !== 1 ? 's' : ''} activo{creditosActivos !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!esDomiciliario && (
            <button
              onClick={handleEliminar}
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors"
              title="Eliminar cliente"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          )}
          <button
            onClick={handleClick}
            className="text-sky-600 hover:text-sky-700 text-sm font-medium"
          >
            Ver detalles →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClienteCard;
