import React from 'react';
import { StickyNote, Trash2 } from 'lucide-react';
import { formatearFecha } from '../../utils/creditCalculations';

const ListaNotas = ({ notas, nuevaNota, onNotaChange, onAgregarNota, onEliminarNota }) => {
  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <StickyNote className="h-5 w-5 mr-2" />
        Notas y Comentarios
      </h3>

      <form onSubmit={onAgregarNota} className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={nuevaNota}
            onChange={(e) => onNotaChange(e.target.value)}
            placeholder="Agregar una nota..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!nuevaNota.trim()}
          >
            Agregar
          </button>
        </div>
      </form>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {notas && notas.length > 0 ? (
          notas.map((nota) => (
            <div
              key={nota.id}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-900">{nota.texto}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatearFecha(nota.fecha.split('T')[0])}
                  </p>
                </div>
                <button
                  onClick={() => onEliminarNota(nota.id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            No hay notas registradas
          </p>
        )}
      </div>
    </div>
  );
};

export default ListaNotas;

