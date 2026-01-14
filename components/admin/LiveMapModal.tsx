
import React, { useEffect, useRef } from 'react';
import { Users, X } from 'lucide-react';
// FIX: Imported OnlineUser from centralized types.ts
import { OnlineUser } from '../../types';

interface LiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: OnlineUser[];
}

export const LiveMapModal: React.FC<LiveMapModalProps> = ({ isOpen, onClose, users }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            if (mapRef.current && !mapInstance.current && (window as any).L) {
                mapInstance.current = (window as any).L.map(mapRef.current).setView([45, 10], 2);
                (window as any).L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap &copy; CARTO',
                    subdomains: 'abcd',
                    maxZoom: 19
                }).addTo(mapInstance.current);
            }
            if (mapInstance.current) {
                mapInstance.current.eachLayer((layer: any) => {
                    if (layer instanceof (window as any).L.CircleMarker) mapInstance.current.removeLayer(layer);
                });
                users.forEach(user => {
                    if (user.lat && user.lon) {
                        const isPurchase = user.action === 'purchased';
                        (window as any).L.circleMarker([user.lat, user.lon], {
                            radius: isPurchase ? 12 : 6,
                            fillColor: isPurchase ? "#f59e0b" : "#10b981",
                            color: isPurchase ? "#92400e" : "#333",
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.9
                        }).addTo(mapInstance.current);
                    }
                });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [isOpen, users]);
    
    useEffect(() => {
        if (!isOpen && mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex overflow-hidden border border-gray-200 animate-in zoom-in duration-200 h-[75vh]">
                <div className="w-2/3 h-full bg-gray-100 relative"><div ref={mapRef} id="map" className="w-full h-full z-10"></div></div>
                <div className="w-1/3 h-full flex flex-col bg-gray-50 border-l border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /><h3 className="font-bold text-slate-800">Utenti Attivi</h3></div>
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full border border-emerald-200">{users.length} Online</span>
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-grow p-2 space-y-1">
                        {users.map(user => (
                            <div key={user.id} className="p-3 rounded-lg hover:bg-gray-200 transition-colors">
                                <p className="font-bold text-sm text-slate-800">{user.city || 'Sconosciuto'}, {user.country || 'N/A'} {user.action === 'purchased' && '⭐'}</p>
                                <p className="text-xs text-slate-500 truncate mt-1">Pagina: {user.pageUrl || 'N/D'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};