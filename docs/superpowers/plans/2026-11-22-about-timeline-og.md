# 关于页重做、分享卡片图、时间线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `/about` 对所有人公开并由后台编辑内容，给首页和关于页加分享卡片图，新增凭申请访问的 `/timeline`。

**Architecture:** 关于页的资料和项目存进两张新表，服务端页面读库后把三语内容交给浏览器端组件按语言显示。纯逻辑（校验、域名、分段、时间线归组）放在不依赖数据库的模块里，用 Node 自带的测试运行器测。分享卡片图由 `/api/og/[page]` 用 `next/og` 生成。时间线是浏览器端页面，复用现有的 `/api/thoughts` 和 `/api/photos`。

**Tech Stack:** Next.js 16.1.6（App Router）、React 19、Prisma 7 + PostgreSQL、Tailwind CSS 4、TypeScript、`tsx --test`（`tsx` 已是开发依赖）。

**Spec:** `docs/superpowers/specs/2026-11-22-about-page-design.md`。执行前先完整读一遍，尤其是「页面内容」「视觉规范」「时间线」「做成这样就算失败」。

## Global Constraints

- 不加任何新的 npm 依赖。
- 颜色只用 `globals.css` 里已有的变量：`--bg`、`--bg-card`、`--fg`、`--muted`、`--border`、`--warm`、`--tertiary`、`--surface`。公开页面没有圆角、没有阴影。
- 字体类只用现有的：`.type-display-lg`、`.type-headline-md`、`.type-headline-sm`、`.section-label`、`.type-body-lg`、`.reading`、`.type-caption`。
- 后台新界面用后台现有样式（`.admin-*`、`.form-control`、`.card`、`.button-primary`、`.button-secondary`）。
- 所有新增的界面文字三语都写进 `src/lib/translations.ts`（zh、en、fr 三段都要加）。
- 没填的栏目在前台不渲染任何元素，不出现占位字。
- 数据库结构用 `prisma db push` 同步，不写迁移文件。
- 内存：这台机器只有 3.7 GB。每次 `npm ci`、`npm run build` 前先 `free -m`，available 不到 1500 就停下来告诉站长。同一时间只跑一个。在宿主机上跑时一律套 `systemd-run --user --scope -q -p MemoryMax=1500M -p MemorySwapMax=256M -p CPUWeight=30 <命令>`。
- 密钥：不读 `~/personal_website-test/*.env`，不执行 `docker inspect`、`docker exec ... env`。
- 不构建测试镜像，不重建、不删除容器 `personal-website-test`、`personal-db`，不碰 `~/personal_website-test/uploads`。重建由站长本人做。
- 本地登录只用测试账号 `test@gmail.com` / `test1234`，只写进被 git 忽略的 `.env.local`。
- 不改随想、相册、首页的内容和行为。首页只做 Task 7 里说明的拆分，渲染结果不变。
- 在分支 `feat/about-timeline-og` 上工作，不推送，不合并。每个 Task 结束提交一次，提交信息末尾加 `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`。

## Review Focus

1. 项目链接是 `javascript:alert(1)`、`JAVASCRIPT:…`、前后带空格的 `https://…`、没有协议的 `example.com`。前三种里只有去掉空格后的 https 能存，其余拒绝。测试在 Task 2。
2. 保存资料时翻译服务不可用。保存必须成功，改动过的栏目的旧英法文被清空。测试在 Task 3（`planTranslationReset`）。
3. 一张照片在 UTC 23:30 上传，访客在东八区。它应归到访客当地的第二天，跨月、跨年时归到对应的月和年。测试在 Task 8。
4. 删掉中间一个项目后排序号有空缺，再点上移。应和显示顺序上的前一个交换，不是和「序号减一」交换。测试在 Task 3（`neighborToSwap`）。
5. 项目配图地址失效，或大标题写满 60 个字。配图退回浅灰色块；大标题在页面和分享卡片图里换行，不溢出。Task 5 和 Task 7 的人工检查各有一条。

---

### Task 1: 分支、依赖、测试命令、本地验证环境

**Files:**
- Modify: `package.json`（scripts）
- Modify: `.github/workflows/ci.yml`
- Create: `.env.local`（被 git 忽略，不提交）

**Interfaces:**
- Produces: `npm test` 运行 `src/lib/__tests__/*.test.ts`。本地数据库在 `127.0.0.1:55433`。开发服务器固定用端口 `3030`。

- [ ] **Step 1:** `git switch -c feat/about-timeline-og`。
- [ ] **Step 2:** `free -m` 确认 available ≥ 1500，然后在仓库根目录运行
  `DATABASE_URL=postgres://build:build@127.0.0.1:1/build systemd-run --user --scope -q -p MemoryMax=1500M -p MemorySwapMax=256M -p CPUWeight=30 npm ci --no-audit --no-fund`。
  Expected: 退出码 0，`node_modules/.bin/tsx` 存在。
- [ ] **Step 3:** 在 `package.json` 的 `scripts` 加 `"test": "tsx --test src/lib/__tests__/*.test.ts"`。在 `ci.yml` 的「Build Next.js」之前加一步 `npm test`。
- [ ] **Step 4:** 建本地数据库。密码用 `openssl rand -hex 16` 现场生成，只写进 `.env.local`，不要打印出来。
  `docker run -d --name pw-about-dev-db --memory 256m -p 127.0.0.1:55433:5432 -e POSTGRES_USER=pw -e POSTGRES_DB=pw -e POSTGRES_PASSWORD=<生成的值> postgres:16`
