// src/pages/Updated.js
import React, { useEffect, useMemo, useState } from "react";
import MangaGrid from "../Components/manga/MangaGrid";
import api from "../services/Api"; // axios instance with baseURL = http://localhost:5001/api
import "../styles/Pages.css";

const Updated = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recently-updated");
  const [error, setError] = useState("");

  // Map UI sort -> server sort param
  const serverSort = useMemo(() => {
    if (sortBy === "popular") return "popular";
    if (sortBy === "highest-rated") return "rating";
    return "updated";
  }, [sortBy]);

  useEffect(() => {
    let alive = true;

    const fetchUpdatedManga = async () => {
      try {
        setLoading(true);
        setError("");

        // ✅ uses your server: GET /api/manga?sort=updated|popular|rating
        const res = await api.get(`/manga`, {
          params: { sort: serverSort },
        });

        if (!alive) return;

        setMangas(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!alive) return;
        setMangas([]);
        setError(err?.response?.data?.error || "Failed to load updated manga");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    fetchUpdatedManga();

    return () => {
      alive = false;
    };
  }, [serverSort]);

  const pageTitle =
    sortBy === "popular"
      ? "Updated Manga (Most Popular)"
      : sortBy === "highest-rated"
      ? "Updated Manga (Highest Rated)"
      : "Updated Manga (Latest Updates)";

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Updated Manga</h1>
        <p>Recently updated manga with new chapters and content</p>

        <div className="sort-options">
          <button
            type="button"
            className={`sort-option ${sortBy === "recently-updated" ? "active" : ""}`}
            onClick={() => setSortBy("recently-updated")}
          >
            Recently Updated
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
            className={`sort-option ${sortBy === "highest-rated" ? "active" : ""}`}
            onClick={() => setSortBy("highest-rated")}
          >
            Highest Rated
          </button>
        </div>

        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      <MangaGrid mangas={mangas} title={pageTitle} loading={loading} showFilters />
    </div>
  );
};

export default Updated;
