#!/bin/bash
set -e
if [[ -n "$AUTHOR" ]]; then
  AUTHOR_USERNAME="${AUTHOR%@*}"
  export AUTHOR_SLACK_HANDLE="@${AUTHOR_USERNAME}"
else
  export AUTHOR_SLACK_HANDLE="@"
fi

PREVIEW_URL="https://${BRANCH}--dev-docs-preview.netlify.app"

export PREVIEW_URL

echo "=== All Environment Variables ==="
env | sort
echo "================================="

send_slack_message "${AUTHOR_SLACK_HANDLE}" \
    "Preview for your topic branch ${BRANCH} is ready :white_check_mark:" \
    "Preview: ${PREVIEW_URL} \n GH:  \n Bacon: <${BACON_LINK}|${SHA}>"\
    "good"
