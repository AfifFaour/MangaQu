import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './../styles/Profile.css';
import { 
  User, Settings, LogOut, Key, BookOpen, Heart, 
  History, CreditCard, Shield, HelpCircle 
} from 'lucide-react';

function Profile() {
  const { user, logout, isAdmin, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Initialize form with user data
    setFormData(prev => ({
      ...prev,
      username: user.username || '',
      email: user.email || ''
    }));
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage('');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Update profile logic here
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Password change logic here
      setMessage('Password changed successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return null;
  }

  const menuItems = [
    { id: 'profile', icon: <User size={20} />, label: 'Profile', show: true },
    { id: 'security', icon: <Key size={20} />, label: 'Security', show: true },
    { id: 'reading', icon: <BookOpen size={20} />, label: 'Reading History', show: true },
    { id: 'favorites', icon: <Heart size={20} />, label: 'Favorites', show: true },
    { id: 'billing', icon: <CreditCard size={20} />, label: 'Billing', show: isAdmin() },
    { id: 'admin', icon: <Shield size={20} />, label: 'Admin Dashboard', show: isAdmin() },
    { id: 'help', icon: <HelpCircle size={20} />, label: 'Help & Support', show: true }
  ];

  return (
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h3>{user.username}</h3>
            <p>{user.email}</p>
            {isAdmin() && (
              <span className="admin-badge">
                <Shield size={14} /> Admin
              </span>
            )}
          </div>
        </div>

        <nav className="profile-menu">
          {menuItems
            .filter(item => item.show)
            .map(item => (
              <button
                key={item.id}
                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-content-header">
          <h2>
            {activeTab === 'profile' && 'Profile Settings'}
            {activeTab === 'security' && 'Security Settings'}
            {activeTab === 'reading' && 'Reading History'}
            {activeTab === 'favorites' && 'My Favorites'}
            {activeTab === 'billing' && 'Billing'}
            {activeTab === 'admin' && 'Admin Dashboard'}
            {activeTab === 'help' && 'Help & Support'}
          </h2>
          <p className="profile-subtitle">
            {activeTab === 'profile' && 'Manage your account information'}
            {activeTab === 'security' && 'Update your password and security settings'}
            {activeTab === 'reading' && 'View your reading history'}
            {activeTab === 'favorites' && 'Manage your favorite manga'}
            {activeTab === 'billing' && 'View billing information and invoices'}
            {activeTab === 'admin' && 'Access admin controls and statistics'}
            {activeTab === 'help' && 'Get help and contact support'}
          </p>
        </div>

        {message && (
          <div className={`profile-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="profile-content-body">
          {activeTab === 'profile' && (
            <form className="profile-form" onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form className="profile-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter current password"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password"
                  disabled={loading}
                  minLength="8"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  disabled={loading}
                  minLength="8"
                />
              </div>

              <div className="password-requirements">
                <p>Password must be at least 8 characters long</p>
              </div>

              <button 
                type="submit" 
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          )}

          {activeTab === 'admin' && isAdmin() && (
            <div className="admin-section">
              <div className="admin-grid">
                <Link to="/dashboard" className="admin-card">
                  <div className="admin-card-icon">📊</div>
                  <h3>Dashboard</h3>
                  <p>View site statistics and manage content</p>
                </Link>

                <Link to="/dashboard?tab=users" className="admin-card">
                  <div className="admin-card-icon">👥</div>
                  <h3>Users</h3>
                  <p>Manage user accounts and permissions</p>
                </Link>

                <Link to="/dashboard?tab=manga" className="admin-card">
                  <div className="admin-card-icon">📚</div>
                  <h3>Manga</h3>
                  <p>Add, edit, and delete manga titles</p>
                </Link>

                <div className="admin-card">
                  <div className="admin-card-icon">⚙️</div>
                  <h3>Settings</h3>
                  <p>Configure site settings and preferences</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reading' && (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <h3>No Reading History</h3>
              <p>Start reading manga to see your history here</p>
              <Link to="/browse" className="browse-link">
                Browse Manga
              </Link>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <h3>No Favorites Yet</h3>
              <p>Add manga to your favorites to see them here</p>
              <Link to="/browse" className="browse-link">
                Browse Manga
              </Link>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="help-section">
              <div className="help-card">
                <h3>Need Help?</h3>
                <p>If you're experiencing issues or have questions, please contact support:</p>
                <ul>
                  <li>Email: support@mangaqu.com</li>
                  <li>Discord: discord.gg/mangaqu</li>
                  <li>Twitter: @MangaQuHelp</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;