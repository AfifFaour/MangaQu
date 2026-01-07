// src/pages/MangaDetail.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { toAssetUrl } from "../services/Api";
import ChapterList from "../Components/manga/ChapterList";
import MangaGrid from "../Components/manga/MangaGrid";
import Volume from "../pages/Volume";
import { Bookmark, Share2, Eye, Star, Clock, ArrowLeft, Play } from "lucide-react";
import "../styles/MangaDetail.css";
import { useAuth } from "../context/AuthContext";

const MangaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAuthenticated, getToken } = useAuth();

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [relatedManga, setRelatedManga] = useState([]);
  const [activeTab, setActiveTab] = useState("chapters");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Favorites
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Rating
  const [myRating, setMyRating] = useState(null);
  const [ratingSaving, setRatingSaving] = useState(false);

  // Rating stats
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // ✅ Continue Reading (history)
  const [continueData, setContinueData] = useState(null); // { chapter_id, page_number, read_at }
  const [continueLoading, setContinueLoading] = useState(false);

  const isAuthError = (e) => {
    const status = e?.response?.status;
    return status === 401 || status === 403;
  };

  const loggedIn = useMemo(() => {
    try {
      return !!isAuthenticated?.() && !!getToken?.();
    } catch {
      return false;
    }
  }, [isAuthenticated, getToken]);

  // ✅ fetch rating stats
  const fetchRatingStats = async (mangaId) => {
    try {
      const res = await api.get(`/manga/${mangaId}/rating-stats`);
      setRatingAvg(Number(res.data?.rating_avg ?? 0) || 0);
      setRatingCount(Number(res.data?.rating_count ?? 0) || 0);
    } catch (e) {
      console.error("rating stats fetch failed", e);
      setRatingAvg(0);
      setRatingCount(0);
    }
  };

  const fetchFavoritesState = async (mangaId) => {
    try {
      const favRes = await api.get("/user/favorites");
      const favs = Array.isArray(favRes.data) ? favRes.data : [];
      setIsBookmarked(favs.some((m) => Number(m.id) === Number(mangaId)));
    } catch (e) {
      if (isAuthError(e)) {
        setIsBookmarked(false);
        return;
      }
      console.error("favorites fetch failed", e);
      setIsBookmarked(false);
    }
  };

  const fetchMyRating = async (mangaId) => {
    try {
      const res = await api.get(`/manga/${mangaId}/my-rating`);
      setMyRating(res.data?.rating ?? null);
    } catch (e) {
      if (isAuthError(e)) {
        setMyRating(null);
        return;
      }
      console.error("my rating fetch failed", e);
      setMyRating(null);
    }
  };

  // ✅ fetch continue reading history
  const fetchContinueReading = async (mangaId) => {
    if (!loggedIn) {
      setContinueData(null);
      return;
    }

    try {
      setContinueLoading(true);
      const res = await api.get(`/reading-history/chapter/${mangaId}`);
      // backend returns null if no history
      setContinueData(res.data || null);
    } catch (e) {
      if (isAuthError(e)) {
        setContinueData(null);
        return;
      }
      console.error("continue reading fetch failed", e);
      setContinueData(null);
    } finally {
      setContinueLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const fetchMangaData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [mangaRes, chaptersRes, relatedRes] = await Promise.all([
          api.get(`/manga/${id}`),
          api.get(`/manga/${id}/chapters`),
          api.get(`/manga/${id}/related`),
        ]);

        if (!alive) return;

        setManga(mangaRes.data);

        const mappedChapters = (Array.isArray(chaptersRes.data) ? chaptersRes.data : []).map((c) => ({
          id: c.id,
          number: Number(c.chapter_number),
          title: c.title || `Chapter ${c.chapter_number}`,
          date: c.created_at,
          views: c.view_count || 0,
          pages: Array.isArray(c.pages) ? c.pages : [],
        }));

        setChapters(mappedChapters);
        setRelatedManga(Array.isArray(relatedRes.data) ? relatedRes.data : []);

        await fetchRatingStats(id);

        if (loggedIn) {
          await Promise.all([fetchFavoritesState(id), fetchMyRating(id)]);
          await fetchContinueReading(id);
        } else {
          setIsBookmarked(false);
          setMyRating(null);
          setContinueData(null);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load manga data");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchMangaData();
    return () => {
      alive = false;
    };
  }, [id, loggedIn]);

  const coverUrl = manga?.cover_image ? toAssetUrl(manga.cover_image) : "/placeholder-manga.jpg";

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: manga?.title || "Manga",
          text: manga?.description || "",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatRating = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x) || x <= 0) return "0.0";
    return x.toFixed(1);
  };

  const handleRate = async (value) => {
    if (!loggedIn) {
      alert("Please login to rate.");
      navigate("/login", { state: { from: { pathname: `/manga/${id}` } } });
      return;
    }

    try {
      setRatingSaving(true);

      const res = await api.post(`/manga/${id}/rate`, { rating: value });
      setMyRating(value);

      const nextAvg = Number(res.data?.rating_avg ?? ratingAvg);
      const nextCount = Number(res.data?.rating_count ?? ratingCount);

      setRatingAvg(Number.isFinite(nextAvg) ? nextAvg : 0);
      setRatingCount(Number.isFinite(nextCount) ? nextCount : 0);
    } catch (e) {
      console.error(e);
      if (isAuthError(e)) {
        alert("Your login expired. Please login again.");
        navigate("/login", { state: { from: { pathname: `/manga/${id}` } } });
      } else {
        alert("Failed to save rating.");
      }
    } finally {
      setRatingSaving(false);
    }
  };

  const renderAvgStars = (avg) => {
    const filled = Math.round(Number(avg) || 0);
    return (
      <span className="stars" aria-label={`Average rating ${formatRating(avg)} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} className={i < filled ? "star filled" : "star"} />
        ))}
      </span>
    );
  };

  const renderMyStars = () => {
    const current = Number(myRating ?? 0);
    return (
      <div className="my-rating">
        <div className="my-rating-label">
          Your rating:{" "}
          <span className="my-rating-value">{myRating ? `${myRating}/5` : "Not rated"}</span>
        </div>

        <div className={`my-stars ${ratingSaving ? "disabled" : ""}`}>
          {Array.from({ length: 5 }).map((_, i) => {
            const val = i + 1;
            const filled = val <= current;
            return (
              <button
                key={val}
                type="button"
                className={`my-star-btn ${filled ? "filled" : ""}`}
                onClick={() => handleRate(val)}
                disabled={ratingSaving}
                aria-label={`Rate ${val} star`}
                title={`Rate ${val}`}
              >
                <Star size={18} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const toggleBookmark = async () => {
    if (!loggedIn) {
      alert("Please login to add favorites.");
      navigate("/login", { state: { from: { pathname: `/manga/${id}` } } });
      return;
    }

    try {
      setBookmarkLoading(true);

      if (!isBookmarked) {
        await api.post(`/user/favorites/${id}`, {});
        setIsBookmarked(true);
      } else {
        await api.delete(`/user/favorites/${id}`);
        setIsBookmarked(false);
      }

      await fetchFavoritesState(id);
    } catch (e) {
      console.error(e);
      if (isAuthError(e)) {
        alert("Your login expired. Please login again.");
        navigate("/login", { state: { from: { pathname: `/manga/${id}` } } });
      } else {
        alert("Failed to update bookmark.");
      }
    } finally {
      setBookmarkLoading(false);
    }
  };

  // ✅ Continue Reading button click
  const goContinueReading = () => {
    if (!continueData?.chapter_id) return;
    const page = Number(continueData.page_number) || 1;
    navigate(`/read/${manga.id}/${continueData.chapter_id}?page=${page}`);
  };

  if (loading) return <div className="loading">Loading manga...</div>;
  if (error) return <div className="error">{error}</div>;

  if (!manga) {
    return (
      <div className="manga-not-found">
        <h2>Manga not found</h2>
        <Link to="/browse" className="back-button">
          <ArrowLeft size={16} /> Back to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="manga-detail">
      <div className="back-nav">
        <Link to="/browse" className="back-button">
          <ArrowLeft size={20} /> Back to Browse
        </Link>
      </div>

      <div className="manga-header">
        <div className="manga-cover">
          <img src={coverUrl} alt={manga.title} className="cover-image" />
          <div className="cover-overlay">
            {/* ✅ Continue Reading (only if exists) */}
            {loggedIn && continueData?.chapter_id ? (
              <button type="button" className="read-first-btn" onClick={goContinueReading}>
                <Play size={16} /> {continueLoading ? "Loading..." : "Continue Reading"}
              </button>
            ) : chapters.length > 0 ? (
              <Link to={`/read/${manga.id}/${chapters[0].id}`} className="read-first-btn">
                <Play size={16} /> Read First Chapter
              </Link>
            ) : null}
          </div>
        </div>

        <div className="manga-info">
          <h1 className="manga-title">{manga.title}</h1>

          {/* ✅ Top actions (Bookmark + Share) */}
          <div className="manga-actions">
            <button
              className={`bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
              type="button"
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
              title={isBookmarked ? "Remove from favorites" : "Add to favorites"}
            >
              <Bookmark size={20} />
              {bookmarkLoading ? "..." : isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>

            <button className="share-btn" onClick={handleShare} type="button">
              <Share2 size={20} /> Share
            </button>
          </div>

          <div className="manga-meta-grid">
            {/* ✅ Rating */}
            <div className="meta-item rating-item">
              {renderAvgStars(ratingAvg)}
              <span className="rating-text">
                {formatRating(ratingAvg)}{" "}
                <span className="rating-count">
                  ({(ratingCount || 0).toLocaleString()} {ratingCount === 1 ? "vote" : "votes"})
                </span>
              </span>
              <span>Rating</span>
            </div>

            {/* ✅ Views */}
            <div className="meta-item">
              <Eye size={16} />
              <span>{(manga.views || 0).toLocaleString()}</span>
              <span>Views</span>
            </div>

            {/* ✅ Chapters */}
            <div className="meta-item">
              <Clock size={16} />
              <span>{chapters.length}</span>
              <span>Chapters</span>
            </div>

            {/* ✅ Bookmark meta-card */}
            <button
              type="button"
              className={`meta-item bookmark-meta ${isBookmarked ? "bookmarked" : ""}`}
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
              title={isBookmarked ? "Remove from favorites" : "Add to favorites"}
            >
              <Bookmark size={16} />
              <span>{bookmarkLoading ? "..." : isBookmarked ? "Saved" : "Save"}</span>
              <span>Bookmark</span>
            </button>
          </div>

          {loggedIn ? renderMyStars() : null}

          <p className="manga-description">{manga.description}</p>
        </div>
      </div>

      <div className="content-tabs">
        <div className="tab-nav">
          <button
            onClick={() => setActiveTab("chapters")}
            className={activeTab === "chapters" ? "active" : ""}
            type="button"
          >
            Chapters
          </button>

          <button
            onClick={() => setActiveTab("volumes")}
            className={activeTab === "volumes" ? "active" : ""}
            type="button"
          >
            Volumes
          </button>

          <button
            onClick={() => setActiveTab("details")}
            className={activeTab === "details" ? "active" : ""}
            type="button"
          >
            Details
          </button>

          <button
            onClick={() => setActiveTab("related")}
            className={activeTab === "related" ? "active" : ""}
            type="button"
          >
            Related
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "chapters" && (
            <ChapterList chapters={chapters} mangaId={manga.id} mangaTitle={manga.title} />
          )}

          {activeTab === "volumes" && (
            <div style={{ padding: 12 }}>
              <Volume mangaId={manga.id} adminMode={false} />
            </div>
          )}

          {activeTab === "details" && (
            <div className="details-content">
              <h3>Manga Information</h3>
              <p>Author: {manga.author || "Unknown"}</p>
              <p>Type: {manga.type || "manga"}</p>
            </div>
          )}

          {activeTab === "related" && <MangaGrid mangas={relatedManga} title="Related Manga" showFilters={false} />}
        </div>
      </div>
    </div>
  );
};

export default MangaDetail;
