#!/bin/bash
if [ -z "$GITHUB_PKG_TOKEN" ]; then
  echo "Enter your GitHub Personal Access Token:"
  read -r GITHUB_PKG_TOKEN
fi

cat > ~/.npmrc << EOF
//npm.pkg.github.com/:_authToken=${GITHUB_PKG_TOKEN}
@silvatechb:registry=https://npm.pkg.github.com
EOF

echo "Authenticating with GitHub Packages..."
echo "Publishing @silvatechb/silva-md-bot to GitHub Packages..."
npm publish 2>&1
echo ""
echo "Done! Check https://github.com/SilvaTechB?tab=packages"