- [ ] **Step 5:** 写 `.env.local`，包含 `DATABASE_URL`（指向上一步的库）、`ADMIN_USERNAME=test@gmail.com`、`ADMIN_PASSWORD=test1234`、`SESSION_SECRET`（`openssl rand -hex 32`）、`LIBRETRANSLATE_DISABLED=true`、`SITE_URL=http://127.0.0.1:3030`。`prisma.config.ts` 只读 `.env`，所以执行 Prisma 命令时用 `npx dotenv -e .env.local -- …` 不可用（没有这个依赖），改为 `set -a; . ./.env.local; set +a; npx prisma db push`。
  Expected: `Your database is now in sync`。
- [ ] **Step 6:** `git status --short` 里不能出现 `.env.local`。提交 `chore: add test script and CI step`。

本 Task 起的开发服务器（`npx next dev -p 3030`）每次验证完就关掉。全部 Task 做完后在 Task 9 里删掉 `pw-about-dev-db` 容器。

---

### Task 2: 关于页的纯逻辑

**Files:**
- Create: `src/lib/photoUrl.ts`
- Modify: `src/lib/photoStorage.ts`（改为从 `photoUrl.ts` 引入并继续导出 `isAllowedPhotoUrl`）
- Create: `src/lib/aboutContent.ts`
- Test: `src/lib/__tests__/aboutContent.test.ts`

这两个新文件不得引入 `@/lib/db` 或任何会连数据库的模块，否则测试跑不起来。

**Interfaces:**
- Produces（全部从 `src/lib/aboutContent.ts` 导出）:

```ts
import type { Locale } from "@/lib/translations";

export type Localized = { zh: string; en: string | null; fr: string | null };

export const PROFILE_TEXT_FIELDS = [
  "headline", "intro",
  "fact1Label", "fact1Value", "fact2Label", "fact2Value",
  "collabTitle", "collabBody", "joinTitle", "joinBody",
] as const;
export type ProfileTextField = (typeof PROFILE_TEXT_FIELDS)[number];

export type ProfileInput = Record<ProfileTextField, string> & { email: string };
export type ProjectInput = {
  name: string; description: string; url: string;
  domain: string | null; imageUrl: string | null; isVisible: boolean;
};

export const DEFAULT_HEADLINE = "AI 极客创作者";
export const DEFAULT_EMAIL = "alzy1210@163.com";

export const LIMITS = {
  headline: 60, intro: 2000, factLabel: 20, factValue: 60,
  sectionTitle: 40, sectionBody: 600, email: 120,
  projectName: 60, projectDescription: 200, projectUrl: 500, projectDomain: 80,
} as const;

export function normalizeHttpUrl(raw: string): string | null;
export function domainFromUrl(url: string): string;
export function displayDomain(p: { url: string; domain: string | null }): string;
export function splitParagraphs(text: string): string[];
export function pickLocalized(v: Localized, locale: Locale): string;
export function formatProjectNumber(index: number): string;
export function parseProfileInput(body: unknown):
  { ok: true; value: ProfileInput } | { ok: false; error: string };
export function parseProjectInput(body: unknown):
  { ok: true; value: ProjectInput } | { ok: false; error: string };
```

- [ ] **Step 1: 写失败的测试**（`node:test` + `node:assert/strict`）。断言：

```ts
// normalizeHttpUrl
assert.equal(normalizeHttpUrl("  https://example.com/a  "), "https://example.com/a");
assert.equal(normalizeHttpUrl("http://example.com"), "http://example.com");
assert.equal(normalizeHttpUrl("javascript:alert(1)"), null);
assert.equal(normalizeHttpUrl("JAVASCRIPT:alert(1)"), null);
assert.equal(normalizeHttpUrl("example.com"), null);
assert.equal(normalizeHttpUrl(""), null);
// domainFromUrl / displayDomain
assert.equal(domainFromUrl("https://www.example.com/path?q=1"), "example.com");
assert.equal(domainFromUrl("https://app.example.dev"), "app.example.dev");
assert.equal(displayDomain({ url: "https://www.example.com", domain: "  我的域名 " }), "我的域名");
assert.equal(displayDomain({ url: "https://www.example.com", domain: null }), "example.com");
assert.equal(displayDomain({ url: "https://www.example.com", domain: "   " }), "example.com");
// splitParagraphs
assert.deepEqual(splitParagraphs("第一段\n仍是第一段\n\n\n第二段  "), ["第一段\n仍是第一段", "第二段"]);
assert.deepEqual(splitParagraphs("   "), []);
// pickLocalized
assert.equal(pickLocalized({ zh: "中", en: "E", fr: null }, "en"), "E");
assert.equal(pickLocalized({ zh: "中", en: "E", fr: null }, "fr"), "中");
assert.equal(pickLocalized({ zh: "中", en: "  ", fr: "F" }, "en"), "中");
// formatProjectNumber
assert.equal(formatProjectNumber(0), "01");
assert.equal(formatProjectNumber(11), "12");
// parseProfileInput
const base = { headline: "标题", email: "a@b.co", intro: "", fact1Label: "", fact1Value: "",
  fact2Label: "", fact2Value: "", collabTitle: "", collabBody: "", joinTitle: "", joinBody: "" };
assert.equal(parseProfileInput(base).ok, true);
assert.equal(parseProfileInput({ ...base, headline: "  " }).ok, false);
assert.equal(parseProfileInput({ ...base, email: "not-an-email" }).ok, false);
assert.equal(parseProfileInput({ ...base, headline: "字".repeat(61) }).ok, false);
assert.equal(parseProfileInput({ headline: "标题", email: "a@b.co" }).ok, true); // 缺的栏目按空字符串
assert.equal(parseProfileInput(null).ok, false);
// parseProjectInput
const p = { name: "甲", description: "", url: "https://example.com" };
const ok = parseProjectInput(p);
assert.equal(ok.ok && ok.value.isVisible, true);
assert.equal(ok.ok && ok.value.domain, null);
assert.equal(parseProjectInput({ ...p, name: "" }).ok, false);
assert.equal(parseProjectInput({ ...p, url: "javascript:alert(1)" }).ok, false);
assert.equal(parseProjectInput({ ...p, url: undefined }).ok, false);
assert.equal(parseProjectInput({ ...p, imageUrl: "https://evil.example/x.png" }).ok, false);
assert.equal(parseProjectInput({ ...p, imageUrl: "/uploads/x.png" }).ok, true);
```

