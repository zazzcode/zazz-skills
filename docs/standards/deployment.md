---
last_updated_at: 2026-05-25
---

# Deployment

This stack-specific baseline governs how a Python backend is packaged and deployed to AWS Lambda via the Serverless framework. It covers
the vendored WSGI handler that bridges Flask to Lambda's event model, the exact sequence required to build a correct
deployment artifact, the three-way coupling between the artifact config, the Serverless handler declaration, and the
Flask entrypoint module, and the scope boundary between Serverless and Terraform. Rules apply to anyone authoring or
modifying `backend/serverless.yml`, `backend/justfile` (the `serverless-bundle-dist` recipe), `backend/package.json`,
or the files under `backend/vendor/serverless-wsgi/`.

Canonical reference path: in-code comments pointing to this standard should use `docs/standards/deployment.md`.

## Lambda packaging — vendored WSGI handler

AWS Lambda requires a `lambda_handler(event, context)` entrypoint. The Flask application does not expose one natively;
a WSGI adapter bridges the two. The project vendors the relevant files from the `serverless-wsgi` library at
`backend/vendor/serverless-wsgi/` rather than consuming the `serverless-wsgi` Serverless plugin from npm. The vendored
copy was introduced to escape a cascade of incompatibilities between the `serverless-wsgi` npm plugin, Serverless v3,
and `uv` — copying the two relevant source files into the vendor directory decoupled packaging from plugin versioning
entirely
(backend-lambda-deployment-guide.md;
vendor/serverless-wsgi/).

The two vendored files are `wsgi_handler.py` and `serverless_wsgi.py`. They are the only copies of this logic the
project uses. The `serverless-wsgi` npm plugin must not be re-added to `backend/package.json`. `package.json` should
contain only the Serverless framework dependency needed by this deployment path
(backend/package.json).

If the vendored files need to be updated (e.g., for a Python compatibility fix), update them in place under
`backend/vendor/serverless-wsgi/` — do not introduce an npm plugin dependency.

## Artifact build sequence

The `serverless-bundle-dist` recipe in `backend/justfile` produces the deployment artifact. The recipe has five
required steps that must all be present and must execute in order
(justfile:serverless-bundle-dist;
backend-lambda-deployment-guide.md):

1. Remove any pre-existing `dist/` directory and create a clean one by installing production Python dependencies via
   `uv pip install --requirement requirements.txt --target dist`.
1. Copy the full application source tree into `dist/` with `cp -r src/* dist/`.
1. Copy `vendor/serverless-wsgi/serverless_wsgi.py` and `vendor/serverless-wsgi/wsgi_handler.py` into `dist/`.
1. Emit the `.serverless-wsgi` JSON config into `dist/` with the `app` key set to the Flask entrypoint expression.
1. Zip the entire `dist/` directory into the artifact filename declared in `serverless.yml` under `package.artifact:`.

Omitting any of these steps produces a broken artifact: missing vendor files mean Lambda cannot find the handler; a
missing `.serverless-wsgi` config means the handler cannot locate the Flask app; a filename mismatch between the zip
and `package.artifact:` means Serverless uploads the wrong file.

### Desired ✅

```just
serverless-bundle-dist:
    @echo "Removing any pre-existing dist directory..."
    rm -rf dist
    @echo "Creating requirements.txt file from uv.lock..."
    uv export --format requirements.txt --no-dev --output-file requirements.txt --locked --no-hashes --no-editable
    @echo "Installing production dependencies into dist directory..."
    uv pip install --requirement requirements.txt --target dist
    @echo "Removing requirements.txt file..."
    rm requirements.txt
    @echo "Copying source code into dist directory..."
    cp -r src/* dist/
    @echo "Copying WSGI <--> AWS Lambda handler files into dist directory..."
    cp vendor/serverless-wsgi/serverless_wsgi.py dist/
    cp vendor/serverless-wsgi/wsgi_handler.py dist/
    echo '{"app":"http_app_entrypoint.app"}' > dist/.serverless-wsgi # the 'app' here MUST match the 'app' in the serverless.yml file
    @echo "Zipping dist directory into backend-api.zip..."
    cd dist && zip -r ../backend-api.zip . # this MUST match the artifact name in the serverless.yml file
```

### Three-way coupling — renaming the Flask entrypoint

Three values must stay in sync at all times
(justfile:serverless-bundle-dist;
serverless.yml:handler):

- The `app` value in the `.serverless-wsgi` JSON emitted by the justfile recipe (`"http_app_entrypoint.app"`)
- The `handler:` value in `serverless.yml` functions block (`wsgi_handler.handler` — this is fixed; it refers to the
  vendored `wsgi_handler.py`, not the Flask module)
- The module name and `app` attribute of the actual Flask application (`backend/src/http_app_entrypoint.py` exporting
  `app`)

The `handler:` field in `serverless.yml` always points at `wsgi_handler.handler` — that value is stable regardless of
Flask module renames, because `wsgi_handler.py` is the Lambda entrypoint that reads `.serverless-wsgi` at runtime to
find the Flask app. What changes on a rename is the `app` key in the emitted JSON and the module file name itself.
Renaming `http_app_entrypoint.py` requires updating the `.serverless-wsgi` emit in the justfile recipe in the same
commit.

## Serverless vs Terraform scope boundary

Serverless is responsible only for creating and updating the Lambda function and uploading the deployment artifact. VPC
configuration, IAM roles, networking, security groups, and all other infrastructure are managed by Terraform in a
separate repository. The `serverless.yml` file must not contain a `resources:` block or any other
infrastructure-provisioning blocks
(backend-lambda-deployment-guide.md §Serverless;
serverless.yml).

In this baseline, `serverless.yml` has no `resources:` block by design. It references VPC
security group IDs and subnet IDs via environment variables (injected by the deploy workflow at runtime) but does not
declare or modify those resources. Adding a `resources:` block to provision or modify AWS resources from Serverless
would create state drift against Terraform and could silently overwrite infrastructure managed by a separate team.

When infrastructure changes are needed (new VPC rules, IAM policy adjustments, subnet assignments), those changes
belong in Terraform, not in `serverless.yml`. The deploy workflow at `.github/workflows/backend-serverless-deploy.yml`
is the integration point: it assumes an AWS role and injects the environment variables that Serverless consumes, but
does not create infrastructure
(backend-serverless-deploy.yml).

## Related standards

- ci-workflows.md — covers how
  `backend-serverless-deploy.yml` is triggered, its permission shape, and the `push:` + `workflow_dispatch:` +
  `concurrency:` pattern that governs all deploy workflows.
