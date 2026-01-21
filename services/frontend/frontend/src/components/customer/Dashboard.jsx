import { Package, Clock, CheckCircle, DollarSign, Loader2 } from 'lucide-react';

const CustomerDashboard = ({ user, dashboard, dashboardLoading, setCurrentPage, handleLogout }) => (
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
                    <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                      req.status === 'completed' ? 'bg-green-100 text-green-700' :
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
);

export default CustomerDashboard;