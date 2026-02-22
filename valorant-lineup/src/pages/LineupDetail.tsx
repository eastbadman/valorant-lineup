import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, isLoggedIn } from '../api';

interface Lineup {
  id: number;
  agent: string;
  map: string;
  ability: string;
  position_x: number;
  position_y: number;
  target_x: number;
  target_y: number;
  video_url: string;
  description: string;
  author: string;
  author_name: string;
  created_at: string;
  like_count: number;
  favorite_count: number;
  is_liked: boolean;
  is_favorited: boolean;
}

export default function LineupDetail() {
  const { id } = useParams();
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLineup();
  }, [id]);

  const fetchLineup = async () => {
    setLoading(true);
    try {
      const data = await api.getLineup(Number(id)) as Lineup;
      setLineup(data);
    } catch (err) {
      console.error('Failed to fetch lineup:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn()) {
      alert('请先登录');
      return;
    }
    
    if (!lineup) return;
    
    try {
      if (lineup.is_liked) {
        await api.removeLike(lineup.id);
      } else {
        await api.addLike(lineup.id);
      }
      fetchLineup();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleFavorite = async () => {
    if (!isLoggedIn()) {
      alert('请先登录');
      return;
    }
    
    if (!lineup) return;
    
    try {
      if (lineup.is_favorited) {
        await api.removeFavorite(lineup.id);
      } else {
        await api.addFavorite(lineup.id);
      }
      fetchLineup();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  if (!lineup) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Lineup不存在</p>
        <Link to="/" className="text-red-400 hover:text-red-300 mt-4 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="text-red-400 hover:text-red-300 mb-4 inline-block">
        ← 返回首页
      </Link>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {/* 地图可视化 */}
        <div className="aspect-[16/9] bg-gradient-to-br from-gray-700 to-gray-600 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🗺️ {lineup.map}</span>
          </div>
          
          {/* 释放点 */}
          <div
            className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{ left: `${lineup.position_x * 100}%`, top: `${lineup.position_y * 100}%` }}
            title={`释放点: (${lineup.position_x}, ${lineup.position_y})`}
          />
          
          {/* 目标点 */}
          <div
            className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${lineup.target_x * 100}%`, top: `${lineup.target_y * 100}%` }}
            title={`目标点: (${lineup.target_x}, ${lineup.target_y})`}
          />
          
          {/* 连接线 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1={`${lineup.position_x * 100}%`}
              y1={`${lineup.position_y * 100}%`}
              x2={`${lineup.target_x * 100}%`}
              y2={`${lineup.target_y * 100}%`}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </svg>
          
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="bg-blue-500 px-2 py-1 rounded text-sm">🔵 释放点</span>
            <span className="bg-red-500 px-2 py-1 rounded text-sm">🔴 目标点</span>
          </div>
        </div>

        {/* 详情信息 */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{lineup.agent} - {lineup.ability}</h1>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">🗺️ {lineup.map}</span>
                <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">👤 {lineup.author_name || lineup.author}</span>
              </div>
            </div>

            {/* 点赞/收藏按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  lineup.is_liked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {lineup.is_liked ? '❤️' : '🤍'} {lineup.like_count || 0}
              </button>
              <button
                onClick={handleFavorite}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  lineup.is_favorited 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {lineup.is_favorited ? '⭐' : '☆'} 收藏
              </button>
            </div>
          </div>

          <p className="text-gray-300 mb-6 text-lg">{lineup.description}</p>

          {/* 视频 */}
          {lineup.video_url && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">📹 演示视频</h3>
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                {lineup.video_url.includes('youtube.com') || lineup.video_url.includes('youtu.be') ? (
                  <iframe
                    className="w-full h-full rounded-lg"
                    src={lineup.video_url.replace('watch?v=', 'embed/')}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : lineup.video_url.includes('bilibili.com') ? (
                  <a
                    href={lineup.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 flex items-center gap-2"
                  >
                    🎬 在B站观看演示视频
                  </a>
                ) : (
                  <a
                    href={lineup.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300"
                  >
                    观看视频演示
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-gray-500 text-sm">
            <span>创建时间: {new Date(lineup.created_at).toLocaleDateString('zh-CN')}</span>
            <span className="text-gray-600">ID: #{lineup.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
