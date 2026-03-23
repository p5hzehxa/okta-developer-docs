#!/bin/bash
set -e
export SLACK_CHANNEL='#tmp-test-slack-notif'

send_slack_message "${SLACK_CHANNEL}" \
    ":white_check_mark:" \
    "Author: \n GH:  \n Bacon:"\
    "good"