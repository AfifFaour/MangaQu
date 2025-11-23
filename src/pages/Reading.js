import React from 'react';
import { useParams } from 'react-router-dom';
import { useManga } from '../context/MangaContext';


const Reading = () => {
  const { mangaId, chapterId } = useParams();
  const { mangaList, addToHistory } = useManga();
  
  const manga = mangaList.find(m => m.id === parseInt(mangaId));
  const chapter = manga?.chapters?.find(c => c.id === parseInt(chapterId));

  React.useEffect(() => {
    if (manga && chapter) {
      addToHistory(manga, chapter);
    }
  }, [manga, chapter, addToHistory]);

  if (!manga || !chapter) {
    return <div>Chapter not found</div>;
  }

  return (
    <div className="reading">
      <h1>{manga.title} - Chapter {chapter.number}</h1>
      <div className="chapter-pages">
        {chapter.pages?.map((page, index) => (
          <img key={index} src={page} alt={`Page ${index + 1}`} />
        ))}
      </div>
    </div>
  );
};

export default Reading;