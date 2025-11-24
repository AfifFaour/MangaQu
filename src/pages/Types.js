import React, { useState, useEffect } from 'react';
import MangaGrid from '../Components/manga/MangaGrid';
import { getMangaByType, mangaData } from '../pages/mangaData';
import '../styles/Pages.css';

const Types = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'manga', label: 'Manga' },
    { value: 'manhwa', label: 'Manhwa' },
    { value: 'manhua', label: 'Manhua' },
    { value: 'one shot', label: 'One Shot' },
    { value: 'novel', label: 'Novel' },
    { value: 'doujinshi', label: 'Doujinshi' }
  ];

  useEffect(() => {
    setTimeout(() => {
      let filteredMangas = selectedType === 'all' 
        ? mangaData 
        : getMangaByType(selectedType);
  
      if (sortBy === 'newest') {
        filteredMangas.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      } else if (sortBy === 'popular') {
        filteredMangas.sort((a, b) => b.views - a.views);
      } else if (sortBy === 'rating') {
        filteredMangas.sort((a, b) => b.rating - a.rating);
      }
      
      setMangas(filteredMangas);
      setLoading(false);
    }, 800);
  }, [selectedType, sortBy]);

  const getTypeDisplayName = (type) => {
    const typeObj = types.find(t => t.value === type);
    return typeObj ? typeObj.label : 'All Types';
  };

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
                className={`type-filter ${selectedType === type.value ? 'active' : ''}`}
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
        title={selectedType === 'all' ? 'All Manga Types' : `${getTypeDisplayName(selectedType)} Manga`}
        loading={loading}
        showFilters={false}
        emptyMessage={`No ${getTypeDisplayName(selectedType).toLowerCase()} manga found.`}
      />
    </div>
  );
};

export default Types;
