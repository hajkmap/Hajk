#!/bin/bash

# README 
# Quick and easy script that removes and reinstalls the contents
# of node_modules dirs inside all NodeJS apps in this repo.

ORIGINAL_DIR=$(pwd)

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Grab the relevant directories, relative to the script
CLIENT_DIR="$SCRIPT_DIR/../apps/client"
ADMIN_DIR="$SCRIPT_DIR/../apps/admin"
BACKEND_DIR="$SCRIPT_DIR/../apps/backend"

echo "Backend…"
cd $BACKEND_DIR
rm -rf node_modules
npm i
npm audit fix

echo "Admin…"
cd $ADMIN_DIR
rm -rf node_modules
npm i
npm audit fix

echo "Client…"
cd $CLIENT_DIR
rm -rf node_modules
npm i
npm audit fix

cd $ORIGINAL_DIR

echo "DONE!"