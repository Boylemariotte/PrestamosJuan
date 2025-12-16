import React, { useState } from 'react';
import { Download, Upload, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Configuracion = () => {
  const { exportarDatos, importarDatos, limpiarDatos, clientes } = useApp();
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExportar = async () => {
    setLoading(true);
    try {
      await exportarDatos();
      setMensaje({ tipo: 'success', texto: 'Datos exportados correctamente' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al exportar los datos' });
    }
    setLoading(false);
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleImportar = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          const success = await importarDatos(jsonData);
          if (success) {
            setMensaje({ tipo: 'success', texto: 'Datos importados correctamente' });
            setTimeout(() => {
              setMensaje(null);
              window.location.reload();
            }, 2000);
          } else {
            setMensaje({ tipo: 'error', texto: 'Error al importar los datos' });
            setTimeout(() => setMensaje(null), 3000);
          }
        } catch (error) {
          console.error('Error importando:', error);
          setMensaje({ tipo: 'error', texto: 'Archivo JSON inválido o error en el servidor' });
          setTimeout(() => setMensaje(null), 3000);
        }
        setLoading(false);
      };
      reader.readAsText(file);
    }
  };

  const handleLimpiar = async () => {
    if (confirm('¿Estás seguro de eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      if (confirm('Esta acción eliminará todos los clientes y créditos. ¿Continuar?')) {
        setLoading(true);
        try {
          await limpiarDatos();
          setMensaje({ tipo: 'success', texto: 'Todos los datos han sido eliminados' });
          setTimeout(() => {
            setMensaje(null);
            window.location.reload();
          }, 2000);
        } catch (error) {
          setMensaje({ tipo: 'error', texto: 'Error al eliminar los datos' });
        }
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Gestiona los datos de tu aplicación
        </p>
      </div>

      {/* Mensaje de notificación */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${mensaje.tipo === 'success'
          ? 'bg-green-50 text-green-800 border border-green-200'
          : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {mensaje.tipo === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-3" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-3" />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Información del sistema */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Información del Sistema
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Total de clientes:</span>
            <span className="font-semibold text-gray-900">{clientes.length}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Total de créditos:</span>
            <span className="font-semibold text-gray-900">
              {clientes.reduce((sum, c) => sum + (c.creditos?.length || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Almacenamiento:</span>
            <span className="font-semibold text-green-600">Base de Datos (MongoDB)</span>
          </div>
        </div>
      </div>

      {/* Gestión de datos */}
      <div className="space-y-6">
        {/* Exportar datos */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Download className="h-5 w-5 text-sky-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Exportar Datos
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Descarga una copia de seguridad de todos tus datos en formato JSON.
                Podrás importarlos más tarde si es necesario.
              </p>
              <button
                onClick={handleExportar}
                className="btn-primary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Backup
              </button>
            </div>
          </div>
        </div>

        {/* Importar datos */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Upload className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Importar Datos
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Restaura tus datos desde un archivo de backup previamente exportado.
                Esta acción reemplazará todos los datos actuales.
              </p>
              <div className="flex items-center">
                <label className="btn-secondary cursor-pointer flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Archivo
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportar}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Limpiar datos */}
        <div className="card border-2 border-red-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Trash2 className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Eliminar Todos los Datos
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Elimina permanentemente todos los clientes, créditos y configuraciones.
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ Esta acción no se puede deshacer. Asegúrate de exportar un backup antes.
                </span>
              </p>
              <button
                onClick={handleLimpiar}
                className="btn-danger flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="card mt-6 bg-blue-50 border border-blue-200">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">
              Sobre el almacenamiento
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Los datos se guardan en la Base de Datos (MongoDB)</li>
              <li>• Los datos están disponibles desde cualquier dispositivo</li>
              <li>• Recomendamos exportar backups regularmente</li>
              <li>• Los backups se descargan en formato JSON</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
