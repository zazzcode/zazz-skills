---
last_review_sha: 7e21e4619cca7bff91ad10e06bb5a94fa5f5b167
---

# AWS Lambda Deployment

This is a small doc to cover how we deploy to AWS lambda in more detail.

## Serverless

We use a framework called Serverless to take our application code and ship it off to AWS Lambda. Serverless is
partially an orchestration tool for infrastructure, but we don't use much of that (infrastructure is mostly maintained
by other IaaC tools like terraform separately).

**Note:** As of 2025/09/17, we use Serverless v3. Serverless v4 is the current major version and v3 is EOL. We haven't
moved yet due to breaking changes and how v4 does licensing differently from v3.

AWS Lambda's core contract is that it expects application code to have an entrypoint of the below shape:

```python
def lambda_handler(event, context):
    ...
```

Our code doesn't typically have entrypoints like that. Our main (and only as of 2025/09/17) entrypoint into the
application for deployed scenarios is via a Flask server listening on a port number. ...Which is where plugins for
`serverless` come in that know how to take a WSGI compatible application, create a `lambda_handler()` function that AWS
Lambda can wire itself to, and invoke the WSGI application with the arguments passed from AWS to the lambda handler.

In the python and serverless ecosystem, that job is maintained by the `serverless-wsgi` Serverless plugin.

However, when working with `serverless-wsgi` (and other Serverless plugins), especially due to being on the v3
Serverless major version deep into EOL, we were hitting a small cascade of incompatibilities.

Additionally, these plugins were written before `uv` existed/was mature in the ecosystem. And `uv` ...just does so many
things well that we decided to copy the WSGI \<--> AWS Lambda handler transformation logic from `serverless-wsgi`
plugin directly into our codebase (see /vendor/serverless-wsgi/\*) and do everything else in house.

So, today, for a deploy via the Serverless framework, we:

- Create a `./dist` directory with the prod dependencies and application source code
- Copy two files from the vendored `serverless-wsgi` code:
  - `wsgi_handler.py`
  - `serverless_wsgi.py`
- Add in a JSON config file used by those `serverless-wsgi` files to find the application entrypoint
- Zip all of that together into a filename specified in the `serverless.yml` doc
- Invoke `serverless deploy`

The result is that `serverless` stays responsible only for creating the lambda and installing (or updating) the source
directory into the lambda.
