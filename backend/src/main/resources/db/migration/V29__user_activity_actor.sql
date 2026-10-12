ALTER TABLE userActivities
    ADD COLUMN IF NOT EXISTS actorUsername TEXT;
