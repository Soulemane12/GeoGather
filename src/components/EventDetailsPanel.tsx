'use client';

import type { NormalizedEvent } from '@/lib/types';

interface EventDetailsPanelProps {
  event: NormalizedEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailsPanel({ event, isOpen, onClose }: EventDetailsPanelProps) {
  if (!event || !isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return {
        full: date.toLocaleString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }),
        short: date.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      };
    } catch {
      return null;
    }
  };

  const dateInfo = formatDate(event.startsAt);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ticketmaster': return '🎫';
      case 'serpapi': return '🔍';
      default: return '📅';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'ticketmaster': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'serpapi': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="relative h-full flex flex-col">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Event Image Placeholder */}
            <div className="h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl">🎵</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSourceColor(event.source)}`}>
                  <span className="mr-1">{getSourceIcon(event.source)}</span>
                  {event.source === 'ticketmaster' ? 'Ticketmaster' : 'Google Events'}
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="p-6">
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                {event.title}
              </h1>

              {/* Date & Time */}
              {dateInfo && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-600 mr-2">📅</span>
                    <span className="text-sm font-medium text-blue-800">Date & Time</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{dateInfo.full}</p>
                </div>
              )}

              {/* Venue */}
              {event.venue && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center mb-2">
                    <span className="text-emerald-600 mr-2">📍</span>
                    <span className="text-sm font-medium text-emerald-800">Venue</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{event.venue}</p>
                  {event.city && (
                    <p className="text-sm text-gray-600 mt-1">{event.city}</p>
                  )}
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">📝</span>
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{event.description}</p>
                </div>
              )}

              {/* Location Coordinates */}
              {event.lat && event.lng && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 mr-2">🗺️</span>
                    <span className="text-sm font-medium text-gray-700">Location</span>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">
                    {event.lat.toFixed(6)}, {event.lng.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                  >
                    <span className="mr-2">🎫</span>
                    Get Tickets / View Details
                  </a>
                )}
                
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-2xl hover:bg-gray-200 transition-all duration-300 font-medium text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
