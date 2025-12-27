import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Updated import

const MangaManagement = () => {
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();  // Updated variable name

  useEffect(() => {
    const fetchMangaList = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/manga');
        if (!response.ok) {
          throw new Error('Failed to fetch manga data');
        }
        const data = await response.json();
        setMangaList(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMangaList();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/manga/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete manga');
      }

      setMangaList(mangaList.filter(manga => manga.id !== id)); 
    } catch (error) {
      setError('Error deleting manga');
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/mangaDetail/${id}`);  // Updated navigation method
  };

  if (loading) {
    return <p>Loading Manga List...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Manga Management</h1>
      <div className="manga-list">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mangaList.map((manga) => (
              <tr key={manga.id}>
                <td>{manga.title}</td>
                <td>
                  <button onClick={() => handleEdit(manga.id)}>Edit</button>
                  <button onClick={() => handleDelete(manga.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MangaManagement;
