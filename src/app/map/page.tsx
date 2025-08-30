'use client';

import { useState } from 'react';
import Map from '../../components/Map';
import EventSearch from '../../components/EventSearch';
import type { NormalizedEvent } from '@/lib/types';
import Link from 'next/link';

export default function MapPage() {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [userLocation, setUserLocation] = useState<{ city?: string; country?: string }>({});

  return (
    <div className="w-screen h-screen m-0 p-0 relative bg-gray-50">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/home" className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-gray-800 bg-clip-text text-transparent">
                VibeMap
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/map" className="text-orange-500 font-semibold">
                Map
              </Link>
              <Link href="/home" className="text-gray-300 hover:text-orange-500 transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Map Container */}
      <div className="absolute top-16 left-0 right-0 bottom-0">
        <Map
          className="w-full h-full"
          events={events}
          onLocationUpdate={setUserLocation}
        />
        <EventSearch
          onEventsFound={setEvents}
          userCity={userLocation.city}
          userCountry={userLocation.country}
        />
      </div>
    </div>
  );
}
