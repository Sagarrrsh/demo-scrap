import { useState, useEffect } from 'react';
import { Package, Loader2, CheckCircle, AlertCircle, X, MapPin, Calendar, DollarSign, Clock } from 'lucide-react';

const API_BASE = '/api';

const DealerMyRequests = ({ token, categories, onRequestCompleted }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    actual_weight: '',
    actual_price: '',
    notes: ''
  });

  useEffect(() => {
    fetchMyRequests();
  }, [filter]);

  const fetchMyRequests = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const url = filter === 'all' 
        ? `${API_BASE}/dealers/my-requests`
        : `${API_BASE}/dealers/my-requests?status=${filter}`;
      
      const res = await fetch(url, {
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

  const handleCompleteClick = (request) => {
    setSelectedRequest(request);
    setCompleteForm({
      actual_weight: request.quantity || '',
      actual_price: request.estimated_price || '',
      notes: ''
    });
    setShowCompleteModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCompleteRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setCompleting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/dealers/requests/${selectedRequest.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actual_weight: parseFloat(completeForm.actual_weight),
          actual_price: parseFloat(completeForm.actual_price),
          notes: completeForm.notes,
          user_id: selectedRequest.user_id
        })
      });

      if (res.ok) {
        setSuccess('Request completed successfully! 🎉');
        setTimeout(() => {
          setShowCompleteModal(false);
          fetchMyRequests(true);
          if (onRequestCompleted) onRequestCompleted();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to complete request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setCompleting(false);
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
              My Orders
            </h1>
            <p className="text-gray-600">Manage your accepted orders</p>
          </div>
          <button
            onClick={() => fetchMyRequests(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Clock className={`w-4 h-4 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-700">Refresh</span>
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'accepted', 'in_progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === status
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          </div>
        ) : requests.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className={`p-4 text-white ${
                  req.assignment_status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                  req.assignment_status === 'accepted' ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                  'bg-gradient-to-r from-yellow-500 to-orange-500'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">Order #{req.id}</h3>
                      <p className="text-sm opacity-90">{getCategoryName(req.category_id)}</p>
                    </div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                      {req.assignment_status?.replace('_', ' ')}
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
                      <p className="text-xs text-gray-500">Estimated</p>
                      <p className="font-bold text-green-600">₹{req.estimated_price}</p>
                    </div>
                  </div>

                  {req.actual_price && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Actual Paid</p>
                        <p className="font-bold text-purple-600">₹{req.actual_price}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Pickup Location</p>
                      <p className="text-sm text-gray-800 line-clamp-2">{req.pickup_address}</p>
                    </div>
                  </div>

                  {req.pickup_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-pink-600" />
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

                  <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                    Accepted: {new Date(req.accepted_at || req.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>

                  {req.assignment_status === 'accepted' && (
                    <button
                      onClick={() => handleCompleteClick(req)}
                      className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Complete Order
                    </button>
                  )}

                  {req.assignment_status === 'completed' && (
                    <div className="flex items-center justify-center gap-2 text-green-600 py-3 bg-green-50 rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-xl">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No {filter !== 'all' && `${filter} `}Orders</h3>
            <p className="text-gray-500">Accept some requests to see them here</p>
          </div>
        )}

        {/* Complete Modal */}
        {showCompleteModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowCompleteModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Complete Order</h2>
                    <p className="text-sm opacity-90">Order #{selectedRequest.id}</p>
                  </div>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
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

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-bold text-gray-800">{getCategoryName(selectedRequest.category_id)}</p>
                  <p className="text-sm text-gray-600 mt-2">Estimated: ₹{selectedRequest.estimated_price}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Actual Weight (kg)</label>
                  <input
                    type="number"
                    value={completeForm.actual_weight}
                    onChange={(e) => setCompleteForm(prev => ({ ...prev, actual_weight: e.target.value }))}
                    min="0.1"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                    placeholder="Enter actual weight"
                    disabled={completing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Actual Price (₹)</label>
                  <input
                    type="number"
                    value={completeForm.actual_price}
                    onChange={(e) => setCompleteForm(prev => ({ ...prev, actual_price: e.target.value }))}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                    placeholder="Enter actual price"
                    disabled={completing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={completeForm.notes}
                    onChange={(e) => setCompleteForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none resize-none"
                    placeholder="Any additional notes..."
                    disabled={completing}
                  />
                </div>

                <button
                  onClick={handleCompleteRequest}
                  disabled={completing || !completeForm.actual_weight || !completeForm.actual_price}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {completing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Complete Order</span>
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

export default DealerMyRequests;