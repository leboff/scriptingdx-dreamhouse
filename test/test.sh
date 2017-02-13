#!/usr/bin/env bash

# Test Runner profile determine by Pipelines stage
JOB="basic"
if [ $HEROKU_TEST_RUN_BRANCH = "master" ]
then
   JOB=$HEROKU_TEST_RUN_BRANCH
fi

# Setup base org info file
echo '{
    "Company": "HEROKU-CI",
    "Email": "t.dvornik@salesforce.com",
    "Country": "US",
    "LastName": "Heroku CI"
}' > $XDG_DATA_HOME/.sfdx/sfdx-config.json

export SFDX_DISABLE_ENCRYPTION=true

echo "Invoking '$JOB' Test Runner job..."
CMD="force:testrunner:run -f test/test-runner-config.json -j $JOB -r tap"
heroku $CMD
