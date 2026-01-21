import { useState } from 'react';
import { Recycle, TrendingUp, Package, History, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const API_BASE = '/api';

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
            {/* Only show header for non-logged-in users */}
            {!user && (
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

            {/* Request Modal */}
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
                                <div className="space-y-4">
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
                                        onClick={handleSubmitRequest}
                                        disabled={requestLoading || !requestForm.quantity || !requestForm.address || !requestForm.pickup_date}
                                        className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                    >
                                        {requestLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Creating Request...</span>
                                            </>
                                        ) : 'Create Request'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Price History Modal */}
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

export default PricingPage;