import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Clock, CheckCircle, AlertCircle, X, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatearFecha } from '../utils/creditCalculations';
import { obtenerFechaLocal } from '../utils/dateUtils';

const Alertas = () => {
  const { 
    alertas, 
    agregarAlerta, 
    eliminarAlerta, 
    desactivarAlerta,
    marcarAlertaComoNotificada 
  } = useApp();
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // todas, activas, completadas
  const [formData, setFormData] = useState({
    asunto: '',
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    minutosAntes: 15
  });

  // Verificar alertas pendientes cada minuto
  useEffect(() => {
    const intervalo = setInterval(() => {
      verificarAlertas();
    }, 60000); // Cada 60 segundos

    // Verificar inmediatamente al cargar
    verificarAlertas();

    return () => clearInterval(intervalo);
  }, [alertas]);

  const verificarAlertas = () => {
    const ahora = new Date();
    
    alertas.forEach(alerta => {
      if (!alerta.activa || alerta.notificada) return;

      const fechaHoraAlerta = new Date(`${alerta.fecha}T${alerta.hora}`);
      const tiempoAntes = alerta.minutosAntes * 60 * 1000; // Convertir a milisegundos
      const tiempoNotificacion = new Date(fechaHoraAlerta.getTime() - tiempoAntes);

      if (ahora >= tiempoNotificacion && ahora < fechaHoraAlerta) {
        mostrarNotificacion(alerta);
        marcarAlertaComoNotificada(alerta.id);
      }
    });
  };

  const mostrarNotificacion = (alerta) => {
    // Notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Recordatorio de Cobro', {
        body: `${alerta.titulo}\n${alerta.descripcion}`,
        icon: '/favicon.ico',
        tag: alerta.id
      });
    }

    // Notificación visual en la app
    const notificacion = document.createElement('div');
    notificacion.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-md animate-slide-in';
    notificacion.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-bold mb-1">${alerta.titulo}</h4>
          <p class="text-sm">${alerta.descripcion}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="shrink-0 hover:bg-blue-700 rounded p-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    document.body.appendChild(notificacion);

    // Auto-remover después de 10 segundos
    setTimeout(() => {
      notificacion.remove();
    }, 10000);
  };

  const solicitarPermisoNotificaciones = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.asunto || !formData.titulo || !formData.fecha || !formData.hora) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    agregarAlerta(formData);

    setFormData({
      asunto: '',
      titulo: '',
      descripcion: '',
      fecha: '',
      hora: '',
      minutosAntes: 15
    });
    setMostrarFormulario(false);
  };

  const handleEliminar = (alertaId) => {
    if (window.confirm('¿Estás seguro de eliminar esta alerta?')) {
      eliminarAlerta(alertaId);
    }
  };

  const handleCompletar = (alertaId) => {
    desactivarAlerta(alertaId);
  };

  const alertasFiltradas = alertas.filter(alerta => {
    if (filtro === 'activas') return alerta.activa;
    if (filtro === 'completadas') return !alerta.activa;
    return true;
  }).sort((a, b) => {
    const fechaA = new Date(`${a.fecha}T${a.hora}`);
    const fechaB = new Date(`${b.fecha}T${b.hora}`);
    return fechaA - fechaB;
  });

  const alertasPendientesHoy = alertas.filter(alerta => {
    if (!alerta.activa) return false;
    const hoy = obtenerFechaLocal();
    return alerta.fecha === hoy;
  }).length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Alertas y Recordatorios
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona recordatorios para cobros, pagos de recibos, recoger cuotas y más
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nueva Alerta
          </button>
        </div>

        {/* Solicitar permisos de notificación */}
        {'Notification' in window && Notification.permission === 'default' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                Para recibir notificaciones de recordatorios, necesitas habilitar las notificaciones del navegador.
              </p>
              <button
                onClick={solicitarPermisoNotificaciones}
                className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Habilitar notificaciones
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Alertas Activas</p>
                <p className="text-3xl font-bold mt-1">
                  {alertas.filter(a => a.activa).length}
                </p>
              </div>
              <Bell className="w-12 h-12 text-blue-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Pendientes Hoy</p>
                <p className="text-3xl font-bold mt-1">{alertasPendientesHoy}</p>
              </div>
              <Clock className="w-12 h-12 text-green-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Completadas</p>
                <p className="text-3xl font-bold mt-1">
                  {alertas.filter(a => !a.activa).length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-200 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFiltro('todas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'todas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas ({alertas.length})
          </button>
          <button
            onClick={() => setFiltro('activas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'activas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Activas ({alertas.filter(a => a.activa).length})
          </button>
          <button
            onClick={() => setFiltro('completadas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'completadas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completadas ({alertas.filter(a => !a.activa).length})
          </button>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-4">
        {alertasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay alertas {filtro !== 'todas' ? filtro : ''}</p>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear primera alerta
            </button>
          </div>
        ) : (
          alertasFiltradas.map(alerta => {
            const fechaHora = new Date(`${alerta.fecha}T${alerta.hora}`);
            const ahora = new Date();
            const esPasada = fechaHora < ahora;
            const esHoy = alerta.fecha === new Date().toISOString().split('T')[0];

            return (
              <div
                key={alerta.id}
                className={`bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg ${
                  !alerta.activa ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        alerta.activa
                          ? esHoy
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{alerta.titulo}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          {alerta.asunto && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {alerta.asunto}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatearFecha(alerta.fecha)} a las {alerta.hora}
                          </span>
                        </div>
                      </div>
                    </div>

                    {alerta.descripcion && (
                      <p className="text-gray-700 mt-3 ml-14">{alerta.descripcion}</p>
                    )}

                    <div className="flex items-center gap-4 mt-4 ml-14">
                      {alerta.activa && (
                        <>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            esPasada
                              ? 'bg-red-100 text-red-700'
                              : esHoy
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {esPasada ? 'Vencida' : esHoy ? 'Hoy' : 'Programada'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Recordar {alerta.minutosAntes} min antes
                          </span>
                        </>
                      )}
                      {!alerta.activa && (
                        <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                          Completada
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {alerta.activa && (
                      <button
                        onClick={() => handleCompletar(alerta.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Marcar como completada"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminar(alerta.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar alerta"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-bold text-white">Nueva Alerta</h2>
              <button
                onClick={() => setMostrarFormulario(false)}
                className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto / Para quién *
                </label>
                <input
                  type="text"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez, Pagar recibo de luz, Recoger cuota de María"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej: Cobro de cuota semanal"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Detalles adicionales sobre el recordatorio..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora *
                  </label>
                  <input
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recordar con anticipación
                </label>
                <select
                  name="minutosAntes"
                  value={formData.minutosAntes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 minutos antes</option>
                  <option value={10}>10 minutos antes</option>
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                  <option value={120}>2 horas antes</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg"
                >
                  Crear Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alertas;
