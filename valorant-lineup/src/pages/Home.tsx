import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Lineup {
  id: number;
  agent: string;
  map: string;
  ability: string;
  description: string;
  video_url: string;
}

export default function Home() {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [filters, setFilters] = useState({
    agent: '',
    map: '',
    ability: ''
  });

  useEffect(() => {
    fetchLineups();
  }, [filters]);

  const fetchLineups = async () => {
    const params = new URLSearchParams();
    if (filters.agent) params.append('agent', filters.agent);
    if (filters.map) params.append('map', filters.map);
    if (filters.ability) params.append('ability', filters.ability);
    
    const res = await fetch(`http://localhost:3001/api/lineups?${params}`);
    const data = await res.json();
    setLineups(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 筛选器 */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">🔍 筛选 Lineup</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="bg-gray-700 rounded px-4 py-2"
            value={filters.agent}
            onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
          >
            <option value="">所有角色</option>
            <option value="Jett">Jett</option>
            <option value="Sage">Sage</option>
            <option value="Sova">Sova</option>
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
          </select>
          
          <select
            className="bg-gray-700 rounded px-4 py-2"
            value={filters.ability}
            onChange={(e) => setFilters({ ...filters, ability: e.target.value })}
          >
            <option value="">所有技能</option>
            <option value="Tailwind">Tailwind</option>
            <option value="Barrier Orb">Barrier Orb</option>
            <option value="Recon Bolt">Recon Bolt</option>
          </select>
        </div>
      </div>

      {/* Lineup 列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lineups.map((lineup) => (
          <Link
            key={lineup.id}
            to={`/lineup/${lineup.id}`}
            className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-red-500 transition"
          >
            <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
              <span className="text-4xl">🗺️</span>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{lineup.agent}</h3>
                <span className="bg-red-500 text-xs px-2 py-1 rounded">{lineup.map}</span>
              </div>
              <p className="text-gray-400 text-sm mb-2">✨ {lineup.ability}</p>
              <p className="text-gray-300 text-sm line-clamp-2">{lineup.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {lineups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">暂无数据</p>
          <p className="text-sm mt-2">请尝试调整筛选条件</p>
        </div>
      )}
    </div>
  );
}
