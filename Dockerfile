# Production Dockerfile for Next.js standalone output

FROM node:20-bullseye AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy rest of the source
COPY . .

# Generate Prisma client (if DATABASE_URL provided in build-time env, otherwise it will be generated at runtime)
RUN npm run db:generate || true

# Build the Next app (standalone output)
RUN npm run build

# Final image
FROM node:20-bullseye-slim
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone/ ./
# Also copy node_modules and prisma and public for runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

EXPOSE 3000

# Start the standalone server
CMD ["node", "server.js"]
