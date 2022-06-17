# Stage 1 - Building the backend
FROM node:18-alpine as backendBuilder
WORKDIR /usr/app
COPY /new-backend/package*.json ./
RUN npm ci
COPY ./new-backend .
RUN npm run compile

# Stage 2 - Building the client
FROM node:18-alpine as clientBuilder
RUN apk update
RUN apk add git
WORKDIR /usr/app
COPY /new-client/package*.json ./
RUN npm ci --ignore-scripts
# Grab the git dir so we can extract the latest commit ID in our prebuild.js
COPY ./.git .
COPY ./new-client .
RUN rm ./public/appConfig.json
RUN mv ./public/appConfig.docker.json ./public/appConfig.json
# Run the prebuild script. Will ensure that some <meta> tags are added to index.html
RUN node prebuild.js
RUN npm run build --ignore-scripts

# Stage 3 - Building the admin
FROM node:18-alpine as adminBuilder
WORKDIR /usr/app
COPY /new-admin/package*.json ./
RUN npm ci --ignore-scripts
COPY ./new-admin .
RUN rm ./public/config.json
RUN mv ./public/config.docker.json ./public/config.json 
# The NODE_OPTIONS below is due some deps having problem with OpenSSL v3 stuff
# that got there in Node v17. 
RUN NODE_OPTIONS=--openssl-legacy-provider npm run build --ignore-scripts

# Stage 4 - Combine everything and fire it up
# We fall back to Node v16 here, due to problems with starting up using legacy
# SSL cryptography. On v17+ we'd get an ERR_SSL_CA_MD_TOO_WEAK and a crash.
# Note that this only comes into play when using the LDAPS certificates. Non-LDAPS
# setups would fire up just fine on v17+.
FROM node:16-alpine
WORKDIR /usr/app
COPY /new-backend/package*.json ./
RUN npm ci --production
COPY --from=backendBuilder /usr/app/dist ./
COPY /new-backend/.env .
COPY /new-backend/App_Data ./App_Data
COPY /new-backend/static ./static
COPY --from=clientBuilder /usr/app/build ./static/client
COPY --from=adminBuilder /usr/app/build ./static/admin
CMD node index.js
