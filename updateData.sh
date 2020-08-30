#!/bin/bash
vnstat -i wwp0s26u1u3i4 -d --json | python -m json.tool > ./data.json
git add data.json
git commit -m 'Update data' --author="crontab <crontab@example.com>"
git push origin master