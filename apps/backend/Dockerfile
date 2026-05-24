# Node.js backend production Dockerfile (monorepo — build from repo root)
FROM node:20-alpine
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend
RUN npm ci --include=dev && npm run build --workspace=backend
WORKDIR /repo/apps/backend
EXPOSE 4000
CMD ["node", "dist/index.js"]
