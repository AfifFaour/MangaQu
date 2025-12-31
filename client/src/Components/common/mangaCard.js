import React from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, Clock, Star } from "lucide-react";
import { toAssetUrl } from "../../services/Api";
import "../../styles/MangaCard.css";

const MangaCard = ({ manga, viewMode = "grid" }) => {
  const {
    id,
    title,
    description,
    views = 0,
    rating,
    status,
    type,
    genres,
    chapters,
    chaptersCount,
    cover_image,
    coverImage,
    image,
    lastUpdated,
    updated_at,
    updatedAt,
  } = manga;

  const coverPath = cover_image || coverImage || image;
  const cover = coverPath ? toAssetUrl(coverPath) : "/placeholder-manga.jpg";

  const chapterTotal = chaptersCount ?? chapters ?? 0;

  const genreList = Array.isArray(genres)
    ? genres
    : typeof genres === "string"
    ? genres.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  const getStatusColor = (s) => {
    switch (String(s || "").toLowerCase()) {
      case "ongoing":
        return "#10b981";
      case "completed":
        return "#3b82f6";
      case "hiatus":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getTypeColor = (t) => {
    switch (String(t || "").toLowerCase()) {
      case "manga":
        return "#ef4444";
      case "manhwa":
        return "#8b5cf6";
      case "manhua":
        return "#06b6d4";
      case "one-shot":
        return "#f59e0b";
      case "novel":
        return "#10b981";
      case "doujinshi":
        return "#64748b";
      default:
        return "#6b7280";
    }
  };

  const updatedLabel = updated_at || updatedAt || lastUpdated;

  return (
    <div className={`manga-card ${viewMode === "list" ? "list-view" : ""}`}>
      <Link to={`/manga/${id}`} className="manga-card-link">
        <div className="manga-image-container">
          <img src={cover} alt={title} className="manga-image" loading="lazy" />

          <div className="manga-overlay">
            <button className="action-btn" onClick={(e) => e.preventDefault()}>
              <Heart size={16} />
            </button>

            {rating !== null && rating !== undefined && (
              <div className="rating-badge">
                <Star size={12} fill="currentColor" />
                <span>{Number(rating).toFixed(1)}</span>
              </div>
            )}
          </div>

          {status && (
            <span className="status-badge" style={{ backgroundColor: getStatusColor(status) }}>
              {status}
            </span>
          )}

          {type && (
            <span className="type-badge" style={{ backgroundColor: getTypeColor(type) }}>
              {type}
            </span>
          )}
        </div>

        <div className="manga-content">
          <h3 className="manga-title" title={title}>
            {truncateText(title, 40)}
          </h3>

          <p className="manga-description">{truncateText(description || "No description available.", 80)}</p>

          {genreList.length > 0 && (
            <div className="manga-genres">
              {genreList.slice(0, 2).map((g, i) => (
                <span key={i} className="genre-tag">
                  {g}
                </span>
              ))}
              {genreList.length > 2 && <span className="genre-tag-more">+{genreList.length - 2}</span>}
            </div>
          )}

          <div className="manga-meta">
            <span className="meta-item">
              <Eye size={14} /> {Number(views || 0).toLocaleString()}
            </span>

            <span className="meta-item">
              <Clock size={14} /> {chapterTotal} ch
            </span>
          </div>

          {updatedLabel && <div className="last-updated">Updated {String(updatedLabel)}</div>}
        </div>
      </Link>
    </div>
  );
};

export default MangaCard;
