import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { exec } from 'child_process';
import { promisify } from 'util';
import { users, generateToken, verifyToken } from './users.js';

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

// ============ JWT认证中间件 ============

// 可选认证（有token则验证，无token也通过）
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

// 必须认证
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }
  
  req.user = decoded;
  next();
}

// 管理员认证（简单实现，实际应该有角色字段）
function requireAdmin(req, res, next) {
  // 这里简化处理，可以后续添加role字段
  const adminUsernames = ['admin', 'eastbadman'];
  if (!req.user || !adminUsernames.includes(req.user.username)) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

// ============ 初始化数据库 ============

async function initDatabase() {
  try {
    // 先创建用户表
    await users.init();
    await new Promise(resolve => setTimeout(resolve, 500));

    // 创建 lineups 表（添加status字段用于审核）
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
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Lineups table initialized');

    // 创建收藏表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        lineup_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_favorite (user_id, lineup_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lineup_id) REFERENCES lineups(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Favorites table initialized');

    // 创建点赞表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        lineup_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (user_id, lineup_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lineup_id) REFERENCES lineups(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Likes table initialized');

    // 检查并添加status列（兼容旧数据）
    try {
      await pool.query(`ALTER TABLE lineups ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'`);
    } catch (err) {
      // 列已存在，忽略错误
    }

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
        user_id: null,
        status: 'approved'
      },
      {
        agent: 'Sova',
        map: 'Haven',
        ability: 'Recon Bolt',
        position_x: 0.25,
        position_y: 0.35,
        target_x: 0.8,
        target_y: 0.6,
        video_url: '',
        description: 'A点长廊侦查箭，可以看A点和A长的敌人',
        author: 'Admin',
        user_id: null,
        status: 'approved'
      },
      {
        agent: 'Sage',
        map: 'Bind',
        ability: 'Barrier Orb',
        position_x: 0.5,
        position_y: 0.5,
        target_x: 0.5,
        target_y: 0.5,
        video_url: '',
        description: 'B点传送门防守墙，阻止敌人快速推进',
        author: 'Admin',
        user_id: null,
        status: 'approved'
      }
    ];

    for (const data of seedData) {
      await pool.query(`
        INSERT INTO lineups (agent, map, ability, position_x, position_y, target_x, target_y, video_url, description, author, user_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [data.agent, data.map, data.ability, data.position_x, data.position_y, data.target_x, data.target_y, data.video_url, data.description, data.author, data.user_id, data.status]);
    }

    console.log('✅ Initial data seeded');
  } catch (err) {
    console.error('❌ Error seeding data:', err.message);
  }
}

// ============ 用户认证API ============

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
    // 注册成功后自动生成token
    const token = generateToken({ id: result.id, username: result.username });
    res.json({ success: true, user: { id: result.id, username: result.username }, token });
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
    res.json({ success: true, user: result.user, token: result.token });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await users.getById(req.user.id);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: '用户不存在' });
  }
});

// ============ Lineup API ============

// 获取lineup列表
app.get('/api/lineups', optionalAuth, async (req, res) => {
  const { agent, map, ability, search, user_id, status } = req.query;
  let query = `
    SELECT l.*, u.username as author_name,
      (SELECT COUNT(*) FROM likes WHERE lineup_id = l.id) as like_count,
      (SELECT COUNT(*) FROM favorites WHERE lineup_id = l.id) as favorite_count
    FROM lineups l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  // 默认只显示已审核通过的lineup
  if (!status) {
    query += " AND l.status = 'approved'";
  } else if (status !== 'all') {
    query += ' AND l.status = ?';
    params.push(status);
  }

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
    
    // 如果用户已登录，标记是否已收藏/点赞
    if (req.user) {
      for (const lineup of lineups) {
        const [favRows] = await pool.query(
          'SELECT 1 FROM favorites WHERE user_id = ? AND lineup_id = ?',
          [req.user.id, lineup.id]
        );
        lineup.is_favorited = favRows.length > 0;

        const [likeRows] = await pool.query(
          'SELECT 1 FROM likes WHERE user_id = ? AND lineup_id = ?',
          [req.user.id, lineup.id]
        );
        lineup.is_liked = likeRows.length > 0;
      }
    }

    res.json(lineups);
  } catch (err) {
    console.error('Error fetching lineups:', err);
    res.status(500).json({ error: '获取lineup列表失败' });
  }
});

