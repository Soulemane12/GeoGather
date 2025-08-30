'use client';

import { useState } from 'react';
import type { NormalizedEvent } from '@/lib/types';

interface EventSearchProps {
  onEventsFound: (events: NormalizedEvent[]) => void;
  userCity?: string;
  userCountry?: string;
}

export default function EventSearch({ onEventsFound, userCity, userCountry }: EventSearchProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchEvents = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          city: userCity,
          country: userCountry || 'US',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onEventsFound(data.events || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to search events';
      if (msg.includes('GROQ_API_KEY not set') || msg.includes('TICKETMASTER_API_KEY not set')) {
        setError('API keys not configured. Please check your .env.local file.');
      } else if (msg.includes('HTTP error! status: 500')) {
        setError('Server error. Please try again or check your API configuration.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void searchEvents();
  };

  const suggestions = [
    { text: 'jazz tonight', icon: '🎷' },
    { text: 'rock concerts this weekend', icon: '🎸' },
    { text: 'comedy shows tomorrow', icon: '😂' },
    { text: 'live music near me', icon: '🎵' },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-md bg-gradient-to-br from-blue-600 to-purple-600">
          <span className="text-2xl text-white">🎵</span>
        </div>
        <h1 className="text-xl font-extrabold text-gray-900">Search Events</h1>
        <p className="text-gray-500 text-sm mt-1">Discover great things happening around you</p>
      </div>

      {/* Location Badge */}
      {(userCity || userCountry) && (
        <div className="flex items-center justify-center mb-5">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 to-blue-50">
            <span className="text-emerald-600 mr-2">📍</span>
            <span className="text-sm font-medium text-gray-700">
              {userCity || 'your location'}{userCountry ? `, ${userCountry}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What kind of events are you looking for?"
            className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 text-base placeholder-gray-400"
            disabled={loading}
          />
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-3.5 px-6 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Searching...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="mr-2">🎫</span>
              Search Events
            </div>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-700 text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="mt-7">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Try searching for:
        </h3>
        <div className="grid grid-cols-1 gap-2.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPrompt(s.text)}
              className="text-left p-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <span className="text-xl mr-3 group-hover:scale-110 transition-transform duration-200">{s.icon}</span>
                <span className="text-gray-800 font-medium group-hover:text-blue-700 transition-colors duration-200">
                  “{s.text}”
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-gray-200">
        <div className="flex items-center justify-center text-xs text-gray-500">
          <span className="mr-2">✨</span>
          Powered by AI & Real-time Data
        </div>
      </div>
    </div>
  );
}
