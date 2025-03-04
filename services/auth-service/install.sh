#!/usr/bin/sh
set -e

mkdir -p node_modules
rm -rf node_modules

npm install

exec npm run dev