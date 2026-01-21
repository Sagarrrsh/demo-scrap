import { Recycle, AlertCircle, Loader2, User, Package } from 'lucide-react';

const RegisterPage = ({ registerForm, setRegisterForm, handleRegister, loading, error, setCurrentPage, setError, selectedRole }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    handleRegister(e);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className={`bg-gradient-to-r ${selectedRole === 'dealer' ? 'from-blue-500 to-blue-600' : 'from-green-500 to-blue-500'} w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4`}>
            {selectedRole === 'dealer' ? <Package className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-600 mt-2">
            Sign up as {selectedRole === 'dealer' ? 'Dealer' : 'Customer'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={registerForm.name}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
              minLength={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              placeholder="••••••••"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Creating account...</> : 'Create Account'}
          </button>
        </div>

        <div className="mt-6 text-center space-y-3">
          <button onClick={() => { setCurrentPage('login'); setError(null); }} className="text-green-600 hover:text-green-700 font-medium">
            Already have an account? Sign in
          </button>
          <div>
            <button onClick={() => { setCurrentPage('role-select'); setError(null); }} className="text-gray-500 hover:text-gray-700 text-sm">
              ← Choose different role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;