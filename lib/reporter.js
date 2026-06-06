const fs = require('fs');
const path = require('path');

async function generateReport(stats, outputPath) {
  const html = buildHTML(stats);
  const absPath = path.resolve(outputPath);
  fs.writeFileSync(absPath, html, 'utf-8');
  return absPath;
}

function buildHTML(stats) {
  const commitsJson = JSON.stringify(stats.commitsByWeek);
  const hourData = JSON.stringify(stats.commitsByHour);
  const dayData = JSON.stringify(stats.commitsByDay);

  const authorsData = Object.entries(stats.commitsByAuthor)
    .map(([name, data]) => ({ name, ...data }));

  // Build top contributor HTML
  const sortedAuthors = [...authorsData].sort((a, b) => b.count - a.count);

  const timelineHTML = stats.commitsByWeek.length > 0
    ? `<div class="chart-container">
        <canvas id="timelineChart"></canvas>
       </div>`
    : '<p class="empty-state">No contribution data for the selected period.</p>';

  const authorsHTML = sortedAuthors.length > 0
    ? `<table class="authors-table">
        <thead><tr><th>Author</th><th>Commits</th><th>Additions</th><th>Deletions</th><th>First Commit</th><th>Last Commit</th></tr></thead>
        <tbody>${sortedAuthors.map(a => `<tr>
          <td><strong>${escHtml(a.name)}</strong></td>
          <td>${a.count}</td>
          <td class="green">+${a.additions.toLocaleString()}</td>
          <td class="red">-${a.deletions.toLocaleString()}</td>
          <td>${formatDate(a.firstCommit)}</td>
          <td>${formatDate(a.lastCommit)}</td>
        </tr>`).join('')}</tbody>
       </table>`
    : '<p class="empty-state">No author data available.</p>';

  const filesHTML = stats.topFiles.length > 0
    ? `<table class="files-table">
        <thead><tr><th>#</th><th>File</th><th>Changes</th></tr></thead>
        <tbody>${stats.topFiles.map((f, i) => `<tr>
          <td>${i + 1}</td>
          <td><code>${escHtml(f.file)}</code></td>
          <td>${f.count}</td>
        </tr>`).join('')}</tbody>
       </table>`
    : '<p class="empty-state">No file data available.</p>';

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GitScope Report</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  :root {
    --bg: #0f172a;
    --surface: #1e293b;
    --surface2: #334155;
    --text: #f1f5f9;
    --text2: #94a3b8;
    --accent: #38bdf8;
    --green: #4ade80;
    --red: #fb7185;
    --yellow: #fbbf24;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
  }
  .container { max-width: 1100px; margin: 0 auto; padding: 2rem; }
  header {
    text-align: center;
    padding: 3rem 0;
    border-bottom: 1px solid var(--surface2);
    margin-bottom: 2rem;
  }
  header h1 {
    font-size: 2.5rem;
    background: linear-gradient(135deg, var(--accent), #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }
  header p { color: var(--text2); font-size: 1.1rem; }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .stat-card {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid var(--surface2);
    transition: transform 0.2s;
  }
  .stat-card:hover { transform: translateY(-2px); }
  .stat-card .value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent);
    display: block;
  }
  .stat-card .label {
    font-size: 0.85rem;
    color: var(--text2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
  }
  .stat-card.green .value { color: var(--green); }
  .stat-card.red .value { color: var(--red); }
  .stat-card.yellow .value { color: var(--yellow); }
  .stat-card.purple .value { color: #a78bfa; }
  section {
    background: var(--surface);
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    border: 1px solid var(--surface2);
  }
  section h2 {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .chart-container {
    position: relative;
    height: 300px;
    margin: 1rem 0;
  }
  .authors-table, .files-table {
    width: 100%;
    border-collapse: collapse;
  }
  .authors-table th, .files-table th {
    text-align: left;
    padding: 0.75rem 1rem;
    color: var(--text2);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--surface2);
  }
  .authors-table td, .files-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--surface2);
  }
  .authors-table tr:hover, .files-table tr:hover {
    background: rgba(56, 189, 248, 0.05);
  }
  .green { color: var(--green); }
  .red { color: var(--red); }
  code {
    background: var(--surface2);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.85rem;
    word-break: break-all;
  }
  .empty-state {
    color: var(--text2);
    text-align: center;
    padding: 3rem;
    font-style: italic;
  }
  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 768px) {
    .charts-row { grid-template-columns: 1fr; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .container { padding: 1rem; }
  }
  footer {
    text-align: center;
    color: var(--text2);
    font-size: 0.85rem;
    padding: 2rem 0;
  }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>📊 GitScope Report</h1>
    <p>${escHtml(stats.currentBranch)} branch · ${stats.filteredCommits} commits shown (${stats.totalCommits} total)</p>
    <p>${stats.startDate ? formatDate(stats.startDate) : 'N/A'} — ${stats.endDate ? formatDate(stats.endDate) : 'N/A'}</p>
  </header>

  <div class="stats-grid">
    <div class="stat-card"><span class="value">${stats.filteredCommits}</span><span class="label">Commits</span></div>
    <div class="stat-card green"><span class="value">+${stats.totalAdditions.toLocaleString()}</span><span class="label">Additions</span></div>
    <div class="stat-card red"><span class="value">-${stats.totalDeletions.toLocaleString()}</span><span class="label">Deletions</span></div>
    <div class="stat-card purple"><span class="value">${stats.contributors ? stats.contributors.length : 0}</span><span class="label">Contributors</span></div>
    <div class="stat-card"><span class="value">${stats.branches}</span><span class="label">Branches</span></div>
    <div class="stat-card yellow"><span class="value">${stats.longestStreak}</span><span class="label">Longest Streak (days)</span></div>
    <div class="stat-card purple"><span class="value">${stats.avgCommitsPerWeek}</span><span class="label">Avg/Week</span></div>
    <div class="stat-card"><span class="value">${stats.avgChangesPerCommit}</span><span class="label">Changes/Commit</span></div>
  </div>

  <section>
    <h2>📈 Contribution Timeline</h2>
    ${timelineHTML}
  </section>

  <div class="charts-row">
    <section>
      <h2>🕐 Hourly Activity</h2>
      <div class="chart-container"><canvas id="hourChart"></canvas></div>
    </section>
    <section>
      <h2>📅 Day of Week</h2>
      <div class="chart-container"><canvas id="dayChart"></canvas></div>
    </section>
  </div>

  <section>
    <h2>👥 Contributors</h2>
    ${authorsHTML}
  </section>

  <section>
    <h2>📁 Most Changed Files</h2>
    ${filesHTML}
  </section>

  <!-- Support Section -->
  <section style="text-align:center;background:linear-gradient(135deg,rgba(74,222,128,0.08),rgba(56,189,248,0.08));border:1px solid rgba(74,222,128,0.3);">
    <h2 style="color:var(--green);justify-content:center;">⚡ Support GitScope</h2>
    <p style="color:var(--text2);margin-bottom:0.5rem;">Found this report useful? Keep the project alive with a coffee!</p>
    <div style="background:var(--surface2);padding:0.6rem 1rem;border-radius:8px;font-family:monospace;font-size:0.85rem;word-break:break-all;display:inline-block;color:var(--green);margin-bottom:0.5rem;">
      1DQXcKwN95AWqwmwbscG7fRbEYMdWU9GB3
    </div>
    <p style="color:var(--text2);font-size:0.8rem;">
      <strong>BTC</strong> · Any amount appreciated · 
      <a href="https://gitscore-chi.vercel.app" style="color:var(--accent);">Free repo health score →</a> · 
      <a href="https://gitscope-pro.vercel.app" style="color:var(--accent);">$5 Premium templates →</a>
    </p>
  </section>

  <footer>
    Generated by <strong>GitScope</strong> · ${new Date().toLocaleString()}
  </footer>
</div>

<script>
const defaultColors = [
  'rgba(56, 189, 248, 0.8)', 'rgba(167, 139, 250, 0.8)',
  'rgba(74, 222, 128, 0.8)', 'rgba(251, 191, 36, 0.8)',
  'rgba(251, 113, 133, 0.8)', 'rgba(52, 211, 153, 0.8)',
  'rgba(248, 113, 113, 0.8)', 'rgba(129, 140, 248, 0.8)',
];

// Timeline
const timelineData = ${commitsJson};
new Chart(document.getElementById('timelineChart'), {
  type: 'bar',
  data: {
    labels: timelineData.map(d => d.week),
    datasets: [{
      label: 'Commits',
      data: timelineData.map(d => d.count),
      backgroundColor: 'rgba(56, 189, 248, 0.6)',
      borderColor: 'rgba(56, 189, 248, 1)',
      borderWidth: 1,
      borderRadius: 4,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8', maxTicksLimit: 20, font: { size: 10 } }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
      y: { ticks: { color: '#94a3b8', stepSize: 1, font: { size: 10 } }, grid: { color: 'rgba(51, 65, 85, 0.5)' } }
    }
  }
});

// Hourly
const hourData = ${hourData};
const hourLabels = Array.from({length: 24}, (_, i) => {
  const h = i % 12 || 12;
  return i < 12 ? h + 'am' : h + 'pm';
});
new Chart(document.getElementById('hourChart'), {
  type: 'bar',
  data: {
    labels: hourLabels,
    datasets: [{
      label: 'Commits',
      data: hourData,
      backgroundColor: hourData.map(v =>
        v > 0 ? 'rgba(167, 139, 250, 0.7)' : 'rgba(51, 65, 85, 0.3)'
      ),
      borderRadius: 4,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { display: false } },
      y: { ticks: { color: '#94a3b8', stepSize: 1, font: { size: 10 } }, grid: { color: 'rgba(51, 65, 85, 0.5)' } }
    }
  }
});

// Day of week
const dayData = ${dayData};
new Chart(document.getElementById('dayChart'), {
  type: 'doughnut',
  data: {
    labels: ${JSON.stringify(daysOfWeek)},
    datasets: [{
      data: dayData,
      backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
      borderColor: '#1e293b',
      borderWidth: 2,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', padding: 12, font: { size: 11 } }
      }
    }
  }
});
</script>
</body>
</html>`;
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

module.exports = { generateReport };
