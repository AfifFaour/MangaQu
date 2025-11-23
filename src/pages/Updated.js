// pages/Updated.js
import React, { useState, useEffect } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import { mangaData } from './mangaData';
import '../styles/Pages.css';

const Updated = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recently-updated');

  useEffect(() => {
    setTimeout(() => {
      let sortedMangas = [...mangaData];
      
      if (sortBy === 'recently-updated') {
        sortedMangas.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      } else if (sortBy === 'popular') {
        sortedMangas.sort((a, b) => b.views - a.views);
      } else if (sortBy === 'highest-rated') {
        sortedMangas.sort((a, b) => b.rating - a.rating);
      }
      
      setMangas(sortedMangas);
      setLoading(false);
    }, 800);
  }, [sortBy]);

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Updated Manga</h1>
        <p>Recently updated manga with new chapters and content</p>
        
        <div className="sort-options">
          <button 
            className={`sort-option ${sortBy === 'recently-updated' ? 'active' : ''}`}
            onClick={() => setSortBy('recently-updated')}
          >
            Recently Updated
          </button>
          <button 
            className={`sort-option ${sortBy === 'popular' ? 'active' : ''}`}
            onClick={() => setSortBy('popular')}
          >
            Most Popular
          </button>
          <button 
            className={`sort-option ${sortBy === 'highest-rated' ? 'active' : ''}`}
            onClick={() => setSortBy('highest-rated')}
          >
            Highest Rated
          </button>
        </div>
      </div>
      
      <MangaGrid 
        mangas={mangas} 
        title={`Recently Updated ${sortBy === 'popular' ? '(Most Popular)' : sortBy === 'highest-rated' ? '(Highest Rated)' : '(Latest Updates)'}`}
        loading={loading}
        showFilters={true}
      />
    </div>
  );
};

export default Updated;