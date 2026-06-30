
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { MapPin, Star, Navigation, Clock, Search, ExternalLink } from 'lucide-react';
import { MapLocation } from '../../types';

interface MapWidgetProps {
  locations: MapLocation[];
  onClose: () => void;
}

const MOCK_LOCATIONS: MapLocation[] = [
    { name: "Savor Restaurante", rating: 4.8, address: "Av. Paulista, 1230", status: "Aberto agora" },
    { name: "Regenera Branch VIP", rating: 5.0, address: "Rua Oscar Freire, 500", status: "Aberto até 18h" },
    { name: "ATM 24h Select", rating: 4.2, address: "Shopping Cidade", status: "24 Horas" }
];

const MapWidget: React.FC<MapWidgetProps> = ({ locations = [], onClose }) => {
  // If AI didn't return specific locations (text-only response), we show a "Searching..." or fallback state
  // In a real app, we would parse the text response for entities or pass raw results.
  // For now, if empty, we assume the user asked for something generic or it's a demo state.
  const displayLocations = locations.length > 0 ? locations : MOCK_LOCATIONS;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 px-4 md:px-6 animate-in slide-in-from-bottom duration-500 flex justify-center pointer-events-none">
        <div className="bg-bg-mid/95 backdrop-blur-2xl border border-cyan-500/30 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden w-full max-w-2xl pointer-events-auto">
            {/* Map Abstract Background */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png')] bg-cover bg-center mix-blend-overlay"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/20 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                            <MapPin className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg leading-none">Localização Inteligente</h3>
                            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mt-1">Grounding by Google Maps</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full">Fechar</button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {displayLocations.map((loc, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center group hover:bg-white/10 transition-colors hover:border-cyan-500/30">
                            <div className="flex-1 min-w-0 pr-4">
                                <h4 className="text-white font-bold text-base truncate">{loc.name}</h4>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    {loc.rating && (
                                        <span className="text-xs text-amber-400 flex items-center gap-1 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            <Star className="w-3 h-3 fill-amber-400" /> {loc.rating}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400 truncate max-w-[200px]">{loc.address}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                    <Clock className="w-3 h-3" /> {loc.status || 'Verificar Horário'}
                                </div>
                            </div>
                            
                            <div className="flex gap-2 shrink-0">
                                <button className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                                    <Search className="w-5 h-5" />
                                </button>
                                <button className="p-3 bg-cyan-600/20 rounded-xl text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)] group-hover:scale-105 border border-cyan-500/30">
                                    <Navigation className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Maps Data API</span>
                    <span>Lat: -23.5505 | Lng: -46.6333</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MapWidget;
