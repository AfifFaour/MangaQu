import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../Assets/MangaQuLogo.png";
import "../../styles/NavBar.css";
import ReorderIcon from "@mui/icons-material/Reorder";
import { Search, User, LogOut, Heart, Clock, Sparkles, X } from "lucide-react";
import { searchManga } from '../../pages/mangaData';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => {
    setMenuOpen(false);
    setActiveDropdown(null);
    setShowSearchResults(false);
  };

  const toggleDropdown = (dropdown, e) => {
    if (e) e.stopPropagation();
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
    setShowSearchResults(false);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearchResults(false);
      closeMenu();
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearchResults(false);
      closeMenu();
    }
  };

  const searchResults = searchManga(searchQuery);

  const types = ['Manga', 'Manhwa', 'Manhua', 'One Shot', 'Novel', 'Doujinshi'];
  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Shounen', 'Shojo', 'Sports', 'Supernatural'];

  React.useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
      setShowSearchResults(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" onClick={closeMenu}>
            <img src={logo} alt="MangaQu Logo" className="navbar-logo" />
          </Link>
        </div>
        <button className="menu-toggle" onClick={toggleMenu}>
          {menuOpen ? "✖" : <ReorderIcon style={{ fontSize: "32px" }} />}
        </button>

        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <Link 
            to="/newest" 
            onClick={closeMenu}
            className={location.pathname === '/newest' ? 'nav-link active' : 'nav-link'}
          >
            <Sparkles size={16} className="nav-icon" />
            Newest
          </Link>
          <Link 
            to="/updated" 
            onClick={closeMenu}
            className={location.pathname === '/updated' ? 'nav-link active' : 'nav-link'}
          >
            <Clock size={16} className="nav-icon" />
            Updated
          </Link>
          <div className="nav-dropdown">
            <button 
              className={`nav-link ${activeDropdown === 'types' ? 'active' : ''}`}
              onClick={(e) => toggleDropdown('types', e)}
            >
              Types
            </button>
            {activeDropdown === 'types' && (
              <div className="dropdown-menu">
                {types.map(type => (
                  <Link 
                    key={type} 
                    to={`/types/${type.toLowerCase()}`} 
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    {type}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="nav-dropdown">
            <button 
              className={`nav-link ${activeDropdown === 'genres' ? 'active' : ''}`}
              onClick={(e) => toggleDropdown('genres', e)}
            >
              Genres
            </button>
            {activeDropdown === 'genres' && (
              <div className="dropdown-menu genres-grid">
                {genres.map(genre => (
                  <Link 
                    key={genre} 
                    to={`/genres/${genre.toLowerCase()}`} 
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link 
            to="/favorites" 
            onClick={closeMenu}
            className={location.pathname === '/favorites' ? 'nav-link active' : 'nav-link'}
          >
            <Heart size={16} className="nav-icon" />
            Favorite
          </Link>
        </div>
        <div className="navbar-right">
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search manga..." 
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleSearch}
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button className="clear-search" onClick={clearSearch}>
                <X size={16} />
              </button>
            )}
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.slice(0, 5).map(result => (
                  <Link
                    key={result.id}
                    to={`/manga/${result.id}`}
                    className="search-result-item"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                      closeMenu();
                    }}
                  >
                    <div className="search-result-title">{result.title}</div>
                    <div className="search-result-meta">
                      <span>{result.type}</span>
                      {result.chapters && <span>{result.chapters} ch</span>}
                    </div>
                  </Link>
                ))}
                {searchResults.length > 5 && (
                  <div 
                    className="search-result-view-all"
                    onClick={handleSearchSubmit}
                  >
                    View all {searchResults.length} results for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
            {showSearchResults && searchQuery && searchResults.length === 0 && (
              <div className="search-results">
                <div className="search-no-results">
                  No results found for "{searchQuery}"
                </div>
              </div>
            )}
          </div>
          {isLoggedIn ? (
            <div className="user-menu">
              <Link to="/admin" className="user-btn">
                <User size={20} />
              </Link>
              <button 
                className="logout-btn"
                onClick={() => setIsLoggedIn(false)}
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/signup" className="signup-btn">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
      {menuOpen && (
        <div className="mobile-search">
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search manga..." 
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleSearch}
            />
            {searchQuery && (
              <button className="clear-search" onClick={clearSearch}>
                <X size={16} />
              </button>
            )}
            {/* Mobile search results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.slice(0, 3).map(result => (
                  <Link
                    key={result.id}
                    to={`/manga/${result.id}`}
                    className="search-result-item"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                      closeMenu();
                    }}
                  >
                    <div className="search-result-title">{result.title}</div>
                    <div className="search-result-meta">
                      <span>{result.type}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}