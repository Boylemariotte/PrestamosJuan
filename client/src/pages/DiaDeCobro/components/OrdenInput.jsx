import React, { useState, useEffect } from 'react';

// Componente de input local para evitar re-renderizados mientras se escribe
const OrdenInput = ({ valorInicial, onGuardar }) => {
    const [valor, setValor] = useState(valorInicial);

    useEffect(() => {
        setValor(valorInicial);
    }, [valorInicial]);

    const handleBlur = () => {
        if (valor !== valorInicial) {
            onGuardar(valor);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Activa handleBlur
        }
    };

    return (
        <input
            type="text"
            className="w-16 text-center border-2 border-gray-500 rounded-md text-base font-bold py-1 px-1 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
        />
    );
};

export default OrdenInput;
