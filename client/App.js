// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MangaProvider } from './context/MangaContext';
import NavBar from './components/common/NavBar';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import MangaDetail from './pages/MangaDetail';
import Reading from './pages/Reading';
import Genres from './pages/Genres';
import Types from './pages/Types';
import Newest from './pages/Newest';
import Updated from './pages/Updated';
import Browse from './pages/admin/Browse';
import ChapterData from './pages/admin/ChapterData';
import Favorite from './pages/Favorite';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import './styles/main.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <MangaProvider>
          <div className="app">
            <NavBar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/manga/:id" element={<MangaDetail />} />
                <Route path="/manga/:mangaId/chapter/:chapterId" element={<Reading />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/types" element={<Types />} />
                <Route path="/newest" element={<Newest />} />
                <Route path="/updated" element={<Updated />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUp />} />
                
                {/* Protected Routes */}
                <Route path="/favorites" element={<Favorite />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Admin Routes */}
                <Route path="/admin/browse" element={<Browse />} />
                <Route path="/admin/chapter-data" element={<ChapterData />} />
                
                {/* Redirects */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </MangaProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;