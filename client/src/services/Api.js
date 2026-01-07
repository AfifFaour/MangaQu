// src/services/Api.js
import axios from "axios";
import LoginService from "./LoginService";

/**
 * In production set (Render frontend env):
 * REACT_APP_API_ORIGIN=https://mangaqu-0ztr.onrender.com
 *
 * In dev it falls back to localhost.
 */
const normalizeOrigin = (v) => {
  if (!v) return "";
  const unquoted = v.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  return unquoted.trim().replace(/\/+$/, "");
};

export const API_ORIGIN =
  normalizeOrigin(process.env.REACT_APP_API_ORIGIN) || "http://localhost:5001";

export const API_BASE = `${API_ORIGIN}/api`;

export const toAssetUrl = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${API_ORIGIN}${clean}`;
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // ✅ using Bearer token, not cookies
});

// ✅ ONE interceptor only (no localStorage here)
api.interceptors.request.use(
  (config) => {
    const token = LoginService?.getToken?.(); // safe call
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  verify: () => api.post("/auth/verify", {}),
};

export const mangaAPI = {
  getAll: (params = {}) => api.get("/manga", { params }),
  getOne: (id) => api.get(`/manga/${id}`),
  getRelated: (id) => api.get(`/manga/${id}/related`),

  getNewest: () => api.get("/manga", { params: { sort: "newest" } }),
  getUpdated: () => api.get("/manga", { params: { sort: "updated" } }),
  getPopular: () => api.get("/manga", { params: { sort: "popular" } }),
  getTopRated: () => api.get("/manga", { params: { sort: "rating" } }),
  getByType: (type, sort = "updated") => api.get("/manga", { params: { type, sort } }),
};

export const chapterAPI = {
  getByManga: (mangaId) => api.get(`/manga/${mangaId}/chapters`),
  getChapterPages: (chapterId) => api.get(`/chapters/${chapterId}/pages`),

  /**
   * ✅ NEW (replace /user/progress)
   * Save chapter progress:
   * payload: { manga_id, chapter_id, page_number }
   */
  saveReadingProgress: (payload) => api.post("/reading-history/chapter", payload),

  /**
   * (Optional) Load last chapter progress for a manga
   * GET /api/reading-history/chapter/:mangaId
   */
  getReadingProgress: (mangaId) => api.get(`/reading-history/chapter/${mangaId}`),
};

/**
 * ✅ NEW: Reading History API (Chapters + Volumes)
 * Works only when logged in (Bearer token auto attached).
 */
export const readingHistoryAPI = {
  // --- chapters ---
  saveChapter: ({ manga_id, chapter_id, page_number }) =>
    api.post("/reading-history/chapter", { manga_id, chapter_id, page_number }),

  getChapter: (mangaId) => api.get(`/reading-history/chapter/${mangaId}`),

  // --- volumes ---
  saveVolume: ({ manga_id, volume_id, page_number }) =>
    api.post("/reading-history/volume", { manga_id, volume_id, page_number }),

  getVolume: (mangaId) => api.get(`/reading-history/volume/${mangaId}`),
};

export const userAPI = {
  getFavorites: () => api.get("/user/favorites"),
  addFavorite: (mangaId) => api.post(`/user/favorites/${mangaId}`),
  removeFavorite: (mangaId) => api.delete(`/user/favorites/${mangaId}`),
};
export const volumeAPI = {
  getByManga: (mangaId) => api.get(`/manga/${mangaId}/volumes`),
  getVolumePages: (volumeId) => api.get(`/volumes/${volumeId}/pages`), // backend already returns absolute URLs
};

export default api;
