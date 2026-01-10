DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    storage_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS projects;
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_uid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_published_site INTEGER DEFAULT 0, -- 1 = Private site link
    is_on_explore INTEGER DEFAULT 0,    -- 1 = Public in gallery
    is_template INTEGER DEFAULT 0,       -- 1 = Shared as template
    likes_count INTEGER NOT NULL DEFAULT 0,
    remix_count INTEGER NOT NULL DEFAULT 0,
    remixed_from TEXT,                   -- UID of original template
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

DROP TABLE IF EXISTS files;
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    filepath TEXT NOT NULL,
    content BLOB NOT NULL,
    is_asset INTEGER DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    UNIQUE(project_id, filepath)
);

DROP TABLE IF EXISTS kv_store;
CREATE TABLE kv_store (
    project_id INTEGER NOT NULL,
    key_name TEXT NOT NULL,
    value TEXT,
    PRIMARY KEY (project_id, key_name),
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS plugins;
CREATE TABLE plugins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    js_code TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 0,
    install_count INTEGER DEFAULT 0,
    category TEXT DEFAULT 'utility',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

DROP TABLE IF EXISTS likes;
CREATE TABLE likes (
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS platformer_games;
CREATE TABLE platformer_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    uid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    game_data TEXT NOT NULL,  -- JSON with levels, tiles, settings
    is_on_explore INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);