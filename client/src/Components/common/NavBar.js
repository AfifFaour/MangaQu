import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../Assets/MangaQuLogo.png";
import "../../styles/NavBar.css";

import ReorderIcon from "@mui/icons-material/Reorder";
import {
  Search,
  User,
  LogOut,
  Heart,
  Clock,
  Sparkles,
  X,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  // desktop dropdowns
  const [activeDropdown, setActiveDropdown] = useState(null); // "types" | "genres" | null
  const [userDropdown, setUserDropdown] = useState(false);

  // mobile drawer submenus
  const [mobileTypesOpen, setMobileTypesOpen] = useState(false);
  const [mobileGenresOpen, setMobileGenresOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const navRef = useRef(null);
  const userMenuRef = useRef(null);

  const types = ["Manga", "Manhwa", "Manhua", "One Shot", "Novel", "Doujinshi"];
  const genres = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Fantasy",
    "Horror",
    "Romance",
    "Sci-Fi",
    "Shounen",
    "Shojo",
    "Sports",
    "Supernatural",
  ];

  const closeAll = () => {
    setMenuOpen(false);
    setActiveDropdown(null);
    setUserDropdown(false);
    setMobileTypesOpen(false);
    setMobileGenresOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeAll();
  };

  const goSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchQuery("");
    closeAll();
  };

  // ✅ close everything on route change
  useEffect(() => {
    closeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ✅ click outside closes dropdowns
  useEffect(() => {
    const onDocClick = (e) => {
      const insideNav = navRef.current?.contains(e.target);
      const insideUser = userMenuRef.current?.contains(e.target);

      if (!insideNav) setActiveDropdown(null);
      if (!insideUser) setUserDropdown(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ✅ ESC closes drawer
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isSearchPage = location.pathname === "/search";

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-container">
        {/* MOBILE: hamburger left */}
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((p) => !p)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={20} /> : <ReorderIcon style={{ fontSize: 28 }} />}
        </button>

        {/* DESKTOP LOGO (hidden on mobile via CSS) */}
        <Link to="/" className="navbar-left" onClick={closeAll}>
          <img src={logo} alt="MangaQu Logo" className="navbar-logo" />
        </Link>

        {/* DESKTOP LINKS */}
        <div className="navbar-links">
          <Link to="/newest" className="nav-link" onClick={closeAll}>
            <Sparkles size={16} /> Newest
          </Link>

          <Link to="/updated" className="nav-link" onClick={closeAll}>
            <Clock size={16} /> Updated
          </Link>

          <div className="nav-dropdown">
            <button
              className="nav-link"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown((p) => (p === "types" ? null : "types"));
              }}
              aria-expanded={activeDropdown === "types"}
            >
              Types <ChevronDown size={16} />
            </button>

            {activeDropdown === "types" && (
              <div className="dropdown-menu">
                {types.map((t) => (
                  <Link
                    key={t}
                    to={`/types/${t.toLowerCase()}`}
                    onClick={closeAll}
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="nav-dropdown">
            <button
              className="nav-link"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown((p) => (p === "genres" ? null : "genres"));
              }}
              aria-expanded={activeDropdown === "genres"}
            >
              Genres <ChevronDown size={16} />
            </button>

            {activeDropdown === "genres" && (
              <div className="dropdown-menu genres-grid">
                {genres.map((g) => (
                  <Link
                    key={g}
                    to={`/genres/${g.toLowerCase()}`}
                    onClick={closeAll}
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated() && (
            <Link to="/favorite" className="nav-link" onClick={closeAll}>
              <Heart size={16} /> Favorite
            </Link>
          )}

          {/* ✅ Search page link */}
          <Link
            to="/search"
            className={`nav-link ${isSearchPage ? "active" : ""}`}
            onClick={closeAll}
          >
            <Search size={16} /> Search
          </Link>
        </div>

        {/* DESKTOP SEARCH INPUT */}
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search manga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goSearch()}
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery("")}
              aria-label="Clear"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* AUTH */}
        {isAuthenticated() ? (
          <div className="user-menu-container" ref={userMenuRef}>
            <button
              className="user-menu-toggle"
              onClick={() => setUserDropdown((p) => !p)}
              aria-expanded={userDropdown}
            >
              <div className="user-avatar">
                {user?.username?.charAt(0)?.toUpperCase()}
              </div>
              <span className="user-name">{user?.username}</span>
              {isAdmin() && <span className="user-badge">ADMIN</span>}
            </button>

            {userDropdown && (
              <div className="user-dropdown-menu">
                <Link to="/profile" className="dropdown-item" onClick={closeAll}>
                  <User size={16} /> Profile
                </Link>

                <Link to="/favorite" className="dropdown-item" onClick={closeAll}>
                  <Heart size={16} /> Favorites
                </Link>

                {isAdmin() && (
                  <Link
                    to="/dashboard"
                    className="dropdown-item"
                    onClick={closeAll}
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                )}

                <div className="dropdown-divider" />

                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" onClick={closeAll}>
              Login
            </Link>
            <Link to="/signup" onClick={closeAll}>
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* ✅ MOBILE LEFT DRAWER */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={closeAll}>
          <aside
            className="mobile-menu-content left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-top">
              <span className="mobile-title">Menu</span>
              <button
                className="mobile-close"
                onClick={closeAll}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* MOBILE SEARCH */}
            <div className="mobile-search">
              <Search size={18} className="mobile-search-icon" />
              <input
                className="mobile-search-input"
                placeholder="Search manga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goSearch()}
              />
              {searchQuery && (
                <button
                  className="mobile-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear"
                >
                  <X size={16} />
                </button>
              )}
              <button className="mobile-search-btn" onClick={goSearch}>
                Search
              </button>
            </div>

            {/* MOBILE USER */}
            {isAuthenticated() && (
              <div className="mobile-user">
                <div className="user-avatar">
                  {user?.username?.charAt(0)?.toUpperCase()}
                </div>
                <div className="mobile-user-text">
                  <div className="mobile-user-name">{user?.username}</div>
                  {isAdmin() && <div className="mobile-user-badge">ADMIN</div>}
                </div>
              </div>
            )}

            {/* MOBILE LINKS */}
            <nav className="mobile-links">
              <Link to="/newest" className="mobile-link" onClick={closeAll}>
                <Sparkles size={18} /> Newest
              </Link>

              <Link to="/updated" className="mobile-link" onClick={closeAll}>
                <Clock size={18} /> Updated
              </Link>

              {/* ✅ Search Page link in menu */}
              <Link to="/search" className="mobile-link" onClick={closeAll}>
                <Search size={18} /> Search
              </Link>

              {/* Types submenu */}
              <button
                className="mobile-link mobile-subtoggle"
                onClick={() => setMobileTypesOpen((p) => !p)}
              >
                <span className="mobile-subtoggle-left">Types</span>
                <ChevronDown
                  size={18}
                  className={mobileTypesOpen ? "rot" : ""}
                />
              </button>
              {mobileTypesOpen && (
                <div className="mobile-submenu">
                  {types.map((t) => (
                    <Link
                      key={t}
                      to={`/types/${t.toLowerCase()}`}
                      onClick={closeAll}
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              )}

              {/* Genres submenu */}
              <button
                className="mobile-link mobile-subtoggle"
                onClick={() => setMobileGenresOpen((p) => !p)}
              >
                <span className="mobile-subtoggle-left">Genres</span>
                <ChevronDown
                  size={18}
                  className={mobileGenresOpen ? "rot" : ""}
                />
              </button>
              {mobileGenresOpen && (
                <div className="mobile-submenu">
                  {genres.map((g) => (
                    <Link
                      key={g}
                      to={`/genres/${g.toLowerCase()}`}
                      onClick={closeAll}
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              )}

              {isAuthenticated() && (
                <>
                  <Link to="/profile" className="mobile-link" onClick={closeAll}>
                    <User size={18} /> Profile
                  </Link>

                  <Link
                    to="/favorite"
                    className="mobile-link"
                    onClick={closeAll}
                  >
                    <Heart size={18} /> Favorites
                  </Link>

                  {isAdmin() && (
                    <Link
                      to="/dashboard"
                      className="mobile-link"
                      onClick={closeAll}
                    >
                      <LayoutDashboard size={18} /> Dashboard
                    </Link>
                  )}

                  <button className="mobile-link logout" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                  </button>
                </>
              )}

              {!isAuthenticated() && (
                <div className="mobile-auth">
                  <Link
                    to="/login"
                    className="mobile-auth-btn login"
                    onClick={closeAll}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="mobile-auth-btn signup"
                    onClick={closeAll}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </aside>
        </div>
      )}
    </nav>
  );
}
