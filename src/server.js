const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const API_KEY = process.env.API_SPORTS_KEY;
const API_HOST = 'v3.football.api-sports.io';
// FIFA World Cup 2026 tournament ID
const WC_2026_ID = 1;

// ─── API-Sports helper ────────────────────────────────────────────────────────
async function apiGet(endpoint) {
  const res = await fetch(`https://${API_HOST}/${endpoint}`, {
    headers: { 'x-apisports-key': API_KEY }
  });
  return res.json();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Get all fixtures
app.get('/api/fixtures', async (req, res) => {
  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .order('kickoff', { ascending: true });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Get all players
app.get('/api/players', async (req, res) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Add player
app.post('/api/players', async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nimi puudub' });
  const { data, error } = await supabase
    .from('players')
    .insert({ name: name.trim() })
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Get predictions for a player
app.get('/api/predictions/:playerName', async (req, res) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('player_name', req.params.playerName);
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Save prediction
app.post('/api/predictions', async (req, res) => {
  const { player_name, fixture_id, home_score, away_score } = req.body;

  // Check if fixture is locked
  const { data: fixture } = await supabase
    .from('fixtures')
    .select('kickoff, locked')
    .eq('id', fixture_id)
    .single();

  if (!fixture) return res.status(404).json({ error: 'Mäng ei leitud' });

  const now = new Date();
  const kickoff = new Date(fixture.kickoff);
  const lockTime = new Date(kickoff.getTime() - 5 * 60 * 1000); // 5 min before

  if (now >= lockTime) {
    return res.status(403).json({ error: 'Ennustusaeg on lõppenud' });
  }

  const { data, error } = await supabase
    .from('predictions')
    .upsert({
      player_name,
      fixture_id,
      home_score: parseInt(home_score),
      away_score: parseInt(away_score)
    }, { onConflict: 'player_name,fixture_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*');

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .not('result_home', 'is', null);

  const { data: players } = await supabase
    .from('players')
    .select('*');

  const scores = {};
  players.forEach(p => {
    scores[p.name] = { name: p.name, points: 0, exact: 0, correct: 0 };
  });

  fixtures.forEach(f => {
    const preds = predictions.filter(p => p.fixture_id === f.id);
    preds.forEach(pred => {
      if (!scores[pred.player_name]) return;
      const ph = pred.home_score, pa = pred.away_score;
      const rh = f.result_home, ra = f.result_away;
      if (ph === rh && pa === ra) {
        scores[pred.player_name].points += 3;
        scores[pred.player_name].exact += 1;
      } else {
        const predSign = ph > pa ? 1 : ph < pa ? -1 : 0;
        const resSign = rh > ra ? 1 : rh < ra ? -1 : 0;
        if (predSign === resSign) {
          scores[pred.player_name].points += 1;
          scores[pred.player_name].correct += 1;
        }
      }
    });
  });

  const sorted = Object.values(scores).sort((a, b) => b.points - a.points);
  res.json(sorted);
});

// ─── Auto-fetch results from API-Sports ──────────────────────────────────────
async function fetchAndUpdateResults() {
  console.log('[CRON] Kontrollin tulemusi...');
  try {
    const data = await apiGet(`fixtures?league=${WC_2026_ID}&season=2026&status=FT`);
    if (!data.response) return;

    for (const match of data.response) {
      const apiId = match.fixture.id;
      const homeGoals = match.goals.home;
      const awayGoals = match.goals.away;

      await supabase
        .from('fixtures')
        .update({
          result_home: homeGoals,
          result_away: awayGoals
        })
        .eq('api_id', apiId);
    }
    console.log(`[CRON] Uuendatud ${data.response.length} mängu tulemust`);
  } catch (e) {
    console.error('[CRON] Viga:', e.message);
  }
}

// Auto-lock fixtures 5 min before kickoff
async function lockFixtures() {
  const now = new Date();
  const soon = new Date(now.getTime() + 5 * 60 * 1000);

  await supabase
    .from('fixtures')
    .update({ locked: true })
    .lte('kickoff', soon.toISOString())
    .eq('locked', false);
}

// Run every minute during World Cup
cron.schedule('* * * * *', async () => {
  await lockFixtures();
});

// Run every 5 minutes to fetch results
cron.schedule('*/5 * * * *', async () => {
  await fetchAndUpdateResults();
});

// ─── Seed fixtures from API-Sports ───────────────────────────────────────────
app.post('/api/admin/seed-fixtures', async (req, res) => {
  try {
    const data = await apiGet(`fixtures?league=${WC_2026_ID}&season=2026`);
    if (!data.response) return res.status(500).json({ error: 'API viga', data });

    const fixtures = data.response.map(m => ({
      api_id: m.fixture.id,
      home_team: m.teams.home.name,
      away_team: m.teams.away.name,
      kickoff: m.fixture.date,
      group_name: m.league.round,
      locked: false,
      result_home: m.goals.home,
      result_away: m.goals.away
    }));

    const { error } = await supabase
      .from('fixtures')
      .upsert(fixtures, { onConflict: 'api_id' });

    if (error) return res.status(500).json({ error });
    res.json({ ok: true, count: fixtures.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MM2026 server töötab pordil ${PORT}`));
