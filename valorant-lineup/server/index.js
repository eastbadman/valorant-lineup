import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { exec } from 'child_process';
import { promisify } from 'util';
import { users } from './users.js';

const execAsync = promisify(exec);
const app = express();

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

app.use(cors());
app.use(express.json());

// 初始化数据库
async function initDatabase() {
  try {
    // 先创建用户表（因为 lineups 表引用它）
    await users.init();

    // 稍等一下确保 users 表创建完成
    await new Promise(resolve => setTimeout(resolve, 500));

    // 创建 lineups 表（不使用外键约束，避免创建顺序问题）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lineups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent VARCHAR(50) NOT NULL,
        map VARCHAR(50) NOT NULL,
        ability VARCHAR(50) NOT NULL,
        position_x DECIMAL(5,2) NOT NULL,
        position_y DECIMAL(5,2) NOT NULL,
        target_x DECIMAL(5,2) NOT NULL,
        target_y DECIMAL(5,2) NOT NULL,
        video_url TEXT,
        video_path TEXT,
        description TEXT,
        author VARCHAR(50),
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Lineups table initialized');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  }
}

// 种子数据
async function seedData() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM lineups');
    if (rows[0].count > 0) {
      console.log('⏭️  Data already seeded');
      return;
    }

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

    for (const data of seedData) {
      await pool.query(`
        INSERT INTO lineups (agent, map, ability, position_x, position_y, target_x, target_y, video_url, description, author, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [data.agent, data.map, data.ability, data.position_x, data.position_y, data.target_x, data.target_y, data.video_url, data.description, data.author, data.user_id]);
    }

    console.log('✅ Initial data seeded');
  } catch (err) {
    console.error('❌ Error seeding data:', err.message);
  }
}

// ============ 用户相关API ============

// 注册
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ success: false, error: '用户名长度需在3-20位之间' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: '密码长度不能少于6位' });
  }

  const result = await users.register(username, password, email);
  if (result.success) {
    res.json({ success: true, user: { id: result.id, username } });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
  }

  const result = await users.login(username, password);
  if (result.success) {
    res.json({ success: true, user: result.user });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});

// ============ Lineup API ============

// 获取lineup列表
app.get('/api/lineups', async (req, res) => {
  const { agent, map, ability, search, user_id } = req.query;
  let query = `
    SELECT l.*, u.username as author_name
    FROM lineups l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
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

  try {
    const [lineups] = await pool.query(query, params);
    res.json(lineups);
  } catch (err) {
    console.error('Error fetching lineups:', err);
    res.status(500).json({ error: '获取lineup列表失败' });
  }
});

// 获取单个lineup
app.get('/api/lineups/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, u.username as author_name
      FROM lineups l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `, [req.params.id]);

    const lineup = rows[0];
    if (lineup) {
      res.json(lineup);
    } else {
      res.status(404).json({ error: 'Lineup not found' });
    }
  } catch (err) {
    console.error('Error fetching lineup:', err);
    res.status(500).json({ error: '获取lineup失败' });
  }
});

// 创建lineup
app.post('/api/lineups', async (req, res) => {
  const { agent, map, ability, position_x, position_y, target_x, target_y, video_url, description, user_id } = req.body;

  if (!agent || !map || !ability) {
    return res.status(400).json({ error: '角色、地图和技能不能为空' });
  }

  try {
    // 获取用户名
    let author = 'Anonymous';
    if (user_id) {
      const user = await users.getById(user_id);
      if (user) {
        author = user.username;
      }
    }

    const [result] = await pool.query(`
      INSERT INTO lineups (agent, map, ability, position_x, position_y, target_x, target_y, video_url, description, author, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [agent, map, ability, position_x, position_y, target_x, target_y, video_url || '', description || '', author, user_id || null]);

    res.json({
      id: result.insertId,
      message: 'Lineup created successfully',
      author
    });
  } catch (err) {
    console.error('Error creating lineup:', err);
    res.status(500).json({ error: '创建lineup失败' });
  }
});

// ============ 视频下载服务 ============

app.post('/api/download', async (req, res) => {
  const { url, type } = req.body;

  if (!url) {
    return res.status(400).json({ error: '视频URL不能为空' });
  }

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

// 启动服务器
const PORT = process.env.PORT || 3001;

async function startServer() {
  await initDatabase();
  await seedData();

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 MySQL connected to 47.118.30.248:13306`);
  });
}

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
