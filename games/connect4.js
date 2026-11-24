'use strict';

function gameConnect4(g){
 const b=baseBox();let mode=null,board=Array.from({length:42},()=>0),over=false,aiTimer=null,thinking=false,onlineSession=null,onlineUnsubscribe=null,onlineBusy=false;
 function modeButton(label,description,next,disabled=false){
  const wrap=document.createElement('div');wrap.className='mp-mode-card';
  const btn=button(label,()=>{if(disabled)return;if(next==='online'){openOnlineLobby();return;}startRound(next)});btn.className='mp-mode-button';btn.disabled=disabled;wrap.append(btn);
  const note=document.createElement('p');note.className='mp-mode-note';note.textContent=description;wrap.append(note);return wrap;
 }
 function openOnlineLobby(){
  const start=api=>{if(!api)throw new Error(window.PixelLabMultiplayerReadyError||'Online multiplayer could not load.');api.showLobby('connect4',b,beginOnline);};
  if(window.PixelLabMultiplayer)start(window.PixelLabMultiplayer);
  else window.PixelLabMultiplayerReady.then(start).catch(error=>{b.innerHTML='';const note=document.createElement('p');note.className='pl-mp-message error';note.textContent=error.message||'Online multiplayer could not load.';b.append(note);});
 }
 function clearOnline(){
  if(onlineUnsubscribe){onlineUnsubscribe();onlineUnsubscribe=null;}
  if(onlineSession){
   const active=onlineSession;onlineSession=null;
   active.leave().catch(()=>active.close());
  }
  onlineBusy=false;
 }
 function beginOnline(session){
  clearTimeout(aiTimer);
  if(onlineSession)clearOnline();
  onlineSession=session;mode='online';over=false;
  onlineUnsubscribe=session.onUpdate(onlineSync);
 }
 function onlineSync(room){
  if(!onlineSession||mode!=='online')return;
  board=room.state.board.map(Number);over=room.status==='completed'||room.status==='cancelled';
  renderOnlineBoard();
 }
 function renderOnlineBoard(){
  if(!onlineSession)return;
  const room=onlineSession.room;b.innerHTML='';
  const msg=document.createElement('div');msg.className='big-number mp-title';msg.style.fontSize='28px';b.append(msg);
  if(room.status==='waiting'){
   const invite=document.createElement('div');invite.className='pl-mp-room-code';
   const label=document.createElement('span');label.textContent='Share this invite code';
   const value=document.createElement('strong');value.textContent=room.room_code;
   const copy=button('Copy code',()=>{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(room.room_code).then(()=>flash('Invite code copied')).catch(()=>flash('Copy unavailable — select the code'));else flash('Select and copy the invite code');});
   invite.append(label,value,copy);b.append(invite);
  }
  const grid=document.createElement('div');grid.style.display='grid';grid.style.gridTemplateColumns='repeat(7,minmax(25px,44px))';grid.style.gap='5px';grid.style.padding='10px';grid.style.background='#202847';grid.style.borderRadius='16px';grid.style.width='max-content';grid.style.maxWidth='100%';grid.style.margin='0 auto';
  const cols=[];const cells=[];
  function rowFree(c){for(let r=5;r>=0;r--)if(!board[r*7+c])return r;return -1;}
  function statusText(){
   if(room.status==='waiting')return 'Waiting for a friend to join…';
   if(room.status==='cancelled')return 'This room was closed.';
   if(room.status==='completed'){
    if(!room.winner_id)return 'Draw game';
    return room.winner_id===onlineSession.userId?'You win!':'Your opponent wins!';
   }
   return onlineSession.playerNumber===room.turn?'Your turn — '+(onlineSession.playerNumber===1?'Red':'Yellow'):'Opponent’s turn';
  }
  async function move(c){
   if(room.status!=='playing'||onlineSession.playerNumber!==room.turn||rowFree(c)<0||onlineBusy)return;
   onlineBusy=true;draw();
   try{await onlineSession.move({column:c});}
   catch(error){flash(error.message||'Move could not be sent.');}
   finally{onlineBusy=false;draw();}
  }
  function draw(){
   msg.textContent=statusText();
   cells.forEach((el,i)=>{el.style.background=board[i]===1?'#ff637f':board[i]===2?'#ffd166':'#101423';el.style.boxShadow=board[i]?'inset 0 2px 5px #0005':'';el.style.borderColor=board[i]?'#ffffff2b':'#58607d';});
   cols.forEach((col,i)=>col.disabled=room.status!=='playing'||onlineSession.playerNumber!==room.turn||rowFree(i)<0||onlineBusy);
  }
  for(let i=0;i<7;i++){const col=button('↓',()=>move(i));col.className='connect-drop';col.style.background='#303450';grid.append(col);cols.push(col);}
  for(let i=0;i<42;i++){const cell=document.createElement('div');cell.className='connect-cell';cell.style.aspectRatio='1';cell.style.borderRadius='50%';cell.style.background='#101423';cell.style.border='2px solid #58607d';cells.push(cell);grid.append(cell);}
  b.append(grid);
  const note=document.createElement('p');note.className='pl-mp-inline-note';note.textContent=room.status==='waiting'?'The match starts when your friend joins.':'Moves are checked by the server and synced to both players.';
  b.append(note);
  const actions=document.createElement('div');actions.className='pl-mp-actions';
  actions.append(button('Leave online room',async()=>{try{await onlineSession.leave();}catch(error){flash(error.message||'Room already closed.');}clearOnline();showModePicker();}));
  if(room.status==='completed'||room.status==='cancelled')actions.append(button('Change mode',()=>{clearOnline();showModePicker();}));
  b.append(actions);draw();
 }
 function showModePicker(){
  clearTimeout(aiTimer);mode=null;b.innerHTML='';
  const title=document.createElement('div');title.className='big-number mp-title';title.textContent='Choose your game mode';b.append(title);
  const choices=document.createElement('div');choices.className='mp-mode-picker';
  choices.append(modeButton('🤖 Play vs AI','Try to connect four before the computer.','ai'));
  choices.append(modeButton('👥 2 Players · Same Device','Red and yellow take turns on this screen.','local'));
  choices.append(modeButton('🌐 Online room','Play across devices with a private invite code.','online'));
  b.append(choices);
 }
 function startRound(nextMode=mode){clearTimeout(aiTimer);if(onlineSession)clearOnline();mode=nextMode;board=Array.from({length:42},()=>0);over=false;thinking=false;renderGame()}
 function renderGame(){
  b.innerHTML='';const msg=document.createElement('div');msg.className='big-number mp-title';msg.style.fontSize='28px';b.append(msg);
  const grid=document.createElement('div');grid.style.display='grid';grid.style.gridTemplateColumns='repeat(7,minmax(25px,44px))';grid.style.gap='5px';grid.style.padding='10px';grid.style.background='#202847';grid.style.borderRadius='16px';grid.style.width='max-content';grid.style.maxWidth='100%';grid.style.margin='0 auto';b.append(grid);
  const cols=[];for(let i=0;i<7;i++){const col=button('↓',()=>drop(i,1));col.className='connect-drop';col.style.background='#303450';grid.append(col);cols.push(col)}
  const cells=[];for(let i=0;i<42;i++){const el=document.createElement('div');el.className='connect-cell';el.style.aspectRatio='1';el.style.borderRadius='50%';el.style.background='#101423';el.style.border='2px solid #58607d';cells.push(el);grid.append(el)}
  function at(r,c){return r*7+c}
  function won(p){
   for(let r=0;r<6;r++)for(let c=0;c<7;c++)if(board[at(r,c)]===p){
    for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
     let n=1;for(let k=1;k<4;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=6||cc<0||cc>=7||board[at(rr,cc)]!==p)break;n++}
     for(let k=1;k<4;k++){const rr=r-dr*k,cc=c-dc*k;if(rr<0||rr>=6||cc<0||cc>=7||board[at(rr,cc)]!==p)break;n++}
     if(n>=4)return true;
    }
   }return false;
  }
  function rowFree(c){for(let r=5;r>=0;r--)if(!board[at(r,c)])return r;return -1}
  function draw(){
   cells.forEach((el,i)=>{el.style.background=board[i]===1?'#ff637f':board[i]===2?'#ffd166':'#101423';el.style.boxShadow=board[i]?'inset 0 2px 5px #0005':'';el.style.borderColor=board[i]?'#ffffff2b':'#58607d'});
   cols.forEach((c,i)=>c.disabled=over||rowFree(i)<0||(mode==='ai'&&thinking));
   if(!over)msg.textContent=mode==='ai'?(thinking?'AI thinking…':'Your turn — Red'):board.filter(Boolean).length%2===0?'Player 1’s turn — Red':'Player 2’s turn — Yellow';
  }
  function end(t){
   over=true;msg.textContent=t;if(mode==='ai')setBest(g,t==='You win!'?-3:t==='CPU wins!'?-1:-2);draw();msg.textContent=t;
   const actions=document.createElement('div');actions.className='mp-actions';
   actions.append(button('Play again',()=>startRound(mode),true),button('Change mode',showModePicker));b.append(actions);
  }
  function evaluateCandidate(cc){
   const rr=rowFree(cc);if(rr<0)return -Infinity;board[at(rr,cc)]=2;
   let score=(3-Math.abs(3-cc))*4;
   for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]])for(let offset=0;offset<4;offset++){
    const r0=rr-dr*offset,c0=cc-dc*offset,r3=r0+dr*3,c3=c0+dc*3;
    if(r0<0||r0>=6||c0<0||c0>=7||r3<0||r3>=6||c3<0||c3>=7)continue;
    let cpu=0,human=0;for(let k=0;k<4;k++){const v=board[at(r0+dr*k,c0+dc*k)];if(v===2)cpu++;if(v===1)human++}
    if(!human)score+=cpu===4?12000:cpu===3?65:cpu===2?12:1;
   }
   board[at(rr,cc)]=0;return score;
  }
  function chooseAI(){
   for(let cc=0;cc<7;cc++){const rr=rowFree(cc);if(rr>=0){board[at(rr,cc)]=2;const win=won(2);board[at(rr,cc)]=0;if(win)return cc}}
   for(let cc=0;cc<7;cc++){const rr=rowFree(cc);if(rr>=0){board[at(rr,cc)]=1;const block=won(1);board[at(rr,cc)]=0;if(block)return cc}}
   let best=-Infinity,moves=[];for(let cc=0;cc<7;cc++){const v=evaluateCandidate(cc);if(v>best){best=v;moves=[cc]}else if(v===best)moves.push(cc)}
   return moves.length?moves[Math.floor(Math.random()*moves.length)]:-1;
  }
  function hintColumn(){
   for(let cc=0;cc<7;cc++){const rr=rowFree(cc);if(rr>=0){board[at(rr,cc)]=1;const win=won(1);board[at(rr,cc)]=0;if(win)return cc;}}
   for(let cc=0;cc<7;cc++){const rr=rowFree(cc);if(rr>=0){board[at(rr,cc)]=2;const block=won(2);board[at(rr,cc)]=0;if(block)return cc;}}
   return [3,2,4,1,5,0,6].find(cc=>rowFree(cc)>=0);
  }
  function drop(c,p){
   if(over||rowFree(c)<0||(mode==='ai'&&p===1&&thinking))return;
   const r=rowFree(c);cols.forEach(el=>{el.style.border='1px solid transparent';el.style.boxShadow='';});board[at(r,c)]=p;draw();
   if(won(p)){end(mode==='ai'?(p===1?'You win!':'CPU wins!'):(p===1?'Player 1 wins!':'Player 2 wins!'));return}
   if(board.every(Boolean)){end('Draw game');return}
   if(mode==='ai'&&p===1){thinking=true;draw();aiTimer=setTimeout(()=>{if(over||!currentGame||mode!=='ai')return;thinking=false;const move=chooseAI();if(move>=0)drop(move,2);else draw()},330)}
  }
  draw();
  const actions=document.createElement('div');actions.className='mp-actions';
  actions.append(button('Hint · suggested column',()=>{const hint=hintColumn();if(hint!==undefined){cols.forEach((c,i)=>{c.style.border=i===hint?'2px solid #ffc66d':'1px solid transparent';c.style.boxShadow=i===hint?'0 0 14px #ffc66d55':'';});msg.textContent='Try column '+(hint+1)+'. The glow marks a winning move or a threat to block.';}}));
  actions.append(button('Reset game',()=>startRound(mode)),button('Change mode',showModePicker));b.append(actions);
 }
 showModePicker();cleanup=()=>{clearTimeout(aiTimer);clearOnline();};
}
