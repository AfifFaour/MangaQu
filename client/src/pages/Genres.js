import React, { useEffect, useMemo, useState } from "react";
import MangaGrid from "../Components/manga/MangaGrid";
import api from "../services/Api";
import "../styles/Pages.css";

const Genres = () => {
  const [allMangas, setAllMangas] = useState([]);
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedGenre, setSelectedGenre] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState(null);

  // chapterCount map: { [mangaId]: number }
  const [chapterCounts, setChapterCounts] = useState({});

  // Keep your UI list (you can add/remove anytime)
  const genres = useMemo(
    () => [
      { value: "all", label: "All Genres" },
      { value: "action", label: "Action" },
      { value: "adventure", label: "Adventure" },
      { value: "comedy", label: "Comedy" },
      { value: "drama", label: "Drama" },
      { value: "fantasy", label: "Fantasy" },
      { value: "horror", label: "Horror" },
      { value: "romance", label: "Romance" },
      { value: "sci-fi", label: "Sci-Fi" },
      { value: "shounen", label: "Shounen" },
      { value: "shojo", label: "Shojo" },
      { value: "sports", label: "Sports" },
      { value: "supernatural", label: "Supernatural" },
    ],
    []
  );

  const getGenreLabel = (value) =>
    genres.find((g) => g.value === value)?.label || "All Genres";

  // Normalize manga genres from whatever format you store
  const normalizeGenres = (manga) => {
    // 1) If backend returns array: ["action","drama"]
    if (Array.isArray(manga.genres)) {
      return manga.genres.map((g) => String(g).toLowerCase().trim());
    }

    // 2) If backend returns comma string: "Action, Drama"
    if (typeof manga.genres === "string") {
      return manga.genres
        .split(",")
        .map((g) => g.toLowerCase().trim())
        .filter(Boolean);
    }

    // 3) If you have a column called genre
    if (typeof manga.genre === "string") {
      return manga.genre
        .split(",")
        .map((g) => g.toLowerCase().trim())
        .filter(Boolean);
    }

    // 4) If you have genres_text
    if (typeof manga.genres_text === "string") {
      return manga.genres_text
        .split(",")
        .map((g) => g.toLowerCase().trim())
        .filter(Boolean);
    }

    return [];
  };

  // Fetch all manga once
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        // Your Browse.js uses /manga, so keep it consistent
        const res = await api.get("/manga");
        const list = Array.isArray(res.data) ? res.data : [];
        setAllMangas(list);
      } catch (err) {
        console.error(err);
        setError("Failed to load manga");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Apply genre filter + sorting
  useEffect(() => {
    let list = [...allMangas];

    // Filter by genre (client-side)
    if (selectedGenre !== "all") {
      list = list.filter((m) => normalizeGenres(m).includes(selectedGenre));
    }

    // Sort (client-side)
    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else if (sortBy === "popular") {
      list.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    } else if (sortBy === "rating") {
      list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    setMangas(list);
  }, [allMangas, selectedGenre, sortBy]);

  // Only when "Most Chapters" selected, fetch counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (sortBy !== "chapters") return;

      try {
        setLoading(true);

        // We count chapters for currently filtered mangas only
        const ids = mangas.map((m) => m.id);

        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await api.get(`/manga/${id}/chapters`);
              return [id, Array.isArray(res.data) ? res.data.length : 0];
            } catch {
              return [id, 0];
            }
          })
        );

        const map = {};
        results.forEach(([id, count]) => (map[id] = count));
        setChapterCounts(map);

        // Sort mangas by chapters count descending
        setMangas((prev) =>
          [...prev].sort(
            (a, b) => (map[b.id] || 0) - (map[a.id] || 0)
          )
        );
      } catch (e) {
        console.error(e);
        setError("Failed to load chapter counts");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Manga Genres</h1>
        <p>Explore manga by your favorite genres</p>

        <div className="filter-controls">
          <div className="genre-filters">
            {genres.map((g) => (
              <button
                key={g.value}
                className={`genre-filter ${selectedGenre === g.value ? "active" : ""}`}
                onClick={() => setSelectedGenre(g.value)}
                type="button"
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="sort-options">
            <button
              type="button"
              className={`sort-option ${sortBy === "newest" ? "active" : ""}`}
              onClick={() => setSortBy("newest")}
            >
              Newest
            </button>
            <button
              type="button"
              className={`sort-option ${sortBy === "popular" ? "active" : ""}`}
              onClick={() => setSortBy("popular")}
            >
              Most Popular
            </button>
            <button
              type="button"
              className={`sort-option ${sortBy === "rating" ? "active" : ""}`}
              onClick={() => setSortBy("rating")}
            >
              Highest Rated
            </button>
            <button
              type="button"
              className={`sort-option ${sortBy === "chapters" ? "active" : ""}`}
              onClick={() => setSortBy("chapters")}
            >
              Most Chapters
            </button>
          </div>
        </div>
      </div>

      <MangaGrid
        mangas={mangas}
        title={
          selectedGenre === "all"
            ? "All Genres"
            : `${getGenreLabel(selectedGenre)} Manga`
        }
        loading={loading}
        showFilters={false}
        emptyMessage={`No ${getGenreLabel(selectedGenre).toLowerCase()} manga found.`}
        // Optional: if MangaGrid supports it later, you can pass counts:
        // chapterCounts={chapterCounts}
      />
    </div>
  );
};

export default Genres;
