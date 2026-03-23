#!/bin/bash
set -e
export SLACK_CHANNEL='#tmp-test-slack-notif'
# Strip anything after @ in AUTHOR for slack handle
if [[ -n "$AUTHOR" ]]; then
  AUTHOR_SLACK="${AUTHOR%@*}"
  export SLACK_CHANNEL_PERSONAL="@${AUTHOR_SLACK}"
else
  export SLACK_CHANNEL_PERSONAL="@"
fi
export SLACK_CHANNEL_PERSONAL2='@Ishan Krishna'

echo "=== All Environment Variables ==="
env | sort
echo "================================="

# send_slack_message "${SLACK_CHANNEL}" \
#     ":white_check_mark:" \
#     "Author: \n GH:  \n Bacon:"\
#     "good"

send_slack_message "${SLACK_CHANNEL_PERSONAL}" \
    ":white_check_mark:" \
    "Author2: \n GH:  \n Bacon:"\
    "good"

# send_slack_message "${SLACK_CHANNEL_PERSONAL2}" \
#     ":white_check_mark:" \
#     "Author3: \n GH:  \n Bacon:"\
#     "good"