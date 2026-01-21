import { useState, useEffect } from 'react';
import { Package, Loader2, X } from 'lucide-react';

const API_BASE = '/api';

const MyRequests = ({ token, setCurrentPage, user, categories, onStatusChange }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
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
        if (onStatusChange) onStatusChange();
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
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === status ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  req.status === 'completed' ? 'bg-green-100 text-green-700' :
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
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      selectedRequest.status === 'completed' ? 'bg-green-100 text-green-700' :
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

export default MyRequests;