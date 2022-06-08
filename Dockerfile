# Stage 1 - Building the backend
FROM node:16-alpine as backendBuilder
WORKDIR /usr/app
COPY /new-backend/package*.json ./
RUN npm ci
COPY ./new-backend .
RUN npm run compile

# Stage 2 - Building the client
FROM node:16-alpine as clientBuilder
WORKDIR /usr/app
COPY /new-client/package*.json ./
RUN npm ci --ignore-scripts
COPY ./new-client .
RUN rm ./public/appConfig.json
RUN mv ./public/appConfig.docker.json ./public/appConfig.json
RUN npm run build --ignore-scripts

# Stage 3 - Building the admin
FROM node:16-alpine as adminBuilder
WORKDIR /usr/app
COPY /new-admin/package*.json ./
RUN npm ci --ignore-scripts
COPY ./new-admin .
RUN rm ./public/config.json
RUN mv ./public/config.docker.json ./public/config.json 
RUN npm run build --ignore-scripts

# Stage 4 - Combine everything and fire it up
FROM node:14-alpine
WORKDIR /usr/app
COPY /new-backend/package*.json ./
RUN npm ci --production
COPY --from=backendBuilder /usr/app/dist ./
COPY /new-backend/.env .
COPY /new-backend/App_Data ./App_Data
COPY /new-backend/static ./static
COPY --from=clientBuilder /usr/app/build ./static/client
COPY --from=adminBuilder /usr/app/build ./static/admin
VOLUME /usr/app/App_Data
EXPOSE 3002
CMD node index.js

# See HAJK Docker/README.md for example usage
