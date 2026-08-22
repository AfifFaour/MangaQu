// src/services/Api.js
import axios from "axios";
import LoginService from "./LoginService";

/**
 * Production can override the API with REACT_APP_API_ORIGIN.
 * When it is not provided, use the deployed Render API in production
 * and localhost during development.
 */
const normalizeOrigin = (v) => {
  if (!v) return "";
  const unquoted = v.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  return unquoted.trim().replace(/\/+$/, "");
};

const configuredOrigin = normalizeOrigin(process.env.REACT_APP_API_ORIGIN);
const productionOrigin = "https://mangaqu-0ztr.onrender.com";

export const API_ORIGIN =
  configuredOrigin ||
  (process.env.NODE_ENV === "production" ? productionOrigin : "http://localhost:5001");

export const API_BASE = `${API_ORIGIN}/api`;

export const toAssetUrl = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${API_ORIGIN}${clean}`;
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = LoginService?.getToken?.();
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
  saveReadingProgress: (payload) => api.post("/reading-history/chapter", payload),
  getReadingProgress: (mangaId) => api.get(`/reading-history/chapter/${mangaId}`),
};

export const readingHistoryAPI = {
  saveChapter: ({ manga_id, chapter_id, page_number }) =>
    api.post("/reading-history/chapter", { manga_id, chapter_id, page_number }),
  getChapter: (mangaId) => api.get(`/reading-history/chapter/${mangaId}`),
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
  getVolumePages: (volumeId) => api.get(`/volumes/${volumeId}/pages`),
};

export default api;
