import React, { useState, useEffect } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import { getMangaByGenre, mangaData } from '../pages/mangaData';
import '../styles/Pages.css';

const Genres = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

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
    setTimeout(() => {
      let filteredMangas = selectedGenre === 'all' 
        ? mangaData 
        : getMangaByGenre(selectedGenre);
    
      if (sortBy === 'newest') {
        filteredMangas.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      } else if (sortBy === 'popular') {
        filteredMangas.sort((a, b) => b.views - a.views);
      } else if (sortBy === 'rating') {
        filteredMangas.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'chapters') {
        filteredMangas.sort((a, b) => b.chapters - a.chapters);
      }
      
      setMangas(filteredMangas);
      setLoading(false);
    }, 800);
  }, [selectedGenre, sortBy]);

  const getGenreDisplayName = (genre) => {
    const genreObj = genres.find(g => g.value === genre);
    return genreObj ? genreObj.label : 'All Genres';
  };

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Manga Genres</h1>
        <p>Explore manga by your favorite genres</p>
        
        <div className="filter-controls">
          <div className="genre-filters">
            {genres.map(genre => (
              <button
                key={genre.value}
                className={`genre-filter ${selectedGenre === genre.value ? 'active' : ''}`}
                onClick={() => setSelectedGenre(genre.value)}
              >
                {genre.label}
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
        title={selectedGenre === 'all' ? 'All Genres' : `${getGenreDisplayName(selectedGenre)} Manga`}
        loading={loading}
        showFilters={false}
        emptyMessage={`No ${getGenreDisplayName(selectedGenre).toLowerCase()} manga found.`}
      />
    </div>
  );
};

export default Genres;
