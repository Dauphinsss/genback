#!/bin/sh
set -e

npx prisma migrate deploy

npx prisma db seed || echo "⚠️  No seed script found, skipping..."

exec node dist/src/main