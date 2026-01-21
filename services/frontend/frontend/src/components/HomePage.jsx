import { Recycle, DollarSign, MapPin, Clock } from 'lucide-react';

const HomePage = ({ setCurrentPage }) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 backdrop-blur-3xl"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-2xl shadow-2xl animate-pulse">
              <Recycle className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Scrapzee
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Turn your waste into wealth. The smart way to recycle.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => setCurrentPage('login')}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Get Started
            </button>
            <button
              onClick={() => setCurrentPage('pricing')}
              className="px-8 py-4 bg-white text-green-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-green-200"
            >
              View Prices
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: DollarSign, title: 'Best Prices', desc: 'Get competitive rates for your scrap materials with transparent pricing', color: 'from-green-400 to-green-500' },
          { icon: MapPin, title: 'Doorstep Pickup', desc: 'Convenient collection service from your location at your preferred time', color: 'from-blue-400 to-blue-500' },
          { icon: Clock, title: 'Quick Service', desc: 'Fast processing and instant payment confirmation within 24 hours', color: 'from-purple-400 to-purple-500' }
        ].map((feat, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <div className={`bg-gradient-to-r ${feat.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
              <feat.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{feat.title}</h3>
            <p className="text-gray-600">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default HomePage;