#!/bin/bash
set -e
export SLACK_CHANNEL='#tmp-test-slack-notif'
echo "1"
send_slack_message \"'@Ishan Krishna'\" \"MY_TASK\" \"Uh oh\" \"danger\" \"high\" \"Additional plain text message\"
echo "2"
send_slack_message \"'#test-ci-notify-alias'\" \"MY_TASK\" \"Uh oh\" \"danger\" \"high\" \"Additional plain text message\"
echo "3"
send_slack_message \"#test-ci-notify-alias\" \"MY_TASK\" \"Uh oh\" \"danger\" \"high\" \"Additional plain text message\"
echo "4"
send_slack_message \"'@ishan.krishna'\" \"MY_TASK\" \"Uh oh\" \"danger\" \"high\" \"Additional plain text message\"
send_slack_message \"'#tmp-test-slack-notif'\" \"MY_TASK\" \"Uh oh\" \"danger\" \"high\" \"Additional plain text message\"
echo "3"
send_slack_message \"#tmp-test-slack-notif\" \"MY_TASK\" \"Uh oh\" \"danger\" \"high\" \"Additional plain text message\"


send_slack_message "${SLACK_CHANNEL}" \
    ":white_check_mark:" \
    "Author: \n GH:  \n Bacon:"\
    "good"