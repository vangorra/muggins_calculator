#!/usr/bin/env bash
set -e

CI_SUFFIX=""
if [[ -n "${CI:-}" ]]; then
  CI_SUFFIX=":ci"
fi

echo ""
echo "=== Installing dependencies ==="
npm install

echo ""
echo "=== Formatting code ==="
npm run "format${CI_SUFFIX}"

echo ""
echo "=== Linting code ==="
npm run "lint${CI_SUFFIX}"

echo ""
echo "=== Generating icons ==="
ngx-pwa-icons

echo ""
echo "=== Building ==="
npm run build

echo ""
echo "=== Testing ==="
npm run "test${CI_SUFFIX}"
