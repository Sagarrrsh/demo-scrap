import { useState, useEffect } from 'react';
import { Users, Package, DollarSign, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

const API_BASE = '/api';

const AdminDashboard = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch dealers
      const dealersRes = await fetch(`${API_BASE}/admin/dealers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dealersRes.ok) {
        const dealersData = await dealersRes.json();
        setDealers(dealersData.dealers || []);
      }

      // Fetch assignments
      const assignmentsRes = await fetch(`${API_BASE}/admin/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData.assignments || []);
      }

      // Calculate stats
      const totalDealers = dealers.length;
      const activeDealers = dealers.filter(d => d.is_active).length;
      const totalEarnings = dealers.reduce((sum, d) => sum + d.total_earnings, 0);
      const totalPickups = dealers.reduce((sum, d) => sum + d.total_pickups, 0);

      setStats({
        totalDealers,
        activeDealers,
        totalEarnings,
        totalPickups
      });
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Total Dealers', value: dealers.length, icon: Users, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
                { label: 'Active Dealers', value: dealers.filter(d => d.is_active).length, icon: TrendingUp, bgColor: 'bg-green-100', textColor: 'text-green-600' },
                { label: 'Total Pickups', value: dealers.reduce((sum, d) => sum + d.total_pickups, 0), icon: Package, bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
                { label: 'Total Earnings', value: `₹${dealers.reduce((sum, d) => sum + d.total_earnings, 0).toFixed(2)}`, icon: DollarSign, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' }
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

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Dealers</h2>
                {dealers.length > 0 ? (
                  <div className="space-y-4">
                    {dealers
                      .sort((a, b) => b.total_earnings - a.total_earnings)
                      .slice(0, 5)
                      .map(dealer => (
                        <div key={dealer.id} className="flex justify-between items-center p-4 border-2 border-gray-100 rounded-xl hover:border-green-200 transition-colors">
                          <div>
                            <p className="font-semibold text-gray-800">Dealer #{dealer.dealer_id}</p>
                            <p className="text-sm text-gray-600">{dealer.total_pickups} pickups</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">₹{dealer.total_earnings.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{dealer.rating.toFixed(1)} ⭐</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No dealers found</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Assignments</h2>
                {assignments.length > 0 ? (
                  <div className="space-y-3">
                    {assignments.slice(0, 5).map(assignment => (
                      <div key={assignment.id} className="flex justify-between items-center p-3 border-2 border-gray-100 rounded-xl hover:border-green-200 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-800">Request #{assignment.request_id}</p>
                          <p className="text-xs text-gray-500">Dealer #{assignment.dealer_id}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                          assignment.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No assignments found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">All Dealers</h2>
              {dealers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Dealer ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Vehicle</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Pickups</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Earnings</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Rating</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dealers.map(dealer => (
                        <tr key={dealer.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-800">#{dealer.dealer_id}</td>
                          <td className="py-3 px-4 text-gray-600">{dealer.vehicle_number || 'N/A'}</td>
                          <td className="py-3 px-4 text-right text-gray-800">{dealer.total_pickups}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">₹{dealer.total_earnings.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center text-gray-800">{dealer.rating.toFixed(1)} ⭐</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              dealer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {dealer.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No dealers registered yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;