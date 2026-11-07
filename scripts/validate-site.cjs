'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const requireFile = (relativePath) => {
  assert.ok(fs.existsSync(path.join(root, relativePath)), 'Missing required file: ' + relativePath);
};

for (const file of ['index.html', 'styles.css', 'v10.css', 'v11.css', 'catalog.js', 'v10-catalog.js', 'v11-catalog.js', 'v10-runtime.js', 'v11-runtime.js', 'app.js', 'icon.svg']) requireFile(file);

const html = read('index.html');
const css = read('styles.css');
const v10Css = read('v10.css');
const v11Css = read('v11.css');
const catalog = read('catalog.js');
const v10Catalog = read('v10-catalog.js');
const v11Catalog = read('v11-catalog.js');
const v10Runtime = read('v10-runtime.js');
const v11Runtime = read('v11-runtime.js');
const app = read('app.js');
const ticTacToe = read('games/tictactoe.js');
const connectFour = read('games/connect4.js');
const neonPong = read('games/pong.js');

assert.match(html, /^<!doctype html>/i, 'index.html must declare an HTML doctype');
assert.match(html, /<html\s+lang="en"/i, 'The page should declare its language');
assert.match(html, /<meta\s+name="viewport"/i, 'Mobile viewport metadata is required');
assert.match(html, /<title>PixelLab/i, 'Page title is missing');
assert.match(html, /href="styles\.css"/, 'The original stylesheet is not linked');
assert.match(html, /href="v10\.css"/, 'The V10 redesign stylesheet is not linked');
assert.match(html, /href="v11\.css"/, 'The V11 expansion stylesheet is not linked');
assert.match(html, /src="catalog\.js"/, 'The base game catalog is not linked');
assert.match(html, /src="v10-catalog\.js"/, 'The V10 catalog extension is not linked');
assert.match(html, /src="v11-catalog\.js"/, 'The V11 catalog extension is not linked');
assert.match(html, /src="app\.js"/, 'The main application script is not linked');
assert.match(html, /src="v10-runtime\.js"/, 'The V10 runtime is not linked');
assert.match(html, /src="v11-runtime\.js"/, 'The V11 runtime is not linked');
assert.ok(css.trim().length > 1000, 'The original stylesheet looks unexpectedly small');
assert.ok(v10Css.trim().length > 1000, 'The V10 stylesheet looks unexpectedly small');
assert.ok(v11Css.trim().length > 100, 'The V11 stylesheet looks unexpectedly small');
assert.ok(!/<style(?:\s|>)/i.test(html), 'Styles should stay in external stylesheets');
assert.ok(!/<script(?:\s|>)(?![^>]*\bsrc=)/i.test(html), 'JavaScript should be loaded from external files');

