// client/src/Components/mangaReader.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api, { chapterAPI, volumeAPI } from "../../services/Api"; // ✅ make sure path matches your project
import { useAuth } from "../../context/AuthContext";
import "../../styles/Reader.css";

const Reader = () => {
  const { mangaId, chapterId, volumeId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { isAuthenticated, getToken } = useAuth();

  const safeMangaId = useMemo(() => (mangaId ? String(mangaId) : ""), [mangaId]);

  // ✅ determine mode
  const isVolumeMode = useMemo(() => !!volumeId, [volumeId]);
  const activeId = useMemo(() => String(volumeId || chapterId || ""), [volumeId, chapterId]);

  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI options
  const [menuOpen, setMenuOpen] = useState(true);
  const [viewMode, setViewMode] = useState("long"); // "long" | "paged"
  const [fitWidth, setFitWidth] = useState(true);
  const [headerSticky, setHeaderSticky] = useState(true);
  const [bottomProgress, setBottomProgress] = useState(true);

  const totalPages = pages.length;

  // Refs for long strip scrolling
  const pageRefs = useRef([]);
  const observerRef = useRef(null);

  // throttling saves
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef({ chapterId: null, page: null });

  const loggedIn = useMemo(() => {
    try {
      return !!isAuthenticated?.() && !!getToken?.();
    } catch {
      return false;
    }
  }, [isAuthenticated, getToken]);

  // -----------------------------
  // Helpers
  // -----------------------------
  const clampPage = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return 1;
    return Math.min(Math.max(x, 1), Math.max(totalPages, 1));
  };

  const scrollToPage = (n, { updateUrl = true } = {}) => {
    const page = clampPage(n);
    setCurrentPage(page);

    // ✅ keep URL updated so refresh keeps your position
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
  // Fetch pages (chapter OR volume)
  // -----------------------------
  useEffect(() => {
    const fetchPages = async () => {
      if (!activeId) {
        setError("Missing chapterId/volumeId in URL.");
        setPages([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = isVolumeMode
          ? await volumeAPI.getVolumePages(activeId)
          : await chapterAPI.getChapterPages(activeId);

        const raw = Array.isArray(res?.data) ? res.data : [];

        const cleaned = raw
          .filter((p) => p && typeof p.imageUrl === "string" && p.imageUrl.trim().length > 0)
          .map((p) => ({ imageUrl: p.imageUrl.trim() }));

        setPages(cleaned);

        // ✅ init from URL ?page=
        const urlPage = Number(searchParams.get("page") || 1);
        const initial = Math.min(Math.max(urlPage, 1), Math.max(cleaned.length, 1));
        setCurrentPage(initial);

        // ✅ if long mode, scroll to it after render
        setTimeout(() => {
          if (viewMode === "long") {
            const el = pageRefs.current?.[initial - 1];
            if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
          }
        }, 0);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          (err?.response?.status
            ? `Request failed (${err.response.status})`
            : "Failed to load pages");
        setError(msg);
        setPages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, isVolumeMode]);

  // -----------------------------
  // ✅ Save reading progress (ONLY CHAPTERS)
  // -----------------------------
  useEffect(() => {
    if (isVolumeMode) return; // ✅ skip volumes for now
    if (!loggedIn) return;
    if (!safeMangaId || !activeId) return;
    if (!totalPages) return;

    const page = clampPage(currentPage);

    if (lastSavedRef.current.chapterId === activeId && lastSavedRef.current.page === page) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        lastSavedRef.current = { chapterId: activeId, page };

        await api.post(
          "/reading-history/chapter",
          {
            manga_id: Number(safeMangaId),
            chapter_id: Number(activeId),
            page_number: Number(page),
          },
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );
      } catch (e) {
        console.error("save reading history failed", e?.response?.data || e?.message);
      }
    }, 900);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [currentPage, totalPages, loggedIn, safeMangaId, activeId, getToken, isVolumeMode]);

  // -----------------------------
  // Keyboard navigation
  // -----------------------------
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && safeMangaId) navigate(`/manga/${safeMangaId}`);

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
  }, [viewMode, currentPage, safeMangaId, totalPages]);

  // -----------------------------
  // Preload next/prev image
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
  // Long strip: track current page using IntersectionObserver
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
  // UI states
  // -----------------------------
  if (loading) return <div className="reader-loading">Loading...</div>;

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
        <div className="reader-error-text">No pages found.</div>
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

  const progressPct = Math.round((currentPage / totalPages) * 100);
  const headLabel = isVolumeMode ? `Volume ${activeId}` : `Chapter ${activeId}`;

  return (
    <div
      className={[
        "reader-shell",
        menuOpen ? "menu-open" : "menu-closed",
        fitWidth ? "fit-width" : "fit-height",
      ].join(" ")}
    >
      {/* Main content */}
      <div className="reader-main">
        {viewMode === "paged" ? (
          <div className="reader-paged">
            <div className="reader-paged-inner">
              <img
                src={pages[currentPage - 1]?.imageUrl}
                alt={`Page ${currentPage}`}
                className="reader-img"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.opacity = "0.4";
                  e.currentTarget.alt = "Image failed to load";
                }}
              />
            </div>
          </div>
        ) : (
          <div className="reader-long">
            {pages.map((p, i) => (
              <div
                key={p.imageUrl + i}
                className="reader-long-page"
                ref={(el) => (pageRefs.current[i] = el)}
                data-index={i}
              >
                <img
                  src={p.imageUrl}
                  alt={`Page ${i + 1}`}
                  className="reader-img"
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

        {bottomProgress && (
          <div className="reader-progress">
            <div className="reader-progress-bar" style={{ width: `${progressPct}%` }} />
            <div className="reader-progress-text">
              {currentPage}/{totalPages} · {progressPct}%
            </div>
          </div>
        )}
      </div>

      {/* Right menu */}
      <aside className={["reader-menu", headerSticky ? "sticky" : ""].join(" ")}>
        <div className="reader-menu-head">
          <button className="reader-icon-btn" type="button" onClick={() => setMenuOpen((s) => !s)}>
            {menuOpen ? "›" : "‹"}
          </button>

          {menuOpen && (
            <div className="reader-menu-title">
              <div className="t1">Reader</div>
              <div className="t2">
                {headLabel} · Page {currentPage}
              </div>
            </div>
          )}
        </div>

        {menuOpen && (
          <div className="reader-menu-body">
            <div className="reader-block">
              <div className="reader-block-title">Navigation</div>

              <div className="reader-row">
                <button className="reader-btn" onClick={goPrev} disabled={currentPage <= 1}>
                  ◀ Prev
                </button>
                <button className="reader-btn" onClick={goNext} disabled={currentPage >= totalPages}>
                  Next ▶
                </button>
              </div>

              <div className="reader-row">
                <label className="reader-label">Page</label>
                <select
                  className="reader-select"
                  value={currentPage}
                  onChange={(e) => scrollToPage(Number(e.target.value))}
                >
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Page {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="reader-row">
                {safeMangaId ? (
                  <Link to={`/manga/${safeMangaId}`} className="reader-link">
                    Manga Detail
                  </Link>
                ) : (
                  <Link to="/browse" className="reader-link">
                    Browse
                  </Link>
                )}
              </div>
            </div>

            <div className="reader-block">
              <div className="reader-block-title">View</div>

              <div className="reader-row">
                <label className="reader-label">Mode</label>
                <select
                  className="reader-select"
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

              <div className="reader-toggle">
                <input id="fitWidth" type="checkbox" checked={fitWidth} onChange={(e) => setFitWidth(e.target.checked)} />
                <label htmlFor="fitWidth">Fit Width</label>
              </div>

              <div className="reader-toggle">
                <input id="sticky" type="checkbox" checked={headerSticky} onChange={(e) => setHeaderSticky(e.target.checked)} />
                <label htmlFor="sticky">Header Sticky</label>
              </div>

              <div className="reader-toggle">
                <input id="progress" type="checkbox" checked={bottomProgress} onChange={(e) => setBottomProgress(e.target.checked)} />
                <label htmlFor="progress">Bottom Progress</label>
              </div>
            </div>

            <div className="reader-hint">
              Tip: Use <b>← →</b> to navigate. <b>Esc</b> to exit.
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Reader;
