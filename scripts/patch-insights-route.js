#!/usr/bin/env node
/**
 * Prebuild patch: fix Set iteration in insights dashboard route so the build
 * compiles on any TypeScript target (e.g. Vercel with cached/old code).
 */
const path = require('path');
const fs = require('fs');

const routePath = path.join(__dirname, '..', 'app', 'api', 'insights', 'dashboard', 'route.ts');
let content = fs.readFileSync(routePath, 'utf8');

const badLine = 'const allMonthKeys = new Set<ChurnMonth>([...last12Keys, ...Object.keys(churnedByMonth)]);';
const goodLine = 'const allMonthKeys = new Set<ChurnMonth>(Array.from(last12Keys).concat(Object.keys(churnedByMonth) as ChurnMonth[]));';

if (content.includes(badLine)) {
  content = content.replace(badLine, goodLine);
  fs.writeFileSync(routePath, content);
  console.log('Patched app/api/insights/dashboard/route.ts for Set iteration compatibility.');
}
