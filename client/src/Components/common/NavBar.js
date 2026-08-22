// src/Components/nav/NavBar.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_ORIGIN } from "../../services/Api";
import logo from "../../Assets/MangaQuLogo.png";
import "../../styles/NavBar.css";

import ReorderIcon from "@mui/icons-material/Reorder";
import {
  Search, User, LogOut, Heart, Clock, Sparkles, X,
  LayoutDashboard, ChevronDown,
} from "lucide-react";

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const API_BASE = API_ORIGIN;
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileTypesOpen, setMobileTypesOpen] = useState(false);
  const [mobileGenresOpen, setMobileGenresOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSug, setLoadingSug] = useState(false);

  const navRef = useRef(null);
  const userMenuRef = useRef(null);
  const sugBoxRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const types = ["Manga", "Manhwa", "Manhua", "One Shot", "Novel", "Doujinshi"];
  const genres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Shounen", "Shojo", "Sports", "Supernatural"];

  const closeAll = () => {
    setMenuOpen(false);
    setActiveDropdown(null);
    setUserDropdown(false);
    setMobileTypesOpen(false);
    setMobileGenresOpen(false);
    setShowSuggestions(false);
  };

  const handleLogout = () => {
    logout();
    closeAll();
  };

  const coverUrl = (coverPath) => {
    const p = String(coverPath || "").trim();
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    return `${API_BASE}/${p.replace(/^\/+/, "")}`;
  };

  const goToManga = (id) => {
    if (!id) return;
    navigate(`/manga/${id}`);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    closeAll();
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      try {
        setLoadingSug(true);
        const res = await fetch(`${API_BASE}/api/manga?search=${encodeURIComponent(q)}&sort=updated`, { signal: abortRef.current.signal });
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
        setShowSuggestions(true);
      } catch (e) {
        if (e?.name !== "AbortError") {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setLoadingSug(false);
      }
    }, 250);

    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchQuery, API_BASE]);

  useEffect(() => {
    closeAll();
  }, [location.pathname]);

  useEffect(() => {
    const onDocClick = (e) => {
      const insideNav = navRef.current?.contains(e.target);
      const insideUser = userMenuRef.current?.contains(e.target);
      const insideSug = sugBoxRef.current?.contains(e.target);
      if (!insideNav) setActiveDropdown(null);
      if (!insideUser) setUserDropdown(false);
      if (!insideSug) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && closeAll();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onSearchEnter = () => suggestions.length && goToManga(suggestions[0].id);

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-container">
        <button className="menu-toggle" onClick={() => setMenuOpen((p) => !p)} aria-label="Menu">
          {menuOpen ? <X size={20} /> : <ReorderIcon style={{ fontSize: 28 }} />}
        </button>

        <Link to="/" className="navbar-left" onClick={closeAll}>
          <img src={logo} alt="MangaQu Logo" className="navbar-logo" />
        </Link>

        <div className="navbar-links">
          <Link to="/newest" className="nav-link" onClick={closeAll}><Sparkles size={16} /> Newest</Link>
          <Link to="/updated" className="nav-link" onClick={closeAll}><Clock size={16} /> Updated</Link>

          <div className="nav-dropdown">
            <button type="button" className="nav-link nav-link-btn" onClick={(e) => { e.stopPropagation(); setActiveDropdown((p) => p === "types" ? null : "types"); }} aria-expanded={activeDropdown === "types"}>Types <ChevronDown size={16} /></button>
            {activeDropdown === "types" && <div className="dropdown-menu">{types.map((t) => <Link key={t} to={`/types/${t.toLowerCase()}`} onClick={closeAll}>{t}</Link>)}</div>}
          </div>

          <div className="nav-dropdown">
            <button type="button" className="nav-link nav-link-btn" onClick={(e) => { e.stopPropagation(); setActiveDropdown((p) => p === "genres" ? null : "genres"); }} aria-expanded={activeDropdown === "genres"}>Genres <ChevronDown size={16} /></button>
            {activeDropdown === "genres" && <div className="dropdown-menu genres-grid">{genres.map((g) => <Link key={g} to={`/genres/${g.toLowerCase()}`} onClick={closeAll}>{g}</Link>)}</div>}
          </div>

          {isAuthenticated() && <Link to="/favorite" className="nav-link" onClick={closeAll}><Heart size={16} /> Favorite</Link>}
        </div>

        <div className="search-container" ref={sugBoxRef}>
          <Search size={18} className="search-icon" />
          <input className="search-input" placeholder="Search manga..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => suggestions.length && setShowSuggestions(true)} onKeyDown={(e) => { if (e.key === "Enter") onSearchEnter(); if (e.key === "Escape") setShowSuggestions(false); }} />
          {searchQuery && <button type="button" className="clear-search" onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }} aria-label="Clear"><X size={16} /></button>}
          {showSuggestions && <div className="search-suggestions" role="listbox">
            {loadingSug && <div className="sug-item muted">Loading…</div>}
            {!loadingSug && suggestions.length === 0 && <div className="sug-item muted">No results</div>}
            {!loadingSug && suggestions.map((m) => <button key={m.id} type="button" className="sug-item" onClick={() => goToManga(m.id)}>
              <div className="sug-left"><img className="sug-cover" src={coverUrl(m.cover_image)} alt={m.title} onError={(e) => { e.currentTarget.style.display = "none"; }} /><div className="sug-text"><span className="sug-title">{m.title}</span>{m.type ? <span className="sug-sub">{m.type}</span> : null}</div></div>
              {m.status ? <span className="sug-meta">{m.status}</span> : null}
            </button>)}
          </div>}
        </div>

        {isAuthenticated() ? (
          <div className="user-menu-container" ref={userMenuRef}>
            <button type="button" className="user-menu-toggle" onClick={() => setUserDropdown((p) => !p)} aria-expanded={userDropdown}>
              <div className="user-avatar">{user?.username?.charAt(0)?.toUpperCase()}</div>
              <span className="user-name">{user?.username}</span>
              {isAdmin() && <span className="user-badge">ADMIN</span>}
            </button>
            {userDropdown && <div className="user-dropdown-menu">
              <Link to="/profile" className="dropdown-item" onClick={closeAll}><User size={16} /> Profile</Link>
              <Link to="/favorite" className="dropdown-item" onClick={closeAll}><Heart size={16} /> Favorites</Link>
              {isAdmin() && <Link to="/dashboard" className="dropdown-item" onClick={closeAll}><LayoutDashboard size={16} /> Dashboard</Link>}
              <div className="dropdown-divider" />
              <button type="button" className="dropdown-item logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
            </div>}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" onClick={closeAll}>Login</Link>
            <Link to="/signup" onClick={closeAll}>Sign Up</Link>
          </div>
        )}
      </div>

      {menuOpen && <div className="mobile-menu-overlay" onClick={closeAll}>
        <aside className="mobile-menu-content left" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-top"><span className="mobile-title">Menu</span><button type="button" className="mobile-close" onClick={closeAll} aria-label="Close"><X size={18} /></button></div>

          <div className="mobile-search">
            <Search size={18} className="mobile-search-icon" />
            <input className="mobile-search-input" placeholder="Search manga..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearchEnter()} />
            {searchQuery && <button type="button" className="mobile-clear" onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }} aria-label="Clear"><X size={16} /></button>}
            <button type="button" className="mobile-search-btn" onClick={onSearchEnter}>Go</button>
          </div>

          {isAuthenticated() && <div className="mobile-user"><div className="user-avatar">{user?.username?.charAt(0)?.toUpperCase()}</div><div className="mobile-user-text"><div className="mobile-user-name">{user?.username}</div>{isAdmin() && <div className="mobile-user-badge">ADMIN</div>}</div></div>}

          <nav className="mobile-links">
            <Link to="/newest" className="mobile-link" onClick={closeAll}><Sparkles size={18} /> Newest</Link>
            <Link to="/updated" className="mobile-link" onClick={closeAll}><Clock size={18} /> Updated</Link>

            <button type="button" className="mobile-link mobile-subtoggle" onClick={() => setMobileTypesOpen((p) => !p)}><span className="mobile-subtoggle-left">Types</span><ChevronDown size={18} className={mobileTypesOpen ? "rot" : ""} /></button>
            {mobileTypesOpen && <div className="mobile-submenu">{types.map((t) => <Link key={t} to={`/types/${t.toLowerCase()}`} onClick={closeAll}>{t}</Link>)}</div>}

            <button type="button" className="mobile-link mobile-subtoggle" onClick={() => setMobileGenresOpen((p) => !p)}><span className="mobile-subtoggle-left">Genres</span><ChevronDown size={18} className={mobileGenresOpen ? "rot" : ""} /></button>
            {mobileGenresOpen && <div className="mobile-submenu">{genres.map((g) => <Link key={g} to={`/genres/${g.toLowerCase()}`} onClick={closeAll}>{g}</Link>)}</div>}

            {isAuthenticated() ? <>
              <Link to="/profile" className="mobile-link" onClick={closeAll}><User size={18} /> Profile</Link>
              <Link to="/favorite" className="mobile-link" onClick={closeAll}><Heart size={18} /> Favorites</Link>
              {isAdmin() && <Link to="/dashboard" className="mobile-link" onClick={closeAll}><LayoutDashboard size={18} /> Dashboard</Link>}
              <button type="button" className="mobile-link logout" onClick={handleLogout}><LogOut size={18} /> Logout</button>
            </> : <div className="mobile-auth">
              <Link to="/login" className="mobile-auth-btn login" onClick={closeAll}>Login</Link>
              <Link to="/signup" className="mobile-auth-btn signup" onClick={closeAll}>Sign Up</Link>
            </div>}
          </nav>
        </aside>
      </div>}
    </nav>
  );
}
