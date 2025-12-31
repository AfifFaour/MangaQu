import api from "../services/Api";

/**
 * Public
 */
export const getChaptersByMangaId = async (mangaId) => {
  const res = await api.get(`/api/manga/${mangaId}/chapters`);

  // Map DB -> UI shape expected by ChapterList
  return res.data.map((c) => ({
    id: c.id,
    number: Number(c.chapter_number),
    title: c.title || `Chapter ${c.chapter_number}`,
    date: c.created_at,
    views: c.view_count || 0,
    pages: Array.isArray(c.pages) ? c.pages : [],
  }));
};

export const getChapterById = async (mangaId, chapterId) => {
  const chapters = await getChaptersByMangaId(mangaId);
  return chapters.find((ch) => ch.id === Number(chapterId)) || null;
};

export const getLatestChapter = async (mangaId) => {
  const chapters = await getChaptersByMangaId(mangaId);
  return chapters.length ? chapters[chapters.length - 1] : null;
};

export const getTotalChapters = async (mangaId) => {
  const chapters = await getChaptersByMangaId(mangaId);
  return chapters.length;
};

export const searchChapters = async (mangaId, query) => {
  const chapters = await getChaptersByMangaId(mangaId);
  const lower = query.toLowerCase();
  return chapters.filter(
    (c) =>
      c.title.toLowerCase().includes(lower) ||
      c.number.toString().includes(query)
  );
};

/**
 * Admin (Dashboard)
 * token = Bearer token
 */
export const createChapter = async (mangaId, payload, token) => {
  const res = await api.post(`/api/manga/${mangaId}/chapters`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateChapter = async (chapterId, payload, token) => {
  const res = await api.put(`/api/chapters/${chapterId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteChapter = async (chapterId, token) => {
  const res = await api.delete(`/api/chapters/${chapterId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
