'use strict';

const engines=[
{id:'snake',name:'Snake Sprint',category:'Arcade',emoji:'🐍',desc:'Grow your snake and chase golden bonus fruit.',instructions:'Use arrow keys or WASD. Every fourth fruit spawns a golden bonus worth 3 points that disappears after a few seconds.'},
{id:'pong',name:'Neon Pong',category:'Sports',emoji:'🏓',desc:'Outplay the computer in a neon rally.',instructions:'Use W/S or ↑/↓ to move your paddle. First to 5 points wins.'},
{id:'breakout',name:'Brick Breaker',category:'Arcade',emoji:'🧱',desc:'Break every brick and catch falling power-ups.',instructions:'Move your paddle with the mouse, touch, or ←/→. Catch W for a wide paddle, S to slow the ball, or + for an extra life.'},
{id:'reaction',name:'Reaction Rush',category:'Quick Play',emoji:'⚡',desc:'Wait for the signal, then click fast.',instructions:'Press start, wait for the panel to turn green, then click as fast as you can. Do not jump the signal.'},
{id:'memory',name:'Memory Match',category:'Puzzle',emoji:'🧠',desc:'Flip cards and find every matching pair.',instructions:'Flip two cards at a time. Remember what you saw and match all eight pairs.'},
{id:'merge',name:'Number Merge',category:'Puzzle',emoji:'🔢',desc:'Combine matching tiles to reach 2048.',instructions:'Use arrow keys or the on-screen arrows to slide tiles. Matching numbers merge together.'},
{id:'tictactoe',name:'Tic Tac Toe',category:'Strategy',emoji:'⭕',desc:'Can you beat the computer at the classic?',instructions:'You are X. Pick a square to place your mark. Make three in a row before the computer.'},
{id:'typing',name:'Type Blitz',category:'Quick Play',emoji:'⌨️',desc:'Type the words before time runs out.',instructions:'Type each word exactly and press Enter. Clear as many words as you can in 30 seconds.'},
{id:'whack',name:'Whack-a-Mole',category:'Action',emoji:'🐹',desc:'Catch the pop-up targets before they disappear.',instructions:'Tap the glowing target as soon as it appears. Score as many hits as possible in 20 seconds.'},
{id:'aim',name:'Aim Trainer',category:'Action',emoji:'🎯',desc:'Hit the targets and build a clean streak.',instructions:'Click each target when it appears. Hit 10 targets as quickly as possible.'},
{id:'dodge',name:'Orbit Dodger',category:'Action',emoji:'🚀',desc:'Dodge debris, collect shields, and grab bonus points.',instructions:'Use ←/→ or A/D, or drag on the playfield. Cyan shields block one crash; gold pickups add bonus points. Difficulty ramps up as you survive.'},
{id:'tap',name:'Tap Frenzy',category:'Arcade',emoji:'👆',desc:'A ten-second test of your tapping speed.',instructions:'Hit the button as many times as possible before the timer reaches zero.'}
,
{id:'mines',name:'Minefield',category:'Puzzle',emoji:'💣',desc:'Clear a minefield using logic, not luck.',instructions:'Reveal safe squares. Use Flag mode to mark suspected mines. Clear every safe tile to win.'},
{id:'simon',name:'Simon Sequence',category:'Quick Play',emoji:'🎨',desc:'Remember the light pattern and repeat it.',instructions:'Watch the colored sequence, then tap the same colors in order. Each round adds one more step.'},
{id:'scramble',name:'Word Scramble',category:'Puzzle',emoji:'🔤',desc:'Unscramble the word before the clock runs out.',instructions:'Type the correct word from the mixed-up letters and press Enter. Solve as many as possible in 45 seconds.'},
{id:'clicker',name:'Cosmic Clicker',category:'Arcade',emoji:'🪐',desc:'Tap, earn, buy boosts, and build a tiny empire.',instructions:'Tap the core to earn energy. Buy click upgrades and auto-generators when you can afford them.'},
{id:'flappy',name:'Flappy Pixel',category:'Action',emoji:'🐤',desc:'Fly through tightening gates and collect bonus stars.',instructions:'Click, tap, or press Space to flap. Gaps get tighter and pipes move faster as you clear gates. Grab gold stars near the gaps for bonus points.'},
{id:'math',name:'Math Sprint',category:'Quick Play',emoji:'➗',desc:'Solve quick-fire math questions against the clock.',instructions:'Choose the correct answer before time expires. Build a streak and answer as many as possible in 30 seconds.'},
{id:'connect4',name:'Connect Four',category:'Strategy',emoji:'🔴',desc:'Drop four discs in a row against the CPU.',instructions:'Choose a column to drop your red disc. Connect four horizontally, vertically, or diagonally before the CPU.'},
{id:'platform',name:'Pixel Platformer',category:'Action',emoji:'🧝',desc:'Jump across platforms and collect every crystal.',instructions:'Use left/right or A/D to move and Space/up to jump. Collect the crystals and reach the glowing exit.'},
{id:'trivia',name:'Trivia Blitz',category:'Quick Play',emoji:'💡',desc:'A fast mixed-topic quiz with ten questions.',instructions:'Pick the best answer for each question. Build your score across ten quick questions.'},
{id:'color',name:'Color Clash',category:'Quick Play',emoji:'🌈',desc:'Read the ink, ignore the word, and react fast.',instructions:'Choose the color the word is printed in — not the word itself. Score as many correct answers as you can in 25 seconds.'},
{id:'lights',name:'Lights Out',category:'Puzzle',emoji:'💡',desc:'Switch off every light with the fewest moves.',instructions:'Tap a tile to toggle it and its four neighbors. Turn every light off to solve the board.'},
{id:'maze',name:'Maze Runner',category:'Puzzle',emoji:'🌀',desc:'Race through a new maze and collect hidden gems.',instructions:'Every run generates a different maze. Move with arrow keys or WASD, collect up to 3 stars, and find the green exit.'}
];
const themes=[
{name:'Neon',colors:['#473078','#153c50']},{name:'Pixel',colors:['#3e3260','#254b45']},{name:'Turbo',colors:['#66365f','#27355c']},{name:'Cosmic',colors:['#3f2b70','#244a60']},{name:'Retro',colors:['#5a394e','#314655']},{name:'Prism',colors:['#4e3579','#285c60']},{name:'Arcade',colors:['#5b3444','#243b60']},{name:'Glow',colors:['#373c72','#305d5b']},{name:'Hyper',colors:['#583b6d','#3f3547']},{name:'Dream',colors:['#4e326b','#274853']}
];
const coreEngines=engines.slice();
const originalEngines=[
{id:'rift-runner',name:'Rift Runner',category:'Action',emoji:'🌀',desc:'Phase between two dimensions, grab rift shards, and reach the portal.',instructions:'Move with ←/→ or A/D; jump with Space or ↑; press X to shift dimensions. Cyan and violet platforms exist in different phases. Collect at least 5 shards and reach the portal. You get checkpoints and 3 lives.'},
{id:'circuit-crafter',name:'Circuit Crafter',category:'Puzzle',emoji:'🔌',desc:'Rotate scrambled circuit tiles to power the exit before moves run out.',instructions:'Click or tap a tile to rotate it clockwise. Connect the glowing power source to the exit by matching pipe openings. Solve the circuit in as few moves as you can.'},
{id:'star-courier',name:'Star Courier',category:'Action',emoji:'📦',desc:'Deliver three cargo pods through a shifting asteroid field.',instructions:'Move with arrow keys or WASD; use Space to boost. Pick up one cargo pod at a time and bring it to the blue dock. Avoid patrol drones. Deliver all 3 before you run out of lives.'}
];
engines.push(...originalEngines);
const recommendedEngines=new Set(['snake','breakout','merge','platform','mines','connect4','flappy']);
const popularEngines=new Set(['snake','pong','breakout','tictactoe','whack','connect4','flappy','dodge']);
const games=Array.from({length:192},(_,i)=>{const e=coreEngines[i%coreEngines.length],t=themes[Math.floor(i/coreEngines.length)%themes.length],variant=Math.floor(i/coreEngines.length)+1;return{id:e.id+'-'+t.name.toLowerCase(),engine:e.id,name:t.name+' '+e.name,category:e.category,emoji:e.emoji,desc:e.desc,colors:t.colors,theme:t.name,variant,recommended:variant===1&&recommendedEngines.has(e.id),popular:variant===1&&popularEngines.has(e.id)};});
games.push(...originalEngines.map((e,i)=>({id:'original-'+e.id,engine:e.id,name:e.name,category:e.category,emoji:e.emoji,desc:e.desc,colors:[['#4a327e','#14524c'],['#284b6e','#594077'],['#6c3d5d','#153b52']][i],theme:'Original',variant:1,original:true,recommended:true,popular:true})));
