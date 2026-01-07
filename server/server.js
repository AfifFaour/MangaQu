// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { nanoid } = require("nanoid");
require("dotenv").config();

const mysql = require("mysql2/promise");

const app = express();

/* =========================
   CONFIG
========================= */
const PORT = Number(process.env.PORT || 5001);
const JWT_SECRET = process.env.JWT_SECRET || "mangaqu-secret-key-2025";

// Count 1 view per user/session per X minutes
const VIEW_WINDOW_MINUTES = Number(process.env.VIEW_WINDOW_MINUTES || 30);

// support multiple origins:
// CLIENT_ORIGINS=https://site1.com,http://localhost:3000
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* =========================
   DATABASE (hosted-ready)
========================= */
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 30000,
  acquireTimeout: 30000,

  // Railway/hosted proxies often require SSL
  // If your local MySQL doesn't like SSL, set DB_SSL=0 in .env and use conditional below.
  ssl: String(process.env.DB_SSL || "1") === "1" ? { rejectUnauthorized: false } : undefined,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// test connection once on startup
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ MySQL connected successfully (pool)");
    conn.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.code, err.message);
  }
})();

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: function (origin, cb) {
      // allow SSR/no-origin (postman) requests
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

/* =========================
   STATIC ASSETS
========================= */
app.use(
  "/Assets",
  express.static(path.join(__dirname, "Assets"), {
    setHeaders(res) {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

/* =========================
   HELPERS
========================= */
function normalizeCoverPath(p) {
  if (!p) return "";
  const v = String(p).trim();

  // absolute URL
  if (/^https?:\/\//i.test(v)) return v;

  // already /Assets/...
  if (v.startsWith("/Assets/")) return v;

  // Assets/...
  if (v.startsWith("Assets/")) return `/${v}`;

  // filename only
  if (!v.includes("/")) return `/Assets/${v}`;

  // starts with "/" but not /Assets
  if (v.startsWith("/")) return `/Assets${v}`;

  return `/Assets/${v}`;
}

function safeJsonParse(val, fallback = []) {
  try {
    if (val === null || val === undefined) return fallback;
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function getApiOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}`;
}

function normalizePagesToAbsolute(req, pages) {
  const apiOrigin = getApiOrigin(req);
  return (pages || [])
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => {
      const clean = p.trim();
      if (/^https?:\/\//i.test(clean)) return { imageUrl: clean };
      const fixed = clean.startsWith("/") ? clean : `/${clean}`;
      return { imageUrl: `${apiOrigin}${fixed}` };
    });
}

function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return String(xf).split(",")[0].trim();
  return req.ip;
}
/* =========================
   READING HISTORY (Continue Reading)
   Table: reading_history
   - one row per user+manga (UPSERT)
========================= */

// Save chapter progress (auth only)
app.post("/api/reading-history/chapter", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const mangaId = Number(req.body?.manga_id);
    const chapterId = Number(req.body?.chapter_id);
    const pageNumber = Number(req.body?.page_number);

    if (!mangaId || !chapterId) {
      return res.status(400).json({ error: "manga_id and chapter_id are required" });
    }

    const safePage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;

    // ✅ one row per (user+manga): update last chapter + page
    await db.query(
      `
      INSERT INTO reading_history (user_id, manga_id, chapter_id, page_number, read_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        chapter_id = VALUES(chapter_id),
        page_number = VALUES(page_number),
        read_at = NOW()
      `,
      [userId, mangaId, chapterId, safePage]
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("save chapter history error", e);
    return res.status(500).json({ error: "Database error" });
  }
});

// Get continue reading (chapter)
app.get("/api/reading-history/chapter/:mangaId", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const mangaId = Number(req.params.mangaId);

    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });

    const [rows] = await db.query(
      `
      SELECT manga_id, chapter_id, page_number, read_at
      FROM reading_history
      WHERE user_id = ? AND manga_id = ?
      LIMIT 1
      `,
      [userId, mangaId]
    );

    if (!rows.length) return res.json(null);

    return res.json({
      manga_id: Number(rows[0].manga_id),
      chapter_id: Number(rows[0].chapter_id),
      page_number: Number(rows[0].page_number) || 1,
      read_at: rows[0].read_at,
    });
  } catch (e) {
    console.error("get chapter history error", e);
    return res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   OPTIONAL: Volume Continue Reading
   If you want continue for volumes too:
   Requires reading_history to have volume_id column,
   OR create separate table (recommended).
========================= */

/* =========================
   AUTH MIDDLEWARES
========================= */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// ✅ optional auth (for view tracking; allow guests + logged users)
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    req.user = err ? null : user;
    next();
  });
}

function authorizeAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ✅ guest session id for accurate “unique per user” when not logged in
function getSessionId(req, res) {
  if (req.user?.id) return null; // logged-in: use userId

  let sid = req.cookies?.sid;
  if (!sid) {
    sid = nanoid(24);
    res.cookie("sid", sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: String(process.env.COOKIE_SECURE || "0") === "1", // set 1 on HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
    });
  }
  return sid;
}

/* =========================
   HEALTH
========================= */
app.get("/", (req, res) => {
  res.json({ ok: true, message: "MangaQu API Server" });
});

app.get("/api/health/db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, code: e.code, message: e.message });
  }
});

/* =========================
   AUTH
========================= */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }
    if (String(password).trim().length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [String(username).trim(), String(email).trim()]
    );
    if (existing.length) return res.status(400).json({ error: "User exists" });

    const hashed = await bcrypt.hash(String(password), 10);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password, role, created_at, updated_at) VALUES (?, ?, ?, 'user', NOW(), NOW())",
      [String(username).trim(), String(email).trim(), hashed]
    );

    const token = jwt.sign(
      { id: result.insertId, username, email, role: "user" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: { id: result.insertId, username, email, role: "user" },
    });
  } catch (e) {
    console.error("register error", e);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [
      String(email).trim(),
    ]);
    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email, role: user.role },
    });
  } catch (e) {
    console.error("login error", e);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

/* =========================
   USERS CRUD
========================= */

// ✅ Get my profile
app.get("/api/users/me", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const [rows] = await db.query(
      "SELECT id, username, email, avatar_url, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("get me error", e);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Update my profile (username/avatar/password optional)
app.put("/api/users/me", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { username, avatar_url, password } = req.body || {};

    if (username && String(username).trim()) {
      const [dup] = await db.query(
        "SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1",
        [String(username).trim(), userId]
      );
      if (dup.length) return res.status(409).json({ error: "Username already taken" });
    }

    let passwordSql = "";
    let passwordVal = null;

    if (password && String(password).trim()) {
      if (String(password).trim().length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      passwordVal = await bcrypt.hash(String(password), 10);
      passwordSql = ", password = ?";
    }

    const params = [
      username && String(username).trim() ? String(username).trim() : null,
      avatar_url !== undefined ? (avatar_url ? String(avatar_url) : null) : null,
    ];

    const sql = `
      UPDATE users
      SET
        username   = COALESCE(?, username),
        avatar_url = COALESCE(?, avatar_url)
        ${passwordSql}
        , updated_at = NOW()
      WHERE id = ?
    `;

    if (passwordSql) params.push(passwordVal);
    params.push(userId);

    const [result] = await db.query(sql, params);
    if (!result.affectedRows) return res.status(404).json({ error: "User not found" });

    const [rows] = await db.query(
      "SELECT id, username, email, avatar_url, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    res.json({ ok: true, user: rows[0] });
  } catch (e) {
    console.error("update me error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   ADMIN: USERS CRUD
========================= */

app.get("/api/admin/users", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, username, email, avatar_url, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("list users error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/admin/users/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ error: "Invalid user id" });

    const [rows] = await db.query(
      "SELECT id, username, email, avatar_url, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("get user error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/admin/users", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { username, email, password, role = "user", avatar_url = null } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, password are required" });
    }

    if (String(password).trim().length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const roleClean = role === "admin" ? "admin" : "user";

    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [String(username).trim(), String(email).trim()]
    );
    if (existing.length) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(String(password), 10);

    const [result] = await db.query(
      `INSERT INTO users (username, email, password, avatar_url, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [String(username).trim(), String(email).trim(), hashed, avatar_url, roleClean]
    );

    const [rows] = await db.query(
      "SELECT id, username, email, avatar_url, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
      [result.insertId]
    );

    res.status(201).json({ ok: true, user: rows[0] });
  } catch (e) {
    console.error("create user error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/admin/users/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ error: "Invalid user id" });

    const { username, email, avatar_url, role, password } = req.body || {};

    if (username && String(username).trim()) {
      const [dup] = await db.query(
        "SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1",
        [String(username).trim(), userId]
      );
      if (dup.length) return res.status(409).json({ error: "Username already taken" });
    }

    if (email && String(email).trim()) {
      const [dup] = await db.query(
        "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
        [String(email).trim(), userId]
      );
      if (dup.length) return res.status(409).json({ error: "Email already taken" });
    }

    let passwordSql = "";
    let passwordVal = null;

    if (password && String(password).trim()) {
      if (String(password).trim().length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      passwordVal = await bcrypt.hash(String(password), 10);
      passwordSql = ", password = ?";
    }

    const roleClean = role ? (role === "admin" ? "admin" : "user") : null;

    const params = [
      username && String(username).trim() ? String(username).trim() : null,
      email && String(email).trim() ? String(email).trim() : null,
      avatar_url !== undefined ? (avatar_url ? String(avatar_url) : null) : null,
      roleClean,
    ];

    const sql = `
      UPDATE users
      SET
        username   = COALESCE(?, username),
        email      = COALESCE(?, email),
        avatar_url = COALESCE(?, avatar_url),
        role       = COALESCE(?, role)
        ${passwordSql}
        , updated_at = NOW()
      WHERE id = ?
    `;

    if (passwordSql) params.push(passwordVal);
    params.push(userId);

    const [result] = await db.query(sql, params);
    if (!result.affectedRows) return res.status(404).json({ error: "User not found" });

    const [rows] = await db.query(
      "SELECT id, username, email, avatar_url, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    res.json({ ok: true, user: rows[0] });
  } catch (e) {
    console.error("update user error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/admin/users/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ error: "Invalid user id" });

    if (Number(req.user.id) === userId) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const [result] = await db.query("DELETE FROM users WHERE id = ?", [userId]);
    if (!result.affectedRows) return res.status(404).json({ error: "User not found" });

    res.json({ ok: true });
  } catch (e) {
    console.error("delete user error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   VIEW TRACKING (accurate per user per time window)
   Tables needed:
   - chapter_views
   - volume_views
========================= */

// ✅ increment chapter view_count once per (user or guest session) per VIEW_WINDOW_MINUTES
app.post("/api/chapters/:chapterId/view", optionalAuth, async (req, res) => {
  const chapterId = Number(req.params.chapterId);
  if (!chapterId) return res.status(400).json({ error: "Invalid chapter id" });

  const userId = req.user?.id ? Number(req.user.id) : null;
  const sessionId = getSessionId(req, res); // null if logged in
  const ip = getClientIp(req);
  const ua = String(req.headers["user-agent"] || "").slice(0, 255);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ensure chapter exists + get manga_id
    const [chapRows] = await conn.query("SELECT id, manga_id FROM chapters WHERE id = ? LIMIT 1", [
      chapterId,
    ]);
    if (!chapRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: "Chapter not found" });
    }
    const mangaId = Number(chapRows[0].manga_id);

    // check if already counted in window
    let existsSql, existsParams;
    if (userId) {
      existsSql = `
        SELECT id FROM chapter_views
        WHERE chapter_id = ? AND user_id = ?
          AND viewed_at >= (NOW() - INTERVAL ? MINUTE)
        LIMIT 1
      `;
      existsParams = [chapterId, userId, VIEW_WINDOW_MINUTES];
    } else {
      existsSql = `
        SELECT id FROM chapter_views
        WHERE chapter_id = ? AND session_id = ?
          AND viewed_at >= (NOW() - INTERVAL ? MINUTE)
        LIMIT 1
      `;
      existsParams = [chapterId, sessionId, VIEW_WINDOW_MINUTES];
    }

    const [already] = await conn.query(existsSql, existsParams);
    if (already.length) {
      await conn.commit();
      return res.json({ ok: true, counted: false });
    }

    // store view event
    await conn.query(
      `
      INSERT INTO chapter_views (chapter_id, user_id, session_id, ip, user_agent, viewed_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [chapterId, userId, sessionId, ip, ua]
    );

    // increment chapter view_count
    await conn.query(
      "UPDATE chapters SET view_count = COALESCE(view_count,0) + 1, updated_at = NOW() WHERE id = ?",
      [chapterId]
    );

    // optional: increment manga total views too
    if (mangaId) {
      await conn.query(
        "UPDATE manga SET views = COALESCE(views,0) + 1, updated_at = NOW() WHERE id = ?",
        [mangaId]
      );
    }

    await conn.commit();
    res.json({ ok: true, counted: true });
  } catch (e) {
    await conn.rollback();
    console.error("chapter view error", e);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

// ✅ increment volume view_count once per (user or guest session) per VIEW_WINDOW_MINUTES
app.post("/api/volumes/:volumeId/view", optionalAuth, async (req, res) => {
  const volumeId = Number(req.params.volumeId);
  if (!volumeId) return res.status(400).json({ error: "Invalid volume id" });

  const userId = req.user?.id ? Number(req.user.id) : null;
  const sessionId = getSessionId(req, res);
  const ip = getClientIp(req);
  const ua = String(req.headers["user-agent"] || "").slice(0, 255);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ensure volume exists + get manga_id
    const [volRows] = await conn.query("SELECT id, manga_id FROM volumes WHERE id = ? LIMIT 1", [
      volumeId,
    ]);
    if (!volRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: "Volume not found" });
    }
    const mangaId = Number(volRows[0].manga_id);

    // check if already counted in window
    let existsSql, existsParams;
    if (userId) {
      existsSql = `
        SELECT id FROM volume_views
        WHERE volume_id = ? AND user_id = ?
          AND viewed_at >= (NOW() - INTERVAL ? MINUTE)
        LIMIT 1
      `;
      existsParams = [volumeId, userId, VIEW_WINDOW_MINUTES];
    } else {
      existsSql = `
        SELECT id FROM volume_views
        WHERE volume_id = ? AND session_id = ?
          AND viewed_at >= (NOW() - INTERVAL ? MINUTE)
        LIMIT 1
      `;
      existsParams = [volumeId, sessionId, VIEW_WINDOW_MINUTES];
    }

    const [already] = await conn.query(existsSql, existsParams);
    if (already.length) {
      await conn.commit();
      return res.json({ ok: true, counted: false });
    }

    // store view event
    await conn.query(
      `
      INSERT INTO volume_views (volume_id, user_id, session_id, ip, user_agent, viewed_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [volumeId, userId, sessionId, ip, ua]
    );

    // increment volume view_count
    await conn.query(
      "UPDATE volumes SET view_count = COALESCE(view_count,0) + 1, updated_at = NOW() WHERE id = ?",
      [volumeId]
    );

    // optional: increment manga total views too
    if (mangaId) {
      await conn.query(
        "UPDATE manga SET views = COALESCE(views,0) + 1, updated_at = NOW() WHERE id = ?",
        [mangaId]
      );
    }

    await conn.commit();
    res.json({ ok: true, counted: true });
  } catch (e) {
    await conn.rollback();
    console.error("volume view error", e);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});

/* =========================
   RATINGS (TABLE-BASED)
========================= */

// public: rating stats (frontend calls rating-stats)
app.get("/api/manga/:id/rating-stats", async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });

    const [rows] = await db.query(
      `
      SELECT COALESCE(AVG(r.rating), 0) AS rating_avg,
             COUNT(r.id)               AS rating_count
      FROM ratings r
      WHERE r.manga_id = ?
      `,
      [mangaId]
    );

    const row = rows?.[0] || { rating_avg: 0, rating_count: 0 };
    res.json({
      manga_id: mangaId,
      rating_avg: Number(row.rating_avg) || 0,
      rating_count: Number(row.rating_count) || 0,
    });
  } catch (e) {
    console.error("rating-stats error", e);
    res.status(500).json({ error: "Database error" });
  }
});

// keep old endpoint too
app.get("/api/manga/:id/rating", async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });

    const [rows] = await db.query(
      `
      SELECT COALESCE(AVG(r.rating), 0) AS rating_avg,
             COUNT(r.id)               AS rating_count
      FROM ratings r
      WHERE r.manga_id = ?
      `,
      [mangaId]
    );

    const row = rows?.[0] || { rating_avg: 0, rating_count: 0 };
    res.json({
      manga_id: mangaId,
      rating_avg: Number(row.rating_avg) || 0,
      rating_count: Number(row.rating_count) || 0,
    });
  } catch (e) {
    console.error("rating error", e);
    res.status(500).json({ error: "Database error" });
  }
});

// auth: my rating
app.get("/api/manga/:id/my-rating", authenticateToken, async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    const userId = Number(req.user.id);
    if (!mangaId || !userId) return res.status(400).json({ error: "Invalid request" });

    const [rows] = await db.query(
      "SELECT rating FROM ratings WHERE manga_id = ? AND user_id = ? LIMIT 1",
      [mangaId, userId]
    );

    if (!rows.length) return res.json({ manga_id: mangaId, rating: null });
    res.json({ manga_id: mangaId, rating: Number(rows[0].rating) });
  } catch (e) {
    console.error("my rating error", e);
    res.status(500).json({ error: "Database error" });
  }
});

// auth: upsert rating (1..5)
app.post("/api/manga/:id/rate", authenticateToken, async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    const userId = Number(req.user.id);
    const rating = Number(req.body?.rating);

    if (!mangaId || !userId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be a number between 1 and 5" });
    }

    // IMPORTANT: UNIQUE(user_id, manga_id) on ratings
    await db.query(
      `
      INSERT INTO ratings (user_id, manga_id, rating, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = NOW()
      `,
      [userId, mangaId, rating]
    );

    const [rows] = await db.query(
      `
      SELECT COALESCE(AVG(r.rating), 0) AS rating_avg,
             COUNT(r.id)               AS rating_count
      FROM ratings r
      WHERE r.manga_id = ?
      `,
      [mangaId]
    );

    const row = rows?.[0] || { rating_avg: 0, rating_count: 0 };

    res.json({
      message: "Rating saved",
      manga_id: mangaId,
      your_rating: rating,
      rating_avg: Number(row.rating_avg) || 0,
      rating_count: Number(row.rating_count) || 0,
    });
  } catch (e) {
    console.error("rate error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   MANGA (include rating stats)
========================= */
app.get("/api/manga", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        m.*,
        COALESCE(rs.rating_avg, 0)   AS rating_avg,
        COALESCE(rs.rating_count, 0) AS rating_count
      FROM manga m
      LEFT JOIN (
        SELECT manga_id, AVG(rating) AS rating_avg, COUNT(*) AS rating_count
        FROM ratings
        GROUP BY manga_id
      ) rs ON rs.manga_id = m.id
      ORDER BY m.updated_at DESC
    `);

    res.json(
      rows.map((m) => ({
        ...m,
        cover_image: normalizeCoverPath(m.cover_image),
        rating_avg: Number(m.rating_avg) || 0,
        rating_count: Number(m.rating_count) || 0,
      }))
    );
  } catch (e) {
    console.error("get manga error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/manga/:id", async (req, res) => {
  try {
    const mangaId = Number(req.params.id);

    const [rows] = await db.query(
      `
      SELECT
        m.*,
        COALESCE(rs.rating_avg, 0)   AS rating_avg,
        COALESCE(rs.rating_count, 0) AS rating_count
      FROM manga m
      LEFT JOIN (
        SELECT manga_id, AVG(rating) AS rating_avg, COUNT(*) AS rating_count
        FROM ratings
        GROUP BY manga_id
      ) rs ON rs.manga_id = m.id
      WHERE m.id = ?
      LIMIT 1
      `,
      [mangaId]
    );

    if (!rows.length) return res.status(404).json({ error: "Manga not found" });

    const m = rows[0];
    res.json({
      ...m,
      cover_image: normalizeCoverPath(m.cover_image),
      rating_avg: Number(m.rating_avg) || 0,
      rating_count: Number(m.rating_count) || 0,
    });
  } catch (e) {
    console.error("get manga by id error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   MANGA: RELATED (include rating stats)
========================= */
app.get("/api/manga/:id/related", async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });

    const [m1] = await db.query("SELECT status FROM manga WHERE id = ? LIMIT 1", [mangaId]);
    if (!m1.length) return res.status(404).json({ error: "Manga not found" });

    const status = m1[0].status;

    const [rows] = await db.query(
      `
      SELECT
        m.*,
        COALESCE(rs.rating_avg, 0)   AS rating_avg,
        COALESCE(rs.rating_count, 0) AS rating_count
      FROM manga m
      LEFT JOIN (
        SELECT manga_id, AVG(rating) AS rating_avg, COUNT(*) AS rating_count
        FROM ratings
        GROUP BY manga_id
      ) rs ON rs.manga_id = m.id
      WHERE m.status = ? AND m.id <> ?
      ORDER BY m.updated_at DESC
      LIMIT 8
      `,
      [status, mangaId]
    );

    res.json(
      rows.map((m) => ({
        ...m,
        cover_image: normalizeCoverPath(m.cover_image),
        rating_avg: Number(m.rating_avg) || 0,
        rating_count: Number(m.rating_count) || 0,
      }))
    );
  } catch (e) {
    console.error("related error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   ADMIN: MANGA CRUD (dashboard)
========================= */

app.post("/api/manga", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { title, slug, description, cover_image, status, type, author, views = 0 } = req.body || {};

    if (!title || !String(title).trim()) return res.status(400).json({ error: "title is required" });
    if (!cover_image || !String(cover_image).trim()) {
      return res.status(400).json({ error: "cover_image is required" });
    }

    const safeSlug =
      slug && String(slug).trim()
        ? String(slug).trim()
        : String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const [result] = await db.query(
      `
      INSERT INTO manga (title, slug, description, cover_image, status, type, author, views, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        String(title).trim(),
        safeSlug,
        description || "",
        cover_image,
        status || "ongoing",
        type || "manga",
        author || "",
        Number(views) || 0,
      ]
    );

    const [rows] = await db.query("SELECT * FROM manga WHERE id = ? LIMIT 1", [result.insertId]);
    res.status(201).json({ ok: true, manga: rows[0] || { id: result.insertId } });
  } catch (e) {
    console.error("create manga error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/manga/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });

    const { title, slug, description, cover_image, status, type, author, views = 0 } = req.body || {};

    if (!title || !String(title).trim()) return res.status(400).json({ error: "title is required" });
    if (!cover_image || !String(cover_image).trim()) {
      return res.status(400).json({ error: "cover_image is required" });
    }

    const safeSlug =
      slug && String(slug).trim()
        ? String(slug).trim()
        : String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const [result] = await db.query(
      `
      UPDATE manga
      SET title = ?, slug = ?, description = ?, cover_image = ?, status = ?, type = ?, author = ?, views = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [
        String(title).trim(),
        safeSlug,
        description || "",
        cover_image,
        status || "ongoing",
        type || "manga",
        author || "",
        Number(views) || 0,
        mangaId,
      ]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Manga not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("update manga error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/manga/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });

    const [result] = await db.query("DELETE FROM manga WHERE id = ?", [mangaId]);
    if (!result.affectedRows) return res.status(404).json({ error: "Manga not found" });

    res.json({ ok: true });
  } catch (e) {
    console.error("delete manga error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   ADMIN: CHAPTERS CRUD
========================= */

app.post("/api/manga/:id/chapters", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    const { chapter_number, title, pages = [], view_count = 0 } = req.body || {};

    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });
    if (chapter_number === undefined || chapter_number === null || chapter_number === "") {
      return res.status(400).json({ error: "chapter_number is required" });
    }
    if (!Array.isArray(pages)) return res.status(400).json({ error: "pages must be an array" });

    const [result] = await db.query(
      `
      INSERT INTO chapters (manga_id, chapter_number, title, pages, view_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [mangaId, Number(chapter_number), title || null, JSON.stringify(pages), Number(view_count) || 0]
    );

    res.status(201).json({ ok: true, id: result.insertId });
  } catch (e) {
    console.error("create chapter error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/chapters/:chapterId", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const chapterId = Number(req.params.chapterId);
    const { chapter_number, title, pages = [], view_count = 0 } = req.body || {};

    if (!chapterId) return res.status(400).json({ error: "Invalid chapter id" });
    if (chapter_number === undefined || chapter_number === null || chapter_number === "") {
      return res.status(400).json({ error: "chapter_number is required" });
    }
    if (!Array.isArray(pages)) return res.status(400).json({ error: "pages must be an array" });

    const [result] = await db.query(
      `
      UPDATE chapters
      SET chapter_number = ?, title = ?, pages = ?, view_count = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [Number(chapter_number), title || null, JSON.stringify(pages), Number(view_count) || 0, chapterId]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Chapter not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("update chapter error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/chapters/:chapterId", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const chapterId = Number(req.params.chapterId);
    if (!chapterId) return res.status(400).json({ error: "Invalid chapter id" });

    const [result] = await db.query("DELETE FROM chapters WHERE id = ?", [chapterId]);
    if (!result.affectedRows) return res.status(404).json({ error: "Chapter not found" });

    res.json({ ok: true });
  } catch (e) {
    console.error("delete chapter error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   CHAPTERS (public list)
========================= */
app.get("/api/manga/:id/chapters", async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });

    const [rows] = await db.query(
      `
      SELECT id, manga_id, chapter_number, title, pages, view_count, created_at, updated_at
      FROM chapters
      WHERE manga_id = ?
      ORDER BY chapter_number ASC
      `,
      [mangaId]
    );

    const cleaned = rows.map((r) => ({ ...r, pages: safeJsonParse(r.pages, []) }));
    res.json(cleaned);
  } catch (e) {
    console.error("chapters error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   CHAPTER PAGES (public)
========================= */
app.get("/api/chapters/:chapterId/pages", async (req, res) => {
  try {
    const chapterId = Number(req.params.chapterId);
    if (!chapterId) return res.status(400).json({ error: "Invalid chapter id" });

    const [rows] = await db.query("SELECT pages FROM chapters WHERE id = ? LIMIT 1", [chapterId]);
    if (!rows.length) return res.status(404).json({ error: "Chapter not found" });

    const pages = safeJsonParse(rows[0].pages, []);
    res.json(normalizePagesToAbsolute(req, pages));
  } catch (e) {
    console.error("chapter pages error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   VOLUMES (linked to manga)
========================= */

app.get("/api/manga/:id/volumes", async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });

    const [rows] = await db.query(
      `
      SELECT id, manga_id, volume_number, title, pages, view_count, created_at, updated_at
      FROM volumes
      WHERE manga_id = ?
      ORDER BY volume_number ASC
      `,
      [mangaId]
    );

    res.json(
      rows.map((v) => ({
        ...v,
        volume_number: Number(v.volume_number),
        view_count: Number(v.view_count) || 0,
        pages: safeJsonParse(v.pages, []),
      }))
    );
  } catch (e) {
    console.error("get volumes error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/volumes/:volumeId/pages", async (req, res) => {
  try {
    const volumeId = Number(req.params.volumeId);
    if (!volumeId) return res.status(400).json({ error: "Invalid volume id" });

    const [rows] = await db.query("SELECT pages FROM volumes WHERE id = ? LIMIT 1", [volumeId]);
    if (!rows.length) return res.status(404).json({ error: "Volume not found" });

    const pages = safeJsonParse(rows[0].pages, []);
    res.json(normalizePagesToAbsolute(req, pages));
  } catch (e) {
    console.error("volume pages error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/manga/:id/volumes", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const mangaId = Number(req.params.id);
    const { volume_number, title, pages = [], view_count = 0 } = req.body || {};

    if (!mangaId) return res.status(400).json({ error: "Invalid manga id" });
    if (volume_number === undefined || volume_number === null || volume_number === "") {
      return res.status(400).json({ error: "volume_number is required" });
    }
    if (!Array.isArray(pages)) return res.status(400).json({ error: "pages must be an array" });

    const [result] = await db.query(
      `
      INSERT INTO volumes (manga_id, volume_number, title, pages, view_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [mangaId, Number(volume_number), title || null, JSON.stringify(pages), Number(view_count) || 0]
    );

    res.status(201).json({ ok: true, message: "Volume created", id: result.insertId });
  } catch (e) {
    console.error("create volume error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/volumes/:volumeId", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const volumeId = Number(req.params.volumeId);
    const { volume_number, title, pages = [], view_count = 0 } = req.body || {};

    if (!volumeId) return res.status(400).json({ error: "Invalid volume id" });
    if (volume_number === undefined || volume_number === null || volume_number === "") {
      return res.status(400).json({ error: "volume_number is required" });
    }
    if (!Array.isArray(pages)) return res.status(400).json({ error: "pages must be an array" });

    const [result] = await db.query(
      `
      UPDATE volumes
      SET volume_number = ?, title = ?, pages = ?, view_count = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [Number(volume_number), title || null, JSON.stringify(pages), Number(view_count) || 0, volumeId]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Volume not found" });
    res.json({ ok: true, message: "Volume updated" });
  } catch (e) {
    console.error("update volume error", e);
    res.status(500).json({ error: "Database error" });
  }
});
// GET volume pages for reader (ABSOLUTE URLs)
app.get("/api/volumes/:volumeId/read", async (req, res) => {
  try {
    const volumeId = Number(req.params.volumeId);
    if (!volumeId) return res.status(400).json({ error: "Invalid volume id" });

    const [rows] = await db.query(
      "SELECT pages FROM volumes WHERE id = ? LIMIT 1",
      [volumeId]
    );

    if (!rows.length) return res.status(404).json({ error: "Volume not found" });

    const pages = safeJsonParse(rows[0].pages, []);
    res.json(normalizePagesToAbsolute(req, pages));
  } catch (e) {
    console.error("volume reader error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/volumes/:volumeId", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const volumeId = Number(req.params.volumeId);
    if (!volumeId) return res.status(400).json({ error: "Invalid volume id" });

    const [result] = await db.query("DELETE FROM volumes WHERE id = ?", [volumeId]);
    if (!result.affectedRows) return res.status(404).json({ error: "Volume not found" });

    res.json({ ok: true, message: "Volume deleted" });
  } catch (e) {
    console.error("delete volume error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   FAVORITES (include rating stats)
========================= */
app.get("/api/user/favorites", authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT 
        m.*,
        f.created_at AS favorited_at,
        COALESCE(rs.rating_avg, 0)   AS rating_avg,
        COALESCE(rs.rating_count, 0) AS rating_count
      FROM favorites f
      JOIN manga m ON m.id = f.manga_id
      LEFT JOIN (
        SELECT manga_id, AVG(rating) AS rating_avg, COUNT(*) AS rating_count
        FROM ratings
        GROUP BY manga_id
      ) rs ON rs.manga_id = m.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;

    const [rows] = await db.query(sql, [req.user.id]);

    res.json(
      rows.map((m) => ({
        ...m,
        cover_image: normalizeCoverPath(m.cover_image),
        rating_avg: Number(m.rating_avg) || 0,
        rating_count: Number(m.rating_count) || 0,
      }))
    );
  } catch (e) {
    console.error("favorites error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/user/favorites/:id", authenticateToken, async (req, res) => {
  try {
    await db.query("INSERT INTO favorites (user_id, manga_id, created_at) VALUES (?, ?, NOW())", [
      req.user.id,
      req.params.id,
    ]);
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e?.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Already favorited" });
    console.error("add favorite error", e);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/user/favorites/:id", authenticateToken, async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM favorites WHERE user_id = ? AND manga_id = ?", [
      req.user.id,
      req.params.id,
    ]);
    if (!result.affectedRows) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("remove favorite error", e);
    res.status(500).json({ error: "Database error" });
  }
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log("✅ Allowed origins:", allowedOrigins);
  console.log("✅ Serving assets from /Assets");
  console.log(`✅ View window: ${VIEW_WINDOW_MINUTES} minutes`);
});
