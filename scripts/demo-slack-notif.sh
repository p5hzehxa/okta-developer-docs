export BACON_LINK="https://bacon-go.aue1e.saasure.net/commits?artifact=okta-developer-docs&sha=${SHA}"
export BRANCH_LINK="https://github.com/okta/okta-developer-docs/compare/${BRANCH}"

if [[ -n "$AUTHOR" ]]; then
    AUTHOR_USERNAME="${AUTHOR%@*}"
    export AUTHOR_SLACK_HANDLE="@${AUTHOR_USERNAME}"
else
    echo "Error: AUTHOR environment variable is not set. Cannot determine Slack handle for notifications. Exiting..."
    exit 1
fi


export PREVIEW_URL="https://${BRANCH}--dev-docs-preview.netlify.app"

send_slack_message "${AUTHOR_SLACK_HANDLE}" \
    "Preview for your topic branch <${BRANCH_LINK}|${BRANCH}> is ready :white_check_mark:" \
    "Preview: ${PREVIEW_URL} \n Bacon: <${BACON_LINK}|${SHA}>"\
    "good"