---
last_review_sha: 7e21e4619cca7bff91ad10e06bb5a94fa5f5b167
---

# AWS Lambda Deployment

This stack-specific baseline describes one way to deploy a Python WSGI application to AWS Lambda with Serverless. Teams
that use containers, direct Lambda handlers, another cloud provider, or a different infrastructure-as-code tool should
replace this document with equivalent deployment guidance for their stack.

## Serverless

This baseline uses the Serverless framework to package application code and deploy it to AWS Lambda. Serverless can
also orchestrate infrastructure, but this example assumes durable infrastructure is maintained separately by an
infrastructure-as-code tool such as Terraform.

Adopting teams must pin and document the Serverless major version they use. If the selected major version is past end
of life, the standard must also document the upgrade blocker, the owner, and the plan for replacing or upgrading it.

AWS Lambda's core contract is that it expects application code to have an entrypoint of the below shape:

```python
def lambda_handler(event, context):
    ...
```

WSGI applications do not typically expose a native Lambda handler. Instead, a WSGI adapter creates a
`lambda_handler()` function that AWS Lambda can invoke and forwards the event/context pair into the WSGI application.

In the python and serverless ecosystem, that job is maintained by the `serverless-wsgi` Serverless plugin.

However, Serverless plugins can become compatibility risks when the Serverless major version, Python package manager,
or plugin maintenance state drifts.

If the repo vendors WSGI adapter code, keep the copied code under a repo-relative vendor path such as
`backend/vendor/serverless-wsgi/`, document the upstream source and version, and make the deployment build use the
vendored copy consistently. Do not depend on a globally installed plugin or a local checkout outside the repository.

For a deploy via the Serverless framework, this baseline expects the build to:

- Create a `./dist` directory with the prod dependencies and application source code
- Copy two files from the vendored `serverless-wsgi` code:
  - `wsgi_handler.py`
  - `serverless_wsgi.py`
- Add in a JSON config file used by those `serverless-wsgi` files to find the application entrypoint
- Zip all of that together into a filename specified in the `serverless.yml` doc
- Invoke `serverless deploy`

The result is that `serverless` stays responsible only for creating the lambda and installing (or updating) the source
directory into the lambda.
