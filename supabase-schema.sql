-- MM 2026 Ennustusmäng - Supabase tabelid
-- Käivita see Supabase SQL Editoris

-- Mängud
CREATE TABLE IF NOT EXISTS fixtures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_id INTEGER UNIQUE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff TIMESTAMPTZ NOT NULL,
  group_name TEXT,
  locked BOOLEAN DEFAULT false,
  result_home INTEGER,
  result_away INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mängijad
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ennustused
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  fixture_id UUID REFERENCES fixtures(id),
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_name, fixture_id)
);

-- Luba kõigil lugeda ja kirjutada (avalik mäng)
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kõik saavad lugeda" ON fixtures FOR SELECT USING (true);
CREATE POLICY "Kõik saavad lugeda" ON players FOR SELECT USING (true);
CREATE POLICY "Kõik saavad lisada" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Kõik saavad lugeda" ON predictions FOR SELECT USING (true);
CREATE POLICY "Kõik saavad lisada" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Kõik saavad uuendada" ON predictions FOR UPDATE USING (true);
CREATE POLICY "Server saab uuendada" ON fixtures FOR UPDATE USING (true);
CREATE POLICY "Server saab lisada" ON fixtures FOR INSERT WITH CHECK (true);
