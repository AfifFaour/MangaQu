// src/context/MangaContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/Api";

const MangaContext = createContext(null);

export const MangaProvider = ({ children }) => {
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshMangas = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manga");
      setMangas(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to load manga", e);
      setMangas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMangas();
  }, []);

  return (
    <MangaContext.Provider value={{ mangas, loading, refreshMangas }}>
      {children}
    </MangaContext.Provider>
  );
};

export const useManga = () => useContext(MangaContext);
