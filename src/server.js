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

// MM 2026 grupifaasi mÃ¤ngud (allikas: FIFA)
const MM2026_FIXTURES = [
  // Grupp A
  { api_id: 10001, group_name: 'Grupp A', home_team: 'Mehhiko', away_team: 'PÃµhja-Maroko', kickoff: '2026-06-11T19:00:00-05:00', home_flag: 'ðŸ‡²ðŸ‡½', away_flag: 'ðŸ‡²ðŸ‡¦' },
  { api_id: 10002, group_name: 'Grupp A', home_team: 'USA', away_team: 'Panama', kickoff: '2026-06-12T16:00:00-05:00', home_flag: 'ðŸ‡ºðŸ‡¸', away_flag: 'ðŸ‡µðŸ‡¦' },
  { api_id: 10003, group_name: 'Grupp A', home_team: 'Panama', away_team: 'PÃµhja-Maroko', kickoff: '2026-06-15T13:00:00-05:00', home_flag: 'ðŸ‡µðŸ‡¦', away_flag: 'ðŸ‡²ðŸ‡¦' },
  { api_id: 10004, group_name: 'Grupp A', home_team: 'USA', away_team: 'Mehhiko', kickoff: '2026-06-15T19:00:00-05:00', home_flag: 'ðŸ‡ºðŸ‡¸', away_flag: 'ðŸ‡²ðŸ‡½' },
  { api_id: 10005, group_name: 'Grupp A', home_team: 'USA', away_team: 'PÃµhja-Maroko', kickoff: '2026-06-19T16:00:00-05:00', home_flag: 'ðŸ‡ºðŸ‡¸', away_flag: 'ðŸ‡²ðŸ‡¦' },
  { api_id: 10006, group_name: 'Grupp A', home_team: 'Panama', away_team: 'Mehhiko', kickoff: '2026-06-19T16:00:00-05:00', home_flag: 'ðŸ‡µðŸ‡¦', away_flag: 'ðŸ‡²ðŸ‡½' },

  // Grupp B
  { api_id: 10007, group_name: 'Grupp B', home_team: 'Argentina', away_team: 'Albaania', kickoff: '2026-06-12T19:00:00-05:00', home_flag: 'ðŸ‡¦ðŸ‡·', away_flag: 'ðŸ‡¦ðŸ‡±' },
  { api_id: 10008, group_name: 'Grupp B', home_team: 'Ukraina', away_team: 'Maroko', kickoff: '2026-06-12T13:00:00-05:00', home_flag: 'ðŸ‡ºðŸ‡¦', away_flag: 'ðŸ‡²ðŸ‡¦' },
  { api_id: 10009, group_name: 'Grupp B', home_team: 'Argentina', away_team: 'Maroko', kickoff: '2026-06-16T19:00:00-05:00', home_flag: 'ðŸ‡¦ðŸ‡·', away_flag: 'ðŸ‡²ðŸ‡¦' },
  { api_id: 10010, group_name: 'Grupp B', home_team: 'Ukraina', away_team: 'Albaania', kickoff: '2026-06-16T13:00:00-05:00', home_flag: 'ðŸ‡ºðŸ‡¦', away_flag: 'ðŸ‡¦ðŸ‡±' },
  { api_id: 10011, group_name: 'Grupp B', home_team: 'Argentina', away_team: 'Ukraina', kickoff: '2026-06-20T16:00:00-05:00', home_flag: 'ðŸ‡¦ðŸ‡·', away_flag: 'ðŸ‡ºðŸ‡¦' },
  { api_id: 10012, group_name: 'Grupp B', home_team: 'Maroko', away_team: 'Albaania', kickoff: '2026-06-20T16:00:00-05:00', home_flag: 'ðŸ‡²ðŸ‡¦', away_flag: 'ðŸ‡¦ðŸ‡±' },

  // Grupp C
  { api_id: 10013, group_name: 'Grupp C', home_team: 'Prantsusmaa', away_team: 'Guatemaala', kickoff: '2026-06-13T16:00:00-05:00', home_flag: 'ðŸ‡«ðŸ‡·', away_flag: 'ðŸ‡¬ðŸ‡¹' },
  { api_id: 10014, group_name: 'Grupp C', home_team: 'Brasiilia', away_team: 'Jaapan', kickoff: '2026-06-13T19:00:00-05:00', home_flag: 'ðŸ‡§ðŸ‡·', away_flag: 'ðŸ‡¯ðŸ‡µ' },
  { api_id: 10015, group_name: 'Grupp C', home_team: 'Prantsusmaa', away_team: 'Jaapan', kickoff: '2026-06-17T16:00:00-05:00', home_flag: 'ðŸ‡«ðŸ‡·', away_flag: 'ðŸ‡¯ðŸ‡µ' },
  { api_id: 10016, group_name: 'Grupp C', home_team: 'Brasiilia', away_team: 'Guatemaala', kickoff: '2026-06-17T19:00:00-05:00', home_flag: 'ðŸ‡§ðŸ‡·', away_flag: 'ðŸ‡¬ðŸ‡¹' },
  { api_id: 10017, group_name: 'Grupp C', home_team: 'Prantsusmaa', away_team: 'Brasiilia', kickoff: '2026-06-21T16:00:00-05:00', home_flag: 'ðŸ‡«ðŸ‡·', away_flag: 'ðŸ‡§ðŸ‡·' },
  { api_id: 10018, group_name: 'Grupp C', home_team: 'Jaapan', away_team: 'Guatemaala', kickoff: '2026-06-21T16:00:00-05:00', home_flag: 'ðŸ‡¯ðŸ‡µ', away_flag: 'ðŸ‡¬ðŸ‡¹' },

  // Grupp D
  { api_id: 10019, group_name: 'Grupp D', home_team: 'Hispaania', away_team: 'Serbia', kickoff: '2026-06-13T13:00:00-05:00', home_flag: 'ðŸ‡ªðŸ‡¸', away_flag: 'ðŸ‡·ðŸ‡¸' },
  { api_id: 10020, group_name: 'Grupp D', home_team: 'Ungari', away_team: 'LÃµuna-Aafrika', kickoff: '2026-06-14T13:00:00-05:00', home_flag: 'ðŸ‡­ðŸ‡º', away_flag: 'ðŸ‡¿ðŸ‡¦' },
  { api_id: 10021, group_name: 'Grupp D', home_team: 'Hispaania', away_team: 'LÃµuna-Aafrika', kickoff: '2026-06-17T13:00:00-05:00', home_flag: 'ðŸ‡ªðŸ‡¸', away_flag: 'ðŸ‡¿ðŸ‡¦' },
  { api_id: 10022, group_name: 'Grupp D', home_team: 'Ungari', away_team: 'Serbia', kickoff: '2026-06-18T13:00:00-05:00', home_flag: 'ðŸ‡­ðŸ‡º', away_flag: 'ðŸ‡·ðŸ‡¸' },
  { api_id: 10023, group_name: 'Grupp D', home_team: 'Hispaania', away_team: 'Ungari', kickoff: '2026-06-21T19:00:00-05:00', home_flag: 'ðŸ‡ªðŸ‡¸', away_flag: 'ðŸ‡­ðŸ‡º' },
  { api_id: 10024, group_name: 'Grupp D', home_team: 'LÃµuna-Aafrika', away_team: 'Serbia', kickoff: '2026-06-21T19:00:00-05:00', home_flag: 'ðŸ‡¿ðŸ‡¦', away_flag: 'ðŸ‡·ðŸ‡¸' },

  // Grupp E
  { api_id: 10025, group_name: 'Grupp E', home_team: 'Saksamaa', away_team: 'Saudi Araabia', kickoff: '2026-06-14T16:00:00-05:00', home_flag: 'ðŸ‡©ðŸ‡ª', away_flag: 'ðŸ‡¸ðŸ‡¦' },
  { api_id: 10026, group_name: 'Grupp E', home_team: 'Belgia', away_team: 'Uus-Meremaa', kickoff: '2026-06-14T19:00:00-05:00', home_flag: 'ðŸ‡§ðŸ‡ª', away_flag: 'ðŸ‡³ðŸ‡¿' },
  { api_id: 10027, group_name: 'Grupp E', home_team: 'Saksamaa', away_team: 'Uus-Meremaa', kickoff: '2026-06-18T16:00:00-05:00', home_flag: 'ðŸ‡©ðŸ‡ª', away_flag: 'ðŸ‡³ðŸ‡¿' },
  { api_id: 10028, group_name: 'Grupp E', home_team: 'Belgia', away_team: 'Saudi Araabia', kickoff: '2026-06-18T19:00:00-05:00', home_flag: 'ðŸ‡§ðŸ‡ª', away_flag: 'ðŸ‡¸ðŸ‡¦' },
  { api_id: 10029, group_name: 'Grupp E', home_team: 'Saksamaa', away_team: 'Belgia', kickoff: '2026-06-22T16:00:00-05:00', home_flag: 'ðŸ‡©ðŸ‡ª', away_flag: 'ðŸ‡§ðŸ‡ª' },
  { api_id: 10030, group_name: 'Grupp E', home_team: 'Uus-Meremaa', away_team: 'Saudi Araabia', kickoff: '2026-06-22T16:00:00-05:00', home_flag: 'ðŸ‡³ðŸ‡¿', away_flag: 'ðŸ‡¸ðŸ‡¦' },

  // Grupp F
  { api_id: 10031, group_name: 'Grupp F', home_team: 'Portugal', away_team: 'Angola', kickoff: '2026-06-15T16:00:00-05:00', home_flag: 'ðŸ‡µðŸ‡¹', away_flag: 'ðŸ‡¦ðŸ‡´' },
  { api_id: 10032, group_name: 'Grupp F', home_team: 'TÅ¡ehhia', away_team: 'TÃ¼rgi', kickoff: '2026-06-15T19:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡¿', away_flag: 'ðŸ‡¹ðŸ‡·' },
  { api_id: 10033, group_name: 'Grupp F', home_team: 'Portugal', away_team: 'TÃ¼rgi', kickoff: '2026-06-19T13:00:00-05:00', home_flag: 'ðŸ‡µðŸ‡¹', away_flag: 'ðŸ‡¹ðŸ‡·' },
  { api_id: 10034, group_name: 'Grupp F', home_team: 'TÅ¡ehhia', away_team: 'Angola', kickoff: '2026-06-19T19:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡¿', away_flag: 'ðŸ‡¦ðŸ‡´' },
  { api_id: 10035, group_name: 'Grupp F', home_team: 'Portugal', away_team: 'TÅ¡ehhia', kickoff: '2026-06-23T16:00:00-05:00', home_flag: 'ðŸ‡µðŸ‡¹', away_flag: 'ðŸ‡¨ðŸ‡¿' },
  { api_id: 10036, group_name: 'Grupp F', home_team: 'TÃ¼rgi', away_team: 'Angola', kickoff: '2026-06-23T16:00:00-05:00', home_flag: 'ðŸ‡¹ðŸ‡·', away_flag: 'ðŸ‡¦ðŸ‡´' },

  // Grupp G
  { api_id: 10037, group_name: 'Grupp G', home_team: 'Inglismaa', away_team: 'Filipiinid', kickoff: '2026-06-16T16:00:00-05:00', home_flag: 'ðŸ´ó §ó ¢ó ¥ó ®ó §ó ¿', away_flag: 'ðŸ‡µðŸ‡­' },
  { api_id: 10038, group_name: 'Grupp G', home_team: 'Senegal', away_team: 'Horvaatia', kickoff: '2026-06-16T19:00:00-05:00', home_flag: 'ðŸ‡¸ðŸ‡³', away_flag: 'ðŸ‡­ðŸ‡·' },
  { api_id: 10039, group_name: 'Grupp G', home_team: 'Inglismaa', away_team: 'Horvaatia', kickoff: '2026-06-20T13:00:00-05:00', home_flag: 'ðŸ´ó §ó ¢ó ¥ó ®ó §ó ¿', away_flag: 'ðŸ‡­ðŸ‡·' },
  { api_id: 10040, group_name: 'Grupp G', home_team: 'Senegal', away_team: 'Filipiinid', kickoff: '2026-06-20T19:00:00-05:00', home_flag: 'ðŸ‡¸ðŸ‡³', away_flag: 'ðŸ‡µðŸ‡­' },
  { api_id: 10041, group_name: 'Grupp G', home_team: 'Inglismaa', away_team: 'Senegal', kickoff: '2026-06-24T16:00:00-05:00', home_flag: 'ðŸ´ó §ó ¢ó ¥ó ®ó §ó ¿', away_flag: 'ðŸ‡¸ðŸ‡³' },
  { api_id: 10042, group_name: 'Grupp G', home_team: 'Horvaatia', away_team: 'Filipiinid', kickoff: '2026-06-24T16:00:00-05:00', home_flag: 'ðŸ‡­ðŸ‡·', away_flag: 'ðŸ‡µðŸ‡­' },

  // Grupp H
  { api_id: 10043, group_name: 'Grupp H', home_team: 'Holland', away_team: 'Jeemen', kickoff: '2026-06-17T19:00:00-05:00', home_flag: 'ðŸ‡³ðŸ‡±', away_flag: 'ðŸ‡¾ðŸ‡ª' },
  { api_id: 10044, group_name: 'Grupp H', home_team: 'AlÅ¾eeria', away_team: 'Ecuador', kickoff: '2026-06-18T16:00:00-05:00', home_flag: 'ðŸ‡©ðŸ‡¿', away_flag: 'ðŸ‡ªðŸ‡¨' },
  { api_id: 10045, group_name: 'Grupp H', home_team: 'Holland', away_team: 'Ecuador', kickoff: '2026-06-21T13:00:00-05:00', home_flag: 'ðŸ‡³ðŸ‡±', away_flag: 'ðŸ‡ªðŸ‡¨' },
  { api_id: 10046, group_name: 'Grupp H', home_team: 'AlÅ¾eeria', away_team: 'Jeemen', kickoff: '2026-06-22T19:00:00-05:00', home_flag: 'ðŸ‡©ðŸ‡¿', away_flag: 'ðŸ‡¾ðŸ‡ª' },
  { api_id: 10047, group_name: 'Grupp H', home_team: 'Holland', away_team: 'AlÅ¾eeria', kickoff: '2026-06-25T16:00:00-05:00', home_flag: 'ðŸ‡³ðŸ‡±', away_flag: 'ðŸ‡©ðŸ‡¿' },
  { api_id: 10048, group_name: 'Grupp H', home_team: 'Ecuador', away_team: 'Jeemen', kickoff: '2026-06-25T16:00:00-05:00', home_flag: 'ðŸ‡ªðŸ‡¨', away_flag: 'ðŸ‡¾ðŸ‡ª' },

  // Grupp I
  { api_id: 10049, group_name: 'Grupp I', home_team: 'Itaalia', away_team: 'BangladeÅ¡', kickoff: '2026-06-18T13:00:00-05:00', home_flag: 'ðŸ‡®ðŸ‡¹', away_flag: 'ðŸ‡§ðŸ‡©' },
  { api_id: 10050, group_name: 'Grupp I', home_team: 'Mehhiko', away_team: 'Kamerun', kickoff: '2026-06-19T16:00:00-05:00', home_flag: 'ðŸ‡²ðŸ‡½', away_flag: 'ðŸ‡¨ðŸ‡²' },
  { api_id: 10051, group_name: 'Grupp I', home_team: 'Itaalia', away_team: 'Kamerun', kickoff: '2026-06-22T13:00:00-05:00', home_flag: 'ðŸ‡®ðŸ‡¹', away_flag: 'ðŸ‡¨ðŸ‡²' },
  { api_id: 10052, group_name: 'Grupp I', home_team: 'Mehhiko', away_team: 'BangladeÅ¡', kickoff: '2026-06-23T13:00:00-05:00', home_flag: 'ðŸ‡²ðŸ‡½', away_flag: 'ðŸ‡§ðŸ‡©' },
  { api_id: 10053, group_name: 'Grupp I', home_team: 'Itaalia', away_team: 'Mehhiko', kickoff: '2026-06-26T16:00:00-05:00', home_flag: 'ðŸ‡®ðŸ‡¹', away_flag: 'ðŸ‡²ðŸ‡½' },
  { api_id: 10054, group_name: 'Grupp I', home_team: 'Kamerun', away_team: 'BangladeÅ¡', kickoff: '2026-06-26T16:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡²', away_flag: 'ðŸ‡§ðŸ‡©' },

  // Grupp J
  { api_id: 10055, group_name: 'Grupp J', home_team: 'Austraalia', away_team: 'Indoneesia', kickoff: '2026-06-19T13:00:00-05:00', home_flag: 'ðŸ‡¦ðŸ‡º', away_flag: 'ðŸ‡®ðŸ‡©' },
  { api_id: 10056, group_name: 'Grupp J', home_team: 'Nigeeria', away_team: 'Poola', kickoff: '2026-06-20T16:00:00-05:00', home_flag: 'ðŸ‡³ðŸ‡¬', away_flag: 'ðŸ‡µðŸ‡±' },
  { api_id: 10057, group_name: 'Grupp J', home_team: 'Austraalia', away_team: 'Poola', kickoff: '2026-06-23T19:00:00-05:00', home_flag: 'ðŸ‡¦ðŸ‡º', away_flag: 'ðŸ‡µðŸ‡±' },
  { api_id: 10058, group_name: 'Grupp J', home_team: 'Nigeeria', away_team: 'Indoneesia', kickoff: '2026-06-24T13:00:00-05:00', home_flag: 'ðŸ‡³ðŸ‡¬', away_flag: 'ðŸ‡®ðŸ‡©' },
  { api_id: 10059, group_name: 'Grupp J', home_team: 'Austraalia', away_team: 'Nigeeria', kickoff: '2026-06-27T16:00:00-05:00', home_flag: 'ðŸ‡¦ðŸ‡º', away_flag: 'ðŸ‡³ðŸ‡¬' },
  { api_id: 10060, group_name: 'Grupp J', home_team: 'Poola', away_team: 'Indoneesia', kickoff: '2026-06-27T16:00:00-05:00', home_flag: 'ðŸ‡µðŸ‡±', away_flag: 'ðŸ‡®ðŸ‡©' },

  // Grupp K
  { api_id: 10061, group_name: 'Grupp K', home_team: 'Kanada', away_team: 'Keenia', kickoff: '2026-06-20T19:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡¦', away_flag: 'ðŸ‡°ðŸ‡ª' },
  { api_id: 10062, group_name: 'Grupp K', home_team: 'Uruguay', away_team: 'Iraak', kickoff: '2026-06-21T16:00:00-05:00', home_flag: 'ðŸ‡ºðŸ‡¾', away_flag: 'ðŸ‡®ðŸ‡¶' },
  { api_id: 10063, group_name: 'Grupp K', home_team: 'Kanada', away_team: 'Iraak', kickoff: '2026-06-24T19:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡¦', away_flag: 'ðŸ‡®ðŸ‡¶' },
  { api_id: 10064, group_name: 'Grupp K', home_team: 'Uruguay', away_team: 'Keenia', kickoff: '2026-06-25T13:00:00-05:00', home_flag: 'ðŸ‡ºðŸ‡¾', away_flag: 'ðŸ‡°ðŸ‡ª' },
  { api_id: 10065, group_name: 'Grupp K', home_team: 'Kanada', away_team: 'Uruguay', kickoff: '2026-06-28T16:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡¦', away_flag: 'ðŸ‡ºðŸ‡¾' },
  { api_id: 10066, group_name: 'Grupp K', home_team: 'Iraak', away_team: 'Keenia', kickoff: '2026-06-28T16:00:00-05:00', home_flag: 'ðŸ‡®ðŸ‡¶', away_flag: 'ðŸ‡°ðŸ‡ª' },

  // Grupp L
  { api_id: 10067, group_name: 'Grupp L', home_team: 'Colombia', away_team: 'Elevandiluurannik', kickoff: '2026-06-22T16:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡´', away_flag: 'ðŸ‡¨ðŸ‡®' },
  { api_id: 10068, group_name: 'Grupp L', home_team: 'Å veits', away_team: 'Slovakkia', kickoff: '2026-06-23T16:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡­', away_flag: 'ðŸ‡¸ðŸ‡°' },
  { api_id: 10069, group_name: 'Grupp L', home_team: 'Colombia', away_team: 'Slovakkia', kickoff: '2026-06-26T13:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡´', away_flag: 'ðŸ‡¸ðŸ‡°' },
  { api_id: 10070, group_name: 'Grupp L', home_team: 'Å veits', away_team: 'Elevandiluurannik', kickoff: '2026-06-27T13:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡­', away_flag: 'ðŸ‡¨ðŸ‡®' },
  { api_id: 10071, group_name: 'Grupp L', home_team: 'Colombia', away_team: 'Å veits', kickoff: '2026-06-30T16:00:00-05:00', home_flag: 'ðŸ‡¨ðŸ‡´', away_flag: 'ðŸ‡¨ðŸ‡­' },
  { api_id: 10072, group_name: 'Grupp L', home_team: 'Slovakkia', away_team: 'Elevandiluurannik', kickoff: '2026-06-30T16:00:00-05:00', home_flag: 'ðŸ‡¸ðŸ‡°', away_flag: 'ðŸ‡¨ðŸ‡®' },
];

