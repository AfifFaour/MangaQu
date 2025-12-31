// client/src/pages/Reading.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/Api";
import "../styles/Reading.css";

const Reading = () => {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();

  const safeMangaId = useMemo(() => (mangaId ? String(mangaId) : ""), [mangaId]);
  const safeChapterId = useMemo(() => (chapterId ? String(chapterId) : ""), [chapterId]);

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);

  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------
  // Fetch Manga + Chapters + Pages
  // -----------------------------
  useEffect(() => {
    const fetchReadingData = async () => {
      if (!safeMangaId || !safeChapterId) {
        setError("Missing mangaId or chapterId in URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // NOTE: your axios baseURL already includes /api
        const [mangaRes, chaptersRes, pagesRes] = await Promise.all([
          api.get(`/manga/${safeMangaId}`),
          api.get(`/manga/${safeMangaId}/chapters`),
          api.get(`/chapters/${safeChapterId}/pages`),
        ]);

        // Manga
        setManga(mangaRes?.data ?? null);

        // Chapters mapping
        const rawChapters = Array.isArray(chaptersRes?.data) ? chaptersRes.data : [];
        const mappedChapters = rawChapters
          .map((c) => ({
            id: String(c.id),
            number: Number(c.chapter_number ?? c.number ?? 0),
            title: c.title || `Chapter ${c.chapter_number ?? c.number ?? ""}`,
            date: c.created_at ?? null,
            views: Number(c.view_count ?? 0),
          }))
          .sort((a, b) => a.number - b.number);

        setChapters(mappedChapters);

        // Current chapter (IMPORTANT: compare as strings)
        const found = mappedChapters.find((ch) => ch.id === safeChapterId) || null;
        setCurrentChapter(found);

        // Pages: server returns [{ imageUrl }]
        const rawPages = Array.isArray(pagesRes?.data) ? pagesRes.data : [];
        const cleanedPages = rawPages
          .filter((p) => p && typeof p.imageUrl === "string")
          .map((p) => ({ imageUrl: p.imageUrl }));

        setPages(cleanedPages);
        setCurrentPage(1);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          (err?.response?.status ? `Request failed (${err.response.status})` : "Failed to load chapter");
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchReadingData();
  }, [safeMangaId, safeChapterId]);

  // -----------------------------
  // Page navigation
  // -----------------------------
  const canPrev = currentPage > 1;
  const canNext = currentPage < pages.length;

  const goPrev = () => {
    if (canPrev) setCurrentPage((p) => p - 1);
  };

  const goNext = () => {
    if (canNext) setCurrentPage((p) => p + 1);
  };

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPrev, canNext]);

  // Preload next/prev images (makes reading smoother)
  useEffect(() => {
    const nextUrl = pages[currentPage]?.imageUrl;
    const prevUrl = pages[currentPage - 2]?.imageUrl;

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
  // Chapter navigation
  // -----------------------------
  const handleChapterChange = (newChapterId) => {
    // match your route: /read/:mangaId/:chapterId
    navigate(`/read/${safeMangaId}/${String(newChapterId)}`);
  };

  // -----------------------------
  // UI states
  // -----------------------------
  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading chapter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate(`/manga/${safeMangaId}`)}>Back to Manga</button>
      </div>
    );
  }

  if (!pages.length) {
    return (
      <div className="error-container">
        <p>No pages found.</p>
        <button onClick={() => navigate(`/manga/${safeMangaId}`)}>Back to Manga</button>
      </div>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  const currentImageUrl = pages[currentPage - 1]?.imageUrl;

  return (
    <div className="reading-container">
      <div className="reader-header">
        <div className="reader-header-top">
          <button className="reader-back-btn" onClick={() => navigate(`/manga/${safeMangaId}`)}>
            Back
          </button>

          <div className="reader-title-wrap">
            <h1 className="reader-manga-title">{manga?.title || "Manga"}</h1>
            <h2 className="reader-chapter-title">
              Chapter {currentChapter?.number ?? "?"}
              {currentChapter?.title ? ` — ${currentChapter.title}` : ""}
            </h2>
          </div>

          {chapters.length > 0 ? (
            <select
              className="reader-chapter-select"
              value={safeChapterId}
              onChange={(e) => handleChapterChange(e.target.value)}
            >
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  Chapter {ch.number}
                </option>
              ))}
            </select>
          ) : (
            <div />
          )}
        </div>

        <div className="reader-progress">
          Page <strong>{currentPage}</strong> of <strong>{pages.length}</strong>
        </div>
      </div>

      <div className="reader-nav">
        <button className="reader-btn" onClick={goPrev} disabled={!canPrev}>
          Previous
        </button>

        <button className="reader-btn" onClick={goNext} disabled={!canNext}>
          Next
        </button>
      </div>

      <div className="reader-content">
        <img src={currentImageUrl} alt={`Page ${currentPage}`} className="reader-page" loading="lazy" />
      </div>
    </div>
  );
};

export default Reading;
