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
    <div className="w-screen h-screen m-0 p-0 relative">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/home" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VibeMap
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/map" className="text-blue-600 font-semibold">
                Map
              </Link>
              <Link href="/home" className="text-gray-600 hover:text-blue-600 transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Map Container */}
      <div className="pt-16">
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
