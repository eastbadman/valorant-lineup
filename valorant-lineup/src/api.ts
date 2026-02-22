// API工具函数

const API_BASE = '/api';

// 获取存储的token
export function getToken(): string | null {
  return localStorage.getItem('token');
}

// 获取存储的用户信息
export function getUser(): any {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// 保存认证信息
export function setAuth(user: any, token: string) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
}

// 清除认证信息
export function clearAuth() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  return !!getToken();
}

// 通用请求函数
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }
  
  return data;
}

// API方法
export const api = {
  // 认证
  login: (username: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  
  register: (username: string, password: string, email?: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    }),
  
  getMe: () => request('/auth/me'),
  
  // Lineup
  getLineups: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/lineups${query}`);
  },
  
  getLineup: (id: number) => request(`/lineups/${id}`),
  
  createLineup: (data: any) =>
    request('/lineups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // 收藏
  getFavorites: () => request('/favorites'),
  
  addFavorite: (lineupId: number) =>
    request(`/favorites/${lineupId}`, { method: 'POST' }),
  
  removeFavorite: (lineupId: number) =>
    request(`/favorites/${lineupId}`, { method: 'DELETE' }),
  
  // 点赞
  addLike: (lineupId: number) =>
    request(`/likes/${lineupId}`, { method: 'POST' }),
  
  removeLike: (lineupId: number) =>
    request(`/likes/${lineupId}`, { method: 'DELETE' }),
  
  // 管理员
  getPending: () => request('/admin/pending'),
  
  approveLineup: (id: number) =>
    request(`/admin/approve/${id}`, { method: 'PUT' }),
  
  rejectLineup: (id: number) =>
    request(`/admin/reject/${id}`, { method: 'PUT' }),
  
  // 统计
  getStats: () => request('/stats'),
  
  // 视频下载
  downloadVideo: (url: string, type: string) =>
    request('/download', {
      method: 'POST',
      body: JSON.stringify({ url, type }),
    }),
  
  // AI视频总结
  aiSummarize: (url: string) =>
    request('/ai-summarize', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
};