// 获取单个lineup
app.get('/api/lineups/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, u.username as author_name,
        (SELECT COUNT(*) FROM likes WHERE lineup_id = l.id) as like_count,
        (SELECT COUNT(*) FROM favorites WHERE lineup_id = l.id) as favorite_count
      FROM lineups l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `, [req.params.id]);

    const lineup = rows[0];
    if (!lineup) {
      return res.status(404).json({ error: 'Lineup not found' });
    }

    // 如果用户已登录，标记是否已收藏/点赞
    if (req.user) {
      const [favRows] = await pool.query(
        'SELECT 1 FROM favorites WHERE user_id = ? AND lineup_id = ?',
        [req.user.id, lineup.id]
      );
      lineup.is_favorited = favRows.length > 0;

      const [likeRows] = await pool.query(
        'SELECT 1 FROM likes WHERE user_id = ? AND lineup_id = ?',
        [req.user.id, lineup.id]
      );
      lineup.is_liked = likeRows.length > 0;
    }

    res.json(lineup);
  } catch (err) {
    console.error('Error fetching lineup:', err);
    res.status(500).json({ error: '获取lineup失败' });
  }
});

// 创建lineup（需要登录，默认pending状态需要审核）
app.post('/api/lineups', requireAuth, async (req, res) => {
  const { agent, map, ability, position_x, position_y, target_x, target_y, video_url, description } = req.body;

  if (!agent || !map || !ability) {
    return res.status(400).json({ error: '角色、地图和技能不能为空' });
  }

  try {
    const user = await users.getById(req.user.id);
    const author = user ? user.username : 'Anonymous';

    const [result] = await pool.query(`
      INSERT INTO lineups (agent, map, ability, position_x, position_y, target_x, target_y, video_url, description, author, user_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [agent, map, ability, position_x || 0.5, position_y || 0.5, target_x || 0.5, target_y || 0.5, video_url || '', description || '', author, req.user.id]);

    res.json({
      id: result.insertId,
      message: 'Lineup已提交，等待审核',
      author,
      status: 'pending'
    });
  } catch (err) {
    console.error('Error creating lineup:', err);
    res.status(500).json({ error: '创建lineup失败' });
  }
});

// ============ 收藏功能API ============

