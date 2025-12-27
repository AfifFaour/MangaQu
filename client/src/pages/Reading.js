// src/pages/Reading.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/Api';
import '../styles/Reading.css';

const Reading = () => {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();

  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* =========================
     FETCH DATA
     ========================= */
  useEffect(() => {
    fetchReadingData();
  }, [mangaId, chapterId]);

  const fetchReadingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [mangaRes, chaptersRes, pagesRes] = await Promise.all([
        api.get(`/v1/manga/${mangaId}`),
        api.get(`/v1/manga/${mangaId}/chapters`),
        api.get(`/v1/chapters/${chapterId}/pages`)
      ]);

      setManga(mangaRes.data);
      setChapters(chaptersRes.data);

      const chapter = chaptersRes.data.find(
        ch => ch.id === Number(chapterId)
      );

      if (!chapter) {
        throw new Error('Chapter not found');
      }

      setCurrentChapter(chapter);
      setPages(pagesRes.data);
      setCurrentPage(1);

    } catch (err) {
      console.error(err);
      setError('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     PAGE NAVIGATION
     ========================= */
  const handlePageChange = (direction) => {
    if (direction === 'next' && currentPage < pages.length) {
      setCurrentPage(p => p + 1);
    }

    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  };

  /* =========================
     CHAPTER NAVIGATION
     ========================= */
  const handleChapterChange = (newChapterId) => {
    navigate(`/manga/${mangaId}/chapter/${newChapterId}`);
  };

  /* =========================
     KEYBOARD CONTROLS
     ========================= */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePageChange('prev');
      if (e.key === 'ArrowRight') handlePageChange('next');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentPage, pages.length]);

  /* =========================
     STATES
     ========================= */
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
        <button onClick={() => navigate(`/manga/${mangaId}`)}>
          Back to Manga
        </button>
      </div>
    );
  }

  if (!pages.length) {
    return (
      <div className="error-container">
        <p>No pages found.</p>
      </div>
    );
  }

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="reading-container">
      <div className="reader-header">
        <h1>{manga?.title}</h1>
        <h2>
          Chapter {currentChapter?.number}: {currentChapter?.title}
        </h2>
        <p>Page {currentPage} of {pages.length}</p>

        <select
          value={currentChapter.id}
          onChange={(e) => handleChapterChange(e.target.value)}
        >
          {chapters.map(ch => (
            <option key={ch.id} value={ch.id}>
              Chapter {ch.number}
            </option>
          ))}
        </select>
      </div>

      <div className="reader-nav">
        <button
          onClick={() => handlePageChange('prev')}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <button
          onClick={() => handlePageChange('next')}
          disabled={currentPage === pages.length}
        >
          Next
        </button>
      </div>

      <div className="reader-content">
        <img
          src={pages[currentPage - 1]?.imageUrl}
          alt={`Page ${currentPage}`}
          className="reader-page"
        />
      </div>
    </div>
  );
};

export default Reading;
