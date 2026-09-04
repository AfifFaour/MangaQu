import React, { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import api from "../../services/Api";
import LoginService from "../../services/LoginService";

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const Rating = ({
  mangaId,
  size = 18,
  showCount = true,
  showLabel = true,
  className = "",
  onSaved,
}) => {
  const safeMangaId = useMemo(() => String(mangaId || ""), [mangaId]);

  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [myRating, setMyRating] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState(null);

  const isAuthError = (e) => {
    const s = e?.response?.status;
    return s === 401 || s === 403;
  };

  const fetchStats = async () => {
    const res = await api.get(`/manga/${safeMangaId}/rating`);
    const a = Number(res.data?.rating_avg ?? 0);
    const c = Number(res.data?.rating_count ?? 0);
    setAvg(Number.isFinite(a) ? a : 0);
    setCount(Number.isFinite(c) ? c : 0);
  };

  const fetchMine = async () => {
    if (!LoginService?.isLoggedIn?.() || !LoginService?.getToken?.()) {
      setMyRating(null);
      return;
    }
    const res = await api.get(`/manga/${safeMangaId}/my-rating`);
    const r = res.data?.rating;
    setMyRating(r === null || r === undefined ? null : Number(r));
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!safeMangaId) return;

      try {
        setLoading(true);
        setErr(null);
        await fetchStats();

        if (LoginService?.isLoggedIn?.() && LoginService?.getToken?.()) {
          try {
            await fetchMine();
          } catch (e) {
            if (!isAuthError(e)) console.error("my rating load failed", e);
            setMyRating(null);
          }
        } else {
          setMyRating(null);
        }
      } catch (e) {
        console.error("rating load failed", e);
        if (!alive) return;
        setErr("Failed to load rating");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeMangaId]);

  const handleRate = async (value) => {
    const v = clamp(Number(value), 1, 5);

    if (!LoginService?.isLoggedIn?.() || !LoginService?.getToken?.()) {
      alert("Please login to rate.");
      return;
    }

    try {
      setSaving(true);
      setErr(null);

      const res = await api.post(`/manga/${safeMangaId}/rate`, { rating: v });

      const nextAvg = Number(res.data?.rating_avg ?? avg);
      const nextCount = Number(res.data?.rating_count ?? count);

      setMyRating(v);
      setAvg(Number.isFinite(nextAvg) ? nextAvg : avg);
      setCount(Number.isFinite(nextCount) ? nextCount : count);

      onSaved?.({
        rating_avg: Number.isFinite(nextAvg) ? nextAvg : avg,
        rating_count: Number.isFinite(nextCount) ? nextCount : count,
        your_rating: v,
      });
    } catch (e) {
      console.error("rate save failed", e);
      if (isAuthError(e)) {
        alert("Your login expired. Please login again.");
      } else {
        alert(e?.response?.data?.error || "Failed to save rating");
      }
    } finally {
      setSaving(false);
    }
  };

  const avgFilled = useMemo(() => {
    const n = Number(avg);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n);
  }, [avg]);

  const avgText = useMemo(() => {
    const n = Number(avg);
    if (!Number.isFinite(n) || n <= 0) return "0.0";
    return n.toFixed(1);
  }, [avg]);

  if (!safeMangaId) return null;

  return (
    <div className={`mq-rating ${className}`} style={{ opacity: loading ? 0.85 : 1 }}>
      {showLabel && <div className="mq-rating-title">Rating</div>}

      <div className="mq-rating-avg">
        <span className="mq-stars" aria-label={`Average rating ${avgText} out of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={size}
              className={i < avgFilled ? "mq-star filled" : "mq-star"}
            />
          ))}
        </span>

        <span className="mq-rating-text">
          {avgText}
          {showCount && (
            <span className="mq-rating-count">
              {" "}
              ({count.toLocaleString()} {count === 1 ? "vote" : "votes"})
            </span>
          )}
        </span>
      </div>

      <div className={`mq-my-rating ${saving ? "disabled" : ""}`}>
        <div className="mq-my-label">
          Your rating:{" "}
          <b className="mq-my-value">{myRating ? `${myRating}/5` : "Not rated"}</b>
        </div>

        <div className="mq-my-stars">
          {Array.from({ length: 5 }).map((_, i) => {
            const val = i + 1;
            const filled = (Number(myRating) || 0) >= val;
            return (
              <button
                key={val}
                type="button"
                className={`mq-my-star-btn ${filled ? "filled" : ""}`}
                onClick={() => handleRate(val)}
                disabled={saving}
                aria-label={`Rate ${val} star`}
                title={`Rate ${val}`}
              >
                <Star size={size + 2} />
              </button>
            );
          })}
        </div>
      </div>

      {err && <div className="mq-rating-error">{err}</div>}
    </div>
  );
};

export default Rating;
