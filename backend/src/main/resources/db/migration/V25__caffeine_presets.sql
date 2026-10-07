CREATE TABLE IF NOT EXISTS caffeinePresets (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    amountMg INT NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    UNIQUE (userId, amountMg)
);
