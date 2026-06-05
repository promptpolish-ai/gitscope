#!/usr/bin/env node
const { program } = require('commander');
const { analyzeRepo } = require('../lib/analyzer');
const { generateReport } = require('../lib/reporter');
const pkg = require('../package.json');

program
  .name('gitscope')
  .description('Analyze git history and generate beautiful contribution reports')
  .version(pkg.version)
  .argument('[path]', 'Path to git repository', '.')
  .option('-o, --output <file>', 'Output HTML file', 'gitscope-report.html')
  .option('--since <date>', 'Start date (e.g. "2024-01-01" or "1 year ago")')
  .option('--until <date>', 'End date')
  .option('--author <name>', 'Filter by author')
  .option('--open', 'Open report in browser')
  .action(async (path, options) => {
    try {
      console.log('\n  \x1b[36m🔍 Gitscope — Analyzing repository...\x1b[0m\n');
      const stats = await analyzeRepo(path, {
        since: options.since,
        until: options.until,
        author: options.author,
      });
      const outputPath = await generateReport(stats, options.output);
      console.log(`\n  \x1b[32m✅ Report generated:\x1b[0m ${outputPath}\n`);
      if (options.open) {
        const { execSync } = require('child_process');
        const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        execSync(`${cmd} "${outputPath}"`);
        console.log('  \x1b[36m🌐 Opened in browser\x1b[0m\n');
      }
    } catch (err) {
      console.error('\n  \x1b[31m❌ Error:\x1b[0m', err.message, '\n');
      process.exit(1);
    }
  });

program.parse();
