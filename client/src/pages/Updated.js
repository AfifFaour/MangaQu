import React, { useEffect, useState } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import api from '../services/Api';
import '../styles/Pages.css';

const Updated = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recently-updated');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpdatedManga = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get('/v1/manga', {
          params: {
            sort: sortBy
          }
        });

        setMangas(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load updated manga');
      } finally {
        setLoading(false);
      }
    };

    fetchUpdatedManga();
  }, [sortBy]);

  if (error) {
    return <div className="error">{error}</div>;
  }

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
        title={
          sortBy === 'popular'
            ? 'Updated Manga (Most Popular)'
            : sortBy === 'highest-rated'
            ? 'Updated Manga (Highest Rated)'
            : 'Updated Manga (Latest Updates)'
        }
        loading={loading}
        showFilters={true}
      />
    </div>
  );
};

export default Updated;
