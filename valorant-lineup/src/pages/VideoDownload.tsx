import { useState } from 'react';

export default function VideoDownload() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('auto');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!url.trim()) {
      setStatus('请输入视频链接');
      return;
    }
    
    setLoading(true);
    setStatus('下载中...');
    
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: platform })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStatus(`✅ 下载成功！保存路径: ${data.path}`);
      } else {
        setStatus(`❌ 下载失败: ${data.error}`);
      }
    } catch (err) {
      setStatus(`❌ 下载失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">📹 视频下载服务</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm mb-2">视频链接</label>
          <input
            type="text"
            placeholder="YouTube或B站视频链接..."
            className="w-full bg-gray-700 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm mb-2">视频平台</label>
          <select
            className="w-full bg-gray-700 rounded px-4 py-2"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="auto">自动检测</option>
            <option value="youtube">YouTube</option>
            <option value="bilibili">B站</option>
          </select>
        </div>
        
        <button
          onClick={handleDownload}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded font-semibold disabled:opacity-50 transition"
        >
          {loading ? '下载中...' : '开始下载'}
        </button>
        
        {status && (
          <div className="mt-4 p-3 bg-gray-700 rounded">
            {status}
          </div>
        )}
        
        <div className="mt-6 text-gray-400 text-sm">
          <p>💡 提示：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>支持YouTube和B站视频下载</li>
            <li>需要先安装 yt-dlp: <code className="bg-gray-600 px-1 rounded">pip install yt-dlp</code></li>
            <li>视频将保存到 server/public/videos/ 目录</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
