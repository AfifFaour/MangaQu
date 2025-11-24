import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useManga } from '../context/MangaContext';
import ChapterList from '../Components/manga/ChapterList';
import MangaGrid from '../Components/manga/MangaGrid';
import { 
  Heart, 
  Bookmark, 
  Share2, 
  Eye, 
  Star, 
  Clock, 
  Calendar,
  ArrowLeft,
  Play
} from 'lucide-react';
import '../styles/MangaDetail.css';

const MangaDetail = () => {
  const { id } = useParams();
  const { mangaList, addBookmark, removeBookmark, bookmarks } = useManga();
  const [activeTab, setActiveTab] = useState('chapters');
  
  const manga = mangaList.find(m => m.id === parseInt(id));

  const sampleChapters = [
    { id: 1, number: 1, title: "The Beginning", date: "2024-01-20", views: 15000 },
    { id: 2, number: 2, title: "The Journey Starts", date: "2024-01-18", views: 12000 },
    { id: 3, number: 3, title: "First Challenge", date: "2024-01-15", views: 11000 },
    { id: 4, number: 4, title: "Unexpected Meeting", date: "2024-01-12", views: 9500 },
    { id: 5, number: 5, title: "Revelation", date: "2024-01-10", views: 8800 },
  ];

  const relatedManga = mangaList.filter(m => m.id !== parseInt(id)).slice(0, 6);

  if (!manga) {
    return (
      <div className="manga-not-found">
        <h2>Manga not found</h2>
        <p>The manga you're looking for doesn't exist.</p>
        <Link to="/browse" className="back-button">
          <ArrowLeft size={16} />
          Back to Browse
        </Link>
      </div>
    );
  }

  const isBookmarked = bookmarks.some(b => b.id === manga.id);

  const handleBookmark = () => {
    if (isBookmarked) {
      removeBookmark(manga.id);
    } else {
      addBookmark(manga);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: manga.title,
          text: manga.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
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
    <div className="manga-detail">
      <div className="back-nav">
        <Link to="/browse" className="back-button">
          <ArrowLeft size={20} />
          Back to Browse
        </Link>
      </div>

      <div className="manga-header">
        <div className="manga-cover">
          <img src={manga.image || '/placeholder-manga.jpg'} alt={manga.title} className="cover-image" />
          <div className="cover-overlay">
            <Link 
              to={`/read/${manga.id}/${sampleChapters[0]?.id || 1}`} 
              className="read-first-btn"
            >
              <Play size={16} />
              Read First Chapter
            </Link>
          </div>
        </div>
        
        <div className="manga-info">
          <div className="manga-title-section">
            <h1 className="manga-title">{manga.title}</h1>
            <div className="manga-actions">
              <button 
                className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                onClick={handleBookmark}
              >
                <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button className="share-btn" onClick={handleShare}>
                <Share2 size={20} />
                Share
              </button>
            </div>
          </div>

          <div className="manga-meta-grid">
            <div className="meta-item">
              <Star size={16} className="meta-icon" />
              <span className="meta-value">{manga.rating || 4.5}</span>
              <span className="meta-label">Rating</span>
            </div>
            <div className="meta-item">
              <Eye size={16} className="meta-icon" />
              <span className="meta-value">{(manga.views || 0).toLocaleString()}</span>
              <span className="meta-label">Views</span>
            </div>
            <div className="meta-item">
              <Heart size={16} className="meta-icon" />
              <span className="meta-value">{(manga.likes || 0).toLocaleString()}</span>
              <span className="meta-label">Likes</span>
            </div>
            <div className="meta-item">
              <Clock size={16} className="meta-icon" />
              <span className="meta-value">{manga.chapters || sampleChapters.length}</span>
              <span className="meta-label">Chapters</span>
            </div>
          </div>

          <div className="manga-details">
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span 
                className="detail-value status" 
                style={{ color: getStatusColor(manga.status) }}
              >
                {manga.status || 'Ongoing'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Type:</span>
              <span 
                className="detail-value type" 
                style={{ color: getTypeColor(manga.type) }}
              >
                {manga.type || 'Manga'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Updated:</span>
              <span className="detail-value">{manga.lastUpdated || 'Recently'}</span>
            </div>
          </div>

          <div className="manga-genres">
            {(manga.genres || ['Action', 'Adventure']).map((genre, index) => (
              <span key={index} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>

          <p className="manga-description">
            {manga.description || 'No description available for this manga.'}
          </p>
        </div>
      </div>

      <div className="content-tabs">
        <div className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
            onClick={() => setActiveTab('chapters')}
          >
            Chapters
          </button>
          <button 
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`tab-btn ${activeTab === 'related' ? 'active' : ''}`}
            onClick={() => setActiveTab('related')}
          >
            Related
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'chapters' && (
            <ChapterList 
              chapters={sampleChapters} 
              mangaId={manga.id}
              mangaTitle={manga.title}
            />
          )}
          
          {activeTab === 'details' && (
            <div className="details-content">
              <h3>Manga Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Author:</span>
                  <span className="info-value">Unknown</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Artist:</span>
                  <span className="info-value">Unknown</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Published:</span>
                  <span className="info-value">2024</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Serialization:</span>
                  <span className="info-value">Weekly</span>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'related' && (
            <div className="related-content">
              <MangaGrid 
                mangas={relatedManga}
                title="Related Manga"
                showFilters={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MangaDetail; 
