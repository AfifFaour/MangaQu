import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./../styles/Dashboard.css";

function DashBoard() {
  const API = "http://localhost:5001";

  const [dashboard, setDashboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedManga, setSelectedManga] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingManga, setEditingManga] = useState(null);

  // ✅ tabs inside modal
  const [modalTab, setModalTab] = useState("manga"); // "manga" | "chapters"

  const [formData, setFormData] = useState({
    title: "",
    cover_image: "",
    status: "ongoing",
    description: "",
    views: 0,
    rating: 0.0,
  });

  // ✅ chapters state
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapterForm, setChapterForm] = useState({
    id: null, // when editing
    chapter_number: "",
    title: "",
    view_count: 0,
    pages: "[]", // store as text in UI
  });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { user, logout, getToken, isAuthenticated, isAdmin } = useAuth();

  // --------------------------
  // Fetch Manga
  // --------------------------
  useEffect(() => {
    fetchManga();
  }, []);

  const fetchManga = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/manga`);
      setDashboard(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("❌ Fetch manga failed", e);
      setDashboard([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Fetch Chapters for selected manga (always public)
  // --------------------------
  const fetchChapters = async (mangaId) => {
    if (!mangaId) return;
    try {
      setChaptersLoading(true);
      const res = await axios.get(`${API}/api/manga/${mangaId}/chapters`);
      setChapters(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("❌ Fetch chapters failed", e);
      setChapters([]);
    } finally {
      setChaptersLoading(false);
    }
  };

  // when select manga in sidebar, load chapters too
  useEffect(() => {
    if (selectedManga?.id) fetchChapters(selectedManga.id);
  }, [selectedManga?.id]);

  // --------------------------
  // Helpers
  // --------------------------
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${API}/${imagePath}`;
  };

  const handleImgError = (e) => {
    e.currentTarget.classList.add("img-hidden");
  };

  const totals = useMemo(() => {
    const total = dashboard.length;
    const ongoing = dashboard.filter((m) => m.status === "ongoing").length;
    const completed = dashboard.filter((m) => m.status === "completed").length;
    const views = dashboard.reduce((sum, m) => sum + (Number(m.views) || 0), 0);
    return { total, ongoing, completed, views };
  }, [dashboard]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dashboard.filter((m) => {
      const matchQuery = !q || (m.title || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [dashboard, query, statusFilter]);

  // --------------------------
  // Auth
  // --------------------------
  const verifyAdminAccess = async () => {
    const token = getToken();
    if (!token) return false;

    if (isAdmin()) return true;

    try {
      const res = await axios.post(`${API}/api/auth/verify`, {}, { headers: { Authorization: `Bearer ${token}` } });
      return res.data?.valid && res.data?.user?.role === "admin";
    } catch {
      return false;
    }
  };

  const openAdd = async () => {
    if (!isAuthenticated()) return alert("Please login first");
    const ok = await verifyAdminAccess();
    if (!ok) return alert("Admin access required");

    setEditingManga(null);
    setModalTab("manga");
    setFormData({
      title: "",
      cover_image: "",
      status: "ongoing",
      description: "",
      views: 0,
      rating: 0.0,
    });
    setChapters([]);
    setChapterForm({ id: null, chapter_number: "", title: "", view_count: 0, pages: "[]" });
    setShowModal(true);
  };

  const openEdit = async (manga) => {
    if (!isAuthenticated()) return alert("Please login first");
    const ok = await verifyAdminAccess();
    if (!ok) return alert("Admin access required");

    setEditingManga(manga);
    setModalTab("manga");
    setFormData({
      title: manga.title || "",
      cover_image: manga.cover_image || "",
      status: manga.status || "ongoing",
      description: manga.description || "",
      views: manga.views || 0,
      rating: manga.rating || 0.0,
    });

    setShowModal(true);
    await fetchChapters(manga.id);
    setChapterForm({ id: null, chapter_number: "", title: "", view_count: 0, pages: "[]" });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingManga(null);
    setModalTab("manga");
    setChapterForm({ id: null, chapter_number: "", title: "", view_count: 0, pages: "[]" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "views"
          ? parseInt(value) || 0
          : name === "rating"
          ? parseFloat(value) || 0.0
          : value,
    }));
  };

  const saveManga = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return alert("Title required");
    if (!formData.cover_image.trim()) return alert("cover_image required");

    const token = getToken();
    if (!token) return alert("Login again");

    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editingManga) {
        await axios.put(`${API}/api/manga/${editingManga.id}`, formData, { headers });
        alert("✅ Updated");
      } else {
        const res = await axios.post(`${API}/api/manga`, formData, { headers });
        alert("✅ Created");

        // if newly created, switch to editing mode so we can add chapters immediately
        if (res?.data?.manga?.id) {
          setEditingManga({ id: res.data.manga.id, ...formData });
          await fetchChapters(res.data.manga.id);
          setModalTab("chapters");
        }
      }
      fetchManga();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Save failed");
      if (err.response?.status === 401 || err.response?.status === 403) logout();
    }
  };

  const deleteManga = async (manga) => {
    if (!isAuthenticated()) return alert("Please login first");
    const ok = await verifyAdminAccess();
    if (!ok) return alert("Admin access required");

    if (!window.confirm(`Delete "${manga.title}"?`)) return;

    try {
      const token = getToken();
      await axios.delete(`${API}/api/manga/${manga.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (selectedManga?.id === manga.id) setSelectedManga(null);
      fetchManga();
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
      if (err.response?.status === 401 || err.response?.status === 403) logout();
    }
  };

  const handleAuthButton = () => {
    if (isAuthenticated()) logout();
    else window.location.href = "/login";
  };

  // --------------------------
  // Chapters CRUD (Modal)
  // --------------------------
  const onChapterChange = (e) => {
    const { name, value } = e.target;
    setChapterForm((p) => ({
      ...p,
      [name]:
        name === "view_count"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const resetChapterForm = () => {
    setChapterForm({ id: null, chapter_number: "", title: "", view_count: 0, pages: "[]" });
  };

  const startEditChapter = (c) => {
    setChapterForm({
      id: c.id,
      chapter_number: c.chapter_number,
      title: c.title || "",
      view_count: c.view_count || 0,
      pages: (() => {
        try {
          return JSON.stringify(Array.isArray(c.pages) ? c.pages : JSON.parse(c.pages || "[]"), null, 0);
        } catch {
          return "[]";
        }
      })(),
    });
    setModalTab("chapters");
  };

  const saveChapter = async (e) => {
    e.preventDefault();

    if (!editingManga?.id) return alert("Save the manga first");
    if (chapterForm.chapter_number === "" || chapterForm.chapter_number === null) {
      return alert("chapter_number required");
    }

    let pagesArray = [];
    try {
      pagesArray = JSON.parse(chapterForm.pages || "[]");
      if (!Array.isArray(pagesArray)) throw new Error("pages must be array");
    } catch {
      return alert("Pages must be valid JSON array like: [] or [\"/Assets/.../1.jpg\"]");
    }

    const token = getToken();
    if (!token) return alert("Login again");

    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (chapterForm.id) {
        await axios.put(
          `${API}/api/chapters/${chapterForm.id}`,
          {
            chapter_number: chapterForm.chapter_number,
            title: chapterForm.title,
            view_count: chapterForm.view_count,
            pages: pagesArray,
          },
          { headers }
        );
        alert("✅ Chapter updated");
      } else {
        await axios.post(
          `${API}/api/manga/${editingManga.id}/chapters`,
          {
            chapter_number: chapterForm.chapter_number,
            title: chapterForm.title,
            view_count: chapterForm.view_count,
            pages: pagesArray,
          },
          { headers }
        );
        alert("✅ Chapter created");
      }

      resetChapterForm();
      await fetchChapters(editingManga.id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Chapter save failed");
      if (err.response?.status === 401 || err.response?.status === 403) logout();
    }
  };

  const removeChapter = async (c) => {
    if (!editingManga?.id) return;
    if (!window.confirm(`Delete chapter ${c.chapter_number} (${c.title || "Untitled"}) ?`)) return;

    const token = getToken();
    if (!token) return alert("Login again");

    try {
      await axios.delete(`${API}/api/chapters/${c.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchChapters(editingManga.id);
    } catch (err) {
      alert(err.response?.data?.error || "Delete chapter failed");
      if (err.response?.status === 401 || err.response?.status === 403) logout();
    }
  };

  // --------------------------
  // Render
  // --------------------------
  if (loading) {
    return (
      <div className="dash-shell">
        <div className="dash-loading">
          <div className="dash-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-shell">
      {/* Header */}
      <header className="dash-topbar">
        <div>
          <h1 className="dash-title">Manga Dashboard</h1>
          <p className="dash-subtitle">
            {isAuthenticated() ? (
              <>
                Logged in as <b>{user?.username}</b> ·{" "}
                <span className={`dash-role ${isAdmin() ? "admin" : "user"}`}>
                  {user?.role}
                </span>
              </>
            ) : (
              <span className="dash-warn">Not logged in (Admin disabled)</span>
            )}
          </p>
        </div>

        <div className="dash-actions">
          <button className="btn ghost" onClick={handleAuthButton}>
            {isAuthenticated() ? "Logout" : "Login"}
          </button>

          <button className="btn primary" disabled={!isAdmin()} onClick={openAdd}>
            + Add Manga
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="dash-stats">
        <div className="stat-card">
          <div className="stat-label">Total Manga</div>
          <div className="stat-value">{totals.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ongoing</div>
          <div className="stat-value">{totals.ongoing}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{totals.completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Views</div>
          <div className="stat-value">{totals.views.toLocaleString()}</div>
        </div>
      </section>

      {/* Main */}
      <main className="dash-main">
        {/* Left details */}
        <aside className="dash-panel">
          {!selectedManga ? (
            <div className="panel-empty">
              <div className="panel-icon">📚</div>
              <h3>Select a manga</h3>
              <p>Click a card to see details here.</p>
            </div>
          ) : (
            <div className="panel-details">
              <div className="panel-cover">
                <img
                  src={getImageUrl(selectedManga.cover_image)}
                  alt={selectedManga.title}
                  onError={handleImgError}
                />
                <div className="panel-cover-fallback">No Image</div>
              </div>

              <h3 className="panel-title">{selectedManga.title}</h3>

              <div className="panel-meta">
                <span className={`pill ${selectedManga.status}`}>{selectedManga.status}</span>
                <span className="pill neutral">{(selectedManga.rating || 0).toFixed(2)}/10</span>
                <span className="pill neutral">{(selectedManga.views || 0).toLocaleString()} views</span>
              </div>

              {selectedManga.description ? (
                <p className="panel-desc">{selectedManga.description}</p>
              ) : (
                <p className="panel-desc muted">No description.</p>
              )}

              <div className="panel-dates">
                <div>
                  <div className="k">Created</div>
                  <div className="v">{formatDate(selectedManga.created_at)}</div>
                </div>
                <div>
                  <div className="k">Updated</div>
                  <div className="v">{formatDate(selectedManga.updated_at)}</div>
                </div>
              </div>

              {/* ✅ Chapters quick list */}
              <div className="panel-chapters">
                <div className="panel-chapters-head">
                  <h4>Chapters</h4>
                  <span className="muted">{chaptersLoading ? "Loading..." : `${chapters.length} total`}</span>
                </div>

                {chaptersLoading ? (
                  <div className="muted">Loading chapters...</div>
                ) : chapters.length === 0 ? (
                  <div className="muted">No chapters yet.</div>
                ) : (
                  <ul className="chapter-mini-list">
                    {chapters.slice(0, 6).map((c) => (
                      <li key={c.id}>
                        <span className="ch-num">#{c.chapter_number}</span>
                        <span className="ch-title">{c.title || "Untitled"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="panel-btns">
                <button
                  className="btn info"
                  disabled={!isAdmin()}
                  onClick={() => openEdit(selectedManga)}
                  title={!isAdmin() ? "Admin required" : "Edit manga + chapters"}
                >
                  Edit (Manga + Chapters)
                </button>
                <button className="btn danger" disabled={!isAdmin()} onClick={() => deleteManga(selectedManga)}>
                  Delete
                </button>
                <button className="btn ghost" onClick={() => setSelectedManga(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Right list */}
        <section className="dash-list">
          <div className="list-toolbar">
            <div className="search-wrap">
              <input
                className="search"
                placeholder="Search manga..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <select className="filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="list-empty">
              <div className="panel-icon">📖</div>
              <h3>No results</h3>
              <p>Try a different search or filter.</p>
            </div>
          ) : (
            <div className="card-grid">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  className={`manga-card ${selectedManga?.id === m.id ? "active" : ""}`}
                  onClick={() => setSelectedManga(m)}
                >
                  <div className="card-cover">
                    <img src={getImageUrl(m.cover_image)} alt={m.title} onError={handleImgError} />
                    <div className="card-cover-fallback">No Image</div>
                  </div>

                  <div className="card-body">
                    <div className="card-title">{m.title}</div>
                    <div className="card-sub">
                      <span className={`pill ${m.status}`}>{m.status}</span>
                      <span className="pill neutral">{(m.rating || 0).toFixed(2)}/10</span>
                    </div>
                    <div className="card-foot">
                      <span className="muted">{(m.views || 0).toLocaleString()} views</span>
                      <span className="muted">Updated {formatDate(m.updated_at)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <div className="modal xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>{editingManga ? "Edit Manga" : "Add Manga"}</h2>
                {editingManga && <p className="muted">Manga ID: {editingManga.id}</p>}
              </div>
              <button className="icon-btn" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            {/* ✅ Modal Tabs */}
            <div className="modal-tabs">
              <button className={modalTab === "manga" ? "active" : ""} onClick={() => setModalTab("manga")} type="button">
                Manga
              </button>
              <button
                className={modalTab === "chapters" ? "active" : ""}
                onClick={() => setModalTab("chapters")}
                type="button"
                disabled={!editingManga}
                title={!editingManga ? "Create manga first, then add chapters" : "Manage chapters"}
              >
                Chapters
              </button>
            </div>

            {modalTab === "manga" && (
              <form className="modal-form" onSubmit={saveManga}>
                <div className="field">
                  <label>Title *</label>
                  <input name="title" value={formData.title} onChange={handleInputChange} placeholder="One Piece" required />
                </div>

                <div className="field">
                  <label>Cover Image Path *</label>
                  <input
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleInputChange}
                    placeholder="Assets/CoverImg/OPC.jpg"
                    required
                  />
                  <div className="mini-preview">
                    <img src={getImageUrl(formData.cover_image)} alt="preview" onError={handleImgError} />
                    <div className="mini-preview-fallback">Preview</div>
                  </div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="hiatus">Hiatus</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Views</label>
                    <input name="views" type="number" min="0" value={formData.views} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label>Rating</label>
                    <input
                      name="rating"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.rating}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="field">
                    <label>&nbsp;</label>
                    <button className="btn primary full" type="submit">
                      {editingManga ? "Save Changes" : "Create Manga"}
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Write something..."
                  />
                </div>

                <div className="modal-foot">
                  <button className="btn ghost" type="button" onClick={closeModal}>
                    Close
                  </button>
                  <button className="btn primary" type="submit">
                    {editingManga ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            )}

            {modalTab === "chapters" && (
              <div className="chapters-wrap">
                <div className="chapters-left">
                  <div className="chapters-head">
                    <h3>Chapters</h3>
                    <span className="muted">
                      {chaptersLoading ? "Loading..." : `${chapters.length} total`}
                    </span>
                  </div>

                  {chaptersLoading ? (
                    <div className="muted">Loading chapters...</div>
                  ) : chapters.length === 0 ? (
                    <div className="muted">No chapters yet.</div>
                  ) : (
                    <div className="chapters-table">
                      <div className="chapters-row head">
                        <div>#</div>
                        <div>Title</div>
                        <div>Views</div>
                        <div>Updated</div>
                        <div className="right">Actions</div>
                      </div>

                      {chapters.map((c) => (
                        <div className="chapters-row" key={c.id}>
                          <div>{c.chapter_number}</div>
                          <div className="truncate">{c.title || "Untitled"}</div>
                          <div>{(c.view_count || 0).toLocaleString()}</div>
                          <div>{formatDate(c.updated_at)}</div>
                          <div className="right">
                            <button className="btn tiny info" type="button" onClick={() => startEditChapter(c)}>
                              Edit
                            </button>
                            <button className="btn tiny danger" type="button" onClick={() => removeChapter(c)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="chapters-right">
                  <div className="chapters-head">
                    <h3>{chapterForm.id ? "Edit Chapter" : "Add Chapter"}</h3>
                    <button className="btn tiny ghost" type="button" onClick={resetChapterForm}>
                      Reset
                    </button>
                  </div>

                  <form className="chapter-form" onSubmit={saveChapter}>
                    <div className="row2">
                      <div className="field">
                        <label>Chapter Number *</label>
                        <input
                          name="chapter_number"
                          type="number"
                          step="0.01"
                          value={chapterForm.chapter_number}
                          onChange={onChapterChange}
                          placeholder="1.00"
                          required
                        />
                      </div>

                      <div className="field">
                        <label>Views</label>
                        <input
                          name="view_count"
                          type="number"
                          min="0"
                          value={chapterForm.view_count}
                          onChange={onChapterChange}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label>Title</label>
                      <input name="title" value={chapterForm.title} onChange={onChapterChange} placeholder="Romance Dawn" />
                    </div>

                    <div className="field">
                      <label>Pages (JSON Array)</label>
                      <textarea
                        name="pages"
                        rows={8}
                        value={chapterForm.pages}
                        onChange={onChapterChange}
                        placeholder='[] or ["Assets/Chapters/AOT/1/1.jpg"]'
                      />
                      <div className="hint">
                        Example: <code>["Assets/Chapters/AOT/1/1.jpg","Assets/Chapters/AOT/1/2.jpg"]</code>
                      </div>
                    </div>

                    <div className="modal-foot">
                      <button className="btn ghost" type="button" onClick={resetChapterForm}>
                        Clear
                      </button>
                      <button className="btn primary" type="submit">
                        {chapterForm.id ? "Update Chapter" : "Create Chapter"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dash-debug">
        <small>
          Auth: {isAuthenticated() ? "Yes" : "No"} | Admin: {isAdmin() ? "Yes" : "No"} | User:{" "}
          {user?.username || "None"} | Role: {user?.role || "None"}
        </small>
      </div>
    </div>
  );
}

export default DashBoard;
