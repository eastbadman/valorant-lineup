import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const res = await fetch(`http://localhost:3001${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await res.json();
    
    if (data.success) {
      // 保存用户信息到localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isRegister ? '注册账号' : '登录'}
        </h1>
        
        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">用户名</label>
            <input
              type="text"
              className="w-full bg-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">密码</label>
            <input
              type="password"
              className="w-full bg-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          
          {isRegister && (
            <div>
              <label className="block text-sm mb-1">邮箱（可选）</label>
              <input
                type="email"
                className="w-full bg-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 py-2 rounded font-semibold transition"
          >
            {isRegister ? '注册' : '登录'}
          </button>
        </form>
        
        <p className="text-center mt-4 text-gray-400">
          {isRegister ? '已有账号？' : '没有账号？'}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-red-400 hover:text-red-300 ml-1"
          >
            {isRegister ? '去登录' : '去注册'}
          </button>
        </p>
      </div>
    </div>
  );
}
