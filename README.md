# 📊 GitScope

> **Beautiful git contribution reports — from your terminal to your browser in one command.**

GitScope analyzes any git repository and generates a stunning, interactive HTML report with charts and metrics about your contribution patterns.

## ✨ Features

- **📈 Contribution Timeline** — Weekly commit activity over time
- **🕐 Hourly Heatmap** — When are you most productive?
- **📅 Day of Week** — Work distribution across the week
- **👥 Contributor Breakdown** — Per-author stats with additions/deletions
- **📁 Hot Files** — Which files change the most?
- **🏆 Streak Tracking** — Longest consecutive day streak
- **🔥 Beautiful Dark Theme** — Ready for sharing, printing, or embedding

## 🚀 Quick Start

```bash
# Run on any git repo
npx gitscope /path/to/repo

# Or install globally
npm install -g gitscope
gitscope .
```

## 📖 Usage

```bash
# Basic usage — analyze current directory
gitscope

# Analyze specific repo
gitscope /path/to/repo

# Filter by time range
gitscope --since "2024-01-01" --until "2024-12-31"

# Filter by author
gitscope --author "Maria"

# Custom output file
gitscope -o my-report.html

# Open in browser automatically
gitscope --open
```

## 🖼️ Sample

The report generates a fully self-contained HTML file with embedded Chart.js — no internet needed after generation.

## 💰 License

MIT — free for personal and commercial use.

---

<p align="center">Built with ❤️ for developers who care about their craft.</p>

---

## 💖 Support

If GitScope helps you, consider supporting development:

| Method | Link |
|--------|------|
| ☕ Ko-fi | [ko-fi.com/gitscope](https://ko-fi.com/gitscope) |
| ₿ Bitcoin | `1DQXcKwN95AWqwmwbscG7fRbEYMdWU9GB3` |
| 🌐 Web Tool | [gitlog-viz.vercel.app](https://gitlog-viz.vercel.app) |
| 🐙 GitHub | [promptpolish-ai/gitscope](https://github.com/promptpolish-ai/gitscope) |

Every donation helps keep this project alive! ❤️
