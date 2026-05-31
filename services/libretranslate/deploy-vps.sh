#!/usr/bin/env bash
# 在 Ubuntu 22.04+ VPS 上安装 Docker 并启动 LibreTranslate（公网 HTTPS）
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "请使用 root 或 sudo 运行：sudo bash deploy-vps.sh"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo ">>> 安装 Docker..."
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f .env ]]; then
  echo ">>> 请先创建 .env（可复制 .env.example 并填写 DOMAIN）"
  echo "    cp .env.example .env && nano .env"
  exit 1
fi

# shellcheck disable=SC1091
source .env
if [[ -z "${DOMAIN:-}" || "$DOMAIN" == "translate.example.com" ]]; then
  echo ">>> 请在 .env 中设置真实域名 DOMAIN=translate.你的域名.com"
  exit 1
fi

echo ">>> 启动 LibreTranslate + Caddy（域名: $DOMAIN）"
docker compose -f docker-compose.prod.yml up -d

echo ""
echo ">>> 等待服务就绪（首次约 3–10 分钟下载模型）..."
sleep 5
docker compose -f docker-compose.prod.yml logs --tail=20 libretranslate

echo ""
echo ">>> 生成 API Key（若尚未生成）："
echo "    docker exec libretranslate ltmanage keys add davin-website"
echo ""
echo ">>> Vercel 环境变量："
echo "    LIBRETRANSLATE_URL=https://$DOMAIN"
echo "    LIBRETRANSLATE_API_KEY=<上一步输出的 key>"
