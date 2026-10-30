'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const requireFile = (relativePath) => {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `Missing required file: ${relativePath}`);
};

for (const file of ['index.html', 'styles.css', 'catalog.js', 'app.js', 'backend-config.js', 'multiplayer.js', 'icon.svg', 'supabase/migrations/001_multiplayer_universe.sql', 'V9_SETUP.md', 'V9_ROADMAP.md']) requireFile(file);

const html = read('index.html');
const css = read('styles.css');
const catalog = read('catalog.js');
const app = read('app.js');
const backendConfig = read('backend-config.js');
const multiplayer = read('multiplayer.js');
const multiplayerSql = read('supabase/migrations/001_multiplayer_universe.sql');
const ticTacToe = read('games/tictactoe.js');
const connectFour = read('games/connect4.js');
const neonPong = read('games/pong.js');

assert.match(html, /^<!doctype html>/i, 'index.html must declare an HTML doctype');
assert.match(html, /<html\s+lang="en"/i, 'The page should declare its language');
assert.match(html, /<meta\s+name="viewport"/i, 'Mobile viewport metadata is required');
assert.match(html, /<title>PixelLab/i, 'Page title is missing');
assert.match(html, /href="styles\.css"/, 'The external stylesheet is not linked');
assert.match(html, /src="catalog\.js"/, 'The game catalog is not linked');
assert.match(html, /src="app\.js"/, 'The main application script is not linked');
assert.ok(css.trim().length > 1000, 'The stylesheet looks unexpectedly small');
assert.ok(!/<style(?:\s|>)/i.test(html), 'Styles should stay in styles.css');
assert.ok(!/<script(?:\s|>)(?![^>]*\bsrc=)/i.test(html), 'JavaScript should be loaded from external files');

