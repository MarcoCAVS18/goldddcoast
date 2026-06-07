import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { ExternalLink } from 'lucide-react';
import { useSupabaseData as useLocalData } from '../hooks/useSupabaseData';
import { STATUS_COLORS } from '../constants/statusOptions';
import SectorToggle from './SectorToggle';
import Spinner from './Spinner';
import 'leaflet/dist/leaflet.css';

// Centro y zoom inicial del mapa centrado en Gold Coast
const GC_CENTER = [-28.0020, 153.4298];
const GC_ZOOM = 12;

const MapView = () => {
  const [sector, setSector] = useState('bares');
  const { data, loading } = useLocalData(sector);

  const marcadores = useMemo(() => {
    return data.filter(item => !item.hidden && item.lat && item.lng);
  }, [data]);

  const conteoEstados = useMemo(() => {
    return Object.keys(STATUS_COLORS).reduce((acc, estado) => {
      acc[estado] = marcadores.filter(m => m.status === estado).length;
      return acc;
    }, {});
  }, [marcadores]);

  const urlGoogleMaps = (item) => {
    const query = encodeURIComponent(`${item.nombre} ${item.direccion}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={48} label="Cargando mapa..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectorToggle
        sector={sector}
        onSectorChange={setSector}
        mostrarBotonAgregar={false}
      />

      <div className="bg-dark-sidebar rounded-2xl overflow-hidden border border-dark-hover shadow-lg">
        <div className="h-[65vh] min-h-[420px]">
          <MapContainer
            center={GC_CENTER}
            zoom={GC_ZOOM}
            className="h-full w-full"
            style={{ background: '#1a1a2e' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {marcadores.map((item) => (
              <CircleMarker
                key={item.id}
                center={[item.lat, item.lng]}
                radius={8}
                fillColor={STATUS_COLORS[item.status] || '#4B5563'}
                fillOpacity={0.85}
                color="#fff"
                weight={1.5}
              >
                <Popup>
                  <div style={{ minWidth: '200px', fontFamily: 'system-ui, sans-serif' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#111' }}>
                      {item.nombre}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      {item.barrio}
                    </div>
                    {item.email && (
                      <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px', wordBreak: 'break-all' }}>
                        {item.email}
                      </div>
                    )}
                    {item.direccion && (
                      <div style={{ fontSize: '11px', color: '#777', marginBottom: '8px' }}>
                        {item.direccion}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#fff',
                          backgroundColor: STATUS_COLORS[item.status] || '#4B5563',
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                    <a
                      href={urlGoogleMaps(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#2563EB',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Ver en Google Maps
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Leyenda */}
        <div className="px-4 py-3 border-t border-dark-hover bg-dark-bg/30">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {Object.entries(STATUS_COLORS).map(([estado, color]) => (
              <div key={estado} className="flex items-center gap-1.5 text-dark-subtext">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span>{conteoEstados[estado] || 0} {estado.toLowerCase()}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-dark-subtext">
            Mostrando {marcadores.length} de {data.filter(d => !d.hidden).length} ubicaciones en Gold Coast
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
