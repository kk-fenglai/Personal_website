#!/bin/sh
set -e
export LT_HOST="${LT_HOST:-0.0.0.0}"
export LT_PORT="${PORT:-5000}"
exec libretranslate
