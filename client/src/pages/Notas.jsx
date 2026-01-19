import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, Calendar, StickyNote, Loader2, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { notaService } from '../services/api';
import { useNavigate, useBlocker } from 'react-router-dom';

import { format, parseISO, startOfDay, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const Notas = () => {
  const [notaGeneral, setNotaGeneral] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cantidadClientes, setCantidadClientes] = useState(65);
  const [trabajadores, setTrabajadores] = useState([]);
  const [nuevoTrabajador, setNuevoTrabajador] = useState('');
  const [tipoCliente, setTipoCliente] = useState('');
  const [filasPrestamos, setFilasPrestamos] = useState([]);
  const [hayCambios, setHayCambios] = useState(false);


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




  const fetchNotas = async () => {
    try {
      setCargando(true);
      const response = await notaService.obtenerTodas(fechaSeleccionadaStr);
      if (response.success) {
        setNotaGeneral(response.data.notaGeneral || '');

        // Cargar nota diaria si existe
        if (response.data.notaDiaria) {
          const { visitas, prestamosNuevos, pendientes, trabajadores } = response.data.notaDiaria;
          setVisitas(visitas && visitas.length > 0 ? visitas : ['', '', '', '', '']);
          setFilasPrestamos(prestamosNuevos || []);
          setTareasPendientes(pendientes || []);
          setTrabajadores(trabajadores || []);
          setHayCambios(false); // Resetear cambios al cargar
        }

      }
      setError(null);
    } catch (err) {
      console.error('Error al cargar notas:', err);
      setError('No se pudieron cargar las notas.');
    } finally {
      setCargando(false);
    }
  };

  // Cargar datos cada vez que cambia la fecha
  useEffect(() => {
    fetchNotas();
  }, [fechaSeleccionadaStr]);

  const guardarTodo = async () => {
    try {
      const datos = {
        fecha: fechaSeleccionadaStr,
        visitas,
        prestamosNuevos: filasPrestamos,
        pendientes: tareasPendientes,
        trabajadores,
        notaGeneral // <--- Ahora se guarda aquí
      };
      await notaService.guardarNotaDiaria(datos);
      setHayCambios(false);
      console.log('Datos guardados correctamente para:', fechaSeleccionadaStr);
    } catch (err) {
      console.error('Error al guardar datos:', err);
      setError('Error al guardar los cambios.');
    }
  };






  const agregarTrabajador = () => {
    if (nuevoTrabajador.trim()) {
      setTrabajadores([...trabajadores, {
        id: Date.now(),
        nombre: nuevoTrabajador.trim(),
        tareas: []
      }]);
      setNuevoTrabajador('');
      setHayCambios(true);
    }
  };

  const eliminarTrabajador = (id) => {
    if (window.confirm('¿Eliminar este trabajador?')) {
      setTrabajadores(trabajadores.filter(t => t.id !== id));
      setHayCambios(true);
    }
  };

  const asignarTareaATrabajador = (trabajadorId, tarea) => {
    setTrabajadores(trabajadores.map(t =>
      t.id === trabajadorId
        ? { ...t, tareas: [...t.tareas, { texto: tarea, completada: false }] }
        : t
    ));
    setTareasPendientes(tareasPendientes.filter(t => t !== tarea));
    setHayCambios(true);
  };

  const eliminarTareaDeTrabajador = (trabajadorId, tareaIndex) => {
    const trabajador = trabajadores.find(t => t.id === trabajadorId);
    if (trabajador) {
      setTrabajadores(trabajadores.map(t =>
        t.id === trabajadorId
          ? { ...t, tareas: t.tareas.filter((_, i) => i !== tareaIndex) }
          : t
      ));
      setTareasPendientes([...tareasPendientes, trabajador.tareas[tareaIndex].texto]);
      setHayCambios(true);
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
    setHayCambios(true);
  };

  const agregarTareaPendiente = () => {
    if (nuevaTareaPendiente.trim()) {
      setTareasPendientes([...tareasPendientes, nuevaTareaPendiente.trim()]);
      setNuevaTareaPendiente('');
      setHayCambios(true);
    }
  };

  const eliminarTareaPendiente = (index) => {
    setTareasPendientes(tareasPendientes.filter((_, i) => i !== index));
    setHayCambios(true);
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
      setHayCambios(true);
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

  // Bloqueador de navegación interna (React Router)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hayCambios && currentLocation.pathname !== nextLocation.pathname
  );

  // Efecto para manejar el bloqueo de navegación
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmar = window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?');
      if (confirmar) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // Prevenir salida sin guardar (Cierre de pestaña/recarga)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hayCambios) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hayCambios]);



  const descartarCambios = () => {
    if (window.confirm('¿Descartar todos los cambios no guardados?')) {
      fetchNotas();
      setHayCambios(false);
    }
  };

  const agregarVisita = () => {
    setVisitas([...visitas, '']);
    setHayCambios(true);
  };


  const actualizarVisita = (index, texto) => {
    const nuevasVisitas = [...visitas];
    nuevasVisitas[index] = texto;
    setVisitas(nuevasVisitas);
    setHayCambios(true);
  };

  const eliminarVisita = (index) => {
    if (visitas.length > 1) {
      setVisitas(visitas.filter((_, i) => i !== index));
      setHayCambios(true);
    }
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
    setHayCambios(true);
  };

  const actualizarFilaPrestamo = (index, campo, valor) => {
    const nuevasFilas = [...filasPrestamos];
    nuevasFilas[index][campo] = valor;
    setFilasPrestamos(nuevasFilas);
    setHayCambios(true);
  };

  const eliminarFilaPrestamo = (index) => {
    setFilasPrestamos(filasPrestamos.filter((_, i) => i !== index));
    setHayCambios(true);
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

            {/* Botones de Acción */}
            <div className="flex gap-2">
              {hayCambios && (
                <button
                  onClick={descartarCambios}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all"
                >
                  <X className="h-4 w-4" />
                  Descartar
                </button>
              )}
              <button
                onClick={guardarTodo}
                className={`flex items-center gap-2 px-6 py-2 font-bold rounded-lg shadow-lg transition-all active:scale-95 ${hayCambios ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                disabled={!hayCambios && !notaGeneral} // notaGeneral auto-saves but we show button enabled if changes
              >
                <Save className="h-5 w-5" />
                Guardar Cambios
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
            <div className="space-y-3 mb-4">
              {visitas.map((visita, index) => (
                <div key={index} className="flex items-center gap-3 p-1 rounded hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold text-gray-400 w-6 text-center">{index + 1}</span>
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      value={visita}
                      onChange={(e) => actualizarVisita(index, e.target.value)}
                      placeholder="Escribe una visita..."
                      className="w-full px-4 py-2 bg-slate-50 border border-transparent hover:border-purple-200 focus:bg-white focus:border-purple-500 rounded-lg transition-all outline-none text-sm text-gray-700"
                    />
                  </div>
                  <button
                    onClick={() => eliminarVisita(index)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar visita"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
                    <th className="text-center py-2 px-2 font-medium text-gray-700">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPrestamos.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 group">
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
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => eliminarFilaPrestamo(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
            onChange={(e) => {
              setNotaGeneral(e.target.value);
              setHayCambios(true);
            }}


            placeholder="Escribe aquí tus notas generales, ideas, recordatorios o cualquier información importante que quieras guardar..."
            className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <div className="mt-2 text-xs text-gray-500 text-right">
            {notaGeneral.length} caracteres
          </div>
        </div>
      </div >
    </div >
  );
};

export default Notas;
