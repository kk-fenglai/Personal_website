# 用 GitHub 部署本网站

「用 GitHub 部署」通常分两步：**① 把代码放到 GitHub** → **② 用 [Vercel](./VERCEL.md) 等平台从 GitHub 自动上线**。

**默认上线方式：Vercel + Neon**，详见 **[VERCEL.md](./VERCEL.md)**。

---

## 第一步：把项目推到 GitHub

### 1. 在 GitHub 上新建仓库

1. 打开 [github.com/new](https://github.com/new)
2. **Repository name** 自定（例如 `Personal_website`）
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

## 第二步：用 Vercel 上线（推荐）

完整步骤（Neon 建库、环境变量、首次同步数据库）见 **[VERCEL.md](./VERCEL.md)**。

简要流程：

1. 在 [Neon](https://neon.tech) 创建 PostgreSQL，复制 `DATABASE_URL`。  
2. 打开 [vercel.com/new](https://vercel.com/new)，用 GitHub 登录并 **Import** 仓库。  
3. 在 **Environment Variables** 中添加 `DATABASE_URL`、`ADMIN_USERNAME`、`ADMIN_PASSWORD`。  
4. **Deploy**。部署成功后按 **VERCEL.md** 对生产库执行一次 `npx prisma db push`。

---

## 备选：Railway

1. [railway.app](https://railway.app) → Deploy from GitHub  
2. 配置 PostgreSQL 与变量，详见 **[DEPLOY.md](./DEPLOY.md)**  

---

## GitHub Actions CI（仅检查构建）

仓库里有 **`.github/workflows/ci.yml`**：向 `main` / `master` **push** 或 **Pull Request** 时会执行：

`npm ci` → `prisma generate` → `prisma db push`（连 CI 内置 PostgreSQL）→ `npm run build`

用于检查代码能否通过构建，**不会**自动发布公网站点。公网访问需在 **Vercel** 绑定同一仓库。

在 GitHub 仓库页点 **Actions** 可查看构建结果。

---

## 小结

| 你想做的事 | 做法 |
|------------|------|
| 代码备份 + 版本管理 | 推到 GitHub（第一步） |
| 推代码后自动检查能否构建 | **GitHub Actions CI** |
| **真正有一个网址给别人访问** | **[VERCEL.md](./VERCEL.md)** 导入 GitHub 仓库 |

更通用的数据库与平台说明见 **[DEPLOY.md](./DEPLOY.md)**。
