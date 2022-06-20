FROM node:16-alpine AS buildImage

# --- BACKEND --- #
# Start with Backend
WORKDIR /tmp/build/new-backend
COPY /new-backend ./
RUN npm ci
RUN npm run compile

# Note: Before building Client, we will want to grab the current GIT
# commit hash. So we must copy the .git directory first.
WORKDIR /tmp/build
COPY /.git .

# --- BACKEND END --- #

# --- CLIENT --- #
# Next, Client UI
WORKDIR /tmp/build/new-client
COPY /new-client .

# Install git, it's needed for the prebuild.js script
RUN apk update
RUN apk add git

# Install packages
RUN npm ci

# Use a special appConfig for Docker
RUN rm ./public/appConfig.json
RUN mv ./public/appConfig.docker.json ./public/appConfig.json

# Now let's build, including running the prebuild.js script. 
# This ensure that some <meta> tags are added to index.html
RUN npm run build
RUN apk del git
# --- CLIENT END --- #

# --- ADMIN --- #
# Next, go on with Admin UI
WORKDIR /tmp/build/new-admin
COPY /new-admin .
RUN npm ci
RUN rm ./public/config.json
RUN mv ./public/config.docker.json ./public/config.json 
RUN npm run build
# --- ADMIN --- #

# --- FINAL ASSEMBLY --- #
# Finally, let's assembly it all into another image
FROM node:16-alpine
WORKDIR /usr/app

# Copy NPM package files from Backend
COPY /new-backend/package*.json ./
RUN npm ci --production

# Move the built Backend into app's root at /usr/app
COPY --from=buildImage /tmp/build/new-backend/dist ./

# Copy some more necessary files. There's a great chance that 
# they'll be mounted when running anyway, but if someone forgets
# that, it's good to have them around so we get running with the defaults. 
COPY /new-backend/.env .
COPY /new-backend/App_Data ./App_Data
COPY /new-backend/static ./static

# Move the built Client and Admin dirs into static
COPY --from=buildImage /tmp/build/new-client/build ./static/client
COPY --from=buildImage /tmp/build/new-admin/build ./static/admin
# --- FINAL ASSEMBLY END --- #

# Go!
CMD node index.js

