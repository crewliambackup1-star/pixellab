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

for (const file of ['index.html', 'styles.css', 'v10.css', 'v11.css', 'v12.css', 'multiplayer.css', 'multiplayer.js', 'catalog.js', 'supabase/migrations/20261124151113_create_invite_multiplayer_tables.sql', 'supabase/migrations/20261124151151_add_multiplayer_room_functions.sql', 'supabase/migrations/20261124151157_authorize_private_multiplayer_channels.sql', 'supabase/migrations/20261124151326_index_multiplayer_room_foreign_keys.sql', 'supabase/migrations/20261124152003_reject_moves_in_expired_rooms.sql', 'v10-catalog.js', 'v11-catalog.js', 'v10-runtime.js', 'v11-runtime.js', 'app.js', 'icon.svg']) requireFile(file);

const html = read('index.html');
const css = read('styles.css');
const v10Css = read('v10.css');
const v11Css = read('v11.css');
const v12Css = read('v12.css');
const multiplayerCss = read('multiplayer.css');
const multiplayer = read('multiplayer.js');
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
assert.match(html, /href="v12\.css"/, 'The V12 gameplay stylesheet is not linked');
assert.match(html, /href="multiplayer\.css"/, 'The V12.2 multiplayer stylesheet is not linked');
assert.match(html, /src="multiplayer\.js"/, 'The V12.2 multiplayer client is not linked');
assert.match(html, /src="catalog\.js"/, 'The base game catalog is not linked');
assert.match(html, /src="v10-catalog\.js"/, 'The V10 catalog extension is not linked');
assert.match(html, /src="v11-catalog\.js"/, 'The V11 catalog extension is not linked');
assert.match(html, /src="app\.js"/, 'The main application script is not linked');
assert.match(html, /src="v10-runtime\.js"/, 'The V10 runtime is not linked');
assert.match(html, /src="v11-runtime\.js"/, 'The V11 runtime is not linked');
assert.ok(css.trim().length > 1000, 'The original stylesheet looks unexpectedly small');
assert.ok(v10Css.trim().length > 1000, 'The V10 stylesheet looks unexpectedly small');
assert.ok(v11Css.trim().length > 100, 'The V11 stylesheet looks unexpectedly small');
assert.ok(v12Css.trim().length > 300, 'The V12 gameplay stylesheet looks unexpectedly small');
assert.ok(multiplayerCss.includes('.pl-mp-panel'), 'The multiplayer account and room UI styles are missing');
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
  'multiplayer.js',
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

assert.match(v10Runtime, /three-pause-toggle/, 'V12 3D pause controls are missing');
assert.match(v10Runtime, /session\.paused/, 'V12 3D pause state is missing');
assert.match(v10Runtime, /elapsedTime \+= dt/, 'The 3D world clock must pause with the game');

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
assert.equal(scriptTags.length, 7 + routes.length, 'All base, V10, V11, V12.2 and original game scripts must be included in index.html');
assert.ok(html.includes('Search 203 games'), 'Search placeholder should reflect the expanded catalog count');
assert.match(html, /id="allCount">203</, 'The displayed game count should be 203');

for (const [name, source] of [['Tic-Tac-Toe', ticTacToe], ['Connect Four', connectFour]]) {
  assert.match(source, /Play vs AI|Easy AI/, name + ' must retain its AI mode');
  assert.match(source, /2 Players · Same Device/, name + ' must offer same-device play');
  assert.match(source, /modeButton\('🌐 Online room'.*'online'\)/s, name + ' must enable private online rooms');
  assert.match(source, /openOnlineLobby/, name + ' must launch the multiplayer lobby');
  assert.match(source, /play_multiplayer_move|onlineSession\.move/, name + ' must send server-validated moves');
}
assert.match(neonPong, /Online room/, 'Neon Pong should disclose the staged multiplayer rollout');
assert.match(neonPong, /modeCard\('🌐 Online room'.*true\)/s, 'Neon Pong must remain disabled until real-time multiplayer is ready');

