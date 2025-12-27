import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Clock, Star } from 'lucide-react';
import '../../styles/MangaCard.css';

const MangaCard = ({ manga, viewMode = 'grid' }) => {
  const {
    id,
    title,
    description,
    views = 0,
    likes = 0,
    rating,
    status,
    type,
    genres,
    chapters,
    chaptersCount,
    image,
    coverImage,
    lastUpdated,
    updatedAt
  } = manga;

  const cover = image || coverImage || '/placeholder-manga.jpg';
  const chapterTotal = chaptersCount ?? chapters ?? 0;

  const genreList = Array.isArray(genres)
    ? genres
    : typeof genres === 'string'
    ? genres.split(',')
    : [];

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
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
            src={cover}
            alt={title}
            className="manga-image"
            loading="lazy"
          />

          <div className="manga-overlay">
            <button
              className="action-btn"
              onClick={(e) => e.preventDefault()}
            >
              <Heart size={16} />
            </button>

            {rating && (
              <div className="rating-badge">
                <Star size={12} fill="currentColor" />
                <span>{rating}</span>
              </div>
            )}
          </div>

          {status && (
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(status) }}
            >
              {status}
            </span>
          )}

          {type && (
            <span
              className="type-badge"
              style={{ backgroundColor: getTypeColor(type) }}
            >
              {type}
            </span>
          )}
        </div>

        <div className="manga-content">
          <h3 className="manga-title" title={title}>
            {truncateText(title, 40)}
          </h3>

          <p className="manga-description">
            {truncateText(description || 'No description available.', 80)}
          </p>

          {genreList.length > 0 && (
            <div className="manga-genres">
              {genreList.slice(0, 2).map((g, i) => (
                <span key={i} className="genre-tag">
                  {g}
                </span>
              ))}
              {genreList.length > 2 && (
                <span className="genre-tag-more">
                  +{genreList.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="manga-meta">
            <span className="meta-item">
              <Eye size={14} /> {views.toLocaleString()}
            </span>

            <span className="meta-item">
              <Heart size={14} /> {likes.toLocaleString()}
            </span>

            <span className="meta-item">
              <Clock size={14} /> {chapterTotal} ch
            </span>
          </div>

          {(updatedAt || lastUpdated) && (
            <div className="last-updated">
              Updated {updatedAt || lastUpdated}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default MangaCard;
