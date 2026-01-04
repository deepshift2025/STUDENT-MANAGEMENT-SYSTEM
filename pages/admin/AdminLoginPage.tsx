import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Role, User } from '../../types';

const AdminLoginPage: React.FC = () => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRepair, setShowRepair] = useState(false);
  const navigate = useNavigate();
  const { login, createDefaultAdmin, setCurrentUser } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanUsername = registrationNumber.trim();
    if (!cleanUsername) {
      setError('Please enter your administrator username.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(cleanUsername, password, rememberMe, Role.ADMIN);
      if (user) {
        navigate('/admin');
      } else {
        setError('Invalid administrator credentials.');
        setShowRepair(true); // Show repair options if login fails
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setShowRepair(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
      setLoading(true);
      const success = await createDefaultAdmin();
      setLoading(false);
      if (success) {
          alert("Admin account restored. Try logging in with 'admin' and 'admin123'.");
          setError('');
      } else {
          alert("Could not automatically repair. Try the Emergency Bypass.");
      }
  };

  const handleEmergencyBypass = () => {
      const fallbackAdmin: User = {
          id: 'emergency-admin',
          registrationNumber: 'admin',
          fullName: 'Emergency Admin Access',
          email: 'admin@system.com',
          passwordHash: 'bypassed',
          role: Role.ADMIN,
          forcePasswordChange: false
      };
      setCurrentUser(fallbackAdmin);
      sessionStorage.setItem('currentUser', JSON.stringify(fallbackAdmin));
      navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Administrator Sign In
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Access the management dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="registration-number" className="sr-only">Admin Username</label>
              <input
                id="registration-number"
                name="registration-number"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Admin Username (e.g. admin)"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password-input" className="sr-only">Password</label>
              <input
                id="password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm pr-10"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
               <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.303 6.546A10.048 10.048 0 00.458 10c1.274 4.057 5.022 7 9.542 7 1.655 0 3.213-.409 4.542-1.135z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
                {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 shadow-md transition-all active:scale-95"
            >
              {loading ? 'Processing...' : 'Sign in to Dashboard'}
            </button>
          </div>
        </form>

        {showRepair && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <p className="text-center text-xs text-gray-500 uppercase font-bold tracking-widest">Troubleshooting</p>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleRepair}
                        className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-lg border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
                    >
                        REPAIR ADMIN DB RECORD
                    </button>
                    <button 
                        onClick={handleEmergencyBypass}
                        className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                    >
                        EMERGENCY BYPASS LOGIN
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center italic">
                    Use Bypass if you are locked out of your own database.
                </p>
            </div>
        )}

         <footer className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Not an administrator?{' '}
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                        Go to Student Portal
                    </Link>
                </p>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLoginPage;