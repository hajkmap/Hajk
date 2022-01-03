# Stage 1 - Building the backend
FROM node:alpine as backendBuilder
WORKDIR /usr/app
COPY /new-backend/package*.json ./
RUN npm install
COPY ./new-backend .
RUN npm run compile

# Stage 2 - Building the admin
FROM node:alpine as adminBuilder
WORKDIR /usr/app
COPY /new-admin/package*.json ./
RUN npm install
COPY ./new-admin .
RUN rm ./public/config.json
RUN mv ./public/config.docker.json ./public/config.json 
RUN npm run build

# Stage 3 - Combine everything and fire it up
FROM node:14-alpine
WORKDIR /usr/app
COPY /new-backend/package*.json ./
RUN npm install --production
COPY --from=backendBuilder /usr/app/dist ./
COPY /new-backend/.env .
COPY /new-backend/App_Data ./App_Data
COPY /new-backend/static ./static
COPY --from=adminBuilder /usr/app/build ./static/admin
VOLUME /usr/app/App_Data
EXPOSE 3002
CMD node index.js
