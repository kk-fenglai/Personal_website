# 部署到网上

> **推荐方案（默认）：[Vercel + Neon](./VERCEL.md)** —— Next.js 与 GitHub 联动最省事。

本工程是 **Next.js + Prisma + PostgreSQL**。数据库使用 **Neon / Supabase** 等托管服务，在环境变量中配置 `DATABASE_URL` 即可。

| 平台 | 说明 |
|------|------|
| **[Vercel](./VERCEL.md)**（推荐） | 与 Next.js 深度集成，连接 Neon PostgreSQL。 |
| **Netlify** | 类似思路，需自行确认构建命令含 `prisma generate`。 |
| **Railway / Render / VPS** | 可运行 `npm run start`，或使用平台自带 PostgreSQL。 |

---

## 一、部署前准备（通用）

1. 在 **[Neon](https://neon.tech)**、**[Supabase](https://supabase.com)** 或 **Railway PostgreSQL** 创建数据库，复制 **连接串**（一般为 `postgresql://...`，生产常需 `?sslmode=require`）。
2. 代码在 **GitHub** 上（例如 `kk-fenglai/Personal_website`）。
3. 生产环境**务必**使用强 `ADMIN_PASSWORD`，不要用默认弱密码。
4. 环境变量（与 `.env.example` 一致）：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `ADMIN_USERNAME` | 管理员用户名 |
| `ADMIN_PASSWORD` | 管理员密码 |

本地验证构建：

```bash
npm install
npx prisma generate
npm run build
```

---

## 二、Vercel（主方案）

**完整步骤见 [VERCEL.md](./VERCEL.md)**（含 Neon 建库、环境变量、`prisma db push`、注意事项）。

---

## 三、首次同步表结构（非 Vercel 或本地）

在已配置好 `DATABASE_URL` 的环境执行：

```bash
npx prisma db push
```

或：`npm run db:push`。

---

## 四、方案：Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub。
2. 添加 **PostgreSQL** 或粘贴 Neon 连接串到 Variables。
3. Build：`npm install && npx prisma generate && npm run build`  
   Start：`npm run start`
4. 首次在 Railway **Shell** 执行：`npx prisma db push`（若未自动化）。

---

## 五、方案：自建 VPS

```bash
git clone <你的仓库>
cd website
npm install
cp .env.example .env
npx prisma db push
npm run build
npm run start
```

可用 **Nginx** 反代到 `127.0.0.1:3000`，并配置 HTTPS。

---

## 六、从旧版 SQLite 迁移数据

若你本地曾有 `prisma/dev.db`，云端是新库，需**自行导出/导入**或接受空库。本仓库不包含自动迁移工具。

---

## 七、上传的图片

上传目录为 **`public/uploads/`**。在 **Vercel 等无服务器环境**下，文件系统非持久，重新部署可能丢失上传文件。长期请使用 **对象存储**（Cloudflare R2、阿里云 OSS 等）或带持久卷的托管。

---

## 八、检查清单

- [ ] `ADMIN_PASSWORD` 为强密码  
- [ ] 生产 `DATABASE_URL` 可连通（含 `sslmode` 若需要）  
- [ ] `npm run build` 本地可通过  
- [ ] 首次上线已对生产库执行 `prisma db push`  
- [ ] 相册：已了解无持久盘限制或已接对象存储  