- [ ] **Step 2:** `npm test`。Expected: FAIL，找不到 `../aboutContent`。
- [ ] **Step 3:** 实现。要点：所有字符串先 `trim()`；`normalizeHttpUrl` 用 `new URL()` 解析并只接受 `http:`、`https:`；`domainFromUrl` 去掉开头的 `www.`，解析失败返回空字符串；邮箱只要求含 `@` 且两边非空；错误信息用中文短句（如「大标题不能为空」）；`imageUrl` 用 `photoUrl.ts` 的 `isAllowedPhotoUrl` 校验；`isVisible` 缺省为 `true`。
- [ ] **Step 4:** `npm test`。Expected: PASS。
- [ ] **Step 5:** 提交 `feat: about page validation and display helpers`。

---

### Task 3: 数据表与读写层

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/db.ts`（`PRISMA_CLIENT_CACHE_VERSION` 改为 `5`）
- Modify: `src/lib/translateThought.ts`（导出下面的 `translateZhText`，`translateThoughtZhToEnFr` 改为调用它，行为不变）
- Create: `src/lib/aboutPlan.ts`（纯逻辑，不引入数据库）
- Create: `src/lib/aboutStore.ts`（读写数据库）
- Test: `src/lib/__tests__/aboutPlan.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `ProfileInput`、`ProjectInput`、`PROFILE_TEXT_FIELDS`、`Localized`、`DEFAULT_HEADLINE`、`DEFAULT_EMAIL`。
- Produces:

```prisma
model AboutProfile {
  id        String   @id @default("default")
  // 对 PROFILE_TEXT_FIELDS 里的每个字段 X：X String @default("")、XEn String?、XFr String?
  email     String
  updatedAt DateTime @updatedAt
}

model Project {
  id            String   @id @default(cuid())
  name          String
  nameEn        String?
  nameFr        String?
  description   String   @default("")
  descriptionEn String?
  descriptionFr String?
  url           String
  domain        String?
  imageUrl      String?
  sortOrder     Int
  isVisible     Boolean  @default(true)
  createdAt     DateTime @default(now())
  @@index([sortOrder])
}
```

```ts
// src/lib/translateThought.ts
export async function translateZhText(text: string): Promise<{ en: string; fr: string } | null>;
// LIBRETRANSLATE_DISABLED=true 时返回 null；请求失败时抛错。

// src/lib/aboutPlan.ts
export function planTranslationReset<F extends string>(
  prev: Record<F, string>, next: Record<F, string>, fields: readonly F[]
): F[];                       // 返回中文发生变化的字段
export function neighborToSwap<T extends { id: string; sortOrder: number }>(
  items: T[], id: string, direction: "up" | "down"
): T | null;                  // items 可以乱序；按 sortOrder 再按 id 排后取相邻项

// src/lib/aboutStore.ts
export type AboutProfileView = Record<ProfileTextField, Localized> & { email: string };
export type ProjectView = {
  id: string; name: Localized; description: Localized;
  url: string; domain: string | null; imageUrl: string | null;
  sortOrder: number; isVisible: boolean;
};
export async function getAboutProfile(): Promise<AboutProfileView>;
export async function saveAboutProfile(input: ProfileInput): Promise<AboutProfileView>;
export async function listProjects(opts: { includeHidden: boolean }): Promise<ProjectView[]>;
export async function createProject(input: ProjectInput): Promise<ProjectView>;
export async function updateProject(id: string, input: ProjectInput): Promise<ProjectView | null>;
export async function deleteProject(id: string): Promise<boolean>;
export async function moveProject(id: string, direction: "up" | "down"): Promise<boolean>;
```

- [ ] **Step 1: 写失败的测试。**

```ts
assert.deepEqual(
  planTranslationReset({ a: "一", b: "二" }, { a: "一", b: "三" }, ["a", "b"] as const), ["b"]);
assert.deepEqual(
  planTranslationReset({ a: "一", b: "二" }, { a: "一", b: "二" }, ["a", "b"] as const), []);
const items = [{ id: "c", sortOrder: 7 }, { id: "a", sortOrder: 1 }, { id: "b", sortOrder: 4 }];
assert.equal(neighborToSwap(items, "c", "up")?.id, "b");     // 序号有空缺，仍取显示顺序上的前一个
assert.equal(neighborToSwap(items, "a", "up"), null);
assert.equal(neighborToSwap(items, "c", "down"), null);
assert.equal(neighborToSwap(items, "a", "down")?.id, "b");
assert.equal(neighborToSwap(items, "zzz", "up"), null);
```

