'use strict';

const axios  = require('axios');
const { fmt } = require('../lib/theme');

// Dead APIs removed (2026-06): siputzx (standings/topscorers), sofascore (403/blocked),
//   newsapi.org (requires paid key)
// Replacements: ESPN public API for live scores/standings, saurav.tech for news

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

// Map common league names to ESPN league slugs
const LEAGUE_SLUGS = {
    'premier league': 'eng.1', 'epl': 'eng.1', 'pl': 'eng.1',
    'la liga': 'esp.1', 'laliga': 'esp.1',
    'bundesliga': 'ger.1',
    'serie a': 'ita.1', 'seriea': 'ita.1',
    'ligue 1': 'fra.1', 'ligue1': 'fra.1',
    'champions league': 'UEFA.CHAMPIONS', 'ucl': 'UEFA.CHAMPIONS',
    'mls': 'usa.1',
    'eredivisie': 'ned.1',
    'brasileirao': 'bra.1',
};

function leagueSlug(text) {
    const key = (text || 'premier league').toLowerCase().trim();
    return LEAGUE_SLUGS[key] || LEAGUE_SLUGS['premier league'];
}

module.exports = {
    commands: ['livescore', 'sportnews', 'standings', 'topscorers', 'upcomingmatches', 'surebet', 'gamehistory'],
    description: 'Sports scores, news, standings and betting tips',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const cmd  = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();
        const text = args.join(' ').trim();
        const send = (t) => sock.sendMessage(jid, { text: fmt(t), contextInfo }, { quoted: message });

        await sock.sendPresenceUpdate('composing', jid);

        if (cmd === 'livescore') {
            try {
                const slug = leagueSlug(text);
                const res  = await axios.get(`${ESPN_BASE}/${slug}/scoreboard`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
                });
                const events = (res.data?.events || []).slice(0, 10);
                if (!events.length) {
                    return send(`⚽ *Live Scores*\n\nNo live matches right now.\n\n🔗 https://www.livescore.com\n🔗 https://www.flashscore.com`);
                }
                const list = events.map(e => {
                    const comp  = e.competitions?.[0];
                    const home  = comp?.competitors?.find(c => c.homeAway === 'home');
                    const away  = comp?.competitors?.find(c => c.homeAway === 'away');
                    const hs    = home?.score ?? '-';
                    const as    = away?.score ?? '-';
                    const hn    = home?.team?.shortDisplayName || home?.team?.displayName || '?';
                    const an    = away?.team?.shortDisplayName || away?.team?.displayName || '?';
                    const status = comp?.status?.type?.shortDetail || '';
                    return `⚽ *${hn}* ${hs}-${as} *${an}*  _${status}_`;
                }).join('\n');
                return send(`⚽ *Live Scores*\n\n${list}\n\n_Updated: ${new Date().toLocaleTimeString()}_`);
            } catch {
                return send(`⚽ *Live Scores*\n\n🔗 https://www.livescore.com\n🔗 https://www.flashscore.com\n🔗 https://www.sofascore.com`);
            }
        }

        if (cmd === 'sportnews') {
            try {
                const q   = (text || 'football').toLowerCase();
                const cat = q.includes('basket') ? 'sports' : q.includes('tennis') ? 'sports' : 'sports';
                const res = await axios.get(
                    `https://saurav.tech/NewsAPI/top-headlines/category/${cat}/us.json`,
                    { timeout: 10000 }
                );
                const articles = (res.data?.articles || []).slice(0, 5);
                if (!articles.length) throw new Error('no articles');
                const list = articles.map((a, i) =>
                    `*${i + 1}.* ${a.title}\n   📰 ${a.source?.name} | ${a.publishedAt?.split('T')[0]}`
                ).join('\n\n');
                return send(`🏆 *Sports News*\n\n${list}\n\n🔗 https://www.bbc.com/sport`);
            } catch {
                return send(`🏆 *Sports News*\n\n📰 Latest coverage:\n• https://www.bbc.com/sport\n• https://www.espn.com\n• https://www.goal.com`);
            }
        }

        if (cmd === 'standings') {
            const league = text || 'premier league';
            try {
                const slug = leagueSlug(league);
                const res  = await axios.get(`${ESPN_BASE}/${slug}/standings`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
                });
                const groups = res.data?.standings?.entries || res.data?.children?.[0]?.standings?.entries || [];
                if (!groups.length) throw new Error('no data');
                const list = groups.slice(0, 10).map((e, i) => {
                    const pts = e.stats?.find(s => s.name === 'points')?.value ?? '?';
                    const gp  = e.stats?.find(s => s.name === 'gamesPlayed')?.value ?? '?';
                    const w   = e.stats?.find(s => s.name === 'wins')?.value ?? '?';
                    const d   = e.stats?.find(s => s.name === 'ties')?.value ?? '?';
                    const l   = e.stats?.find(s => s.name === 'losses')?.value ?? '?';
                    return `*${i + 1}.* ${e.team?.displayName || '?'} | P:${gp} W:${w} D:${d} L:${l} *Pts:${pts}*`;
                }).join('\n');
                return send(`🏆 *Standings: ${league}*\n\n${list}`);
            } catch {
                return send(
                    `🏆 *${league} Standings*\n\n` +
                    `🔗 https://www.flashscore.com/football/\n` +
                    `🔗 https://www.bbc.com/sport/football/tables`
                );
            }
        }

        if (cmd === 'topscorers') {
            const league = text || 'premier league';
            try {
                const slug = leagueSlug(league);
                const res  = await axios.get(
                    `${ESPN_BASE}/${slug}/leaders`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
                );
                const cats = res.data?.categories || [];
                const goalsCat = cats.find(c =>
                    c.name?.toLowerCase().includes('goal') || c.abbreviation === 'G'
                );
                const leaders = goalsCat?.leaders?.slice(0, 10) || [];
                if (!leaders.length) throw new Error('no scorers');
                const list = leaders.map((l, i) =>
                    `*${i + 1}.* ${l.athlete?.displayName || '?'} (${l.team?.abbreviation || '?'}) — ⚽ ${l.value} goals`
                ).join('\n');
                return send(`⚽ *Top Scorers: ${league}*\n\n${list}`);
            } catch {
                return send(
                    `⚽ *Top Scorers: ${league}*\n\n` +
                    `🔗 https://www.whoscored.com\n` +
                    `🔗 https://www.bbc.com/sport/football/premier-league/top-scorers`
                );
            }
        }

        if (cmd === 'upcomingmatches') {
            const team = text || 'chelsea';
            try {
                const res = await axios.get(
                    `${ESPN_BASE}/eng.1/teams`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
                );
                const teams = res.data?.sports?.[0]?.leagues?.[0]?.teams || [];
                const found = teams.find(t =>
                    t.team?.displayName?.toLowerCase().includes(team.toLowerCase()) ||
                    t.team?.abbreviation?.toLowerCase() === team.toLowerCase()
                );
                if (!found?.team?.id) throw new Error('team not found');
                const tid = found.team.id;
                const sched = await axios.get(
                    `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/${tid}/schedule`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
                );
                const upcoming = (sched.data?.events || [])
                    .filter(e => new Date(e.date) > new Date())
                    .slice(0, 5);
                if (!upcoming.length) throw new Error('no matches');
                const list = upcoming.map(e => {
                    const d = new Date(e.date);
                    const comp = e.competitions?.[0];
                    const home = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName || '?';
                    const away = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName || '?';
                    return `📅 ${d.toDateString()} | ${home} vs ${away}`;
                }).join('\n');
                return send(`📅 *Upcoming: ${found.team.displayName}*\n\n${list}`);
            } catch {
                return send(`📅 *Upcoming Matches: ${team}*\n\n🔗 https://www.espn.com/soccer/search/_/q/${encodeURIComponent(team)}`);
            }
        }

        if (cmd === 'surebet') {
            const league = text || 'today';
            return send(
                `💰 *Sure Bets: ${league}*\n\n` +
                `📊 For today's predictions:\n` +
                `🔗 https://www.betensured.com\n` +
                `🔗 https://www.soccervista.com\n` +
                `🔗 https://www.forebet.com\n\n` +
                `⚠️ _Bet responsibly. Never wager more than you can afford to lose._`
            );
        }

        if (cmd === 'gamehistory') {
            const team = text || 'chelsea';
            try {
                const res = await axios.get(
                    `${ESPN_BASE}/eng.1/teams`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
                );
                const teams = res.data?.sports?.[0]?.leagues?.[0]?.teams || [];
                const found = teams.find(t =>
                    t.team?.displayName?.toLowerCase().includes(team.toLowerCase()) ||
                    t.team?.abbreviation?.toLowerCase() === team.toLowerCase()
                );
                if (!found?.team?.id) throw new Error('team not found');
                const tid = found.team.id;
                const sched = await axios.get(
                    `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/${tid}/schedule`,
                    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
                );
                const past = (sched.data?.events || [])
                    .filter(e => new Date(e.date) < new Date())
                    .slice(-5)
                    .reverse();
                if (!past.length) throw new Error('no history');
                const list = past.map(e => {
                    const d    = new Date(e.date);
                    const comp = e.competitions?.[0];
                    const home = comp?.competitors?.find(c => c.homeAway === 'home');
                    const away = comp?.competitors?.find(c => c.homeAway === 'away');
                    const hn   = home?.team?.displayName || '?';
                    const an   = away?.team?.displayName || '?';
                    const hs   = home?.score ?? '-';
                    const as   = away?.score ?? '-';
                    return `📅 ${d.toDateString()}\n   ${hn} ${hs}-${as} ${an}`;
                }).join('\n\n');
                return send(`📋 *Match History: ${found.team.displayName}*\n\n${list}`);
            } catch {
                return send(`📋 *Match History: ${team}*\n\n🔗 https://www.espn.com/soccer/search/_/q/${encodeURIComponent(team)}`);
            }
        }
    }
};
