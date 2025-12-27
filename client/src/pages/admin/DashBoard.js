import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/Api'; // Fixed import path
import LoadingSpinner from '../../Components/ui/LoadingSpinner';

const DashBoard = () => {
  const [stats, setStats] = useState({
    totalManga: 0,
    totalChapters: 0,
    totalUsers: 0,
    totalViews: 0,
    recentUploads: [],
    popularManga: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      // Handle response based on your backend structure
      if (response && response.success) {
        setStats(response.data);
      } else if (response && response.data) {
        setStats(response.data);
      } else {
        setStats(response || {});
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1 className="admin-title">Dashboard</h1>
        </div>
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1 className="admin-title">Dashboard</h1>
          <button onClick={loadDashboardData} className="btn-refresh">
            <i className="fas fa-redo"></i> Refresh
          </button>
        </div>
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Dashboard Overview</h1>
        <div className="admin-actions">
          <span className="last-update">Last updated: Just now</span>
          <button onClick={loadDashboardData} className="btn-refresh">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon">
            <i className="fas fa-book"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{formatNumber(stats.totalManga)}</h3>
            <p className="stat-label">Total Manga</p>
            <Link to="/admin/manga" className="stat-link">View All →</Link>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{formatNumber(stats.totalChapters)}</h3>
            <p className="stat-label">Total Chapters</p>
            <Link to="/admin/chapters" className="stat-link">Manage →</Link>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{formatNumber(stats.totalUsers)}</h3>
            <p className="stat-label">Total Users</p>
            <Link to="/admin/users" className="stat-link">View Users →</Link>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-icon">
            <i className="fas fa-eye"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{formatNumber(stats.totalViews)}</h3>
            <p className="stat-label">Total Views</p>
            <span className="stat-subtext">All time</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Recent Uploads */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Chapter Uploads</h2>
            <Link to="/admin/upload" className="btn-primary">
              <i className="fas fa-upload"></i> Upload New
            </Link>
          </div>
          
          {stats.recentUploads && stats.recentUploads.length > 0 ? (
            <div className="uploads-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Manga</th>
                    <th>Chapter</th>
                    <th>Uploaded</th>
                    <th>Pages</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUploads.map((upload) => (
                    <tr key={upload.id || upload.chapterId}>
                      <td>
                        <div className="manga-info">
                          <img 
                            src={upload.mangaCover || upload.coverImage || '/images/default-cover.png'} 
                            alt={upload.mangaTitle || upload.title}
                            className="manga-cover"
                          />
                          <div className="manga-details">
                            <strong>{upload.mangaTitle || upload.title}</strong>
                            <span className="manga-author">{upload.author || 'Unknown'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="chapter-info">
                          <strong>Chapter {upload.chapterNumber || upload.chapter}</strong>
                          {upload.title && upload.title !== (upload.mangaTitle || '') && (
                            <span className="chapter-title">{upload.title}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="time-ago">{getTimeAgo(upload.createdAt || upload.uploadedAt)}</span>
                      </td>
                      <td>
                        <span className="pages-count">{upload.pagesCount || upload.pages || 0} pages</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link 
                            to={`/admin/chapters/edit/${upload.id || upload.chapterId}`}
                            className="btn-action btn-edit"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <Link 
                            to={`/reader/${upload.mangaId}/${upload.chapterNumber || upload.chapter}`}
                            className="btn-action btn-view"
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <p>No recent uploads</p>
            </div>
          )}
        </div>

        {/* Popular Manga */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Popular Manga</h2>
          </div>
          
          {stats.popularManga && stats.popularManga.length > 0 ? (
            <div className="popular-grid">
              {stats.popularManga.slice(0, 4).map((manga) => (
                <div key={manga.id} className="popular-card">
                  <img 
                    src={manga.coverImage || '/images/default-cover.png'} 
                    alt={manga.title}
                    className="popular-cover"
                  />
                  <div className="popular-details">
                    <h4 className="popular-title">{manga.title}</h4>
                    <div className="popular-stats">
                      <span className="stat-view">
                        <i className="fas fa-eye"></i> {formatNumber(manga.views || manga.viewCount)}
                      </span>
                      <span className="stat-chapters">
                        <i className="fas fa-file-alt"></i> {manga.chapterCount || manga.chapters || 0}
                      </span>
                    </div>
                    <Link 
                      to={`/admin/manga/edit/${manga.id}`}
                      className="btn-small"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-chart-line"></i>
              <p>No popular manga data</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="actions-grid">
          <Link to="/admin/manga/add" className="action-card">
            <div className="action-icon action-icon-blue">
              <i className="fas fa-plus"></i>
            </div>
            <div className="action-content">
              <h4>Add New Manga</h4>
              <p>Add a new manga series to the platform</p>
            </div>
          </Link>

          <Link to="/admin/upload/bulk" className="action-card">
            <div className="action-icon action-icon-green">
              <i className="fas fa-upload"></i>
            </div>
            <div className="action-content">
              <h4>Bulk Upload</h4>
              <p>Upload multiple chapters at once</p>
            </div>
          </Link>

          <Link to="/admin/settings" className="action-card">
            <div className="action-icon action-icon-purple">
              <i className="fas fa-cog"></i>
            </div>
            <div className="action-content">
              <h4>Settings</h4>
              <p>Configure website settings</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashBoard;