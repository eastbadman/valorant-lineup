import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Lineup {
  id: number;
  agent: string;
  map: string;
  ability: string;
  description: string;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Lineup[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearched(true);
    const res = await fetch(`/api/lineups?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🔍 搜索 Lineup</h1>

      {/* 搜索框 */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索角色、地图、技能或描述..."
            className="flex-1 bg-gray-700 rounded px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded font-semibold transition"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 搜索结果 */}
      {searched && (
        <div>
          <p className="text-gray-400 mb-4">找到 {results.length} 个结果</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((lineup) => (
              <Link
                key={lineup.id}
                to={`/lineup/${lineup.id}`}
                className="bg-gray-800 rounded-lg p-4 hover:ring-2 hover:ring-red-500 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{lineup.agent}</h3>
                  <span className="bg-gray-700 text-xs px-2 py-1 rounded">{lineup.map}</span>
                </div>
                <p className="text-gray-400 text-sm mb-2">✨ {lineup.ability}</p>
                <p className="text-gray-300 text-sm line-clamp-2">{lineup.description}</p>
              </Link>
            ))}
          </div>

          {results.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl">未找到相关结果</p>
              <p className="text-sm mt-2">请尝试其他关键词</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
