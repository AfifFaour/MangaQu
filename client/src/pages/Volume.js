// client/src/Components/manga/Volume.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";
import LoginService from "../services/LoginService";

const safeJson = (v, fallback = []) => {
  try {
    if (v === null || v === undefined) return fallback;
    if (Array.isArray(v)) return v;
    if (typeof v === "string") return JSON.parse(v);
    return fallback;
  } catch {
    return fallback;
  }
};

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const Volume = ({
  mangaId,
  className = "",
  adminMode = false,
  onChanged,
}) => {
  const navigate = useNavigate();
  const safeMangaId = useMemo(() => String(mangaId || ""), [mangaId]);

  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [selectedVolumeId, setSelectedVolumeId] = useState("");

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: null,
    volume_number: "",
    title: "",
    view_count: 0,
    pages: "[]",
  });

  const fetchVolumes = async () => {
    if (!safeMangaId) return;
    try {
      setLoading(true);
      setErr(null);

      const res = await api.get(`/manga/${safeMangaId}/volumes`);
      const raw = Array.isArray(res.data) ? res.data : [];

      const mapped = raw
        .map((v) => ({
          ...v,
          id: String(v.id),
          manga_id: String(v.manga_id ?? safeMangaId),
          volume_number: Number(v.volume_number ?? 0),
          title: v.title || "",
          view_count: Number(v.view_count ?? 0),
          pages: safeJson(v.pages, []),
        }))
        .sort((a, b) => a.volume_number - b.volume_number);

      setVolumes(mapped);

      if (mapped.length) {
        setSelectedVolumeId((prev) => {
          if (prev && mapped.some((x) => x.id === prev)) return prev;
          return mapped[0].id;
        });
      } else {
        setSelectedVolumeId("");
      }
    } catch (e) {
      console.error("volumes fetch failed", e);
      setVolumes([]);
      setSelectedVolumeId("");
      setErr(e?.response?.data?.error || "Failed to load volumes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeMangaId]);

  const selected = useMemo(
    () => volumes.find((v) => v.id === selectedVolumeId) || null,
    [volumes, selectedVolumeId]
  );

  // ✅ NEW: read volume
  const goReadVolume = () => {
    if (!safeMangaId || !selected?.id) return;
    navigate(`/read-volume/${safeMangaId}/${selected.id}`);
  };

  // ------- admin helpers -------
  const resetForm = () => {
    setForm({ id: null, volume_number: "", title: "", view_count: 0, pages: "[]" });
  };

  const startEdit = (v) => {
    setForm({
      id: v.id,
      volume_number: String(v.volume_number ?? ""),
      title: v.title || "",
      view_count: Number(v.view_count ?? 0),
      pages: JSON.stringify(Array.isArray(v.pages) ? v.pages : safeJson(v.pages, [])),
    });
  };

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({
      ...p,
      [name]:
        name === "view_count"
          ? clamp(parseInt(value || "0", 10) || 0, 0, 999999999)
          : value,
    }));
  };

  const parsePagesOrFail = () => {
    try {
      const arr = JSON.parse(form.pages || "[]");
      if (!Array.isArray(arr)) throw new Error("pages must be array");
      const clean = arr.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim());
      return { ok: true, pages: clean };
    } catch {
      return { ok: false, error: 'Pages must be valid JSON array like: ["Assets/.../1.jpg"]' };
    }
  };

  const saveVolume = async (e) => {
    e.preventDefault();
    if (!safeMangaId) return;
    if (!adminMode) return;

    const num = Number(form.volume_number);
    if (!Number.isFinite(num) || num <= 0) return alert("volume_number must be a number > 0");

    const parsed = parsePagesOrFail();
    if (!parsed.ok) return alert(parsed.error);

    try {
      setSaving(true);
      setErr(null);

      if (form.id) {
        await api.put(`/volumes/${form.id}`, {
          volume_number: num,
          title: form.title,
          view_count: form.view_count,
          pages: parsed.pages,
        });
        alert("✅ Volume updated");
      } else {
        await api.post(`/manga/${safeMangaId}/volumes`, {
          volume_number: num,
          title: form.title,
          view_count: form.view_count,
          pages: parsed.pages,
        });
        alert("✅ Volume created");
      }

      resetForm();
      await fetchVolumes();
      onChanged?.();
    } catch (e2) {
      console.error("volume save failed", e2);
      alert(e2?.response?.data?.error || "Volume save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteVolume = async (v) => {
    if (!adminMode) return;
    if (!window.confirm(`Delete volume ${v.volume_number}${v.title ? ` (${v.title})` : ""}?`)) return;

    try {
      setSaving(true);
      await api.delete(`/volumes/${v.id}`);
      await fetchVolumes();
      onChanged?.();
    } catch (e) {
      console.error("volume delete failed", e);
      alert(e?.response?.data?.error || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  if (!safeMangaId) return null;
  if (loading) return <div className={`mq-volumes ${className}`}>Loading volumes...</div>;

  if (err) {
    return (
      <div className={`mq-volumes ${className}`}>
        <div className="mq-volumes-error">{err}</div>
        <button type="button" onClick={fetchVolumes}>Retry</button>
      </div>
    );
  }

  return (
    <div className={`mq-volumes ${className}`}>
      <div className="mq-volumes-top">
        <div className="mq-volumes-title">Volumes</div>

        {volumes.length > 0 ? (
          <select
            className="mq-volumes-select"
            value={selectedVolumeId}
            onChange={(e) => setSelectedVolumeId(e.target.value)}
          >
            {volumes.map((v) => (
              <option key={v.id} value={v.id}>
                Volume {v.volume_number}
              </option>
            ))}
          </select>
        ) : (
          <div className="mq-volumes-empty">No volumes yet.</div>
        )}
      </div>

      {selected && (
        <div className="mq-volume-card">
          <div className="mq-volume-head">
            <div className="mq-volume-name">
              <b>Volume {selected.volume_number}</b>
              {selected.title ? <span> — {selected.title}</span> : null}
            </div>
            <div className="mq-volume-meta">
              <span>{(selected.view_count || 0).toLocaleString()} views</span>
              <span>·</span>
              <span>{Array.isArray(selected.pages) ? selected.pages.length : 0} pages</span>
            </div>
          </div>

          {/* ✅ NEW: go read volume */}
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button type="button" onClick={goReadVolume}>
              📖 Read Volume
            </button>

            {adminMode && (
              <>
                <button type="button" onClick={() => startEdit(selected)} disabled={saving}>
                  Edit
                </button>
                <button type="button" onClick={() => deleteVolume(selected)} disabled={saving}>
                  Delete
                </button>
              </>
            )}
          </div>

          {Array.isArray(selected.pages) && selected.pages.length > 0 && (
            <details className="mq-volume-pages">
              <summary>Show pages paths</summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                {JSON.stringify(selected.pages, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {adminMode && (
        <form className="mq-volume-form" onSubmit={saveVolume}>
          <div className="mq-form-row">
            <div className="mq-field">
              <label>Volume Number *</label>
              <input
                name="volume_number"
                type="number"
                step="0.01"
                value={form.volume_number}
                onChange={onFormChange}
                placeholder="1"
                required
                disabled={saving}
              />
            </div>

            <div className="mq-field">
              <label>Views</label>
              <input
                name="view_count"
                type="number"
                min="0"
                value={form.view_count}
                onChange={onFormChange}
                disabled={saving}
              />
            </div>
          </div>

          <div className="mq-field">
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={onFormChange}
              placeholder="Optional title"
              disabled={saving}
            />
          </div>

          <div className="mq-field">
            <label>Pages (JSON Array)</label>
            <textarea
              name="pages"
              rows={7}
              value={form.pages}
              onChange={onFormChange}
              placeholder='[] or ["Assets/Manga/kingdom/volume-1/1.jpg"]'
              disabled={saving}
            />
          </div>

          <div className="mq-form-actions">
            <button type="button" onClick={resetForm} disabled={saving}>
              Reset
            </button>
            <button type="submit" disabled={saving}>
              {form.id ? "Update Volume" : "Create Volume"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Volume;
