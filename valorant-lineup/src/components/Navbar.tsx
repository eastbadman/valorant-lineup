import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  // 每次路由变化时检查登录状态
  useEffect(() => {
    const checkLogin = () => {
      if (isLoggedIn()) {
        const userData = getUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    };
    
    checkLogin();
    
    // 监听storage变化（其他标签页登录/退出）
    window.addEventListener('storage', checkLogin);
    
    // 监听自定义登录事件
    window.addEventListener('userLogin', checkLogin);
    window.addEventListener('userLogout', checkLogin);
    
    return () => {
      window.removeEventListener('storage', checkLogin);
      window.removeEventListener('userLogin', checkLogin);
      window.removeEventListener('userLogout', checkLogin);
    };
  }, [location.pathname]); // 路由变化时重新检查

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    // 触发退出事件
    window.dispatchEvent(new Event('userLogout'));
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
              <Link to="/upload" className="hover:text-red-400 transition">📤 上传</Link>
              <Link to="/favorites" className="hover:text-red-400 transition">⭐ 收藏</Link>
              <Link to="/download" className="hover:text-red-400 transition">📹 下载</Link>
              {isAdmin && (
                <Link to="/admin" className="hover:text-red-400 transition">🔧 审核</Link>
              )}
              <span className="text-gray-500 mx-2">|</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-white font-medium">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-gray-300 hover:text-white transition"
              >
                退出
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-medium transition"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
