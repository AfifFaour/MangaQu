import React, { useState } from 'react';
import MangaCard from '../common/MangaCard';
import { Grid, List, Filter, ChevronDown, Search, X } from 'lucide-react';
import '../../styles/MangaGrid.css';

const MangaGrid = ({ 
  mangas, 
  title, 
  loading = false, 
  onFilterChange,
  showFilters = true 
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('latest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Shounen', 'Shojo', 'Sports', 'Supernatural'];
  const statuses = ['all', 'ongoing', 'completed', 'hiatus'];
  const sortOptions = [
    { value: 'latest', label: 'Latest Update' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'chapters', label: 'Most Chapters' }
  ];
  const filteredAndSortedMangas = mangas
    .filter(manga => {
      const matchesSearch = manga.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           manga.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenres = selectedGenres.length === 0 || 
                           selectedGenres.some(genre => manga.genres?.includes(genre));
      const matchesStatus = selectedStatus === 'all' || 
                           manga.status?.toLowerCase() === selectedStatus;
      
      return matchesSearch && matchesGenres && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'chapters':
          return (b.chapters || 0) - (a.chapters || 0);
        default:
          return 0;
      }
    });

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGenres([]);
    setSelectedStatus('all');
    setSortBy('latest');
  };

  const hasActiveFilters = searchTerm || selectedGenres.length > 0 || selectedStatus !== 'all';

  if (loading) {
    return (
      <div className="manga-grid-container">
        <div className="manga-grid-header">
          <h2 className="section-title">{title || 'Manga'}</h2>
        </div>
        <div className={`manga-grid ${viewMode}`}>
          {[...Array(12)].map((_, index) => (
            <div key={index} className="manga-card loading">
              <div className="manga-image-container">
                <div className="image-skeleton"></div>
              </div>
              <div className="manga-content">
                <div className="title-skeleton"></div>
                <div className="description-skeleton"></div>
                <div className="meta-skeleton"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="manga-grid-container">
      <div className="manga-grid-header">
        <div className="header-left">
          <h2 className="section-title">{title || 'Manga'}</h2>
          <span className="manga-count">
            ({filteredAndSortedMangas.length} {filteredAndSortedMangas.length === 1 ? 'item' : 'items'})
          </span>
        </div>

        {showFilters && (
          <div className="header-controls">
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search manga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid size={18} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
            <div className="sort-dropdown">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="dropdown-icon" />
            </div>
            <button
              className={`filter-toggle ${showFilterPanel ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <Filter size={18} />
              Filters
              {hasActiveFilters && <span className="filter-dot"></span>}
            </button>
          </div>
        )}
      </div>
      {showFilters && showFilterPanel && (
        <div className="filter-panel">
          <div className="filter-section">
            <h4>Genres</h4>
            <div className="genre-filters">
              {genres.map(genre => (
                <button
                  key={genre}
                  className={`genre-filter ${selectedGenres.includes(genre) ? 'active' : ''}`}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4>Status</h4>
            <div className="status-filters">
              {statuses.map(status => (
                <button
                  key={status}
                  className={`status-filter ${selectedStatus === status ? 'active' : ''}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filter-actions">
              <button className="clear-filters" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
      {filteredAndSortedMangas.length === 0 ? (
        <div className="no-results">
          <h3>No manga found</h3>
          <p>Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className={`manga-grid ${viewMode}`}>
          {filteredAndSortedMangas.map(manga => (
            <MangaCard 
              key={manga.id} 
              manga={manga}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MangaGrid;