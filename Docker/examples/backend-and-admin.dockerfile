# EXAMPLE ONLY, NOT FOR PRODUCTION. See Docker/README.md.
#
# Backend and Admin only, for developing the Client outside Docker. Uses the
# same Node.js images as the official Dockerfile in the repository root.

# Stage 1 - Building the backend
FROM node:24-alpine AS backend-builder
WORKDIR /usr/app
COPY /apps/backend/package*.json ./
RUN npm ci
COPY ./apps/backend .
RUN npm run compile

# Stage 2 - Building the admin
FROM node:24-alpine AS admin-builder
WORKDIR /usr/app
COPY /apps/admin/package*.json ./
RUN npm ci
COPY ./apps/admin .
RUN rm ./public/config.json
RUN mv ./public/config.docker.json ./public/config.json
RUN npm run build

# Stage 3 - Combine everything and fire it up
FROM node:24-slim
WORKDIR /usr/app
COPY /apps/backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend-builder /usr/app/dist ./
COPY /apps/backend/.env.example ./.env
COPY /apps/backend/App_Data ./App_Data
COPY /apps/backend/static ./static
COPY --from=admin-builder /usr/app/build ./static/admin
VOLUME /usr/app/App_Data
EXPOSE 3002
CMD ["node", "index.js"]
