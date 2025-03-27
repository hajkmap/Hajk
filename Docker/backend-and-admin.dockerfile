# Stage 1 - Building the backend
FROM node:20-alpine as backendBuilder
WORKDIR /usr/app
COPY /apps/backend/package*.json ./
RUN npm install
COPY ./apps/backend .
RUN npm run compile

# Stage 2 - Building the admin
FROM node:20-alpine as adminBuilder
WORKDIR /usr/app
COPY /apps/admin/package*.json ./
RUN npm install
COPY ./apps/admin .
RUN rm ./public/config.json
RUN mv ./public/config.docker.json ./public/config.json 
RUN npm run build

# Stage 3 - Combine everything and fire it up
FROM node:20-alpine
WORKDIR /usr/app
COPY /apps/backend/package*.json ./
RUN npm install --production
COPY --from=backendBuilder /usr/app/dist ./
COPY /apps/backend/.env .
COPY /apps/backend/App_Data ./App_Data
COPY /apps/backend/static ./static
COPY --from=adminBuilder /usr/app/build ./static/admin
VOLUME /usr/app/App_Data
EXPOSE 3002
CMD node index.js
