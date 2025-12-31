import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { toAssetUrl } from "../services/Api";
import ChapterList from "../Components/manga/ChapterList";
import MangaGrid from "../Components/manga/MangaGrid";
import { Bookmark, Share2, Eye, Star, Clock, ArrowLeft, Play } from "lucide-react";
import "../styles/MangaDetail.css";

const MangaDetail = () => {
  const { id } = useParams();

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [relatedManga, setRelatedManga] = useState([]);
  const [activeTab, setActiveTab] = useState("chapters");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [mangaRes, chaptersRes, relatedRes] = await Promise.all([
          api.get(`/manga/${id}`),
          api.get(`/manga/${id}/chapters`),
          api.get(`/manga/${id}/related`),
        ]);

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
      } catch (err) {
        console.error(err);
        setError("Failed to load manga data");
      } finally {
        setLoading(false);
      }
    };

    fetchMangaData();
  }, [id]);

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

  const getStatusColor = (status) => {
    switch (String(status || "").toLowerCase()) {
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

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: manga.title,
        text: manga.description || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const coverUrl = manga.cover_image ? toAssetUrl(manga.cover_image) : "/placeholder-manga.jpg";

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
            {chapters.length > 0 && (
              <Link to={`/read/${manga.id}/${chapters[0].id}`} className="read-first-btn">
                <Play size={16} /> Read First Chapter
              </Link>
            )}
          </div>
        </div>

        <div className="manga-info">
          <h1 className="manga-title">{manga.title}</h1>

          <div className="manga-actions">
            <button className="bookmark-btn">
              <Bookmark size={20} /> Bookmark
            </button>
            <button className="share-btn" onClick={handleShare}>
              <Share2 size={20} /> Share
            </button>
          </div>

          <div className="manga-meta-grid">
            <div className="meta-item">
              <Star size={16} />
              <span>{manga.rating || 0}</span>
              <span>Rating</span>
            </div>
            <div className="meta-item">
              <Eye size={16} />
              <span>{(manga.views || 0).toLocaleString()}</span>
              <span>Views</span>
            </div>
            <div className="meta-item">
              <Clock size={16} />
              <span>{chapters.length}</span>
              <span>Chapters</span>
            </div>
          </div>

          <div className="manga-details">
            <span style={{ color: getStatusColor(manga.status) }}>{manga.status}</span>
            <span>
              {manga.updated_at ? new Date(manga.updated_at).toLocaleDateString() : "Unknown"}
            </span>
          </div>

          <p className="manga-description">{manga.description}</p>
        </div>
      </div>

      <div className="content-tabs">
        <div className="tab-nav">
          <button onClick={() => setActiveTab("chapters")} className={activeTab === "chapters" ? "active" : ""}>
            Chapters
          </button>
          <button onClick={() => setActiveTab("details")} className={activeTab === "details" ? "active" : ""}>
            Details
          </button>
          <button onClick={() => setActiveTab("related")} className={activeTab === "related" ? "active" : ""}>
            Related
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "chapters" && (
            <ChapterList chapters={chapters} mangaId={manga.id} mangaTitle={manga.title} />
          )}

          {activeTab === "details" && (
            <div className="details-content">
              <h3>Manga Information</h3>
              <p>Author: {manga.author || "Unknown"}</p>
              <p>Artist: {manga.artist || "Unknown"}</p>
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
