// client/src/Components/mangaReader.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { chapterAPI } from "../../services/Api";
import "../../styles/Reader.css";

const Reader = () => {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();

  const safeMangaId = useMemo(() => (mangaId ? String(mangaId) : ""), [mangaId]);
  const safeChapterId = useMemo(() => (chapterId ? String(chapterId) : ""), [chapterId]);

  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------
  // Fetch pages
  // -----------------------------
  useEffect(() => {
    const fetchPages = async () => {
      if (!safeChapterId) {
        setError("Missing chapterId in URL.");
        setPages([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await chapterAPI.getChapterPages(safeChapterId);

        // Server returns: [{ imageUrl: "http://localhost:5001/Assets/..." }]
        const raw = Array.isArray(res?.data) ? res.data : [];
        const cleaned = raw
          .filter((p) => p && typeof p.imageUrl === "string" && p.imageUrl.trim().length > 0)
          .map((p) => ({ imageUrl: p.imageUrl.trim() }));

        setPages(cleaned);
        setCurrentPage(1);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          (err?.response?.status ? `Request failed (${err.response.status})` : "Failed to load chapter pages");
        setError(msg);
        setPages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [safeChapterId]);

  const totalPages = pages.length;
  const current = pages[currentPage - 1];

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const goPrev = () => {
    if (canPrev) setCurrentPage((p) => p - 1);
  };

  const goNext = () => {
    if (canNext) setCurrentPage((p) => p + 1);
  };

  const jumpTo = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(Math.max(n, 1), totalPages);
    setCurrentPage(clamped);
  };

  // -----------------------------
  // Keyboard navigation
  // -----------------------------
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape" && safeMangaId) navigate(`/manga/${safeMangaId}`);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPrev, canNext, safeMangaId]);

  // -----------------------------
  // Preload next/prev images
  // -----------------------------
  useEffect(() => {
    const nextUrl = pages[currentPage]?.imageUrl; // next
    const prevUrl = pages[currentPage - 2]?.imageUrl; // prev

    if (nextUrl) {
      const img = new Image();
      img.src = nextUrl;
    }
    if (prevUrl) {
      const img = new Image();
      img.src = prevUrl;
    }
  }, [currentPage, pages]);

  // -----------------------------
  // UI states
  // -----------------------------
  if (loading) return <div className="reader-loading">Loading chapter...</div>;

  if (error) {
    return (
      <div className="reader-empty">
        <div className="reader-error-text">{error}</div>
        <div className="reader-actions">
          {safeMangaId ? (
            <Link to={`/manga/${safeMangaId}`} className="reader-back-btn">
              Back to Manga
            </Link>
          ) : (
            <Link to="/browse" className="reader-back-btn">
              Back to Browse
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!totalPages) {
    return (
      <div className="reader-empty">
        <div className="reader-error-text">No pages found for this chapter.</div>
        <div className="reader-actions">
          {safeMangaId ? (
            <Link to={`/manga/${safeMangaId}`} className="reader-back-btn">
              Back to Manga
            </Link>
          ) : (
            <Link to="/browse" className="reader-back-btn">
              Back to Browse
            </Link>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="reader-container">
      <div className="reader-nav">
        <button className="reader-btn" onClick={goPrev} disabled={!canPrev}>
          Previous
        </button>

        <div className="reader-page-indicator">
          Page{" "}
          <input
            className="reader-page-input"
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => jumpTo(e.target.value)}
          />{" "}
          <span className="reader-page-total">of {totalPages}</span>
        </div>

        <button className="reader-btn" onClick={goNext} disabled={!canNext}>
          Next
        </button>

        {safeMangaId && (
          <Link to={`/manga/${safeMangaId}`} className="reader-back-link">
            Back to Manga
          </Link>
        )}
      </div>

      <div className="reader-content">
        <img
          src={current?.imageUrl}
          alt={`Page ${currentPage}`}
          className="reader-page"
          loading="lazy"
          onError={(e) => {
            // graceful fallback if an image file is missing
            e.currentTarget.style.opacity = "0.4";
            e.currentTarget.alt = "Image failed to load";
          }}
        />
      </div>
    </div>
  );
};

export default Reader;
