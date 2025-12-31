// src/Components/manga/MangaGrid.js
import React, { useState } from "react";
import MangaCard from "../common/mangaCard"; // ✅ FIX: correct casing/path
import { Grid, List, Filter, Search, X } from "lucide-react";
import "../../styles/MangaGrid.css";

const MangaGrid = ({ mangas = [], title, loading = false, showFilters = true, emptyMessage }) => {
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("latest");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const genres = ["Action","Adventure","Comedy","Drama","Fantasy","Horror","Romance","Sci-Fi","Shounen","Shojo","Sports","Supernatural"];
  const statuses = ["all", "ongoing", "completed", "hiatus", "cancelled"];

  const sortOptions = [
    { value: "latest", label: "Latest Update" },
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "title", label: "Title A-Z" },
    { value: "chapters", label: "Most Chapters" },
  ];

  const filteredAndSortedMangas = (mangas || [])
    .filter((manga) => {
      const t = (manga.title || "").toLowerCase();
      const d = (manga.description || "").toLowerCase();

      const matchesSearch =
        t.includes(searchTerm.toLowerCase()) || d.includes(searchTerm.toLowerCase());

      const mangaGenres = Array.isArray(manga.genres)
        ? manga.genres
        : (manga.genres || "").split(",").map((x) => x.trim()).filter(Boolean);

      const matchesGenres =
        selectedGenres.length === 0 || selectedGenres.some((g) => mangaGenres.includes(g));

      const matchesStatus =
        selectedStatus === "all" || String(manga.status || "").toLowerCase() === selectedStatus;

      return matchesSearch && matchesGenres && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0);
        case "popular":
          return (b.views || 0) - (a.views || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "chapters":
          return (b.chaptersCount || b.chapters || 0) - (a.chaptersCount || a.chapters || 0);
        default:
          return 0;
      }
    });

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGenres([]);
    setSelectedStatus("all");
    setSortBy("latest");
  };

  const hasActiveFilters = searchTerm || selectedGenres.length > 0 || selectedStatus !== "all";

  if (loading) {
    return (
      <div className="manga-grid-container">
        <h2>{title || "Manga"}</h2>
        <div className="manga-grid grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="manga-card loading" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="manga-grid-container">
      <div className="manga-grid-header">
        <h2 className="section-title">
          {title} ({filteredAndSortedMangas.length})
        </h2>

        {showFilters && (
          <div className="header-controls">
            <div className="search-container">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search manga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="view-toggle">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>
                <Grid size={18} />
              </button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>
                <List size={18} />
              </button>
            </div>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button onClick={() => setShowFilterPanel(!showFilterPanel)}>
              <Filter size={18} />
            </button>
          </div>
        )}
      </div>

      {showFilters && showFilterPanel && (
        <div className="filter-panel">
          <h4>Genres</h4>
          {genres.map((g) => (
            <button key={g} className={selectedGenres.includes(g) ? "active" : ""} onClick={() => toggleGenre(g)}>
              {g}
            </button>
          ))}

          <h4>Status</h4>
          {statuses.map((s) => (
            <button key={s} className={selectedStatus === s ? "active" : ""} onClick={() => setSelectedStatus(s)}>
              {s}
            </button>
          ))}

          {hasActiveFilters && <button onClick={clearFilters}>Clear Filters</button>}
        </div>
      )}

      {filteredAndSortedMangas.length === 0 ? (
        <div className="no-results">
          <p>{emptyMessage || "No manga found"}</p>
        </div>
      ) : (
        <div className={`manga-grid ${viewMode}`}>
          {filteredAndSortedMangas.map((manga) => (
            <MangaCard key={manga.id} manga={manga} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MangaGrid;
