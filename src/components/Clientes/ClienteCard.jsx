import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Mail, UserCheck, CreditCard, AlertCircle, Briefcase } from 'lucide-react';
import { determinarEstadoCredito, getColorEstado } from '../../utils/creditCalculations';

const ClienteCard = ({ cliente }) => {
  const navigate = useNavigate();

  const creditosActivos = cliente.creditos?.filter(c => {
    const estado = determinarEstadoCredito(c.cuotas);
    return estado === 'activo' || estado === 'mora';
  }).length || 0;

  const creditosEnMora = cliente.creditos?.filter(c => {
    const estado = determinarEstadoCredito(c.cuotas);
    return estado === 'mora';
  }).length || 0;

  const handleClick = () => {
    navigate(`/cliente/${cliente.id}`);
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
      bg: 'bg-green-100',
      border: 'border-green-300',
      icon: 'bg-green-200 text-green-700',
      badge: 'bg-green-200 text-green-800 border-green-400'
    }
  };

  const cartera = cliente.cartera || 'K1';
  const colors = carteraColors[cartera];

  return (
    <div
      onClick={handleClick}
      className={`card cursor-pointer hover:scale-[1.02] transition-transform duration-200 ${colors.bg} ${colors.border} border-2`}
    >
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
                {cartera}
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

      <div className="border-t pt-3 flex items-center justify-between">
        <div className="flex items-center text-sm">
          <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-gray-600">
            {creditosActivos} crédito{creditosActivos !== 1 ? 's' : ''} activo{creditosActivos !== 1 ? 's' : ''}
          </span>
        </div>
        
        <button
          onClick={handleClick}
          className="text-sky-600 hover:text-sky-700 text-sm font-medium"
        >
          Ver detalles →
        </button>
      </div>
    </div>
  );
};

export default ClienteCard;
