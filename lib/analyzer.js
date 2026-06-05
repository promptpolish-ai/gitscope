const { execSync } = require('child_process');
const path = require('path');

function exec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 15000, shell: true }).trim();
  } catch (e) {
    return '';
  }
}

async function analyzeRepo(repoPath, options = {}) {
  repoPath = path.resolve(repoPath);
  
  try {
    execSync('git rev-parse --git-dir', { cwd: repoPath, encoding: 'utf8', shell: true, timeout: 5000 });
  } catch {
    throw new Error(`Not a git repository: ${repoPath}`);
  }

  const totalCommits = parseInt(exec('git rev-list --count HEAD', repoPath)) || 0;
  const currentBranch = exec('git rev-parse --abbrev-ref HEAD', repoPath) || 'unknown';
  const branches = (exec('git branch -a', repoPath) || '').split('\n').filter(Boolean).length;

  const contributorsRaw = exec('git shortlog -sne HEAD', repoPath);
  const contributors = contributorsRaw ? contributorsRaw.split('\n').filter(Boolean).map(line => {
    const m = line.trim().match(/^\s*(\d+)\s+(.+?)\s+<(.+)>$/);
    return m ? { count: parseInt(m[1]), name: m[2], email: m[3] } : null;
  }).filter(Boolean) : [];

  // Get commit list using reliable format (no --shortstat which hangs)
  let range = 'HEAD';
  if (options.since || options.until) {
    range = '';
    if (options.since) range += ` --since="${options.since}"`;
    if (options.until) range += ` --until="${options.until}"`;
  }

  // Get commits with format
  const logCmd = `git log --format="%H|%an|%ae|%ai|%s"${range}`;
  const logRaw = exec(logCmd, repoPath);
  
  if (!logRaw) {
    return {
      totalCommits, filteredCommits: 0, branches, currentBranch, contributors,
      startDate: null, endDate: null, totalAdditions: 0, totalDeletions: 0,
      avgChangesPerCommit: 0, commitsByHour: Array(24).fill(0),
      commitsByDay: [0,0,0,0,0,0,0], commitsByWeek: [], commitsByAuthor: {},
      topFiles: [], firstCommit: null, lastCommit: null,
      avgCommitsPerWeek: 0, longestStreak: 0,
    };
  }

  const commits = [];
  const commitsByHour = Array(24).fill(0);
  const commitsByDay = Array(7).fill(0);
  const commitsByWeek = {};
  const commitsByAuthor = {};
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (const line of logRaw.split('\n').filter(Boolean)) {
    const parts = line.split('|');
    if (parts.length < 5) continue;
    const [hash, author, email, date, ...subjectParts] = parts;
    const subject = subjectParts.join('|');

    const d = new Date(date);
    if (isNaN(d.getTime())) continue;

    // Get per-commit stats using diff-tree (more reliable than --shortstat)
    const statRaw = exec(`git diff-tree --no-commit-id --shortstat ${hash}`, repoPath);
    const addMatch = statRaw.match(/(\d+)\s+insertion/);
    const delMatch = statRaw.match(/(\d+)\s+deletion/);
    const fileMatch = statRaw.match(/(\d+)\s+file/);
    const additions = addMatch ? parseInt(addMatch[1]) : 0;
    const deletions = delMatch ? parseInt(delMatch[1]) : 0;
    totalAdditions += additions;
    totalDeletions += deletions;

    commitsByHour[d.getHours()]++;
    commitsByDay[d.getDay()]++;

    const weekKey = (() => {
      const dt = new Date(d);
      const day = dt.getDay();
      const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(dt.setDate(diff));
      return `${mon.getFullYear()}-${String(mon.getMonth()+1).padStart(2,'0')}-${String(mon.getDate()).padStart(2,'0')}`;
    })();
    commitsByWeek[weekKey] = (commitsByWeek[weekKey] || 0) + 1;

    if (!commitsByAuthor[author]) {
      commitsByAuthor[author] = { count: 0, additions: 0, deletions: 0, email, firstCommit: d.toISOString(), lastCommit: d.toISOString() };
    }
    const a = commitsByAuthor[author];
    a.count++;
    a.additions += additions;
    a.deletions += deletions;
    if (d < new Date(a.firstCommit)) a.firstCommit = d.toISOString();
    if (d > new Date(a.lastCommit)) a.lastCommit = d.toISOString();

    commits.push({
      hash: hash.trim(), author: author.trim(), email: email.trim(),
      date: d.toISOString(), subject: subject.trim(),
      files: fileMatch ? parseInt(fileMatch[1]) : 0, additions, deletions,
    });
  }

  const dates = [...new Set(commits.map(c => c.date.split('T')[0]))].sort();
  let longestStreak = 0, currentStreak = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) currentStreak = 1;
    else {
      const diff = (new Date(dates[i]) - new Date(dates[i-1])) / (1000*60*60*24);
      currentStreak = diff <= 1 ? currentStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  const weekKeys = Object.keys(commitsByWeek).sort();
  const avgCommitsPerWeek = weekKeys.length > 0 ? Math.round(commits.length / weekKeys.length * 10) / 10 : 0;

  return {
    totalCommits,
    filteredCommits: commits.length,
    branches,
    currentBranch,
    contributors,
    startDate: commits.length > 0 ? commits[0].date : null,
    endDate: commits.length > 0 ? commits[commits.length-1].date : null,
    totalAdditions,
    totalDeletions,
    avgChangesPerCommit: commits.length > 0 ? Math.round((totalAdditions+totalDeletions)/commits.length) : 0,
    commitsByHour,
    commitsByDay: [commitsByDay[0], commitsByDay[1], commitsByDay[2], commitsByDay[3], commitsByDay[4], commitsByDay[5], commitsByDay[6]],
    commitsByWeek: weekKeys.map(k => ({week: k, count: commitsByWeek[k]})),
    commitsByAuthor,
    topFiles: [],
    firstCommit: commits.length > 0 ? commits[0] : null,
    lastCommit: commits.length > 0 ? commits[commits.length-1] : null,
    avgCommitsPerWeek,
    longestStreak,
  };
}

module.exports = { analyzeRepo };
