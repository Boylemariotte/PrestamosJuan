import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { BARRIOS_TULUA } from '../../constants/barrios';

const ClienteForm = ({ cliente, onSubmit, onClose, carteraPredefinida, tipoPagoPredefinido, initialData }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    direccion: '',
    barrio: '',
    direccionTrabajo: '',
    correo: '',
    cartera: carteraPredefinida || 'K1', // Por defecto K1 o predefinida
    tipoPago: tipoPagoPredefinido || '', // Tipo de pago predefinido (solo visual)
    tipoPagoEsperado: '', // Nuevo campo para preferencia
    fiador: {
      nombre: '',
      documento: '',
      telefono: '',
      direccion: '',
      barrio: '',
      direccionTrabajo: ''
    }
  });

  const [showBarrios, setShowBarrios] = useState(false);
  const [barrioSearch, setBarrioSearch] = useState('');
  const [usarOtroBarrio, setUsarOtroBarrio] = useState(false);
  const [otroBarrio, setOtroBarrio] = useState('');
  const barriosRef = useRef(null);

  const [showBarriosFiador, setShowBarriosFiador] = useState(false);
  const [barrioSearchFiador, setBarrioSearchFiador] = useState('');
  const [usarOtroBarrioFiador, setUsarOtroBarrioFiador] = useState(false);
  const [otroBarrioFiador, setOtroBarrioFiador] = useState('');
  const barriosFiadorRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (barriosRef.current && !barriosRef.current.contains(event.target)) {
        setShowBarrios(false);
      }
      if (barriosFiadorRef.current && !barriosFiadorRef.current.contains(event.target)) {
        setShowBarriosFiador(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función auxiliar para normalizar texto (quitar tildes y convertir a minúsculas)
  const normalizeText = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Filtrar barrios
  const filteredBarrios = BARRIOS_TULUA.filter(barrio =>
    normalizeText(barrio).includes(normalizeText(barrioSearch))
  );

  const filteredBarriosFiador = BARRIOS_TULUA.filter(barrio =>
    normalizeText(barrio).includes(normalizeText(barrioSearchFiador))
  );

  useEffect(() => {
    if (cliente) {
      const barrioCliente = cliente.barrio || '';
      const esOtroBarrio = !BARRIOS_TULUA.includes(barrioCliente);

      const barrioFiador = cliente.fiador?.barrio || '';
      const esOtroBarrioFiador = barrioFiador && !BARRIOS_TULUA.includes(barrioFiador);

      setFormData({
        nombre: cliente.nombre || '',
        documento: cliente.documento || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        barrio: esOtroBarrio ? 'Otro' : barrioCliente,
        direccionTrabajo: cliente.direccionTrabajo || '',
        correo: cliente.correo || '',
        cartera: cliente.cartera || 'K1',
        tipoPago: tipoPagoPredefinido || '',
        tipoPagoEsperado: cliente.tipoPagoEsperado || '',
        fiador: {
          nombre: cliente.fiador?.nombre || '',
          documento: cliente.fiador?.documento || '',
          telefono: cliente.fiador?.telefono || '',
          direccion: cliente.fiador?.direccion || '',
          barrio: esOtroBarrioFiador ? 'Otro' : barrioFiador,
          direccionTrabajo: cliente.fiador?.direccionTrabajo || ''
        }
      });

      setUsarOtroBarrio(esOtroBarrio);
      setOtroBarrio(esOtroBarrio ? barrioCliente : '');
      if (!esOtroBarrio && barrioCliente) {
        setBarrioSearch(barrioCliente);
      }

      setUsarOtroBarrioFiador(esOtroBarrioFiador);
      setOtroBarrioFiador(esOtroBarrioFiador ? barrioFiador : '');
      if (!esOtroBarrioFiador && barrioFiador) {
        setBarrioSearchFiador(barrioFiador);
      }
    } else if (initialData) {
      // Si vienen datos iniciales (ej. desde Visitas)
      setFormData(prev => ({
        ...prev,
        ...initialData,
        cartera: carteraPredefinida || initialData.cartera || 'K1',
        tipoPago: tipoPagoPredefinido || '',
        tipoPagoEsperado: initialData.tipoPagoEsperado || ''
      }));
      // Inicializar búsqueda con el barrio actual si existe
      if (cliente.barrio) {
        setBarrioSearch(cliente.barrio);
      }
    } else if (carteraPredefinida) {
      // Si es un nuevo cliente con cartera predefinida
      setFormData(prev => ({
        ...prev,
        cartera: carteraPredefinida,
        tipoPago: tipoPagoPredefinido || '',
        tipoPagoEsperado: tipoPagoPredefinido || ''
      }));
    }
  }, [cliente, carteraPredefinida, tipoPagoPredefinido, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'barrio') {
      if (value === 'Otro') {
        setUsarOtroBarrio(true);
        setFormData(prev => ({ ...prev, barrio: 'Otro' }));
      } else {
        setUsarOtroBarrio(false);
        setOtroBarrio('');
        setFormData(prev => ({ ...prev, barrio: value }));
      }
    } else if (name === 'otroBarrio') {
      setOtroBarrio(value);
    } else if (name === 'fiador.barrio') {
      // Logic handled via specific handlers, but kept for fallback or direct name usage
      if (value === 'Otro') {
        setUsarOtroBarrioFiador(true);
        setFormData(prev => ({ ...prev, fiador: { ...prev.fiador, barrio: 'Otro' } }));
      } else {
        setUsarOtroBarrioFiador(false);
        setOtroBarrioFiador('');
        setFormData(prev => ({ ...prev, fiador: { ...prev.fiador, barrio: value } }));
      }
    } else if (name === 'otroBarrioFiador') {
      setOtroBarrioFiador(value);
    } else if (name.startsWith('fiador.')) {
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

  const handleBarrioSelect = (barrio) => {
    setFormData(prev => ({ ...prev, barrio }));
    setBarrioSearch(barrio);
    setShowBarrios(false);
  };

  const handleBarrioSearchChange = (e) => {
    setBarrioSearch(e.target.value);
    setFormData(prev => ({ ...prev, barrio: e.target.value })); // Permitir valor personalizado mientras escribe
    setShowBarrios(true);
  };

  const handleBarrioSelectFiador = (barrio) => {
    setFormData(prev => ({ ...prev, fiador: { ...prev.fiador, barrio } }));
    setBarrioSearchFiador(barrio);
    setShowBarriosFiador(false);
  };

  const handleBarrioSearchChangeFiador = (e) => {
    setBarrioSearchFiador(e.target.value);
    setFormData(prev => ({
      ...prev,
      fiador: { ...prev.fiador, barrio: e.target.value }
    }));
    setShowBarriosFiador(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar que si se seleccionó "Otro", se haya ingresado un nombre de barrio
    if (usarOtroBarrio && !otroBarrio.trim()) {
      alert('Por favor ingrese el nombre del barrio');
      return;
    }

    if (usarOtroBarrioFiador && !otroBarrioFiador.trim()) {
      alert('Por favor ingrese el nombre del barrio del fiador');
      return;
    }

    // Incluir tipoPagoEsperado
    const dataToSubmit = {
      ...formData,
      barrio: usarOtroBarrio ? otroBarrio.trim() : formData.barrio,
      fiador: {
        ...formData.fiador,
        barrio: usarOtroBarrioFiador ? otroBarrioFiador.trim() : formData.fiador.barrio
      },
      tipoPagoEsperado: formData.tipoPagoEsperado || tipoPagoPredefinido || null
    };
    onSubmit(dataToSubmit);
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
                <label className="label flex items-center gap-2">
                  Dirección de Residencia *
                  <span className="text-xs text-gray-500 font-normal">
                    (Formato: Calle 23 Número 45-30)
                  </span>
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Calle 23 Número 45-30, Barrio Centro"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Barrio *</label>
                <div className="relative" ref={barriosRef}>
                  <div className="relative">
                    <input
                      type="text"
                      name="barrio"
                      value={barrioSearch}
                      onChange={handleBarrioSearchChange}
                      onFocus={() => setShowBarrios(true)}
                      className="input-field pr-10"
                      placeholder="Buscar o seleccionar barrio..."
                      required
                      autoComplete="off"
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                      onClick={() => setShowBarrios(!showBarrios)}
                    >
                      {showBarrios ? (
                        <Search className="h-5 w-5 text-blue-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {showBarrios && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredBarrios.length > 0 ? (
                        filteredBarrios.map((barrio) => (
                          <div
                            key={barrio}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                            onClick={() => handleBarrioSelect(barrio)}
                          >
                            {barrio}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 italic">
                          No se encontraron resultados. Se guardará "{barrioSearch}" como nuevo barrio.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {usarOtroBarrio && (
                  <div className="mt-3">
                    <label className="label">Nombre del barrio *</label>
                    <input
                      type="text"
                      name="otroBarrio"
                      value={otroBarrio}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Ej: Barrio Nuevo"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="label flex items-center gap-2">
                  Dirección de Trabajo
                  <span className="text-xs text-gray-500 font-normal">
                    (Formato: Carrera 10 Número 50-30)
                  </span>
                </label>
                <input
                  type="text"
                  name="direccionTrabajo"
                  value={formData.direccionTrabajo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Carrera 10 Número 50-30, Oficina 201"
                />
              </div>

              {/* Selección de Cartera */}
              <div className="md:col-span-2">
                <label className="label">Cartera *</label>
                {carteraPredefinida ? (
                  <div className="p-4 border-2 rounded-lg bg-gray-50 border-gray-300">
                    <div className="flex items-center">
                      <div className={`flex items-center p-4 border-2 rounded-lg ${formData.cartera === 'K1' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'
                        }`}>
                        <div className="ml-3">
                          <span className="font-semibold text-gray-900">Cartera {formData.cartera}</span>
                          <p className="text-sm text-gray-500">
                            {formData.cartera === 'K1' ? 'Cartera principal' : 'Cartera secundaria'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">La cartera está bloqueada según la card seleccionada</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${formData.cartera === 'K1' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}>
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

                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${formData.cartera === 'K2' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}>
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
                )}
              </div>

              {/* Tipo de Pago Preferido */}
              <div className="md:col-span-2">
                <label className="label">Frecuencia de Pago Preferida</label>
                {tipoPagoPredefinido ? (
                  <div className="p-4 border-2 rounded-lg bg-gray-50 border-gray-300">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-900 capitalize">
                        {tipoPagoPredefinido}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      El tipo de pago está bloqueado según la card seleccionada.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      name="tipoPagoEsperado"
                      value={formData.tipoPagoEsperado}
                      onChange={handleChange}
                      className="input-field appearance-none pr-10 cursor-pointer"
                    >
                      <option value="">Sin preferencia (Elegir al crear crédito)</option>
                      {formData.cartera === 'K1' ? (
                        <>
                          <option value="semanal">Semanal</option>
                          <option value="quincenal">Quincenal</option>
                        </>
                      ) : (
                        <>
                          <option value="quincenal">Quincenal</option>
                          <option value="mensual">Mensual</option>
                        </>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Opcional. Si seleccionas uno, los créditos de este cliente estarán restringidos a este tipo de pago.
                    </p>
                  </div>
                )}
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
                <label className="label flex items-center gap-2">
                  Dirección de Residencia
                  <span className="text-xs text-gray-500 font-normal">
                    (Formato: Calle 23 Número 45-30)
                  </span>
                </label>
                <input
                  type="text"
                  name="fiador.direccion"
                  value={formData.fiador.direccion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Calle 23 Número 45-30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Barrio (Fiador)</label>
                <div className="relative" ref={barriosFiadorRef}>
                  <div className="relative">
                    <input
                      type="text"
                      name="fiador.barrio"
                      value={barrioSearchFiador}
                      onChange={handleBarrioSearchChangeFiador}
                      onFocus={() => setShowBarriosFiador(true)}
                      className="input-field pr-10"
                      placeholder="Buscar o seleccionar barrio del fiador..."
                      autoComplete="off"
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                      onClick={() => setShowBarriosFiador(!showBarriosFiador)}
                    >
                      {showBarriosFiador ? (
                        <Search className="h-5 w-5 text-blue-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {showBarriosFiador && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredBarriosFiador.length > 0 ? (
                        filteredBarriosFiador.map((barrio) => (
                          <div
                            key={barrio}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                            onClick={() => handleBarrioSelectFiador(barrio)}
                          >
                            {barrio}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 italic">
                          No se encontraron resultados. Se guardará "{barrioSearchFiador}" como nuevo barrio.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {usarOtroBarrioFiador && (
                  <div className="mt-3">
                    <label className="label">Nombre del barrio (Fiador) *</label>
                    <input
                      type="text"
                      name="otroBarrioFiador"
                      value={otroBarrioFiador}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Ej: Barrio Nuevo"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="label flex items-center gap-2">
                  Dirección de Trabajo
                  <span className="text-xs text-gray-500 font-normal">
                    (Formato: Carrera 10 Número 50-30)
                  </span>
                </label>
                <input
                  type="text"
                  name="fiador.direccionTrabajo"
                  value={formData.fiador.direccionTrabajo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Carrera 10 Número 50-30, Oficina 201"
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
