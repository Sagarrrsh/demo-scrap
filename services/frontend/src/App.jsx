import { useState, useEffect } from 'react';
import { Recycle, TrendingUp, Package, LogOut, DollarSign, Clock, CheckCircle, MapPin, AlertCircle, Loader2, User, Edit, History, X, Menu } from 'lucide-react';

const API_BASE = '/api';

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

const LoginPage = ({ loginForm, setLoginForm, handleLogin, loading, error, setCurrentPage, setError }) => {
  const handleInputChange = (field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Recycle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              id="login-email"
              type="email"
              value={loginForm.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              id="login-password"
              type="password"
              value={loginForm.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => { setCurrentPage('register'); setError(null); }}
            className="text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Don't have an account? Sign up
          </button>
          <div>
            <button
              onClick={() => { setCurrentPage('home'); setError(null); }}
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisterPage = ({ registerForm, setRegisterForm, handleRegister, loading, error, setCurrentPage, setError }) => {
  const handleInputChange = (field, value) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Recycle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-600 mt-2">Start recycling today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              id="register-name"
              type="text"
              value={registerForm.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              id="register-email"
              type="email"
              value={registerForm.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              id="register-password"
              type="password"
              value={registerForm.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
              placeholder="••••••••"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => { setCurrentPage('login'); setError(null); }}
            className="text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Already have an account? Sign in
          </button>
          <div>
            <button
              onClick={() => { setCurrentPage('home'); setError(null); }}
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navigation = ({ user, currentPage, setCurrentPage, handleLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', page: 'dashboard' },
    { name: 'Prices', page: 'pricing' },
    { name: 'My Requests', page: 'requests' },
    { name: 'Profile', page: 'profile' }
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Recycle className="w-8 h-8 text-green-600" />
            <span className="text-xl font-bold text-gray-800">Scrapzee</span>
          </div>

          <div className="hidden md:flex space-x-8">
            {navItems.map(item => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={`font-medium transition-colors ${currentPage === item.page ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                  }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-700 hidden sm:block truncate max-w-xs">
              {user?.full_name || user?.email}
            </span>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Logout">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.page}
                onClick={() => { setCurrentPage(item.page); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === item.page ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

const DashboardPage = ({ user, dashboard, dashboardLoading, setCurrentPage, handleLogout }) => (
  <div className="min-h-screen bg-gray-50">
    <Navigation user={user} currentPage="dashboard" setCurrentPage={setCurrentPage} handleLogout={handleLogout} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {dashboardLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-green-600" />
        </div>
      ) : dashboard ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Requests', value: dashboard.stats.total_requests, icon: Package, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
              { label: 'Pending', value: dashboard.stats.pending_requests, icon: Clock, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
              { label: 'Completed', value: dashboard.stats.completed_requests, icon: CheckCircle, bgColor: 'bg-green-100', textColor: 'text-green-600' },
              { label: 'Total Earnings', value: `₹${dashboard.stats.total_earnings}`, icon: DollarSign, bgColor: 'bg-purple-100', textColor: 'text-purple-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className={`${stat.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Requests</h2>
            {dashboard.recent_requests?.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recent_requests.map(req => (
                  <div key={req.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border-2 border-gray-100 rounded-xl hover:border-green-200 hover:shadow-md transition-all duration-300 gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">Request #{req.id}</p>
                      <p className="text-sm text-gray-600">{new Date(req.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                      <p className="font-bold text-green-600">₹{req.estimated_price}</p>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${req.status === 'completed' ? 'bg-green-100 text-green-700' :
                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            req.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                        }`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">No requests yet</p>
                <button onClick={() => setCurrentPage('pricing')} className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  View Pricing & Create Request
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500">Unable to load dashboard data</p>
        </div>
      )}
    </div>
  </div>
);

const ProfilePage = ({ user, token, setCurrentPage, handleLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profileForm, setProfileForm] = useState({ address: '', city: '', pincode: '', bio: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.profile) {
          setProfileForm({
            address: data.profile.address || '',
            city: data.profile.city || '',
            pincode: data.profile.pincode || '',
            bio: data.profile.bio || ''
          });
        }
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });

      if (res.ok) {
        setSuccess('Profile updated successfully!');
        setEditing(false);
        await fetchProfile();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} currentPage="profile" setCurrentPage={setCurrentPage} handleLogout={handleLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-gray-800">My Profile</h1>
          {!editing && (
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-800">{profile?.user?.full_name || 'User'}</h2>
                <p className="text-gray-600">{profile?.user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {profile?.user?.role || 'user'}
                </span>
              </div>
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none resize-none"
                    placeholder="Enter your full address"
                    disabled={saving}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                      placeholder="City"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={profileForm.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                      placeholder="Pincode"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none resize-none"
                    placeholder="Tell us about yourself"
                    disabled={saving}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setError(null);
                      if (profile?.profile) {
                        setProfileForm({
                          address: profile.profile.address || '',
                          city: profile.profile.city || '',
                          pincode: profile.profile.pincode || '',
                          bio: profile.profile.bio || ''
                        });
                      }
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <p className="text-gray-800">{profile?.profile?.address || 'Not provided'}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
                    <p className="text-gray-800">{profile?.profile?.city || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Pincode</label>
                    <p className="text-gray-800">{profile?.profile?.pincode || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
                  <p className="text-gray-800">{profile?.profile?.bio || 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MyRequestsPage = ({ token, setCurrentPage, handleLogout, user, categories }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? `${API_BASE}/users/requests` : `${API_BASE}/users/requests?status=${filter}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId) => {
    try {
      const res = await fetch(`${API_BASE}/users/requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data);
        setShowDetails(true);
      }
    } catch (err) {
      console.error('Failed to fetch request details', err);
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/users/requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled', notes: 'Cancelled by user' })
      });
      if (res.ok) {
        setShowDetails(false);
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Failed to cancel request', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : `Category ${categoryId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} currentPage="requests" setCurrentPage={setCurrentPage} handleLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-gray-800">My Requests</h1>
          <button onClick={() => setCurrentPage('pricing')} className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            Create New Request
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${filter === status ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          </div>
        ) : requests.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(req => (
              <div key={req.id} onClick={() => fetchRequestDetails(req.id)} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Request #{req.id}</h3>
                    <p className="text-sm text-gray-600">{getCategoryName(req.category_id)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.status === 'completed' ? 'bg-green-100 text-green-700' :
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        req.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium text-gray-800">{req.quantity} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Price:</span>
                    <span className="font-bold text-green-600">₹{req.estimated_price}</span>
                  </div>
                  {req.pickup_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pickup Date:</span>
                      <span className="font-medium text-gray-800">{new Date(req.pickup_date).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                  Created: {new Date(req.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">No {filter !== 'all' && `${filter} `}requests found</p>
            <button onClick={() => setCurrentPage('pricing')} className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              Create Your First Request
            </button>
          </div>
        )}
      </div>

      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Request Details</h2>
                <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">Request #{selectedRequest.id}</h3>
                      <p className="text-gray-600">{getCategoryName(selectedRequest.category_id)}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${selectedRequest.status === 'completed' ? 'bg-green-100 text-green-700' :
                        selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          selectedRequest.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Quantity</label>
                    <p className="text-gray-800 font-semibold">{selectedRequest.quantity} kg</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Estimated Price</label>
                    <p className="text-green-600 font-bold text-xl">₹{selectedRequest.estimated_price}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Pickup Address</label>
                  <p className="text-gray-800">{selectedRequest.pickup_address}</p>
                </div>
                {selectedRequest.pickup_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Pickup Date</label>
                    <p className="text-gray-800">{new Date(selectedRequest.pickup_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
                {selectedRequest.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                    <p className="text-gray-800">{selectedRequest.notes}</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                    <p className="text-gray-800 text-sm">{new Date(selectedRequest.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  {selectedRequest.assigned_dealer_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Assigned Dealer</label>
                      <p className="text-gray-800">Dealer #{selectedRequest.assigned_dealer_id}</p>
                    </div>
                  )}
                </div>
                {selectedRequest.status === 'pending' && (
                  <button onClick={handleCancelRequest} disabled={updatingStatus} className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {updatingStatus ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Cancelling...</span>
                      </>
                    ) : 'Cancel Request'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PricingPage = ({ user, categories, categoriesLoading, setCurrentPage, token, onRequestCreated, handleLogout }) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [requestForm, setRequestForm] = useState({ category_id: '', quantity: '', address: '', pickup_date: '', notes: '' });
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryCategory, setSelectedHistoryCategory] = useState(null);

  const handleCreateRequest = (category) => {
    setSelectedCategory(category);
    setRequestForm({ category_id: category.id, quantity: '', address: '', pickup_date: '', notes: '' });
    setShowRequestModal(true);
    setRequestError(null);
    setRequestSuccess(false);
  };

  const handleRequestInputChange = (field, value) => {
    setRequestForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestError(null);

    try {
      const res = await fetch(`${API_BASE}/users/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          category_id: requestForm.category_id,
          quantity: parseFloat(requestForm.quantity),
          pickup_address: requestForm.address,
          pickup_date: requestForm.pickup_date,
          notes: requestForm.notes
        })
      });

      const data = await res.json();

      if (res.ok) {
        setRequestSuccess(true);
        setTimeout(() => {
          setShowRequestModal(false);
          setRequestSuccess(false);
          setRequestForm({ category_id: '', quantity: '', address: '', pickup_date: '', notes: '' });
          if (onRequestCreated) onRequestCreated();
          setCurrentPage('dashboard');
        }, 2000);
      } else {
        setRequestError(data.error || 'Failed to create request. Please try again.');
      }
    } catch (err) {
      setRequestError('Network error. Please check your connection and try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const fetchPriceHistory = async (category) => {
    setHistoryLoading(true);
    setSelectedHistoryCategory(category);
    try {
      const res = await fetch(`${API_BASE}/pricing/history/${category.id}`);
      if (res.ok) {
        const data = await res.json();
        setPriceHistory(data.history || []);
        setShowPriceHistory(true);
      }
    } catch (err) {
      console.error('Failed to fetch price history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <Navigation user={user} currentPage="pricing" setCurrentPage={setCurrentPage} handleLogout={handleLogout} />
      ) : (
        <div className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Recycle className="w-8 h-8 text-green-600" />
                <span className="text-xl font-bold text-gray-800">Scrapzee</span>
              </div>
              <button onClick={() => setCurrentPage('home')} className="text-gray-500 hover:text-gray-700 transition-colors">
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Current Prices</h1>
        <p className="text-gray-600 mb-8">Updated rates for all scrap categories</p>

        {categoriesLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          </div>
        ) : categories.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                <div className="bg-gradient-to-r from-green-400 to-blue-400 h-32 flex items-center justify-center">
                  <Package className="w-16 h-16 text-white" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{cat.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 min-h-[40px]">{cat.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-3xl font-bold text-green-600">₹{cat.base_price}</p>
                      <p className="text-sm text-gray-500">per {cat.unit}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex gap-2">
                    {user && (
                      <button onClick={() => handleCreateRequest(cat)} className="flex-1 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold shadow hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">
                        Request Pickup
                      </button>
                    )}
                    <button onClick={() => fetchPriceHistory(cat)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="View price history">
                      <History className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No categories available</p>
          </div>
        )}
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowRequestModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Request Pickup</h2>
                <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedCategory && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-bold text-gray-800 mb-1">{selectedCategory.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedCategory.description}</p>
                  <p className="text-lg font-bold text-green-600">₹{selectedCategory.base_price} per {selectedCategory.unit}</p>
                </div>
              )}

              {requestSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Request Created!</h3>
                  <p className="text-gray-600">Redirecting to dashboard...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  {requestError && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{requestError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity ({selectedCategory?.unit})</label>
                    <input
                      type="number"
                      value={requestForm.quantity}
                      onChange={(e) => handleRequestInputChange('quantity', e.target.value)}
                      required
                      min="0.1"
                      step="0.1"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                      placeholder="Enter quantity"
                      disabled={requestLoading}
                    />
                    {requestForm.quantity && selectedCategory && (
                      <p className="text-sm text-gray-600 mt-1">
                        Estimated: ₹{(parseFloat(requestForm.quantity) * selectedCategory.base_price).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address</label>
                    <textarea
                      value={requestForm.address}
                      onChange={(e) => handleRequestInputChange('address', e.target.value)}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none resize-none"
                      placeholder="Enter your full address"
                      disabled={requestLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Pickup Date</label>
                    <input
                      type="date"
                      value={requestForm.pickup_date}
                      onChange={(e) => handleRequestInputChange('pickup_date', e.target.value)}
                      required
                      min={getTomorrowDate()}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                      disabled={requestLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                    <textarea
                      value={requestForm.notes}
                      onChange={(e) => handleRequestInputChange('notes', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none resize-none"
                      placeholder="Any special instructions?"
                      disabled={requestLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={requestLoading}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {requestLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating Request...</span>
                      </>
                    ) : 'Create Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showPriceHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowPriceHistory(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Price History</h2>
                  {selectedHistoryCategory && <p className="text-gray-600">{selectedHistoryCategory.name}</p>}
                </div>
                <button onClick={() => setShowPriceHistory(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {historyLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-green-600" />
                </div>
              ) : priceHistory.length > 0 ? (
                <div className="space-y-4">
                  {priceHistory.map((h, idx) => (
                    <div key={idx} className="p-4 border-2 border-gray-100 rounded-xl hover:border-green-200 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-green-600 text-lg">₹{h.price}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(h.changed_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {h.reason && <p className="text-sm text-gray-600">{h.reason}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No price history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [categories, setCategories] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    const savedToken = localStorage.getItem('scrapzee_token');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchDashboard();
    }
  }, [token, user]);

  const verifyToken = async (tkn) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Token verification failed', err);
      handleLogout();
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pricing/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchDashboard = async () => {
    if (!token) return;
    setDashboardLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('scrapzee_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setCurrentPage('dashboard');
        setLoginForm({ email: '', password: '' });
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          full_name: registerForm.name
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('scrapzee_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setCurrentPage('dashboard');
        setRegisterForm({ name: '', email: '', password: '' });
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('scrapzee_token');
    setToken(null);
    setUser(null);
    setDashboard(null);
    setCurrentPage('home');
    setError(null);
  };

  if (!token) {
    if (currentPage === 'register') {
      return (
        <RegisterPage
          registerForm={registerForm}
          setRegisterForm={setRegisterForm}
          handleRegister={handleRegister}
          loading={loading}
          error={error}
          setCurrentPage={setCurrentPage}
          setError={setError}
        />
      );
    }
    if (currentPage === 'login') {
      return (
        <LoginPage
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          handleLogin={handleLogin}
          loading={loading}
          error={error}
          setCurrentPage={setCurrentPage}
          setError={setError}
        />
      );
    }
    if (currentPage === 'pricing') {
      return (
        <PricingPage
          user={user}
          categories={categories}
          categoriesLoading={categoriesLoading}
          setCurrentPage={setCurrentPage}
          token={token}
          onRequestCreated={fetchDashboard}
          handleLogout={handleLogout}
        />
      );
    }
    return <HomePage setCurrentPage={setCurrentPage} />;
  }

  if (currentPage === 'pricing') {
    return (
      <PricingPage
        user={user}
        categories={categories}
        categoriesLoading={categoriesLoading}
        setCurrentPage={setCurrentPage}
        token={token}
        onRequestCreated={fetchDashboard}
        handleLogout={handleLogout}
      />
    );
  }

  if (currentPage === 'profile') {
    return (
      <ProfilePage
        user={user}
        token={token}
        setCurrentPage={setCurrentPage}
        handleLogout={handleLogout}
      />
    );
  }

  if (currentPage === 'requests') {
    return (
      <MyRequestsPage
        token={token}
        setCurrentPage={setCurrentPage}
        handleLogout={handleLogout}
        user={user}
        categories={categories}
      />
    );
  }

  return (
    <DashboardPage
      user={user}
      dashboard={dashboard}
      dashboardLoading={dashboardLoading}
      setCurrentPage={setCurrentPage}
      handleLogout={handleLogout}
    />
  );
}

export default App;