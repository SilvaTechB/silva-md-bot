'use strict';

const axios  = require('axios');
const { fmt } = require('../lib/theme');

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
                const res = await axios.get('https://api.sofascore.com/api/v1/sport/football/events/live', {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
                    timeout: 12000
                });
                const events = res.data?.events?.slice(0, 10) || [];
                if (!events.length) return send('⚽ *Live Scores*\n\nNo live matches right now. Try again during match time!');
                const list = events.map(e => {
                    const h  = e.homeTeam?.name || '?';
                    const a  = e.awayTeam?.name || '?';
                    const hs = e.homeScore?.current ?? '-';
                    const as = e.awayScore?.current ?? '-';
                    const t  = e.status?.description || e.time?.played ? `${e.time?.played || ''}\'` : '';
                    return `⚽ *${h}* ${hs} - ${as} *${a}* ${t}`;
                }).join('\n');
                return send(`⚽ *Live Scores*\n\n${list}\n\n_Updated: ${new Date().toLocaleTimeString()}_`);
            } catch {
                return send('⚽ *Live Scores*\n\n_Could not fetch live data. Try:_\nhttps://www.sofascore.com\nhttps://www.livescore.com');
            }
        }

        if (cmd === 'sportnews') {
            try {
                const q   = text || 'football';
                const res = await axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=demo`, { timeout: 10000 });
                const articles = res.data?.articles || [];
                if (!articles.length) throw new Error('no articles');
                const list = articles.slice(0, 5).map((a, i) =>
                    `*${i + 1}.* ${a.title}\n   📰 ${a.source?.name} | ${a.publishedAt?.split('T')[0]}`
                ).join('\n\n');
                return send(`🏆 *Sports News: ${q}*\n\n${list}`);
            } catch {
                return send(`🏆 *Sports News*\n\n📰 Check the latest:\n• https://www.bbc.com/sport\n• https://www.espn.com\n• https://www.goal.com`);
            }
        }

        if (cmd === 'standings') {
            const league = text || 'premier league';
            try {
                const res = await axios.get(`https://api.siputzx.my.id/api/sports/standings?league=${encodeURIComponent(league)}`, { timeout: 12000 });
                const teams = res.data?.data?.slice(0, 10) || [];
                if (!teams.length) throw new Error('no data');
                const list = teams.map(t =>
                    `${t.rank || '?'}. ${t.name || t.team} | P:${t.played} W:${t.wins} D:${t.draws} L:${t.losses} *Pts:${t.points}*`
                ).join('\n');
                return send(`🏆 *Standings: ${league}*\n\n${list}`);
            } catch {
                return send(`🏆 *${league} Standings*\n\n🔗 Check: https://www.flashscore.com\nhttps://www.sofascore.com`);
            }
        }

        if (cmd === 'topscorers') {
            const league = text || 'premier league';
            try {
                const res = await axios.get(`https://api.siputzx.my.id/api/sports/topscorers?league=${encodeURIComponent(league)}`, { timeout: 12000 });
                const players = res.data?.data?.slice(0, 10) || [];
                if (!players.length) throw new Error('no data');
                const list = players.map((p, i) =>
                    `*${i + 1}.* ${p.name || p.player} (${p.team}) — ⚽ ${p.goals} goals`
                ).join('\n');
                return send(`⚽ *Top Scorers: ${league}*\n\n${list}`);
            } catch {
                return send(`⚽ *Top Scorers: ${league}*\n\n🔗 https://www.whoscored.com`);
            }
        }

        if (cmd === 'upcomingmatches') {
            const team = text || 'chelsea';
            try {
                const res = await axios.get(`https://api.sofascore.com/api/v1/team/search/${encodeURIComponent(team)}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
                });
                const teamId = res.data?.teams?.[0]?.id;
                if (teamId) {
                    const matches = await axios.get(`https://api.sofascore.com/api/v1/team/${teamId}/events/next/0`, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
                    });
                    const events = matches.data?.events?.slice(0, 5) || [];
                    if (events.length) {
                        const list = events.map(e => {
                            const d = new Date(e.startTimestamp * 1000);
                            return `📅 ${d.toDateString()} | ${e.homeTeam?.name} vs ${e.awayTeam?.name}`;
                        }).join('\n');
                        return send(`📅 *Upcoming: ${team.toUpperCase()}*\n\n${list}`);
                    }
                }
                throw new Error('no matches');
            } catch {
                return send(`📅 *Upcoming Matches: ${team}*\n\n🔗 https://www.sofascore.com/search/${encodeURIComponent(team)}`);
            }
        }

        if (cmd === 'surebet') {
            const league = text || 'today';
            const tips = [
                { match: 'Check betensured.com for verified tips', tip: 'Visit site', odds: 'Variable' },
                { match: 'Follow verified tipsters on Telegram', tip: 'Research', odds: 'Variable' }
            ];
            const disclaimer = `\n\n⚠️ _Gambling disclaimer: Bet responsibly. Never bet more than you can afford to lose._`;
            return send(
                `💰 *Sure Bets: ${league}*\n\n` +
                `📊 For today's predictions:\n` +
                `🔗 https://www.betensured.com\n` +
                `🔗 https://www.soccervista.com\n` +
                `🔗 https://www.forebet.com${disclaimer}`
            );
        }

        if (cmd === 'gamehistory') {
            const team = text || 'chelsea';
            try {
                const res = await axios.get(`https://api.sofascore.com/api/v1/team/search/${encodeURIComponent(team)}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
                });
                const teamId = res.data?.teams?.[0]?.id;
                if (teamId) {
                    const hist = await axios.get(`https://api.sofascore.com/api/v1/team/${teamId}/events/last/0`, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
                    });
                    const events = hist.data?.events?.slice(-5).reverse() || [];
                    if (events.length) {
                        const list = events.map(e => {
                            const d = new Date(e.startTimestamp * 1000);
                            const hs = e.homeScore?.current ?? '-', as = e.awayScore?.current ?? '-';
                            return `📅 ${d.toDateString()}\n   ${e.homeTeam?.name} ${hs}-${as} ${e.awayTeam?.name}`;
                        }).join('\n\n');
                        return send(`📋 *Match History: ${team.toUpperCase()}*\n\n${list}`);
                    }
                }
                throw new Error('no history');
            } catch {
                return send(`📋 *Match History: ${team}*\n\n🔗 https://www.sofascore.com/search/${encodeURIComponent(team)}`);
            }
        }
    }
};
