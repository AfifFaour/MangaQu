
import aotImgC from '../Assets/CoverImg/aotImgC.jpg';
import SlaC from '../Assets/CoverImg/SlaC.jpg';
import OPC from '../Assets/CoverImg/OPC.jpg';
import NarutoC from '../Assets/CoverImg/NarutoC.jpg';
import DSC from '../Assets/CoverImg/DSC.jpg';
import JJKC from '../Assets/CoverImg/JJKC.jpg';
import CSMC from '../Assets/CoverImg/CSMC.jpg';
import TKRC from '../Assets/CoverImg/TKRC.jpg';
import TNGC from '../Assets/CoverImg/TNGC.jpg';
import TTIRAASC from '../Assets/CoverImg/TTIRAASC.jpg';
import CBPEC from '../Assets/CoverImg/CBPEC.jpg';

// Add this to your mangaData.js file
export const getMangaByType = (type) => {
  return mangaData.filter(manga => 
    manga.type?.toLowerCase() === type.toLowerCase()
  );
};

export const mangaData = [
  // Popular/Browse Manga
  {
    id: 1,
    title: 'One Piece',
    image: OPC,
    description: 'Join Monkey D. Luffy and his pirate crew in their quest for the ultimate treasure, the One Piece.',
    chapters: 1100,
    views: 15000000,
    likes: 850000,
    rating: 4.9,
    status: 'ongoing',
    type: 'Manga',
    genres: ['Action', 'Adventure', 'Comedy'],
    lastUpdated: '2 days ago',
    uploadDate: '2024-01-10',
    addedDate: '2024-01-10'
  },
  {
    id: 2,
    title: 'Attack on Titan',
    image: aotImgC,
    description: 'In a world where humanity lives inside cities surrounded by enormous walls due to the Titans.',
    chapters: 139,
    views: 12000000,
    likes: 950000,
    rating: 4.8,
    status: 'completed',
    type: 'Manga',
    genres: ['Action', 'Drama', 'Fantasy'],
    lastUpdated: '1 week ago',
    uploadDate: '2024-01-05',
    addedDate: '2024-01-05'
  },
  {
    id: 3,
    title: 'Solo Leveling',
    image: SlaC,
    description: 'Follow Sung Jin-Woo as he rises from the weakest hunter to the most powerful.',
    chapters: 179,
    views: 18000000,
    likes: 1200000,
    rating: 4.9,
    status: 'completed',
    type: 'Manhwa',
    genres: ['Action', 'Adventure', 'Fantasy'],
    lastUpdated: '3 days ago',
    uploadDate: '2024-01-08',
    addedDate: '2024-01-08'
  },
  {
    id: 4,
    title: 'Naruto',
    image: NarutoC,
    description: 'The story of Naruto Uzumaki, a young ninja who seeks recognition from his peers.',
    chapters: 700,
    views: 20000000,
    likes: 1500000,
    rating: 4.7,
    status: 'completed',
    type: 'Manga',
    genres: ['Action', 'Adventure'],
    lastUpdated: '1 month ago',
    uploadDate: '2023-12-15',
    addedDate: '2023-12-15'
  },
  {
    id: 5,
    title: 'Demon Slayer',
    image: DSC,
    description: 'Tanjiro Kamado fights demons and seeks to cure his sister Nezuko.',
    chapters: 205,
    views: 16000000,
    likes: 1100000,
    rating: 4.8,
    status: 'completed',
    type: 'Manga',
    genres: ['Action', 'Fantasy'],
    lastUpdated: '2 weeks ago',
    uploadDate: '2023-12-25',
    addedDate: '2023-12-25'
  },
  {
    id: 6,
    title: 'Jujutsu Kaisen',
    image: JJKC,
    description: 'Yuji Itadori battles curses after swallowing a powerful cursed object.',
    chapters: 245,
    views: 14000000,
    likes: 900000,
    rating: 4.8,
    status: 'ongoing',
    type: 'Manga',
    genres: ['Action', 'Supernatural'],
    lastUpdated: '1 day ago',
    uploadDate: '2024-01-24',
    addedDate: '2024-01-24'
  },
  {
    id: 7,
    title: 'Chainsaw Man',
    image: CSMC,
    description: 'Denji becomes Chainsaw Man after merging with his pet devil Pochita.',
    chapters: 127,
    views: 13000000,
    likes: 800000,
    rating: 4.7,
    status: 'ongoing',
    type: 'Manga',
    genres: ['Action', 'Horror'],
    lastUpdated: '4 days ago',
    uploadDate: '2024-01-21',
    addedDate: '2024-01-21'
  },
  {
    id: 8,
    title: 'Tokyo Revengers',
    image: TKRC,
    description: 'Takemichi time-leaps to save his girlfriend and change the future.',
    chapters: 278,
    views: 11000000,
    likes: 700000,
    rating: 4.6,
    status: 'completed',
    type: 'Manga',
    genres: ['Action', 'Drama'],
    lastUpdated: '3 weeks ago',
    uploadDate: '2024-01-03',
    addedDate: '2024-01-03'
  },

  {
    id: 101,
    title: 'The New Gate',
    image: TNGC,
    description: 'A VRMMO player gets trapped in the game world after defeating the final boss.',
    chapters: 15,
    views: 150000,
    likes: 12000,
    rating: 4.5,
    status: 'ongoing',
    type: 'Manga',
    genres: ['Action', 'Fantasy', 'Adventure'],
    lastUpdated: '2 hours ago',
    uploadDate: '2024-01-25',
    addedDate: '2024-01-25'
  },
  {
    id: 102,
    title: 'Reincarnated as a Slime',
    image: TTIRAASC,
    description: 'A man is reincarnated as a slime in a fantasy world and gains incredible powers.',
    chapters: 8,
    views: 280000,
    likes: 25000,
    rating: 4.7,
    status: 'ongoing',
    type: 'Manga',
    genres: ['Fantasy', 'Adventure', 'Comedy'],
    lastUpdated: '5 hours ago',
    uploadDate: '2024-01-24',
    addedDate: '2024-01-24'
  },
  {
    id: 103,
    title: 'Cyberpunk: Edgerunners',
    image: CBPEC,
    description: 'A street kid tries to survive in a technology and body modification-obsessed city.',
    chapters: 12,
    views: 320000,
    likes: 18000,
    rating: 4.6,
    status: 'ongoing',
    type: 'Manga',
    genres: ['Sci-Fi', 'Action', 'Cyberpunk'],
    lastUpdated: '1 day ago',
    uploadDate: '2024-01-23',
    addedDate: '2024-01-23'
  },
];

// Helper functions
export const getMangaById = (id) => {
  return mangaData.find(manga => manga.id === parseInt(id));
};

export const getPopularManga = () => {
  return mangaData.filter(manga => manga.id <= 8); // IDs 1-8 are popular
};

export const getNewestManga = () => {
  return mangaData.filter(manga => manga.id >= 101); // IDs 101+ are newest
};

export const getMangaByGenre = (genre) => {
  return mangaData.filter(manga => 
    manga.genres?.some(g => g.toLowerCase() === genre.toLowerCase())
  );
};

export const searchManga = (query) => {
  const lowerQuery = query.toLowerCase();
  return mangaData.filter(manga =>
    manga.title.toLowerCase().includes(lowerQuery) ||
    manga.description.toLowerCase().includes(lowerQuery) ||
    manga.genres.some(genre => genre.toLowerCase().includes(lowerQuery))
  );
  
};