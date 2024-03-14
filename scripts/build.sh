#!/bin/bash

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


show_usage() {
	echo "Usage: $0 git_dir dest_dir" 1>&2
	exit 1
}

prompt() {
	read -p "Warning: This will RESET ALL LOCAL CHANGES with those in origin.

Press (y) to continue or any other key to abort." -n 1 -r
	echo
	if [[ ! $REPLY =~ ^[Yy]$ ]]
	then
			exit 1
	fi
}

# Main program starts here

if [ $# -ne 2 ]; then
	show_usage
else # There are two arguments
	if [ -d $1 ]; then 
		# First argument is a valid directory, use it
		GIT_DIR=$1
	else 
		echo 'Invalid git directory'
		show_usage
	fi
	if [ -d $2 ]; then
		# Second argument is a valid directory too
		DEST_DIR=$2
	else 
		echo 'Invalid destination directory'
		show_usage
	fi
fi

# Resolve relative paths
GIT_DIR=$(cd $GIT_DIR && pwd)
DEST_DIR=$(cd $DEST_DIR && pwd)

echo "Building from git directory: ${GIT_DIR}"
echo "Deploying build to destination: ${DEST_DIR}"

# Got to our repo dir and grab the latest from Git
echo "On branch $(git rev-parse --abbrev-ref HEAD)"

# Let's ensure that user wants to overrite local changes
prompt
echo "Downloading the latest code..." 

cd $GIT_DIR
git fetch --all
git reset --hard
git pull

# BACKEND
echo "Part 1: Backend"
echo "Installing backend dependencies..."
cd $GIT_DIR/new-backend
# Before we can compile, we need to install NPM deps. 
# Make sure to get the latest by first removing the dir entirely. 
rm -rf node_modules/
npm ci

# Build. Will create the dist directory.
echo "Building backend..."
npm run compile

echo "Copying backend to destination..."
# Copy the results
cp -r dist/* $DEST_DIR
cp package*.json $DEST_DIR

# Install deps in the final destination
cd $DEST_DIR
rm -rf node_modules
npm ci

# Next step is to build client and admin and put them to $DEST_DIR/static
# so that backend can serve them. Make sure that you've enabled that
# functionality in your .env too!

# Ensure that the static dir exists, if not, create it
mkdir -p $DEST_DIR/static

# CLIENT
echo "Part 2: Client UI"
echo "Preparing to install client dependencies..."
cd $GIT_DIR/new-client
rm -rf node_modules/
echo "Installing client dependencies..."
npm ci

echo "Building Client UI..."
npm run build
rm -rf $DEST_DIR/static/client/static
echo "Copying client to destination..."
cd build
cp -r static $DEST_DIR/static/client
cp asset-manifest.json $DEST_DIR/static/client
cp index.* $DEST_DIR/static/client
cp manifest.json $DEST_DIR/static/client

# ADMIN
echo "Part 3: Admin UI"
echo "Preparing to install admin dependencies..."
cd $GIT_DIR/new-admin
rm -rf node_modules/
echo "Installing admin dependencies..."
npm ci
echo "Building admin..."
npm run build
echo "Copying admin to destination..."
rm -rf $DEST_DIR/static/admin/static
rm -rf $DEST_DIR/static/admin/precache-manifest*
cd build
cp -r static $DEST_DIR/static/admin
cp asset-manifest.json $DEST_DIR/static/admin
cp index.* $DEST_DIR/static/admin
cp manifest.json $DEST_DIR/static/admin
cp precache*.js $DEST_DIR/static/admin

echo "All done, the latest Hajk is now installed in ${DEST_DIR}"
