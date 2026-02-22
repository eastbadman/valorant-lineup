import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, isLoggedIn } from '../api';

interface Lineup {
  id: number;
  agent: string;
  map: string;
  ability: string;
  description: string;
  video_url: string;
  like_count: number;
  favorite_count: number;
  is_liked?: boolean;
  is_favorited?: boolean;
  author_name?: string;
}

export default function Home() {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [filters, setFilters] = useState({
    agent: '',
    map: '',
    ability: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLineups();
  }, [filters]);

  const fetchLineups = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.agent) params.agent = filters.agent;
      if (filters.map) params.map = filters.map;
      if (filters.ability) params.ability = filters.ability;
      
      const data = await api.getLineups(Object.keys(params).length > 0 ? params : undefined);
      setLineups(data);
    } catch (err) {
      console.error('Failed to fetch lineups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, lineupId: number, isLiked?: boolean) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      alert('请先登录');
      return;
    }
    
    try {
      if (isLiked) {
        await api.removeLike(lineupId);
      } else {
        await api.addLike(lineupId);
      }
      fetchLineups(); // 刷新数据
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleFavorite = async (e: React.MouseEvent, lineupId: number, isFavorited?: boolean) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      alert('请先登录');
      return;
    }
    
    try {
      if (isFavorited) {
        await api.removeFavorite(lineupId);
      } else {
        await api.addFavorite(lineupId);
      }
      fetchLineups(); // 刷新数据
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 统计信息 */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">🎯 Valorant Lineup</h1>
        <p className="text-red-100">发现最佳技能释放点位，提升你的游戏水平</p>
      </div>

      {/* 筛选器 */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">🔍 筛选 Lineup</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="bg-gray-700 rounded px-4 py-2"
            value={filters.agent}
            onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
          >
            <option value="">所有角色</option>
            <option value="Jett">Jett</option>
            <option value="Sage">Sage</option>
            <option value="Sova">Sova</option>
            <option value="Omen">Omen</option>
            <option value="Phoenix">Phoenix</option>
            <option value="Reyna">Reyna</option>
            <option value="Killjoy">Killjoy</option>
            <option value="Cypher">Cypher</option>
            <option value="Viper">Viper</option>
            <option value="Brimstone">Brimstone</option>
            <option value="Astra">Astra</option>
          </select>
          
          <select
            className="bg-gray-700 rounded px-4 py-2"
            value={filters.map}
            onChange={(e) => setFilters({ ...filters, map: e.target.value })}
          >
            <option value="">所有地图</option>
            <option value="Ascent">Ascent</option>
            <option value="Haven">Haven</option>
            <option value="Bind">Bind</option>
            <option value="Split">Split</option>
            <option value="Icebox">Icebox</option>
            <option value="Breeze">Breeze</option>
            <option value="Fracture">Fracture</option>
            <option value="Pearl">Pearl</option>
            <option value="Lotus">Lotus</option>
            <option value="Sunset">Sunset</option>
          </select>
          
          <select
            className="bg-gray-700 rounded px-4 py-2"
            value={filters.ability}
            onChange={(e) => setFilters({ ...filters, ability: e.target.value })}
          >
            <option value="">所有技能</option>
            <option value="Tailwind">Tailwind (Jett)</option>
            <option value="Updraft">Updraft (Jett)</option>
            <option value="Barrier Orb">Barrier Orb (Sage)</option>
            <option value="Slow Orb">Slow Orb (Sage)</option>
            <option value="Recon Bolt">Recon Bolt (Sova)</option>
            <option value="Shock Bolt">Shock Bolt (Sova)</option>
          </select>

          <button
            onClick={() => setFilters({ agent: '', map: '', ability: '' })}
            className="bg-gray-700 hover:bg-gray-600 rounded px-4 py-2 transition"
          >
            重置筛选
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">加载中...</p>
        </div>
      )}

      {/* Lineup 列表 */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lineups.map((lineup) => (
            <Link
              key={lineup.id}
              to={`/lineup/${lineup.id}`}
              className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-red-500 transition group"
            >
              <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center relative">
                <span className="text-4xl">🗺️</span>
                <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs">
                  {lineup.map}
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{lineup.agent}</h3>
                  <span className="bg-red-500 text-xs px-2 py-1 rounded">{lineup.ability}</span>
                </div>
                <p className="text-gray-300 text-sm line-clamp-2 mb-3">{lineup.description}</p>
                
                {/* 底部信息栏 */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {lineup.author_name && `by ${lineup.author_name}`}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => handleLike(e, lineup.id, lineup.is_liked)}
                      className={`flex items-center gap-1 ${
                        lineup.is_liked ? 'text-red-400' : 'text-gray-400'
                      } hover:text-red-300`}
                    >
                      {lineup.is_liked ? '❤️' : '🤍'} {lineup.like_count || 0}
                    </button>
                    <button
                      onClick={(e) => handleFavorite(e, lineup.id, lineup.is_favorited)}
                      className={`flex items-center gap-1 ${
                        lineup.is_favorited ? 'text-yellow-400' : 'text-gray-400'
                      } hover:text-yellow-300`}
                    >
                      {lineup.is_favorited ? '⭐' : '☆'} {lineup.favorite_count || 0}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && lineups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">暂无数据</p>
          <p className="text-sm mt-2">请尝试调整筛选条件</p>
        </div>
      )}
    </div>
  );
}
