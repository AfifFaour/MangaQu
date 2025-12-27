import React, { useEffect, useState } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import { mangaAPI } from '../services/Api';
import '../styles/Pages.css';

const Types = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState(null);

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'manga', label: 'Manga' },
    { value: 'manhwa', label: 'Manhwa' },
    { value: 'manhua', label: 'Manhua' },
    { value: 'one-shot', label: 'One Shot' },
    { value: 'novel', label: 'Novel' },
    { value: 'doujinshi', label: 'Doujinshi' }
  ];

  useEffect(() => {
    const fetchMangaByType = async () => {
      try {
        setLoading(true);
        setError(null);

        let res;

        if (selectedType === 'all') {
          res = await mangaAPI.getAllManga(1, 50, sortBy);
        } else {
          res = await mangaAPI.getMangaByType(selectedType, sortBy);
        }

        setMangas(res.data);
      } catch (err) {
        setError('Failed to load manga by type');
      } finally {
        setLoading(false);
      }
    };

    fetchMangaByType();
  }, [selectedType, sortBy]);

  const getTypeDisplayName = (type) => {
    const typeObj = types.find(t => t.value === type);
    return typeObj ? typeObj.label : 'All Types';
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Manga Types</h1>
        <p>Browse manga by different types and formats</p>

        <div className="filter-controls">
          <div className="type-filters">
            {types.map(type => (
              <button
                key={type.value}
                className={`type-filter ${
                  selectedType === type.value ? 'active' : ''
                }`}
                onClick={() => setSelectedType(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="sort-options">
            <button
              className={`sort-option ${sortBy === 'newest' ? 'active' : ''}`}
              onClick={() => setSortBy('newest')}
            >
              Newest
            </button>
            <button
              className={`sort-option ${sortBy === 'popular' ? 'active' : ''}`}
              onClick={() => setSortBy('popular')}
            >
              Most Popular
            </button>
            <button
              className={`sort-option ${sortBy === 'rating' ? 'active' : ''}`}
              onClick={() => setSortBy('rating')}
            >
              Highest Rated
            </button>
          </div>
        </div>
      </div>

      <MangaGrid
        mangas={mangas}
        title={
          selectedType === 'all'
            ? 'All Manga Types'
            : `${getTypeDisplayName(selectedType)} Manga`
        }
        loading={loading}
        showFilters={false}
        emptyMessage={`No ${getTypeDisplayName(selectedType).toLowerCase()} manga found.`}
      />
    </div>
  );
};

export default Types;
