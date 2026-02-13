import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// MySQL 连接配置
const pool = mysql.createPool({
  host: '47.118.30.248',
  port: 13306,
  user: 'root',
  password: 'd6eyRL22rn3kL3La',
  database: 'valorant_lineup',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 用户表
export const users = {
  // 初始化表
  init: async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100) UNIQUE,
          avatar VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✅ Users table initialized');
    } catch (err) {
      console.error('❌ Error initializing users table:', err.message);
    }
  },

  // 注册
  register: async (username, password, email) => {
    try {
      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await pool.query(`
        INSERT INTO users (username, password, email)
        VALUES (?, ?, ?)
      `, [username, hashedPassword, email || null]);

      return { success: true, id: result.insertId, username };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return { success: false, error: '用户名或邮箱已存在' };
      }
      return { success: false, error: err.message };
    }
  },

  // 登录
  login: async (username, password) => {
    try {
      const [rows] = await pool.query(`
        SELECT id, username, avatar, password FROM users
        WHERE username = ?
      `, [username]);

      const user = rows[0];
      if (!user) {
        return { success: false, error: '用户名或密码错误' };
      }

      // 验证密码
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return { success: false, error: '用户名或密码错误' };
      }

      // 返回用户信息（不包含密码）
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // 获取用户信息
  getById: async (id) => {
    try {
      const [rows] = await pool.query(`
        SELECT id, username, avatar, email, created_at FROM users WHERE id = ?
      `, [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('Error getting user:', err);
      return null;
    }
  }
};