- [ ] **Step 2:** `npm test`。Expected: FAIL。
- [ ] **Step 3:** 实现 `aboutPlan.ts`，`npm test` 通过。
- [ ] **Step 4:** 改 `schema.prisma`，然后 `set -a; . ./.env.local; set +a; npx prisma db push && npx prisma generate`。Expected: 同步成功，`src/generated/prisma/models/` 下出现 `AboutProfile.ts`、`Project.ts`。
- [ ] **Step 5:** 实现 `aboutStore.ts`。行为：
  - `getAboutProfile`：没有行时返回 `headline.zh = DEFAULT_HEADLINE`、`email = DEFAULT_EMAIL`，其余字段 `zh` 为空字符串、`en`/`fr` 为 `null`。不写库。
  - `saveAboutProfile`：`upsert` id 为 `"default"` 的行。对 `planTranslationReset` 返回的每个字段，同一次写入里把 `XEn`、`XFr` 置为 `null`。写入完成后不等待地启动翻译：对每个改动且非空的字段调 `translateZhText`，成功就单独更新那两列，失败 `console.error` 后继续。函数返回的是翻译前的状态。
  - `createProject`：`sortOrder` 取现有最大值加 1（没有项目时为 1）。名称、说明同样启动翻译。
  - `updateProject`：名称或说明的中文变了，对应的英法文置 `null` 再翻译。`sortOrder` 不变。
  - `moveProject`：读全部项目，用 `neighborToSwap` 找到对象，在一个事务里交换两者的 `sortOrder`。找不到返回 `false`。
  - `listProjects`：按 `sortOrder` 升序、`id` 升序。`includeHidden` 为 `false` 时只返回 `isVisible` 为 `true` 的。
- [ ] **Step 6:** `npx tsc --noEmit`。Expected: 无报错。
- [ ] **Step 7:** 提交 `feat: about profile and project storage`（包含重新生成的 `src/generated/prisma`）。

---

### Task 4: 接口

**Files:**
- Create: `src/app/api/about/route.ts`
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/api/projects/[id]/move/route.ts`

**Interfaces:**
- Consumes: Task 2 的 `parseProfileInput`、`parseProjectInput`；Task 3 的 `aboutStore` 全部函数；`isAdmin()`（`@/lib/auth`）。
- Produces:

| 方法与路径 | 权限 | 请求体 | 成功返回 |
|---|---|---|---|
| `GET /api/about` | 任何人 | 无 | `AboutProfileView` |
| `PUT /api/about` | 管理员 | `ProfileInput` | `AboutProfileView` |
| `GET /api/projects` | 任何人 | 无 | `ProjectView[]`。管理员拿到全部，其他人只拿到可见的 |
| `POST /api/projects` | 管理员 | `ProjectInput` | `ProjectView` |
| `PATCH /api/projects/[id]` | 管理员 | `ProjectInput` | `ProjectView`，不存在返回 404 |
| `DELETE /api/projects/[id]` | 管理员 | 无 | `{ ok: true }`，不存在返回 404 |
| `POST /api/projects/[id]/move` | 管理员 | `{ direction: "up" \| "down" }` | `{ ok: boolean }` |

非管理员调用写接口返回 401 和 `{ error: "未授权" }`。校验失败返回 400 和 `{ error: <parse 函数给的中文信息> }`。请求体不是 JSON 时按空对象处理（沿用 `thought-categories/route.ts` 的写法）。

- [ ] **Step 1:** 实现四个路由文件。
- [ ] **Step 2:** 起开发服务器 `set -a; . ./.env.local; set +a; npx next dev -p 3030`，用 curl 验证（`J` 是登录后保存的 cookie 文件）：

```bash
B=http://127.0.0.1:3030
curl -s $B/api/about | grep -c 'AI 极客创作者'                                  # 1
curl -s -o /dev/null -w '%{http_code}\n' -X PUT $B/api/about -H 'Content-Type: application/json' -d '{}'   # 401
curl -s -c J -X POST $B/api/auth/login -H 'Content-Type: application/json' -d '{"username":"test@gmail.com","password":"test1234"}'
curl -s -b J -o /dev/null -w '%{http_code}\n' -X POST $B/api/projects -H 'Content-Type: application/json' -d '{"name":"甲","description":"","url":"javascript:alert(1)"}'   # 400
curl -s -b J -X POST $B/api/projects -H 'Content-Type: application/json' -d '{"name":"甲","description":"说明","url":"https://example.com"}'   # 返回带 id 的对象
curl -s $B/api/projects   # 未登录也能看到「甲」
```

  再建一个 `isVisible:false` 的项目，确认未登录的 `GET /api/projects` 里没有它、带 cookie 的有。
- [ ] **Step 3:** 关掉开发服务器。提交 `feat: about and project APIs`。

---

### Task 5: 公开的关于页

**Files:**
- Modify: `src/middleware.ts`（`isOpenPage` 的数组加 `"/about"`）
- Modify: `src/app/about/page.tsx`（改为服务端组件）
- Create: `src/app/about/AboutView.tsx`（`"use client"`）
- Create: `src/app/about/ProjectRow.tsx`（`"use client"`）
- Modify: `src/lib/translations.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `getAboutProfile`、`listProjects`、`AboutProfileView`、`ProjectView`；`splitParagraphs`、`pickLocalized`、`displayDomain`、`formatProjectNumber`；现有的 `PhotoImage`、`ScrollReveal`、`useLocale`、`STITCH_ABOUT_PORTRAIT`、`/api/site-images`。
- Produces: `AboutView({ profile, projects }: { profile: AboutProfileView; projects: ProjectView[] })`。Task 7 会给 `page.tsx` 的 `generateMetadata` 加 `openGraph`。

