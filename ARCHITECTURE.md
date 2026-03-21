# 等风来的小站 — 网站架构说明

## 一、技术栈

| 类别 | 技术 |
|------|------|
| 框架 | **Next.js 16** (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 | **PostgreSQL**（云端或本地，通过 Prisma 7） |
| ORM | Prisma 7（`pg` + `@prisma/adapter-pg`） |
| 认证 | Cookie 会话 + bcrypt 校验管理员密码 |

---

## 二、目录结构概览

```
website/
├── prisma/
│   ├── schema.prisma    # 数据模型（PostgreSQL）
│   └── (prisma.config 在根目录)
├── prisma.config.ts     # Prisma 7 数据源配置（DATABASE_URL）
├── public/
│   └── uploads/         # 上传的图片存放目录
├── src/
│   ├── app/             # Next.js App Router 页面与 API
│   ├── components/      # 可复用 UI 组件
│   ├── contexts/       # React Context（语言、季节）
│   ├── lib/             # 工具与配置（数据库、认证、翻译）
│   └── generated/       # Prisma 生成的客户端（勿手改）
└── .env                 # 环境变量（DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD）
```

---

## 三、数据模型（Prisma）

- **Thought**：随想。字段：标题、内容、是否公开、创建/更新时间；关联多条 Comment。
- **Comment**：评论。归属某条 Thought，含作者、内容、创建时间。
- **Photo**：照片。文件名（如 `/uploads/xxx.jpg`）、可选描述、是否公开、创建时间。
- **AccessRequest**：访问申请。姓名、联系方式、留言、状态（pending/approved/rejected）、访问令牌、创建时间。

数据库由环境变量 **`DATABASE_URL`** 指向的 PostgreSQL 实例提供（本地开发可用 Docker 或云端 Neon 等）。

---

## 四、前端页面与路由

| 路径 | 说明 |
|------|------|
| `/` | 首页。展示站点介绍、随想/相册入口卡片、统计、关于与季节/语言相关动效。 |
| `/thoughts` | 随想列表。仅展示公开随想（未登录）或全部（管理员）。 |
| `/thoughts/[id]` | 随想详情。标题、内容（支持 **加粗** 语法）、评论列表与发表评论表单。 |
| `/gallery` | 相册。网格展示公开照片，点击进入灯箱大图（含下载）。 |
| `/admin` | 管理后台入口。未登录显示登录表单；登录后为管理面板。 |
| `/verify` | 访问申请页（若启用访问控制时可在此申请）。 |

所有页面共用：**AppShell**（顶栏导航、主内容区、页脚、季节/语言切换、冬季雪人、背景氛围）。

---

## 五、布局与全局逻辑

- **layout.tsx**  
  - 根 HTML、全局样式、**LocaleProvider**、**SeasonProvider**、**ClientLayout**。  
  - `data-locale` / `data-season` 挂在 `<html>` 上，用于语言与季节主题。

- **ClientLayout**  
  - 仅包裹 **AppShell**，无访问门控。

- **AppShell**  
  - 顶栏：站点名、首页/随想/相册/管理、季节切换、语言切换。  
  - 主内容：`children`（各页内容）。  
  - 页脚：站点名、回到顶部、版权。  
  - 背景与装饰：`bg-waiting-wind`、`bg-wind-flow`、WaitingWindAtmosphere；冬季时显示 Snowman。

- **首页 (page.tsx)**  
  - 根据季节显示：FallingSnow / FallingPetals / FallingRain / FallingLeaves。  
  - 调用 `/api/stats` 取随想数、照片数并展示。

---

## 六、多语言与季节

- **LocaleContext**  
  - 当前语言 `locale`（zh / en / fr），持久化到 `localStorage`，同步到 `html` 的 `data-locale`。

- **translations.ts**  
  - 所有文案按 key 存于 `translations[locale]`；通过 `t(key)` 取当前语言文案。  
  - 含 `localeLabels`、`dateLocales`、`getStoredLocale()` 等。

- **SeasonContext**  
  - 当前季节 `season`（spring / summer / autumn / winter），持久化到 `localStorage`，同步到 `html` 的 `data-season`。

- **globals.css**  
  - 通过 `[data-season="..."]` 和 `[data-locale="..."]` 切换 CSS 变量（背景色、强调色等），实现季节主题与字体等。

---

## 七、API 路由一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 返回公开随想数、公开照片数（供首页展示）。 |
| GET | `/api/thoughts` | 列表：管理员返回全部，否则仅公开。 |
| POST | `/api/thoughts` | 创建随想（需管理员）。 |
| GET | `/api/thoughts/[id]` | 单条随想详情+评论；非公开且非管理员 403。 |
| PATCH | `/api/thoughts/[id]` | 更新随想（标题/内容/是否公开）（需管理员）。 |
| DELETE | `/api/thoughts/[id]` | 删除随想（需管理员）。 |
| POST | `/api/thoughts/[id]/comments` | 对某条随想发表评论（无需登录）。 |
| GET | `/api/photos` | 照片列表：管理员全部，否则仅公开。 |
| POST | `/api/photos/upload` | 上传单张照片（需管理员）；写入 `public/uploads` 并写库。 |
| PATCH | `/api/photos/[id]` | 更新照片描述或是否公开（需管理员）。 |
| DELETE | `/api/photos/[id]` | 删除照片（需管理员）。 |
| POST | `/api/auth/login` | 管理员登录：校验用户名密码，通过则写 Cookie。 |
| POST | `/api/auth/logout` | 清除管理员 Cookie。 |
| GET | `/api/auth/session` | 返回当前是否管理员（看 Cookie）。 |
| POST | `/api/access/request` | 提交访问申请（写入 AccessRequest）。 |
| GET | `/api/access/requests` | 管理员获取申请列表。 |
| POST | `/api/access/requests/[id]/approve` | 管理员批准某条申请（可生成 accessToken 等）。 |
| GET | `/api/access/verify` | 校验访问令牌等（若启用访问控制）。 |
| GET | `/api/access/check` | 检查访问权限（若启用）。 |

管理员判断：**auth.ts** 中 `isAdmin()` 读取 Cookie（如 `admin_session=1`），登录时由 `verifyAdminPassword()` 校验 `.env` 中的 `ADMIN_USERNAME` / `ADMIN_PASSWORD`。

---

## 八、核心功能与实现要点

1. **随想**  
   - 列表：ThoughtList；详情：ThoughtDetail。  
   - 内容支持 `**文字**` / `__文字__` 加粗：**formatContent.ts** 解析，**FormattedContent** 渲染。  
   - 管理端：AdminPanel 内可发布、编辑、切换公开状态。

2. **相册**  
   - 前台：GalleryView 网格 + 灯箱（Portal、键盘与滚动处理）；支持下载。  
   - 管理端：批量上传（多选/拖拽）、预览、统一描述与公开；单张可编辑描述、公开、删除。

3. **管理后台**  
   - 登录后：随想列表/发布/编辑、相册列表/上传、访问申请列表与批准。  
   - 上传表单：选多张图后，在预览下方显示「上传」按钮，逐张调用 `/api/photos/upload`。

4. **季节与动效**  
   - 冬：FallingSnow、Snowman。  
   - 春：FallingPetals。  
   - 夏：FallingRain。  
   - 秋：FallingLeaves。  
   - 背景与氛围由 globals.css 的 `data-season` 与组件配合完成。

5. **加粗输入**  
   - BoldableContentField：在发布/编辑随想时，选中文字后点「加粗」按钮，自动用 `**...**` 包裹。

---

## 九、环境与运行

- **部署（推荐）**：**[VERCEL.md](./VERCEL.md)**（Vercel + Neon）。
- **.env**（参考 .env.example）：  
  - `DATABASE_URL`：PostgreSQL 连接串，如 `postgresql://user:pass@host:5432/db?sslmode=require`。  
  - `ADMIN_USERNAME`、`ADMIN_PASSWORD`：管理员账号密码（支持明文或 bcrypt）。

- **常用命令**  
  - 安装依赖：`npm install`（会执行 `prisma generate`）。  
  - 开发：`npm run dev`（Next 开发服务器）。  
  - 构建：`npm run build`（prisma generate + next build）。  
  - 生产运行：`npm run start`。  
  - 数据库结构同步：`npm run db:push`。

---

## 十、关键文件索引

| 功能 | 文件 |
|------|------|
| 根布局与全局 Provider | `src/app/layout.tsx` |
| 壳布局与导航 | `src/components/AppShell.tsx` |
| 首页 | `src/app/page.tsx` |
| 随想列表/详情 | `src/app/thoughts/page.tsx`, `src/app/thoughts/[id]/page.tsx`, ThoughtList.tsx, ThoughtDetail.tsx |
| 相册 | `src/app/gallery/page.tsx`, GalleryView.tsx |
| 管理后台 | `src/app/admin/page.tsx`, AdminPanel.tsx, LoginForm.tsx |
| 数据库与 Prisma | `src/lib/db.ts`, `prisma/schema.prisma`, `prisma.config.ts` |
| 认证 | `src/lib/auth.ts` |
| 多语言 | `src/lib/translations.ts`, `src/contexts/LocaleContext.tsx`, LanguageSwitcher.tsx |
| 季节 | `src/contexts/SeasonContext.tsx`, SeasonSwitcher.tsx |
| 随想加粗 | `src/lib/formatContent.ts`, `src/components/FormattedContent.tsx`, BoldableContentField.tsx |
| 全局样式与主题 | `src/app/globals.css` |

以上即为当前「等风来的小站」的完整架构与运行方式说明。
