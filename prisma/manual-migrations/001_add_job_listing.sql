-- Adds JobListing table for ingested external job postings (stage 1: Adzuna only).
-- Shared across users; no FK to User. Upsert key is (source, sourceId).
-- Apply via Supabase MCP apply_migration or the Supabase dashboard SQL editor.

CREATE TABLE "JobListing" (
    "id"          TEXT        NOT NULL,
    "source"      TEXT        NOT NULL,
    "sourceId"    TEXT        NOT NULL,
    "title"       TEXT        NOT NULL,
    "company"     TEXT        NOT NULL,
    "location"    TEXT,
    "description" TEXT,
    "applyUrl"    TEXT        NOT NULL,
    "salary"      TEXT,
    "postedAt"    TIMESTAMP(3) NOT NULL,
    "fetchedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobListing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobListing_source_sourceId_key" ON "JobListing"("source", "sourceId");

CREATE INDEX "JobListing_postedAt_idx" ON "JobListing"("postedAt");
