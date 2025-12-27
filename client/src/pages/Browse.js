import React, { useEffect, useState } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import api from '../services/Api';
import '../styles/Browse.css';

const Browse = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoading(true);
        const res = await api.get('/manga');
        setMangas(res.data);
      } catch (err) {
        setError('Failed to load manga list');
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }

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
