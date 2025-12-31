import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './../styles/Auth.css';

function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    const { login, error, clearError, isAuthenticated, loading: authLoading } = useAuth();
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
        if (error && (formData.email || formData.password)) {
            clearError();
        }
    }, [formData.email, formData.password, error, clearError]);

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        
        try {
            const result = await login(formData.email, formData.password);
            
            if (result.success) {
                const searchParams = new URLSearchParams(location.search);
                const redirect = searchParams.get('redirect') || from;
                navigate(redirect, { replace: true });
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
                    <h2>Login</h2>
                    <p className="auth-subtitle">Enter your credentials to continue</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <span className="error-icon">⚠️</span>
                        <div>
                            <strong>Login failed</strong>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
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
                            className={validationErrors.email ? 'input-error' : ''}
                            autoComplete="email"
                        />
                        {validationErrors.email && (
                            <span className="error-message">{validationErrors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                className={validationErrors.password ? 'input-error' : ''}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                                tabIndex="-1"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        {validationErrors.password && (
                            <span className="error-message">{validationErrors.password}</span>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="auth-btn"
                        disabled={isLoading || !formData.email || !formData.password}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="auth-footer">
                        <p>
                            Don't have an account?{' '}
                            <Link 
                                to="/signup" 
                                className="auth-link"
                                state={{ from: location.state?.from }}
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;