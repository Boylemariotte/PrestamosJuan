import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, Search, AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { BARRIOS_TULUA, BARRIOS_BUGA } from '../../constants/barrios';
import { useAuth } from '../../context/AuthContext';

const ClienteForm = ({ cliente, onSubmit, onClose, carteraPredefinida, tipoPagoPredefinido, initialData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const esAdminOCeo = user && (user.role === 'administrador' || user.role === 'ceo');
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

  // Estado para validación de documento en tiempo real
  const [validationDoc, setValidationDoc] = useState({
    loading: false,
    exists: false,
    isArchived: false,
    detalle: null
  });

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

  // Seleccionar lista de barrios según la cartera
  const barriosDisponibles = formData.cartera === 'K3' ? BARRIOS_BUGA : BARRIOS_TULUA;

  // Filtrar barrios
  const filteredBarrios = barriosDisponibles.filter(barrio =>
    normalizeText(barrio).includes(normalizeText(barrioSearch))
  );

  const filteredBarriosFiador = barriosDisponibles.filter(barrio =>
    normalizeText(barrio).includes(normalizeText(barrioSearchFiador))
  );

  useEffect(() => {
    if (cliente) {
      const barriosCliente = cliente.cartera === 'K3' ? BARRIOS_BUGA : BARRIOS_TULUA;
      const barrioCliente = cliente.barrio || '';
      const esOtroBarrio = !barriosCliente.includes(barrioCliente);

      const barrioFiador = cliente.fiador?.barrio || '';
      const esOtroBarrioFiador = barrioFiador && !barriosCliente.includes(barrioFiador);

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
      const barriosCliente = initialData.cartera === 'K3' ? BARRIOS_BUGA : BARRIOS_TULUA;
      const barrioCliente = initialData.barrio || '';
      const esOtroBarrio = barrioCliente && !barriosCliente.includes(barrioCliente);

      const barrioFiador = initialData.fiador?.barrio || '';
      const esOtroBarrioFiador = barrioFiador && !barriosCliente.includes(barrioFiador);

      setFormData(prev => ({
        ...prev,
        nombre: initialData.nombre || '',
        documento: initialData.documento || '',
        telefono: initialData.telefono || '',
        direccion: initialData.direccion || '',
        barrio: esOtroBarrio ? 'Otro' : barrioCliente,
        direccionTrabajo: initialData.direccionTrabajo || '',
        correo: initialData.correo || '',
        cartera: carteraPredefinida || initialData.cartera || 'K1',
        tipoPago: tipoPagoPredefinido || '',
        tipoPagoEsperado: initialData.tipoPagoEsperado || '',
        fiador: {
          nombre: initialData.fiador?.nombre || '',
          documento: initialData.fiador?.documento || '',
          telefono: initialData.fiador?.telefono || '',
          direccion: initialData.fiador?.direccion || '',
          barrio: esOtroBarrioFiador ? 'Otro' : barrioFiador,
          direccionTrabajo: initialData.fiador?.direccionTrabajo || ''
        }
      }));

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

  // Validación de documento en tiempo real (solo para nuevos clientes)
  useEffect(() => {
    if (cliente) return; // No validar si estamos editando

    const val = formData.documento;
    if (!val || val.length < 5) {
      setValidationDoc({ loading: false, exists: false, isArchived: false, detalle: null });
      return;
    }

    const timer = setTimeout(async () => {
      setValidationDoc(prev => ({ ...prev, loading: true }));
      try {
        const response = await api.get(`/clientes/historial-documento/${val}`);
        if (response.success && response.data.clientes.length > 0) {
          // Si hay múltiples, priorizar el primero que sea activo o el primero en la lista
          const exacto = response.data.clientes.find(c => c.documento === val) || response.data.clientes[0];

          if (exacto) {
            setValidationDoc({
              loading: false,
              exists: true,
              isArchived: exacto.esArchivado,
              detalle: exacto
            });
          } else {
            setValidationDoc({ loading: false, exists: false, isArchived: false, detalle: null });
          }
        } else {
          setValidationDoc({ loading: false, exists: false, isArchived: false, detalle: null });
        }
      } catch (err) {
        console.error('Error validando documento:', err);
        setValidationDoc({ loading: false, exists: false, isArchived: false, detalle: null });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.documento, cliente]);

  const handleVerDetalle = () => {
    navigate('/buscar-documento', { state: { documento: formData.documento } });
    onClose();
  };

  // Actualizar barrios cuando cambia la cartera
  useEffect(() => {
    // Si cambia la cartera, limpiar la búsqueda de barrios para que use la lista correcta
    if (formData.cartera === 'K3') {
      // Si el barrio actual no está en BARRIOS_BUGA, marcarlo como "Otro"
      if (formData.barrio && formData.barrio !== 'Otro' && !BARRIOS_BUGA.includes(formData.barrio)) {
        setUsarOtroBarrio(true);
        setOtroBarrio(formData.barrio);
        setFormData(prev => ({ ...prev, barrio: 'Otro' }));
      } else if (formData.barrio && formData.barrio !== 'Otro' && BARRIOS_BUGA.includes(formData.barrio)) {
        setBarrioSearch(formData.barrio);
      }
    } else {
      // Si el barrio actual no está en BARRIOS_TULUA, marcarlo como "Otro"
      if (formData.barrio && formData.barrio !== 'Otro' && !BARRIOS_TULUA.includes(formData.barrio)) {
        setUsarOtroBarrio(true);
        setOtroBarrio(formData.barrio);
        setFormData(prev => ({ ...prev, barrio: 'Otro' }));
      } else if (formData.barrio && formData.barrio !== 'Otro' && BARRIOS_TULUA.includes(formData.barrio)) {
        setBarrioSearch(formData.barrio);
      }
    }
  }, [formData.cartera]);

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
                  className={`input-field ${validationDoc.exists ? 'border-red-500 bg-red-50' : ''}`}
                  required
                />

                {/* Alertas de Validación de Documento */}
                {validationDoc.loading && (
                  <p className="text-xs text-blue-500 mt-1 animate-pulse">Verificando documento...</p>
                )}

                {validationDoc.exists && !validationDoc.isArchived && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-bold">Este cliente ya existe (Activo en Cartera {validationDoc.detalle?.cartera})</span>
                  </div>
                )}

                {validationDoc.exists && validationDoc.isArchived && (
                  <div className="mt-2 flex flex-col gap-2 bg-amber-50 p-3 rounded border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-bold">Este cliente ya existe y se encuentra archivado</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleVerDetalle}
                      className="flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-colors w-fit"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver detalle
                    </button>
                  </div>
                )}
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
                      <div className={`flex items-center p-4 border-2 rounded-lg ${formData.cartera === 'K1' ? 'border-blue-500 bg-blue-50' :
                        formData.cartera === 'K3' ? 'border-orange-500 bg-orange-50' :
                          'border-green-500 bg-green-50'
                        }`}>
                        <div className="ml-3">
                          <span className="font-semibold text-gray-900">Cartera {formData.cartera}</span>
                          <p className="text-sm text-gray-500">
                            {formData.cartera === 'K1' ? 'Cartera principal' :
                              formData.cartera === 'K3' ? 'Cartera Buga' :
                                'Cartera secundaria'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">La cartera está bloqueada según la card seleccionada</p>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${esAdminOCeo ? 'grid-cols-3' : 'grid-cols-2'}`}>
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

                    {esAdminOCeo && (
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${formData.cartera === 'K3' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                        }`}>
                        <input
                          type="radio"
                          name="cartera"
                          value="K3"
                          checked={formData.cartera === 'K3'}
                          onChange={handleChange}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="ml-3">
                          <span className="font-semibold text-gray-900">Cartera K3</span>
                          <p className="text-sm text-gray-500">Cartera Buga</p>
                        </div>
                      </label>
                    )}
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
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
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
              className={`btn-primary ${(!cliente && validationDoc.exists) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!cliente && validationDoc.exists}
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
