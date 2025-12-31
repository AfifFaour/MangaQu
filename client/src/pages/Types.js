import React, { useEffect, useMemo, useState } from "react";
import MangaGrid from "../Components/manga/MangaGrid";
import api, { mangaAPI } from "../services/Api";
import "../styles/Pages.css";

const Types = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState(null);

  const types = useMemo(
    () => [
      { value: "all", label: "All Types" },
      { value: "manga", label: "Manga" },
      { value: "manhwa", label: "Manhwa" },
      { value: "manhua", label: "Manhua" },
      { value: "one-shot", label: "One Shot" },
      { value: "novel", label: "Novel" },
      { value: "doujinshi", label: "Doujinshi" },
    ],
    []
  );

  useEffect(() => {
    const fetchMangaByType = async () => {
      try {
        setLoading(true);
        setError(null);

        let res;

        // ALL
        if (selectedType === "all") {
          res = await api.get("/manga"); // GET /api/manga
          let data = Array.isArray(res.data) ? res.data : [];

          // client-side sort for "all"
          if (sortBy === "popular") data.sort((a, b) => (b.views || 0) - (a.views || 0));
          else if (sortBy === "rating") data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          else data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          setMangas(data);
          return;
        }

        // FILTERED BY TYPE
        res = await mangaAPI.getMangaByType(selectedType, sortBy);
        setMangas(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError("Failed to load manga by type");
      } finally {
        setLoading(false);
      }
    };

    fetchMangaByType();
  }, [selectedType, sortBy]);

  const getTypeDisplayName = (type) => {
    const t = types.find((x) => x.value === type);
    return t ? t.label : "All Types";
  };

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Manga Types</h1>
        <p>Browse manga by different types and formats</p>

        <div className="filter-controls">
          <div className="type-filters">
            {types.map((type) => (
              <button
                key={type.value}
                className={`type-filter ${selectedType === type.value ? "active" : ""}`}
                onClick={() => setSelectedType(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="sort-options">
            <button className={`sort-option ${sortBy === "newest" ? "active" : ""}`} onClick={() => setSortBy("newest")}>
              Newest
            </button>
            <button className={`sort-option ${sortBy === "popular" ? "active" : ""}`} onClick={() => setSortBy("popular")}>
              Most Popular
            </button>
            <button className={`sort-option ${sortBy === "rating" ? "active" : ""}`} onClick={() => setSortBy("rating")}>
              Highest Rated
            </button>
          </div>
        </div>
      </div>

      <MangaGrid
        mangas={mangas}
        title={selectedType === "all" ? "All Manga Types" : `${getTypeDisplayName(selectedType)} Manga`}
        loading={loading}
        showFilters={false}
        emptyMessage={`No ${getTypeDisplayName(selectedType).toLowerCase()} manga found.`}
      />
    </div>
  );
};

export default Types;
