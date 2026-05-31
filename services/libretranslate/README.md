# LibreTranslate（Docker 自建）

为 [davinlian.vercel.app](https://davinlian.vercel.app) 提供中文 → 英文/法文翻译 API。

---

## 一、Render 云端部署（最省事，推荐）

无需买 VPS、无需配域名 DNS，Render 自动给 HTTPS 地址。

1. 打开 [Render Dashboard](https://dashboard.render.com/) 并登录
2. **New +** → **Blueprint**
3. 连接 GitHub 仓库 `kk-fenglai/Personal_website`
4. Render 会读取仓库根目录 [`render.yaml`](../../render.yaml)，创建 `libretranslate` 服务
5. 选择 **Starter** 计划（约 $7/月，避免免费版休眠导致首次请求极慢）
6. 等待部署完成（首次约 5–15 分钟下载模型）
7. 打开该服务的 **Shell**，生成 API Key：
   ```bash
   ltmanage keys add davin-website
   ```
8. 复制服务公网 URL（形如 `https://libretranslate-xxxx.onrender.com`）

**Vercel 环境变量：**

| 变量 | 值 |
|------|-----|
| `LIBRETRANSLATE_URL` | Render 服务 URL（无末尾 `/`） |
| `LIBRETRANSLATE_API_KEY` | 上一步生成的 key |

Redeploy Vercel 后执行 `npm run db:backfill-thought-translations` 或在后台逐篇「重新生成翻译」。

> 免费版 Render 会在 15 分钟无访问后休眠，冷启动需重新加载模型；生产建议 Starter。

---

## 二、公网 VPS 部署（完全自控）

### 你需要准备

| 项目 | 说明 |
|------|------|
| VPS | 阿里云 / 腾讯云 / DigitalOcean 等，**≥ 2GB 内存** |
| 系统 | Ubuntu 22.04 或 24.04 |
| 域名 | 一条 **A 记录** 指向 VPS 公网 IP，例如 `translate.你的域名.com` |
| 防火墙 | 放行 **80、443**（HTTPS 证书自动申请） |

### 步骤

**1. 把本目录上传到 VPS**

```bash
# 在本机（项目根目录）
scp -r services/libretranslate root@你的VPS_IP:/opt/libretranslate
```

或在 VPS 上 `git clone` 整个仓库后进入 `services/libretranslate`。

**2. 配置域名**

```bash
cd /opt/libretranslate
cp .env.example .env
nano .env
```

写入：

```env
DOMAIN=translate.你的域名.com
```

**3. 一键部署**

```bash
sudo bash deploy-vps.sh
```

或手动：

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f
```

**4. 生成 API Key**

```bash
docker exec libretranslate ltmanage keys add davin-website
```

**5. 验证公网 HTTPS**

```bash
curl -X POST "https://translate.你的域名.com/translate" \
  -H "Content-Type: application/json" \
  -d '{"q":"你好","source":"zh","target":"en","format":"text","api_key":"你的key"}'
```

**6. 接到 Vercel**

Vercel → 项目 → Environment Variables：

| 变量 | 值 |
|------|-----|
| `LIBRETRANSLATE_URL` | `https://translate.你的域名.com`（无末尾 `/`） |
| `LIBRETRANSLATE_API_KEY` | 上一步生成的 key |

Redeploy 后在本机执行：

```bash
npm run db:backfill-thought-translations
```

---

## 三、本机开发（仅 localhost）

```bash
docker compose up -d
docker exec libretranslate ltmanage keys add davin-website
```

项目根目录 `.env`：

```env
LIBRETRANSLATE_URL=http://localhost:5000
LIBRETRANSLATE_API_KEY=你的key
```

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `Dockerfile` | Render / 云端 PaaS 构建镜像 |
| `docker-compose.yml` | 本机开发，暴露 5000 端口 |
| `docker-compose.prod.yml` | VPS 公网：LibreTranslate + Caddy（自动 HTTPS） |
| `Caddyfile` | 反向代理到 LibreTranslate |
| `deploy-vps.sh` | Ubuntu VPS 安装 Docker 并启动生产栈 |
| 仓库根目录 `render.yaml` | Render Blueprint 一键部署 |

---

## 安全建议

- 务必开启 `LT_API_KEYS=true`（生产 compose 已默认开启）
- 不要将 5000 端口直接暴露公网（生产 compose 仅 Caddy 暴露 80/443）
- API Key 只放在 Vercel 环境变量，不要提交到 Git

---

## 常用命令（VPS）

```bash
cd /opt/libretranslate

# 查看日志
docker compose -f docker-compose.prod.yml logs -f

# 重启
docker compose -f docker-compose.prod.yml restart

# 停止
docker compose -f docker-compose.prod.yml down
```

---

## 配置说明

| 环境变量 | 含义 |
|----------|------|
| `LT_LOAD_ONLY=zh,en,fr` | 只加载中/英/法，省内存 |
| `LT_API_KEYS=true` | 必须带 API Key 才能调用 |
| `lt-models` 卷 | 持久化语言模型 |

建议 VPS **≥ 2GB RAM**。
