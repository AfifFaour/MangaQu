// src/hooks/UseManga.js
import { useState, useEffect, useCallback } from 'react';
import { mangaAPI, chapterAPI, userAPI } from '../services/Api';

export const useManga = () => {
  const [mangaList, setMangaList] = useState([]);
  const [featuredManga, setFeaturedManga] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);

  // Fetch all manga with pagination
  const fetchManga = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await mangaAPI.getAllManga(page, limit);
      setMangaList(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch manga';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch manga by ID
  const fetchMangaById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await mangaAPI.getMangaById(id);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch manga details';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search manga
  const searchManga = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await mangaAPI.searchManga(query);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Search failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch chapters for a manga
  const fetchChapters = useCallback(async (mangaId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chapterAPI.getChaptersByManga(mangaId);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch chapters';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch chapter pages
  const fetchChapterPages = useCallback(async (chapterId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chapterAPI.getChapterPages(chapterId);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch chapter pages';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save reading progress
  const saveReadingProgress = useCallback(async (chapterId, pageNumber) => {
    try {
      await chapterAPI.saveReadingProgress({
        chapterId,
        pageNumber,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error('Failed to save progress:', err);
      return false;
    }
  }, []);

  // Favorites management
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await userAPI.getFavorites();
      setFavorites(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      return [];
    }
  }, []);

  const addFavorite = useCallback(async (mangaId) => {
    try {
      await userAPI.addFavorite(mangaId);
      setFavorites(prev => [...prev, mangaId]);
      return true;
    } catch (err) {
      console.error('Failed to add favorite:', err);
      return false;
    }
  }, []);

  const removeFavorite = useCallback(async (mangaId) => {
    try {
      await userAPI.removeFavorite(mangaId);
      setFavorites(prev => prev.filter(id => id !== mangaId));
      return true;
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      return false;
    }
  }, []);

  const isFavorite = useCallback((mangaId) => {
    return favorites.includes(mangaId);
  }, [favorites]);

  // Fetch reading history
  const fetchReadingHistory = useCallback(async () => {
    try {
      const response = await userAPI.getReadingHistory();
      setReadingHistory(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch history:', err);
      return [];
    }
  }, []);

  // Fetch newest manga
  const fetchNewestManga = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mangaAPI.getNewestManga();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch newest manga';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch updated manga
  const fetchUpdatedManga = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mangaAPI.getUpdatedManga();
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch updated manga';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch manga by genre
  const fetchMangaByGenre = useCallback(async (genreId) => {
    setLoading(true);
    try {
      const response = await mangaAPI.getMangaByGenre(genreId);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch manga by genre';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchManga(1, 10);
        // Could add more initial fetches here
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };

    initializeData();
  }, [fetchManga]);

  return {
    // State
    mangaList,
    featuredManga,
    genres,
    loading,
    error,
    favorites,
    readingHistory,
    
    // Manga Operations
    fetchManga,
    fetchMangaById,
    searchManga,
    fetchNewestManga,
    fetchUpdatedManga,
    fetchMangaByGenre,
    
    // Chapter Operations
    fetchChapters,
    fetchChapterPages,
    saveReadingProgress,
    
    // User Operations
    fetchFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    fetchReadingHistory,
    
    // Utility
    setError,
    clearError: () => setError(null)
  };
};