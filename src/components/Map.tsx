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

// Get Mapbox access token from environment variable
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface MapProps {
  className?: string;
}

export default function Map({ className = '' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [eventMarkers, setEventMarkers] = useState<mapboxgl.Marker[]>([]);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [country, setCountry] = useState<string | undefined>(undefined);
  
  const getUserLocation = () => {
    setLoading(true);
    setError(null);
    
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Real location obtained:', { lat: latitude, lng: longitude });
          
          // Validate coordinates
          if (latitude && longitude && 
              latitude >= -90 && latitude <= 90 && 
              longitude >= -180 && longitude <= 180) {
            setLocation({ lat: latitude, lng: longitude });
            setLoading(false);
            
            // Reverse geocode to get city and country
            reverseGeocodeCity(latitude, longitude, MAPBOX_ACCESS_TOKEN!)
              .then(({ city, country }) => {
                if (city) setCity(city);
                if (country) setCountry(country);
              })
              .catch(() => {});
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
          // Use a more recognizable default location (New York City)
          setLocation({ lat: 40.7128, lng: -74.0060 });
        },
        options
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      setLocation({ lat: 40.7128, lng: -74.0060 });
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const handleEventsFound = (newEvents: NormalizedEvent[]) => {
    setEvents(newEvents);
    console.log(`Found ${newEvents.length} events`);
  };

  const clearEventMarkers = useCallback(() => {
    eventMarkers.forEach(marker => marker.remove());
    setEventMarkers([]);
  }, [eventMarkers]);

  const addEventMarkers = useCallback((eventsToAdd: NormalizedEvent[]) => {
    if (!map.current) return;

    clearEventMarkers();
    const newMarkers: mapboxgl.Marker[] = [];

    eventsToAdd.forEach(event => {
      if (event.lat && event.lng) {
        // Create event marker element
        const el = document.createElement('div');
        el.className = 'event-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#F59E0B';
        el.style.border = '2px solid #ffffff';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.innerHTML = '🎵';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '12px';

        // Create popup content
        const popupContent = `
          <div class="p-2 max-w-xs">
            <h3 class="font-bold text-sm mb-1">${event.title}</h3>
            ${event.venue ? `<p class="text-xs text-gray-600 mb-1">📍 ${event.venue}</p>` : ''}
            ${event.startsAt ? `<p class="text-xs text-gray-600 mb-1">📅 ${new Date(event.startsAt).toLocaleString()}</p>` : ''}
            <a href="${event.url}" target="_blank" class="text-blue-600 text-xs hover:underline">View Details →</a>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(popupContent);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([event.lng, event.lat])
          .setPopup(popup)
          .addTo(map.current!);

        newMarkers.push(marker);
      }
    });

    setEventMarkers(newMarkers);
    console.log(`Added ${newMarkers.length} event markers to map`);
  }, [clearEventMarkers]);

  useEffect(() => {
    if (!location || !mapContainer.current) return;

    console.log('Creating map with location:', location);

    // Check if Mapbox token is available
    if (!MAPBOX_ACCESS_TOKEN) {
      setError('Mapbox access token is not configured. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file.');
      return;
    }

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }



    // Initialize map
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      config: {
        basemap: {
          lightPreset: "night"
        }
      },
      center: [location.lng, location.lat],
      zoom: 12,
      bearing: 0,
      pitch: 0
    });

    // Wait for map to load before adding marker
    map.current.on('load', () => {
      console.log('Map loaded, adding marker at coordinates:', [location.lng, location.lat]);
      
      // Add navigation controls
      map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Ensure the map is centered on the location
      map.current!.setCenter([location.lng, location.lat]);
      map.current!.setZoom(14);

      // Add a simple blue marker for the user's location
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3B82F6';
      el.style.border = '3px solid #ffffff';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      
      new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .addTo(map.current!);
      
      console.log('✅ Marker successfully added at:', [location.lng, location.lat]);
      

    });

    // Cleanup function
    return () => {
      clearEventMarkers();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [location, clearEventMarkers]);

  useEffect(() => {
    if (events.length > 0 && map.current) {
      addEventMarkers(events);
    }
  }, [events, addEventMarkers]);

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
          <div className="space-x-2">
            <button 
              onClick={getUserLocation} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Try Location Again
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
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
        <div 
          ref={mapContainer} 
          className="w-full h-full"
        />
      </div>
    </>
  );
}
