import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, CheckCircle, Circle, Calendar, StickyNote, Loader2 } from 'lucide-react';
import { notaService } from '../services/api';

const Notas = () => {
  const [secciones, setSecciones] = useState([]);
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [editandoSeccion, setEditandoSeccion] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState({});
  const [editandoTarea, setEditandoTarea] = useState({});
  const [notaGeneral, setNotaGeneral] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
    <div className="max-w-6xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchNotas} className="text-sm font-bold underline">Reintentar</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <StickyNote className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notas y Tareas</h1>
            <p className="text-gray-600 text-sm">Organiza tus tareas diarias por secciones</p>
          </div>
        </div>

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

      {/* Notas Generales */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
  );
};

export default Notas;
