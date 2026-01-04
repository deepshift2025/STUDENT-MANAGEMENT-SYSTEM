import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

const ForgotPasswordPage: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { requestPasswordReset } = useData();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await requestPasswordReset(identifier);
            if (success) {
                navigate('/reset-password', { state: { fromForgotPassword: true } });
            } else {
                // To prevent user enumeration, we could navigate regardless.
                // However, to maintain consistency with the app's current feedback patterns,
                // we show an error if the user is not found.
                setError('No account found with that registration number or email address.');
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
                        Forgot Your Password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Enter your registration number or email to receive a reset token.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="identifier" className="sr-only">Registration Number or Email</label>
                        <input
                            id="identifier"
                            name="identifier"
                            type="text"
                            required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Registration Number or Email"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                        >
                            {loading ? 'Sending...' : 'Request Password Reset'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm mt-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Remembered your password?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;