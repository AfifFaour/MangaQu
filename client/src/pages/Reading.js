// client/src/pages/Reading.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../services/Api";
import { useAuth } from "../context/AuthContext";
import "../styles/Reading.css";

const Reading = () => {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { isAuthenticated, getToken } = useAuth();

  const safeMangaId = useMemo(() => (mangaId ? String(mangaId) : ""), [mangaId]);
  const safeChapterId = useMemo(() => (chapterId ? String(chapterId) : ""), [chapterId]);

  const loggedIn = useMemo(() => {
    try {
      return !!isAuthenticated?.() && !!getToken?.();
    } catch {
      return false;
    }
  }, [isAuthenticated, getToken]);

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);

  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ UI options
  const [menuOpen, setMenuOpen] = useState(true);
  const [viewMode, setViewMode] = useState("long"); // "long" | "paged"
  const [fitWidth, setFitWidth] = useState(true);
  const [menuSticky, setMenuSticky] = useState(true);
  const [bottomProgress, setBottomProgress] = useState(true);

  const totalPages = pages.length;

  // for long strip page tracking
  const pageRefs = useRef([]);
  const observerRef = useRef(null);

  // throttled saving
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef({ chapterId: null, page: null });

  const clampPage = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return 1;
    return Math.min(Math.max(x, 1), Math.max(totalPages, 1));
  };

  const scrollToPage = (n, { updateUrl = true } = {}) => {
    const page = clampPage(n);
    setCurrentPage(page);

    if (updateUrl) {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(page));
      setSearchParams(next, { replace: true });
    }

    if (viewMode === "long") {
      const el = pageRefs.current?.[page - 1];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goPrev = () => scrollToPage(currentPage - 1);
  const goNext = () => scrollToPage(currentPage + 1);

  // -----------------------------
  // Fetch Manga + Chapters + Pages + (optional) History
  // -----------------------------
  useEffect(() => {
    let alive = true;

    const fetchReadingData = async () => {
      if (!safeMangaId || !safeChapterId) {
        setError("Missing mangaId or chapterId in URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [mangaRes, chaptersRes, pagesRes] = await Promise.all([
          api.get(`/manga/${safeMangaId}`),
          api.get(`/manga/${safeMangaId}/chapters`),
          api.get(`/chapters/${safeChapterId}/pages`),
        ]);

        if (!alive) return;

        setManga(mangaRes?.data ?? null);

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

        const found = mappedChapters.find((ch) => ch.id === safeChapterId) || null;
        setCurrentChapter(found);

        const rawPages = Array.isArray(pagesRes?.data) ? pagesRes.data : [];
        const cleanedPages = rawPages
          .filter((p) => p && typeof p.imageUrl === "string" && p.imageUrl.trim())
          .map((p) => ({ imageUrl: p.imageUrl.trim() }));

        setPages(cleanedPages);

        // reset refs
        pageRefs.current = [];

        // ✅ Decide initial page:
        // 1) URL ?page= has priority
        // 2) if logged in, try server history for this manga+chapter
        // 3) default 1
        const urlPage = Number(searchParams.get("page") || 0);

        let initial = 1;

        if (urlPage && Number.isFinite(urlPage) && urlPage > 0) {
          initial = Math.min(Math.max(urlPage, 1), Math.max(cleanedPages.length, 1));
        } else if (loggedIn) {
          try {
            const h = await api.get(`/reading-history/chapter/${Number(safeMangaId)}`);
            // history is per manga (last chapter + page)
            // only apply if history points to THIS chapter
            const hx = h?.data;
            if (hx && Number(hx.chapter_id) === Number(safeChapterId)) {
              const p = Number(hx.page_number || 1);
              initial = Math.min(Math.max(p, 1), Math.max(cleanedPages.length, 1));

              // also update URL so refresh works
              const next = new URLSearchParams(searchParams);
              next.set("page", String(initial));
              setSearchParams(next, { replace: true });
            }
          } catch {
            // ignore (no history yet / auth)
          }
        }

        setCurrentPage(initial);

        // if long mode, scroll to it after render
        setTimeout(() => {
          if (viewMode === "long") {
            const el = pageRefs.current?.[initial - 1];
            if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
          }
        }, 0);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          (err?.response?.status ? `Request failed (${err.response.status})` : "Failed to load chapter");
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchReadingData();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeMangaId, safeChapterId, loggedIn]);

  // -----------------------------
  // ✅ Save history (throttled)
  // POST /api/reading-history/chapter
  // body: { manga_id, chapter_id, page_number }
  // -----------------------------
  useEffect(() => {
    if (!loggedIn) return;
    if (!safeMangaId || !safeChapterId) return;
    if (!totalPages) return;

    const page = clampPage(currentPage);

    if (lastSavedRef.current.chapterId === safeChapterId && lastSavedRef.current.page === page) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        lastSavedRef.current = { chapterId: safeChapterId, page };

        // ✅ NO headers here (interceptor adds token)
        await api.post("/reading-history/chapter", {
          manga_id: Number(safeMangaId),
          chapter_id: Number(safeChapterId),
          page_number: Number(page),
        });
      } catch (e) {
        console.error("save reading history failed", e?.response?.data || e?.message);
      }
    }, 900);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages, loggedIn, safeMangaId, safeChapterId]);

  // -----------------------------
  // Keyboard controls
  // -----------------------------
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") navigate(`/manga/${safeMangaId}`);

      if (viewMode === "paged") {
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
      } else {
        if (e.key === "ArrowLeft") scrollToPage(currentPage - 1);
        if (e.key === "ArrowRight") scrollToPage(currentPage + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentPage, totalPages, safeMangaId]);

  // -----------------------------
  // Preload next/prev images
  // -----------------------------
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
  // Long strip: track current page (IntersectionObserver)
  // -----------------------------
  useEffect(() => {
    if (viewMode !== "long") return;
    if (!totalPages) return;

    if (observerRef.current) observerRef.current.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
        if (!best) return;

        const idx = Number(best.target?.dataset?.index);
        if (Number.isFinite(idx)) {
          const nextPage = idx + 1;
          setCurrentPage(nextPage);

          // keep URL updated
          const next = new URLSearchParams(searchParams);
          next.set("page", String(nextPage));
          setSearchParams(next, { replace: true });
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
        rootMargin: "-20% 0px -55% 0px",
      }
    );

    observerRef.current = obs;
    pageRefs.current.forEach((el) => el && obs.observe(el));

    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, totalPages, pages]);

  // -----------------------------
  // Chapter navigation
  // -----------------------------
  const handleChapterChange = (newChapterId) => {
    // reset url page param when changing chapters
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    setSearchParams(next, { replace: true });

    navigate(`/read/${safeMangaId}/${String(newChapterId)}`);
  };

  // -----------------------------
  // UI states
  // -----------------------------
  if (loading) {
    return (
      <div className="reading-loading">
        <p>Loading chapter...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reading-error">
        <p>{error}</p>
        <button onClick={() => navigate(`/manga/${safeMangaId}`)}>Back to Manga</button>
      </div>
    );
  }

  if (!pages.length) {
    return (
      <div className="reading-error">
        <p>No pages found.</p>
        <button onClick={() => navigate(`/manga/${safeMangaId}`)}>Back to Manga</button>
      </div>
    );
  }

  const progressPct = Math.round((currentPage / totalPages) * 100);

  return (
    <div className={`reading-shell ${menuOpen ? "menu-open" : "menu-closed"} ${fitWidth ? "fit-width" : "fit-height"}`}>
      {/* MAIN */}
      <div className="reading-main">
        {viewMode === "paged" ? (
          <div className="reading-paged">
            <img
              src={pages[currentPage - 1]?.imageUrl}
              alt={`Page ${currentPage}`}
              className="reading-img"
              loading="eager"
              onError={(e) => {
                e.currentTarget.style.opacity = "0.4";
                e.currentTarget.alt = "Image failed to load";
              }}
            />
          </div>
        ) : (
          <div className="reading-long">
            {pages.map((p, i) => (
              <div
                key={p.imageUrl + i}
                className="reading-long-page"
                ref={(el) => (pageRefs.current[i] = el)}
                data-index={i}
              >
                <img
                  src={p.imageUrl}
                  alt={`Page ${i + 1}`}
                  className="reading-img"
                  loading={i < 2 ? "eager" : "lazy"}
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0.4";
                    e.currentTarget.alt = "Image failed to load";
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bottom progress */}
        {bottomProgress && (
          <div className="reading-progress">
            <div className="reading-progress-bar" style={{ width: `${progressPct}%` }} />
            <div className="reading-progress-text">
              {currentPage}/{totalPages} · {progressPct}%
            </div>
          </div>
        )}
      </div>

      {/* RIGHT MENU */}
      <aside className={`reading-menu ${menuSticky ? "sticky" : ""}`}>
        <div className="reading-menu-head">
          <button className="reading-collapse" onClick={() => setMenuOpen((s) => !s)} type="button">
            {menuOpen ? "›" : "‹"}
          </button>

          {menuOpen && (
            <div className="reading-menu-title">
              <div className="t1">{manga?.title || "Manga"}</div>
              <div className="t2">
                Chapter {currentChapter?.number ?? "?"} · Page {currentPage}
              </div>
            </div>
          )}
        </div>

        {menuOpen && (
          <div className="reading-menu-body">
            {/* Chapter */}
            <div className="reading-block">
              <div className="reading-block-title">Chapter</div>

              <select className="reading-select" value={safeChapterId} onChange={(e) => handleChapterChange(e.target.value)}>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Chapter {ch.number}
                  </option>
                ))}
              </select>

              <button className="reading-link" type="button" onClick={() => navigate(`/manga/${safeMangaId}`)}>
                Manga Detail
              </button>
            </div>

            {/* Page */}
            <div className="reading-block">
              <div className="reading-block-title">Page</div>

              <div className="reading-row">
                <button className="reading-btn" onClick={goPrev} disabled={currentPage <= 1}>
                  ◀ Prev
                </button>
                <button className="reading-btn" onClick={goNext} disabled={currentPage >= totalPages}>
                  Next ▶
                </button>
              </div>

              <select className="reading-select" value={currentPage} onChange={(e) => scrollToPage(Number(e.target.value))}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Page {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* View options */}
            <div className="reading-block">
              <div className="reading-block-title">View</div>

              <div className="reading-row">
                <label className="reading-label">Mode</label>
                <select
                  className="reading-select"
                  value={viewMode}
                  onChange={(e) => {
                    const next = e.target.value;
                    setViewMode(next);

                    setTimeout(() => {
                      if (next === "long") scrollToPage(currentPage, { updateUrl: false });
                    }, 0);
                  }}
                >
                  <option value="long">Long Strip</option>
                  <option value="paged">Paged</option>
                </select>
              </div>

              <div className="reading-toggle">
                <input id="fitWidth" type="checkbox" checked={fitWidth} onChange={(e) => setFitWidth(e.target.checked)} />
                <label htmlFor="fitWidth">Fit Width</label>
              </div>

              <div className="reading-toggle">
                <input id="sticky" type="checkbox" checked={menuSticky} onChange={(e) => setMenuSticky(e.target.checked)} />
                <label htmlFor="sticky">Header Sticky</label>
              </div>

              <div className="reading-toggle">
                <input id="progress" type="checkbox" checked={bottomProgress} onChange={(e) => setBottomProgress(e.target.checked)} />
                <label htmlFor="progress">Bottom Progress</label>
              </div>
            </div>

            <div className="reading-hint">
              Tip: <b>← →</b> for page jump, <b>Esc</b> to exit.
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Reading;
