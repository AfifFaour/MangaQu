import React, { useEffect, useState } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import { mangaAPI } from '../services/Api';
import '../styles/Pages.css';

const Newest = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewestManga = async () => {
      try {
        setLoading(true);
        setError(null);

        let res;
        if (sortBy === 'recently-added') {
          res = await mangaAPI.getUpdatedManga();
        } else {
          res = await mangaAPI.getNewestManga();
        }

        setMangas(res.data);
      } catch (err) {
        setError('Failed to load newest manga');
      } finally {
        setLoading(false);
      }
    };

    fetchNewestManga();
  }, [sortBy]);

  if (error) {
    return <div className="error">{error}</div>;
  }

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
            className={`sort-option ${
              sortBy === 'recently-added' ? 'active' : ''
            }`}
            onClick={() => setSortBy('recently-added')}
          >
            Recently Added
          </button>
        </div>
      </div>

      <MangaGrid
        mangas={mangas}
        title={
          sortBy === 'recently-added'
            ? 'Newest (Recently Added)'
            : 'Newest (Latest Releases)'
        }
        loading={loading}
        showFilters={true}
      />
    </div>
  );
};

export default Newest;
