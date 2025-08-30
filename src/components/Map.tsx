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
      .filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number')
      .map((e) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [e.lng as number, e.lat as number] },
        properties: {
          id: e.id,
          title: e.title || '',
          venue: e.venue || '',
          startsAt: e.startsAt || '',
          url: e.url || '',
          source: e.source || '',
        },
      })),
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

  // side panel
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
          if (
            typeof latitude === 'number' &&
            typeof longitude === 'number' &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
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
            setError('Invalid location coordinates received.');
            setLoading(false);
          }
        },
        (err) => {
          setError(`Location error: ${err.message}. Using default location.`);
          setLoading(false);
          setLocation({ lat: 40.7128, lng: -74.006 }); // NYC fallback
        },
        options
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      setLocation({ lat: 40.7128, lng: -74.006 }); // NYC fallback
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const updateEventLayer = useCallback(
    (evs: NormalizedEvent[]) => {
      if (!map.current) return;
      const src = map.current.getSource(EVENTS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (!src) return;

      const fc = eventsToGeoJSON(evs);
      src.setData(fc);

      const coords = fc.features.map((f) => f.geometry.coordinates as [number, number]);
      if (coords.length === 0) {
        if (location) {
          map.current.easeTo({ center: [location.lng, location.lat], zoom: 13, duration: 600 });
        }
        return;
      }

      const b = new mapboxgl.LngLatBounds(coords[0], coords[0]);
      for (let i = 1; i < coords.length; i++) b.extend(coords[i]);
      if (location) b.extend([location.lng, location.lat]);

      const unique = new Set(coords.map((c) => `${c[0].toFixed(5)},${c[1].toFixed(5)}`));
      if (unique.size === 1) {
        map.current.easeTo({ center: coords[0], zoom: 15, duration: 700 });
      } else {
        map.current.fitBounds(b, { padding: 80, duration: 800 });
      }
    },
    [location]
  );

  // init map
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
      zoom: 12,
    });

    map.current.doubleClickZoom.disable();

    map.current.on('load', () => {
      setMapLoaded(true);
      map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // user marker
      const dot = document.createElement('div');
      dot.style.width = '20px';
      dot.style.height = '20px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = '#3B82F6';
      dot.style.border = '3px solid #ffffff';
      dot.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      new mapboxgl.Marker(dot).setLngLat([location.lng, location.lat]).addTo(map.current!);

      // source
      map.current!.addSource(EVENTS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 55,
        clusterMaxZoom: 14,
      });

      // clusters
      map.current!.addLayer({
        id: `${EVENTS_LAYER_ID}-cluster`,
        type: 'circle',
        source: EVENTS_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 25, 24, 50, 30],
          'circle-color': ['step', ['get', 'point_count'], '#FED7AA', 10, '#FDBA74', 25, '#FB923C', 50, '#F97316'],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2,
        },
      });

      map.current!.addLayer({
        id: `${EVENTS_LAYER_ID}-cluster-count`,
        type: 'symbol',
        source: EVENTS_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
        paint: { 'text-color': '#1F2937' },
      });

      // single points
      map.current!.addLayer({
        id: EVENTS_LAYER_ID,
        type: 'circle',
        source: EVENTS_SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 10,
          'circle-color': [
            'match',
            ['get', 'source'],
            'ticketmaster',
            '#F59E0B',
            'serpapi',
            '#10B981',
            /* default */ '#3B82F6',
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 3,
        },
      });

      // cluster click (clamped zoom)
      map.current!.on('click', `${EVENTS_LAYER_ID}-cluster`, (e: mapboxgl.MapMouseEvent) => {
        const features = map.current!.queryRenderedFeatures(e.point, { layers: [`${EVENTS_LAYER_ID}-cluster`] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        if (clusterId === null || clusterId === undefined) return;

        const src = map.current!.getSource(EVENTS_SOURCE_ID) as mapboxgl.GeoJSONSource & {
          getClusterExpansionZoom: (id: number, cb: (err: Error | null, zoom: number) => void) => void;
        };
        src.getClusterExpansionZoom(clusterId, (err, targetZoom) => {
          if (err || targetZoom === null || targetZoom === undefined) return;
          const clamped = Math.min(targetZoom, 15);
          const center = (features[0].geometry as unknown as { coordinates: [number, number] }).coordinates;
          map.current!.easeTo({ center, zoom: clamped, duration: 500 });
        });
      });

      map.current!.on('mouseenter', `${EVENTS_LAYER_ID}-cluster`, () => (map.current!.getCanvas().style.cursor = 'pointer'));
      map.current!.on('mouseleave', `${EVENTS_LAYER_ID}-cluster`, () => (map.current!.getCanvas().style.cursor = ''));

      map.current!.on('mouseenter', EVENTS_LAYER_ID, () => (map.current!.getCanvas().style.cursor = 'pointer'));
      map.current!.on('mouseleave', EVENTS_LAYER_ID, () => (map.current!.getCanvas().style.cursor = ''));
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [location]);

  // update data when events change
  useEffect(() => {
    if (mapLoaded && map.current) {
      updateEventLayer(events);
    }
  }, [mapLoaded, events, updateEventLayer]);

  // click unclustered → open details panel (no zoom change)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const clickHandler = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      e.preventDefault();
      const originalEvent = (e as mapboxgl.MapMouseEvent & { originalEvent?: { stopPropagation?: () => void } }).originalEvent;
      originalEvent?.stopPropagation?.();

      const f = e.features?.[0];
      if (!f) return;
      const p = (f.properties || {}) as { id?: string; title?: string; venue?: string; startsAt?: string };
      const id = typeof p.id === 'string' ? p.id : undefined;

      const coords = (f.geometry as unknown as { coordinates: [number, number] }).coordinates;
      map.current!.easeTo({ center: coords, duration: 350 }); // keep current zoom

             const ev: NormalizedEvent | undefined = id
         ? events.find((item) => item.id === id)
         : events.find((item) => item.title === p.title && item.venue === p.venue && item.startsAt === p.startsAt);

      if (ev) {
        setSelectedEvent(ev);
        setIsPanelOpen(true);
      }
    };

    map.current.on('click', EVENTS_LAYER_ID, clickHandler);
    return () => {
      map.current?.off('click', EVENTS_LAYER_ID, clickHandler);
    };
  }, [mapLoaded, events]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
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
      <div className={`relative ${className}`}>
        {/* Map */}
        <div ref={mapContainer} className="w-full h-full" />

        {/* Overlay wrapper – doesn’t block map outside the card */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 md:right-auto md:w-[520px] z-30">
          <div className="pointer-events-auto">
            <EventSearch onEventsFound={setEvents} userCity={city} userCountry={country} />
          </div>
        </div>
      </div>

      <EventDetailsPanel
        event={selectedEvent}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}
