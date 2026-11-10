#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  npm install
fi
printf '\nOpen http://127.0.0.1:5173/ in your browser. Stop with Ctrl+C.\n\n'
npm run dev
