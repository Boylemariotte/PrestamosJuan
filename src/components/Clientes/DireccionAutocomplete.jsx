import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { autocompletarDireccion } from '../../services/geocoding';

const DireccionAutocomplete = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Ej: Calle 23 Número 45-30",
  className = "",
  name = ""
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const buscarSugerencias = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const resultados = await autocompletarDireccion(query, 5);
      setSuggestions(resultados);
      setShowSuggestions(resultados.length > 0);
    } catch (error) {
      console.error('Error buscando sugerencias:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Llamar onChange del padre
    if (onChange) {
      onChange({
        target: {
          name: name,
          value: newValue
        }
      });
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Buscar después de 300ms de inactividad
    timeoutRef.current = setTimeout(() => {
      buscarSugerencias(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (sugerencia) => {
    setInputValue(sugerencia.formatted);
    setShowSuggestions(false);
    setSuggestions([]);

    // Llamar onChange del padre
    if (onChange) {
      onChange({
        target: {
          name: name,
          value: sugerencia.formatted
        }
      });
    }

    // Llamar onSelect si existe (para guardar coordenadas)
    if (onSelect) {
      onSelect(sugerencia);
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (inputValue && inputValue.trim().length >= 3) {
      buscarSugerencias(inputValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`input-field pr-10 ${className}`}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((sugerencia, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(sugerencia)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {sugerencia.text}
                  </p>
                  {sugerencia.suburb && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sugerencia.suburb}
                    </p>
                  )}
                  {sugerencia.type && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {sugerencia.type === 'building' ? 'Edificio' : 
                       sugerencia.type === 'street' ? 'Calle' : 
                       sugerencia.type === 'house_number' ? 'Número' : sugerencia.type}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DireccionAutocomplete;

