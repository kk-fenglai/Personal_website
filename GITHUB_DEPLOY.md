# 用 GitHub 部署本网站

「用 GitHub 部署」通常分两步：**① 把代码放到 GitHub** → **② 用平台从 GitHub 自动拉代码并上线**。

---

## 第一步：把项目推到 GitHub

### 1. 在 GitHub 上新建仓库

1. 打开 [github.com/new](https://github.com/new)
2. **Repository name** 填例如 `my-website`（可自定）
3. 选 **Private** 或 **Public**
4. **不要**勾选「Add a README」（本地已有项目）
5. 点 **Create repository**

### 2. 在电脑里推送代码

在项目目录打开终端（PowerShell），执行（把 `你的用户名` 和 `仓库名` 换成你的）：

```powershell
cd c:\Users\lenovo\Desktop\website

git add .
git status
git commit -m "准备部署：文档与配置"
```

若还没有关联远程仓库：

```powershell
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

若提示已有 `origin`，可改为：

```powershell
git remote set-url origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

第一次推送时 GitHub 会要求登录（浏览器或 Personal Access Token）。

---

## 第二步：选一个平台「从 GitHub 部署」

代码在 GitHub 上之后，任选下面一种方式即可实现「连上 GitHub 自动部署」。

### 方案 A：Vercel（和 Next.js 最省事）

1. 先在 **Neon** 或 **Supabase** 创建 **PostgreSQL**，复制连接串（见 **[DEPLOY.md](./DEPLOY.md)**）。  
2. 打开 [vercel.com](https://vercel.com)，用 **GitHub 账号** 登录  
3. **Add New… → Project** → **Import** 你的仓库  
4. **Environment Variables** 里添加（与本地 `.env` 一致）：  
   - `DATABASE_URL`（`postgresql://...`，常需 `?sslmode=require`）  
   - `ADMIN_USERNAME`  
   - `ADMIN_PASSWORD`  
5. 点 **Deploy**

部署成功后若页面报错缺表，在本地或 Vercel Shell 对已配置的 `DATABASE_URL` 执行一次：`npx prisma db push`。

---

### 方案 B：Railway

1. 打开 [railway.app](https://railway.app)，用 **GitHub** 登录  
2. **New Project** → **Deploy from GitHub repo** → 选中本仓库  
3. 添加 **PostgreSQL** 或粘贴外部 Neon 连接串，按 **[DEPLOY.md](./DEPLOY.md)** 配置变量与启动命令  

这样也是「连 GitHub」，每次 `git push` 可触发重新部署（以 Railway 设置为准）。

---

### 方案 C：仅使用 GitHub Actions（本仓库已配置 CI）

仓库里已有 **`.github/workflows/ci.yml`**：每次向 `main` / `master` **push** 或 **Pull Request** 时，会在 GitHub 云端执行：

`npm ci` → `prisma generate` → `prisma db push`（连 CI 内置 PostgreSQL）→ `npm run build`

用于检查代码能否通过构建，**不会自动把网站发布到公网**。要公网访问仍需在 **Vercel / Railway** 等绑定同一仓库。

在 GitHub 仓库页点 **Actions** 可查看每次构建是否成功。

---

## 小结

| 你想做的事 | 做法 |
|------------|------|
| 代码备份 + 版本管理 | 推到 GitHub（第一步） |
| 推代码后自动检查能否构建 | 已配置的 **GitHub Actions CI** |
| 真正有一个网址给别人访问 | 在 **Vercel** 或 **Railway** 里 **Import GitHub 仓库**（第二步） |

更详细的数据库、环境变量说明见 **[DEPLOY.md](./DEPLOY.md)**。
