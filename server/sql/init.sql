-- Create database
CREATE DATABASE IF NOT EXISTS manga_db;
USE manga_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Manga table
CREATE TABLE IF NOT EXISTS manga (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(500) DEFAULT '/default-cover.jpg',
    status ENUM('ongoing', 'completed', 'hiatus') DEFAULT 'ongoing',
    author VARCHAR(100),
    artist VARCHAR(100),
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_views (views DESC),
    FULLTEXT idx_search (title, description)
);

-- Genres table
CREATE TABLE IF NOT EXISTS genres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL
);

-- Manga genres junction table
CREATE TABLE IF NOT EXISTS manga_genres (
    manga_id INT,
    genre_id INT,
    PRIMARY KEY (manga_id, genre_id),
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    manga_id INT NOT NULL,
    chapter_number DECIMAL(10,2) NOT NULL,
    title VARCHAR(200),
    pages JSON NOT NULL,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE,
    UNIQUE KEY unique_manga_chapter (manga_id, chapter_number),
    INDEX idx_manga_chapter (manga_id, chapter_number)
);

-- Reading history
CREATE TABLE IF NOT EXISTS reading_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    manga_id INT NOT NULL,
    chapter_id INT NOT NULL,
    page_number INT DEFAULT 1,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    INDEX idx_user_manga (user_id, manga_id),
    INDEX idx_recent (user_id, read_at DESC)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    manga_id INT NOT NULL,
    chapter_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_manga (user_id, manga_id)
);

-- Insert default genres
INSERT INTO genres (name, slug) VALUES
    ('Action', 'action'),
    ('Adventure', 'adventure'),
    ('Comedy', 'comedy'),
    ('Drama', 'drama'),
    ('Fantasy', 'fantasy'),
    ('Horror', 'horror'),
    ('Mystery', 'mystery'),
    ('Romance', 'romance'),
    ('Sci-Fi', 'sci-fi'),
    ('Slice of Life', 'slice-of-life'),
    ('Sports', 'sports'),
    ('Supernatural', 'supernatural')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Create admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin@manga.com', '$2a$10$YourHashedPasswordHere', 'admin')
ON DUPLICATE KEY UPDATE username = VALUES(username);