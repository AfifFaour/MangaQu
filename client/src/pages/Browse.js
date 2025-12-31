// src/pages/Browse.js
import React, { useEffect, useState } from "react";
import MangaGrid from "../Components/manga/MangaGrid";
import api from "../services/Api";
import "../styles/Browse.css";

const Browse = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const fetchManga = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/manga");
        if (!alive) return;

        setMangas(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load manga list");
        setMangas([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    fetchManga();

    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="browse-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Browse All Manga</h1>
        <p>Discover manga from your library</p>
      </div>

      <MangaGrid mangas={mangas} title="All Manga" loading={loading} showFilters />
    </div>
  );
};

export default Browse;
