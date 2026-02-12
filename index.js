const fs = require('fs');
const http = require('http');
const path = require('path');

if (!fs.existsSync('./auth_info')) {
    fs.mkdirSync('./auth_info', { recursive: true });
}

console.log(`╔═══════════════════════════════════════╗` +
    `║                                       ║` +
    `║         SILVA MD BOT v3.0             ║` +
    `║        Advanced WhatsApp Bot          ║` +
    `║        with Plugin System             ║` +
    `║            SYLIVANUS                  ║` +
    `╚═══════════════════════════════════════╝`);

const { bot, config } = require('./silva.js');
bot.init();

function getUptime() {
    const s = process.uptime();
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return { days: d, hours: h, minutes: m, seconds: sec, total: s };
}

function getMemory() {
    const mem = process.memoryUsage();
    return {
        heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(1),
        heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(1),
        rss: (mem.rss / 1024 / 1024).toFixed(1)
    };
}

function getPluginCount() {
    try {
        const plugins = fs.readdirSync('./silvaxlab').filter(f => f.endsWith('.js'));
        return plugins.length;
    } catch { return 0; }
}

function getDashboardHTML() {
    const up = getUptime();
    const mem = getMemory();
    const plugins = getPluginCount();
    const isConnected = bot.isConnected || false;
    const botName = config.BOT_NAME || 'Silva MD';
    const version = config.VERSION || '3.0.0';
    const prefix = config.PREFIX || '.';
    const mode = config.BOT_MODE || 'public';
    const owner = config.OWNER_NUMBER || 'Not set';
    const antiDelete = config.ANTI_DELETE !== false;
    const antiCall = config.ANTI_CALL !== false;
    const autoStatusView = config.AUTO_STATUS_VIEW !== false;
    const autoStatusReact = config.AUTO_STATUS_REACT !== false;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${botName} - Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #0a0f1c;
            color: #e2e8f0;
            min-height: 100vh;
            overflow-x: hidden;
        }

        .bg-grid {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image:
                linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            z-index: 0;
        }

        .glow-orb {
            position: fixed;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.15;
            z-index: 0;
            animation: float 8s ease-in-out infinite;
        }
        .glow-orb.purple { width: 400px; height: 400px; background: #8b5cf6; top: -100px; right: -100px; }
        .glow-orb.green { width: 350px; height: 350px; background: #10b981; bottom: -100px; left: -50px; animation-delay: 3s; }
        .glow-orb.blue { width: 300px; height: 300px; background: #3b82f6; top: 50%; left: 50%; animation-delay: 5s; }

        @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-30px) scale(1.05); }
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 30px 20px;
            position: relative;
            z-index: 1;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .logo-container {
            display: inline-flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }

        .logo-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #10b981, #3b82f6);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
        }

        .logo-text h1 {
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .logo-text .version {
            font-size: 14px;
            color: #64748b;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 12px;
        }
        .status-badge.online {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
        }
        .status-badge.offline {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: #f59e0b;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
        }
        .online .status-dot { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .offline .status-dot { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(99, 102, 241, 0.1);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        .card:hover {
            border-color: rgba(99, 102, 241, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .card-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-bottom: 16px;
        }

        .card-icon.green { background: rgba(16, 185, 129, 0.15); }
        .card-icon.blue { background: rgba(59, 130, 246, 0.15); }
        .card-icon.purple { background: rgba(139, 92, 246, 0.15); }
        .card-icon.orange { background: rgba(245, 158, 11, 0.15); }

        .card-label {
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }

        .card-value {
            font-size: 28px;
            font-weight: 700;
        }
        .card-value.green { color: #10b981; }
        .card-value.blue { color: #3b82f6; }
        .card-value.purple { color: #8b5cf6; }
        .card-value.orange { color: #f59e0b; }

        .card-sub {
            font-size: 12px;
            color: #475569;
            margin-top: 4px;
        }

        .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .info-card {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(99, 102, 241, 0.1);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(10px);
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(99, 102, 241, 0.06);
        }
        .info-row:last-child { border-bottom: none; }

        .info-label {
            font-size: 14px;
            color: #94a3b8;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .info-value {
            font-size: 14px;
            font-weight: 600;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge.on { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .badge.off { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

        .footer {
            text-align: center;
            padding: 30px 0 10px;
            border-top: 1px solid rgba(99, 102, 241, 0.08);
        }

        .footer-links {
            display: flex;
            justify-content: center;
            gap: 24px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .footer-links a {
            color: #64748b;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.2s;
        }
        .footer-links a:hover { color: #10b981; }

        .footer-text {
            font-size: 13px;
            color: #334155;
        }

        #uptime-timer { font-variant-numeric: tabular-nums; }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="glow-orb purple"></div>
    <div class="glow-orb green"></div>
    <div class="glow-orb blue"></div>

    <div class="container">
        <div class="header">
            <div class="logo-container">
                <div class="logo-icon">🤖</div>
                <div class="logo-text">
                    <h1>${botName}</h1>
                    <div class="version">v${version} &bull; WhatsApp Bot</div>
                </div>
            </div>
            <br>
            <div class="status-badge ${isConnected ? 'online' : 'offline'}">
                <span class="status-dot"></span>
                ${isConnected ? 'Connected & Running' : 'Waiting for Connection'}
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-icon green">⏱️</div>
                <div class="card-label">Uptime</div>
                <div class="card-value green" id="uptime-timer">${up.days > 0 ? up.days + 'd ' : ''}${String(up.hours).padStart(2,'0')}:${String(up.minutes).padStart(2,'0')}:${String(up.seconds).padStart(2,'0')}</div>
                <div class="card-sub">Since last restart</div>
            </div>
            <div class="card">
                <div class="card-icon blue">🔧</div>
                <div class="card-label">Plugins</div>
                <div class="card-value blue">${plugins}</div>
                <div class="card-sub">Commands loaded</div>
            </div>
            <div class="card">
                <div class="card-icon purple">💾</div>
                <div class="card-label">Memory</div>
                <div class="card-value purple">${mem.heapUsed} MB</div>
                <div class="card-sub">${mem.rss} MB RSS total</div>
            </div>
            <div class="card">
                <div class="card-icon orange">📡</div>
                <div class="card-label">Mode</div>
                <div class="card-value orange" style="text-transform:capitalize;">${mode}</div>
                <div class="card-sub">Prefix: ${prefix}</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <div class="section-title">🛡️ Protection Status</div>
                <div class="info-row">
                    <span class="info-label">🗑️ Anti-Delete</span>
                    <span class="badge ${antiDelete ? 'on' : 'off'}">${antiDelete ? '✅ Active' : '❌ Off'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📞 Anti-Call</span>
                    <span class="badge ${antiCall ? 'on' : 'off'}">${antiCall ? '✅ Active' : '❌ Off'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">👁️ Auto Status View</span>
                    <span class="badge ${autoStatusView ? 'on' : 'off'}">${autoStatusView ? '✅ Active' : '❌ Off'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">❤️ Auto Status React</span>
                    <span class="badge ${autoStatusReact ? 'on' : 'off'}">${autoStatusReact ? '✅ Active' : '❌ Off'}</span>
                </div>
            </div>

            <div class="info-card">
                <div class="section-title">⚙️ Bot Configuration</div>
                <div class="info-row">
                    <span class="info-label">🤖 Bot Name</span>
                    <span class="info-value">${botName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">🔌 Prefix</span>
                    <span class="info-value">${prefix}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">👤 Owner</span>
                    <span class="info-value">${owner || 'Not set'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📊 Node.js</span>
                    <span class="info-value">${process.version}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-links">
                <a href="https://github.com/SilvaTechB" target="_blank">💻 GitHub</a>
                <a href="https://wa.me/channel/0029VaAkETLLY6d8qhLmZt2v" target="_blank">📢 Channel</a>
            </div>
            <div class="footer-text">Powered by Silva Tech Nexus &bull; ${botName} v${version}</div>
        </div>
    </div>

    <script>
        let totalSeconds = ${Math.floor(up.total)};
        setInterval(() => {
            totalSeconds++;
            const d = Math.floor(totalSeconds / 86400);
            const h = Math.floor((totalSeconds % 86400) / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            const el = document.getElementById('uptime-timer');
            if (el) {
                el.textContent = (d > 0 ? d + 'd ' : '') +
                    String(h).padStart(2,'0') + ':' +
                    String(m).padStart(2,'0') + ':' +
                    String(s).padStart(2,'0');
            }
        }, 1000);
    </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
    if (req.url === '/api/status') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        });
        const up = getUptime();
        const mem = getMemory();
        res.end(JSON.stringify({
            status: bot.isConnected ? 'online' : 'waiting',
            bot: config.BOT_NAME || 'Silva MD',
            version: config.VERSION || '3.0.0',
            uptime: up.total,
            memory: mem,
            plugins: getPluginCount()
        }));
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(getDashboardHTML());
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
});
