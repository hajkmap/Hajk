#!/bin/bash

# README
# Super quick and dirty, 30 secs script. Does what it says. 
# I got tired of typing it all over again while switching 
# branches with differences in package.json, so here it is.

echo "Backend…"
cd new-backend
rm -rf node_modules
npm i
npm audit fix

echo "Admin…"
cd ../new-admin
rm -rf node_modules
npm i
npm audit fix

echo "Client…"
cd ../new-client
rm -rf node_modules
npm i
npm audit fix

cd ..

echo "DONE!"