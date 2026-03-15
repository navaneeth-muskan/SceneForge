FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
ARG GCP_PROJECT_ID=build-project
ARG BUCKET_NAME=build-bucket
ARG GOOGLE_GENAI_API_KEY=build-key
ENV SERVICE_ACCOUNT_FILE=digital-scanning-service_account.json
ENV GCP_PROJECT_ID=${GCP_PROJECT_ID}
ENV BUCKET_NAME=${BUCKET_NAME}
ENV GOOGLE_GENAI_API_KEY=${GOOGLE_GENAI_API_KEY}
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080
ENV NEXT_TELEMETRY_DISABLED=1
ENV SERVICE_ACCOUNT_FILE=digital-scanning-service_account.json
ENV GCP_PROJECT_ID=digital-scanning
ENV BUCKET_NAME=gemini-video-analyser

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/digital-scanning-service_account.json ./digital-scanning-service_account.json

EXPOSE 8080
CMD ["sh", "-c", "npm run start -- -p ${PORT:-8080} -H 0.0.0.0"]
