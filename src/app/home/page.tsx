'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { NormalizedEvent } from '@/lib/types';

export default function HomePage() {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'premium'>('free');
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VibeMap
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/map" className="text-gray-600 hover:text-blue-600 transition-colors">
                Map
              </Link>
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Discover Events
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Near You
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Find the best concerts, shows, and events in your area with AI-powered search.
            From jazz nights to rock concerts, discover what&apos;s happening around you.
          </p>
          <div className="flex flex-col items-center space-y-4">
            <Link
              href="/map"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🗺️ Start Exploring
            </Link>

            {/* Plan Selector */}
            <div className="mt-8">
              <p className="text-sm text-gray-500 mb-3">Choose your plan to get started:</p>
              <div className="flex space-x-2">
                {[
                  { value: 'free' as const, label: 'Free (5mi)', color: 'bg-gray-100 text-gray-700' },
                  { value: 'pro' as const, label: 'Pro (25mi)', color: 'bg-blue-100 text-blue-700' },
                  { value: 'premium' as const, label: 'Premium (∞)', color: 'bg-purple-100 text-purple-700' }
                ].map((planOption) => (
                  <button
                    key={planOption.value}
                    onClick={() => setSelectedPlan(planOption.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      selectedPlan === planOption.value
                        ? `${planOption.color} ring-2 ring-offset-2 ring-blue-500`
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {planOption.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose VibeMap?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Search</h3>
              <p className="text-gray-600">
                Use natural language to find events. Search for &ldquo;jazz tonight&rdquo; or &ldquo;rock concerts this weekend&rdquo;
                and let our AI understand exactly what you&apos;re looking for.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗺️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Interactive Map</h3>
              <p className="text-gray-600">
                See events plotted on an interactive map with real-time location data.
                Click on markers to get event details and ticket information.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎫</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Source Events</h3>
              <p className="text-gray-600">
                Get events from multiple sources including Ticketmaster and Google Events.
                Never miss out on what&apos;s happening in your area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select the perfect plan for your event discovery needs. Start free and upgrade anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 ${
              selectedPlan === 'free' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <p className="text-gray-600">Perfect for casual event discovery</p>
              </div>
              <div className="mb-8 text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Forever free</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">5-mile search radius</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">AI-powered search</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Interactive map with clusters</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Up to 50 events per search</span>
                </li>
                <li className="flex items-center">
                  <span className="text-red-400 mr-3 text-lg">✗</span>
                  <span className="text-gray-400">Advanced filters</span>
                </li>
              </ul>
              <button
                onClick={() => setSelectedPlan('free')}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  selectedPlan === 'free'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className={`bg-white rounded-2xl p-8 shadow-xl border-2 relative transform transition-all duration-300 ${
              selectedPlan === 'pro' ? 'border-blue-500 ring-2 ring-blue-200 scale-105' : 'border-blue-500'
            }`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <p className="text-gray-600">For serious event enthusiasts</p>
              </div>
              <div className="mb-8 text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">$9.99</div>
                <p className="text-gray-600">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">25-mile search radius</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Advanced AI search & filters</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Real-time event updates</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Up to 200 events per search</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Personalized recommendations</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              <button
                onClick={() => setSelectedPlan('pro')}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  selectedPlan === 'pro'
                    ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow-lg'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                Start Pro Trial
              </button>
            </div>

            {/* Premium Plan */}
            <div className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 ${
              selectedPlan === 'premium' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
            }`}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <p className="text-gray-600">For event professionals</p>
              </div>
              <div className="mb-8 text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">$19.99</div>
                <p className="text-gray-600">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Unlimited search radius</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">All Pro features</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Full API access</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Unlimited events per search</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">White-label solution</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  <span className="text-gray-700">Custom integrations</span>
                </li>
              </ul>
              <button
                onClick={() => setSelectedPlan('premium')}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  selectedPlan === 'premium'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Search</h3>
              <p className="text-gray-600">
                Type what you&apos;re looking for in natural language
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Processing</h3>
              <p className="text-gray-600">
                Our AI understands your intent and location
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Discover</h3>
              <p className="text-gray-600">
                Find events from multiple sources in your area
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-orange-600">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2">Explore</h3>
              <p className="text-gray-600">
                View events on the map and get ticket information
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Events Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Upcoming Events
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                id: 'sample-event-1',
                title: 'Summer Jazz Festival',
                venue: 'Central Park Amphitheater',
                startsAt: '2024-07-15T19:00:00Z',
                description: 'An evening of smooth jazz featuring top local and international artists.',
                url: 'https://example.com/jazz-festival',
                source: 'ticketmaster' as const,
                lat: 40.7829,
                lng: -73.9654
              },
              {
                id: 'sample-event-2',
                title: 'Rock the Night Concert',
                venue: 'Stadium Arena',
                startsAt: '2024-08-22T20:30:00Z',
                description: 'An epic night of rock music with legendary bands and emerging talents.',
                url: 'https://example.com/rock-concert',
                source: 'serpapi' as const,
                lat: 40.7589,
                lng: -73.9851
              },
              {
                id: 'sample-event-3',
                title: 'Comedy Extravaganza',
                venue: 'City Comedy Club',
                startsAt: '2024-06-10T21:00:00Z',
                description: 'A night of non-stop laughter with top stand-up comedians from around the country.',
                url: 'https://example.com/comedy-show',
                source: 'serpapi' as const,
                lat: 40.7484,
                lng: -73.9857
              }
            ].map((event) => (
              <div 
                key={event.id} 
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => {
                  setSelectedEvent(event);
                  setIsSidePanelOpen(true);
                }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-2 flex items-center">
                  <span className="mr-2">📍</span>
                  {event.venue}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(event.startsAt).toLocaleString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Discover Amazing Events?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who are already finding the best events in their area.
          </p>
          <Link
            href="/map"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg"
          >
            🚀 Start Your Journey
          </Link>
        </div>
      </section>

      {/* Side Panel */}
      {isSidePanelOpen && selectedEvent && (
        <div className="fixed top-0 right-0 w-1/3 h-full bg-white shadow-2xl z-50 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
            <button
              onClick={() => {
                setIsSidePanelOpen(false);
                setSelectedEvent(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {selectedEvent.title}
              </h4>
              {selectedEvent.venue && (
                <p className="text-gray-600 flex items-center">
                  <span className="mr-2">📍</span>
                  {selectedEvent.venue}
                </p>
              )}
            </div>

            {selectedEvent.startsAt && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                <p className="text-gray-900">
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

            {selectedEvent.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{selectedEvent.description}</p>
              </div>
            )}

            {selectedEvent.url && (
              <div className="pt-4">
                <a
                  href={selectedEvent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                >
                  View Event Details →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">VibeMap</h3>
              <p className="text-gray-400">
                Discover the best events in your area with AI-powered search.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>AI-Powered Search</li>
                <li>Interactive Map</li>
                <li>Multi-Source Events</li>
                <li>Real-time Updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Plans</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Free Plan</li>
                <li>Pro Plan</li>
                <li>Premium Plan</li>
                <li>Enterprise</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>API Documentation</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VibeMap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
