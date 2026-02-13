import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const db = new Database('lineup.db');

app.use(cors());
app.use(express.json());

// 初始化数据库
db.exec(`
  CREATE TABLE IF NOT EXISTS lineups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    map TEXT NOT NULL,
    ability TEXT NOT NULL,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    target_x REAL NOT NULL,
    target_y REAL NOT NULL,
    video_url TEXT,
    video_path TEXT,
    description TEXT,
    author TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

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

// 种子数据
const seedData = [
  {
    agent: 'Jett',
    map: 'Ascent',
    ability: 'Tailwind',
    position_x: 0.3,
    position_y: 0.4,
    target_x: 0.7,
    target_y: 0.3,
    video_url: '',
    description: '从B点楼梯冲向A点平台的快速入场lineup',
    author: 'Admin',
    user_id: null
  }
];

const insert = db.prepare(`
  INSERT INTO lineups (agent, map, ability, position_x, position_y, target_x, target_y, video_url, description, author, user_id)
  VALUES (@agent, @map, @ability, @position_x, @position_y, @target_x, @target_y, @video_url, @description, @author, @user_id)
`);

const count = db.prepare('SELECT COUNT(*) as count FROM lineups').get();
if (count.count === 0) {
  seedData.forEach(data => {
    data.user_id = null;
    insert.run(data);
  });
  console.log('Seeded initial data');
}

// ============ 用户相关API ============

// 注册
app.post('/api/auth/register', (req, res) => {
  const { username, password, email } = req.body;
  const result = users.register(username, password, email);
  if (result.success) {
    res.json({ success: true, user: { id: result.id, username } });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

// 登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const result = users.login(username, password);
  if (result.success) {
    res.json({ success: true, user: result.user });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});

// ============ Lineup API ============

// 获取lineup列表
app.get('/api/lineups', (req, res) => {
  const { agent, map, ability, search, user_id } = req.query;
  let query = 'SELECT l.*, u.username as author_name FROM lineups l LEFT JOIN users u ON l.user_id = u.id WHERE 1=1';
  const params = [];
  
  if (agent) {
    query += ' AND l.agent LIKE ?';
    params.push(`%${agent}%`);
  }
  if (map) {
    query += ' AND l.map LIKE ?';
    params.push(`%${map}%`);
  }
  if (ability) {
    query += ' AND l.ability LIKE ?';
    params.push(`%${ability}%`);
  }
  if (search) {
    query += ' AND (l.description LIKE ? OR l.agent LIKE ? OR l.map LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (user_id) {
    query += ' AND l.user_id = ?';
    params.push(user_id);
  }
  
  query += ' ORDER BY l.created_at DESC';
  
  const lineups = db.prepare(query).all(...params);
  res.json(lineups);
});

// 获取单个lineup
app.get('/api/lineups/:id', (req, res) => {
  const lineup = db.prepare(`
    SELECT l.*, u.username as author_name FROM lineups l 
    LEFT JOIN users u ON l.user_id = u.id 
    WHERE l.id = ?
  `).get(req.params.id);
  
  if (lineup) {
    res.json(lineup);
  } else {
    res.status(404).json({ error: 'Lineup not found' });
  }
});

// 创建lineup
app.post('/api/lineups', (req, res) => {
  const { agent, map, ability, position_x, position_y, target_x, target_y, video_url, description, user_id } = req.body;
  
  const author = user_id ? db.prepare('SELECT username FROM users WHERE id = ?').get(user_id)?.username : 'Anonymous';
  
  const result = db.prepare(`
    INSERT INTO lineups (agent, map, ability, position_x, position_y, target_x, target_y, video_url, description, author, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(agent, map, ability, position_x, position_y, target_x, target_y, video_url || '', description || '', author, user_id || null);
  
  res.json({ id: result.lastInsertRowid, message: 'Lineup created successfully' });
});

// ============ 视频下载服务 ============

app.post('/api/download', async (req, res) => {
  const { url, type } = req.body;
  
  try {
    let command;
    const outputPath = `./public/videos/${Date.now()}`;
    
    if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      // YouTube下载
      command = `yt-dlp -f best -o "${outputPath}.%(ext)s" "${url}"`;
    } else if (type === 'bilibili' || url.includes('bilibili.com')) {
      // B站下载
      command = `yt-dlp -f best -o "${outputPath}.%(ext)s" "${url}"`;
    } else {
      return res.status(400).json({ error: '不支持的视频平台' });
    }
    
    const { stdout, stderr } = await execAsync(command);
    console.log('Download stdout:', stdout);
    console.log('Download stderr:', stderr);
    
    res.json({ 
      success: true, 
      message: '视频下载成功',
      path: outputPath 
    });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: '下载失败: ' + err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
