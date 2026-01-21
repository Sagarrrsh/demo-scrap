import { useState, useEffect } from 'react';
import { Package, DollarSign, Clock, CheckCircle, TrendingUp, Loader2, AlertCircle, MapPin, Calendar, X, RefreshCw, ArrowRight, Award, Target } from 'lucide-react';

const API_BASE = '/api';

// Modern Dealer Dashboard Component
const DealerDashboard = ({ user, token, setCurrentPage }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const res = await fetch(`${API_BASE}/dealers/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboard(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Unable to load dashboard</p>
          <button 
            onClick={() => fetchDashboard()} 
            className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome Back! 👋
            </h1>
            <p className="text-gray-600">{user?.full_name}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700">Refresh</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
            <Package className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">Total Orders</p>
            <p className="text-3xl font-bold">{dashboard.stats.total_requests}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
            <Clock className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">Accepted</p>
            <p className="text-3xl font-bold">{dashboard.stats.accepted_requests}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
            <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">Completed</p>
            <p className="text-3xl font-bold">{dashboard.stats.completed_requests}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
            <DollarSign className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">Earnings</p>
            <p className="text-3xl font-bold">₹{dashboard.stats.total_earnings.toFixed(0)}</p>
          </div>
        </div>

        {/* Performance Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-7 h-7 text-yellow-500" />
              Your Performance
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Pickups</p>
                  <p className="text-4xl font-bold text-gray-800">{dashboard.stats.total_pickups}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Your Rating</p>
                  <p className="text-4xl font-bold text-gray-800">{dashboard.stats.rating.toFixed(1)} ⭐</p>
                </div>
                <Target className="w-12 h-12 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Transactions</h2>
          {dashboard.recent_transactions?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recent_transactions.slice(0, 5).map(txn => (
                <div key={txn.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Request #{txn.request_id}</p>
                      <p className="text-sm text-gray-500">{new Date(txn.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-600">₹{txn.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-2">Complete orders to see your earnings here</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => setCurrentPage('dealer-available')}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all text-white"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <Package className="w-10 h-10 mb-4" />
            <p className="font-bold text-xl mb-2">Available Orders</p>
            <p className="text-sm opacity-90 mb-4">Find new pickup requests</p>
            <div className="flex items-center gap-2 text-sm font-medium">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => setCurrentPage('dealer-requests')}
            className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all text-white"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <Clock className="w-10 h-10 mb-4" />
            <p className="font-bold text-xl mb-2">My Orders</p>
            <p className="text-sm opacity-90 mb-4">Manage accepted orders</p>
            <div className="flex items-center gap-2 text-sm font-medium">
              Manage <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => setCurrentPage('dealer-transactions')}
            className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all text-white"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <DollarSign className="w-10 h-10 mb-4" />
            <p className="font-bold text-xl mb-2">Earnings</p>
            <p className="text-sm opacity-90 mb-4">View transaction history</p>
            <div className="flex items-center gap-2 text-sm font-medium">
              View History <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Modern Available Requests Component
const DealerAvailableRequests = ({ token, categories, onRequestAccepted }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAvailableRequests();
  }, []);

  const fetchAvailableRequests = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (requests.length === 0) {
      setLoading(true);
    }
    
    try {
      const res = await fetch(`${API_BASE}/dealers/available-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetails(true);
    setError(null);
    setSuccess(null);
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/dealers/requests/${selectedRequest.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSuccess('Order accepted successfully! 🎉');
        setTimeout(() => {
          setShowDetails(false);
          fetchAvailableRequests(true);
          if (onRequestAccepted) onRequestAccepted();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to accept order');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : `Category ${categoryId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Available Orders
            </h1>
            <p className="text-gray-600">Browse and accept new pickup requests</p>
          </div>
          <button
            onClick={() => fetchAvailableRequests(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700">Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading available orders...</p>
            </div>
          </div>
        ) : requests.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">Order #{req.id}</h3>
                      <p className="text-sm opacity-90">{getCategoryName(req.category_id)}</p>
                    </div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                      New
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="font-bold text-gray-800">{req.quantity} kg</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estimated Amount</p>
                      <p className="text-xl font-bold text-green-600">₹{req.estimated_price}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Pickup Location</p>
                      <p className="text-sm text-gray-800 line-clamp-2">{req.pickup_address}</p>
                    </div>
                  </div>

                  {req.pickup_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pickup Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(req.pickup_date).toLocaleDateString('en-IN', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleViewDetails(req)}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    View Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-xl">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Orders Available</h3>
            <p className="text-gray-500 mb-6">Check back later for new pickup requests</p>
            <button
              onClick={() => fetchAvailableRequests(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Refresh Orders
            </button>
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowDetails(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Order Details</h2>
                    <p className="text-sm opacity-90">Order #{selectedRequest.id}</p>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="text-xl font-bold text-gray-800">{getCategoryName(selectedRequest.category_id)}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Quantity</p>
                    <p className="text-2xl font-bold text-gray-800">{selectedRequest.quantity} kg</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Estimated Amount</p>
                    <p className="text-2xl font-bold text-green-600">₹{selectedRequest.estimated_price}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Pickup Address</p>
                  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <p className="text-gray-800">{selectedRequest.pickup_address}</p>
                  </div>
                </div>

                {selectedRequest.pickup_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Preferred Pickup Date</p>
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                      <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <p className="text-gray-800 font-semibold">
                        {new Date(selectedRequest.pickup_date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRequest.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Additional Notes</p>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-800">{selectedRequest.notes}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAcceptRequest}
                  disabled={accepting}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Accepting Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Accept This Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export wrapper component for demo
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [token] = useState('demo_token');
  const [user] = useState({ full_name: 'John Dealer', role: 'dealer' });
  const categories = [
    { id: 1, name: 'Paper' },
    { id: 2, name: 'Plastic' },
    { id: 3, name: 'Metal' }
  ];

  // Mock dashboard data
  const mockDashboard = {
    stats: {
      total_requests: 48,
      accepted_requests: 12,
      completed_requests: 36,
      total_earnings: 15420,
      total_pickups: 42,
      rating: 4.8
    },
    recent_transactions: [
      { id: 1, request_id: 145, amount: 450, created_at: new Date().toISOString() },
      { id: 2, request_id: 142, amount: 320, created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, request_id: 138, amount: 580, created_at: new Date(Date.now() - 172800000).toISOString() }
    ]
  };

  return (
    <div>
      {currentPage === 'dashboard' && (
        <DealerDashboard 
          user={user} 
          token={token} 
          setCurrentPage={setCurrentPage}
        />
      )}
      {currentPage === 'dealer-available' && (
        <DealerAvailableRequests
          token={token}
          categories={categories}
          onRequestAccepted={() => console.log('Request accepted')}
        />
      )}
    </div>
  );
}

export default App;