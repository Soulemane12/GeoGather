'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import EventSearch from './EventSearch';
import type { NormalizedEvent } from '@/lib/types';

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
  const city = f?.text;
  const country = f?.context?.find((c: { id?: string }) => c.id?.startsWith("country"))?.short_code?.toUpperCase();
  return { city, country };
}

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface MapProps {
  className?: string;
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

  // IMPORTANT: use a ref for markers to avoid render loops
  const markersRef = useRef<mapboxgl.Marker[]>([]);

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

            // reverse geocode city + country
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
        (error) => {
          console.error('Geolocation error:', error);
          setError(`Location error: ${error.message}. Using default location.`);
          setLoading(false);
          setLocation({ lat: 40.7128, lng: -74.0060 }); // NYC
        },
        options
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      setLocation({ lat: 40.7128, lng: -74.0060 }); // NYC
    }
  };

  useEffect(() => { getUserLocation(); }, []);

  const handleEventsFound = (newEvents: NormalizedEvent[]) => {
    setEvents(newEvents);
    console.log(`Found ${newEvents.length} events`);
  };

  // Add markers + fit bounds (uses refs, so it won't cause re-renders)
  const addEventMarkers = useCallback((eventsToAdd: NormalizedEvent[]) => {
    if (!map.current) return;

    // clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let valid = 0;

    eventsToAdd.forEach((event) => {
      if (
        typeof event.lat === 'number' && typeof event.lng === 'number' &&
        !Number.isNaN(event.lat) && !Number.isNaN(event.lng) &&
        event.lat >= -90 && event.lat <= 90 && event.lng >= -180 && event.lng <= 180
      ) {
        valid++;
        const el = document.createElement('div');
        el.className = 'event-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#F59E0B';
        el.style.border = '2px solid #ffffff';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '12px';
        el.textContent = '🎵';

        const html = `
          <div class="p-2 max-w-xs">
            <h3 class="font-bold text-sm mb-1">${event.title}</h3>
            ${event.venue ? `<p class="text-xs text-gray-600 mb-1">📍 ${event.venue}</p>` : ''}
            ${event.startsAt ? `<p class="text-xs text-gray-600 mb-1">📅 ${new Date(event.startsAt).toLocaleString()}</p>` : ''}
            <a href="${event.url}" target="_blank" class="text-blue-600 text-xs hover:underline">View Details →</a>
          </div>
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([event.lng, event.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(html))
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend([event.lng, event.lat]);
      }
    });

    if (location) bounds.extend([location.lng, location.lat]);

    if (!bounds.isEmpty()) {
      console.log(`Added ${valid} event markers; fitting bounds…`);
      map.current.fitBounds(bounds, { padding: 80, duration: 800 });
    } else {
      console.log('No valid event coordinates to fit.');
    }
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
      style: 'mapbox://styles/mapbox/streets-v12', // simpler for debugging
      center: [location.lng, location.lat],
      zoom: 12
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // user location marker
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3B82F6';
      el.style.border = '3px solid #ffffff';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      new mapboxgl.Marker(el).setLngLat([location.lng, location.lat]).addTo(map.current!);

      console.log('✅ Map loaded and user marker added');
    });

    return () => {
      // cleanup markers + map on unmount
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (map.current) { map.current.remove(); map.current = null; }
    };
  }, [location]);

  // Only add markers when we have events AND the style is loaded
  useEffect(() => {
    if (mapLoaded && events.length > 0 && map.current) {
      addEventMarkers(events);
    }
  }, [mapLoaded, events, addEventMarkers]);

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
        onEventsFound={handleEventsFound}
        userCity={city}
        userCountry={country}
      />
      <div className={`relative ${className}`}>
        <div ref={mapContainer} className="w-full h-full" />
      </div>
    </>
  );
}
