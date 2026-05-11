#!/usr/bin/env bash
set -e

npm install --include=optional

NEXT_VERSION=$(node -p "require('./node_modules/next/package.json').version")

npm install --no-save "@next/swc-linux-x64-gnu@$NEXT_VERSION"

npm run build
