import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import Reader from './Components/manga/Reader';
import DashBoard from "./pages/admin/DashBoard";
import MangaManagment from "./pages/admin/MangaManagment";

import './App.css';

function App() {
  return (
    <AuthProvider>
      <MangaProvider>
        <Router>
          <div className="App">
            <NavBar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/newest" element={<Newest />} />
                <Route path="/updated" element={<Updated />} />
                <Route path="/favorite" element={<Favorite />} />
                <Route path="/types" element={<Types />} />
                <Route path="/types/:type" element={<Types />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/genres/:genre" element={<Genres />} />
                <Route path="/manga/:id" element={<MangaDetail />} />
                <Route path="/read/:mangaId/:chapterId" element={<Reading />} />
                <Route path="/Reader" element={<Reader />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/admin" element={<DashBoard />} />
                <Route path="/admin/manga" element={<MangaManagment />} />
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