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
      {/* Backdrop (slightly dark, panel itself is solid) */}
      <div
        className="fixed inset-0 bg-black/40 z-[48] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full w-[380px] bg-white z-[50] shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="relative h-full flex flex-col">

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 hover:scale-110 transition-all duration-200 border border-gray-200"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Hero header (solid, colorful) */}
          <div className="h-36 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl drop-shadow-sm">🎵</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(event.source)}`}>
                <span className="mr-1">{getSourceIcon(event.source)}</span>
                {event.source === 'ticketmaster' ? 'Ticketmaster' : 'Google Search'}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 leading-snug">
              {event.title}
            </h1>

            {/* Date */}
            {dateInfo && (
              <div className="p-3 rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                  <span>📅</span> <span>Date &amp; Time</span>
                </div>
                <p className="text-gray-900 font-semibold">{dateInfo.short}</p>
              </div>
            )}

            {/* Venue */}
            {(event.venue || event.city) && (
              <div className="p-3 rounded-xl border bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-1">
                  <span>📍</span> <span>Venue</span>
                </div>
                {event.venue && <p className="text-gray-900 font-semibold">{event.venue}</p>}
                {event.city && <p className="text-xs text-gray-600 mt-1">{event.city}</p>}
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <span>📝</span><span>Description</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t bg-white">
            <div className="space-y-2">
              {event.url && (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                >
                  <span className="mr-2">🎫</span>
                  Get Tickets
                </a>
              )}
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-800 py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium text-sm text-center"
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
