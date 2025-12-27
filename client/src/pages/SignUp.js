import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/SignUp.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: '', width: 0 };
    if (password.length < 6) return { strength: 'weak', width: 33 };
    if (password.length < 8) return { strength: 'medium', width: 66 };
    return { strength: 'strong', width: 100 };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }


    try {
      console.log('Signup attempt:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h1 className="signup-title">Create Account</h1>
          <p className="signup-subtitle">Join MangaQu today</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="Name">Name</label>
              <input
                type="text"
                id="Name"
                name="Name"
                className="form-input"
                placeholder="Name"
                value={formData.Name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill ${passwordStrength.strength}`}
                    style={{ width: `${passwordStrength.width}%` }}
                  ></div>
                </div>
                <div className="strength-text">
                  Password strength: {passwordStrength.strength}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="terms-agreement">
            <input
              type="checkbox"
              id="terms"
              className="terms-checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            <label className="terms-label" htmlFor="terms">
              I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
            </label>
          </div>

          <button 
            type="submit" 
            className="signup-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-link">
          Already have an account? 
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;