assert.match(multiplayer, /https:\/\/gfctivjdghxbcfgytsbs\.supabase\.co/, 'The Supabase project URL is missing');
assert.match(multiplayer, /sb_publishable_[A-Za-z0-9_-]+/, 'The browser must use a publishable Supabase key');
assert.match(multiplayer, /supabase-js@2\.119\.2/, 'The Supabase client version must stay pinned');
assert.match(multiplayer, /private:\s*true/, 'Realtime rooms must use private channels');
assert.match(multiplayer, /new Set\(\['tictactoe', 'connect4'\]\)/, 'Only the first two turn-based games should be online-enabled');
for (const rpc of ['create_game_room', 'join_game_room', 'get_game_room', 'play_multiplayer_move', 'cancel_game_room']) {
  assert.ok(multiplayer.includes("'" + rpc + "'"), 'Missing Supabase multiplayer RPC: ' + rpc);
}
assert.doesNotMatch(multiplayer, /service_role|sb_secret_/i, 'A privileged Supabase key must never be exposed in browser code');

assert.match(v10Css, /\.v10-showcase/, 'The V10 3D showcase styles are missing');
assert.match(v10Css, /\.three-stage/, 'The responsive 3D game stage styles are missing');
assert.match(v11Css, /\.v11-universe-note/, 'The V11 universe styling is missing');
assert.match(v10Runtime, /activeFilter === '3D Games'/, 'The dedicated 3D games filter is missing');
for (const genre of ['RPG & Fantasy', 'Vehicle Simulation', 'Survival & Crafting']) {
  assert.ok(v11Runtime.includes(genre), 'Missing V11 discovery genre: ' + genre);
}


