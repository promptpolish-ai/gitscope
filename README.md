<h1 align="center">📊 GitScope</h1>

<p align="center">
  <strong>$1 GitHub Repository Autopsy</strong><br>
  <em>Language breakdown · Contributor analytics · Commit activity · Premium HTML report</em>
</p>

<p align="center">
  <a href="https://gitscope-micro.vercel.app">
    <img src="https://img.shields.io/badge/try%20it-gitscope--micro.vercel.app-a3e635?style=flat-square&logo=vercel" alt="Try it">
  </a>
  <a href="https://github.com/promptpolish-ai/gitscope/discussions/5">
    <img src="https://img.shields.io/badge/discussions-join-6c5ce7?style=flat-square&logo=github" alt="Discussions">
  </a>
  <img src="https://img.shields.io/badge/license-MIT-6b7280?style=flat-square" alt="MIT">
</p>

---

## ✨ What is GitScope?

GitScope analyzes any **public GitHub repository** and generates a stunning, interactive HTML report — think an autopsy for your codebase.

**See what you're working with:**

| Metric | Report shows |
|--------|-------------|
| 📊 Language breakdown | Bar chart with percentages & KB |
| 👥 Top contributors | Ranked list with commit bars |
| 📅 Activity by day | Which days your team codes most |
| 📋 Repo metadata | License, size, branch, created date |
| 📝 Recent commits | Chronological activity log |

## 🖼️ Live Demos

See full premium reports (generated for free as demos):

| Repository | Report |
|-----------|--------|
| 🦇 **sharkdp/bat** (59k★, Rust) | [View Report →](https://gist.github.com/promptpolish-ai/1fcd12b29e5594cbb1627903f7ff00e1) |
| 🔧 **biomejs/biome** (Rust formatter) | [View Report →](https://gist.github.com/promptpolish-ai/6c80258dc11c5ba277af999b03b97541) |
| ⚡ **vitejs/vite** (70k★, build tool) | [View Report →](https://gist.github.com/promptpolish-ai/b33af8568001cd4fb985caf01b5d26d5) |
| ⬛ **vercel/next.js** (130k★, React) | [View Report →](https://gist.github.com/promptpolish-ai/f5de69d067e23f868eb5700f001bb7c7) |

## 🚀 Quick Start

```bash
# Just enter a repo name → get a report
→ https://gitscope-micro.vercel.app

# Or hit the API directly:
curl https://gitscope-micro.vercel.app/api/analyze?repo=owner/name
```

## 📟 API

### Analyze a repo (free preview)
```
GET /api/analyze?repo=owner/name
```
Returns repo metadata, language stats, and a **watermarked preview** of the report.

### Get full report ($1 BTC)
```
GET /api/deliver?txid=YOUR_TXID&repo=owner/name
```
Sends $1 BTC to `1DQXcKwN95AWqwmwbscG7fRbEYMdWU9GB3`, then enter your txid to receive the full premium HTML report.

### Repo Health Badge
```
GET /api/badge?repo=owner/name
```
Returns a shields.io badge with repo health grade (A-D). Add to any README:
```markdown
![Repo Health](https://gitscope-micro.vercel.app/api/badge?repo=owner/name)
```

## 💰 Pricing

| Plan | Price | What you get |
|------|-------|-------------|
| 🆓 Preview | **Free** | Watermarked preview with metadata + stats |
| 📊 Premium | **$1 BTC** | Full HTML report with all visualizations |

**Bitcoin address:** `1DQXcKwN95AWqwmwbscG7fRbEYMdWU9GB3`

## 🐙 Repo Health Badge

![Example Badge](https://gitscope-micro.vercel.app/api/badge?repo=promptpolish-ai/gitscope)

```markdown
[![Repo Health](https://gitscope-micro.vercel.app/api/badge?repo=owner/name)](https://gitscope-micro.vercel.app)
```

Add this badge to your README and show the world your repo's health score!

## 🗺️ Roadmap

- [ ] CLI tool for local repos
- [ ] PDF export
- [ ] Team analytics (multiple repos)
- [ ] GitHub Action for auto-reports
- [ ] More visualizations (velocity, bus factor)

## 💖 Support

GitScope is open source (MIT). If it helps you:

- **$1 BTC** → `1DQXcKwN95AWqwmwbscG7fRbEYMdWU9GB3`
- **⭐ Star** this repo
- **🐛 Report issues** or suggest features
- **📢 Share** with a friend

<p align="center">
  <sub>Built by <a href="https://github.com/promptpolish-ai">@promptpolish-ai</a></sub>
</p>
