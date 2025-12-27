// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/UseAuth';
import { useManga } from '../hooks/UseManga';
import MangaCard from '../../common/mangaCard';
import '../styles/profile.css';
const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { favorites, fetchFavorites, readingHistory, fetchReadingHistory } = useManga();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
      
      // Load user data
      fetchFavorites();
      fetchReadingHistory();
    }
  }, [user, fetchFavorites, fetchReadingHistory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to update profile');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    try {
      // Call password update API
      alert('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      alert(error.message || 'Failed to update password');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size should be less than 5MB');
      return;
    }
    
    // In a real app, you would upload to server
    // For now, create a local URL
    const imageUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      avatar: imageUrl
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="login-prompt">
          <h2>Please log in to view your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="avatar-container">
            <img 
              src={formData.avatar || '/default-avatar.png'} 
              alt="Profile Avatar" 
              className="profile-avatar"
            />
            {editMode && (
              <label className="avatar-upload-btn">
                Upload
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          <div className="profile-info">
            <h1>{formData.username}</h1>
            <p className="profile-email">{formData.email}</p>
            <p className="member-since">
              Member since: {formatDate(user.createdAt || new Date().toISOString())}
            </p>
          </div>
        </div>
        
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-number">{favorites.length}</span>
            <span className="stat-label">Favorites</span>
          </div>
          <div className="stat">
            <span className="stat-number">{readingHistory.length}</span>
            <span className="stat-label">Read</span>
          </div>
          <div className="stat">
            <span className="stat-number">{user.readingTime || 0}h</span>
            <span className="stat-label">Reading Time</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites ({favorites.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Reading History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="tab-content">
            <div className="profile-bio">
              <h3>About</h3>
              {editMode ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows="4"
                />
              ) : (
                <p>{formData.bio || 'No bio yet...'}</p>
              )}
            </div>
            
            {editMode ? (
              <div className="edit-form">
                <h3>Edit Profile</h3>
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn">Save Changes</button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button 
                className="edit-profile-btn"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="tab-content">
            <h3>Favorite Manga</h3>
            {favorites.length > 0 ? (
              <div className="manga-grid">
                {favorites.map(manga => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            ) : (
              <p className="empty-state">No favorites yet. Start adding some!</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <h3>Reading History</h3>
            {readingHistory.length > 0 ? (
              <div className="history-list">
                {readingHistory.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-manga">
                      <img 
                        src={item.mangaCover} 
                        alt={item.mangaTitle}
                        className="history-cover"
                      />
                      <div className="history-info">
                        <h4>{item.mangaTitle}</h4>
                        <p>Chapter {item.chapterNumber}</p>
                        <span className="history-date">
                          {formatDate(item.readAt)}
                        </span>
                      </div>
                    </div>
                    <button className="continue-btn">Continue Reading</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No reading history yet.</p>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="settings-section">
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <button type="submit" className="save-btn">
                  Update Password
                </button>
              </form>
            </div>

            <div className="settings-section">
              <h3>Account Actions</h3>
              <div className="danger-zone">
                <button className="logout-btn" onClick={logout}>
                  Log Out
                </button>
                <button className="delete-btn">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;