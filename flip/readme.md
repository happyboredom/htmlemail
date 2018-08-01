Set up credentials
----
```
serverless config credentials --provider aws \
 --key <key> \
 --secret <secret> \
 --profile serverless-admin
```


Run a command to test
----
```
AWS_PROFILE=serverless-admin serverless invoke --function search
```

Push to staging server
----

```
# make sure using correct virtualenv...

AWS_PROFILE=serverless-admin serverless deploy
```


Test a function locally
----
```
serverless invoke local --function <function>
```