- [ ] **Step 1:** `page.tsx` 写成服务端组件。必须 `export const dynamic = "force-dynamic"`，因为构建时用的是连不上的假数据库地址，页面不能在构建期预渲染。导出 `generateMetadata`：`title` 为 `${profile.headline.zh} | 等风来的小站`，`description` 为介绍第一段的前 120 个字，没有介绍时用根布局现有的描述。页面读 `getAboutProfile()` 和 `listProjects({ includeHidden: false })`，渲染 `<AboutView>`。
- [ ] **Step 2:** 在 `translations.ts` 三语各加这些键，并删掉不再使用的 `about.intro1`、`about.intro2`、`about.establishedLabel`、`about.established`、`about.themeLabel`、`about.theme`、`about.valuesHeading`、`about.valuesLead`、`about.value1Title`…`about.value4Desc`、`about.contactHeading`、`about.contactLead`、`about.emailBizNote`、`about.contactNote`、`about.accessHint`、`about.accessLink`、`about.stationLabel`、`about.title`、`about.email`。删之前用 `rg` 确认别处没有引用；`about.learnMore` 和 `about.portraitAlt` 保留。

| 键 | zh | en | fr |
|---|---|---|---|
| `about.eyebrow` | About · 关于我 | About | À propos |
| `about.projectsEyebrow` | Selected Work | Selected Work | Sélection |
| `about.projectsHeading` | 做过的项目 | Projects | Projets |
| `about.projectsCount` | 共 {count} 个 | {count} in total | {count} au total |
| `about.projectVisit` | 访问 | Visit | Visiter |
| `about.collabEyebrow` | Work Together | Work Together | Travaillons ensemble |
| `about.collabHeading` | 一起做点什么 | Let's make something | Faisons quelque chose |
| `about.collabLabel` | 01 · 合作 | 01 · Collaborate | 01 · Collaborer |
| `about.joinLabel` | 02 · 加入 | 02 · Join | 02 · Rejoindre |
| `about.emailLabel` | 邮件联系 | Email | E-mail |
| `about.writeMe` | 写信给我 | Write to me | M'écrire |

- [ ] **Step 3:** 实现 `AboutView`，结构和列位严格照 spec 的「页面内容」和「视觉规范」。逐条落实这些显示规则：
  - 介绍用 `splitParagraphs` 分段，每段一个 `<p>`，没有段落时不渲染正文容器。
  - 某组小信息的值为空就不渲染这一组；两组都为空，连上面的细线一起不渲染。
  - `projects` 为空时不渲染 `.surface-band` 这一整段。
  - 合作、加入两栏：正文为空的那栏不渲染，剩下的一栏占满右侧；两栏都为空时右侧不渲染，第三段只有标题和邮箱行。小标题为空但正文不为空时只是不渲染小标题。
  - 「01 · 合作」「02 · 加入」是固定标签，不随哪一栏被隐藏而重新编号。
  - 邮箱和「写信给我」都是 `mailto:` 链接。页面里不出现指向 `/thoughts`、`/gallery`、`/verify` 的链接。
- [ ] **Step 4:** 实现 `ProjectRow`。整行是 `<a target="_blank" rel="noopener noreferrer">`。配图容器宽高比 16:10、底色 `var(--surface)` 调深一档（用 `color-mix(in srgb, var(--fg) 8%, var(--surface))`）。`imageUrl` 为空或 `onError` 触发时只显示这个底色块。
- [ ] **Step 5:** 在 `globals.css` 末尾加本页需要而现有类没有的样式，类名以 `about-` 开头。新规则只用上面列的变量，不写 `border-radius` 和 `box-shadow`。配图的黑白转彩色和放大沿用 `.image-hover-zoom` 的过渡曲线。
- [ ] **Step 6:** 起开发服务器验证：

```bash
B=http://127.0.0.1:3030
curl -s -o /dev/null -w '%{http_code}\n' $B/about                       # 200
curl -s $B/about | grep -c 'AI 极客创作者'                               # ≥1
curl -s -o /dev/null -w '%{http_code}\n' $B/thoughts                    # 307
curl -s $B/about | grep -oE 'href="/(thoughts|gallery|verify)"' | sort | uniq -c   # 只有导航栏里的随想、相册（桌面和手机导航各一份），没有 /verify
```

  清空项目后 `curl -s $B/about | grep -c 'surface-band'` 应为 0。把一个项目的 `imageUrl` 设成 `/uploads/does-not-exist.png`，把大标题改成 60 个汉字，用 Playwright（`~/.cache/ms-playwright` 里已有 Chromium，先看 `free -m` ≥ 1500）在 1280 和 390 两个宽度各截一张图，自己看图确认：配图处是浅灰色块；大标题换行不溢出；390 宽度下没有横向滚动条，三段是单列。截图存到 scratchpad，交付时附上。
- [ ] **Step 7:** `npm run lint`。Expected: 无 error。关掉开发服务器。提交 `feat: public about page driven by admin content`。

---

### Task 6: 后台的「关于页」标签

**Files:**
- Create: `src/app/admin/AboutAdmin.tsx`（`"use client"`）
- Modify: `src/app/admin/AdminPanel.tsx`（只加标签和一行渲染，不把表单写进这个文件）
- Modify: `src/lib/translations.ts`

**Interfaces:**
- Consumes: Task 4 的全部接口；`uploadPhotoWithRetry(file, { isPublic: false, caption })`（`@/lib/photoUploadClient`），成功时 `photo.filename` 是图片地址；`LIMITS`（Task 2）。
- Produces: `export function AboutAdmin()`。`AdminPanel` 的 `activeTab` 联合类型加 `"about"`，标签顺序放在 `"categories"` 之后。

