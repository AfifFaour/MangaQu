import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Clock, Star } from 'lucide-react';
import '../../styles/MangaCard.css';

const MangaCard = ({ manga, viewMode = 'grid' }) => {
  const {
    id,
    title,
    image,
    description,
    chapters,
    views,
    likes,
    rating,
    lastUpdated,
    status,
    type,
    genres = []
  } = manga;

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ongoing': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'hiatus': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'manga': return '#ef4444';
      case 'manhwa': return '#8b5cf6';
      case 'manhua': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`manga-card ${viewMode === 'list' ? 'list-view' : ''}`}>
      <Link to={`/manga/${id}`} className="manga-card-link">
        <div className="manga-image-container">
          <img 
            src={image || '/placeholder-manga.jpg'} 
            alt={title}
            className="manga-image"
            loading="lazy"
          />
          <div className="manga-overlay">
            <div className="manga-actions">
              <button className="action-btn" onClick={(e) => e.preventDefault()}>
                <Heart size={16} />
              </button>
            </div>
            
            {/* Rating Badge */}
            {rating && (
              <div className="rating-badge">
                <Star size={12} fill="currentColor" />
                <span>{rating}</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          {status && (
            <div 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(status) }}
            >
              {status}
            </div>
          )}

          {/* Type Badge */}
          {type && (
            <div 
              className="type-badge" 
              style={{ backgroundColor: getTypeColor(type) }}
            >
              {type}
            </div>
          )}
        </div>

        <div className="manga-content">
          <h3 className="manga-title" title={title}>
            {truncateText(title, 40)}
          </h3>
          <p className="manga-description">
            {truncateText(description || 'No description available.', 80)}
          </p>
          {/* Genres */}
          {genres.length > 0 && (
            <div className="manga-genres">
              {genres.slice(0, 2).map((genre, index) => (
                <span key={index} className="genre-tag">
                  {genre}
                </span>
              ))}
              {genres.length > 2 && (
                <span className="genre-tag-more">
                  +{genres.length - 2}
                </span>
              )}
            </div>
          )}
          <div className="manga-meta">
            <div className="meta-item">
              <Eye size={14} className="meta-icon" />
              <span>{views?.toLocaleString() || '0'}</span>
            </div>
            
            <div className="meta-item">
              <Heart size={14} className="meta-icon" />
              <span>{likes?.toLocaleString() || '0'}</span>
            </div>
            
            <div className="meta-item">
              <Clock size={14} className="meta-icon" />
              <span>{chapters || '0'} ch</span>
            </div>
          </div>

          {lastUpdated && (
            <div className="last-updated">
              Updated {lastUpdated}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};
export default MangaCard;