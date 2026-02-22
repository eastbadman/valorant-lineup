import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, isLoggedIn } from '../api';

interface Lineup {
  id: number;
  agent: string;
  map: string;
  ability: string;
  description: string;
  like_count: number;
  is_liked: boolean;
  is_favorited: boolean;
  author_name?: string;
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await api.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (lineupId: number) => {
    try {
      await api.removeFavorite(lineupId);
      fetchFavorites();
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">⭐ 我的收藏</h1>
        <Link to="/" className="text-red-400 hover:text-red-300">
          ← 返回首页
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">加载中...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">暂无收藏</p>
          <p className="text-sm">去首页收藏一些lineup吧！</p>
          <Link to="/" className="text-red-400 hover:text-red-300 mt-4 inline-block">
            浏览Lineup
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((lineup) => (
            <div
              key={lineup.id}
              className="bg-gray-800 rounded-lg overflow-hidden"
            >
              <Link
                to={`/lineup/${lineup.id}`}
                className="block aspect-video bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center relative hover:opacity-90 transition"
              >
                <span className="text-4xl">🗺️</span>
                <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs">
                  {lineup.map}
                </div>
              </Link>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Link to={`/lineup/${lineup.id}`} className="font-bold text-lg hover:text-red-400">
                    {lineup.agent}
                  </Link>
                  <span className="bg-red-500 text-xs px-2 py-1 rounded">{lineup.ability}</span>
                </div>
                <p className="text-gray-300 text-sm line-clamp-2 mb-3">{lineup.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">
                    ❤️ {lineup.like_count || 0}
                  </span>
                  <button
                    onClick={() => handleRemoveFavorite(lineup.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    取消收藏
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
