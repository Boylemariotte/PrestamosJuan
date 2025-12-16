import React from 'react';
import { X, Download } from 'lucide-react';
import CowImage from '../../Icon/Cow.png';

const CreditoDetalleHeader = ({ onClose, onPrint }) => {
  return (
    <div className="bg-white px-6 py-4 flex items-center justify-between rounded-t-xl border-b-2 border-blue-500 print:hidden">
      <div className="flex-1 flex justify-center">
        <div className="flex items-center space-x-4">
          <img 
            src={CowImage} 
            alt="Vaca" 
            className="w-20 h-20 object-contain"
          />
          <h1 className="text-3xl font-bold text-blue-600 uppercase tracking-wide">
            DISTRICARNES
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrint}
          className="px-3 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center"
          title="Imprimir / Guardar como PDF"
        >
          <Download className="h-4 w-4 mr-1" />
          PDF
        </button>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default CreditoDetalleHeader;

