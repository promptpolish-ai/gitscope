const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

async function analyzeRepo(repoPath, options = {}) {
  const git = simpleGit({ baseDir: path.resolve(repoPath), maxConcurrentProcesses: 1 });

  // Verify it's a git repo
  const isRepo = await git.checkIsRepo();
  if (!isRepo) throw new Error(`Not a git repository: ${repoPath}`);

  // Build log command
  const logArgs = ['--format=---COMMIT---%n%H|%an|%ae|%ai|%s', '--numstat'];
  if (options.since) logArgs.push('--since', options.since);
  if (options.until) logArgs.push('--until', options.until);
  if (options.author) logArgs.push('--author', options.author);

  const rawLog = await git.raw(['log', ...logArgs]);
  const commits = parseLog(rawLog);

  // Get branch info
  const branches = (await git.branch()).all;
  const currentBranch = (await git.branch()).current;
  const totalCommits = (await git.raw(['rev-list', '--count', 'HEAD'])).trim();

  // Get contributors
  const contributorsRaw = await git.raw(['shortlog', '-sne', 'HEAD']);
  const contributors = contributorsRaw.trim().split('\n').filter(Boolean).map(line => {
    const match = line.trim().match(/^\s*(\d+)\s+(.+?)\s+<(.+)>$/);
    if (!match) return null;
    return { count: parseInt(match[1]), name: match[2], email: match[3] };
  }).filter(Boolean);

  // Compute stats
  const stats = computeStats(commits, branches, totalCommits, contributors, currentBranch, options);
  return stats;
}

function parseLog(raw) {
  const sections = raw.split('---COMMIT---').filter(Boolean);
  const commits = [];

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const header = lines[0];
    const [hash, author, email, date, ...subjectParts] = header.split('|');
    const subject = subjectParts.join('|');

    const fileChanges = [];
    let i = 1;
    while (i < lines.length && lines[i].trim()) {
      const line = lines[i].trim();
      const match = line.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/);
      if (match) {
        fileChanges.push({
          added: match[1] === '-' ? 0 : parseInt(match[1]),
          deleted: match[2] === '-' ? 0 : parseInt(match[2]),
          file: match[3],
        });
      }
      i++;
    }

    commits.push({
      hash: hash.trim(),
      author: author.trim(),
      email: email.trim(),
      date: new Date(date.trim()),
      subject: subject.trim(),
      files: fileChanges.length,
      additions: fileChanges.reduce((s, f) => s + f.added, 0),
      deletions: fileChanges.reduce((s, f) => s + f.deleted, 0),
      netChanges: fileChanges.reduce((s, f) => s + f.added - f.deleted, 0),
      filesChanged: fileChanges.map(f => f.file),
    });
  }

  return commits;
}

function computeStats(commits, branches, totalCommits, contributors, currentBranch, options) {
  if (commits.length === 0) {
    return {
      totalCommits: parseInt(totalCommits),
      filteredCommits: 0,
      branches: branches.length,
      currentBranch,
      contributors,
      startDate: null,
      endDate: null,
      totalAdditions: 0,
      totalDeletions: 0,
      avgChangesPerCommit: 0,
      commitsByHour: Array(24).fill(0),
      commitsByDay: Array(7).fill(0),
      commitsByWeek: [],
      commitsByAuthor: {},
      topFiles: {},
      firstCommit: null,
      lastCommit: null,
      avgCommitsPerWeek: 0,
      longestStreak: 0,
    };
  }

  const commitsByHour = Array(24).fill(0);
  const commitsByDay = Array(7).fill(0);
  const commitsByWeek = {};
  const commitsByAuthor = {};
  const topFiles = {};

  commits.sort((a, b) => a.date - b.date);

  for (const c of commits) {
    commitsByHour[c.date.getHours()]++;
    commitsByDay[c.date.getDay()]++;

    const weekKey = getWeekKey(c.date);
    commitsByWeek[weekKey] = (commitsByWeek[weekKey] || 0) + 1;

    if (!commitsByAuthor[c.author]) {
      commitsByAuthor[c.author] = { count: 0, additions: 0, deletions: 0, email: c.email, firstCommit: c.date, lastCommit: c.date };
    }
    const a = commitsByAuthor[c.author];
    a.count++;
    a.additions += c.additions;
    a.deletions += c.deletions;
    if (c.date < a.firstCommit) a.firstCommit = c.date;
    if (c.date > a.lastCommit) a.lastCommit = c.date;

    for (const file of c.filesChanged) {
      topFiles[file] = (topFiles[file] || 0) + 1;
    }
  }

  // Streak calculation
  const sortedDates = [...new Set(commits.map(c => c.date.toISOString().split('T')[0]))].sort();
  let longestStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  const totalAdditions = commits.reduce((s, c) => s + c.additions, 0);
  const totalDeletions = commits.reduce((s, c) => s + c.deletions, 0);

  const weekKeys = Object.keys(commitsByWeek).sort();
  const avgCommitsPerWeek = weekKeys.length > 0
    ? Math.round(commits.length / weekKeys.length * 10) / 10
    : 0;

  const sortedFiles = Object.entries(topFiles).sort((a, b) => b[1] - a[1]).slice(0, 20);

  return {
    totalCommits: parseInt(totalCommits),
    filteredCommits: commits.length,
    branches: branches.length,
    currentBranch,
    contributors,
    startDate: commits[0]?.date,
    endDate: commits[commits.length - 1]?.date,
    totalAdditions,
    totalDeletions,
    avgChangesPerCommit: commits.length > 0 ? Math.round((totalAdditions + totalDeletions) / commits.length) : 0,
    commitsByHour,
    commitsByDay: [commitsByDay[0], commitsByDay[1], commitsByDay[2], commitsByDay[3], commitsByDay[4], commitsByDay[5], commitsByDay[6]], // Sun-Sat
    commitsByWeek: Object.entries(commitsByWeek).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ week: k, count: v })),
    commitsByAuthor,
    topFiles: sortedFiles.map(([file, count]) => ({ file, count })),
    firstCommit: commits[0],
    lastCommit: commits[commits.length - 1],
    avgCommitsPerWeek,
    longestStreak,
  };
}

function getWeekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

module.exports = { analyzeRepo };
