'use client';

import Link from 'next/link';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="bg-black/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-gray-800 bg-clip-text text-transparent">
                VibeMap
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-300 hover:text-orange-500 transition-colors">
                Home
              </Link>
              <Link href="/map" className="text-gray-300 hover:text-orange-500 transition-colors">
                Map
              </Link>
              <Link href="/pricing" className="text-gray-300 hover:text-orange-500 transition-colors">
                Pricing
              </Link>
              <Link href="/billing" className="text-gray-300 hover:text-orange-500 transition-colors">
                Billing
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
            <span className="block bg-gradient-to-r from-orange-500 to-gray-800 bg-clip-text text-transparent">
              Near You
            </span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Find the best concerts, shows, and events in your area with AI-powered search.
            From jazz nights to rock concerts, discover what&apos;s happening around you.
          </p>
          <div className="flex flex-col items-center space-y-4">
            <Link
              href="/map"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-gray-800 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-black transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🗺️ Start Exploring
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-6 py-3 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all duration-200"
            >
              View Pricing Plans →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose VibeMap?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-md">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-orange-600">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">AI-Powered Search</h3>
              <p className="text-gray-700">
                Use natural language to find events. Search for &ldquo;jazz tonight&rdquo; or &ldquo;rock concerts this weekend&rdquo;
                and let our AI understand exactly what you&apos;re looking for.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-700">🗺️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Interactive Map</h3>
              <p className="text-gray-700">
                See events plotted on an interactive map with real-time location data.
                Click on markers to get event details and ticket information.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-md">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-orange-600">🎫</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Multi-Source Events</h3>
              <p className="text-gray-700">
                Get events from multiple sources including Ticketmaster and Google Events.
                Never miss out on what&apos;s happening in your area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Select the perfect plan for your event discovery needs. Start free and upgrade anytime.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-gray-800 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-black transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View All Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center bg-white rounded-2xl p-6 shadow-md">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-orange-600">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Search</h3>
              <p className="text-gray-700">
                Type what you&apos;re looking for in natural language
              </p>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-700">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">AI Processing</h3>
              <p className="text-gray-700">
                Our AI understands your intent and location
              </p>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-md">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-orange-600">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Discover</h3>
              <p className="text-gray-700">
                Find events from multiple sources in your area
              </p>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-gray-700">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Explore</h3>
              <p className="text-gray-700">
                View events on the map and get ticket information
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Discover Amazing Events?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of users who are already finding the best events in their area.
          </p>
          <Link
            href="/map"
            className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg"
          >
            🚀 Start Your Journey
          </Link>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-orange-500">VibeMap</h3>
              <p className="text-gray-400">
                Discover the best events in your area with AI-powered search.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">Features</h4>
              <ul className="space-y-2 text-gray-500">
                <li>AI-Powered Search</li>
                <li>Interactive Map</li>
                <li>Multi-Source Events</li>
                <li>Real-time Updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">Plans</h4>
              <ul className="space-y-2 text-gray-500">
                <li>Free Plan</li>
                <li>Pro Plan</li>
                <li>Premium Plan</li>
                <li>Enterprise</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-300">Support</h4>
              <ul className="space-y-2 text-gray-500">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>API Documentation</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2024 VibeMap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
