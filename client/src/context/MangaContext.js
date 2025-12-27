
import React, { createContext, useContext, useState } from 'react';
import { mangaData } from '../pages/mangaData';

const MangaContext = createContext();

export const useManga = () => {
  const context = useContext(MangaContext);
  if (!context) {
    throw new Error('useManga must be used within a MangaProvider');
  }
  return context;
};

export const MangaProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);

  const addBookmark = (manga) => {
    setBookmarks(prev => [...prev, manga]);
  };

  const removeBookmark = (mangaId) => {
    setBookmarks(prev => prev.filter(manga => manga.id !== mangaId));
  };

  const value = {
    mangaList: mangaData, 
    bookmarks,
    addBookmark,
    removeBookmark
  };

  return (
    <MangaContext.Provider value={value}>
      {children}
    </MangaContext.Provider>
  );
};