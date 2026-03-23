#!/bin/bash
set -e

echo "Checking required secrets..."

get_terminus_secret "/" NETLIFY_AUTH_TOKEN NETLIFY_AUTH_TOKEN
get_terminus_secret "/" NETLIFY_SITE_ID NETLIFY_SITE_ID

if [ -z "$NETLIFY_AUTH_TOKEN" ] || [ -z "$NETLIFY_SITE_ID" ]; then
  echo "Missing required secrets."
  exit 1
fi

echo "Installing Node 16..."

setup_service node v16.20.2

echo "Installing Yarn..."
npm install -g yarn

echo "Installing dependencies..."
yarn install --frozen-lockfile --ignore-platform

echo "Building preview..."

if [ "$WITH_REDIRECTS" = "true" ]; then
  echo "Building with redirects..."
  yarn build-with-redirect
else
  echo "Building without redirects..."
  yarn build
fi

echo "Deploying preview to Netlify..."

if [ -n "$BRANCH" ]; then
  npx netlify-cli@17.23.5 deploy --alias="${BRANCH}" --filter @okta/vuepress-site --dir ../packages/@okta/vuepress-site/dist

  echo "Preview link:"
  echo "https://${BRANCH}--dev-docs-preview.netlify.app"

else
  echo "No pull request detected. Not deploying to Netlify."
fi
