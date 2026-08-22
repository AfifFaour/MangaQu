import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { MangaProvider } from './context/MangaContext';
import NavBar from './Components/common/NavBar';
import Footer from './Components/common/Footer';

import Home from './pages/Home';
import Browse from './pages/Browse';
import Newest from './pages/Newest';
import Updated from './pages/Updated';
import Favorite from './pages/Favorite';
import Types from './pages/Types';
import Genres from './pages/Genres';
import MangaDetail from './pages/MangaDetail';
import Reading from './pages/Reading';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp';
import DashBoard from './pages/DashBoard';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import MangaManagement from './pages/MangaManagement';
import History from './pages/History';
import PageNotFound from './pages/PageNotFound';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import About from './pages/About';
import Contact from './pages/Contact';
import Help from './pages/Help';
import Reader from './Components/manga/Reader';

import './App.css';

function App() {
  // GitHub Pages needs /MangaQu; Netlify/Render/custom hosts need /. 
  // Do not use package.json's homepage as a global basename because that
  // breaks production routing on hosts other than GitHub Pages.
  const isGitHubPages =
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('github.io');
  const basename = isGitHubPages ? '/MangaQu' : undefined;

  return (
    <AuthProvider>
      <MangaProvider>
        <Router basename={basename}>
          <div className="App">
            <NavBar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/newest" element={<Newest />} />
                <Route path="/updated" element={<Updated />} />
                <Route path="/types" element={<Types />} />
                <Route path="/types/:type" element={<Types />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/genres/:genre" element={<Genres />} />
                <Route path="/manga/:id" element={<MangaDetail />} />
                <Route path="/read/:mangaId/:chapterId" element={<Reading />} />
                <Route path="/reader" element={<Reader />} />
                <Route path="/read-volume/:mangaId/:volumeId" element={<Reader />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUp />} />

                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/help" element={<Help />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashBoard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/favorite" element={
                  <ProtectedRoute>
                    <Favorite />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                } />

                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <DashBoard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute adminOnly>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/manga" element={
                  <ProtectedRoute adminOnly>
                    <MangaManagement />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </MangaProvider>
    </AuthProvider>
  );
}

export default App;
