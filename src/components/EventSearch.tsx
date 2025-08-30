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
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          city: userCity,
          country: userCountry || 'US',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      onEventsFound(data.events || []);
    } catch (err) {
      console.error('Event search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to search events';
      
      // Provide more helpful error messages
      if (errorMessage.includes('GROQ_API_KEY not set') || errorMessage.includes('TICKETMASTER_API_KEY not set')) {
        setError('API keys not configured. Please check your .env.local file.');
      } else if (errorMessage.includes('HTTP error! status: 500')) {
        setError('Server error. Please try again or check your API configuration.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchEvents();
  };

  const suggestions = [
    { text: "jazz tonight", icon: "🎷" },
    { text: "rock concerts this weekend", icon: "🎸" },
    { text: "comedy shows tomorrow", icon: "😂" },
    { text: "live music near me", icon: "🎵" }
  ];

  return (
    <div className="fixed top-6 left-6 z-[9999] w-96">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🎵</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Search Events
          </h1>
          <p className="text-gray-500 text-sm mt-1">Discover amazing events near you</p>
        </div>

        {/* Location Badge */}
        {(userCity || userCountry) && (
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-full">
              <span className="text-emerald-600 mr-2">📍</span>
              <span className="text-sm font-medium text-gray-700">
                {userCity || "your location"}{userCountry ? `, ${userCountry}` : ""}
              </span>
            </div>
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What kind of events are you looking for?"
                className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-base transition-all duration-300 placeholder-gray-400"
                disabled={loading}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-4 px-6 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Searching...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2">🎵</span>
                Search Events
              </div>
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">💡</span>
            Try searching for:
          </h3>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggestion.text)}
                className="w-full text-left p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 border border-gray-200 hover:border-blue-300 rounded-2xl transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <span className="text-xl mr-3 group-hover:scale-110 transition-transform duration-300">
                    {suggestion.icon}
                  </span>
                  <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors duration-300">
                    &ldquo;{suggestion.text}&rdquo;
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <span className="mr-2">✨</span>
            Powered by AI & Real-time Data
          </div>
        </div>
      </div>
    </div>
  );
}
