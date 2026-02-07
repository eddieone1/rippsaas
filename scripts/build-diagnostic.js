#!/usr/bin/env node
/**
 * Runs at start of build; prints to the Vercel build log so we can see
 * which commit and which code is being built.
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const routePath = path.resolve(__dirname, '..', 'app', 'api', 'insights', 'dashboard', 'route.ts');
let gitCommit = '(no .git)';
let routeSource = 'unknown';

try {
  gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (_) {
  gitCommit = '(git not available)';
}
try {
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    if (content.includes('combinedMonthKeys')) routeSource = 'NEW (combinedMonthKeys)';
    else if (content.includes('[...last12Keys, ...Object.keys(churnedByMonth)]')) routeSource = 'OLD (last12Keys spread)';
    else if (content.includes('last12Keys')) routeSource = 'OLD (last12Keys present)';
    else routeSource = 'other';
  } else {
    routeSource = 'FILE NOT FOUND';
  }
} catch (e) {
  routeSource = 'read error: ' + e.message;
}

console.log('[build-diagnostic] Git commit:', gitCommit);
console.log('[build-diagnostic] insights route.ts:', routeSource);
console.log('[build-diagnostic] Expected latest commit: 0afaa1e (fix: patch with substring replace...)');
