import { useState } from 'react';
import { Recycle, LogOut, Menu } from 'lucide-react';

const Navigation = ({ user, currentPage, setCurrentPage, handleLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNavItems = () => {
    const role = user?.role || 'user';
    switch (role) {
      case 'dealer':
        return [
          { name: 'Dashboard', page: 'dealer-dashboard' },
          { name: 'Available Orders', page: 'dealer-available' },
          { name: 'My Orders', page: 'dealer-requests' },
          { name: 'Earnings', page: 'dealer-transactions' }
        ];
      default:
        return [
          { name: 'Dashboard', page: 'dashboard' },
          { name: 'Prices', page: 'pricing' },
          { name: 'My Requests', page: 'requests' },
          { name: 'Profile', page: 'profile' }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setCurrentPage(navItems[0].page)}
          >
            <Recycle className="w-8 h-8 text-green-600" />
            <span className="text-xl font-bold text-gray-800">Scrapzee</span>
          </div>
          
          <div className="hidden md:flex space-x-6">
            {navItems.map(item => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={`font-medium transition-colors px-3 py-2 rounded-lg ${
                  currentPage === item.page 
                    ? 'bg-green-50 text-green-600' 
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-700">{user?.full_name || user?.email}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                user?.role === 'dealer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {user?.role === 'dealer' ? 'Dealer' : 'Customer'}
              </span>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.page}
                onClick={() => { setCurrentPage(item.page); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-4 py-2 rounded-lg font-medium ${
                  currentPage === item.page 
                    ? 'bg-green-50 text-green-600' 
                    : 'hover:bg-gray-50'
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

export default Navigation;