- [ ] **Step 1:** 加翻译键 `admin.tabAbout`（关于页 / About page / Page À propos），以及表单用到的字段名、按钮、提示的键，三语齐全，键名以 `admin.about.` 开头。
- [ ] **Step 2:** 实现 `AboutAdmin`，分两块：
  - **资料表单。** 载入时 `GET /api/about`，把各字段的 `zh` 填进输入框。大标题、邮箱是单行输入并标必填；介绍、合作正文、加入正文是多行输入，介绍旁注明「空一行分段」；其余是单行输入。每个输入框的 `maxLength` 取自 `LIMITS`。「保存」调 `PUT /api/about`，成功显示「已保存，英文和法文会自动翻译」，失败显示接口返回的 `error`。
  - **项目列表。** 载入时 `GET /api/projects`（管理员拿到全部）。每行显示编号、缩略图、名称、域名（用 `displayDomain`）、是否显示，以及「上移」「下移」「编辑」「删除」。第一行的「上移」和最后一行的「下移」禁用。删除前在行内显示一次「确认删除」按钮，不用 `confirm()`。新增和编辑用同一个表单：名称（必填）、一句话说明、链接（必填）、域名（选填，占位提示「不填则从链接里取」）、配图上传、是否显示。配图上传用 `uploadPhotoWithRetry(file, { isPublic: false, caption: "项目配图" })`，可以清除已选的配图。每次写操作成功后重新拉列表。
- [ ] **Step 3:** 起开发服务器，用 Playwright 以测试账号登录 `/admin`，走一遍：改大标题并保存；加三个项目（一个不配图、一个设为隐藏）；把第三个上移一次。然后验证：

```bash
curl -s $B/about | grep -c '<新标题>'            # ≥1
curl -s $B/api/projects | python3 -c "import sys,json; print([p['name']['zh'] for p in json.load(sys.stdin)])"   # 两个可见项目，顺序与后台一致
```

  用获批访客或管理员身份请求 `/api/photos`，确认项目配图的 `isPublic` 是 `false`；未登录请求 `/api/photos` 的结果里没有它。
- [ ] **Step 4:** `npm run lint`，关掉开发服务器，提交 `feat: admin tab for about page and projects`。

---

### Task 7: 分享卡片图

**Files:**
- Create: `src/lib/siteUrl.ts`
- Create: `src/lib/ogFont.ts`
- Create: `src/app/api/og/[page]/route.tsx`
- Create: `src/app/HomeView.tsx`（把现在 `src/app/page.tsx` 的全部内容原样搬过来，组件改名 `HomeView`）
- Modify: `src/app/page.tsx`（服务端组件，只导出 `metadata` 并渲染 `<HomeView />`）
- Modify: `src/app/about/page.tsx`（`generateMetadata` 加 `openGraph`）
- Modify: `src/app/layout.tsx`（加 `metadataBase`）
- Modify: `.env.example`
- Test: `src/lib/__tests__/siteUrl.test.ts`

**Interfaces:**
- Produces:

```ts
// src/lib/siteUrl.ts
export function resolveSiteUrl(env: Record<string, string | undefined>): string;
// 优先级：SITE_URL → https://${VERCEL_PROJECT_PRODUCTION_URL} → https://${VERCEL_URL} → http://localhost:3000
// 结果去掉末尾的斜杠。

// src/lib/ogFont.ts
export async function loadOgFont(text: string): Promise<ArrayBuffer | null>;
// 请求 https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&text=<encodeURIComponent(text)>，
// 从返回的 CSS 里取出字体文件地址再下载。任何一步失败返回 null，不抛错。超时 4 秒。

// GET /api/og/home、GET /api/og/about → image/png，1200×630。其他 page 值返回 404。
```

- [ ] **Step 1: 写失败的测试。**

```ts
assert.equal(resolveSiteUrl({ SITE_URL: "https://a.example/" }), "https://a.example");
assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "b.example" }), "https://b.example");
assert.equal(resolveSiteUrl({ VERCEL_URL: "c.vercel.app" }), "https://c.vercel.app");
assert.equal(resolveSiteUrl({ SITE_URL: "  ", VERCEL_URL: "c.vercel.app" }), "https://c.vercel.app");
assert.equal(resolveSiteUrl({}), "http://localhost:3000");
```

- [ ] **Step 2:** `npm test` 失败，实现 `siteUrl.ts`，`npm test` 通过。
- [ ] **Step 3:** `layout.tsx` 的 `metadata` 加 `metadataBase: new URL(resolveSiteUrl(process.env))`。`.env.example` 加一段注释说明可选变量 `SITE_URL`（站点对外的完整地址，用于分享卡片图的绝对链接）。
- [ ] **Step 4:** 拆首页。`page.tsx` 导出的 `metadata` 含 `openGraph: { title, description, images: [{ url: "/api/og/home", width: 1200, height: 630 }] }` 和 `twitter: { card: "summary_large_image" }`，标题和描述沿用根布局的值。拆完后首页的渲染结果必须和拆之前一样。
- [ ] **Step 5:** 关于页的 `generateMetadata` 加同样结构的 `openGraph` 和 `twitter`，图片地址是 `/api/og/about`。
- [ ] **Step 6:** 实现路由，用 `ImageResponse`（`next/og`），`export const dynamic = "force-dynamic"`。卡片内容：
  - 底色 `#f9f9f9`，文字 `#1a1c1c`，四周留白 80px。没有圆角、阴影、渐变。
  - 左上角小字：站名「等风来的小站」，颜色 `#7d562d`，字距加宽。
  - 中间大字。`home`：「等风来的小站」。`about`：`profile.headline.zh`。字号按字数分档：≤12 字 96px，≤28 字 72px，其余 52px。允许换行。
  - 大字下方一条 64×1px 的线，颜色 `#7d562d`。
  - 线下方小字，36px，颜色 `#444748`，最多两行。`home`：根布局的站点描述。`about`：介绍第一段，超过 60 字截断加「…」，没有介绍就不渲染这一块。
  - 字体：把卡片上要出现的全部文字拼起来传给 `loadOgFont`。返回 `null` 时不带字体参数、把所有文字换成拉丁文本再渲染：站名用 `Waiting for the Wind`，大字用 `Waiting for the Wind`（home）或 `About`（about），不渲染小字。这样字体服务不可用时不会出现方块字。
