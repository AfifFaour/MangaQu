import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../Assets/MangaQuLogo.png";
import "../../styles/NavBar.css";
import ReorderIcon from "@mui/icons-material/Reorder";
import { Search, User, LogOut, Heart, Clock, Sparkles, X } from "lucide-react";
import api from "../../services/Api";

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const closeMenu = () => {
    setMenuOpen(false);
    setActiveDropdown(null);
    setShowSearchResults(false);
  };

  const toggleDropdown = (dropdown, e) => {
    e?.stopPropagation();
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
    setShowSearchResults(false);
  };

  /* ===================== */
  /* DATABASE SEARCH LOGIC */
  /* ===================== */

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const controller = new AbortController();

    const fetchSearchResults = async () => {
      try {
        setSearchLoading(true);
        setShowSearchResults(true);

        const res = await api.get("/manga/search", {
          params: { q: searchQuery },
          signal: controller.signal
        });

        setSearchResults(res.data || []);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Search failed", err);
          setSearchResults([]);
        }
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(fetchSearchResults, 300);

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearchResults(false);
      closeMenu();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  useEffect(() => {
    const closeOnOutsideClick = () => {
      setActiveDropdown(null);
      setShowSearchResults(false);
    };
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, []);

  const types = ["Manga", "Manhwa", "Manhua", "One Shot", "Novel", "Doujinshi"];
  const genres = [
    "Action","Adventure","Comedy","Drama","Fantasy","Horror",
    "Romance","Sci-Fi","Shounen","Shojo","Sports","Supernatural"
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" onClick={closeMenu}>
          <img src={logo} alt="MangaQu Logo" className="navbar-logo" />
        </Link>

        <button className="menu-toggle" onClick={toggleMenu}>
          {menuOpen ? "✖" : <ReorderIcon style={{ fontSize: 32 }} />}
        </button>

        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <Link to="/newest" className="nav-link"><Sparkles size={16}/>Newest</Link>
          <Link to="/updated" className="nav-link"><Clock size={16}/>Updated</Link>

          <div className="nav-dropdown">
            <button className="nav-link" onClick={(e)=>toggleDropdown("types",e)}>
              Types
            </button>
            {activeDropdown === "types" && (
              <div className="dropdown-menu">
                {types.map(t => (
                  <Link key={t} to={`/types/${t.toLowerCase()}`} onClick={closeMenu}>
                    {t}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="nav-dropdown">
            <button className="nav-link" onClick={(e)=>toggleDropdown("genres",e)}>
              Genres
            </button>
            {activeDropdown === "genres" && (
              <div className="dropdown-menu genres-grid">
                {genres.map(g => (
                  <Link key={g} to={`/genres/${g.toLowerCase()}`} onClick={closeMenu}>
                    {g}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/favorites" className="nav-link">
            <Heart size={16}/>Favorite
          </Link>
        </div>

        {/* SEARCH */}
        <div
          className="search-container"
          onClick={(e) => e.stopPropagation()}
        >
          <Search size={20} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search manga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <button className="clear-search" onClick={clearSearch}>
              <X size={16} />
            </button>
          )}

          {showSearchResults && (
            <div className="search-results">
              {searchLoading ? (
                <div className="search-no-results">Searching...</div>
              ) : searchResults.length ? (
                searchResults.slice(0, 5).map(manga => (
                  <Link
                    key={manga._id}
                    to={`/manga/${manga._id}`}
                    className="search-result-item"
                    onClick={clearSearch}
                  >
                    <div className="search-result-title">{manga.title}</div>
                    <div className="search-result-meta">
                      <span>{manga.type}</span>
                      {manga.chapters && <span>{manga.chapters} ch</span>}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="search-no-results">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>

        {/* AUTH */}
        {isLoggedIn ? (
          <div className="user-menu">
            <Link to="/admin"><User size={20} /></Link>
            <button onClick={()=>setIsLoggedIn(false)}><LogOut size={20}/></button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
