import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, CheckCircle, Circle, Calendar, StickyNote, Loader2, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { notaService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, startOfDay, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const Notas = () => {
  const [secciones, setSecciones] = useState([]);
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [editandoSeccion, setEditandoSeccion] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState({});
  const [editandoTarea, setEditandoTarea] = useState({});
  const [notaGeneral, setNotaGeneral] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cantidadClientes, setCantidadClientes] = useState(65);
  const [trabajadores, setTrabajadores] = useState([]);
  const [nuevoTrabajador, setNuevoTrabajador] = useState('');
  const [tipoCliente, setTipoCliente] = useState('');
  const [filasPrestamos, setFilasPrestamos] = useState([
    { tipo: '', nombre: '', valor: '', cuota: false, caja: false, libro: false, cel: false, fiador: '', metodoEntrega: '' },
    { tipo: '', nombre: '', valor: '', cuota: false, caja: false, libro: false, cel: false, fiador: '', metodoEntrega: '' },
    { tipo: '', nombre: '', valor: '', cuota: false, caja: false, libro: false, cel: false, fiador: '', metodoEntrega: '' },
    { tipo: '', nombre: '', valor: '', cuota: false, caja: false, libro: false, cel: false, fiador: '', metodoEntrega: '' },
    { tipo: '', nombre: '', valor: '', cuota: false, caja: false, libro: false, cel: false, fiador: '', metodoEntrega: '' }
  ]);
  
  // Estado para la fecha seleccionada
  const [fechaSeleccionada, setFechaSeleccionada] = useState(startOfDay(new Date()));
  const fechaSeleccionadaStr = format(fechaSeleccionada, 'yyyy-MM-dd');
  
  // Funciones de navegación de fecha
  const irAyer = () => setFechaSeleccionada(subDays(fechaSeleccionada, 1));
  const irHoy = () => setFechaSeleccionada(startOfDay(new Date()));
  const irMañana = () => setFechaSeleccionada(addDays(fechaSeleccionada, 1));
  const cambiarFecha = (e) => {
    const nuevaFecha = parseISO(e.target.value);
    setFechaSeleccionada(startOfDay(nuevaFecha));
  };
  
  const esHoy = fechaSeleccionadaStr === format(startOfDay(new Date()), 'yyyy-MM-dd');
  const [tareasPendientes, setTareasPendientes] = useState([
    'Cuadrar cobro',
    'Escribir comun fechas',
    'Poner fechas tarjetas, meter sistema',
    'Borrar #4',
    'Organizar tarjetas K1 - K2 para cierre',
    'Cuadrar cobro',
    'Escribir comun fechas'
  ]);
  const [nuevaTareaPendiente, setNuevaTareaPendiente] = useState('');
  const [editandoTareaPendiente, setEditandoTareaPendiente] = useState(null);
  const [textoEditandoTarea, setTextoEditandoTarea] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [clientesPorPagina] = useState(10);
  const [visitas, setVisitas] = useState([
    '',
    '',
    '',
    '',
    ''
  ]);
  const [editandoVisita, setEditandoVisita] = useState(null);
  const [textoEditandoVisita, setTextoEditandoVisita] = useState('');

  // Cargar datos desde el servidor al montar el componente
  useEffect(() => {
    fetchNotas();
  }, []);

  const fetchNotas = async () => {
    try {
      setCargando(true);
      const response = await notaService.obtenerTodas();
      if (response.success) {
        setSecciones(response.data.secciones || []);
        setNotaGeneral(response.data.notaGeneral || '');
      }
      setError(null);
    } catch (err) {
      console.error('Error al cargar notas:', err);
      setError('No se pudieron cargar las notas. Por favor, intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const agregarSeccion = async () => {
    if (nuevaSeccion.trim()) {
      try {
        const response = await notaService.agregarSeccion(nuevaSeccion.trim());
        if (response.success) {
          // El backend devuelve el nuevo documento de sección
          setSecciones([...secciones, response.data]);
          setNuevaSeccion('');
        }
      } catch (err) {
        console.error('Error al agregar sección:', err);
        alert('Error al agregar sección');
      }
    }
  };

  const eliminarSeccion = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta sección y todas sus tareas?')) {
      try {
        const response = await notaService.eliminarSeccion(id);
        if (response.success) {
          setSecciones(secciones.filter(s => s._id !== id));
        }
      } catch (err) {
        console.error('Error al eliminar sección:', err);
        alert('Error al eliminar sección');
      }
    }
  };

  const editarSeccion = async (id, nuevoNombre) => {
    if (!nuevoNombre.trim()) return setEditandoSeccion(null);
    try {
      const response = await notaService.actualizarSeccion(id, nuevoNombre.trim());
      if (response.success) {
        setSecciones(secciones.map(s => s._id === id ? response.data : s));
        setEditandoSeccion(null);
      }
    } catch (err) {
      console.error('Error al editar sección:', err);
      alert('Error al editar sección');
    }
  };

  const agregarTarea = async (seccionId) => {
    const textoTarea = nuevaTarea[seccionId]?.trim();
    if (textoTarea) {
      try {
        const response = await notaService.agregarTarea(seccionId, textoTarea);
        if (response.success) {
          setSecciones(secciones.map(s => s._id === seccionId ? response.data : s));
          setNuevaTarea({ ...nuevaTarea, [seccionId]: '' });
        }
      } catch (err) {
        console.error('Error al agregar tarea:', err);
        alert('Error al agregar tarea');
      }
    }
  };

  const toggleTarea = async (seccionId, tareaId, completadaActual) => {
    try {
      const response = await notaService.actualizarTarea(seccionId, tareaId, {
        completada: !completadaActual
      });
      if (response.success) {
        setSecciones(secciones.map(s => s._id === seccionId ? response.data : s));
      }
    } catch (err) {
      console.error('Error al toggle tarea:', err);
      alert('Error al actualizar tarea');
    }
  };

  const editarTarea = async (seccionId, tareaId, nuevoTexto) => {
    if (!nuevoTexto.trim()) return setEditandoTarea({ ...editandoTarea, [tareaId]: null });
    try {
      const response = await notaService.actualizarTarea(seccionId, tareaId, {
        texto: nuevoTexto.trim()
      });
      if (response.success) {
        setSecciones(secciones.map(s => s._id === seccionId ? response.data : s));
        setEditandoTarea({ ...editandoTarea, [tareaId]: null });
      }
    } catch (err) {
      console.error('Error al editar tarea:', err);
      alert('Error al editar tarea');
    }
  };

  const eliminarTarea = async (seccionId, tareaId) => {
    try {
      const response = await notaService.eliminarTarea(seccionId, tareaId);
      if (response.success) {
        setSecciones(secciones.map(s => s._id === seccionId ? response.data : s));
      }
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      alert('Error al eliminar tarea');
    }
  };

  const guardarNotaGeneral = async () => {
    try {
      await notaService.actualizarNotaGeneral(notaGeneral);
    } catch (err) {
      console.error('Error al guardar nota general:', err);
    }
  };

  // Debounce para guardar nota general o usar el evento onBlur
  const handleNotaGeneralBlur = () => {
    guardarNotaGeneral();
  };

  const agregarTrabajador = () => {
    if (nuevoTrabajador.trim()) {
      setTrabajadores([...trabajadores, {
        id: Date.now(),
        nombre: nuevoTrabajador.trim(),
        tareas: []
      }]);
      setNuevoTrabajador('');
    }
  };

  const eliminarTrabajador = (id) => {
    setTrabajadores(trabajadores.filter(t => t.id !== id));
  };

  const asignarTareaATrabajador = (trabajadorId, tarea) => {
    setTrabajadores(trabajadores.map(t => 
      t.id === trabajadorId 
        ? { ...t, tareas: [...t.tareas, { texto: tarea, completada: false }] }
        : t
    ));
    setTareasPendientes(tareasPendientes.filter(t => t !== tarea));
  };

  const eliminarTareaDeTrabajador = (trabajadorId, tareaIndex) => {
    const trabajador = trabajadores.find(t => t.id === trabajadorId);
    if (trabajador) {
      const tarea = trabajador.tareas[tareaIndex];
      setTrabajadores(trabajadores.map(t => 
        t.id === trabajadorId 
          ? { ...t, tareas: t.tareas.filter((_, i) => i !== tareaIndex) }
          : t
      ));
      setTareasPendientes([...tareasPendientes, tarea.texto]);
    }
  };

  const toggleTareaCompletadaTrabajador = (trabajadorId, tareaIndex) => {
    setTrabajadores(trabajadores.map(t => {
      if (t.id === trabajadorId) {
        const nuevasTareas = [...t.tareas];
        nuevasTareas[tareaIndex].completada = !nuevasTareas[tareaIndex].completada;
        return { ...t, tareas: nuevasTareas };
      }
      return t;
    }));
  };

  const agregarTareaPendiente = () => {
    if (nuevaTareaPendiente.trim()) {
      setTareasPendientes([...tareasPendientes, nuevaTareaPendiente.trim()]);
      setNuevaTareaPendiente('');
    }
  };

  const eliminarTareaPendiente = (index) => {
    setTareasPendientes(tareasPendientes.filter((_, i) => i !== index));
  };

  const iniciarEdicionTarea = (index, tarea) => {
    setEditandoTareaPendiente(index);
    setTextoEditandoTarea(tarea);
  };

  const guardarEdicionTarea = (index) => {
    if (textoEditandoTarea.trim()) {
      const nuevasTareas = [...tareasPendientes];
      nuevasTareas[index] = textoEditandoTarea.trim();
      setTareasPendientes(nuevasTareas);
      setEditandoTareaPendiente(null);
      setTextoEditandoTarea('');
    }
  };

  const cancelarEdicionTarea = () => {
    setEditandoTareaPendiente(null);
    setTextoEditandoTarea('');
  };

  // Obtener cantidad de clientes desde DiaDeCobro
  const obtenerCantidadClientesHoy = () => {
    // Intentar obtener el total desde el localStorage o contexto global
    const totalClientesGuardado = localStorage.getItem('totalClientesHoy');
    if (totalClientesGuardado) {
      return parseInt(totalClientesGuardado);
    }
    
    // Si no hay datos guardados, usar el estado actual
    return cantidadClientes;
  };

  // Sincronizar cantidad de clientes con DiaDeCobro
  useEffect(() => {
    // Verificar inmediatamente al montar
    const totalDesdeStorage = localStorage.getItem('totalClientesHoy');
    console.log('Notas - totalDesdeStorage:', totalDesdeStorage);
    
    if (totalDesdeStorage) {
      const total = parseInt(totalDesdeStorage);
      if (total > 0) {
        setCantidadClientes(total);
        console.log('Notas - Estableciendo cantidad desde storage:', total);
      }
    } else {
      // Si no hay nada en storage, establecer valor inicial de 65
      setCantidadClientes(65);
      console.log('Notas - Estableciendo valor por defecto: 65');
    }

    const interval = setInterval(() => {
      const totalDesdeStorage = localStorage.getItem('totalClientesHoy');
      console.log('Notas - Verificando storage:', totalDesdeStorage);
      
      if (totalDesdeStorage) {
        const total = parseInt(totalDesdeStorage);
        if (total > 0 && total !== cantidadClientes) {
          setCantidadClientes(total);
          console.log('Notas - Actualizando cantidad:', total);
        }
      } else if (!totalDesdeStorage && cantidadClientes !== 65) {
        // Si no hay datos en storage, mantener 65 como valor por defecto
        setCantidadClientes(65);
        console.log('Notas - Manteniendo valor por defecto: 65');
      }
    }, 500); // Verificar cada 500ms para más rapidez

    return () => clearInterval(interval);
  }, [cantidadClientes]);

  const agregarVisita = () => {
    setVisitas([...visitas, '']);
  };

  const actualizarVisita = (index, texto) => {
    const nuevasVisitas = [...visitas];
    nuevasVisitas[index] = texto;
    setVisitas(nuevasVisitas);
  };

  const eliminarVisita = (index) => {
    if (visitas.length > 1) {
      setVisitas(visitas.filter((_, i) => i !== index));
    }
  };

  const iniciarEdicionVisita = (index, texto) => {
    setEditandoVisita(index);
    setTextoEditandoVisita(texto);
  };

  const guardarEdicionVisita = (index) => {
    if (textoEditandoVisita.trim() !== undefined) {
      actualizarVisita(index, textoEditandoVisita);
      setEditandoVisita(null);
      setTextoEditandoVisita('');
    }
  };

  const cancelarEdicionVisita = () => {
    setEditandoVisita(null);
    setTextoEditandoVisita('');
  };

  const agregarFilaPrestamo = () => {
    setFilasPrestamos([...filasPrestamos, { 
      tipo: '', 
      nombre: '', 
      valor: '', 
      cuota: false, 
      caja: false, 
      libro: false, 
      cel: false, 
      fiador: '', 
      metodoEntrega: '' 
    }]);
  };

  const actualizarFilaPrestamo = (index, campo, valor) => {
    const nuevasFilas = [...filasPrestamos];
    nuevasFilas[index][campo] = valor;
    setFilasPrestamos(nuevasFilas);
  };

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearFechaHeader = () => {
    const fecha = new Date();
    const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fecha.getDay()];
    const dia = fecha.getDate();
    const mes = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][fecha.getMonth()];
    const año = fecha.getFullYear();
    return `${dia} / ${mes} / ${año} (${diaSemana})`;
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Cargando tus notas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{
      backgroundImage: 'linear-gradient(rgba(200, 200, 200, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.3) 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchNotas} className="text-sm font-bold underline">Reintentar</button>
          </div>
        )}

        {/* Header con fecha y navegación */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Notas</h1>
                <p className="text-slate-300 text-sm">
                  {format(fechaSeleccionada, "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>

            {/* Navegación Fecha */}
            <div className="flex bg-slate-700/50 rounded-lg p-1">
              <button onClick={irAyer} className="p-2 hover:bg-white/10 rounded-md transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="relative">
                <input
                  type="date"
                  value={fechaSeleccionadaStr}
                  onChange={cambiarFecha}
                  className="bg-transparent text-center font-bold w-32 focus:outline-none cursor-pointer h-full"
                />
              </div>
              <button onClick={irMañana} className="p-2 hover:bg-white/10 rounded-md transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={irHoy}
                className={`ml-2 px-3 text-sm font-bold rounded-md transition-colors ${esHoy ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-300'}`}
              >
                Hoy
              </button>
            </div>
          </div>
        </div>

        {/* Secciones principales */}
        <div className="space-y-6 mb-6">
          
          {/* Clientes del Día */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Square className="h-5 w-5 text-blue-600" />
              Clientes del Día #{obtenerCantidadClientesHoy()}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total de clientes hoy:
              </label>
              <div className="flex gap-2 items-center">
                <div className="w-32 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium">
                  {obtenerCantidadClientesHoy()}
                </div>
                <span className="text-sm text-gray-600">clientes (sincronizado con Día de Cobro - solo lectura)</span>
              </div>
            </div>
          </div>

          {/* Visitas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Square className="h-5 w-5 text-purple-600" />
              Visitas
            </h2>
            <div className="space-y-2 mb-4">
              {visitas.map((visita, index) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-500 w-6 mt-1">{index + 1}.</span>
                  
                  {editandoVisita === index ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={textoEditandoVisita}
                        onChange={(e) => setTextoEditandoVisita(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            guardarEdicionVisita(index);
                          }
                        }}
                        className="flex-1 px-3 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => guardarEdicionVisita(index)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                      <button
                        onClick={cancelarEdicionVisita}
                        className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        {visita ? (
                          <span className="text-sm text-gray-700">{visita}</span>
                        ) : (
                          <input
                            type="text"
                            value={visita}
                            onChange={(e) => actualizarVisita(index, e.target.value)}
                            className="w-full px-3 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {visita && (
                          <button
                            onClick={() => iniciarEdicionVisita(index, visita)}
                            className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                        {visitas.length > 1 && (
                          <button
                            onClick={() => eliminarVisita(index)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={agregarVisita}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Agregar Visita
            </button>
          </div>


          {/* Registro de clientes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Square className="h-5 w-5 text-green-600" />
              Prestamos nuevos y renovaciones
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de cliente:
              </label>
              <select
                value={tipoCliente}
                onChange={(e) => setTipoCliente(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">Seleccionar...</option>
                <option value="RF">RF</option>
                <option value="PN">PN</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-medium text-gray-700">#</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Nombre cliente</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Valor</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Cuota</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Caja</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Libro</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Cel.</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Fiador</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Método de entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPrestamos.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-gray-600">{index + 1}</td>
                      <td className="py-2 px-2">
                        <select
                          value={row.tipo}
                          onChange={(e) => actualizarFilaPrestamo(index, 'tipo', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        >
                          <option value="">-</option>
                          <option value="PN">PN</option>
                          <option value="RF">RF</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={row.nombre}
                          onChange={(e) => actualizarFilaPrestamo(index, 'nombre', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={row.valor}
                          onChange={(e) => actualizarFilaPrestamo(index, 'valor', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={row.cuota}
                          onChange={(e) => actualizarFilaPrestamo(index, 'cuota', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={row.caja}
                          onChange={(e) => actualizarFilaPrestamo(index, 'caja', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={row.libro}
                          onChange={(e) => actualizarFilaPrestamo(index, 'libro', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={row.cel}
                          onChange={(e) => actualizarFilaPrestamo(index, 'cel', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={row.fiador}
                          onChange={(e) => actualizarFilaPrestamo(index, 'fiador', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="confirmo">Confirmo</option>
                          <option value="sin confirmar">Sin confirmar</option>
                          <option value="cambio de fiador">Cambio de fiador</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={row.metodoEntrega}
                          onChange={(e) => actualizarFilaPrestamo(index, 'metodoEntrega', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              onClick={agregarFilaPrestamo}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Añadir
            </button>
          </div>
        </div>

        {/* Secciones secundarias */}
        <div className="space-y-6 mb-6">
          
          {/* Pendientes / Tareas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Square className="h-5 w-5 text-red-600" />
              Pendientes / Tareas
            </h2>
            
            {/* Agregar nueva tarea */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={nuevaTareaPendiente}
                onChange={(e) => setNuevaTareaPendiente(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && agregarTareaPendiente()}
                placeholder="Nueva tarea pendiente..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
              <button
                onClick={agregarTareaPendiente}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
            
            {/* Lista de tareas */}
            <div className="space-y-2 mb-4">
              {tareasPendientes.map((tarea, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                  
                  {editandoTareaPendiente === index ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={textoEditandoTarea}
                        onChange={(e) => setTextoEditandoTarea(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            guardarEdicionTarea(index);
                          }
                        }}
                        className="flex-1 px-3 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => guardarEdicionTarea(index)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                      <button
                        onClick={cancelarEdicionTarea}
                        className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-700">{tarea}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => iniciarEdicionTarea(index, tarea)}
                          className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => eliminarTareaPendiente(index)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              asignarTareaATrabajador(parseInt(e.target.value), tarea);
                              e.target.value = '';
                            }
                          }}
                          className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                          defaultValue=""
                        >
                          <option value="">Asignar...</option>
                          {trabajadores.map(trabajador => (
                            <option key={trabajador.id} value={trabajador.id}>
                              {trabajador.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {tareasPendientes.length === 0 && (
              <p className="text-gray-500 text-center py-4 text-sm">No hay tareas pendientes</p>
            )}
          </div>

          {/* Trabajadores */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Square className="h-5 w-5 text-green-600" />
              Trabajadores
            </h2>
            
            {/* Agregar trabajador */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={nuevoTrabajador}
                onChange={(e) => setNuevoTrabajador(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && agregarTrabajador()}
                placeholder="Nombre del trabajador..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
              <button
                onClick={agregarTrabajador}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>

            {/* Lista de trabajadores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trabajadores.map((trabajador) => (
                <div key={trabajador.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{trabajador.nombre}</h3>
                    <button
                      onClick={() => eliminarTrabajador(trabajador.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {trabajador.tareas.length > 0 ? (
                    <div className="space-y-1">
                      {trabajador.tareas.map((tarea, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded ${tarea.completada ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={tarea.completada}
                              onChange={() => toggleTareaCompletadaTrabajador(trabajador.id, index)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className={`text-sm ${tarea.completada ? 'line-through text-gray-500' : 'text-gray-700'}`}>{tarea.texto}</span>
                          </div>
                          <button
                            onClick={() => eliminarTareaDeTrabajador(trabajador.id, index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">Sin tareas asignadas</p>
                  )}
                </div>
              ))}
            </div>
            
            {trabajadores.length === 0 && (
              <p className="text-gray-500 text-center py-8 text-sm">No hay trabajadores agregados</p>
            )}
          </div>
        </div>

        {/* Secciones existentes (ocultas por ahora) */}
        <div className="hidden">
          {/* Agregar nueva sección */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={nuevaSeccion}
              onChange={(e) => setNuevaSeccion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && agregarSeccion()}
              placeholder="Nueva sección (ej: Lunes, Urgente, Personal...)"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={agregarSeccion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar Sección
            </button>
          </div>

          {/* Lista de secciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secciones.map((seccion) => (
              <div key={seccion._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header de la sección */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    {editandoSeccion === seccion._id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          defaultValue={seccion.nombre}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              editarSeccion(seccion._id, e.target.value);
                            }
                          }}
                          onBlur={(e) => editarSeccion(seccion._id, e.target.value)}
                          className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => setEditandoSeccion(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <h3 className="font-semibold text-gray-900">{seccion.nombre}</h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditandoSeccion(seccion._id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => eliminarSeccion(seccion._id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Creado: {formatearFecha(seccion.fechaCreacion)}
                  </p>
                </div>

                {/* Lista de tareas */}
                <div className="p-4 max-h-96 overflow-y-auto">
                  {seccion.tareas.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No hay tareas en esta sección</p>
                  ) : (
                    <div className="space-y-2">
                      {seccion.tareas.map((tarea) => (
                        <div key={tarea._id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <button
                            onClick={() => toggleTarea(seccion._id, tarea._id, tarea.completada)}
                            className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {tarea.completada ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>

                          {editandoTarea[tarea._id] ? (
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                defaultValue={tarea.texto}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    editarTarea(seccion._id, tarea._id, e.target.value);
                                  }
                                }}
                                onBlur={(e) => editarTarea(seccion._id, tarea._id, e.target.value)}
                                className={`flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${tarea.completada ? 'line-through text-gray-400' : ''
                                  }`}
                                autoFocus
                              />
                              <button
                                onClick={() => setEditandoTarea({ ...editandoTarea, [tarea._id]: null })}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span
                                className={`text-sm flex-1 cursor-pointer ${tarea.completada ? 'line-through text-gray-400' : 'text-gray-700'
                                  }`}
                                onClick={() => toggleTarea(seccion._id, tarea._id, tarea.completada)}
                              >
                                {tarea.texto}
                              </span>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => setEditandoTarea({ ...editandoTarea, [tarea._id]: true })}
                                  className="text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => eliminarTarea(seccion._id, tarea._id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar nueva tarea */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nuevaTarea[seccion._id] || ''}
                        onChange={(e) => setNuevaTarea({ ...nuevaTarea, [seccion._id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && agregarTarea(seccion._id)}
                        placeholder="Nueva tarea..."
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => agregarTarea(seccion._id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {secciones.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <StickyNote className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay secciones aún</h3>
              <p className="text-gray-600 mb-4">Crea tu primera sección para empezar a organizar tus tareas</p>
            </div>
          )}
        </div>

        {/* Notas Generales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-100 p-2 rounded-lg">
              <StickyNote className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Notas Generales</h2>
          </div>
          <textarea
            value={notaGeneral}
            onChange={(e) => setNotaGeneral(e.target.value)}
            onBlur={handleNotaGeneralBlur}
            placeholder="Escribe aquí tus notas generales, ideas, recordatorios o cualquier información importante que quieras guardar..."
            className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <div className="mt-2 text-xs text-gray-500 text-right">
            {notaGeneral.length} caracteres
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notas;
