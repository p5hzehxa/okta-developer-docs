#!/bin/bash
set -e

echo "Checking required secrets..."

get_terminus_secret "/" NETLIFY_AUTH_TOKEN NETLIFY_AUTH_TOKEN
get_terminus_secret "/" NETLIFY_SITE_ID NETLIFY_SITE_ID

if [ -z "$NETLIFY_AUTH_TOKEN" ] || [ -z "$NETLIFY_SITE_ID" ]; then
  echo "Missing required secrets."
  exit 1
fi

Xvfb :99 -screen 0 1366x768x16 &

export DBUS_SESSION_BUS_ADDRESS=/dev/null
export DISPLAY=:99.0

yum update -y
yum -y install gtk2-2.24* xorg-x11-server-Xvfb libXtst* libXScrnSaver* GConf2* alsa-lib* gtk3

setup_service node v16.14.0
setup_service yarn 1.21.1

# echo "Installing NVM..."

# export NVM_DIR="$HOME/.nvm"

# if [ ! -d "$NVM_DIR" ]; then
#   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
# fi

# [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# echo "Installing Node 16..."

# setup_service node v16.20.2

# echo "Installing Yarn..."
# npm install -g yarn

echo "Installing dependencies..."
yarn install --frozen-lockfile --ignore-platform

# echo "Building preview..."
# yarn build

# echo "Deploying preview to Netlify..."

# if [ -n "$BRANCH" ]; then
#   npx netlify-cli@17.23.5 deploy --alias="${BRANCH}" --filter @okta/vuepress-site --dir ../packages/@okta/vuepress-site/dist

#   echo "Preview link:"
#   echo "https://${BRANCH}--dev-docs-preview.netlify.app"

# else
#   echo "No pull request detected. Not deploying to Netlify."
# fi
