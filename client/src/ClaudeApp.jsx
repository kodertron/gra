import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import NewSalesEntry from './components/NewSalesEntry';
import EditedSalesEntry from './components/EditedSalesEntry';
import DashboardCard from './components/DashboardCard';
import Dash from './components/Dash';
import WindEd from './components/WindEd';
import DashEd from './components/DashEd';
import StockSummary from './components/StockSummary';
import DashTrucks from './components/DashTrucks';
import DashInLiters from './components/DashInLiters';
import HomeIcon from '@mui/icons-material/Home';

// Protected route component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Dashboard component
function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Overview</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <DashboardCard title="Sales">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/sales-entry')}
              className="p-3 text-sm font-medium rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors duration-200"
            >
              New Entry
            </button>
            <button 
               onClick={() => navigate('/dash')}
               className="p-3 text-sm font-medium rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors duration-200">
              View Entries
            </button>
            <button 
               onClick={() => navigate('/emdash')}
               className="p-3 text-sm font-medium rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors duration-200">
              Visualize Data (in Cedis)
            </button>
            <button 
              onClick={() => navigate('/litersview')}
              className="p-3 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors duration-200">
              Visualize Data (in Liters)
            </button>
          </div>
        </DashboardCard>
        <DashboardCard title="Trucks">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/form')}
              className="p-3 text-sm font-medium rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors duration-200"
            >
              New Entry
            </button>
            <button 
               onClick={() => navigate('/truck-view')}
               className="p-3 text-sm font-medium rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors duration-200">
              View Entries
            </button>
          </div>
        </DashboardCard>
        <DashboardCard title="Stock Summary">
          <div className="grid grid-cols-2 gap-4">
            <button 
               onClick={() => navigate('/stocksummary')}
               className="p-3 text-sm font-medium rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors duration-200">
              View Entries
            </button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

// Auth page component (handles both login and register)
function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);
  const { user } = useAuth();
  
  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <div className="flex h-2/5 bg-gray-50">
      {/* Left side - Branding/Welcome */}
      <div className="hidden lg:flex lg:w-2/5 bg-gray-900 p-8 flex-col justify-between relative overflow-hidden">
        {/* Abstract shapes for visual interest */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <h1 className="text-white text-2xl font-bold">Smart Fuel Station</h1>
          </div>
          <h2 className="text-white text-4xl font-bold mb-6 leading-tight">
            Intelligent Management for Modern Fuel Stations
          </h2>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">
            Elevate your station operations with our comprehensive digital management platform.
          </p>
          <ul className="mt-4 ml-4 text-gray-400 space-y-3 text-md italic">
            <li>
              Automated Sales Entry
            </li>
            <li>
              Accurate Sales Validation
            </li>
            <li>
              Interactive Analytics Dashboard
            </li>
            <li>
              Secured Access and Data Protection
            </li>
          </ul>
        </div>
        
        <div className="relative z-10 space-y-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-white font-medium">Real-time Analytics</span>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-white font-medium">Secure Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth forms */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {showLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {showLogin 
                ? 'Enter your credentials to access your dashboard' 
                : 'Create your account to get started'
              }
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
            {showLogin ? <Login /> : <Register />}
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-gray-600 text-center">
                {showLogin ? 'New to Smart Fuel Station?' : 'Already have an account?'}
              </p>
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="mt-4 w-full py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                {showLogin ? 'Create an account' : 'Sign in instead'}
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">© 2025 Smart Fuel Station. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Layout component with header (for non-auth pages)
function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If we're at the login page, render special layout
  if (currentPath === '/login') {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-10">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <h1 className="text-xl text-white font-bold">Smart Fuel Station</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {user && (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className={`flex items-center gap-1 text-white hover:text-blue-200 font-medium transition-colors duration-200 ${currentPath === '/dashboard' ? 'border-b-2 border-white pb-1' : ''}`}
                  style={{ display: currentPath === '/dashboard' ? 'none' : 'flex' }}
                >
                  <HomeIcon fontSize="small" />
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>
      </header>
      
      <main className="flex-grow py-8">
        {children}
      </main>
      
      {user && currentPath !== '/login' && (
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>© 2025 Smart Fuel Station. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
}

// Main App component
function ClaudeApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Navigate to="/dashboard" />
            </Layout>
          } />
          <Route path="/login" element={
              <AuthPage />
          } />
          <Route path="/register" element={
              <AuthPage />
          } />
          <Route path="/dashboard" element={
            <Layout>
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/sales-entry" element={
            <Layout>
              <ProtectedRoute>
                <EditedSalesEntry />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/newview" element={
            <Layout>
              <ProtectedRoute>
                <WindEd />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/emdash" element={
            <Layout>
              <ProtectedRoute>
                <DashEd />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/stocksummary" element={
            <Layout>
              <ProtectedRoute>
                <StockSummary />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/form" element={
            <Layout>
              <ProtectedRoute>
                <NewSalesEntry />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/truck-view" element={
            <Layout>
              <ProtectedRoute>
                <DashTrucks />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="/litersview" element={
            <Layout>
              <ProtectedRoute>
                <DashInLiters />
              </ProtectedRoute>
            </Layout>
          } />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/dash" element={
            <Layout>
              <ProtectedRoute>
                <Dash />
              </ProtectedRoute>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default ClaudeApp;