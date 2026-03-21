# 我的小站 · 个人展示网站

一个用来展示自己的个人网站：发布随想、上传照片，并可以控制每一条内容是否对访客可见。随想支持评论。

## 功能

- **首页**：简介与入口
- **随想**：发布自己的想法与感悟，每篇可设为「公开」或「私密」
- **评论**：访客可在公开的随想下用昵称发表评论
- **相册**：上传照片并配描述，每张可设为公开或私密
- **管理后台**：登录后可以发布随想、上传照片，并切换每条内容的公开/私密

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，按需修改：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的密码
```

在 [Neon](https://neon.tech)、Supabase、Railway 等创建 **PostgreSQL**，把连接串填进 `DATABASE_URL`。首次建表请执行：`npx prisma db push`。

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 部署到公网

- **用 GitHub 托管并部署**：请按 **[GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md)**（推送到 GitHub + Vercel/Railway 导入仓库）。
- **各平台说明（PostgreSQL）**：**[DEPLOY.md](./DEPLOY.md)**。

### 4. 使用管理后台

- 打开 **管理**（或 `/admin`）
- 使用 `.env` 里配置的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 登录
- 登录后可：发布随想、上传照片、在列表中点击「公开/私密」切换可见性

## 脚本说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run db:push` | 将 Prisma 模型同步到数据库（表结构变更时使用） |

## 技术栈

- **Next.js 16**（App Router）
- **Prisma 7** + **PostgreSQL**（`pg` 驱动）
- **Tailwind CSS**
- 管理登录：基于 Cookie 的简单会话，密码在 `.env` 中配置

祝你用得开心，把这里变成真正属于自己的小天地。
