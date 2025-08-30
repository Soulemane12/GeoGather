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

    return (
    <div className="fixed top-24 left-6 z-[9999] bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
            🔍 Search Events
          </label>
          <input
            id="search"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="jazz tonight, rock concerts..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white/80 backdrop-blur-sm"
            disabled={loading}
          />
        </div>

        {(userCity || userCountry) && (
          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            📍 {userCity || "your location"}{userCountry ? `, ${userCountry}` : ""}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-base shadow-lg"
        >
          {loading ? '🔍 Searching...' : '🎵 Search Events'}
        </button>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            ⚠️ {error}
          </div>
        )}
      </form>

      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-2">💡 Try searching for:</p>
        <ul className="space-y-1">
          <li>• &ldquo;jazz tonight&rdquo;</li>
          <li>• &ldquo;rock concerts this weekend&rdquo;</li>
          <li>• &ldquo;comedy shows tomorrow&rdquo;</li>
          <li>• &ldquo;live music near me&rdquo;</li>
        </ul>
      </div>
    </div>
  );
}
