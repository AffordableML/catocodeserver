-- ============================================
-- CatoArt - Supabase Database Setup
-- ============================================
-- Run these commands in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- ============================================
-- STEP 1: CREATE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artworks table
CREATE TABLE IF NOT EXISTS artworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Untitled',
    data JSONB NOT NULL,
    width INTEGER NOT NULL DEFAULT 32,
    height INTEGER NOT NULL DEFAULT 32,
    thumbnail TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(artwork_id, user_id)
);

-- Remixes table
CREATE TABLE IF NOT EXISTS remixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_artworks_user_id ON artworks(user_id);
CREATE INDEX IF NOT EXISTS idx_artworks_is_public ON artworks(is_public);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_artwork_id ON likes(artwork_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_remixes_artwork_id ON remixes(artwork_id);
CREATE INDEX IF NOT EXISTS idx_remixes_original_id ON remixes(original_id);

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE remixes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================

-- Users policies
CREATE POLICY "Users can view all profiles" 
    ON users FOR SELECT 
    USING (true);

CREATE POLICY "Users can update own profile" 
    ON users FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON users FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Artworks policies
CREATE POLICY "Anyone can view public artworks" 
    ON artworks FOR SELECT 
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Anyone can create artworks" 
    ON artworks FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own artworks" 
    ON artworks FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own artworks" 
    ON artworks FOR DELETE 
    USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes" 
    ON likes FOR SELECT 
    USING (true);

CREATE POLICY "Users can create own likes" 
    ON likes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" 
    ON likes FOR DELETE 
    USING (auth.uid() = user_id);

-- Remixes policies
CREATE POLICY "Anyone can view remixes" 
    ON remixes FOR SELECT 
    USING (true);

CREATE POLICY "Users can create own remixes" 
    ON remixes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DONE! 
-- ============================================
-- Your database is now ready!
-- Next: Get your anon key and update config.js
-- ============================================