// 获取用户收藏列表
app.get('/api/favorites', requireAuth, async (req, res) => {
  try {
    const [favorites] = await pool.query(`
      SELECT l.*, u.username as author_name,
        (SELECT COUNT(*) FROM likes WHERE lineup_id = l.id) as like_count
      FROM favorites f
      JOIN lineups l ON f.lineup_id = l.id
      LEFT JOIN users u ON l.user_id = u.id
      WHERE f.user_id = ? AND l.status = 'approved'
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    // 标记为已收藏
    for (const fav of favorites) {
      fav.is_favorited = true;
      fav.is_liked = false;
      const [likeRows] = await pool.query(
        'SELECT 1 FROM likes WHERE user_id = ? AND lineup_id = ?',
        [req.user.id, fav.id]
      );
      fav.is_liked = likeRows.length > 0;
    }

    res.json(favorites);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: '获取收藏列表失败' });
  }
});

// 添加收藏
app.post('/api/favorites/:lineupId', requireAuth, async (req, res) => {
  const { lineupId } = req.params;

  try {
    await pool.query(
      'INSERT IGNORE INTO favorites (user_id, lineup_id) VALUES (?, ?)',
      [req.user.id, lineupId]
    );
    res.json({ success: true, message: '收藏成功' });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: '收藏失败' });
  }
});

// 取消收藏
app.delete('/api/favorites/:lineupId', requireAuth, async (req, res) => {
  const { lineupId } = req.params;

  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND lineup_id = ?',
      [req.user.id, lineupId]
    );
    res.json({ success: true, message: '取消收藏成功' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: '取消收藏失败' });
  }
});

// ============ 点赞功能API ============

// 点赞
app.post('/api/likes/:lineupId', requireAuth, async (req, res) => {
  const { lineupId } = req.params;

  try {
    await pool.query(
      'INSERT IGNORE INTO likes (user_id, lineup_id) VALUES (?, ?)',
      [req.user.id, lineupId]
    );
    res.json({ success: true, message: '点赞成功' });
  } catch (err) {
    console.error('Error adding like:', err);
    res.status(500).json({ error: '点赞失败' });
  }
});

// 取消点赞
app.delete('/api/likes/:lineupId', requireAuth, async (req, res) => {
  const { lineupId } = req.params;

  try {
    await pool.query(
      'DELETE FROM likes WHERE user_id = ? AND lineup_id = ?',
      [req.user.id, lineupId]
    );
    res.json({ success: true, message: '取消点赞成功' });
  } catch (err) {
    console.error('Error removing like:', err);
    res.status(500).json({ error: '取消点赞失败' });
  }
});

// ============ 审核功能API（管理员） ============

// 获取待审核列表
app.get('/api/admin/pending', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [pending] = await pool.query(`
      SELECT l.*, u.username as author_name
      FROM lineups l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.status = 'pending'
      ORDER BY l.created_at ASC
    `);
    res.json(pending);
  } catch (err) {
    console.error('Error fetching pending lineups:', err);
    res.status(500).json({ error: '获取待审核列表失败' });
  }
});

// 审核通过
app.put('/api/admin/approve/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query(
      "UPDATE lineups SET status = 'approved' WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: '已审核通过' });
  } catch (err) {
    console.error('Error approving lineup:', err);
    res.status(500).json({ error: '审核失败' });
  }
});

// 审核拒绝
app.put('/api/admin/reject/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query(
      "UPDATE lineups SET status = 'rejected' WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: '已拒绝' });
  } catch (err) {
    console.error('Error rejecting lineup:', err);
    res.status(500).json({ error: '操作失败' });
  }
});

// ============ 视频下载服务 ============

app.post('/api/download', requireAuth, async (req, res) => {
  const { url, type } = req.body;

  if (!url) {
    return res.status(400).json({ error: '视频URL不能为空' });
  }

  try {
    let command;
    const outputPath = `./public/videos/${Date.now()}`;

    if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      command = `yt-dlp -f best -o "${outputPath}.%(ext)s" "${url}"`;
    } else if (type === 'bilibili' || url.includes('bilibili.com')) {
      command = `yt-dlp -f best -o "${outputPath}.%(ext)s" "${url}"`;
    } else {
      return res.status(400).json({ error: '不支持的视频平台' });
    }

    const { stdout, stderr } = await execAsync(command);
    console.log('Download stdout:', stdout);

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

// ============ 统计API ============

// 获取统计数据
app.get('/api/stats', async (req, res) => {
  try {
    const [lineupCount] = await pool.query('SELECT COUNT(*) as count FROM lineups WHERE status = "approved"');
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [agentCounts] = await pool.query(`
      SELECT agent, COUNT(*) as count 
      FROM lineups 
      WHERE status = 'approved'
      GROUP BY agent 
      ORDER BY count DESC 
      LIMIT 5
    `);
    const [mapCounts] = await pool.query(`
      SELECT map, COUNT(*) as count 
      FROM lineups 
      WHERE status = 'approved'
      GROUP BY map 
      ORDER BY count DESC 
      LIMIT 5
    `);

    res.json({
      lineupCount: lineupCount[0].count,
      userCount: userCount[0].count,
      topAgents: agentCounts,
      topMaps: mapCounts
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// ============ 启动服务器 ============

const PORT = process.env.PORT || 3001;

async function startServer() {
  await initDatabase();
  await seedData();

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 MySQL connected to 47.118.30.248:13306`);
    console.log(`🔐 JWT authentication enabled`);
  });
}

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
