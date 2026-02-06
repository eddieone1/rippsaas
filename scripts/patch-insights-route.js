#!/usr/bin/env node
/**
 * Prebuild patch: fix Set iteration in insights dashboard route so the build
 * compiles on any TypeScript target (e.g. Vercel with cached/old code).
 */
const path = require('path');
const fs = require('fs');

const routePath = path.resolve(__dirname, '..', 'app', 'api', 'insights', 'dashboard', 'route.ts');
if (!fs.existsSync(routePath)) {
  console.warn('patch-insights-route: route file not found, skipping');
  process.exit(0);
  return;
}
let content = fs.readFileSync(routePath, 'utf8');

// Match line with any leading whitespace; allow optional space after comma
const badRegex = /(\s*)const allMonthKeys = new Set<ChurnMonth>\(\[\.\.\.last12Keys,\s*\.\.\.Object\.keys\(churnedByMonth\)\]\);/;
const match = content.match(badRegex);
if (match) {
  const indent = match[1];
  const goodLine = indent + 'const allMonthKeys = new Set<ChurnMonth>(Array.from(last12Keys).concat(Object.keys(churnedByMonth) as ChurnMonth[]));';
  content = content.replace(badRegex, goodLine);
  fs.writeFileSync(routePath, content);
  console.log('Patched app/api/insights/dashboard/route.ts for Set iteration compatibility.');
} else if (content.includes('last12Keys')) {
  console.warn('patch-insights-route: file contains last12Keys but pattern did not match');
}
