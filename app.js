'use strict';
const $=id=>document.getElementById(id);
const storage={get(k,f){try{const v=localStorage.getItem('pixellab-'+k);return v?JSON.parse(v):f}catch{return f}},set(k,v){try{localStorage.setItem('pixellab-'+k,JSON.stringify(v))}catch{}}};
let favorites=new Set(storage.get('favorites',[])),recent=storage.get('recent',[]),scores=storage.get('scores',{}),activeFilter='All',searchText='',sortMode='featured',currentGame=null,cleanup=()=>{},keyHandler=null;
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function flash(s){const el=$('toast');el.textContent=s;el.classList.add('show');clearTimeout(flash.timer);flash.timer=setTimeout(()=>el.classList.remove('show'),1800)}
function saveFavorites(){storage.set('favorites',[...favorites])}
function getEngine(game){return engines.find(e=>e.id===game.engine)||engines[0]}
function renderChips(){const cats=[['All','✦'],['Recommended','✨'],['Popular','🔥'],['Arcade','🕹️'],['Puzzle','🧩'],['Action','⚡'],['Sports','🏆'],['Strategy','🧠'],['Quick Play','⏱️'],['Favorites','♥'],['Recent','◷']];$('chips').innerHTML=cats.map(([c,ico])=>{const n=c==='All'?games.length:c==='Recommended'?games.filter(g=>g.recommended).length:c==='Popular'?games.filter(g=>g.popular).length:c==='Favorites'?favorites.size:c==='Recent'?recent.length:null;return '<button class="chip '+(activeFilter===c?'active':'')+'" data-filter="'+c+'">'+ico+' '+c+(n===null?'':' · '+n)+'</button>'}).join('')}
function cardHTML(g){const fav=favorites.has(g.id);return '<article class="game-card"><div class="cover" data-game="'+g.id+'" role="button" tabindex="0" aria-label="Play '+esc(g.name)+'" style="--c1:'+g.colors[0]+';--c2:'+g.colors[1]+'"><span class="cover-tag">'+esc(g.original?'ORIGINAL':g.theme.toUpperCase())+'</span><span class="cover-emoji">'+g.emoji+'</span><button class="fav '+(fav?'on':'')+'" data-fav="'+g.id+'" aria-label="'+(fav?'Remove from':'Add to')+' favorites">'+(fav?'♥':'♡')+'</button></div><div class="card-body"><div class="card-title-line"><div class="card-title">'+esc(g.name)+'</div></div><div class="card-desc">'+esc(g.desc)+'</div><div class="card-bottom"><span class="category">'+esc(g.category)+(g.original?' · Original':'')+'</span><button class="play-mini" data-game="'+g.id+'" aria-label="Play '+esc(g.name)+'">▶</button></div></div></article>'}
function filteredGames(){let list=games.filter(g=>{const match=activeFilter==='All'||(activeFilter==='Recommended'?g.recommended:activeFilter==='Popular'?g.popular:activeFilter==='Favorites'?favorites.has(g.id):activeFilter==='Recent'?recent.includes(g.id):g.category===activeFilter);return match&&(g.name+' '+g.desc+' '+g.category+' '+g.theme).toLowerCase().includes(searchText)});if(sortMode==='az')list.sort((a,b)=>a.name.localeCompare(b.name));else if(sortMode==='new')list.reverse();else if(activeFilter==='Recent')list.sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));else if(activeFilter==='Recommended'||activeFilter==='Popular')list.sort((a,b)=>Number(!!b.original)-Number(!!a.original));return list}
function render(){const list=filteredGames();$('gameGrid').innerHTML=list.map(cardHTML).join('');$('gameGrid').style.display=list.length?'grid':'none';$('empty').style.display=list.length?'none':'block';$('statCount').textContent=games.length;$('allCount').textContent=games.length;const titles={All:'Explore all games',Recommended:'Recommended for you',Popular:'Popular games',Recent:'Recently played',Favorites:'Your favorites'};const subtitles={All:'Find your next five-minute obsession.',Recommended:'Original games and hand-picked arcade favorites.',Popular:'The hits, plus PixelLab originals worth playing.',Recent:'Jump back in where you left off.',Favorites:'Your personal arcade shortlist.'};$('sectionTitle').textContent=titles[activeFilter]||activeFilter+' games';$('sectionSub').textContent=searchText?'Results for “'+searchText+'”':subtitles[activeFilter]||'A collection of '+activeFilter.toLowerCase()+' challenges.';document.querySelectorAll('.navbtn,.chip').forEach(b=>b.classList.toggle('active',b.dataset.filter===activeFilter));renderChips()}
function setFilter(f){activeFilter=f;render();$('games').scrollIntoView({behavior:'smooth',block:'start'})}
function toggleFavorite(id){favorites.has(id)?favorites.delete(id):favorites.add(id);saveFavorites();render();flash(favorites.has(id)?'Added to favorites ♥':'Removed from favorites')}
document.addEventListener('click',e=>{const fav=e.target.closest('[data-fav]');if(fav){e.stopPropagation();toggleFavorite(fav.dataset.fav);return}const filter=e.target.closest('[data-filter]');if(filter){setFilter(filter.dataset.filter);return}const card=e.target.closest('[data-game]');if(card){openGame(card.dataset.game)}});
document.addEventListener('keydown',e=>{const card=e.target.closest&&e.target.closest('[data-game]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openGame(card.dataset.game)}if(e.key==='Escape')closeGame();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('search').focus()}});
$('search').addEventListener('input',e=>{searchText=e.target.value.trim().toLowerCase();if(searchText&&activeFilter==='Recent')activeFilter='All';render()});
$('sort').addEventListener('change',e=>{sortMode=e.target.value;render()});
$('randomBtn').addEventListener('click',()=>{const arr=games.filter(g=>g.engine!=='tap');openGame(arr[Math.floor(Math.random()*arr.length)].id)});
$('browseBtn').addEventListener('click',()=>$('games').scrollIntoView({behavior:'smooth'}));
$('closeModal').addEventListener('click',closeGame);
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeGame()});

let profile=storage.get('arcadeProfile',{xp:0,runs:0,engines:[],records:0,achievements:[],daily:{day:'',runs:0,engines:[],records:0,claimed:[]}});
if(!Number.isFinite(profile.xp))profile.xp=0;
if(!Number.isFinite(profile.runs))profile.runs=0;
if(!Array.isArray(profile.engines))profile.engines=[];
if(!Number.isFinite(profile.records))profile.records=0;
if(!Array.isArray(profile.achievements))profile.achievements=[];
if(!profile.daily||typeof profile.daily!=='object')profile.daily={day:'',runs:0,engines:[],records:0,claimed:[]};
function localDay(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function ensureDaily(){if(profile.daily.day!==localDay())profile.daily={day:localDay(),runs:0,engines:[],records:0,claimed:[]};if(!Array.isArray(profile.daily.engines))profile.daily.engines=[];if(!Array.isArray(profile.daily.claimed))profile.daily.claimed=[]}
const questDefs=[
{id:'runs',emoji:'🎮',title:'Arcade regular',desc:'Finish 3 game runs today.',target:3,reward:15},
{id:'variety',emoji:'🧭',title:'Try something new',desc:'Play 3 different game types.',target:3,reward:15},
{id:'record',emoji:'🏆',title:'Personal-best hunter',desc:'Set a new personal record.',target:1,reward:10}
];
function renderProgress(){
 ensureDaily();
 const xp=Math.max(0,profile.xp),level=Math.floor(xp/100)+1,into=xp%100;
 const ranks=[['🕹️','Pixel Rookie'],['🎯','Score Chaser'],['⚡','Combo Starter'],['💎','Arcade Ace'],['👑','Pixel Legend']];
 const rank=ranks[Math.min(ranks.length-1,Math.floor((level-1)/3))];
 $('rankIcon').textContent=rank[0];$('rankName').textContent=rank[1];$('xpTotal').textContent=xp;$('levelNum').textContent=level;$('xpCurrent').textContent=into+' / 100 XP';$('xpBar').style.width=into+'%';
 const track=document.querySelector('.xp-track');if(track)track.setAttribute('aria-valuenow',String(into));
 const unlocked=[];
 if(profile.achievements.includes('first'))unlocked.push('First run');
 if(profile.achievements.includes('ten'))unlocked.push('10 runs');
 if(profile.achievements.includes('explorer'))unlocked.push('5 game types');
 if(profile.achievements.includes('records'))unlocked.push('10 records');
 $('achievementLine').textContent=unlocked.length?'🏅 Achievements: '+unlocked.join(' · '):'Play, explore different games, and set records to unlock achievements.';
 $('questList').innerHTML=questDefs.map(q=>{
   const val=q.id==='runs'?Math.min(profile.daily.runs,q.target):q.id==='variety'?Math.min(profile.daily.engines.length,q.target):Math.min(profile.daily.records,q.target);
   const done=profile.daily.claimed.includes(q.id)||val>=q.target;
   return '<div class="quest-item '+(done?'done':'')+'"><span class="quest-emoji">'+q.emoji+'</span><strong>'+q.title+(profile.daily.claimed.includes(q.id)?' ✓':'')+'</strong><p>'+q.desc+'</p><div class="quest-progress"><span>'+val+' / '+q.target+'</span><b>+'+q.reward+' XP</b></div><div class="quest-mini-track"><span style="width:'+(100*val/q.target)+'%"></span></div></div>';
 }).join('');
}
function awardRun(game,score,isRecord){
 ensureDaily();
 profile.runs++;
 if(!profile.engines.includes(game.engine))profile.engines.push(game.engine);
 profile.daily.runs++;
 if(!profile.daily.engines.includes(game.engine))profile.daily.engines.push(game.engine);
 let gained=10;
 if(isRecord){gained+=8;profile.records++;profile.daily.records++}
 const bonuses=[];
 const claim=(id,reward,label)=>{if(!profile.daily.claimed.includes(id)){profile.daily.claimed.push(id);gained+=reward;bonuses.push(label)}};
 if(profile.daily.runs>=3)claim('runs',15,'3 runs');
 if(profile.daily.engines.length>=3)claim('variety',15,'variety');
 if(profile.daily.records>=1)claim('record',10,'new record');
 const achievements=[];
 const unlock=(id,label)=>{if(!profile.achievements.includes(id)){profile.achievements.push(id);profile.xp+=20;achievements.push(label)}};
 unlock('first','First Run');
 if(profile.runs>=10)unlock('ten','10 Runs');
 if(profile.engines.length>=5)unlock('explorer','Explorer');
 if(profile.records>=10)unlock('records','Record Hunter');
 profile.xp+=gained;
 storage.set('arcadeProfile',profile);
 renderProgress();
 const msg='+'+gained+' XP'+(bonuses.length?' · Daily bonus: '+bonuses.join(', '):'')+(achievements.length?' · Achievement: '+achievements.join(', '):'');
 flash(msg);
}
function setBest(game,score){const old=scores[game.id];const isRecord=old===undefined||score<old;if(isRecord){scores[game.id]=score;storage.set('scores',scores)}awardRun(game,score,isRecord);updateBest(game)}
function updateBest(game){let val=scores[game.id];if(val!==undefined&&['snake','pong','breakout','dodge','whack','tap','typing','simon','scramble','clicker','flappy','math','trivia','color','platform','connect4'].includes(game.engine))val=Math.abs(val);$('gameBest').textContent='Best: '+(val===undefined?'—':String(val))}
function openGame(id){const game=games.find(g=>g.id===id);if(!game)return;closeGame(false);currentGame=game;recent=[id,...recent.filter(x=>x!==id)].slice(0,12);storage.set('recent',recent);$('modalEmoji').textContent=game.emoji;$('modalTitle').textContent=game.name;$('modalDesc').textContent=game.desc;$('instructions').innerHTML='<strong>How to play:</strong> '+esc(getEngine(game).instructions);updateBest(game);$('modal').classList.add('open');document.body.style.overflow='hidden';runGame(game)}
function closeGame(reset=true){if(reset){cleanup();cleanup=()=>{};if(keyHandler)window.removeEventListener('keydown',keyHandler);keyHandler=null;currentGame=null} $('modal').classList.remove('open');document.body.style.overflow='';}
function baseBox(){const b=$('gameBox');b.innerHTML='';return b}
function button(text,fn,hot=false){const b=document.createElement('button');b.className='game-button'+(hot?' hot':'');b.textContent=text;b.addEventListener('click',fn);return b}
function scoreLine(items){const d=document.createElement('div');d.className='scoreline';d.innerHTML=items.map(([k,v])=>'<span>'+esc(k)+': <strong>'+esc(v)+'</strong></span>').join('');return d}
function startCanvas(w=640,h=340){const box=baseBox(),c=document.createElement('canvas');c.width=w;c.height=h;c.style.width='min(100%,'+w+'px)';c.style.height='auto';box.appendChild(c);return {box,c,ctx:c.getContext('2d')}}
function drawCanvasBackground(ctx,w,h){ctx.fillStyle='#0c0e18';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#ffffff0b';ctx.lineWidth=1;for(let x=0;x<w;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}}
function installKeys(fn){keyHandler=e=>{if(!currentGame)return;const keys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d','W','A','S','D','x','X','Shift'];if(keys.includes(e.key)&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();fn(e)}};window.addEventListener('keydown',keyHandler)}
function runGame(g){cleanup();cleanup=()=>{};if(keyHandler)window.removeEventListener('keydown',keyHandler);keyHandler=null;switch(g.engine){case'rift-runner':return gameRiftRunner(g);case'circuit-crafter':return gameCircuitCrafter(g);case'star-courier':return gameStarCourier(g);case'reaction':return gameReaction(g);case'memory':return gameMemory(g);case'aim':return gameAim(g);case'whack':return gameWhack(g);case'tap':return gameTap(g);case'typing':return gameTyping(g);case'tictactoe':return gameTTT(g);case'merge':return gameMerge(g);case'snake':return gameSnake(g);case'pong':return gamePong(g);case'breakout':return gameBreakout(g);case'dodge':return gameDodge(g);case'mines':return gameMines(g);case'simon':return gameSimon(g);case'scramble':return gameScramble(g);case'clicker':return gameClicker(g);case'flappy':return gameFlappy(g);case'math':return gameMath(g);case'connect4':return gameConnect4(g);case'platform':return gamePlatform(g);case'trivia':return gameTrivia(g);case'color':return gameColor(g);case'lights':return gameLights(g);case'maze':return gameMaze(g)}}

setupDaily();
renderProgress();
render();