for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  const reference = match[1];
  if (/^(?:#|https?:|mailto:|data:|javascript:)/i.test(reference)) continue;
  const relativePath = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (!relativePath) continue;
  const resolved = path.resolve(root, relativePath);
  assert.ok(resolved === root || resolved.startsWith(root + path.sep), 'Unsafe local asset path: ' + reference);
  requireFile(path.relative(root, resolved));
}

const scriptFiles = [
  'catalog.js',
  'v10-catalog.js',
  'v11-catalog.js',
  'app.js',
  'v10-runtime.js',
  'v11-runtime.js',
  ...fs.readdirSync(path.join(root, 'games')).filter((name) => name.endsWith('.js')).sort().map((name) => path.posix.join('games', name)),
];
for (const file of scriptFiles) {
  const source = read(file);
  assert.ok(source.trim().length > 0, 'Empty JavaScript file: ' + file);
  new vm.Script(source, { filename: file });
}

const coreStart = catalog.indexOf('const engines=[');
const coreEnd = catalog.indexOf('const coreEngines=engines.slice();', coreStart);
assert.ok(coreStart >= 0 && coreEnd > coreStart, 'Could not locate the core game catalog');
const coreIds = [...catalog.slice(coreStart, coreEnd).matchAll(/\{id:'([^']+)'/g)].map((m) => m[1]);
assert.equal(coreIds.length, 24, 'The original catalog should still have 24 base engines');
assert.equal(new Set(coreIds).size, coreIds.length, 'Base engine IDs must be unique');

const themesStart = catalog.indexOf('const themes=[');
const themesEnd = catalog.indexOf('const coreEngines=engines.slice();', themesStart);
const themeIds = [...catalog.slice(themesStart, themesEnd).matchAll(/\{name:'([^']+)',colors:/g)].map((m) => m[1]);
assert.equal(themeIds.length, 10, 'The catalog should retain its ten defined visual theme presets');
assert.equal(new Set(themeIds).size, themeIds.length, 'Theme names must be unique');

const originalStart = catalog.indexOf('const originalEngines=[');
const originalEnd = catalog.indexOf('\n];', originalStart);
assert.ok(originalStart >= 0 && originalEnd > originalStart, 'Could not locate the original games');
const originalIds = [...catalog.slice(originalStart, originalEnd).matchAll(/\{id:'([^']+)'/g)].map((m) => m[1]);
assert.equal(originalIds.length, 3, 'The three original V7 games should remain in the base catalog');
assert.equal(new Set(originalIds).size, originalIds.length, 'Original game IDs must be unique');
assert.equal(coreIds.filter((id) => originalIds.includes(id)).length, 0, 'Original game IDs must not collide with base game IDs');
assert.match(catalog, /Array\.from\(\{length:192\}/, 'The 192 legacy catalog entries appear to have changed');
assert.match(catalog, /games\.push\(\.\.\.originalEngines\.map/, 'Original games must be appended to the base catalog');
assert.equal(192 + originalIds.length, 195, 'Expected 192 legacy variants plus three base originals');

const v10Ids = [...v10Catalog.matchAll(/^ {4}id:\s*'([^']+)'/gm)].map((m) => m[1]);
assert.equal(v10Ids.length, 5, 'V10 must introduce exactly five original 3D games in the first release');
assert.equal(new Set(v10Ids).size, v10Ids.length, 'V10 3D game IDs must be unique');
assert.match(v10Catalog, /engines\.push\(\.\.\.v10ThreeEngines\)/, 'V10 engines must be registered before the app initializes');
assert.match(v10Catalog, /is3D:\s*true/, 'V10 games must be tagged for the 3D showcase and filter');
assert.match(v10Catalog, /games\.push\(\.\.\.v10ThreeEngines\.map/, 'V10 games must be appended to the public catalog');

const v11Start = v11Catalog.indexOf('const v11ThreeEngines = [');
const v11End = v11Catalog.indexOf('\n];', v11Start);
assert.ok(v11Start >= 0 && v11End > v11Start, 'Could not locate the V11 game definitions');
const v11Ids = [...v11Catalog.slice(v11Start, v11End).matchAll(/\bid:\s*'([^']+)'/g)].map((m) => m[1]);
assert.equal(v11Ids.length, 3, 'V11 should introduce exactly three new 3D games in the first expansion');
assert.equal(new Set(v11Ids).size, v11Ids.length, 'V11 3D game IDs must be unique');
assert.match(v11Catalog, /engines\.push\(\.\.\.v11ThreeEngines\)/, 'V11 engines must be registered before the app initializes');
assert.match(v11Catalog, /games\.push\(\.\.\.v11ThreeEngines\.map/, 'V11 games must be appended to the public catalog');
assert.equal(195 + v10Ids.length + v11Ids.length, 203, 'Expected 203 combined catalog entries');

const runStart = app.indexOf('function runGame(g)');
const runEnd = app.indexOf('\n\nsetupDaily();', runStart + 15);
assert.ok(runStart >= 0 && runEnd > runStart, 'Could not locate the base runGame dispatcher');
const routes = [...app.slice(runStart, runEnd).matchAll(/case'([^']+)':return\s+(game\w+)\(g\)/g)].map((m) => ({ id: m[1], fn: m[2] }));
assert.equal(routes.length, 27, 'The original 27 game engines should retain their launch routes');
assert.equal(new Set(routes.map((r) => r.id)).size, routes.length, 'Game launch routes must be unique');

const gameDir = path.join(root, 'games');
const gameFiles = fs.readdirSync(gameDir).filter((name) => name.endsWith('.js'));
assert.equal(gameFiles.length, routes.length, 'There should still be one JavaScript module per original playable engine');
const declaredScripts = scriptFiles.map((file) => ({ file, source: read(file) }));
for (const route of routes) {
  const expectedFile = path.posix.join('games', route.id + '.js');
  requireFile(expectedFile);
  const module = declaredScripts.find((item) => item.file === expectedFile);
  assert.ok(module && new RegExp('function\\s+' + route.fn + '\\s*\\(').test(module.source), 'Missing ' + route.fn + ' in ' + expectedFile);
}

for (const functionName of ['gameNeonStrike', 'gameGravityRush', 'gameVelocityX', 'gameWildlands', 'gameParkEmpire']) {
  assert.match(v10Runtime, new RegExp('function\\s+' + functionName + '\\s*\\('), 'Missing V10 3D game: ' + functionName);
}
assert.match(v10Runtime, /function startThreeGame/, 'The shared on-demand 3D runtime is missing');
assert.match(v10Runtime, /cdn\.jsdelivr\.net\/npm\/three@0\.164\.1/, 'The pinned Three.js module reference is missing');
assert.match(v10Runtime, /requestAnimationFrame/, 'The 3D runtime needs a frame loop');
assert.match(v10Runtime, /renderer\.dispose/, 'The 3D runtime must dispose graphics resources when a game closes');
assert.match(v10Runtime, /global\.startThreeGame = startThreeGame/, 'The shared 3D game API must be exposed to V11');

for (const functionName of ['gameNeonStrike', 'gameGravityRush', 'gameVelocityX', 'gameWildlands', 'gameParkEmpire', 'gameMythicRealms', 'gameTrailblazer', 'gameWildcraft']) {
  assert.match(v11Runtime, new RegExp('function\\s+' + functionName + '\\s*\\('), 'Missing V11 3D game: ' + functionName);
}
assert.match(v11Runtime, /previousRunGame\(game\)/, 'V11 must preserve the original non-3D launch routes');
assert.match(v11Runtime, /completedBiomes/, 'Wildlands must track completion across all three regions');
assert.match(v11Runtime, /Craft shelter/, 'Wildcraft must include a crafting objective');

const scriptTags = [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)].map((m) => m[1]);
assert.equal(scriptTags.length, 6 + routes.length, 'All base, V10, V11, and original game scripts must be included in index.html');
assert.ok(html.includes('Search 203 games'), 'Search placeholder should reflect the expanded catalog count');
assert.match(html, /id="allCount">203</, 'The displayed game count should be 203');

for (const [name, source] of [['Tic-Tac-Toe', ticTacToe], ['Connect Four', connectFour], ['Neon Pong', neonPong]]) {
  assert.match(source, /Play vs AI/, name + ' must retain its AI mode');
  assert.match(source, /2 Players · Same Device/, name + ' must offer same-device play');
  assert.match(source, /Online room/, name + ' should disclose the online-room roadmap');
  assert.match(source, /mode(?:Button|Card)\('🌐 Online room'.*true\)/s, name + ' must not present online rooms as working yet');
  assert.match(source, /btn\.disabled=disabled/, name + ' must be able to disable unavailable modes');
}

assert.match(v10Css, /\.v10-showcase/, 'The V10 3D showcase styles are missing');
assert.match(v10Css, /\.three-stage/, 'The responsive 3D game stage styles are missing');
assert.match(v11Css, /\.v11-universe-note/, 'The V11 universe styling is missing');
assert.match(v10Runtime, /activeFilter === '3D Games'/, 'The dedicated 3D games filter is missing');
for (const genre of ['RPG & Fantasy', 'Vehicle Simulation', 'Survival & Crafting']) {
  assert.ok(v11Runtime.includes(genre), 'Missing V11 discovery genre: ' + genre);
}

console.log('PixelLab V11 validation passed.');
console.log('Base catalog: 192 legacy variants + 3 original games = 195 entries.');
console.log('V10 adds 5 original 3D engines; V11 adds 3 more, for 203 catalog entries.');
console.log('Playable engines: ' + (routes.length + v10Ids.length + v11Ids.length) + '; JavaScript syntax-checked: ' + scriptFiles.length + '.');
console.log('HTML assets, catalog extensions, 3D launchers, and cleanup hooks were verified.');