- [ ] **Step 7:** 起开发服务器验证：

```bash
curl -s -o og-about.png -w '%{http_code} %{content_type}\n' $B/api/og/about     # 200 image/png
python3 -c "import struct;d=open('og-about.png','rb').read(24);print(struct.unpack('>II',d[16:24]))"   # (1200, 630)
curl -s -o /dev/null -w '%{http_code}\n' $B/api/og/thoughts                     # 404
curl -s $B/about | grep -o 'og:image" content="[^"]*"'                          # http://127.0.0.1:3030/api/og/about
curl -s $B/ | grep -c 'og:image'                                                # ≥1
curl -s $B/thoughts -b J | grep -c 'og:image'                                   # 0
```

  用 Read 工具打开 `og-about.png` 和 `og-home.png` 自己看：中文正常显示，不是方块；把大标题改成 60 个汉字再取一次，文字不溢出画面。两张图存到 scratchpad，交付时给站长看，这张图他没见过样稿。
- [ ] **Step 8:** `npm run lint`，关掉开发服务器，提交 `feat: share card images for home and about`。

---

### Task 8: 时间线

**Files:**
- Create: `src/lib/timeline.ts`（纯逻辑，不引入数据库）
- Test: `src/lib/__tests__/timeline.test.ts`
- Create: `src/app/timeline/page.tsx`
- Create: `src/app/timeline/TimelineView.tsx`（`"use client"`）
- Modify: `src/components/AppShell.tsx`（`NAV` 在 `/gallery` 和 `/about` 之间加 `{ href: "/timeline", key: "nav.timeline" }`）
- Modify: `src/lib/translations.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: 现有的 `GET /api/thoughts`、`GET /api/photos`（两者已按访客身份过滤）；`pickThoughtTitle`、`pickThoughtContent`（`@/lib/pickThoughtLocale`）；`plainTextExcerpt`（`@/lib/stitchPlaceholders`）；`PhotoImage`。
- Produces:

```ts
export type TimelineThought = { id: string; createdAt: string };
export type TimelinePhoto = { id: string; filename: string; createdAt: string };
export type TimelineEntry =
  | { kind: "thought"; day: number; at: string; thoughtId: string }
  | { kind: "photos"; day: number; at: string; photos: TimelinePhoto[] };
export type TimelineMonth = { month: number; entries: TimelineEntry[] };        // month 为 1–12
export type TimelineYear = {
  year: number; thoughtCount: number; photoCount: number; months: TimelineMonth[];
};
export type TimelineFilter = "all" | "thoughts" | "photos";

