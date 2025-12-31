// src/pages/Favorite.js
import React, { useEffect, useState } from "react";
import MangaGrid from "../Components/manga/MangaGrid";
import { Heart } from "lucide-react";
import api from "../services/Api";
import { useAuth } from "../context/AuthContext";
import "../styles/Pages.css";

const Favorite = () => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState("");

  const { getToken, isAuthenticated } = useAuth();

  useEffect(() => {
    let alive = true;

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError("");

        if (!isAuthenticated()) {
          setAuthRequired(true);
          setMangas([]);
          return;
        }

        const token = getToken();
        if (!token) {
          setAuthRequired(true);
          setMangas([]);
          return;
        }

        const res = await api.get("/user/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!alive) return;

        setAuthRequired(false);
        setMangas(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!alive) return;

        if (err.response?.status === 401 || err.response?.status === 403) {
          setAuthRequired(true);
          setMangas([]);
        } else {
          setError(err.response?.data?.error || "Failed to load favorites");
          setMangas([]);
        }
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    fetchFavorites();

    return () => {
      alive = false;
    };
  }, [getToken, isAuthenticated]);

  // =========================
  // AUTH REQUIRED UI
  // =========================
  if (authRequired) {
    return (
      <div className="browse-page">
        <div className="auth-required">
          <Heart size={64} className="auth-icon" />
          <h2>Sign in to view favorites</h2>
          <p>Please log in to see your favorite manga collection</p>
          <button className="auth-button" onClick={() => (window.location.href = "/login")}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (error) return <div className="error">{error}</div>;

  const lastAdded =
    mangas.length > 0
      ? new Date(
          Math.max(...mangas.map((m) => new Date(m.favorited_at || m.created_at || Date.now()).getTime()))
        ).toLocaleDateString()
      : null;

  // =========================
  // MAIN RENDER
  // =========================
  return (
    <div className="browse-page">
      <div className="browse-header">
        <div className="favorites-header">
          <Heart size={32} className="favorites-icon" />
          <div>
            <h1>My Favorites</h1>
            <p>Your personal manga collection</p>
          </div>
        </div>

        {mangas.length > 0 && (
          <div className="favorites-stats">
            <span>
              {mangas.length} {mangas.length === 1 ? "manga" : "mangas"} saved
            </span>
            {lastAdded && <span className="last-added">Last added: {lastAdded}</span>}
          </div>
        )}
      </div>

      {mangas.length === 0 && !loading ? (
        <div className="empty-favorites">
          <Heart size={48} className="empty-icon" />
          <h2>No favorites yet</h2>
          <p>Start adding manga to your favorites to see them here</p>
          <button className="browse-button" onClick={() => (window.location.href = "/browse")}>
            Browse Manga
          </button>
        </div>
      ) : (
        <MangaGrid mangas={mangas} title="My Favorites" loading={loading} showFilters />
      )}
    </div>
  );
};

export default Favorite;
