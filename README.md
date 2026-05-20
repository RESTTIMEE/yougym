# 优健 (YouGym)

> 个性化科学健身训练指导小程序

## 项目简介

优健是一款微信小程序，为用户提供增肌、减脂、体态矫正三大板块的专业健身训练指导。支持训练计划智能推荐、训练数据可视化、饮食营养建议、训练打卡提醒与成就激励系统。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | 微信小程序 + TypeScript + TDesign |
| 后端 | NestJS (Node.js) |
| 数据库 | MySQL 9.7 + Redis 7.0 |
| ORM | Prisma |
| AI | DeepSeek / 通义千问 API |
| 存储 | 阿里云OSS + CDN |

## 项目结构

```
YouGym/
├── miniprogram/        # 微信小程序前端
│   ├── pages/          # 页面 (12个)
│   ├── components/     # 公共组件 (7个)
│   ├── services/       # API服务层
│   ├── store/          # 状态管理
│   ├── utils/          # 工具函数
│   └── styles/         # 全局样式
├── server/             # 后端服务
│   ├── src/
│   │   ├── config/     # 配置
│   │   ├── common/     # 通用模块
│   │   └── modules/    # 业务模块 (7个)
│   └── prisma/         # 数据库Schema
├── docs/               # 文档
└── scripts/            # 脚本
```

## 快速开始

### 环境要求
- Node.js >= 18
- MySQL >= 8.0
- Redis >= 7.0
- 微信开发者工具

### 后端启动
```bash
cd server
cp .env.example .env  # 编辑配置
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### 小程序启动
```bash
cd miniprogram
npm install
# 使用微信开发者工具打开 miniprogram 目录
```

## 生产部署

### Docker Compose（推荐）

项目根目录包含 `docker-compose.yml`，一键启动全部服务：

```bash
# 1. 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env，填入生产环境密钥

# 2. 构建并启动
docker-compose up -d

# 3. 运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 4. 验证健康检查
curl http://localhost:3000/api/v1/health
```

服务包含：
- `app` — NestJS 后端（端口 3000）
- `mysql` — MySQL 9.0 数据库
- `redis` — Redis 7 缓存

### 环境变量

| 变量 | 说明 | 生产环境要求 |
|------|------|-------------|
| `WECHAT_APPID` | 微信小程序 AppID | 正式 AppID（非测试号） |
| `WECHAT_SECRET` | 微信小程序密钥 | 安全保管，不可泄露 |
| `DATABASE_URL` | MySQL 连接串 | 强密码，建议 SSL |
| `REDIS_PASSWORD` | Redis 密码 | 生产必须设置 |
| `JWT_SECRET` | JWT 签名密钥 | 随机 64 字符 |
| `JWT_REFRESH_SECRET` | Refresh Token 密钥 | 随机 64 字符，不与 JWT_SECRET 相同 |
| `AI_API_KEY` | AI 服务密钥 | DeepSeek / 通义千问 |
| `ALLOWED_ORIGINS` | CORS 允许域名 | 生产小程序域名 |

### 数据库迁移

```bash
# 生产环境（不交互，仅应用迁移）
npx prisma migrate deploy

# 开发环境（交互式，自动生成迁移文件）
npx prisma migrate dev
```

### HTTPS / 域名配置

微信小程序要求 API 域名必须为 HTTPS。推荐方案：

- **nginx 反向代理** — 在服务器前部署 nginx，配置 SSL 证书（Let's Encrypt 或云服务商证书），反向代理到 `localhost:3000`
- **云服务** — 使用云服务商的 API 网关/CDN 提供 HTTPS 终端

### 小程序域名配置

部署后更新 `miniprogram/utils/constants.ts` 中的域名：

```typescript
const API_URLS = {
  develop: 'http://localhost:3000/api/v1',
  trial:    'https://dev-api.yougym.com/api/v1',   // 体验版域名
  release:  'https://api.yougym.com/api/v1',        // 正式版域名
};
```

同时在微信公众平台「开发管理 - 开发设置」中配置 `request 合法域名`。

## 开发阶段

| 阶段 | 周期 | 核心任务 |
|------|------|----------|
| Phase 1 | 1-2周 | 基础搭建、数据库 |
| Phase 2 | 3-4周 | 用户系统 |
| Phase 3 | 5-8周 | 训练核心 |
| Phase 4 | 9-11周 | 数据与饮食 |
| Phase 5 | 12-14周 | AI与激励 |
| Phase 6 | 15-16周 | 测试上线 |

## License

MIT
