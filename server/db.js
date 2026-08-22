// db.js
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // important for remote DBs
  connectTimeout: 30000,

  // Railway proxy often requires SSL
  ssl: { rejectUnauthorized: false },

  // keepalive helps with proxies
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// quick test on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully (pool)");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.code, err.message);
  }
})();

module.exports = pool;
