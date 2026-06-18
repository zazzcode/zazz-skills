---
name: sqlcmd
description: Run ad-hoc SQL Server diagnostics safely from an agent shell. Use before invoking sqlcmd directly when the task needs schema inspection, read-only data checks, stored procedure execution, tSQLt runs, timing probes, or quote/env handling guidance.
---

# sqlcmd

Use `sqlcmd` only when a repository recipe does not already cover the diagnostic. Prefer repo-local commands such as `just db-test`, `make test-db`, migration recipes, or integration tests when they exist.

## Safety Defaults

- Prefer a test, development, or disposable database. Never run write or destructive diagnostics against production.
- Load connection settings from the repo's environment mechanism; do not hardcode passwords, hosts, ports, or database names.
- Use read-only queries unless the user or test recipe explicitly requires writes.
- Include `-b` in scripts when SQL errors should fail the command.
- Use `-C` only for trusted local containers or environments where the repo documents self-signed certificates.
- Redact secrets from output.

## Invocation Pattern

Adapt the variable names to the repo's `.env`, secrets manager, or wrapper script:

```bash
sqlcmd \
  -S "$DB_HOST,$DB_PORT" \
  -U "$DB_USER" \
  -P "$DB_PASSWORD" \
  -d "$DB_NAME" \
  -C \
  -Q "select @@VERSION"
```

If the repo uses an env wrapper, place `sqlcmd` inside that wrapper instead of exporting secrets in your shell.

## Quoting Rules

- Wrap the whole SQL batch passed to `-Q` in shell double quotes so environment variables can expand outside the SQL.
- Use SQL single quotes for string literals inside the batch: `where Name = 'Example'`.
- Do not use shell-escaped double quotes as SQL string literals; SQL Server may interpret them as identifiers.
- For multi-statement or hard-to-quote probes, prefer a repo-local scratch file only when the repo allows temporary files. Delete the scratch file afterward.

## Useful Recipes

Run a tSQLt class:

```bash
sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_NAME" -C -b \
  -Q "exec tSQLt.Run 'test_ExampleProcedure'"
```

Return compact scalar output:

```bash
sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_NAME" -C -h-1 -W \
  -Q "set nocount on; select count(*) from sys.tables"
```

Inspect object columns:

```bash
sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_NAME" -C -h-1 -W \
  -Q "set nocount on; select c.name, t.name, c.max_length, c.precision, c.scale
      from sys.columns c
      join sys.types t on t.user_type_id = c.user_type_id
      where c.object_id = object_id('dbo.ExampleObject')
      order by c.column_id"
```

Time a query:

```bash
sqlcmd -S "$DB_HOST,$DB_PORT" -U "$DB_USER" -P "$DB_PASSWORD" -d "$DB_NAME" -C \
  -Q "set statistics time on; set nocount on; exec dbo.ExampleProcedure @ExampleID = 1"
```

## Output

Report the command shape, target environment class, result summary, and any uncertainty about whether the diagnostic used the intended database.
