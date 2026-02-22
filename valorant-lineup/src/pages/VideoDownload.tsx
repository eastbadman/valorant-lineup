import { useState } from 'react';
import { api } from '../api';

export default function VideoDownload() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('auto');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  const handleDownload = async () => {
    if (!url.trim()) {
      setStatus('请输入视频链接');
      return;
    }
    
    setLoading(true);
    setStatus('下载中...');
    
    try {
      const data = await api.downloadVideo(url, platform) as { success: boolean; path?: string; error?: string };
      
      if (data.success) {
        setStatus(`✅ 下载成功！保存路径: ${data.path}`);
      } else {
        setStatus(`❌ 下载失败: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`❌ 下载失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!url.trim()) {
      setSummary('请先输入视频链接');
      return;
    }
    
    setSummarizing(true);
    setSummary('🤖 AI正在分析视频内容...');
    
    try {
      const data = await api.aiSummarize(url) as { success: boolean; summary: string; videoInfo?: string; model?: string };
      
      if (data.success) {
        setSummary(data.summary);
      } else {
        setSummary('❌ AI总结失败');
      }
    } catch (err: any) {
      setSummary(`❌ 总结失败: ${err.message}`);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">📹 视频服务</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 视频下载 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-400">📥 视频下载</h2>
          
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
            className="w-full bg-red-500 hover:bg-red-600 py-2 rounded font-semibold disabled:opacity-50 transition"
          >
            {loading ? '下载中...' : '开始下载'}
          </button>
          
          {status && (
            <div className="mt-4 p-3 bg-gray-700 rounded text-sm">
              {status}
            </div>
          )}
        </div>

        {/* AI总结 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">🤖 AI视频总结</h2>
          
          <p className="text-gray-400 text-sm mb-4">
            输入视频链接，AI将自动分析视频内容并生成总结
          </p>
          
          <button
            onClick={handleSummarize}
            disabled={summarizing || !url.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 py-2 rounded font-semibold disabled:opacity-50 transition mb-4"
          >
            {summarizing ? '分析中...' : '生成AI总结'}
          </button>
          
          {summary && (
            <div className="mt-4 p-4 bg-gray-700 rounded max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{summary}</pre>
            </div>
          )}
          
          <div className="mt-4 text-gray-500 text-xs">
            <p>💡 提示：支持YouTube和B站视频</p>
            <p>AI会提取视频标题和描述进行分析</p>
          </div>
        </div>
      </div>
      
      {/* 使用说明 */}
      <div className="mt-6 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">📖 使用说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <p className="font-medium text-white mb-2">视频下载</p>
            <ul className="list-disc list-inside space-y-1">
              <li>支持YouTube和B站视频</li>
              <li>需要先安装 yt-dlp</li>
              <li>视频保存到 server/public/videos/</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-white mb-2">AI总结</p>
            <ul className="list-disc list-inside space-y-1">
              <li>自动分析视频标题和描述</li>
              <li>生成Valorant相关的总结</li>
              <li>需要配置智谱API Key</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
