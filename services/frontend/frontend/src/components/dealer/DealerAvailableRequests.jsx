import { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

const API_BASE = '/api';

const DealerAvailableRequests = ({ token, categories, onRequestAccepted }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAvailableRequests();
    const interval = setInterval(fetchAvailableRequests, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableRequests = async () => {
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
        setSuccess('Request accepted successfully!');
        setTimeout(() => {
          setShowDetails(false);
          fetchAvailableRequests();
          if (onRequestAccepted) onRequestAccepted();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to accept request');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Available Requests</h1>
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-green-600" />
        </div>
      ) : requests.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1" onClick={() => handleViewDetails(req)}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Request #{req.id}</h3>
                  <p className="text-sm text-gray-600">{getCategoryName(req.category_id)}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">New</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="font-semibold text-gray-800">{req.quantity} kg</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-800">{req.pickup_address.substring(0, 50)}...</p>
                  </div>
                </div>
                {req.pickup_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Pickup Date</p>
                      <p className="font-semibold text-gray-800">{new Date(req.pickup_date).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-lg font-bold text-green-600">₹{req.estimated_price}</p>
                  <p className="text-xs text-gray-500">Estimated Amount</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleViewDetails(req); }} className="w-full mt-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                View Details
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No available requests at the moment</p>
          <p className="text-sm text-gray-400 mt-2">Check back later for new pickup requests</p>
        </div>
      )}

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
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 text-lg">Request #{selectedRequest.id}</h3>
                  <p className="text-gray-600">{getCategoryName(selectedRequest.category_id)}</p>
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
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                  <p className="text-gray-800 text-sm">{new Date(selectedRequest.created_at).toLocaleString('en-IN')}</p>
                </div>
                <button onClick={handleAcceptRequest} disabled={accepting} className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {accepting ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Accepting...</span></> : <><CheckCircle className="w-5 h-5" /><span>Accept Request</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerAvailableRequests;