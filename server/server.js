const express = require('express');
const app = express();
const port = 5000;

app.use(express.json());

// Mock data
let mangaData = [
  { id: 1, title: 'Naruto' },
  { id: 2, title: 'One Piece' },
  { id: 3, title: 'Attack on Titan' },
];

const dashboardData = {
  totalManga: mangaData.length,
  totalUsers: 100, // Example static data, replace with dynamic data
};

// Dashboard endpoint
app.get('/api/dashboard', (req, res) => {
  res.json(dashboardData);
});

// Get all manga
app.get('/api/manga', (req, res) => {
  res.json(mangaData);
});

// Delete manga
app.delete('/api/manga/:id', (req, res) => {
  const { id } = req.params;
  mangaData = mangaData.filter(manga => manga.id !== parseInt(id));
  res.status(200).json({ message: 'Manga deleted successfully' });
});

// Get specific manga
app.get('/api/manga/:id', (req, res) => {
  const { id } = req.params;
  const manga = mangaData.find(m => m.id === parseInt(id));
  if (manga) {
    res.json(manga);
  } else {
    res.status(404).json({ message: 'Manga not found' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