for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  const reference = match[1];
  if (/^(?:#|https?:|mailto:|data:|javascript:)/i.test(reference)) continue;
  const relativePath = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (!relativePath) continue;
  const resolved = path.resolve(root, relativePath);
  assert.ok(resolved === root || resolved.startsWith(root + path.sep), `Unsafe local asset path: ${reference}`);
  requireFile(path.relative(root, resolved));
}

const scriptFiles = [
  'catalog.js',
  'app.js',
  'backend-config.js',
  'multiplayer.js',
  ...fs.readdirSync(path.join(root, 'games')).filter((name) => name.endsWith('.js')).sort().map((name) => path.posix.join('games', name)),
];
for (const file of scriptFiles) {
  const source = read(file);
  assert.ok(source.trim().length > 0, `Empty JavaScript file: ${file}`);
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
assert.equal(originalIds.length, 3, 'The three original games should remain in the catalog');
assert.equal(new Set(originalIds).size, originalIds.length, 'Original game IDs must be unique');
assert.equal(coreIds.filter((id) => originalIds.includes(id)).length, 0, 'Original game IDs must not collide with base engine IDs');
assert.match(catalog, /Array\.from\(\{length:192\}/, 'The 192 legacy catalog entries appear to have changed');
assert.match(catalog, /games\.push\(\.\.\.originalEngines\.map/, 'Original games must be appended to the catalog');
assert.equal(192 + originalIds.length, 195, 'Expected 192 legacy variants plus three originals');

const runStart = app.indexOf('function runGame(g)');
const runEnd = app.indexOf('\n\nsetupDaily();', runStart + 15);
assert.ok(runStart >= 0 && runEnd > runStart, 'Could not locate runGame dispatcher');
const routes = [...app.slice(runStart, runEnd).matchAll(/case'([^']+)':return\s+(game\w+)\(g\)/g)].map((m) => ({ id: m[1], fn: m[2] }));
assert.equal(routes.length, 27, 'Every one of the 27 engines should have a launch route');
assert.equal(new Set(routes.map((r) => r.id)).size, routes.length, 'Game launch routes must be unique');

const gameDir = path.join(root, 'games');
const gameFiles = fs.readdirSync(gameDir).filter((name) => name.endsWith('.js'));
assert.equal(gameFiles.length, routes.length, 'There should be one JavaScript module per playable engine');
const declaredScripts = scriptFiles.map((file) => ({ file, source: read(file) }));
for (const route of routes) {
  const expectedFile = path.posix.join('games', `${route.id}.js`);
  requireFile(expectedFile);
  const module = declaredScripts.find((item) => item.file === expectedFile);
  assert.ok(module && new RegExp(`function\\s+${route.fn}\\s*\\(`).test(module.source), `Missing ${route.fn} in ${expectedFile}`);
  const inCatalog = coreIds.includes(route.id) || originalIds.includes(route.id);
  assert.ok(inCatalog, `Launch route ${route.id} is not present in the catalog`);
}

const scriptTags = [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)].map((m) => m[1]);
assert.equal(scriptTags.length, 5 + routes.length, 'Catalog, app, Supabase CDN, backend config, multiplayer, and game modules must be included in index.html');
assert.ok(html.includes('Search 195 games...'), 'Search placeholder should reflect the current catalog count');
assert.match(html, /id="allCount">195</, 'The displayed game count should be 195');

for (const [name, source] of [['Tic-Tac-Toe', ticTacToe], ['Connect Four', connectFour], ['Neon Pong', neonPong]]) {
  assert.match(source, /Play vs AI/, `${name} must retain its AI mode`);
  assert.match(source, /2 Players · Same Device/, `${name} must offer same-device multiplayer`);
  assert.match(source, /Online room/, `${name} must disclose its online mode`);
  assert.match(source, /btn\.disabled=disabled/, `${name} must be able to disable unavailable modes`);
  if (name === 'Tic-Tac-Toe') {
    assert.match(source, /openOnlineTicTacToe/, 'Tic-Tac-Toe must connect to the V9 room system');
    assert.doesNotMatch(source, /Online room[^\n]*coming soon/, 'Tic-Tac-Toe online mode should connect to V9');
  } else {
    assert.match(source, /mode(?:Button|Card)\('🌐 Online room'.*true\)/s, `${name} must remain online-disabled until server-side rules are ready`);
  }
}
assert.match(css, /\.mp-mode-picker/, 'Existing local multiplayer mode styles are missing');
assert.match(css, /\.multiplayer-hub/, 'The V9 multiplayer hub styles are missing');
assert.match(html, /id="multiplayerHub"/, 'The V9 multiplayer hub is missing');
assert.match(html, /src="multiplayer\.js"/, 'The V9 multiplayer client is not loaded');
assert.match(html, /src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js\@2"/, 'The Supabase browser client CDN is missing');
assert.match(backendConfig, /publishableKey:\s*''/, 'Backend config must start without a live publishable key');
assert.doesNotMatch(backendConfig, /sb_secret_|service_role/i, 'A server secret must never be added to browser configuration');
assert.match(multiplayer, /create_private_ttt_room/, 'Private room creation is missing');
assert.match(multiplayer, /join_private_ttt_room/, 'Private room joining is missing');
assert.match(multiplayer, /make_ttt_move/, 'Online Tic-Tac-Toe move calls are missing');
assert.match(multiplayer, /mpRecoveryForm/, 'Account password recovery UI is missing');
assert.match(multiplayer, /mpResumeRoom/, 'Active room resume UI is missing');
assert.match(multiplayerSql, /enable row level security/i, 'Database row-level security must be enabled');
assert.match(multiplayerSql, /Only room participants can read rooms/i, 'Private room-read policy is missing');
assert.match(multiplayerSql, /Players read only their match history/i, 'Participant-only match history policy is missing');
assert.match(multiplayerSql, /revoke all on table public\.rooms from public, anon, authenticated/i, 'Room table default grants must be revoked');
assert.match(multiplayerSql, /revoke all on table public\.profiles from public, anon, authenticated/i, 'Profile table default grants must be revoked');
assert.match(multiplayerSql, /grant execute on function public\.make_ttt_move\(uuid, integer\) to authenticated/i, 'Move RPC must be granted only to signed-in users');
assert.match(multiplayerSql, /v_room\.turn_user_id <> v_uid/i, 'The database must validate whose turn it is');
assert.match(multiplayerSql, /That square is already taken/i, 'The database must reject occupied squares');
assert.match(multiplayerSql, /insert into public\.match_history/i, 'Completed matches must be stored');
assert.match(multiplayerSql, /board jsonb not null default '\["","","","","","","","",""\]'::jsonb/i, 'The Tic-Tac-Toe board must start with exactly nine cells');
assert.doesNotMatch(multiplayer, /watchRoom\(/, 'All active room views must use the shared room renderer');
const sqlTags = [...multiplayerSql.matchAll(/\$[a-z_]+\$/g)].map((match) => match[0]);
for (const tag of new Set(sqlTags)) {
  assert.equal(sqlTags.filter((item) => item === tag).length, 2, `SQL dollar-quote tag ${tag} must be paired`);
}
assert.match(multiplayerSql, /create trigger on_pixel_lab_user_created/i, 'New accounts must receive a profile row');
assert.match(multiplayerSql, /pg_advisory_xact_lock/i, 'Room creation must serialize duplicate active-room checks');
assert.match(multiplayerSql, /expires_at > now\(\)/i, 'Expired rooms must not be joinable');

console.log('PixelLab validation passed.');
console.log(`Catalog: ${coreIds.length} engines × ${themeIds.length} themes + ${originalIds.length} originals = 195 entries.`);
console.log(`Playable engines: ${routes.length}; JavaScript files syntax-checked: ${scriptFiles.length}.`);
console.log('Local HTML assets and every game launcher were verified.');
