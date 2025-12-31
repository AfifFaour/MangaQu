// src/services/Api.js
import axios from "axios";

export const API_ORIGIN = "http://localhost:5001";
export const API_BASE = `${API_ORIGIN}/api`;

export const toAssetUrl = (p) => {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  // if DB already stores "/Assets/..." or "Assets/..." handle both
  const clean = p.startsWith("/") ? p : `/${p}`;
  return `${API_ORIGIN}${clean}`;
};

const api = axios.create({
  baseURL: API_BASE, // ✅ includes /api
  withCredentials: true,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  verify: () => api.post("/auth/verify", {}),
  profile: () => api.get("/auth/profile"),
};

export const mangaAPI = {
  getAll: (params = {}) => api.get("/manga", { params }),
  getOne: (id) => api.get(`/manga/${id}`),
  getRelated: (id) => api.get(`/manga/${id}/related`),

  // convenience
  getNewest: () => api.get("/manga", { params: { sort: "newest" } }),
  getUpdated: () => api.get("/manga", { params: { sort: "updated" } }),
  getPopular: () => api.get("/manga", { params: { sort: "popular" } }),
  getTopRated: () => api.get("/manga", { params: { sort: "rating" } }),
  getByType: (type, sort = "updated") =>
    api.get("/manga", { params: { type, sort } }),

  // admin
  create: (payload) => api.post("/manga", payload),
  update: (id, payload) => api.put(`/manga/${id}`, payload),
  remove: (id) => api.delete(`/manga/${id}`),
};

export const chapterAPI = {
  getByManga: (mangaId) => api.get(`/manga/${mangaId}/chapters`),

  // reader
  getChapterPages: (chapterId) => api.get(`/chapters/${chapterId}/pages`),

  // admin
  create: (mangaId, payload) => api.post(`/manga/${mangaId}/chapters`, payload),
  update: (chapterId, payload) => api.put(`/chapters/${chapterId}`, payload),
  remove: (chapterId) => api.delete(`/chapters/${chapterId}`),

  // progress (if you use it later)
  saveReadingProgress: (payload) => api.post("/reading/progress", payload),
};

export const userAPI = {
  getFavorites: () => api.get("/user/favorites"),
  addFavorite: (mangaId) => api.post(`/user/favorites/${mangaId}`),
  removeFavorite: (mangaId) => api.delete(`/user/favorites/${mangaId}`),
};

export default api;
