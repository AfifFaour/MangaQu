// src/services/Api.js
import axios from "axios";

/* =========================
   AXIOS INSTANCE CONFIGURATION
   ========================= */

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

/* =========================
   REQUEST INTERCEPTOR
   ========================= */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
   ========================= */

api.interceptors.response.use(
  (response) => {
    // You can transform response data here if needed
    return response.data;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear expired token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
        error: error.message
      });
    }
    
    // Extract error message from response
    const errorData = error.response.data || {};
    const errorMessage = errorData.message || error.message || 'An error occurred';
    
    console.error('API Error:', {
      url: originalRequest.url,
      status: error.response.status,
      message: errorMessage,
      data: errorData
    });
    
    return Promise.reject({
      success: false,
      status: error.response.status,
      message: errorMessage,
      data: errorData,
      error: error.message
    });
  }
);

/* =========================
   HELPER FUNCTIONS
   ========================= */

const handleResponse = (response) => {
  return response;
};

const handleError = (error) => {
  console.error('API call failed:', error);
  throw error;
};

/* =========================
   AUTH API
   ========================= */

export const authAPI = {
  login: (email, password) =>
    api.post("/auth/login", { email, password })
      .then(handleResponse)
      .catch(handleError),

  register: (userData) =>
    api.post("/auth/register", userData)
      .then(handleResponse)
      .catch(handleError),

  logout: () =>
    api.post("/auth/logout")
      .then(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return { success: true, message: "Logged out successfully" };
      })
      .catch(handleError),

  getProfile: () =>
    api.get("/auth/profile")
      .then(handleResponse)
      .catch(handleError),

  updateProfile: (profileData) =>
    api.put("/auth/profile", profileData)
      .then(handleResponse)
      .catch(handleError),

  verifyToken: () =>
    api.get("/auth/verify")
      .then(handleResponse)
      .catch(handleError),

  refreshToken: () =>
    api.post("/auth/refresh")
      .then(handleResponse)
      .catch(handleError),
};

/* =========================
   MANGA API
   ========================= */

export const mangaAPI = {
  getAll: (params = {}) =>
    api.get("/manga", { params })
      .then(handleResponse)
      .catch(handleError),

  getById: (id) =>
    api.get(`/manga/${id}`)
      .then(handleResponse)
      .catch(handleError),

  search: (query, params = {}) =>
    api.get("/manga/search", {
      params: { q: query, ...params }
    })
    .then(handleResponse)
    .catch(handleError),

  getByGenre: (genre, sort = "newest", page = 1, limit = 20) =>
    api.get("/manga", {
      params: { genre, sort, page, limit }
    })
    .then(handleResponse)
    .catch(handleError),

  getNewest: (limit = 20) =>
    api.get("/manga/newest", { params: { limit } })
      .then(handleResponse)
      .catch(handleError),

  getUpdated: (limit = 20) =>
    api.get("/manga/updated", { params: { limit } })
      .then(handleResponse)
      .catch(handleError),

  getRelated: (id, limit = 10) =>
    api.get(`/manga/${id}/related`, { params: { limit } })
      .then(handleResponse)
      .catch(handleError),

  getByType: (type, sort = "newest", page = 1, limit = 20) =>
    api.get(`/manga/type/${type}`, {
      params: { sort, page, limit }
    })
    .then(handleResponse)
    .catch(handleError),

  getPaginated: (page = 1, limit = 20, sort = "newest", filters = {}) =>
    api.get("/manga", {
      params: { page, limit, sort, ...filters }
    })
    .then(handleResponse)
    .catch(handleError),

  getPopular: (limit = 10) =>
    api.get("/manga/popular", { params: { limit } })
      .then(handleResponse)
      .catch(handleError),

  getCompleted: (limit = 20) =>
    api.get("/manga/completed", { params: { limit } })
      .then(handleResponse)
      .catch(handleError),

  getOngoing: (limit = 20) =>
    api.get("/manga/ongoing", { params: { limit } })
      .then(handleResponse)
      .catch(handleError),

  incrementViews: (mangaId) =>
    api.post(`/manga/${mangaId}/view`)
      .then(handleResponse)
      .catch(handleError),
};

/* =========================
   CHAPTER API
   ========================= */

