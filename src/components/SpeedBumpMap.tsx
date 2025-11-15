import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface SpeedBump {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  detected_at: string;
}

interface SpeedBumpMapProps {
  bumps: SpeedBump[];
  currentSpeed: number;
  isMonitoring: boolean;
}

const SpeedBumpMap = ({ bumps, currentSpeed, isMonitoring }: SpeedBumpMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = 'pk.eyJ1Ijoic3VzaG1lZXRzYWx2ZSIsImEiOiJjbWkwMWVkOGYwcHhkMmtzZjVzZWJtM2dnIn0.v4zwSrmMewXMGvLJI5-_aw';

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [0, 0],
        zoom: 2,
      });
    } catch (error) {
      console.error('Failed to initialize Mapbox:', error);
      return;
    }

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 2000,
        });

        // Add user location marker
        const el = document.createElement('div');
        el.className = 'w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg';
        
        userMarkerRef.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .addTo(map.current!);
      });
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers when bumps change
  useEffect(() => {
    if (!map.current) return;

    // Remove markers that no longer exist
    Object.keys(markersRef.current).forEach(id => {
      if (!bumps.find(b => b.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    bumps.forEach(bump => {
      if (!markersRef.current[bump.id]) {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 bg-destructive rounded-full border-2 border-background shadow-lg animate-pulse';
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="text-sm">
            <strong>Speed Bump</strong><br/>
            Speed: ${bump.speed.toFixed(1)} km/h<br/>
            Detected: ${new Date(bump.detected_at).toLocaleString()}
          </div>`
        );

        const marker = new mapboxgl.Marker(el)
          .setLngLat([bump.longitude, bump.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current[bump.id] = marker;
      }
    });
  }, [bumps]);

  // Update user marker when monitoring
  useEffect(() => {
    if (!isMonitoring || !map.current) return;

    const watchId = navigator.geolocation.watchPosition((position) => {
      const { latitude, longitude } = position.coords;
      
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([longitude, latitude]);
      }
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isMonitoring]);

  const hasToken = true;

  if (!hasToken) {
    return (
      <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg border border-border bg-muted flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-muted-foreground">Map view requires Mapbox configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg border border-border">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default SpeedBumpMap;
