import { useState, useEffect } from 'react';
import { DollarSign, Loader2, TrendingUp, Package, Calendar, RefreshCw } from 'lucide-react';

const API_BASE = '/api';

const DealerTransactions = ({ token }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    transactionCount: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const res = await fetch(`${API_BASE}/dealers/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const txns = data.transactions || [];
        setTransactions(txns);

        // Calculate stats
        const now = new Date();
        const thisMonth = txns.filter(t => {
          const date = new Date(t.created_at);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).reduce((sum, t) => sum + t.amount, 0);

        const lastMonth = txns.filter(t => {
          const date = new Date(t.created_at);
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
          return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
        }).reduce((sum, t) => sum + t.amount, 0);

        const total = txns.reduce((sum, t) => sum + t.amount, 0);

        setStats({ 
          total, 
          thisMonth, 
          lastMonth,
          transactionCount: txns.length 
        });
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Transaction History
            </h1>
            <p className="text-gray-600">Track your earnings and payments</p>
          </div>
          <button
            onClick={() => fetchTransactions(true)}
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
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-10 h-10 opacity-80" />
                  <TrendingUp className="w-6 h-6 opacity-80" />
                </div>
                <p className="text-sm opacity-90 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold">₹{stats.total.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
                <DollarSign className="w-10 h-10 mb-4 opacity-80" />
                <p className="text-sm opacity-90 mb-1">This Month</p>
                <p className="text-3xl font-bold">₹{stats.thisMonth.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
                <DollarSign className="w-10 h-10 mb-4 opacity-80" />
                <p className="text-sm opacity-90 mb-1">Last Month</p>
                <p className="text-3xl font-bold">₹{stats.lastMonth.toFixed(2)}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform">
                <Package className="w-10 h-10 mb-4 opacity-80" />
                <p className="text-sm opacity-90 mb-1">Total Transactions</p>
                <p className="text-3xl font-bold">{stats.transactionCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">All Transactions</h2>
              
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map(txn => (
                    <div key={txn.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-bold text-gray-800">Transaction #{txn.id}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              txn.status === 'completed' ? 'bg-green-100 text-green-700' :
                              txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {txn.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Request #{txn.request_id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">
                              {new Date(txn.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">₹{txn.amount.toFixed(2)}</p>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {txn.transaction_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No Transactions Yet</h3>
                  <p className="text-gray-500">Complete some orders to see transactions here</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DealerTransactions;