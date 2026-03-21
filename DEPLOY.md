# 部署到网上

本工程是 **Next.js + Prisma + PostgreSQL**（云端数据库，适合 GitHub + Vercel / Railway 等部署）。

| 平台 | 说明 |
|------|------|
| **Vercel / Netlify** | 使用 **Neon**、**Supabase** 等托管 PostgreSQL，在环境变量里填 `DATABASE_URL` 即可。 |
| **Railway / Render / VPS / Docker** | 可使用平台自带的 PostgreSQL 插件，或连接外部 Neon/Supabase。 |

---

## 一、部署前准备

1. 在 **Neon**、[Supabase](https://supabase.com)、**Railway PostgreSQL** 等创建数据库，复制 **连接串**（一般为 `postgresql://...`，生产常需 `?sslmode=require`）。
2. 代码推到 **GitHub**（例如 `git@github.com:kk-fenglai/Personal_website.git`）。
3. 生产环境**务必**设置强密码，不要用默认 `admin123`。
4. 环境变量（与 `.env.example` 一致）：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `ADMIN_USERNAME` | 管理员用户名 |
| `ADMIN_PASSWORD` | 管理员密码（建议长且随机） |

构建命令一般为：

```bash
npm install
npx prisma generate
npm run build
```

启动命令：

```bash
npm run start
```

首次连接新数据库时，需在本地或部署平台的 Shell 执行一次表结构同步（见下方）。

---

## 二、首次同步表结构

在已配置好 `DATABASE_URL` 的机器上执行：

```bash
npx prisma db push
```

或在 `package.json` 中已有：`npm run db:push`。

---

## 三、方案 A：Vercel + Neon（常见组合）

1. 在 [Neon](https://neon.tech) 创建项目，复制 **Connection string**（选 **Pooled** 或 **Direct** 均可，按 Neon 文档）。
2. 打开 [vercel.com](https://vercel.com)，Import 你的 GitHub 仓库。
3. **Environment Variables** 添加：`DATABASE_URL`（完整连接串）、`ADMIN_USERNAME`、`ADMIN_PASSWORD`。
4. Deploy。若构建阶段需要访问数据库，确保上述变量已勾选进 **Build** 环境。

---

## 四、方案 B：Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub。
2. 添加 **PostgreSQL** 插件，或在外部 Neon 创建库后把 `DATABASE_URL` 填进 Variables。
3. Build：`npm install && npx prisma generate && npm run build`  
   Start：`npm run start`
4. 首次在 Railway **Shell** 执行：`npx prisma db push`（若未在 CI/启动脚本中自动执行）。

---

## 五、方案 C：自建 VPS

```bash
git clone <你的仓库>
cd website
npm install
cp .env.example .env   # 填入云端 DATABASE_URL 等
npx prisma db push
npm run build
npm run start          # 生产可用 pm2：pm2 start npm --name web -- start
```

前面用 **Nginx** 反代到 `127.0.0.1:3000`，并配置 HTTPS（Let’s Encrypt）。

---

## 六、从旧版 SQLite 迁移数据

若你本地曾有 `prisma/dev.db`，云端是新库，需要**自行导出/导入**（或接受从空库开始）。可先用 SQLite 工具导出 CSV，再在 PostgreSQL 中导入，或写一次性脚本迁移；本仓库不包含自动迁移工具。

---

## 七、上传的图片

上传文件在 **`public/uploads/`**。无服务器环境若文件系统只读，需把上传改到 **对象存储**（Cloudflare R2、阿里云 OSS 等）或使用带**持久卷**的 Node 服务。

---

## 八、检查清单

- [ ] `ADMIN_PASSWORD` 已改为强密码  
- [ ] 生产 `DATABASE_URL` 为 PostgreSQL 且可连通（含 `sslmode` 若需要）  
- [ ] `npm run build` 在本地能通过  
- [ ] 首次部署后已 `prisma db push`  
- [ ] 相册上传目录在重启后不丢失（持久卷或对象存储）
