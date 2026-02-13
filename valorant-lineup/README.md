# 🎯 Valorant Lineup 查询网站

这是一个查询Valorant游戏角色技能释放点位（lineup）的网站。

## 项目结构

```
valorant-lineup/
├── server/                 # 后端
│   ├── index.js           # Express服务器 + SQLite数据库
│   └── package.json
├── src/                   # 前端
│   ├── components/        # 组件
│   │   └── Navbar.tsx
│   ├── pages/             # 页面
│   │   ├── Home.tsx       # 首页（筛选列表）
│   │   ├── LineupDetail.tsx # 详情页
│   │   └── Search.tsx     # 搜索页
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── package.json
└── tailwind.config.js
```

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ..
npm install
```

### 2. 启动后端

```bash
cd server
npm start
```
后端运行在 http://localhost:3001

### 3. 启动前端

```bash
npm run dev
```
前端运行在 http://localhost:5173

## 功能

✅ 按角色/地图/技能筛选lineup
✅ 地图上显示释放点和目标点
✅ 视频演示嵌入
✅ 关键词搜索
✅ 用户贡献（提交lineup）

## API接口

- `GET /api/lineups` - 获取lineup列表（支持筛选参数）
- `GET /api/lineups/:id` - 获取单个lineup详情
- `POST /api/lineups` - 创建新lineup

## 技术栈

- 前端：React + TypeScript + Vite + TailwindCSS
- 后端：Node.js + Express + SQLite

## 新功能：用户登录

### 功能
- 用户注册和登录
- 登录后可访问视频下载功能
- 用户贡献的lineup会关联作者

### API
- POST /api/auth/register - 注册
- POST /api/auth/login - 登录

## 新功能：视频下载服务

### 功能
- 支持YouTube和B站视频下载
- 自动检测视频平台
- 保存视频到本地

### 使用方法
1. 安装 yt-dlp: `pip install yt-dlp`
2. 登录后访问 /download 页面
3. 输入视频链接，选择平台，开始下载

### API
POST /api/download
Body: { url: string, type: 'youtube' | 'bilibili' | 'auto' }

