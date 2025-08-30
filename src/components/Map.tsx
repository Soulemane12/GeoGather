'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import EventSearch from './EventSearch';
import EventDetailsPanel from './EventDetailsPanel';
import type { NormalizedEvent } from '@/lib/types';
import type { FeatureCollection, Point } from 'geojson';

async function reverseGeocodeCity(
  lat: number,
  lng: number,
  mapboxToken: string
): Promise<{ city?: string; country?: string }> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality&language=en&access_token=${mapboxToken}`;
  const res = await fetch(url);
  if (!res.ok) return {};
  const json = await res.json();
  const f = json?.features?.[0];
  const city = f?.text as string | undefined;
  const country = (f?.context?.find((c: { id?: string }) => c.id?.startsWith('country')) as { short_code?: string } | undefined)?.short_code?.toUpperCase();
  return { city, country };
}

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const EVENTS_SOURCE_ID = 'events';
const EVENTS_LAYER_ID = 'events-circle';

interface MapProps {
  className?: string;
}

function eventsToGeoJSON(events: NormalizedEvent[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: events
      .filter(e => typeof e.lat === 'number' && typeof e.lng === 'number')
      .map(e => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [e.lng as number, e.lat as number] },
        properties: {
          title: e.title || '',
          venue: e.venue || '',
          startsAt: e.startsAt || '',
          url: e.url || '',
          source: e.source || ''
        }
      }))
  };
}

export default function Map({ className = '' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const getUserLocation = () => {
    setLoading(true);
    setError(null);

    if (navigator.geolocation) {
      const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Real location obtained:', { lat: latitude, lng: longitude });

          if (
            typeof latitude === 'number' && typeof longitude === 'number' &&
            latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
          ) {
            setLocation({ lat: latitude, lng: longitude });
            setLoading(false);

            if (MAPBOX_ACCESS_TOKEN) {
              reverseGeocodeCity(latitude, longitude, MAPBOX_ACCESS_TOKEN)
                .then(({ city, country }) => {
                  if (city) setCity(city);
                  if (country) setCountry(country);
                })
                .catch(() => {});
            }
          } else {
            console.error('Invalid coordinates:', { lat: latitude, lng: longitude });
            setError('Invalid location coordinates received.');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(`Location error: ${err.message}. Using default location.`);
          setLoading(false);
          setLocation({ lat: 40.7128, lng: -74.0060 }); // NYC fallback
        },
        options
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      setLocation({ lat: 40.7128, lng: -74.0060 }); // NYC fallback
    }
  };

  useEffect(() => { getUserLocation(); }, []);

  // Update GeoJSON source + fit bounds
  const updateEventLayer = useCallback((evs: NormalizedEvent[]) => {
    if (!map.current) return;

    const src = map.current.getSource(EVENTS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!src) {
      console.warn('Events source not ready yet');
      return;
    }

    const fc = eventsToGeoJSON(evs);
    src.setData(fc);
    console.log('GeoJSON feature count:', fc.features.length);

    // quick visibility/debug by source
    const serpCount = evs.filter(e => e.source === 'serpapi' && typeof e.lat === 'number' && typeof e.lng === 'number').length;
    const tmCount = evs.filter(e => e.source === 'ticketmaster' && typeof e.lat === 'number' && typeof e.lng === 'number').length;
    console.log(`By source → Serp API: ${serpCount}, Ticketmaster: ${tmCount}`);

    const coords = fc.features.map(f => f.geometry.coordinates as [number, number]);

    if (coords.length === 0) {
      if (location) {
        map.current.easeTo({ center: [location.lng, location.lat], zoom: 13, duration: 600 });
      }
      return;
    }

    // Build bounds for all points (+ user)
    const b = new mapboxgl.LngLatBounds(coords[0], coords[0]);
    for (let i = 1; i < coords.length; i++) b.extend(coords[i]);
    if (location) b.extend([location.lng, location.lat]);

    const unique = new Set(coords.map(c => `${c[0].toFixed(5)},${c[1].toFixed(5)}`));
    if (unique.size === 1) {
      map.current.easeTo({ center: coords[0], zoom: 15, duration: 700 });
    } else {
      map.current.fitBounds(b, { padding: 80, duration: 800 });
    }

    console.log(`🟠 Plotted ${coords.length} points; ${unique.size} unique locations`);
  }, [location]);

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedEvent(null);
  };

  // Create the map once we have a location
  useEffect(() => {
    if (!location || !mapContainer.current || map.current) return;

    if (!MAPBOX_ACCESS_TOKEN) {
      setError('Mapbox access token is not configured. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local');
      return;
    }

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [location.lng, location.lat],
      zoom: 12
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // user location marker
      const dot = document.createElement('div');
      dot.style.width = '20px';
      dot.style.height = '20px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = '#3B82F6';
      dot.style.border = '3px solid #ffffff';
      dot.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      new mapboxgl.Marker(dot).setLngLat([location.lng, location.lat]).addTo(map.current!);

      // ---- EVENTS SOURCE + LAYERS (CLUSTERED) ----
      map.current!.addSource(EVENTS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 55,
        clusterMaxZoom: 22  // Increased to allow clustering at higher zoom levels
      });

      // ✅ FIXED: step() must be base, stop1,out1, stop2,out2, ...
      map.current!.addLayer({
        id: `${EVENTS_LAYER_ID}-cluster`,
        type: 'circle',
        source: EVENTS_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16,   // base: <10 (increased from 14)
            10, 20,  // increased from 18
            25, 24,  // increased from 22
            50, 30   // increased from 28
          ],
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#FED7AA',     // <10
            10, '#FDBA74', // 10–24
            25, '#FB923C', // 25–49
            50, '#F97316'  // 50+
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2
        }
      });

      // cluster count labels
      map.current!.addLayer({
        id: `${EVENTS_LAYER_ID}-cluster-count`,
        type: 'symbol',
        source: EVENTS_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12
        },
        paint: { 'text-color': '#1F2937' }
      });

      // single (unclustered) events — color by source
      map.current!.addLayer({
        id: EVENTS_LAYER_ID,
        type: 'circle',
        source: EVENTS_SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 10,  // Increased from 7 for better visibility
          'circle-color': [
            'match',
            ['get', 'source'],
            'ticketmaster', '#F59E0B',   // amber
            'serpapi',      '#10B981',   // emerald (updated from eventbrite)
            /* default */   '#3B82F6'    // blue
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 3  // Increased from 2 for better visibility
        }
      });

      // click a cluster → zoom into it
      map.current!.on('click', `${EVENTS_LAYER_ID}-cluster`, (e: mapboxgl.MapMouseEvent) => {
        const features = map.current!.queryRenderedFeatures(e.point, { layers: [`${EVENTS_LAYER_ID}-cluster`] });
        if (features.length === 0) return;

        const clusterId = features[0].properties?.cluster_id;
        if (clusterId === null || clusterId === undefined) return;

        const src = map.current!.getSource(EVENTS_SOURCE_ID) as mapboxgl.GeoJSONSource & {
          getClusterExpansionZoom: (id: number, cb: (err: Error | null, zoom: number) => void) => void
        };
        src.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === null || zoom === undefined) return;
          map.current!.easeTo({
            center: (features[0].geometry as unknown as { coordinates: [number, number] }).coordinates,
            zoom,
            duration: 500
          });
        });
      });

      map.current!.on('mouseenter', `${EVENTS_LAYER_ID}-cluster`, () => (map.current!.getCanvas().style.cursor = 'pointer'));
      map.current!.on('mouseleave', `${EVENTS_LAYER_ID}-cluster`, () => (map.current!.getCanvas().style.cursor = ''));

      map.current!.on('mouseenter', EVENTS_LAYER_ID, () => (map.current!.getCanvas().style.cursor = 'pointer'));
      map.current!.on('mouseleave', EVENTS_LAYER_ID, () => (map.current!.getCanvas().style.cursor = ''));

      console.log('✅ Map loaded, events layer (clustered) added, user marker added');
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [location]);

  // Update the layer when events arrive
  useEffect(() => {
    if (mapLoaded && map.current) {
      updateEventLayer(events);
    }
  }, [mapLoaded, events, updateEventLayer]);

  // Add click handler for events
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const clickHandler = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      e.preventDefault();
      
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties || {};
      
      // Find the corresponding event from our events array
      const clickedEvent = events.find(event => 
        event.title === p.title && 
        event.venue === p.venue &&
        event.startsAt === p.startsAt
      );
      
      if (clickedEvent) {
        setSelectedEvent(clickedEvent);
        setIsPanelOpen(true);
      }
    };

    map.current.on('click', EVENTS_LAYER_ID, clickHandler);
  }, [mapLoaded, events]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Getting your location...</p>
          <p className="text-sm text-gray-500 mt-1">Please allow location access when prompted</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 mb-2">⚠️ {error}</p>
          <p className="text-sm text-gray-600 mb-3">Showing default location instead.</p>
          <button
            onClick={getUserLocation}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Location Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <EventSearch
        onEventsFound={setEvents}
        userCity={city}
        userCountry={country}
      />
      <div className={`relative ${className}`}>
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      <EventDetailsPanel
        event={selectedEvent}
        isOpen={isPanelOpen}
        onClose={closePanel}
      />
    </>
  );
}
