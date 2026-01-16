import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, CheckCircle, Circle, Calendar, StickyNote } from 'lucide-react';

const Notas = () => {
  const [secciones, setSecciones] = useState([]);
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [editandoSeccion, setEditandoSeccion] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState({});
  const [editandoTarea, setEditandoTarea] = useState({});
  const [notaGeneral, setNotaGeneral] = useState('');

  // Cargar datos desde localStorage al montar el componente
  useEffect(() => {
    const datosGuardados = localStorage.getItem('notasTareas');
    if (datosGuardados) {
      setSecciones(JSON.parse(datosGuardados));
    }
    
    const notaGeneralGuardada = localStorage.getItem('notaGeneral');
    if (notaGeneralGuardada) {
      setNotaGeneral(notaGeneralGuardada);
    }
  }, []);

  // Guardar datos en localStorage cada vez que cambien
  useEffect(() => {
    if (secciones.length > 0) {
      localStorage.setItem('notasTareas', JSON.stringify(secciones));
    }
  }, [secciones]);

  // Guardar nota general en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('notaGeneral', notaGeneral);
  }, [notaGeneral]);

  const agregarSeccion = () => {
    if (nuevaSeccion.trim()) {
      const nuevaSeccionObj = {
        id: Date.now(),
        nombre: nuevaSeccion.trim(),
        tareas: [],
        fechaCreacion: new Date().toISOString()
      };
      setSecciones([...secciones, nuevaSeccionObj]);
      setNuevaSeccion('');
    }
  };

  const eliminarSeccion = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta sección y todas sus tareas?')) {
      setSecciones(secciones.filter(seccion => seccion.id !== id));
    }
  };

  const editarSeccion = (id, nuevoNombre) => {
    setSecciones(secciones.map(seccion =>
      seccion.id === id ? { ...seccion, nombre: nuevoNombre } : seccion
    ));
    setEditandoSeccion(null);
  };

  const agregarTarea = (seccionId) => {
    const textoTarea = nuevaTarea[seccionId]?.trim();
    if (textoTarea) {
      const nuevaTareaObj = {
        id: Date.now(),
        texto: textoTarea,
        completada: false,
        fechaCreacion: new Date().toISOString()
      };
      
      setSecciones(secciones.map(seccion =>
        seccion.id === seccionId
          ? { ...seccion, tareas: [...seccion.tareas, nuevaTareaObj] }
          : seccion
      ));
      
      setNuevaTarea({ ...nuevaTarea, [seccionId]: '' });
    }
  };

  const toggleTarea = (seccionId, tareaId) => {
    setSecciones(secciones.map(seccion =>
      seccion.id === seccionId
        ? {
            ...seccion,
            tareas: seccion.tareas.map(tarea =>
              tarea.id === tareaId ? { ...tarea, completada: !tarea.completada } : tarea
            )
          }
        : seccion
    ));
  };

  const editarTarea = (seccionId, tareaId, nuevoTexto) => {
    setSecciones(secciones.map(seccion =>
      seccion.id === seccionId
        ? {
            ...seccion,
            tareas: seccion.tareas.map(tarea =>
              tarea.id === tareaId ? { ...tarea, texto: nuevoTexto } : tarea
            )
          }
        : seccion
    ));
    setEditandoTarea({ ...editandoTarea, [tareaId]: null });
  };

  const eliminarTarea = (seccionId, tareaId) => {
    setSecciones(secciones.map(seccion =>
      seccion.id === seccionId
        ? {
            ...seccion,
            tareas: seccion.tareas.filter(tarea => tarea.id !== tareaId)
          }
        : seccion
    ));
  };

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
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
          <div key={seccion.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header de la sección */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                {editandoSeccion === seccion.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      defaultValue={seccion.nombre}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          editarSeccion(seccion.id, e.target.value);
                        }
                      }}
                      onBlur={(e) => editarSeccion(seccion.id, e.target.value)}
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
                        onClick={() => setEditandoSeccion(seccion.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarSeccion(seccion.id)}
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
                    <div key={tarea.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <button
                        onClick={() => toggleTarea(seccion.id, tarea.id)}
                        className="mt-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {tarea.completada ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                      
                      {editandoTarea[tarea.id] ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            defaultValue={tarea.texto}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                editarTarea(seccion.id, tarea.id, e.target.value);
                              }
                            }}
                            onBlur={(e) => editarTarea(seccion.id, tarea.id, e.target.value)}
                            className={`flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              tarea.completada ? 'line-through text-gray-400' : ''
                            }`}
                            autoFocus
                          />
                          <button
                            onClick={() => setEditandoTarea({ ...editandoTarea, [tarea.id]: null })}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-sm flex-1 cursor-pointer ${
                              tarea.completada ? 'line-through text-gray-400' : 'text-gray-700'
                            }`}
                            onClick={() => toggleTarea(seccion.id, tarea.id)}
                          >
                            {tarea.texto}
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => setEditandoTarea({ ...editandoTarea, [tarea.id]: true })}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => eliminarTarea(seccion.id, tarea.id)}
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
                    value={nuevaTarea[seccion.id] || ''}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, [seccion.id]: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && agregarTarea(seccion.id)}
                    placeholder="Nueva tarea..."
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => agregarTarea(seccion.id)}
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
