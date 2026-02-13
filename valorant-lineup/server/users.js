import Database from 'better-sqlite3';

const db = new Database('lineup.db');

// 用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const users = {
  // 注册
  register: (username, password, email) => {
    const stmt = db.prepare(`
      INSERT INTO users (username, password, email)
      VALUES (?, ?, ?)
    `);
    try {
      const result = stmt.run(username, password, email || null);
      return { success: true, id: result.lastInsertRowid, username };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  
  // 登录
  login: (username, password) => {
    const stmt = db.prepare(`
      SELECT id, username, avatar FROM users
      WHERE username = ? AND password = ?
    `);
    const user = stmt.get(username, password);
    if (user) {
      return { success: true, user };
    }
    return { success: false, error: '用户名或密码错误' };
  },
  
  // 获取用户信息
  getById: (id) => {
    const stmt = db.prepare(`
      SELECT id, username, avatar, created_at FROM users WHERE id = ?
    `);
    return stmt.get(id);
  }
};
