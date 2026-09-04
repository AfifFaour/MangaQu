import React, { useEffect, useMemo, useState } from "react";
import MangaGrid from "../Components/manga/MangaGrid";
import api from "../services/Api";
import "../styles/Pages.css";

const Newest = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/manga");
        setMangas(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load newest manga");
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, []);

  const sortedManga = useMemo(() => {
    const copy = [...mangas];

    if (sortBy === "recently-added") {
      copy.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else {
      copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return copy;
  }, [mangas, sortBy]);

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Newest Manga</h1>
        <p>Discover the latest manga added to the library</p>

        <div className="sort-options">
          <button
            className={`sort-option ${sortBy === "newest" ? "active" : ""}`}
            onClick={() => setSortBy("newest")}
          >
            Newest Releases
          </button>

          <button
            className={`sort-option ${sortBy === "recently-added" ? "active" : ""}`}
            onClick={() => setSortBy("recently-added")}
          >
            Recently Updated
          </button>
        </div>
      </div>

      <MangaGrid
        mangas={sortedManga}
        title={sortBy === "recently-added" ? "Recently Updated" : "Newest Releases"}
        loading={loading}
        showFilters={true}
      />
    </div>
  );
};

export default Newest;
