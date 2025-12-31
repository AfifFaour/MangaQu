import React from 'react';
import { Link } from 'react-router-dom';

function PageNotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">🔍</div>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div className="not-found-actions">
          <Link to="/" className="not-found-btn primary">
            Go Home
          </Link>
          <Link to="/browse" className="not-found-btn secondary">
            Browse Manga
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PageNotFound;