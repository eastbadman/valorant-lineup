import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

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
  created_at: string;
}

export default function LineupDetail() {
  const { id } = useParams();
  const [lineup, setLineup] = useState<Lineup | null>(null);

  useEffect(() => {
    fetchLineup();
  }, [id]);

  const fetchLineup = async () => {
    const res = await fetch(`http://localhost:3001/api/lineups/${id}`);
    const data = await res.json();
    setLineup(data);
  };

  if (!lineup) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">加载中...</p>
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
            className="lineup-marker position"
            style={{ left: `${lineup.position_x * 100}%`, top: `${lineup.position_y * 100}%` }}
            title={`释放点: ${lineup.position_x}, ${lineup.position_y}`}
          />
          
          {/* 目标点 */}
          <div
            className="lineup-marker target"
            style={{ left: `${lineup.target_x * 100}%`, top: `${lineup.target_y * 100}%` }}
            title={`目标点: ${lineup.target_x}, ${lineup.target_y}`}
          />
          
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="bg-blue-500 px-2 py-1 rounded text-sm">释放点</span>
            <span className="bg-red-500 px-2 py-1 rounded text-sm">目标点</span>
          </div>
        </div>

        {/* 详情信息 */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{lineup.agent} - {lineup.ability}</h1>
              <div className="flex gap-2">
                <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">{lineup.map}</span>
                <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">作者: {lineup.author}</span>
              </div>
            </div>
          </div>

          <p className="text-gray-300 mb-6">{lineup.description}</p>

          {/* 视频 */}
          {lineup.video_url && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">📹 演示视频</h3>
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <a
                  href={lineup.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300"
                >
                  观看视频演示
                </a>
              </div>
            </div>
          )}

          <div className="text-gray-500 text-sm">
            创建时间: {new Date(lineup.created_at).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>
    </div>
  );
}
