# Valorant Lineup 查询网站 - 技术架构文档

## 项目概述

### 目标
开发一个查询Valorant游戏角色技能释放点位（lineup）的网站，帮助玩家在对局前快速了解技能释放位置。

### 核心价值
- 解决lineup信息零散的问题
- 提供可视化的技能释放点查询
- 支持视频/GIF演示
- 用户可贡献和分享

---

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (React)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Home    │  │  Detail  │  │  Search  │  │  Login   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│       │              │              │             │          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Router (路由管理)                  │   │
│  │              TailwindCSS (样式)                       │   │
│  │              Axios (HTTP请求)                         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 (Express)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  认证模块   │  │ Lineup模块 │  │   视频下载模块      │  │
│  │ /auth/*     │  │ /api/*      │  │   /download         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express Server                           │   │
│  │              SQLite Database                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈详情

| 层级 | 技术选型 | 版本要求 | 说明 |
|------|---------|---------|------|
| 前端框架 | React | 18.x | UI组件库 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 构建工具 | Vite | 5.x | 快速构建 |
| 样式 | TailwindCSS | 3.x | 原子化CSS |
| 路由 | React Router | 6.x | SPA路由 |
| 后端框架 | Express | 4.x | Node.js Web框架 |
| 数据库 | SQLite | - | 轻量级文件数据库 |
| ORM | better-sqlite3 | 9.x | 同步SQLite操作 |
| 视频下载 | yt-dlp | 最新 | 通用视频下载工具 |

---

## 功能模块

### 1. 用户认证模块

#### 功能清单
- [x] 用户注册
- [x] 用户登录
- [x] 会话管理（localStorage）
- [x] 退出登录

#### 权限控制
- 公开页面：首页、搜索页、详情页、登录页
- 受保护页面：视频下载页（需登录）

### 2. Lineup查询模块

#### 功能清单
- [x] 按角色筛选（Jett, Sage, Sova等）
- [x] 按地图筛选（Ascent, Haven, Bind等）
- [x] 按技能筛选
- [x] 关键词搜索
- [x] 热门lineup展示
- [x] Lineup详情展示
- [x] 地图可视化（释放点 + 目标点）

### 3. 数据贡献模块

#### 功能清单
- [x] 创建lineup（基础版）
- [ ] 用户提交审核
- [ ] 贡献排行榜
- [ ] 收藏/喜欢功能

### 4. 视频资源模块

#### 功能清单
- [x] 视频链接嵌入（YouTube/B站）
- [x] 视频下载服务
- [ ] 本地视频托管
- [x] GIF动态预览

---

## 数据库设计

### users 表
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,      -- 用户名
  password TEXT NOT NULL,             -- 密码（明文，后续应加密）
  email TEXT UNIQUE,                  -- 邮箱
  avatar TEXT,                        -- 头像URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### lineups 表
```sql
CREATE TABLE lineups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent TEXT NOT NULL,                -- 角色名（Jett, Sage...）
  map TEXT NOT NULL,                  -- 地图名（Ascent, Haven...）
  ability TEXT NOT NULL,              -- 技能名
  position_x REAL NOT NULL,           -- 释放点X坐标（0-1）
  position_y REAL NOT NULL,           -- 释放点Y坐标（0-1）
  target_x REAL NOT NULL,            -- 目标点X坐标（0-1）
  target_y REAL NOT NULL,            -- 目标点Y坐标（0-1）
  video_url TEXT,                     -- 视频链接
  video_path TEXT,                    -- 本地视频路径
  description TEXT,                   -- 说明文字
  author TEXT,                        -- 作者名
  user_id INTEGER,                    -- 用户ID（可为空）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 索引优化
```sql
-- 常用查询字段添加索引
CREATE INDEX idx_lineups_agent ON lineups(agent);
CREATE INDEX idx_lineups_map ON lineups(map);
CREATE INDEX idx_lineups_ability ON lineups(ability);
CREATE INDEX idx_lineups_user ON lineups(user_id);
```

---

## API接口文档

### 认证模块

#### 注册用户
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "username": "string",
  "password": "string",
  "email": "string (optional)"
}

Response (200):
{
  "success": true,
  "user": {
    "id": 1,
    "username": "test"
  }
}

Response (400):
{
  "success": false,
  "error": "Username already exists"
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "username": "string",
  "password": "string"
}

Response (200):
{
  "success": true,
  "user": {
    "id": 1,
    "username": "test",
    "avatar": "url"
  }
}

Response (401):
{
  "success": false,
  "error": "用户名或密码错误"
}
```

### Lineup模块

#### 获取Lineup列表
```
GET /api/lineups
Query Parameters:
  - agent: string (可选，角色名)
  - map: string (可选，地图名)
  - ability: string (可选，技能名)
  - search: string (可选，搜索关键词)
  - user_id: number (可选，特定用户的lineup)

Response (200):
[
  {
    "id": 1,
    "agent": "Jett",
    "map": "Ascent",
    "ability": "Tailwind",
    "position_x": 0.3,
    "position_y": 0.4,
    "target_x": 0.7,
    "target_y": 0.3,
    "video_url": "",
    "description": "从B点楼梯冲向A点...",
    "author": "Admin",
    "author_name": "Admin",
    "created_at": "2026-02-04T00:00:00.000Z"
  }
]
```

#### 获取单个Lineup详情
```
GET /api/lineups/:id

Response (200):
{
  "id": 1,
  "agent": "Jett",
  "map": "Ascent",
  "ability": "Tailwind",
  "position_x": 0.3,
  "position_y": 0.4,
  "target_x": 0.7,
  "target_y": 0.3,
  "video_url": "https://youtube.com/...",
  "video_path": "",
  "description": "从B点楼梯冲向A点...",
  "author": "Admin",
  "author_name": "Admin",
  "created_at": "2026-02-04T00:00:00.000Z"
}

Response (404):
{
  "error": "Lineup not found"
}
```

#### 创建Lineup
```
POST /api/lineups
Content-Type: application/json

Request:
{
  "agent": "Jett",
  "map": "Ascent",
  "ability": "Tailwind",
  "position_x": 0.3,
  "position_y": 0.4,
  "target_x": 0.7,
  "target_y": 0.3,
  "video_url": "https://...",
  "description": "lineup说明",
  "user_id": 1 (optional)
}

Response (200):
{
  "id": 2,
  "message": "Lineup created successfully"
}
```

### 视频下载模块

#### 下载视频
```
POST /api/download
Content-Type: application/json

Request:
{
  "url": "https://youtube.com/watch?v=...",
  "type": "youtube" | "bilibili" | "auto"
}

Response (200):
{
  "success": true,
  "message": "视频下载成功",
  "path": "./public/videos/1707038400000.mp4"
}

Response (400):
{
  "error": "不支持的视频平台"
}

Response (500):
{
  "error": "下载失败: yt-dlp command failed"
}
```

---

## 目录结构

```
valorant-lineup/
├── server/                          # 后端服务
│   ├── index.js                     # 主入口（Express + API）
│   ├── users.js                     # 用户认证模块
│   ├── package.json                 # 后端依赖
│   └── public/                      # 静态资源
│       └── videos/                  # 下载的视频文件
│
├── src/                             # 前端源码
│   ├── components/                  # React组件
│   │   └── Navbar.tsx              # 导航栏
│   │
│   ├── pages/                       # 页面组件
│   │   ├── Home.tsx                # 首页（筛选列表）
│   │   ├── LineupDetail.tsx        # 详情页
│   │   ├── Search.tsx              # 搜索页
│   │   ├── Login.tsx               # 登录/注册页
│   │   └── VideoDownload.tsx       # 视频下载页
│   │
│   ├── App.tsx                      # 应用入口 + 路由
│   ├── main.tsx                     # React DOM渲染
│   └── index.css                    # 全局样式（Tailwind）
│
├── index.html                       # HTML模板
├── vite.config.ts                   # Vite配置
├── tsconfig.json                    # TypeScript配置
├── tailwind.config.js               # TailwindCSS配置
├── postcss.config.js                # PostCSS配置
├── package.json                     # 前端依赖
├── README.md                        # 项目说明
└── ARCHITECTURE.md                  # 本架构文档
```

---

## 部署方案

### 开发环境
```bash
# 1. 安装依赖
cd server && npm install
cd .. && npm install

# 2. 安装yt-dlp（视频下载需要）
pip install yt-dlp

# 3. 启动后端
cd server && npm start

# 4. 启动前端（新终端）
npm run dev
```

### 生产环境

#### 前端部署（Vercel）
```bash
# 构建
npm run build

# 部署到Vercel
vercel deploy
```

#### 后端部署（Railway/Render）
```bash
# Railway部署
railway up

# 需要配置环境变量
PORT=3001
```

#### 数据库
- SQLite文件数据库，部署时自动创建
- 生产环境建议迁移到PostgreSQL

---

## 后续迭代计划

### Phase 1: 核心功能完善
- [ ] 密码加密存储（bcrypt）
- [ ] JWT Token认证
- [ ] Lineup提交审核流程
- [ ] Lineup收藏/喜欢功能

### Phase 2: 用户体验优化
- [ ] 地图图片背景（支持所有Valorant地图）
- [ ] GIF动态预览
- [ ] 视频缩略图生成
- [ ] 移动端适配
- [ ] 加载动画优化

### Phase 3: 社交功能
- [ ] 用户个人主页
- [ ] 贡献排行榜
- [ ] 评论/讨论功能
- [ ] 分享功能（生成链接）

### Phase 4: 数据智能化
- [ ] AI自动识别Lineup（从视频）
- [ ] 推荐系统（根据玩家常用角色推荐）
- [ ] 数据分析统计

### Phase 5: 商业化
- [ ] 用户付费订阅
- [ ] 高级功能（自定义标签、批量导入）
- [ ] 广告接入

---

## 开发规范

### 代码风格
- 使用Prettier格式化代码
- TypeScript严格模式
- 函数式组件 + Hooks

### Git工作流
```
main (生产) ← merge
  ↑
develop (开发) ← merge
  ↑
feature/* (功能分支)
```

### 测试要求
- 单元测试覆盖率 > 70%
- 集成测试覆盖核心流程

---

## 更新日志

### v1.0.0 (2026-02-04)
- ✅ MVP版本发布
- ✅ 用户认证
- ✅ Lineup查询
- ✅ 视频下载
- ✅ 响应式设计

---

## 常见问题

Q: 视频下载失败？
A: 检查yt-dlp是否安装，检查网络连接

Q: 如何添加新的角色/地图？
A: 在前端筛选器中添加选项，数据库会自动支持

Q: 如何迁移到生产数据库？
A: 使用sqlite3导出SQL，再导入到PostgreSQL

---

## 贡献指南

1. Fork本项目
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送到分支: `git push origin feature/new-feature`
5. 创建Pull Request

---

**文档版本**: v1.0.0
**最后更新**: 2026-02-04
**维护者**: Earth (AI Assistant)
