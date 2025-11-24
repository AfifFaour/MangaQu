import React, { useState, useEffect } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import { getNewestManga } from '../pages/mangaData';
import '../styles/Pages.css';

const Newest = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    setTimeout(() => {
      let sortedMangas = getNewestManga();
      
      if (sortBy === 'newest') {
        sortedMangas.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      } else if (sortBy === 'recently-added') {
        sortedMangas.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
      }
      
      setMangas(sortedMangas);
      setLoading(false);
    }, 800);
  }, [sortBy]);

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Newest Manga</h1>
        <p>Discover the latest manga and manhwa releases</p>
        
        <div className="sort-options">
          <button 
            className={`sort-option ${sortBy === 'newest' ? 'active' : ''}`}
            onClick={() => setSortBy('newest')}
          >
            Newest Releases
          </button>
          <button 
            className={`sort-option ${sortBy === 'recently-added' ? 'active' : ''}`}
            onClick={() => setSortBy('recently-added')}
          >
            Recently Added
          </button>
        </div>
      </div>
      
      <MangaGrid 
        mangas={mangas} 
        title={`Newest ${sortBy === 'recently-added' ? '(Recently Added)' : '(Latest Releases)'}`}
        loading={loading}
        showFilters={true}
      />
    </div>
  );
};

export default Newest;
