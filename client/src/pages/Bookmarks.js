import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manga'); // manga, chapters, pages

  useEffect(() => {
    fetchBookmarks();
  }, [activeTab]);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockBookmarks = [
        { id: 1, type: 'manga', title: 'Naruto', cover: '/naruto.jpg', date: 'Added 2 days ago' },
        { id: 2, type: 'chapter', manga: 'One Piece', chapter: 1085, date: 'Bookmarked 1 week ago' },
        { id: 3, type: 'manga', title: 'Attack on Titan', cover: '/aot.jpg', date: 'Added 3 days ago' },
        { id: 4, type: 'page', manga: 'Demon Slayer', chapter: 45, page: 12, date: 'Saved today' },
      ];
      
      const filtered = activeTab === 'all' 
        ? mockBookmarks 
        : mockBookmarks.filter(item => item.type === activeTab);
      
      setBookmarks(filtered);
      setIsLoading(false);
    }, 500);
  };

  const removeBookmark = (id) => {
    setBookmarks(bookmarks.filter(item => item.id !== id));
  };

  return (
    <div className="bookmarks-container">
      <div className="bookmarks-header">
        <h1>My Bookmarks</h1>
        <p>Save manga, chapters, and pages for later</p>
      </div>

      <div className="bookmarks-tabs">
        <button 
          className={`bookmark-tab ${activeTab === 'manga' ? 'active' : ''}`}
          onClick={() => setActiveTab('manga')}
        >
          Manga
        </button>
        <button 
          className={`bookmark-tab ${activeTab === 'chapters' ? 'active' : ''}`}
          onClick={() => setActiveTab('chapters')}
        >
          Chapters
        </button>
        <button 
          className={`bookmark-tab ${activeTab === 'pages' ? 'active' : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          Pages
        </button>
        <button 
          className={`bookmark-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading bookmarks...</div>
      ) : bookmarks.length === 0 ? (
        <div className="empty-bookmarks">
          <div className="empty-icon">🔖</div>
          <h3>No bookmarks yet</h3>
          <p>Bookmark manga, chapters, or pages to find them easily later.</p>
          <Link to="/browse" className="browse-btn">Browse Manga</Link>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map(bookmark => (
            <div key={bookmark.id} className="bookmark-card">
              {bookmark.type === 'manga' && (
                <>
                  <Link to={`/manga/${bookmark.id}`} className="bookmark-link">
                    <div className="bookmark-cover">
                      <img src={bookmark.cover} alt={bookmark.title} />
                    </div>
                    <div className="bookmark-info">
                      <h3>{bookmark.title}</h3>
                      <p className="bookmark-date">{bookmark.date}</p>
                    </div>
                  </Link>
                  <button 
                    className="remove-bookmark"
                    onClick={() => removeBookmark(bookmark.id)}
                  >
                    Remove
                  </button>
                </>
              )}
              
              {bookmark.type === 'chapter' && (
                <>
                  <Link to={`/read/${bookmark.mangaId}/${bookmark.chapter}`} className="bookmark-link">
                    <div className="bookmark-icon">📖</div>
                    <div className="bookmark-info">
                      <h3>{bookmark.manga}</h3>
                      <p>Chapter {bookmark.chapter}</p>
                      <p className="bookmark-date">{bookmark.date}</p>
                    </div>
                  </Link>
                  <button 
                    className="remove-bookmark"
                    onClick={() => removeBookmark(bookmark.id)}
                  >
                    Remove
                  </button>
                </>
              )}
              
              {bookmark.type === 'page' && (
                <>
                  <Link to={`/read/${bookmark.mangaId}/${bookmark.chapter}?page=${bookmark.page}`} className="bookmark-link">
                    <div className="bookmark-icon">📄</div>
                    <div className="bookmark-info">
                      <h3>{bookmark.manga}</h3>
                      <p>Chapter {bookmark.chapter}, Page {bookmark.page}</p>
                      <p className="bookmark-date">{bookmark.date}</p>
                    </div>
                  </Link>
                  <button 
                    className="remove-bookmark"
                    onClick={() => removeBookmark(bookmark.id)}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bookmarks-actions">
        <button className="action-btn">Export Bookmarks</button>
        <button className="action-btn" onClick={() => {
          if (window.confirm('Remove all bookmarks?')) {
            setBookmarks([]);
          }
        }}>
          Clear All
        </button>
      </div>
    </div>
  );
}

export default Bookmarks;