import React, { useState, useEffect } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import { Heart } from 'lucide-react';
import { mangaData } from '../pages/mangaData'; // Import your manga data
import '../styles/Pages.css';

const Favorite = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const favoriteMangaIds = [1, 2, 3, 6]; 

  useEffect(() => {
    setTimeout(() => {
      if (isLoggedIn) {
        const favoriteMangas = mangaData.filter(manga => 
          favoriteMangaIds.includes(manga.id)
        ).map(manga => ({
          ...manga,
          favoritedDate: getFavoritedDate(manga.id)
        }));
        
        setMangas(favoriteMangas);
      }
      setLoading(false);
    }, 800);
  }, [isLoggedIn]);

  const getFavoritedDate = (mangaId) => {
    const dates = {
      1: '2024-01-15',
      2: '2024-01-10', 
      3: '2024-01-20',
      6: '2024-01-18'
    };
    return dates[mangaId] || '2024-01-01';
  };

  if (!isLoggedIn) {
    return (
      <div className="browse-page">
        <div className="auth-required">
          <Heart size={64} className="auth-icon" />
          <h2>Sign in to view favorites</h2>
          <p>Please log in to see your favorite manga collection</p>
          <button className="auth-button" onClick={() => window.location.href = '/login'}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="browse-header">
        <div className="favorites-header">
          <Heart size={32} className="favorites-icon" />
          <div>
            <h1>My Favorites</h1>
            <p>Your personal manga collection</p>
          </div>
        </div>
        
        {mangas.length > 0 && (
          <div className="favorites-stats">
            <span>{mangas.length} {mangas.length === 1 ? 'manga' : 'mangas'} saved</span>
            <span className="last-added">
              Last added: {mangas.length > 0 ? new Date(Math.max(...mangas.map(m => new Date(m.favoritedDate))))?.toLocaleDateString() : 'Never'}
            </span>
          </div>
        )}
      </div>
      
      {mangas.length === 0 && !loading ? (
        <div className="empty-favorites">
          <Heart size={48} className="empty-icon" />
          <h2>No favorites yet</h2>
          <p>Start adding manga to your favorites to see them here</p>
          <button className="browse-button" onClick={() => window.location.href = '/browse'}>
            Browse Manga
          </button>
        </div>
      ) : (
        <MangaGrid 
          mangas={mangas} 
          title="My Favorites"
          loading={loading}
          showFilters={true}
        />
      )}
    </div>
  );
};

export default Favorite;
