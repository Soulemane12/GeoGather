'use client';

import { useState } from 'react';
import Map from '../components/Map';
import EventSearch from '../components/EventSearch';
import type { NormalizedEvent } from '@/lib/types';

export default function Home() {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [userLocation, setUserLocation] = useState<{ city?: string; country?: string }>({});

  return (
    <div className="w-screen h-screen m-0 p-0 relative">
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
  );
}
