CREATE TABLE IF NOT EXISTS userActivities (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT,
    createdAt TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_created
    ON userActivities (userId, createdAt DESC);
