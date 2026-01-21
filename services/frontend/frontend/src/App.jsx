import { useState, useEffect } from 'react';
import { Recycle, User, Package, ChevronRight } from 'lucide-react';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import PricingPage from './components/PricingPage';
import Navigation from './components/shared/Navigation';
import CustomerDashboard from './components/customer/Dashboard';
import CustomerProfile from './components/customer/Profile';
import CustomerMyRequests from './components/customer/MyRequests';
import DealerDashboard from './components/dealer/DealerDashboard';
import DealerAvailableRequests from './components/dealer/DealerAvailableRequests';
import DealerMyRequests from './components/dealer/DealerMyRequests';
import DealerTransactions from './components/dealer/DealerTransactions';

const API_BASE = '/api';

const RoleSelectionPage = ({ setCurrentPage, setSelectedRole }) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
    <div className="max-w-4xl w-full">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-2xl shadow-2xl">
            <Recycle className="w-16 h-16 text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Welcome to Scrapzee
        </h1>
        <p className="text-xl text-gray-600">Choose how you'd like to continue</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <button
          onClick={() => { setSelectedRole('user'); setCurrentPage('register'); }}
          className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-left group"
        >
          <div className="bg-gradient-to-r from-green-400 to-green-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <User className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">I'm a Customer</h3>
          <p className="text-gray-600 mb-4">Sell your scrap materials and earn money</p>
          <div className="flex items-center text-green-600 font-semibold">
            Continue as Customer <ChevronRight className="w-5 h-5 ml-1" />
          </div>
        </button>
        <button
          onClick={() => { setSelectedRole('dealer'); setCurrentPage('register'); }}
          className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-left group"
        >
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">I'm a Dealer</h3>
          <p className="text-gray-600 mb-4">Accept pickup requests and manage business</p>
          <div className="flex items-center text-blue-600 font-semibold">
            Continue as Dealer <ChevronRight className="w-5 h-5 ml-1" />
          </div>
        </button>
      </div>
      <div className="text-center mt-8">
        <p className="text-gray-600 mb-4">Already have an account?</p>
        <button onClick={() => setCurrentPage('login')} className="text-green-600 hover:text-green-700 font-semibold">
          Sign in here
        </button>
      </div>
    </div>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedRole, setSelectedRole] = useState('user');
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
    fetchCategories();
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchDashboard();
    }
  }, [token, user]);

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
    if (!token || !user) return;
    setDashboardLoading(true);
    try {
      const endpoint = user.role === 'dealer' ? '/dealers/dashboard' : '/users/dashboard';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
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
        setToken(data.token);
        setUser(data.user);
        setCurrentPage(data.user.role === 'dealer' ? 'dealer-dashboard' : 'dashboard');
        setLoginForm({ email: '', password: '' });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
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
          full_name: registerForm.name,
          role: selectedRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        setCurrentPage(data.user.role === 'dealer' ? 'dealer-dashboard' : 'dashboard');
        setRegisterForm({ name: '', email: '', password: '' });
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setDashboard(null);
    setCurrentPage('home');
    setError(null);
  };

  // Callback to refresh dashboard when data changes
  const handleDataUpdate = () => {
    fetchDashboard();
  };

  // Non-authenticated pages (NO Navigation)
  if (!token) {
    if (currentPage === 'role-select') {
      return <RoleSelectionPage setCurrentPage={setCurrentPage} setSelectedRole={setSelectedRole} />;
    }
    if (currentPage === 'login') {
      return <LoginPage loginForm={loginForm} setLoginForm={setLoginForm} handleLogin={handleLogin} loading={loading} error={error} setCurrentPage={setCurrentPage} setError={setError} />;
    }
    if (currentPage === 'register') {
      return <RegisterPage registerForm={registerForm} setRegisterForm={setRegisterForm} handleRegister={handleRegister} loading={loading} error={error} setCurrentPage={setCurrentPage} setError={setError} selectedRole={selectedRole} />;
    }
    if (currentPage === 'pricing') {
      return <PricingPage user={null} categories={categories} categoriesLoading={categoriesLoading} setCurrentPage={setCurrentPage} token={null} onRequestCreated={null} handleLogout={null} />;
    }
    return <HomePage setCurrentPage={setCurrentPage} />;
  }

  // Authenticated pages (WITH Navigation)
  const role = (user?.role || 'user').toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} currentPage={currentPage} setCurrentPage={setCurrentPage} handleLogout={handleLogout} />

      {role === 'dealer' ? (
        <>
          {currentPage === 'dealer-dashboard' && <DealerDashboard user={user} token={token} setCurrentPage={setCurrentPage} />}
          {currentPage === 'dealer-available' && <DealerAvailableRequests token={token} categories={categories} onRequestAccepted={handleDataUpdate} />}
          {currentPage === 'dealer-requests' && <DealerMyRequests token={token} categories={categories} onRequestCompleted={handleDataUpdate} />}
          {currentPage === 'dealer-transactions' && <DealerTransactions token={token} />}
        </>
      ) : (
        <>
          {currentPage === 'dashboard' && <CustomerDashboard user={user} dashboard={dashboard} dashboardLoading={dashboardLoading} setCurrentPage={setCurrentPage} />}
          {currentPage === 'pricing' && <PricingPage user={user} categories={categories} categoriesLoading={categoriesLoading} setCurrentPage={setCurrentPage} token={token} onRequestCreated={handleDataUpdate} handleLogout={handleLogout} />}
          {currentPage === 'profile' && <CustomerProfile user={user} token={token} setCurrentPage={setCurrentPage} />}
          {currentPage === 'requests' && <CustomerMyRequests token={token} setCurrentPage={setCurrentPage} user={user} categories={categories} onStatusChange={handleDataUpdate} />}
        </>
      )}
    </div>
  );
}

export default App;