# Valorant Lineup 查询网站开发计划

## 目标
开发一个查询Valorant角色技能lineup的网站

## 技术栈
- 前端：React + TypeScript + Vite + TailwindCSS
- 后端：Node.js + Express + SQLite

## 功能需求
1. 首页：展示热门lineup，支持筛选（角色、地图、技能）
2. 详情页：展示lineup位置图示 + 视频演示 + 说明
3. 搜索：关键词搜索
4. 贡献：用户提交lineup

## 数据库设计
表：lineups
- id (PK)
- agent (角色)
- map (地图)
- ability (技能)
- position_x, position_y (释放点坐标)
- target_x, target_y (目标点坐标)
- video_url (视频链接)
- description (说明)
- author (作者)
- created_at

## API设计
GET /api/lineups - 获取lineup列表（支持筛选）
GET /api/lineups/:id - 获取单个lineup详情
POST /api/lineups - 创建lineup

## 页面结构
1. 首页 (/)
   - 筛选器（角色、地图、技能）
   - Lineup卡片列表
   
2. 详情页 (/lineup/:id)
   - 地图背景 + 释放点/目标点标记
   - 视频嵌入
   - 说明文字
   
3. 搜索页 (/search)
   - 搜索框
   - 搜索结果列表

## 验收标准
1. 能按角色/地图/技能筛选lineup
2. 能在地图上显示释放点和目标点
3. 能嵌入视频演示
4. 界面美观，用户体验良好
