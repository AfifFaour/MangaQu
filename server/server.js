// server.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

/* =========================
   CONFIG
========================= */
const PORT = 5001;
const CLIENT_ORIGIN = "http://localhost:3000";
const API_ORIGIN = `http://localhost:${PORT}`;
const JWT_SECRET = "mangaqu-secret-key-2025";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "manga_db",
  charset: "utf8mb4",
});

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// Serve assets (images)
app.use("/Assets", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CLIENT_ORIGIN);
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
app.use("/Assets", express.static(path.join(__dirname, "Assets")));

/* =========================
   DB CONNECT
========================= */
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }
  console.log("Connected to MySQL database");
});

/* =========================
   HELPERS
========================= */
function safeJsonParse(val, fallback) {
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureLeadingSlash(p) {
  if (!p) return "";
  return p.startsWith("/") ? p : `/${p}`;
}

// normalize folder names to match even if spaces/case/underscore differ
function normalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/_/g, "-");
}

// convert "01" -> "1", "001" -> "1"
function stripLeadingZeros(n) {
  const x = String(n ?? "").trim();
  return x.replace(/^0+/, "") || "0";
}

/**
 * Find Manga folder:
 * server/Assets/Manga/<slug>
 * If slug folder doesn't exist, match by normalized folder name.
 */
function findMangaFolder(slug) {
  const mangaRoot = path.join(__dirname, "Assets", "Manga");
  if (!fs.existsSync(mangaRoot)) return null;

  const direct = path.join(mangaRoot, slug);
  if (fs.existsSync(direct)) return direct;

  const target = normalizeName(slug);
  const dirs = fs
    .readdirSync(mangaRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  const match = dirs.find((d) => normalizeName(d.name) === target);
  return match ? path.join(mangaRoot, match.name) : null;
}

/**
 * Find chapter folder robustly:
 * supports:
 * chapter-1, chapter1, chapter-01, chapter01, chapter-001...
 * Chapter 1, Chapter 01, Chapter_1, CHAPTER-1...
 * ch-1, ch01, c-1
 */
function findChapterFolder({ slug, chapterNumber }) {
  const mangaFolder = findMangaFolder(slug);
  if (!mangaFolder) return null;

  const chap = stripLeadingZeros(chapterNumber);

  const candidates = new Set([
    `chapter-${chap}`,
    `chapter${chap}`,
    `chapter-0${chap}`,
    `chapter0${chap}`,
    `chapter-00${chap}`,
    `chapter00${chap}`,
    `chapter-000${chap}`,
    `chapter000${chap}`,
    `ch-${chap}`,
    `ch${chap}`,
    `ch-0${chap}`,
    `ch0${chap}`,
    `c-${chap}`,
    `c${chap}`,
  ]);

  const entries = fs
    .readdirSync(mangaFolder, { withFileTypes: true })
    .filter((e) => e.isDirectory());

  const match = entries.find((e) => candidates.has(normalizeName(e.name)));
  return match ? path.join(mangaFolder, match.name) : null;
}

/**
 * Scan disk and return URLs:
 * /Assets/Manga/<real-manga-folder>/<real-chapter-folder>/<file>
 */
function buildChapterPagesFromDisk({ slug, chapterNumber }) {
  if (!slug) return [];

  const folderPath = findChapterFolder({ slug, chapterNumber });
  if (!folderPath) return [];

  const chapterFolderName = path.basename(folderPath);
  const mangaFolderName = path.basename(path.dirname(folderPath)); // real manga folder name

  const files = fs
    .readdirSync(folderPath)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  return files.map((file) => `/Assets/Manga/${mangaFolderName}/${chapterFolderName}/${file}`);
}

/**
 * Prefer disk pages when disk has more images than DB pages.
 */
function resolveChapterPages({ rowPages, slug, chapterNumber }) {
  let dbPages = safeJsonParse(rowPages, []);
  if (Array.isArray(dbPages)) {
    dbPages = dbPages
      .filter((p) => typeof p === "string" && p.trim().length > 0)
      .map((p) => ensureLeadingSlash(p.trim()));
  } else {
    dbPages = [];
  }

  const diskPages = buildChapterPagesFromDisk({ slug, chapterNumber });

  if (diskPages.length > dbPages.length) return diskPages;
  return dbPages;
}

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

function authorizeAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

/* =========================
   ROUTES: AUTH
========================= */
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const checkSql = "SELECT id FROM users WHERE username = ? OR email = ?";
  db.query(checkSql, [username, email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length > 0) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertSql =
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";

      db.query(insertSql, [username, email, hashedPassword], (insErr, result) => {
        if (insErr) return res.status(500).json({ error: "Database error" });

        const token = jwt.sign(
          { id: result.insertId, username, email, role: "user" },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        res.status(201).json({
          message: "Registration successful",
          token,
          user: { id: result.insertId, username, email, role: "user" },
        });
      });
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  });
});

