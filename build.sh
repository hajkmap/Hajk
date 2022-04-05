#!/bin/bash

# Copyright (C) 2021 Jacob Wodzyński <jacob.wodzynski@halmstad.se> (https://github.com/hajkmap)
# This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
# This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
# You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.
#
#
#
# README
#
# The following script will NOT copy/overwrite those files/directories:
# App_Data/
# logs/ (but backend will create it where needed)
# static/
# .env
#
# YOU NEED TO ENSURE THAT THEY EXIST MANUALLY!
#
# This script assumes that $GIT_DIR is a valid Hajk git repo.
# It will get the latest backend, client and admin and installed
# to $DEST_DIR. Backend will go directly to $DEST_DIR, while
# client and admin will be exposed via the static functionality
# built into backend. You will find the static build of them in
# $DEST_DIR/static/{admin|client}.
# You will be able to run the whole package (backend, as well as
# it serving the static client and admin apps) via one command:
# node index.js


GIT_DIR=/path/to/gitrepo/Hajk
DEST_DIR=/path/to/wwwroot/hajk

# Got to our repo dir and grab the latest from Git
cd $GIT_DIR
git fetch
git pull

# BACKEND
cd $GIT_DIR/new-backend
# Before we can compile, we need to install NPM deps. 
# Make sure to get the latest by first removing the dir entirely. 
rm -rf node_modules
npm install

# Build. Will create the dist directory.
npm run compile

# Copy the results
cp -r dist/* $DEST_DIR
cp package*.json $DEST_DIR

# Install deps in the final destination
cd $DEST_DIR
rm -rf node_modules
npm install

# Next step is to build client and admin and put them to $DEST_DIR/static
# so that backend can serve them. Make sure that you've enabled that
# functionality in your .env too!

# CLIENT
cd $GIT_DIR/new-client
rm -rf node_modules
npm install
npm run build
rm -rf $DEST_DIR/static/client/static
rm -rf $DEST_DIR/static/client/precache-manifest*
cd build
cp -r static $DEST_DIR/static/client
cp asset-manifest.json $DEST_DIR/static/client
cp index.* $DEST_DIR/static/client
cp manifest.json $DEST_DIR/static/client
cp precache*.js $DEST_DIR/static/client

# ADMIN
cd $GIT_DIR/new-admin
rm -rf node_modules
npm install
npm run build
rm -rf $DEST_DIR/static/admin/static
rm -rf $DEST_DIR/static/admin/precache-manifest*
cd build
cp -r static $DEST_DIR/static/admin
cp asset-manifest.json $DEST_DIR/static/admin
cp index.* $DEST_DIR/static/admin
cp manifest.json $DEST_DIR/static/admin
cp precache*.js $DEST_DIR/static/admin