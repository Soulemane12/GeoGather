'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  events?: NormalizedEvent[];
  onLocationUpdate?: (location: { city?: string; country?: string }) => void;
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

export default function Map({ className = '', events = [], onLocationUpdate }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedEvent(null);
  };

  // Handle ESC key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        closePanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen]);

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
                  onLocationUpdate?.({ city, country });
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
      dot.style.backgroundColor = '#10B981';
      dot.style.border = '3px solid #ffffff';
      dot.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      new mapboxgl.Marker(dot).setLngLat([location.lng, location.lat]).addTo(map.current!);

      // ---- EVENTS SOURCE + LAYERS (CLUSTERED) ----
      map.current!.addSource(EVENTS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 55,
        clusterMaxZoom: 14
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
            14,   // base: <10
            10, 18,
            25, 22,
            50, 28
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
          'circle-radius': 7,
          'circle-color': [
            'match',
            ['get', 'source'],
            'ticketmaster', '#F59E0B',   // amber
            'eventbrite',   '#10B981',   // emerald
            /* default */   '#3B82F6'    // blue
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2
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

      // click an unclustered event → open side panel
      map.current!.on('click', EVENTS_LAYER_ID, (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
        const f = e.features?.[0];
        if (!f) return;

        const p = f.properties || {};

        // Find the full event data from the events array
        const event = events.find(ev => ev.id === p.id);
        if (event) {
          setSelectedEvent(event);
          setIsPanelOpen(true);
        }
      });

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
  }, [location, events]);

  // Update the layer when events arrive
  useEffect(() => {
    console.log('Map received events:', events.length);
    if (mapLoaded && map.current) {
      updateEventLayer(events);
    }
  }, [mapLoaded, events, updateEventLayer]);

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
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div
        ref={mapContainer}
        className={`h-full transition-all duration-300 ease-in-out ${
          isPanelOpen ? 'w-full lg:w-2/3' : 'w-full'
        }`}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl border-l border-gray-200 transition-transform duration-300 ease-in-out z-50 ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isPanelOpen ? 'w-full sm:w-96' : 'w-0'}`}
      >
        {selectedEvent && (
          <div className="p-6 h-full overflow-y-auto">
            {/* Close Button */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 pr-4">{selectedEvent.title}</h2>
              <button
                onClick={closePanel}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Event Details */}
            <div className="space-y-4">
              {selectedEvent.venue && (
                <div className="flex items-start space-x-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="font-medium text-gray-900">{selectedEvent.venue}</p>
                    {selectedEvent.city && <p className="text-sm text-gray-600">{selectedEvent.city}</p>}
                  </div>
                </div>
              )}

              {selectedEvent.startsAt && (
                <div className="flex items-start space-x-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedEvent.startsAt).toLocaleString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="flex items-start space-x-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                </div>
              )}

              {selectedEvent.url && (
                <div className="pt-4 border-t border-gray-200">
                  <a
                    href={selectedEvent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors w-full justify-center"
                  >
                    View Event Details
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closePanel}
        />
      )}
    </div>
  );
}