app.post("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

/* =========================
   ROUTES: MANGA
========================= */
app.get("/api/manga", (req, res) => {
  const sort = String(req.query.sort || "updated").toLowerCase();
  const type = String(req.query.type || "all").toLowerCase();
  const search = String(req.query.search || "").trim();

  let orderBy = "updated_at DESC";
  if (sort === "newest") orderBy = "created_at DESC";
  if (sort === "popular") orderBy = "views DESC";
  if (sort === "rating") orderBy = "rating DESC";

  let sql = `SELECT * FROM manga`;
  const params = [];
  const where = [];

  if (type !== "all") {
    where.push(`type = ?`);
    params.push(type);
  }

  if (search) {
    where.push(`(title LIKE ? OR description LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (where.length) sql += ` WHERE ` + where.join(" AND ");
  sql += ` ORDER BY ${orderBy}`;

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

app.get("/api/manga/:id", (req, res) => {
  const mangaId = req.params.id;

  db.query("SELECT * FROM manga WHERE id = ?", [mangaId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows.length) return res.status(404).json({ error: "Manga not found" });
    res.json(rows[0]);
  });
});

app.get("/api/manga/:id/related", (req, res) => {
  const mangaId = req.params.id;

  const sql = `
    SELECT m2.*
    FROM manga m1
    JOIN manga m2 ON m2.status = m1.status
    WHERE m1.id = ? AND m2.id <> m1.id
    ORDER BY m2.updated_at DESC
    LIMIT 8
  `;

  db.query(sql, [mangaId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

app.post("/api/manga", authenticateToken, authorizeAdmin, (req, res) => {
  const { title, slug, cover_image, status, type, description, views = 0, rating = 0.0 } = req.body;

  if (!title || !cover_image || !status) {
    return res.status(400).json({ error: "Title, cover_image, and status are required" });
  }

  const finalSlug = slug ? slugify(slug) : slugify(title);

  const sql = `
    INSERT INTO manga
    (title, slug, cover_image, status, type, description, views, rating, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  db.query(
    sql,
    [title, finalSlug, cover_image, status, type || "manga", description || "", views, rating],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.status(201).json({ message: "Manga created", id: result.insertId });
    }
  );
});

app.put("/api/manga/:id", authenticateToken, authorizeAdmin, (req, res) => {
  const mangaId = req.params.id;
  const { title, slug, cover_image, status, type, description, views, rating } = req.body;

  const finalSlug = slug ? slugify(slug) : slugify(title);

  const sql = `
    UPDATE manga
    SET title = ?, slug = ?, cover_image = ?, status = ?, type = ?, description = ?,
        views = ?, rating = ?, updated_at = NOW()
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      title,
      finalSlug,
      cover_image,
      status,
      type || "manga",
      description || "",
      views || 0,
      rating || 0.0,
      mangaId,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!result.affectedRows) return res.status(404).json({ error: "Manga not found" });
      res.json({ message: "Manga updated" });
    }
  );
});

app.delete("/api/manga/:id", authenticateToken, authorizeAdmin, (req, res) => {
  const mangaId = req.params.id;

  db.query("DELETE FROM manga WHERE id = ?", [mangaId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!result.affectedRows) return res.status(404).json({ error: "Manga not found" });
    res.json({ message: "Manga deleted" });
  });
});

/* =========================
   ROUTES: CHAPTERS
========================= */
app.get("/api/manga/:id/chapters", (req, res) => {
  const mangaId = req.params.id;

  db.query("SELECT id, title, slug FROM manga WHERE id = ?", [mangaId], (mErr, mRows) => {
    if (mErr) return res.status(500).json({ error: "Database error" });
    if (!mRows.length) return res.status(404).json({ error: "Manga not found" });

    const slug = mRows[0].slug || slugify(mRows[0].title);

    const sql = `
      SELECT id, manga_id, chapter_number, title, pages, view_count, created_at, updated_at
      FROM chapters
      WHERE manga_id = ?
      ORDER BY chapter_number ASC
    `;

    db.query(sql, [mangaId], (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const cleaned = rows.map((r) => {
        const pages = resolveChapterPages({
          rowPages: r.pages,
          slug,
          chapterNumber: r.chapter_number,
        });
        return { ...r, pages };
      });

      res.json(cleaned);
    });
  });
});

app.get("/api/chapters/:chapterId/pages", (req, res) => {
  const chapterId = req.params.chapterId;

  const sql = `
    SELECT c.pages, c.chapter_number, m.slug, m.title as manga_title
    FROM chapters c
    JOIN manga m ON m.id = c.manga_id
    WHERE c.id = ?
    LIMIT 1
  `;

  db.query(sql, [chapterId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!rows.length) return res.status(404).json({ error: "Chapter not found" });

    const row = rows[0];
    const slug = row.slug || slugify(row.manga_title);

    const pages = resolveChapterPages({
      rowPages: row.pages,
      slug,
      chapterNumber: row.chapter_number,
    });

    // optional debug
    // console.log("slug:", slug, "chapter:", row.chapter_number, "pages:", pages.length);

    res.json(pages.map((p) => ({ imageUrl: `${API_ORIGIN}${p}` })));
  });
});

app.post("/api/manga/:id/chapters", authenticateToken, authorizeAdmin, (req, res) => {
  const mangaId = req.params.id;
  const { chapter_number, title, pages = [], view_count = 0 } = req.body;

  if (chapter_number === undefined || chapter_number === null) {
    return res.status(400).json({ error: "chapter_number is required" });
  }

  const sql = `
    INSERT INTO chapters
    (manga_id, chapter_number, title, pages, view_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `;

  db.query(
    sql,
    [mangaId, chapter_number, title || null, JSON.stringify(pages), view_count],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Chapter number already exists for this manga" });
        }
        return res.status(500).json({ error: "Database error" });
      }
      res.status(201).json({ message: "Chapter created", id: result.insertId });
    }
  );
});

app.put("/api/chapters/:chapterId", authenticateToken, authorizeAdmin, (req, res) => {
  const chapterId = req.params.chapterId;
  const { chapter_number, title, pages, view_count } = req.body;

  const sql = `
    UPDATE chapters
    SET chapter_number = ?, title = ?, pages = ?, view_count = ?, updated_at = NOW()
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      chapter_number,
      title || null,
      JSON.stringify(Array.isArray(pages) ? pages : []),
      view_count || 0,
      chapterId,
    ],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Chapter number already exists for this manga" });
        }
        return res.status(500).json({ error: "Database error" });
      }
      if (!result.affectedRows) return res.status(404).json({ error: "Chapter not found" });
      res.json({ message: "Chapter updated" });
    }
  );
});

app.delete("/api/chapters/:chapterId", authenticateToken, authorizeAdmin, (req, res) => {
  const chapterId = req.params.chapterId;

  db.query("DELETE FROM chapters WHERE id = ?", [chapterId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!result.affectedRows) return res.status(404).json({ error: "Chapter not found" });
    res.json({ message: "Chapter deleted" });
  });
});

/* =========================
   ROUTES: FAVORITES
========================= */
app.get("/api/user/favorites", authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT m.*, f.created_at AS favorited_at
    FROM favorites f
    JOIN manga m ON m.id = f.manga_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

app.post("/api/user/favorites/:mangaId", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const mangaId = req.params.mangaId;

  db.query("INSERT INTO favorites (user_id, manga_id) VALUES (?, ?)", [userId, mangaId], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Already favorited" });
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ message: "Added to favorites" });
  });
});

app.delete("/api/user/favorites/:mangaId", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const mangaId = req.params.mangaId;

  db.query("DELETE FROM favorites WHERE user_id = ? AND manga_id = ?", [userId, mangaId], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!result.affectedRows) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Removed from favorites" });
  });
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.json({ message: "MangaQu API Server", ok: true });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`Server running on ${API_ORIGIN}`);
});
