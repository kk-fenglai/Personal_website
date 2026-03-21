# 使用 Vercel 部署（推荐）

本仓库默认采用 **Vercel（托管 Next.js）+ Neon（PostgreSQL）**。代码在 GitHub，每次 `git push` 可自动重新部署。

---

## 你需要准备

| 账号 | 用途 |
|------|------|
| [GitHub](https://github.com) | 已推送本仓库代码 |
| [Vercel](https://vercel.com) | 用 GitHub 登录，导入仓库 |
| [Neon](https://neon.tech) | 免费托管 PostgreSQL，拿连接串 |

---

## 第一步：在 Neon 建库

1. 打开 [Neon Console](https://console.neon.tech)，登录并 **Create project**。
2. 创建完成后，在 **Dashboard → Connection details** 里复制连接串。  
   - 一般形如：`postgresql://用户:密码@xxx.region.aws.neon.tech/neondb?sslmode=require`  
   - 若提供 **Pooled connection**（带 `-pooler` 的主机名），在 **Vercel 无服务器** 场景下可优先用 Pooled，减少连接数压力（以 Neon 文档为准）。
3. **不要**把密码提交到 Git；只在 Vercel 环境变量和本地 `.env` 里使用。

---

## 第二步：在 Vercel 导入项目

1. 打开 [vercel.com/new](https://vercel.com/new)，用 **Continue with GitHub** 授权。
2. **Import** 你的仓库（例如 `kk-fenglai/Personal_website`）。
3. **Framework Preset** 选 **Next.js**（一般会自动识别）。
4. **Root Directory** 若仓库根目录就是项目根，保持默认。
5. 先不要点 Deploy，先展开 **Environment Variables**，添加：

| Name | Value | 说明 |
|------|--------|------|
| `DATABASE_URL` | Neon 复制的完整连接串 | 建议含 `?sslmode=require` |
| `ADMIN_USERNAME` | 你的后台登录名 | 不要用过于简单的默认名 |
| `ADMIN_PASSWORD` | 强密码 | 生产环境务必改成长随机密码 |
| `DEEPL_AUTH_KEY` | （可选）[DeepL](https://www.deepl.com/pro-api) 密钥 | 填写后，保存随想时会**自动生成英文/法文**并存库；不填则界面仅显示中文原文 |

6. 每个变量建议勾选 **Production**、**Preview**、**Development**（至少 Production + Preview），避免预览部署连不上库。
7. 点击 **Deploy**，等待构建完成。

> 本仓库 `package.json` 里已有 `postinstall: prisma generate` 与 `build: prisma generate && next build`，Vercel 安装依赖后会生成 Prisma Client，构建一般无需再改命令。

---

## 第三步：首次同步数据库表结构

第一次连上 Neon 时，数据库是空的，需要把 Prisma 模型同步成表。

**做法 A（推荐，在本地执行）：**

1. 在本机项目里配置 `.env`，把 `DATABASE_URL` 设为 **与 Vercel 里相同的 Neon 连接串**（或单独建一个 Neon branch 仅用于开发，再对生产库执行一次 push）。
2. 执行：

   ```bash
   npx prisma db push
   ```

**做法 B：** 安装 [Vercel CLI](https://vercel.com/docs/cli) 后，拉取环境变量到本地再执行 `npx prisma db push`（需已绑定同一项目）。

同步成功后，打开 Vercel 提供的域名，随想、评论、相册、管理后台即可正常使用。

---

## 第四步：后续更新

- 代码改动后 `git push` 到 GitHub，Vercel 会自动触发新部署。
- **只改了 `prisma/schema.prisma` 时**：部署前或部署后在能访问生产 `DATABASE_URL` 的环境再执行一次 `npx prisma db push`（或后续可改为 `prisma migrate` 流程）。

---

## 随想英/法翻译（DeepL）

- 在环境变量中配置 **`DEEPL_AUTH_KEY`**（[DeepL API 免费版](https://www.deepl.com/pro-api)，密钥以 `:fx` 结尾）。
- 执行 **`npx prisma db push`** 为数据库增加翻译字段后，**新建或编辑保存**随想时会自动写入英/法文；旧文章可在登录后台后请求 `POST /api/thoughts/文章id/translate` 补生成。
- Vercel 需在 **Environment Variables** 里同样添加 `DEEPL_AUTH_KEY` 并重新部署。

---

## 常见问题

### 构建失败 / Prisma 相关报错

- 确认 Vercel 里 `DATABASE_URL` 已配置，且 **Build** 环境也能读取（变量界面勾选 **Production** 时，注意 Preview 是否也要）。
- 连接串必须是 **PostgreSQL**，且 Neon 侧防火墙 / IP 策略允许 Vercel 访问（Neon 默认一般无需额外 IP 白名单）。

### 相册上传后图片消失

Vercel 是无持久本地磁盘的，**`public/uploads/` 在重新部署后可能丢失**。长期方案：把上传迁到 **对象存储**（如 Cloudflare R2、S3 等），见根目录 **[DEPLOY.md](./DEPLOY.md)** 第七节。

### 自定义域名

在 Vercel 项目 **Settings → Domains** 里添加你的域名，按提示在域名 DNS 添加 CNAME / A 记录。

---

## 与本文档相关的其他文件

- **[DEPLOY.md](./DEPLOY.md)**：其他平台（Railway、VPS）、迁移与检查清单  
- **[GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md)**：如何把代码推到 GitHub  
- **[.env.example](./.env.example)**：环境变量模板  