// â”€â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/api/fixtures', async (req, res) => {
  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .order('kickoff', { ascending: true });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.get('/api/players', async (req, res) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

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

app.get('/api/predictions/:playerName', async (req, res) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('player_name', req.params.playerName);
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/api/predictions', async (req, res) => {
  const { player_name, fixture_id, home_score, away_score } = req.body;

  const { data: fixture } = await supabase
    .from('fixtures')
    .select('kickoff, locked')
    .eq('id', fixture_id)
    .single();

  if (!fixture) return res.status(404).json({ error: 'MÃ¤ng ei leitud' });

  const now = new Date();
  const kickoff = new Date(fixture.kickoff);
  const lockTime = new Date(kickoff.getTime() - 5 * 60 * 1000);

  if (now >= lockTime) {
    return res.status(403).json({ error: 'Ennustusaeg on lÃµppenud' });
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

app.get('/api/leaderboard', async (req, res) => {
  const { data: predictions } = await supabase.from('predictions').select('*');
  const { data: fixtures } = await supabase.from('fixtures').select('*').not('result_home', 'is', null);
  const { data: players } = await supabase.from('players').select('*');

  const scores = {};
  players.forEach(p => {
    scores[p.name] = { name: p.name, points: 0, exact: 0, correct: 0, played: 0 };
  });

  fixtures.forEach(f => {
    const preds = predictions.filter(p => p.fixture_id === f.id);
    preds.forEach(pred => {
      if (!scores[pred.player_name]) return;
      const ph = pred.home_score, pa = pred.away_score;
      const rh = f.result_home, ra = f.result_away;
      scores[pred.player_name].played += 1;
      if (ph === rh && pa === ra) {
        scores[pred.player_name].points += 3;
        scores[pred.player_name].exact += 1;
      } else {
        const ps = ph > pa ? 1 : ph < pa ? -1 : 0;
        const rs = rh > ra ? 1 : rh < ra ? -1 : 0;
        if (ps === rs) {
          scores[pred.player_name].points += 1;
          scores[pred.player_name].correct += 1;
        }
      }
    });
  });

  res.json(Object.values(scores).sort((a, b) => b.points - a.points));
});

// Seed fixtures from hardcoded list
app.post('/api/admin/seed-fixtures', async (req, res) => {
  try {
    const fixtures = MM2026_FIXTURES.map(f => ({
      api_id: f.api_id,
      home_team: f.home_team,
      away_team: f.away_team,
      kickoff: new Date(f.kickoff).toISOString(),
      group_name: f.group_name,
      home_flag: f.home_flag,
      away_flag: f.away_flag,
      locked: false,
      result_home: null,
      result_away: null
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

// Auto-lock fixtures 5 min before kickoff
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 5 * 60 * 1000);
  await supabase
    .from('fixtures')
    .update({ locked: true })
    .lte('kickoff', soon.toISOString())
    .eq('locked', false);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MM2026 server tÃ¶Ã¶tab pordil ${PORT}`));
