# Stage 1 - Building the backend
FROM node:24-alpine as backendBuilder
WORKDIR /usr/app
COPY ./apps/backend .
RUN npm ci

# Stage 2 - Building the admin
FROM node:24-alpine as adminBuilder
WORKDIR /usr/app
COPY /apps/admin/package*.json ./
RUN npm install
COPY ./apps/admin .
RUN rm ./public/config.json
RUN mv ./public/config.docker.json ./public/config.json
RUN npm run build

# Stage 3 - Combine everything and fire it up
FROM node:24-alpine
WORKDIR /usr/app
COPY /apps/backend/package*.json ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=backendBuilder /usr/app/server ./server
COPY --from=backendBuilder /usr/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backendBuilder /usr/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY /apps/backend/.env.example ./.env
COPY /apps/backend/App_Data ./App_Data
COPY /apps/backend/static ./static
COPY --from=adminBuilder /usr/app/build ./static/admin
VOLUME /usr/app/App_Data
EXPOSE 3002
CMD ["npm", "run", "start"]
