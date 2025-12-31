import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './../styles/Auth.css';

function SignUp() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState({
        password: false,
        confirmPassword: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const { register, error, clearError, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && isAuthenticated()) {
            const searchParams = new URLSearchParams(location.search);
            const redirect = searchParams.get('redirect') || from;
            
            setTimeout(() => {
                navigate(redirect, { replace: true });
            }, 100);
        }
    }, [authLoading, isAuthenticated, navigate, from, location.search]);

    // Clear error when user starts typing
    useEffect(() => {
        if (error && (formData.username || formData.email || formData.password)) {
            clearError();
        }
    }, [formData.username, formData.email, formData.password, error, clearError]);

    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (!usernameRegex.test(formData.username)) {
            newErrors.username = '3-20 characters (letters, numbers, underscores)';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Minimum 6 characters';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitted(true);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await register(
                formData.username,
                formData.email,
                formData.password
            );

            if (result.success) {
                setTimeout(() => {
                    const searchParams = new URLSearchParams(location.search);
                    const redirect = searchParams.get('redirect') || from;
                    navigate(redirect, { replace: true });
                }, 1000);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading screen while auth is initializing
    if (authLoading) {
        return (
            <div className="auth-loading">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <span className="logo-icon">📚</span>
                        <h1>MangaQu</h1>
                    </div>
                    <h2>Create Account</h2>
                    <p className="auth-subtitle">Register to access all features</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <span className="error-icon">⚠️</span>
                        <div>
                            <strong>Registration failed</strong>
                            <p>{error}</p>
                            {error.includes('already exists') && (
                                <small>
                                    <Link to="/login" className="auth-link">
                                        Try logging in instead
                                    </Link>
                                </small>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="username"
                            required
                            disabled={isLoading}
                            className={errors.username ? 'input-error' : ''}
                            autoComplete="username"
                        />
                        {errors.username && (
                            <span className="error-message">{errors.username}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="email@example.com"
                            required
                            disabled={isLoading}
                            className={errors.email ? 'input-error' : ''}
                            autoComplete="email"
                        />
                        {errors.email && (
                            <span className="error-message">{errors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input">
                            <input
                                type={showPassword.password ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                className={errors.password ? 'input-error' : ''}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => togglePasswordVisibility('password')}
                                disabled={isLoading}
                                tabIndex="-1"
                            >
                                {showPassword.password ? "Hide" : "Show"}
                            </button>
                        </div>
                        {errors.password && (
                            <span className="error-message">{errors.password}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="password-input">
                            <input
                                type={showPassword.confirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                className={errors.confirmPassword ? 'input-error' : ''}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => togglePasswordVisibility('confirmPassword')}
                                disabled={isLoading}
                                tabIndex="-1"
                            >
                                {showPassword.confirmPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        
                        {errors.confirmPassword && (
                            <span className="error-message">{errors.confirmPassword}</span>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="auth-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link 
                                to="/login" 
                                className="auth-link"
                                state={{ from: location.state?.from }}
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignUp;