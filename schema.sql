-- Re-create the table every time to ensure the schema is up-to-date.
DROP TABLE IF EXISTS files;

-- The 'content' column is a BLOB to store any kind of file data (text, images, etc.)
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    filepath TEXT NOT NULL,
    content BLOB NOT NULL,
    -- Ensures that a project cannot have two files with the same path.
    UNIQUE(project_id, filepath)
);