export const chapterAPI = {
  getByManga: (mangaId, params = {}) =>
    api.get(`/manga/${mangaId}/chapters`, { params })
      .then(handleResponse)
      .catch(handleError),

  getPages: (chapterId) =>
    api.get(`/chapters/${chapterId}/pages`)
      .then(handleResponse)
      .catch(handleError),

  saveReadingProgress: (data) =>
    api.post("/reading/progress", data)
      .then(handleResponse)
      .catch(handleError),

  getReadingProgress: (mangaId) =>
    api.get(`/reading/progress/${mangaId}`)
      .then(handleResponse)
      .catch(handleError),

  getLatestChapter: (mangaId) =>
    api.get(`/manga/${mangaId}/chapters/latest`)
      .then(handleResponse)
      .catch(handleError),

  getChapterInfo: (chapterId) =>
    api.get(`/chapters/${chapterId}`)
      .then(handleResponse)
      .catch(handleError),

  getNextChapter: (mangaId, currentChapter) =>
    api.get(`/manga/${mangaId}/chapters/next/${currentChapter}`)
      .then(handleResponse)
      .catch(handleError),

  getPrevChapter: (mangaId, currentChapter) =>
    api.get(`/manga/${mangaId}/chapters/prev/${currentChapter}`)
      .then(handleResponse)
      .catch(handleError),
};

/* =========================
   USER API
   ========================= */

export const userAPI = {
  getFavorites: (params = {}) =>
    api.get("/favorites", { params })
      .then(handleResponse)
      .catch(handleError),

  addFavorite: (mangaId) =>
    api.post("/favorites", { mangaId })
      .then(handleResponse)
      .catch(handleError),

  removeFavorite: (mangaId) =>
    api.delete(`/favorites/${mangaId}`)
      .then(handleResponse)
      .catch(handleError),

  checkFavorite: (mangaId) =>
    api.get(`/favorites/check/${mangaId}`)
      .then(handleResponse)
      .catch(handleError),

  getReadingHistory: (params = {}) =>
    api.get("/user/history", { params })
      .then(handleResponse)
      .catch(handleError),

  updateProfile: (profileData) =>
    api.put("/user/profile", profileData)
      .then(handleResponse)
      .catch(handleError),

  changePassword: (passwordData) =>
    api.put("/user/password", passwordData)
      .then(handleResponse)
      .catch(handleError),

  getBookmarks: () =>
    api.get("/user/bookmarks")
      .then(handleResponse)
      .catch(handleError),

  addBookmark: (data) =>
    api.post("/user/bookmarks", data)
      .then(handleResponse)
      .catch(handleError),

  removeBookmark: (mangaId) =>
    api.delete(`/user/bookmarks/${mangaId}`)
      .then(handleResponse)
      .catch(handleError),

  getLibrary: (params = {}) =>
    api.get("/user/library", { params })
      .then(handleResponse)
      .catch(handleError),
};

/* =========================
   ADMIN API
   ========================= */

