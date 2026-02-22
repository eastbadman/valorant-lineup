import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, isLoggedIn } from '../api';

// Valorant agents
const AGENTS = [
  'Breach', 'Brimstone', 'Chamber', 'Cypher', 'Deadlock', 'Fade', 'Gekko', 'Harbor',
  'Iso', 'Jett', 'KAY/O', 'Killjoy', 'Neon', 'Omen', 'Phoenix', 'Raze',
  'Reyna', 'Sage', 'Skye', 'Sova', 'Viper', 'Vyse', 'Yoru'
];

// Valorant maps
const MAPS = [
  'Ascent', 'Bind', 'Breeze', 'Fracture', 'Haven', 'Icebox', 'Lotus',
  'Pearl', 'Split', 'Sunset', 'Abyss'
];

// Agent abilities (simplified)
const getAbilities = (agent: string) => {
  const abilities: Record<string, string[]> = {
    'Jett': ['Cloudburst', 'Updraft', 'Tailwind', 'Blade Storm'],
    'Reyna': ['Leer', 'Devour', 'Dismiss', 'Empress'],
    'Sova': ['Shock Bolt', 'Recon Bolt', 'Owl Drone', 'Hunter\'s Fury'],
    'Sage': ['Barrier Orb', 'Slow Orb', 'Healing Orb', 'Resurrection'],
    'Phoenix': ['Curveball', 'Hot Hands', 'Blaze', 'Run It Back'],
    'Raze': ['Blast Pack', 'Paint Shells', 'Boom Bot', 'Showstopper'],
    'Omen': ['Paranoia', 'Dark Cover', 'Shrouded Step', 'From the Shadows'],
    'Breach': ['Flashpoint', 'Fault Line', 'Aftershock', 'Rolling Thunder'],
    'Brimstone': ['Incendiary', 'Sky Smoke', 'Stim Beacon', 'Orbital Strike'],
    'Viper': ['Poison Cloud', 'Toxic Screen', 'Snake Bite', 'Viper\'s Pit'],
    'Cypher': ['Trapwire', 'Cyber Cage', 'Spycam', 'Neural Theft'],
    'Killjoy': ['Alarmbot', 'Turret', 'Nanoswarm', 'Lockdown'],
    'Skye': ['Trailblazer', 'Guiding Light', 'Regrowth', 'Seekers'],
    'Neon': ['Relay Bolt', 'High Gear', 'Fast Lane', 'Overdrive'],
    'Chamber': ['Trademark', 'Headhunter', 'Rendezvous', 'Tour De Force'],
    'Fade': ['Seize', 'Haunt', 'Prowler', 'Nightfall'],
    'Harbor': ['Cove', 'High Tide', 'Cascade', 'Reckoning'],
    'Gekko': ['Wingman', 'Dizzy', 'Mosh Pit', 'Thrash'],
    'Deadlock': ['Sonic Sensor', 'Barrier Mesh', 'GravNet', 'Annihilation'],
    'Iso': ['Undercut', 'Double Tap', 'Contingency', 'Kill Contract'],
    'Vyse': ['Shear', 'Arc Rose', 'Razorvine', 'Steel Garden'],
    'KAY/O': ['FLASH/drive', 'ZERO/point', 'FRAG/ment', 'NULL/cmd'],
    'Yoru': ['Blindside', 'Gatecrash', 'Fakeout', 'Dimensional Rift']
  };
  return abilities[agent] || ['Ability 1', 'Ability 2', 'Ability 3', 'Ultimate'];
};

export default function Upload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  const [formData, setFormData] = useState({
    agent: 'Jett',
    map: 'Ascent',
    ability: 'Tailwind',
    position_x: 0.5,
    position_y: 0.5,
    target_x: 0.5,
    target_y: 0.5,
    video_url: '',
    image_url: '',
    description: ''
  });

  // 检查登录
  useState(() => {
    if (!isLoggedIn()) {
      alert('请先登录');
      navigate('/login');
    }
  });

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      setStatus('❌ 请填写描述');
      return;
    }
    
    setLoading(true);
    setStatus('提交中...');
    
    try {
      const data = await api.createLineup(formData) as { success: boolean; message: string };
      
      if (data.success) {
        setStatus('✅ 提交成功！等待管理员审核');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setStatus(`❌ 提交失败: ${data.message}`);
      }
    } catch (err: any) {
      setStatus(`❌ 提交失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const abilities = getAbilities(formData.agent);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-red-500">📤 上传 Lineup</h1>
      
      <div className="bg-gray-800 rounded-lg p-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">角色 *</label>
            <select
              className="w-full bg-gray-700 rounded px-4 py-2"
              value={formData.agent}
              onChange={(e) => {
                const newAgent = e.target.value;
                setFormData({
                  ...formData,
                  agent: newAgent,
                  ability: getAbilities(newAgent)[0]
                });
              }}
            >
              {AGENTS.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-2">地图 *</label>
            <select
              className="w-full bg-gray-700 rounded px-4 py-2"
              value={formData.map}
              onChange={(e) => setFormData({...formData, map: e.target.value})}
            >
              {MAPS.map(map => (
                <option key={map} value={map}>{map}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-2">技能 *</label>
            <select
              className="w-full bg-gray-700 rounded px-4 py-2"
              value={formData.ability}
              onChange={(e) => setFormData({...formData, ability: e.target.value})}
            >
              {abilities.map(ability => (
                <option key={ability} value={ability}>{ability}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 视频链接 */}
        <div className="mb-4">
          <label className="block text-sm mb-2">视频链接（YouTube/B站）</label>
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=... 或 https://www.bilibili.com/video/..."
            className="w-full bg-gray-700 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={formData.video_url}
            onChange={(e) => setFormData({...formData, video_url: e.target.value})}
          />
        </div>

        {/* 图片链接 */}
        <div className="mb-4">
          <label className="block text-sm mb-2">地图截图链接</label>
          <input
            type="text"
            placeholder="图片URL（可选）"
            className="w-full bg-gray-700 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
          />
        </div>

        {/* 位置坐标（简化展示） */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs mb-1 text-gray-400">站 X</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
              value={formData.position_x}
              onChange={(e) => setFormData({...formData, position_x: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-400">站 Y</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
              value={formData.position_y}
              onChange={(e) => setFormData({...formData, position_y: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-400">目标 X</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
              value={formData.target_x}
              onChange={(e) => setFormData({...formData, target_x: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-400">目标 Y</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
              value={formData.target_y}
              onChange={(e) => setFormData({...formData, target_y: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>

        {/* 描述 */}
        <div className="mb-6">
          <label className="block text-sm mb-2">详细描述 *</label>
          <textarea
            rows={4}
            placeholder="描述这个lineup的具体操作方法、站位、瞄准点等..."
            className="w-full bg-gray-700 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 py-3 rounded font-semibold disabled:opacity-50 transition"
        >
          {loading ? '提交中...' : '提交 Lineup'}
        </button>

        {/* 状态 */}
        {status && (
          <div className="mt-4 p-3 bg-gray-700 rounded text-center">
            {status}
          </div>
        )}

        {/* 提示 */}
        <div className="mt-6 text-gray-400 text-sm">
          <p>💡 提示：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>上传的内容需要管理员审核后才会显示</li>
            <li>请尽量提供详细的操作描述</li>
            <li>视频链接支持YouTube和B站</li>
            <li>坐标范围: 0-1，表示地图相对位置</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
