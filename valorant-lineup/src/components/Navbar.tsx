import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getUser, clearAuth, isLoggedIn } from '../api';

interface User {
  id: number;
  username: string;
  avatar?: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      setUser(getUser());
    }
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate('/');
  };

  // 判断是否是管理员
  const isAdmin = user && ['admin', 'eastbadman'].includes(user.username);

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-red-500">
          🎯 Valorant Lineup
        </Link>
        
        <div className="flex gap-4 items-center">
          <Link to="/" className="hover:text-red-400 transition">首页</Link>
          <Link to="/search" className="hover:text-red-400 transition">搜索</Link>
          
          {user ? (
            <>
              <Link to="/favorites" className="hover:text-red-400 transition">⭐ 收藏</Link>
              <Link to="/download" className="hover:text-red-400 transition">📹 下载</Link>
              {isAdmin && (
                <Link to="/admin" className="hover:text-red-400 transition">🔧 审核</Link>
              )}
              <span className="text-gray-400">|</span>
              <span className="text-red-400">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white text-sm"
              >
                退出
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-red-400 transition">登录</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