export const adminAPI = {
  /* ===== DASHBOARD ===== */
  getDashboardStats: () =>
    api.get("/admin/dashboard")
      .then(handleResponse)
      .catch(handleError),

  /* ===== MANGA MANAGEMENT ===== */
  // Get manga list with filters
  getMangaList: (params = {}) =>
    api.get("/admin/manga", { params })
      .then(handleResponse)
      .catch(handleError),

  // Get single manga details
  getMangaDetail: (id) =>
    api.get(`/admin/manga/${id}`)
      .then(handleResponse)
      .catch(handleError),

  // Create new manga
  createManga: (mangaData) =>
    api.post("/admin/manga", mangaData)
      .then(handleResponse)
      .catch(handleError),

  // Update manga
  updateManga: (id, mangaData) =>
    api.put(`/admin/manga/${id}`, mangaData)
      .then(handleResponse)
      .catch(handleError),

  // Delete manga
  deleteManga: (id) =>
    api.delete(`/admin/manga/${id}`)
      .then(handleResponse)
      .catch(handleError),

  // Bulk actions
  bulkUpdateManga: (data) =>
    api.post("/admin/manga/bulk", data)
      .then(handleResponse)
      .catch(handleError),

  // Update manga status
  updateMangaStatus: (id, status) =>
    api.patch(`/admin/manga/${id}/status`, { status })
      .then(handleResponse)
      .catch(handleError),

  // Bulk status update
  bulkUpdateStatus: (ids, status) =>
    api.patch("/admin/manga/bulk-status", { ids, status })
      .then(handleResponse)
      .catch(handleError),

  // Export manga data
  exportManga: (params = {}) =>
    api.get("/admin/manga/export", {
      params,
      responseType: 'blob'
    })
      .then(response => response)
      .catch(handleError),

  /* ===== CHAPTER MANAGEMENT ===== */
  // Get chapters by manga
  getChaptersByManga: (mangaId, params = {}) =>
    api.get(`/admin/manga/${mangaId}/chapters`, { params })
      .then(handleResponse)
      .catch(handleError),

  // Get chapter details
  getChapterDetail: (chapterId) =>
    api.get(`/admin/chapters/${chapterId}`)
      .then(handleResponse)
      .catch(handleError),

  // Create new chapter
  createChapter: (chapterData) =>
    api.post("/admin/chapters", chapterData)
      .then(handleResponse)
      .catch(handleError),

  // Update chapter
  updateChapter: (chapterId, chapterData) =>
    api.put(`/admin/chapters/${chapterId}`, chapterData)
      .then(handleResponse)
      .catch(handleError),

  // Delete chapter
  deleteChapter: (chapterId) =>
    api.delete(`/admin/chapters/${chapterId}`)
      .then(handleResponse)
      .catch(handleError),

  // Upload chapter pages
  uploadChapterPages: (chapterId, formData) =>
    api.post(`/admin/chapters/${chapterId}/pages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(handleResponse)
    .catch(handleError),

  // Bulk chapter operations
  bulkChapterAction: (data) =>
    api.post("/admin/chapters/bulk", data)
      .then(handleResponse)
      .catch(handleError),

  /* ===== UPLOAD MANAGEMENT ===== */
  // Upload cover image
  uploadCover: (formData) =>
    api.post("/admin/upload/cover", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(handleResponse)
    .catch(handleError),

  // Upload multiple images
  uploadImages: (formData) =>
    api.post("/admin/upload/images", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(handleResponse)
    .catch(handleError),

  // Bulk upload chapters
  bulkUploadChapters: (formData) =>
    api.post("/admin/upload/bulk", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(handleResponse)
    .catch(handleError),

  /* ===== USER MANAGEMENT ===== */
  // Get users list
  getUsers: (params = {}) =>
    api.get("/admin/users", { params })
      .then(handleResponse)
      .catch(handleError),

  // Get user details
  getUserDetail: (userId) =>
    api.get(`/admin/users/${userId}`)
      .then(handleResponse)
      .catch(handleError),

  // Update user
  updateUser: (userId, userData) =>
    api.put(`/admin/users/${userId}`, userData)
      .then(handleResponse)
      .catch(handleError),

  // Delete user
  deleteUser: (userId) =>
    api.delete(`/admin/users/${userId}`)
      .then(handleResponse)
      .catch(handleError),

  // Update user role
  updateUserRole: (userId, role) =>
    api.patch(`/admin/users/${userId}/role`, { role })
      .then(handleResponse)
      .catch(handleError),

  // Ban/unban user
  toggleUserBan: (userId, banned) =>
    api.patch(`/admin/users/${userId}/ban`, { banned })
      .then(handleResponse)
      .catch(handleError),

  /* ===== GENRE/TYPE MANAGEMENT ===== */
  // Get all genres
  getGenres: () =>
    api.get("/admin/genres")
      .then(handleResponse)
      .catch(handleError),

  // Create genre
  createGenre: (genreData) =>
    api.post("/admin/genres", genreData)
      .then(handleResponse)
      .catch(handleError),

  // Update genre
  updateGenre: (id, genreData) =>
    api.put(`/admin/genres/${id}`, genreData)
      .then(handleResponse)
      .catch(handleError),

  // Delete genre
  deleteGenre: (id) =>
    api.delete(`/admin/genres/${id}`)
      .then(handleResponse)
      .catch(handleError),

  /* ===== STATISTICS ===== */
  // Get site statistics
  getSiteStats: (params = {}) =>
    api.get("/admin/stats", { params })
      .then(handleResponse)
      .catch(handleError),

  // Get monthly stats
  getMonthlyStats: (year, month) =>
    api.get(`/admin/stats/monthly/${year}/${month}`)
      .then(handleResponse)
      .catch(handleError),

  // Get user growth stats
  getUserGrowth: (params = {}) =>
    api.get("/admin/stats/user-growth", { params })
      .then(handleResponse)
      .catch(handleError),

  // Get manga growth stats
  getMangaGrowth: (params = {}) =>
    api.get("/admin/stats/manga-growth", { params })
      .then(handleResponse)
      .catch(handleError),

  /* ===== SETTINGS ===== */
  // Get site settings
  getSettings: () =>
    api.get("/admin/settings")
      .then(handleResponse)
      .catch(handleError),

  // Update site settings
  updateSettings: (settings) =>
    api.put("/admin/settings", settings)
      .then(handleResponse)
      .catch(handleError),

  // Clear cache
  clearCache: () =>
    api.post("/admin/cache/clear")
      .then(handleResponse)
      .catch(handleError),

  // Backup database
  backupDatabase: () =>
    api.get("/admin/backup", { responseType: 'blob' })
      .then(response => response)
      .catch(handleError),

  // Restore database
  restoreDatabase: (formData) =>
    api.post("/admin/restore", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(handleResponse)
    .catch(handleError),
};

/* =========================
   COMMENTS API
   ========================= */

export const commentAPI = {
  getComments: (mangaId, params = {}) =>
    api.get(`/manga/${mangaId}/comments`, { params })
      .then(handleResponse)
      .catch(handleError),

  addComment: (mangaId, comment) =>
    api.post(`/manga/${mangaId}/comments`, { comment })
      .then(handleResponse)
      .catch(handleError),

  updateComment: (commentId, comment) =>
    api.put(`/comments/${commentId}`, { comment })
      .then(handleResponse)
      .catch(handleError),

  deleteComment: (commentId) =>
    api.delete(`/comments/${commentId}`)
      .then(handleResponse)
      .catch(handleError),

  likeComment: (commentId) =>
    api.post(`/comments/${commentId}/like`)
      .then(handleResponse)
      .catch(handleError),

  unlikeComment: (commentId) =>
    api.delete(`/comments/${commentId}/like`)
      .then(handleResponse)
      .catch(handleError),
};

/* =========================
   RATING API
   ========================= */

export const ratingAPI = {
  getRating: (mangaId) =>
    api.get(`/manga/${mangaId}/rating`)
      .then(handleResponse)
      .catch(handleError),

  addRating: (mangaId, rating) =>
    api.post(`/manga/${mangaId}/rating`, { rating })
      .then(handleResponse)
      .catch(handleError),

  updateRating: (mangaId, rating) =>
    api.put(`/manga/${mangaId}/rating`, { rating })
      .then(handleResponse)
      .catch(handleError),

  deleteRating: (mangaId) =>
    api.delete(`/manga/${mangaId}/rating`)
      .then(handleResponse)
      .catch(handleError),
};

/* =========================
   NOTIFICATION API
   ========================= */

export const notificationAPI = {
  getNotifications: (params = {}) =>
    api.get("/notifications", { params })
      .then(handleResponse)
      .catch(handleError),

  markAsRead: (notificationId) =>
    api.patch(`/notifications/${notificationId}/read`)
      .then(handleResponse)
      .catch(handleError),

  markAllAsRead: () =>
    api.patch("/notifications/read-all")
      .then(handleResponse)
      .catch(handleError),

  deleteNotification: (notificationId) =>
    api.delete(`/notifications/${notificationId}`)
      .then(handleResponse)
      .catch(handleError),

  getUnreadCount: () =>
    api.get("/notifications/unread-count")
      .then(handleResponse)
      .catch(handleError),
};

/* =========================
   UPLOAD API
   ========================= */

export const uploadAPI = {
  // Single file upload
  uploadFile: (formData, onUploadProgress) =>
    api.post("/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
    .then(handleResponse)
    .catch(handleError),

  // Multiple files upload
  uploadFiles: (formData, onUploadProgress) =>
    api.post("/upload/multiple", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
    .then(handleResponse)
    .catch(handleError),

  // Delete uploaded file
  deleteFile: (filePath) =>
    api.delete("/upload", { data: { filePath } })
      .then(handleResponse)
      .catch(handleError),
};

/* =========================
   EXPORT ALL APIs
   ========================= */

export const API = {
  auth: authAPI,
  manga: mangaAPI,
  chapter: chapterAPI,
  user: userAPI,
  admin: adminAPI,
  comment: commentAPI,
  rating: ratingAPI,
  notification: notificationAPI,
  upload: uploadAPI,
};

/* =========================
   UTILITY FUNCTIONS
   ========================= */

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  return !!token;
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

// Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
};

// Set authentication data
export const setAuthData = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

// Clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// API URL builder for images
export const getImageUrl = (path) => {
  if (!path) return '/images/default-cover.jpg';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

/* =========================
   DEFAULT EXPORT
   ========================= */

export default api;