export function buildTimeline(
  thoughts: TimelineThought[], photos: TimelinePhoto[],
  timeZone: string, filter: TimelineFilter
): TimelineYear[];
```

排序规则：年、月、条目都按时间倒序。同一天的全部照片合成一条 `photos` 条目，`at` 取其中最晚的一张，条目内照片按时间倒序。年、月、日用 `Intl.DateTimeFormat` 按 `timeZone` 计算。没有条目的月和年不出现。`thoughtCount`、`photoCount` 是过滤后这一年的数量。

- [ ] **Step 1: 写失败的测试。**

```ts
const thoughts = [
  { id: "t1", createdAt: "2026-11-22T03:00:00Z" },
  { id: "t2", createdAt: "2025-12-31T10:00:00Z" },
];
const photos = [
  { id: "p1", filename: "/uploads/1.jpg", createdAt: "2026-11-15T02:00:00Z" },
  { id: "p2", filename: "/uploads/2.jpg", createdAt: "2026-11-15T09:00:00Z" },
  { id: "p3", filename: "/uploads/3.jpg", createdAt: "2026-12-31T23:30:00Z" },  // 东八区是 2027-01-01
];
const tl = buildTimeline(thoughts, photos, "Asia/Shanghai", "all");
assert.deepEqual(tl.map((y) => y.year), [2027, 2026, 2025]);
assert.deepEqual(tl[0].months.map((m) => m.month), [1]);
assert.equal(tl[0].months[0].entries[0].day, 1);
const nov = tl[1].months[0];
assert.equal(nov.month, 11);
assert.deepEqual(nov.entries.map((e) => [e.kind, e.day]), [["thought", 22], ["photos", 15]]);
const group = nov.entries[1];
assert.deepEqual(group.kind === "photos" && group.photos.map((p) => p.id), ["p2", "p1"]);
assert.deepEqual([tl[1].thoughtCount, tl[1].photoCount], [1, 2]);
// 同一批数据换时区，p3 留在 2026 年 12 月
assert.deepEqual(buildTimeline(thoughts, photos, "UTC", "all").map((y) => y.year), [2026, 2025]);
// 过滤
const onlyT = buildTimeline(thoughts, photos, "Asia/Shanghai", "thoughts");
assert.deepEqual(onlyT.map((y) => y.year), [2026, 2025]);
assert.equal(onlyT[0].photoCount, 0);
assert.deepEqual(buildTimeline([], [], "UTC", "all"), []);
```

- [ ] **Step 2:** `npm test` 失败，实现 `timeline.ts`，`npm test` 通过。
- [ ] **Step 3:** 加翻译键，三语：

| 键 | zh | en | fr |
|---|---|---|---|
| `nav.timeline` | 时间线 | Timeline | Chronologie |
| `timeline.title` | 时间线 | Timeline | Chronologie |
| `timeline.lead` | 写过的，拍下的，按时间排在一起。 | What was written and what was captured, in order of time. | Ce qui fut écrit et ce qui fut saisi, dans l'ordre du temps. |
| `timeline.filterAll` | 全部 | All | Tout |
| `timeline.filterThoughts` | 随想 | Thoughts | Pensées |
| `timeline.filterPhotos` | 相册 | Gallery | Galerie |
| `timeline.kindThought` | 随想 | Thought | Pensée |
| `timeline.kindPhotos` | 相册 · {count} 张 | Gallery · {count} | Galerie · {count} |
| `timeline.photosTitle` | 这一天的照片 | Photos from this day | Photos de ce jour |
| `timeline.yearSummary` | {thoughts} 篇随想 · {photos} 张照片 | {thoughts} thoughts · {photos} photos | {thoughts} pensées · {photos} photos |
| `timeline.empty` | 还没有内容 | Nothing here yet | Rien pour l'instant |

- [ ] **Step 4:** 实现页面。`/timeline` 不加进 `isOpenPage`，所以中间件已经把它挡在申请页后面，不用另写。`page.tsx` 的页头写法参照 `src/app/thoughts/page.tsx`（小标签固定写 `Timeline`）。`TimelineView`：
  - 载入时并行请求 `/api/thoughts` 和 `/api/photos`，加载中显示 `thoughts.loading`。任一请求返回 401 时按空列表处理。
  - 时区取 `Intl.DateTimeFormat().resolvedOptions().timeZone`。
  - 筛选是三个 `.filter-tab` 按钮，当前项加 `.filter-tab-active`，各自后面跟数量（全部 = 随想数 + 照片数）。筛选状态只存在组件里。
  - 两个列表都为空时只显示 `timeline.empty`，不显示筛选。
  - 年份块、月份、条目的版式和列位照 spec 的「时间线」一节。年份用拉丁衬线体，桌面宽度下 `position: sticky`，`top` 要避开固定的导航栏高度。
  - 月份名用 `new Intl.DateTimeFormat(dateLocale, { month: "long" })` 生成。日是两位数字。
  - 随想条目链接到 `/thoughts/<id>`，标题用 `pickThoughtTitle`，摘要用 `plainTextExcerpt(pickThoughtContent(...), 90)`。
  - 照片条目链接到 `/gallery`，最多显示 3 张方形缩略图（`PhotoImage`，默认黑白、悬停显色），超过 3 张时第 4 格显示 `+<剩余张数>`。
- [ ] **Step 5:** `globals.css` 末尾加 `timeline-` 开头的类，规则同 Task 5 的 Step 5。
- [ ] **Step 6:** 起开发服务器。先用后台发两篇随想（一篇设为不公开）、传三张照片（其中一张设为不公开）。验证：

```bash
curl -s -o /dev/null -w '%{http_code}\n' $B/timeline            # 307，跳到 /verify
curl -s -b J -o /dev/null -w '%{http_code}\n' $B/timeline       # 200
```

  用 Playwright 以管理员身份在 1280 和 390 两个宽度截图，自己看图确认：按年月倒序；同一天的照片合成一条；三个筛选的数字和条数一致；390 宽度下单列、无横向滚动。再走一遍访问申请流程（`/verify` 提交，后台批准）拿到访客身份，确认访客的时间线里没有不公开的随想和照片，也没有 Task 6 里上传的项目配图。截图存到 scratchpad。
- [ ] **Step 7:** `npm run lint`，关掉开发服务器，提交 `feat: timeline page`。

---

### Task 9: 收尾与交付

**Files:**
- Modify: `ARCHITECTURE.md`（路由表加 `/timeline`，接口表加 Task 4 和 Task 7 的接口，数据模型加两张新表，关于页说明改为后台可编辑）

- [ ] **Step 1:** 更新 `ARCHITECTURE.md`。
- [ ] **Step 2:** `npm test`、`npm run lint`。Expected: 全部通过。
- [ ] **Step 3:** `free -m` 确认 available ≥ 1500，然后
  `DATABASE_URL=postgres://build:build@127.0.0.1:1/build NODE_OPTIONS=--max-old-space-size=1280 systemd-run --user --scope -q -p MemoryMax=1500M -p MemorySwapMax=256M -p CPUWeight=30 npm run build`。
  Expected: 构建成功，路由清单里 `/about` 标为动态（ƒ）。如果因内存被杀（exit 137），不要重试，记下来告诉站长，由他重建镜像时的构建来验证。
- [ ] **Step 4:** `docker rm -f pw-about-dev-db`，删掉 `.next`。`.env.local` 留着。提交 `docs: update architecture for about, timeline and share cards`。
- [ ] **Step 5:** 向站长交付，说明：
  - 分支名和提交列表。没有推送。
  - 请他重建测试容器。重建后需要在测试环境的环境变量里加 `SITE_URL=http://100.79.95.29:8030`（这个文件只有他能改），不加的话分享卡片图的链接会指向 `localhost`。生产环境同理，填正式域名。
  - 生产数据库需要他执行一次 `prisma db push` 才有两张新表。
  - 附上 Task 5、7、8 的截图和两张分享卡片图。
- [ ] **Step 6:** 站长重建容器后，在 `http://100.79.95.29:8030` 上逐条执行 spec「怎么算做完」的 14 条，把每条的结果报告给他。
