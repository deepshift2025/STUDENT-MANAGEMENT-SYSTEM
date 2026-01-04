import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

const ResetPasswordPage: React.FC = () => {
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useData();
    const navigate = useNavigate();
    const location = useLocation();

    const fromForgotPassword = location.state?.fromForgotPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (!token) {
            setError('A reset token is required.');
            return;
        }

        setLoading(true);
        try {
            const success = await resetPassword(token, newPassword);
            if (success) {
                setMessage('Your password has been reset successfully! You will be redirected to the login page shortly.');
                setTimeout(() => navigate('/login'), 4000);
            } else {
                setError('Invalid or expired password reset token. Please request a new one.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Reset Your Password
                    </h2>
                    {fromForgotPassword && !message && !error && (
                        <p className="mt-2 text-center text-sm text-green-600 dark:text-green-400">
                            A request has been sent. Please check your email for a reset token and paste it below.
                        </p>
                    )}
                </div>

                {message ? (
                     <div className="mt-8 text-center space-y-4">
                        <p className="text-green-600 dark:text-green-400">{message}</p>
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                           Go to Login &rarr;
                        </Link>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                         <div>
                            <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reset Token</label>
                            <input
                                id="token"
                                name="token"
                                type="text"
                                required
                                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Paste your reset token here"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="new-password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                            <input
                                id="new-password"
                                name="newPassword"
                                type="password"
                                required
                                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div>
                             <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                required
                                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;