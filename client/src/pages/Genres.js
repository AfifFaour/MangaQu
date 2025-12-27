import React, { useEffect, useState } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import api from '../services/Api';
import '../styles/Pages.css';

const Genres = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState(null);

  const genres = [
    { value: 'all', label: 'All Genres' },
    { value: 'action', label: 'Action' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'comedy', label: 'Comedy' },
    { value: 'drama', label: 'Drama' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'horror', label: 'Horror' },
    { value: 'romance', label: 'Romance' },
    { value: 'sci-fi', label: 'Sci-Fi' },
    { value: 'shounen', label: 'Shounen' },
    { value: 'shojo', label: 'Shojo' },
    { value: 'sports', label: 'Sports' },
    { value: 'supernatural', label: 'Supernatural' }
  ];

  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get('/v1/manga', {
          params: {
            genre: selectedGenre !== 'all' ? selectedGenre : undefined,
            sort: sortBy
          }
        });

        setMangas(res.data.data || res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load manga');
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, [selectedGenre, sortBy]);

  const getGenreLabel = (value) =>
    genres.find(g => g.value === value)?.label || 'All Genres';

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Manga Genres</h1>
        <p>Explore manga by your favorite genres</p>

        <div className="filter-controls">
          <div className="genre-filters">
            {genres.map(g => (
              <button
                key={g.value}
                className={`genre-filter ${
                  selectedGenre === g.value ? 'active' : ''
                }`}
                onClick={() => setSelectedGenre(g.value)}
              >
                {g.label}
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
            <button
              className={`sort-option ${sortBy === 'chapters' ? 'active' : ''}`}
              onClick={() => setSortBy('chapters')}
            >
              Most Chapters
            </button>
          </div>
        </div>
      </div>

      <MangaGrid
        mangas={mangas}
        title={
          selectedGenre === 'all'
            ? 'All Genres'
            : `${getGenreLabel(selectedGenre)} Manga`
        }
        loading={loading}
        showFilters={false}
        emptyMessage={`No ${getGenreLabel(selectedGenre).toLowerCase()} manga found.`}
      />
    </div>
  );
};

export default Genres;
