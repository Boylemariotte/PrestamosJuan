import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ClienteForm = ({ cliente, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    direccion: '',
    direccionTrabajo: '',
    correo: '',
    cartera: 'K1', // Por defecto K1
    fiador: {
      nombre: '',
      documento: '',
      telefono: '',
      direccion: '',
      direccionTrabajo: ''
    }
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        documento: cliente.documento || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        direccionTrabajo: cliente.direccionTrabajo || '',
        correo: cliente.correo || '',
        cartera: cliente.cartera || 'K1',
        fiador: {
          nombre: cliente.fiador?.nombre || '',
          documento: cliente.fiador?.documento || '',
          telefono: cliente.fiador?.telefono || '',
          direccion: cliente.fiador?.direccion || '',
          direccionTrabajo: cliente.fiador?.direccionTrabajo || ''
        }
      });
    }
  }, [cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('fiador.')) {
      const fiadorField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        fiador: {
          ...prev.fiador,
          [fiadorField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información del Cliente */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre Completo *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Documento *</label>
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Teléfono *</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Correo Electrónico</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Dirección de Residencia</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Calle 45 #23-15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Dirección de Trabajo</label>
                <input
                  type="text"
                  name="direccionTrabajo"
                  value={formData.direccionTrabajo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Carrera 10 #50-30, Oficina 201"
                />
              </div>

              {/* Selección de Cartera */}
              <div className="md:col-span-2">
                <label className="label">Cartera *</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    formData.cartera === 'K1' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }">
                    <input
                      type="radio"
                      name="cartera"
                      value="K1"
                      checked={formData.cartera === 'K1'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <span className="font-semibold text-gray-900">Cartera K1</span>
                      <p className="text-sm text-gray-500">Cartera principal</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    formData.cartera === 'K2' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }">
                    <input
                      type="radio"
                      name="cartera"
                      value="K2"
                      checked={formData.cartera === 'K2'}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <div className="ml-3">
                      <span className="font-semibold text-gray-900">Cartera K2</span>
                      <p className="text-sm text-gray-500">Cartera secundaria</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Fiador */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Fiador
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre Completo *</label>
                <input
                  type="text"
                  name="fiador.nombre"
                  value={formData.fiador.nombre}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Documento *</label>
                <input
                  type="text"
                  name="fiador.documento"
                  value={formData.fiador.documento}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Teléfono *</label>
                <input
                  type="tel"
                  name="fiador.telefono"
                  value={formData.fiador.telefono}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Dirección de Residencia</label>
                <input
                  type="text"
                  name="fiador.direccion"
                  value={formData.fiador.direccion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Calle 45 #23-15"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Dirección de Trabajo</label>
                <input
                  type="text"
                  name="fiador.direccionTrabajo"
                  value={formData.fiador.direccionTrabajo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Carrera 10 #50-30, Oficina 201"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {cliente ? 'Actualizar' : 'Crear'} Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteForm;
