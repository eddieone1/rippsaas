#!/usr/bin/env node
/**
 * Prebuild patch: fix Set iteration in insights dashboard route so the build
 * compiles on any TypeScript target (e.g. Vercel with cached/old code).
 */
const path = require('path');
const fs = require('fs');

const routePath = path.resolve(__dirname, '..', 'app', 'api', 'insights', 'dashboard', 'route.ts');
if (!fs.existsSync(routePath)) {
  console.warn('patch-insights-route: route file not found at ' + routePath);
  process.exit(0);
  return;
}
let content = fs.readFileSync(routePath, 'utf8');

// Replace the exact expression that triggers the Set iteration error (any formatting)
const bad = '[...last12Keys, ...Object.keys(churnedByMonth)]';
const good = 'Array.from(last12Keys).concat(Object.keys(churnedByMonth) as ChurnMonth[])';

if (content.includes(bad)) {
  content = content.split(bad).join(good);
  fs.writeFileSync(routePath, content);
  console.log('Patched app/api/insights/dashboard/route.ts for Set iteration compatibility.');
} else if (content.includes('last12Keys')) {
  console.warn('patch-insights-route: file contains last12Keys but not the spread pattern');
}
