import React, { useState, useEffect } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import { getPopularManga } from '../pages/mangaData';
import '../styles/Browse.css';
const Browse = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setMangas(getPopularManga());
      setLoading(false);
    }, 1000);
  }, []);
  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Browse All Manga</h1>
        <p>Discover thousands of manga, manhwa, and manhua</p>
      </div>
      <MangaGrid 
        mangas={mangas} 
        title="All Manga"
        loading={loading}
        showFilters={true}
      />
    </div>
  );
};

export default Browse;
