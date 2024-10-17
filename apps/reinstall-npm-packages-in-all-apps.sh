#!/bin/sh

echo "Reinstalling npm packages in all apps..."

# Store current directory for later use
ORIGINAL_DIR=$(pwd)

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Grab the relevant directories, relative to the script
CLIENT_DIR="$SCRIPT_DIR/client"
ADMIN_DIR="$SCRIPT_DIR/admin"
BACKEND_DIR="$SCRIPT_DIR/backend"

cd $CLIENT_DIR
echo "Reinstalling npm packages in $CLIENT_DIR..."
rm -rf node_modules && npm i 

cd $ADMIN_DIR
echo "Reinstalling npm packages in $ADMIN_DIR..."
rm -rf node_modules && npm i 

cd $BACKEND_DIR
echo "Reinstalling npm packages in $BACKEND_DIR..."
rm -rf node_modules && npm i

# Return to original directory
cd $ORIGINAL_DIR

echo "Done!"