import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import authService from '../services/authService';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
        if (error) setError('');
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.login(formData);
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen  flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body">
            {/* Subtle Ambient Glows */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-terracotta/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />

          
            {/* Centered Form Card */}
            <div className="w-full max-w-md  rounded-3xl p-8 sm:p-10 relative z-10">
                
                {/* Brand Header */}
                <div className="text-center mb-8">
                    
                    
                    <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-navy mt-6">
                        Welcome Back
                    </h1>
                    <p className="text-body text-sm mt-1.5">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-terracotta font-bold hover:underline">
                            Sign up here
                        </Link>
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 text-sm flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-5">
                    
                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative group">
                            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-terracotta transition-colors text-sm" />
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={onChange}
                                placeholder="you@example.com"
                                className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50/50 text-navy text-sm font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                Password
                            </label>
                            <a href="#" className="text-xs text-terracotta font-semibold hover:underline">
                                Forgot password?
                            </a>
                        </div>
                        <div className="relative group">
                            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-terracotta transition-colors text-sm" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={onChange}
                                placeholder="Enter your password"
                                className="w-full h-12 pl-11 pr-12 rounded-xl border border-gray-200 bg-gray-50/50 text-navy text-sm font-medium focus:bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all placeholder-gray-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors focus:outline-none"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <FaEyeSlash className="text-base" /> : <FaEye className="text-base" />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center pt-1">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-terracotta focus:ring-terracotta border-gray-300 rounded cursor-pointer accent-terracotta"
                        />
                        <label htmlFor="remember-me" className="ml-2.5 block text-xs font-medium text-gray-600 cursor-pointer">
                            Keep me signed in
                        </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl btn-cta font-bold text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Signing In...</span>
                                </div>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer Security Badge */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <FaShieldAlt className="text-emerald-500" />
                    <span>Protected by 256-bit bank-grade encryption</span>
                </div>
            </div>

            {/* Bottom Copyright */}
            <p className="mt-8 text-center text-xs text-gray-400 relative z-10">
                &copy; {new Date().getFullYear()} Venuora. All rights reserved.
            </p>
        </div>
    );
};

export default Login;
