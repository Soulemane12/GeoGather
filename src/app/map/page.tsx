'use client';

import { useState } from 'react';
import Map from '../../components/Map';
import EventSearch from '../../components/EventSearch';
import type { NormalizedEvent } from '@/lib/types';
import Link from 'next/link';

export default function MapPage() {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [userLocation, setUserLocation] = useState<{ city?: string; country?: string }>({});
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const handleEventSelect = (event: NormalizedEvent) => {
    setSelectedEvent(event);
    setIsSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setIsSidePanelOpen(false);
    setSelectedEvent(null);
  };

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
      <div className="absolute top-16 left-0 right-0 bottom-0">
        <Map
          className="w-full h-full"
          events={events}
          onLocationUpdate={setUserLocation}
          onEventSelect={handleEventSelect}
        />
        <EventSearch
          onEventsFound={setEvents}
          userCity={userLocation.city}
          userCountry={userLocation.country}
        />
      </div>

      {/* Side Panel */}
      {isSidePanelOpen && selectedEvent && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeSidePanel}
          />
          
          {/* Side Panel */}
          <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Event Details</h3>
                <button
                  onClick={closeSidePanel}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                >
                  ×
                </button>
              </div>

              {/* Event Content */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedEvent.title}
                  </h4>
                  {selectedEvent.venue && (
                    <p className="text-gray-600 flex items-center">
                      <span className="mr-2">📍</span>
                      {selectedEvent.venue}
                    </p>
                  )}
                </div>

                {/* Date & Time */}
                {selectedEvent.startsAt && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                    <p className="text-gray-900 font-medium">
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
                )}

                {/* Description */}
                {selectedEvent.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                    <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Source */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-1">Source</p>
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      selectedEvent.source === 'ticketmaster' ? 'bg-amber-500' :
                      selectedEvent.source === 'serpapi' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}></span>
                    <span className="text-gray-900 capitalize font-medium">
                      {selectedEvent.source === 'serpapi' ? 'Google Events' : 
                       selectedEvent.source === 'ticketmaster' ? 'Ticketmaster' : 
                       'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                {selectedEvent.url && (
                  <div className="pt-4">
                    <a
                      href={selectedEvent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-center block font-semibold"
                    >
                      View Event Details →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