const v12FeatureChecks = [
  ['games/rift-runner.js', /dashCooldown/, 'Rift Runner needs its V12 dash ability'],
  ['games/circuit-crafter.js', /Free route hint/, 'Circuit Crafter needs its one-use route hint'],
  ['games/star-courier.js', /delivery combo/, 'Star Courier needs delivery combo feedback'],
  ['games/reaction.js', /Three-attempt challenge/, 'Reaction Rush needs its best-of-three challenge'],
  ['games/memory.js', /startClock/, 'Memory Match needs its timed round'],
  ['games/aim.js', /bestStreak/, 'Aim Trainer needs streak tracking'],
  ['games/whack.js', /spawnDelay/, 'Whack-a-Mole needs its difficulty ramp'],
  ['games/tap.js', /bonusWindows/, 'Tap Frenzy needs its 2x surge windows'],
  ['games/typing.js', /correctWords/, 'Type Blitz needs accuracy tracking'],
  ['games/tictactoe.js', /aiDifficulty/, 'Tic-Tac-Toe needs selectable AI difficulty'],
  ['games/merge.js', /Undo last move/, 'Number Merge needs its one-use undo'],
  ['games/snake.js', /tickMs/, 'Snake needs progressive speed'],
  ['games/pong.js', /const skill=Math\.min/, 'Neon Pong needs adaptive AI'],
  ['games/breakout.js', /score===wave\*30/, 'Brick Breaker needs multi-wave progression'],
  ['games/dodge.js', /nearMisses/, 'Orbit Dodger needs near-miss scoring'],
  ['games/mines.js', /firstMove/, 'Minefield needs a protected first reveal'],
  ['games/simon.js', /520-Math\.max/, 'Simon Sequence needs a speed ramp'],
  ['games/scramble.js', /hintButton/, 'Word Scramble needs its extra-letter hint'],
  ['games/clicker.js', /surgeUntil/, 'Cosmic Clicker needs its timed surge'],
  ['games/flappy.js', /shieldUsed/, 'Flappy Pixel needs its recoverable shield'],
  ['games/math.js', /bestStreak/, 'Math Sprint needs streak scoring'],
  ['games/connect4.js', /hintColumn/, 'Connect Four needs strategic hints'],
  ['games/platform.js', /checkpoint=\{x:370/, 'Pixel Platformer needs its mid-level checkpoint'],
  ['games/trivia.js', /bestStreak/, 'Trivia Blitz needs combo scoring'],
  ['games/color.js', /bestStreak/, 'Color Clash needs combo scoring'],
  ['games/lights.js', /solutionMoves/, 'Lights Out needs generated solution hints'],
  ['games/maze.js', /startedAt/, 'Maze Runner needs its speed-run timer'],
];
for (const [file, pattern, message] of v12FeatureChecks) {
  assert.match(read(file), pattern, message);
}
const v12_1FeatureChecks = [
  ['games/aim.js', /golden bullseye/i, 'Aim Trainer needs its golden target bonus'],
  ['games/breakout.js', /bestCombo/, 'Brick Breaker needs chain scoring'],
  ['games/circuit-crafter.js', /parMoves/, 'Circuit Crafter needs score grades based on move par'],
  ['games/clicker.js', /criticals/, 'Cosmic Clicker needs critical taps'],
  ['games/color.js', /focusBonus/, 'Color Clash needs its focus burst'],
  ['games/connect4.js', /ffc66d/, 'Connect Four needs a visible strategic hint'],
  ['games/dodge.js', /pickupChain/, 'Orbit Dodger needs pickup chains'],
  ['games/flappy.js', /starStreak/, 'Flappy Pixel needs star chains'],
  ['games/lights.js', /Perfect solve/, 'Lights Out needs solve grades'],
  ['games/math.js', /Five-answer streak/, 'Math Sprint needs streak time rewards'],
  ['games/maze.js', /gemScore/, 'Maze Runner needs gem-chain scoring'],
  ['games/memory.js', /seconds=Math.min\(75,seconds\+2\)/, 'Memory Match needs pair time rewards'],
  ['games/merge.js', /mergeCount/, 'Number Merge needs merge-chain scoring'],
  ['games/mines.js', /function chord/, 'Minefield needs clue-based chord clearing'],
  ['games/pong.js', /bestRally/, 'Neon Pong needs rally mastery tracking'],
  ['games/platform.js', /triggerDash/, 'Pixel Platformer needs a rechargeable air dash'],
  ['games/reaction.js', /lightning/, 'Reaction Rush needs elite reaction tracking'],
  ['games/rift-runner.js', /phaseBonus/, 'Rift Runner needs phase-aligned shard rewards'],
  ['games/scramble.js', /speedBonus/, 'Word Scramble needs quick-solve rewards'],
  ['games/simon.js', /echoUsed/, 'Simon Sequence needs its one-time comeback save'],
  ['games/snake.js', /foodStreak/, 'Snake needs food-chain scoring'],
  ['games/star-courier.js', /perfectDeliveries/, 'Star Courier needs clean pilot bonuses'],
  ['games/tap.js', /tapCombo/, 'Tap Frenzy needs rapid-tap chains'],
  ['games/tictactoe.js', /undoTurn/, 'Tic Tac Toe needs its one-use undo'],
  ['games/trivia.js', /lifelineUsed/, 'Trivia Blitz needs its 50/50 lifeline'],
  ['games/typing.js', /sec=Math.min\(36,sec\+2\)/, 'Type Blitz needs streak time rewards'],
  ['games/whack.js', /golden/, 'Whack-a-Mole needs golden bonus targets'],
];
for (const [file, pattern, message] of v12_1FeatureChecks) {
  assert.match(read(file), pattern, message);
}
for (const [pattern, message] of [
  [/precision\?120/, 'Neon Strike precision hits must pay a bonus'],
  [/dashCooldown/, 'Gravity Rush must have a dash cooldown'],
  [/ctx\.actions\.delete\('drift'\)/, 'Velocity X touch drift must be wired'],
  [/observeTime/, 'Wildlands must reward deliberate observation'],
  [/buildStreak/, 'Park Empire must reward attraction variety'],
  [/dashTime/, 'Mythic Realms must have an arcane dash'],
  [/perfectStops/, 'Trailblazer must reward precise parking'],
  [/rested/, 'Wildcraft must have a one-use camp rest'],
]) assert.match(v11Runtime, pattern, message);

assert.match(v11Runtime, /root\.rotation\.y=Math\.atan2/, 'Velocity X car heading must follow the racing line');
assert.match(v11Runtime, /wildlifeSeen/, 'Wildlands must track wildlife discoveries');
assert.match(v11Runtime, /varietyCount/, 'Park Empire must reward attraction variety');
assert.match(v11Runtime, /spellCooldown/, 'Mythic Realms must limit spell pulse spam');
assert.match(v11Runtime, /Math\.abs\(speed\)>8/, 'Trailblazer delivery stops must require braking');
assert.match(v11Runtime, /builtCampfire/, 'Wildcraft must include the optional campfire objective');

console.log('PixelLab V12.1 validation passed.');
console.log('Catalog: 195 legacy/base entries plus 8 original 3D games = 203 entries.');
console.log('V12.1 adds a second gameplay pass to all 35 playable engines using the 75/25 priority split.');
console.log('Playable engines: ' + (routes.length + v10Ids.length + v11Ids.length) + '; JavaScript syntax-checked: ' + scriptFiles.length + '.');
console.log('HTML assets, catalog extensions, V12 and V12.1 gameplay markers, and cleanup hooks were verified.');
