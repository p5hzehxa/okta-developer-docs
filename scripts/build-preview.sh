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
yarn build-with-redirect

echo "Deploying preview to Netlify..."

if [ -n "$BRANCH" ]; then
  NETLIFY_ALIAS="${BRANCH//./-}"

  npx netlify-cli@17.23.5 deploy --alias="${NETLIFY_ALIAS}" --filter @okta/vuepress-site --dir ../packages/@okta/vuepress-site/dist

  export PREVIEW_URL="https://${NETLIFY_ALIAS}--dev-docs-preview.netlify.app"

  echo "Preview link:"
  echo "${PREVIEW_URL}"

  export SHA_LINK="https://github.com/okta/okta-developer-docs/commit/${SHA}"
  export BACON_LINK="https://bacon-go.aue1e.saasure.net/commits?artifact=okta-developer-docs&sha=${SHA}"
  export BRANCH_LINK="https://github.com/okta/okta-developer-docs/compare/${BRANCH}"

  if [[ -n "$AUTHOR" ]]; then
    AUTHOR_USERNAME="${AUTHOR%@*}"
    export AUTHOR_SLACK_HANDLE="@${AUTHOR_USERNAME}"
  else
    echo "Error: AUTHOR environment variable is not set. Cannot determine Slack handle for notifications. Exiting..."
    exit 1
  fi

  send_slack_message "${AUTHOR_SLACK_HANDLE}" \
      "Preview for your topic branch <${BRANCH_LINK}|${BRANCH}> is ready :white_check_mark:" \
      "Preview: ${PREVIEW_URL} \n Bacon: <${BACON_LINK}|${SHA}>"\
      "good"

else
  echo "No pull request detected. Not deploying to Netlify."
fi
