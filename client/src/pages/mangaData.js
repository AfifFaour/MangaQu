// src/pages/mangaData.js
import { mangaAPI } from "../services/Api";

// ✅ keep this export so old imports don't crash
export const mangaData = [];

// ✅ API-based helpers (same names you already use)
export const getAllManga = async () => {
  const res = await mangaAPI.getAllManga();
  return res.data;
};

export const getMangaById = async (id) => {
  const res = await mangaAPI.getMangaById(id);
  return res.data;
};

export const getPopularManga = async () => {
  const res = await mangaAPI.getAllManga();
  return [...res.data].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 12);
};

export const getNewestManga = async () => {
  const res = await mangaAPI.getNewestManga();
  return res.data;
};

export const getUpdatedManga = async () => {
  const res = await mangaAPI.getUpdatedManga();
  return res.data;
};

export const getMangaByType = async (type) => {
  const res = await mangaAPI.getMangaByType(type);
  return res.data;
};

export const getMangaByGenre = async (genre) => {
  const res = await mangaAPI.getAllManga();
  return res.data.filter((m) => {
    const list = Array.isArray(m.genres)
      ? m.genres
      : (m.genres || "").split(",").map((x) => x.trim());
    return list.some((g) => g.toLowerCase() === String(genre).toLowerCase());
  });
};

export const searchManga = async (query) => {
  const q = String(query || "").toLowerCase();
  const res = await mangaAPI.getAllManga();
  return res.data.filter((m) => {
    const t = (m.title || "").toLowerCase();
    const d = (m.description || "").toLowerCase();
    const g = (m.genres || "").toLowerCase();
    return t.includes(q) || d.includes(q) || g.includes(q);
  });
};
