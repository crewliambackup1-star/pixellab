'use strict';

function gameTTT(g){
 const b=baseBox();let mode=null,aiDifficulty='balanced',board=Array(9).fill(''),over=false,turn='X',aiTimer=null,history=[],undoUsed=false;
 const wins=[[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6],[0,3,6],[1,4,7],[2,5,8]];
 const winner=p=>wins.some(line=>line.every(i=>board[i]===p));
 function modeButton(label,description,next,disabled=false){
  const wrap=document.createElement('div');wrap.className='mp-mode-card';
  const btn=button(label,()=>{if(!disabled)startRound(next)});btn.className='mp-mode-button';btn.disabled=disabled;wrap.append(btn);
  const note=document.createElement('p');note.className='mp-mode-note';note.textContent=description;wrap.append(note);return wrap;
 }
 function showModePicker(){
  clearTimeout(aiTimer);mode=null;b.innerHTML='';
  const title=document.createElement('div');title.className='big-number mp-title';title.textContent='Choose your game mode';b.append(title);
  const choices=document.createElement('div');choices.className='mp-mode-picker';
  choices.append(modeButton('🤖 Easy AI','A relaxed opponent that makes occasional mistakes.','ai-easy'));
  choices.append(modeButton('🤖 Play vs AI · Balanced','A fair challenge with smart moves and room to win.','ai-balanced'));
  choices.append(modeButton('🔥 Expert AI','The original unbeatable minimax opponent.','ai-expert'));
  choices.append(modeButton('👥 2 Players · Same Device','Take turns on this screen. X goes first.','local'));
  choices.append(modeButton('🌐 Online room','Invite someone on another device — coming soon.','online',true));
  b.append(choices);
 }
 function startRound(nextMode=mode){
  clearTimeout(aiTimer);
  if(nextMode.indexOf('ai-')===0){mode='ai';aiDifficulty=nextMode.slice(3);}else mode=nextMode;
  board=Array(9).fill('');history=[];undoUsed=false;over=false;turn='X';renderBoard();
 }
 function renderBoard(){
  b.innerHTML='';const title=document.createElement('div');title.className='big-number mp-title';b.append(title);
  const grid=document.createElement('div');grid.className='ttt-grid';const cells=[];
  let undoButton=null,finishActions=null;
  function draw(){
   title.textContent=over?title.textContent:mode==='ai'?(turn==='X'?'Your turn — X':'Computer thinking… · '+aiDifficulty):(turn==='X'?'Player 1’s turn — X':'Player 2’s turn — O');
   cells.forEach((c,i)=>{c.textContent=board[i];c.className='ttt-cell'+(board[i]==='O'?' o':'');c.disabled=!!board[i]||over||(mode==='ai'&&turn==='O');});
   if(undoButton)undoButton.disabled=undoUsed||history.length===0;
  }
  function finish(msg){
   over=true;title.textContent=msg;draw();
   if(mode==='ai'){const score=msg.includes('You win')?1:msg.includes('Draw')?2:3;setBest(g,score);}
   const actions=document.createElement('div');actions.className='mp-actions';finishActions=actions;
   actions.append(button('Play again',()=>startRound(mode==='ai'?'ai-'+aiDifficulty:mode),true),button('Change mode',showModePicker));b.append(actions);
  }
  function minimax(next,depth){
   if(winner('O'))return 10-depth;if(winner('X'))return depth-10;if(board.every(Boolean))return 0;
   let best=next==='O'?-Infinity:Infinity;
   for(let i=0;i<9;i++)if(!board[i]){board[i]=next;const score=minimax(next==='O'?'X':'O',depth+1);board[i]='';best=next==='O'?Math.max(best,score):Math.min(best,score);}
   return best;
  }
  function aiMove(){
   if(over||mode!=='ai'||turn!=='O')return;
   const empty=board.map((v,i)=>v? -1:i).filter(i=>i>=0);
   const mistakeChance=aiDifficulty==='easy'?.52:aiDifficulty==='balanced'?.18:0;
   let move=-1;
   if(Math.random()<mistakeChance)move=empty[Math.floor(Math.random()*empty.length)];
   else{
    let best=-Infinity;
    for(let i of empty){board[i]='O';const score=minimax('X',0);board[i]='';if(score>best){best=score;move=i;}}
   }
   if(move>=0)applyMove(move,'O');
  }
  function undoTurn(){
   if(undoUsed||!history.length)return;
   clearTimeout(aiTimer);
   if(finishActions){finishActions.remove();finishActions=null;}
   const count=mode==='ai'&&history.length>=2?2:1;
   for(let n=0;n<count;n++){const move=history.pop();board[move]='';}
   undoUsed=true;over=false;turn=mode==='ai'?'X':(board.filter(Boolean).length%2===0?'X':'O');
   title.textContent='Last turn rewound';draw();
  }
  function applyMove(i,p){
   history.push(i);board[i]=p;draw();
   if(winner(p)){finish(mode==='ai'?(p==='X'?'You win!':'Computer wins!'):(p==='X'?'Player 1 wins!':'Player 2 wins!'));return;}
   if(board.every(Boolean)){finish('Draw game');return;}
   turn=p==='X'?'O':'X';draw();if(mode==='ai'&&turn==='O')aiTimer=setTimeout(aiMove,280);
  }
  for(let i=0;i<9;i++){const c=button('',()=>{if(over||board[i]||(mode==='ai'&&turn!=='X'))return;applyMove(i,turn);});c.className='ttt-cell';cells.push(c);grid.append(c);}
  b.append(grid);const actions=document.createElement('div');actions.className='mp-actions';
  undoButton=button('Undo last turn',undoTurn);actions.append(button('Reset board',()=>startRound(mode==='ai'?'ai-'+aiDifficulty:mode)),undoButton,button('Change mode',showModePicker));b.append(actions);draw();
 }
 showModePicker();cleanup=()=>clearTimeout(aiTimer);
}
