import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function History() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockHistory = [
        { id: 1, mangaId: 1, mangaTitle: 'Naruto', chapter: 215, date: '2 hours ago', readTime: '15 min' },
        { id: 2, mangaId: 2, mangaTitle: 'One Piece', chapter: 1085, date: '1 day ago', readTime: '20 min' },
        { id: 3, mangaId: 4, mangaTitle: 'Demon Slayer', chapter: 45, date: '5 hours ago', readTime: '10 min' },
        { id: 4, mangaId: 1, mangaTitle: 'Naruto', chapter: 214, date: '2 days ago', readTime: '12 min' },
        { id: 5, mangaId: 3, mangaTitle: 'Attack on Titan', chapter: 139, date: '1 week ago', readTime: '18 min' },
      ];
      setHistory(mockHistory);
      setIsLoading(false);
    }, 500);
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your reading history?')) {
      // Clear history logic
      setHistory([]);
    }
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Reading History</h1>
        <p>Track your reading activity</p>
      </div>

      <div className="history-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Time
        </button>
        <button 
          className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
          onClick={() => setFilter('today')}
        >
          Today
        </button>
        <button 
          className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
          onClick={() => setFilter('week')}
        >
          This Week
        </button>
        <button 
          className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
          onClick={() => setFilter('month')}
        >
          This Month
        </button>
        <button className="clear-btn" onClick={clearHistory}>
          Clear History
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">📖</div>
          <h3>No reading history</h3>
          <p>Your reading history will appear here once you start reading manga.</p>
          <Link to="/browse" className="browse-btn">Start Reading</Link>
        </div>
      ) : (
        <div className="history-list">
          <table className="history-table">
            <thead>
              <tr>
                <th>Manga</th>
                <th>Chapter</th>
                <th>Read Time</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/manga/${item.mangaId}`} className="manga-link">
                      {item.mangaTitle}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/read/${item.mangaId}/${item.chapter}`} className="chapter-link">
                      Chapter {item.chapter}
                    </Link>
                  </td>
                  <td>{item.readTime}</td>
                  <td>{item.date}</td>
                  <td>
                    <button className="action-btn">Continue</button>
                    <button className="action-btn remove">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="history-stats">
        <div className="stat">
          <h3>{history.length}</h3>
          <p>Total Chapters Read</p>
        </div>
        <div className="stat">
          <h3>1h 15min</h3>
          <p>Total Reading Time</p>
        </div>
        <div className="stat">
          <h3>5</h3>
          <p>Different Manga</p>
        </div>
      </div>
    </div>
  );
}

export default History;