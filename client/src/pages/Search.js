// src/pages/Search.js
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { mangaAPI } from "../services/Api";
import MangaGrid from "../Components/manga/MangaGrid";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function SearchPage() {
  const q = useQuery().get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      const query = q.trim();
      if (!query) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const res = await mangaAPI.getAll({ search: query });
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Search failed", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [q]);

  return (
    <div style={{ padding: "30px 16px", maxWidth: 1400, margin: "0 auto" }}>
      <h2 style={{ color: "white", marginBottom: 12 }}>
        Search results for: <span style={{ color: "#ef4444" }}>{q}</span>
      </h2>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,.7)" }}>Searching...</div>
      ) : (
        <MangaGrid mangas={results} title="" showFilters={false} />
      )}

      {!loading && q.trim() && results.length === 0 && (
        <div style={{ color: "rgba(255,255,255,.7)", marginTop: 14 }}>
          No manga found.
        </div>
      )}
    </div>
  );
}
