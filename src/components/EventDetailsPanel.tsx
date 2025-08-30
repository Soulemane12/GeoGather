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
      <div className={`fixed right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-l border-gray-200/50 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="relative h-full flex flex-col">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Event Image Placeholder */}
            <div className="h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🎵</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(event.source)}`}>
                  <span className="mr-1">{getSourceIcon(event.source)}</span>
                  {event.source === 'ticketmaster' ? 'Ticketmaster' : 'Google Events'}
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="p-4">
              {/* Title */}
              <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                {event.title}
              </h1>

              {/* Date & Time */}
              {dateInfo && (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <div className="flex items-center mb-1">
                    <span className="text-blue-600 mr-2">📅</span>
                    <span className="text-xs font-medium text-blue-800">Date & Time</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{dateInfo.short}</p>
                </div>
              )}

              {/* Venue */}
              {event.venue && (
                <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center mb-1">
                    <span className="text-emerald-600 mr-2">📍</span>
                    <span className="text-xs font-medium text-emerald-800">Venue</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{event.venue}</p>
                  {event.city && (
                    <p className="text-xs text-gray-600 mt-1">{event.city}</p>
                  )}
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                    <span className="mr-2">📝</span>
                    Description
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{event.description}</p>
                </div>
              )}

              {/* Location Coordinates */}
              {event.lat && event.lng && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center mb-1">
                    <span className="text-gray-600 mr-2">🗺️</span>
                    <span className="text-xs font-medium text-gray-700">Location</span>
                  </div>
                  <p className="text-xs text-gray-600 font-mono">
                    {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                  >
                    <span className="mr-2">🎫</span>
                    Get Tickets
                  </a>
                )}
                
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium text-sm text-center"
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
