<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:prisma-migration-rules -->
# Prisma — never use `db push` for tracked schema changes

This project uses Prisma with versioned migrations (`prisma migrate dev`). Production (Railway) only runs `prisma migrate deploy` on container boot — it does NOT sync the live schema with `prisma/schema.prisma` directly.

**Before committing any change to `prisma/schema.prisma`:**

1. Run `npx prisma migrate dev --name <descriptive_name>` to generate a versioned migration in `prisma/migrations/`.
2. Verify the generated SQL is correct.
3. Commit BOTH the schema change AND the new migration directory.

**Never use `prisma db push` to apply schema changes that you intend to commit.** `db push` only mutates the live database without creating a migration file. If you do this, the migration history goes out of sync with the schema, and production will be missing columns/tables/indexes — silently in some cases, with `column does not exist` errors at runtime in others.

**`db push` is acceptable ONLY for:**

- Throwaway prototyping in a personal branch you do not intend to merge.
- Inspecting whether a schema change works before committing to its final shape.

In both cases, before merging/committing, you MUST replace the `db push` work with a proper `migrate dev` run that produces the versioned migration.

**If you discover schema drift in production** (symptoms: `column X does not exist`, `relation Y does not exist`, `unique constraint missing`):

1. Compute the diff: `npx prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script > migration.sql`.
2. Create a new migration directory `prisma/migrations/<timestamp>_<descriptive_name>/` with `migration.sql` containing the diff.
3. Apply manually to production once: `npx prisma migrate deploy` against the prod URL (mark the historical migrations as already applied via `prisma migrate resolve` if needed).
4. Commit and push the migration so future deploys are idempotent.
5. Verify with `prisma migrate diff` returning `No difference detected`.
<!-- END:prisma-migration-rules -->
