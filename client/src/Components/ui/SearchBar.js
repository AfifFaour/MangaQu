import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mangaAPI } from '../../services/Api';


const SearchBar = ({ 
  placeholder = "Search manga...",
  onSearch,
  showSuggestions = true,
  autoFocus = false,
  size = "medium",
  variant = "default",
  className = ""
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchRef = useRef(null);
  const debounceTimeout = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('mangaqu_search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing search history:', error);
      }
    }
  }, []);

  // Save search history
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('mangaqu_search_history', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await mangaAPI.search(searchQuery, { limit: 5 });
      const data = response.data || response;
      setSuggestions(data.manga || data.list || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout for debounce
    debounceTimeout.current = setTimeout(() => {
      if (showSuggestions) {
        fetchSuggestions(value);
      }
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Add to search history (if not already in history)
    if (!searchHistory.includes(trimmedQuery)) {
      const newHistory = [trimmedQuery, ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
    }

    // Call custom onSearch callback if provided
    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      // Default behavior: navigate to search page
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }

    // Clear input and close dropdown
    setQuery('');
    setShowDropdown(false);
  };

  const handleSuggestionClick = (manga) => {
    setQuery(manga.title);
    navigate(`/manga/${manga.id}`);
    setShowDropdown(false);
  };

  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem);
    if (onSearch) {
      onSearch(historyItem);
    } else {
      navigate(`/search?q=${encodeURIComponent(historyItem)}`);
    }
    setShowDropdown(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('mangaqu_search_history');
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    if (onSearch) {
      onSearch('');
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'search-bar-sm';
      case 'large': return 'search-bar-lg';
      default: return 'search-bar-md';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact': return 'search-bar-compact';
      case 'rounded': return 'search-bar-rounded';
      default: return 'search-bar-default';
    }
  };

  return (
    <div 
      className={`search-bar-container ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      ref={searchRef}
    >
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <i className="fas fa-search search-icon"></i>
          
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="search-input"
            aria-label="Search manga"
          />
          
          {query && (
            <button 
              type="button" 
              onClick={clearSearch}
              className="clear-button"
              aria-label="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
          
          <button 
            type="submit" 
            className="search-submit"
            aria-label="Submit search"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>

        {/* Dropdown with suggestions and history */}
        {showDropdown && showSuggestions && (
          <div className="search-dropdown">
            {/* Loading state */}
            {isLoading && (
              <div className="dropdown-loading">
                <div className="spinner-small"></div>
                <span>Searching...</span>
              </div>
            )}

            {/* Search suggestions */}
            {!isLoading && suggestions.length > 0 && (
              <div className="dropdown-section">
                <div className="section-header">
                  <h4>Suggestions</h4>
                </div>
                <div className="suggestions-list">
                  {suggestions.map((manga) => (
                    <div
                      key={manga.id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(manga)}
                    >
                      <img 
                        src={manga.coverImage || '/images/default-cover.png'} 
                        alt={manga.title}
                        className="suggestion-cover"
                      />
                      <div className="suggestion-details">
                        <h5 className="suggestion-title">{manga.title}</h5>
                        {manga.author && (
                          <p className="suggestion-author">{manga.author}</p>
                        )}
                        {manga.status && (
                          <span className={`suggestion-status ${manga.status}`}>
                            {manga.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search history */}
            {!isLoading && searchHistory.length > 0 && (
              <div className="dropdown-section">
                <div className="section-header">
                  <h4>Recent Searches</h4>
                  <button 
                    onClick={clearSearchHistory}
                    className="clear-history-btn"
                    type="button"
                  >
                    Clear all
                  </button>
                </div>
                <div className="history-list">
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className="history-item"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <i className="fas fa-history history-icon"></i>
                      <span className="history-text">{item}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchHistory(searchHistory.filter((_, i) => i !== index));
                        }}
                        className="remove-history-btn"
                        type="button"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {!isLoading && query.length >= 2 && suggestions.length === 0 && (
              <div className="no-results">
                <i className="fas fa-search"></i>
                <p>No manga found for "{query}"</p>
              </div>
            )}

            {/* Trending searches (optional) */}
            {!isLoading && query.length === 0 && (
              <div className="dropdown-section">
                <div className="section-header">
                  <h4>Trending Now</h4>
                </div>
                <div className="trending-tags">
                  {['Action', 'Romance', 'Fantasy', 'Comedy', 'Drama'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="trending-tag"
                      onClick={() => {
                        setQuery(tag);
                        if (onSearch) {
                          onSearch(tag);
                        } else {
                          navigate(`/search?q=${encodeURIComponent(tag)}`);
                        }
                        setShowDropdown(false);
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

// Alternative: Simple Search Bar (without suggestions)
export const SimpleSearchBar = ({ placeholder = "Search...", onSearch, className = "" }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    if (onSearch) {
      onSearch(query);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className={`simple-search-bar ${className}`}>
      <div className="simple-search-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="simple-search-input"
        />
        <button type="submit" className="simple-search-btn">
          <i className="fas fa-search"></i>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;