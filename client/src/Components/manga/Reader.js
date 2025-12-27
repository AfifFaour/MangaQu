import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { chapterAPI } from '../../services/Api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Reader.css';

const Reader = () => {
  const { chapterId } = useParams();

  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  /* =========================
     FETCH CHAPTER PAGES
     ========================= */
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const res = await chapterAPI.getChapterPages(chapterId);
        setPages(res.data);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to load chapter pages', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [chapterId]);

  /* =========================
     READING PROGRESS
     ========================= */
  const saveReadingProgress = async (pageNumber) => {
    if (!user) return;

    try {
      await chapterAPI.saveReadingProgress({
        chapterId,
        pageNumber,
      });
    } catch (err) {
      console.error('Failed to save reading progress', err);
    }
  };

  /* =========================
     NAVIGATION
     ========================= */
  const handleNextPage = () => {
    if (currentPage < pages.length) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      saveReadingProgress(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      saveReadingProgress(prevPage);
    }
  };

  /* =========================
     UI STATES
     ========================= */
  if (loading) {
    return <div className="reader-loading">Loading chapter...</div>;
  }

  if (pages.length === 0) {
    return <div className="reader-empty">No pages found.</div>;
  }

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="reader-container">
      <div className="reader-nav">
        <button onClick={handlePrevPage} disabled={currentPage === 1}>
          Previous
        </button>

        <span>
          Page {currentPage} of {pages.length}
        </span>

        <button
          onClick={handleNextPage}
          disabled={currentPage === pages.length}
        >
          Next
        </button>
      </div>

      <div className="reader-content">
        <img
          src={pages[currentPage - 1].imageUrl}
          alt={`Page ${currentPage}`}
          className="reader-page"
        />
      </div>
    </div>
  );
};

export default Reader;
