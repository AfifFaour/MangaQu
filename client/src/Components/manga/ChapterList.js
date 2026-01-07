import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Eye, Download, ChevronDown, ChevronUp } from "lucide-react";
import "../../styles/ChapterList.css";

const ChapterList = ({ chapters: chaptersProp = [], mangaId, mangaTitle, onChapterSelect }) => {
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterUploader, setFilterUploader] = useState("all");
  const [expandedChapter, setExpandedChapter] = useState(null);

  // ✅ Always force chapters into an array
  const chapters = Array.isArray(chaptersProp) ? chaptersProp : [];

  const sortedChapters = useMemo(() => {
    const copy = [...chapters];
    copy.sort((a, b) => {
      const aNum = Number(a.number ?? a.chapter_number ?? 0);
      const bNum = Number(b.number ?? b.chapter_number ?? 0);
      return sortOrder === "desc" ? bNum - aNum : aNum - bNum;
    });
    return copy;
  }, [chapters, sortOrder]);

  const uploaders = useMemo(() => {
    return [...new Set(chapters.map((c) => c.uploader).filter(Boolean))];
  }, [chapters]);

  const filteredChapters =
    filterUploader === "all"
      ? sortedChapters
      : sortedChapters.filter((chapter) => chapter.uploader === filterUploader);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const toggleChapterExpand = (chapterId) => {
    setExpandedChapter((prev) => (prev === chapterId ? null : chapterId));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handleChapterClick = (chapter, e) => {
    if (onChapterSelect) {
      e.preventDefault();
      onChapterSelect(chapter);
    }
  };

  return (
    <div className="chapter-list">
      <div className="chapter-list-header">
        <h3 className="chapter-list-title">Chapters ({chapters.length})</h3>

        <div className="chapter-controls">
          <button
            className="sort-btn"
            onClick={toggleSortOrder}
            title={`Sort ${sortOrder === "desc" ? "Ascending" : "Descending"}`}
            type="button"
          >
            {sortOrder === "desc" ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            {sortOrder === "desc" ? "Newest First" : "Oldest First"}
          </button>

          {uploaders.length > 1 && (
            <select
              className="uploader-filter"
              value={filterUploader}
              onChange={(e) => setFilterUploader(e.target.value)}
            >
              <option value="all">All Uploaders</option>
              {uploaders.map((uploader) => (
                <option key={uploader} value={uploader}>
                  {uploader}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="chapters-container">
        {filteredChapters.length === 0 ? (
          <div className="no-chapters">No chapters available</div>
        ) : (
          <div className="chapters">
            {filteredChapters.map((chapter, index) => (
              <div key={chapter.id} className={`chapter-item ${index === 0 ? "latest" : ""}`}>
                <div className="chapter-main">
                  <Link
                    to={`/read/${mangaId}/${chapter.id}`}
                    className="chapter-link"
                    state={{ mangaTitle, chapterTitle: chapter.title }}
                    onClick={(e) => handleChapterClick(chapter, e)}
                  >
                    <div className="chapter-info">
                      <span className="chapter-number">Chapter {chapter.number}</span>
                      {chapter.title && <span className="chapter-title">: {chapter.title}</span>}
                    </div>
                  </Link>

                  <div className="chapter-meta">
                    {chapter.date && (
                      <div className="meta-item">
                        <Calendar size={14} className="meta-icon" />
                        <span>{formatDate(chapter.date)}</span>
                      </div>
                    )}

                    {/* ✅ show views even if 0 */}
                    {chapter.views !== undefined && chapter.views !== null && (
                      <div className="meta-item">
                        <Eye size={14} className="meta-icon" />
                        <span>{Number(chapter.views).toLocaleString()}</span>
                      </div>
                    )}

                    {chapter.uploader && (
                      <div className="meta-item uploader">
                        <span>By {chapter.uploader}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="chapter-actions">
                  {chapter.downloadUrl && (
                    <a
                      href={chapter.downloadUrl}
                      className="action-btn download-btn"
                      download
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={16} />
                    </a>
                  )}

                  {chapter.description && (
                    <button
                      className="action-btn expand-btn"
                      onClick={() => toggleChapterExpand(chapter.id)}
                      type="button"
                    >
                      {expandedChapter === chapter.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>

                {expandedChapter === chapter.id && chapter.description && (
                  <div className="chapter-description">{chapter.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterList;
