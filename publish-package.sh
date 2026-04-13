#!/bin/bash
echo "//npm.pkg.github.com/:_authToken=${GITHUB_PKG_TOKEN}" > ~/.npmrc
echo "@silvatechb:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "Publishing @silvatechb/silva-md-bot to GitHub Packages..."
npm publish 2>&1
echo ""
echo "Done! Check https://github.com/SilvaTechB?tab=packages"
