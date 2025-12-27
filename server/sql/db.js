// src/config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// For XAMPP (usually no password, root user)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mangaweb',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',  // Empty string for XAMPP default
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    },
    dialectOptions: {
      // For XAMPP socket connection (optional)
      // socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock' // Mac
      // socketPath: 'C:/xampp/mysql/mysql.sock' // Windows
    }
  }
);

// Test connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to XAMPP MySQL database:', process.env.DB_NAME);
    
    // Show tables
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('📊 Database tables:', tables.map(t => Object.values(t)[0]));
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 XAMPP Troubleshooting:');
    console.log('1. Make sure XAMPP MySQL is running (green light)');
    console.log('2. Check phpMyAdmin at http://localhost/phpmyadmin');
    console.log('3. Verify database name in .env matches your database');
    console.log('4. Try empty password in .env: DB_PASSWORD=');
    return false;
  }
};

export default sequelize;