import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, isLoggedIn, getUser } from '../api';

interface PendingLineup {
  id: number;
  agent: string;
  map: string;
  ability: string;
  description: string;
  author_name: string;
  video_url: string;
  created_at: string;
}

export default function Admin() {
  const [pending, setPending] = useState<PendingLineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUser();
    if (!isLoggedIn() || !user || !['admin', 'eastbadman'].includes(user.username)) {
      alert('需要管理员权限');
      navigate('/');
      return;
    }
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await api.getPending() as PendingLineup[];
      setPending(data);
    } catch (err) {
      console.error('Failed to fetch pending:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await api.approveLineup(id);
      setPending(pending.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('审核失败');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('确定要拒绝这个Lineup吗？')) return;
    
    setProcessing(id);
    try {
      await api.rejectLineup(id);
      setPending(pending.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('操作失败');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🔧 审核管理</h1>
        <Link to="/" className="text-red-400 hover:text-red-300">
          ← 返回首页
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">加载中...</p>
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">🎉 暂无待审核内容</p>
          <p className="text-sm">所有Lineup都已处理完毕</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((lineup) => (
            <div
              key={lineup.id}
              className="bg-gray-800 rounded-lg p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{lineup.agent}</h3>
                    <span className="bg-red-500 px-2 py-1 rounded text-sm">{lineup.ability}</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-sm">🗺️ {lineup.map}</span>
                  </div>
                  <p className="text-gray-300 mb-2">{lineup.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>👤 {lineup.author_name || '匿名'}</span>
                    <span>📅 {new Date(lineup.created_at).toLocaleDateString('zh-CN')}</span>
                    {lineup.video_url && (
                      <a 
                        href={lineup.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-red-400 hover:text-red-300"
                      >
                        📹 查看视频
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 ml-4">
                  <button
                    onClick={() => handleApprove(lineup.id)}
                    disabled={processing === lineup.id}
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {processing === lineup.id ? '处理中...' : '✅ 通过'}
                  </button>
                  <button
                    onClick={() => handleReject(lineup.id)}
                    disabled={processing === lineup.id}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {processing === lineup.id ? '处理中...' : '❌ 拒绝'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-gray-500 text-sm">
        待审核数量: {pending.length}
      </div>
    </div>
  );
}
