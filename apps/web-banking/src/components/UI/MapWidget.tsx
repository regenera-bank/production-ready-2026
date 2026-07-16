
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { MapPin, Star, Clock, Search } from 'lucide-react';
import { MapLocation } from '../../types';

interface MapWidgetProps {
  locations: MapLocation[];
  onClose: () => void;
}

const MapWidget: React.FC<MapWidgetProps> = ({ locations = [], onClose }) => {
  if (locations.length === 0) {
    return (
      <div className="fixed bottom-24 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
        <div className="bg-bg-mid/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-md pointer-events-auto text-center">
          <p className="text-sm text-gray-400 mb-4">Nenhuma localização retornada pela busca</p>
          <button type="button" onClick={onClose} className="text-xs text-primary font-bold uppercase tracking-widest">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 px-4 md:px-6 animate-in slide-in-from-bottom duration-500 flex justify-center pointer-events-none">
        <div className="bg-bg-mid/95 backdrop-blur-2xl border border-cyan-500/30 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden w-full max-w-2xl pointer-events-auto">
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-cyan-400" />
                        <h3 className="text-white font-bold text-lg">Resultados</h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest">Fechar</button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {locations.map((loc, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center">
                            <div className="flex-1 min-w-0 pr-4">
                                <h4 className="text-white font-bold text-base truncate">{loc.name}</h4>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    {loc.rating && (
                                        <span className="text-xs text-amber-400 flex items-center gap-1 font-bold">
                                            <Star className="w-3 h-3 fill-amber-400" /> {loc.rating}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400 truncate">{loc.address}</span>
                                </div>
                                {loc.status && (
                                  <div className="flex items-center gap-2 mt-2 text-[10px] text-emerald-400 font-bold uppercase">
                                      <Clock className="w-3 h-3" /> {loc.status}
                                  </div>
                                )}
                            </div>
                            <button
                                type="button"
                                title="Abrir no Google Maps"
                                onClick={() => window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.name} ${loc.address ?? ''}`)}`,
                                  '_blank',
                                  'noopener,noreferrer',
                                )}
                                className="p-3 bg-white/5 rounded-xl text-gray-400 border border-white/5 hover:text-white hover:border-cyan-500/30"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default MapWidget;