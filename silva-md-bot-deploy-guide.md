
# 🚀 Deploying Silva MD Bot on VPS

> A step-by-step guide to setting up and deploying the [Silva MD Bot](https://github.com/SilvaTechB/silva-md-bot) on your Virtual Private Server (VPS).

---

## 📦 Requirements

Ensure your environment has the following:

- VPS (Ubuntu 20.04+ recommended)
- Non-root user with `sudo` privileges
- WhatsApp account for QR login
- GitHub account (optional for updates)
- Basic terminal knowledge

---

## 🔧 Step 1: Update & Install Required Packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git curl wget ffmpeg -y
```

---

## 🟢 Step 2: Install Node.js (v18+ recommended)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:

```bash
node -v
npm -v
```

---

## 🐳 Step 3: (Optional) Install PM2 for Process Management

```bash
sudo npm install -g pm2
```

---

## 📁 Step 4: Clone the Silva MD Bot Repository

```bash
git clone https://github.com/SilvaTechB/silva-md-bot
cd silva-md-bot
```

---

## 📦 Step 5: Install Bot Dependencies

```bash
npm install
```

---

## ⚙️ Step 6: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
nano .env
```

Update values such as:

```env
BOT_NAME=Silva MD
OWNER_NUMBER=2547xxxxxxxx
SESSION_ID=your-session-id (optional)
```

---

## 📱 Step 7: Start the Bot and Scan QR Code

### Using Node.js directly:
```bash
node .
```

### Using PM2 (recommended):
```bash
pm2 start index.js --name silva-md
```

> You will see a QR code. **Scan it using your WhatsApp** to link your account.

---

## 🔄 Step 8: Make Bot Run on Reboot (PM2)

```bash
pm2 startup
pm2 save
```

---

## 🚀 Step 9: Pull Future Updates

To update the bot in future:

```bash
cd silva-md-bot
git pull
npm install
pm2 restart silva-md
```

---

## 🛡️ Step 10: Security Tips

- Use a firewall:  
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw enable
  ```

- Optional: Install Fail2Ban for SSH protection
- Backup `session.json` and `.env` regularly

---

## 🌐 Optional: Point a Domain to the Bot (Nginx Example)

Install Nginx:

```bash
sudo apt install nginx -y
```

Create config:

```bash
sudo nano /etc/nginx/sites-available/silvamd
```

Add your domain server block, then:

```bash
sudo ln -s /etc/nginx/sites-available/silvamd /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Install HTTPS with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx
```

---

## 🧪 Troubleshooting

- **QR not showing**: Try `node .` without PM2 first
- **Bot not responding**: Check `.env`, session file, and logs:
  ```bash
  pm2 logs silva-md
  ```
- **Session expired**: Delete `session` or `.wwebjs_auth`, and re-scan

---

## 👨‍💻 Author

**SilvaTechB**  
GitHub: [https://github.com/SilvaTechB](https://github.com/SilvaTechB)  
Bot: [Silva MD Bot](https://github.com/SilvaTechB/silva-md-bot)

---

## 🙌 Support

Feel free to fork the project, report issues, or contribute!

**Star ⭐ the repo if you find it useful.**

---
