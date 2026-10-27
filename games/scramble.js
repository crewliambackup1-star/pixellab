function gameScramble(g){
 const b=baseBox(),words=['planet','puzzle','rocket','pixel','galaxy','jungle','castle','winter','comet','orange','thunder','diamond','monster','journey','rainbow','keyboard','mystery','volcano','gravity','lantern','crystal','adventure'];let word='',score=0,sec=45,iv=null,started=false,used=[];
 const label=document.createElement('div');label.className='big-number';label.textContent='Unscramble it';b.appendChild(label);
 const status=scoreLine([['Solved','0'],['Time','45s']]);b.appendChild(status);
 const input=document.createElement('input');input.className='type-input';input.placeholder='Your answer…';input.autocomplete='off';input.disabled=true;b.appendChild(input);
 const hint=document.createElement('div');hint.className='subtext';b.appendChild(hint);
 function next(){let remain=words.filter(w=>!used.includes(w));if(!remain.length){used=[];remain=words.slice()}word=remain[Math.floor(Math.random()*remain.length)];used.push(word);let mixed=word.split('');for(let i=mixed.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[mixed[i],mixed[j]]=[mixed[j],mixed[i]]}if(mixed.join('')===word&&mixed.length>1)[mixed[0],mixed[1]]=[mixed[1],mixed[0]];label.textContent=mixed.join('  ').toUpperCase();hint.textContent='First letter: '+word[0].toUpperCase()+' · '+word.length+' letters'}
 function finish(){clearInterval(iv);started=false;input.disabled=true;setBest(g,-score);hint.textContent='Time! You solved '+score+' words.';b.appendChild(button('Play again',()=>runGame(g),true))}
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&started){if(input.value.trim().toLowerCase()===word){score++;input.value='';next()}else{hint.textContent='Not quite — give it another try.'}status.innerHTML='<span>Solved: <strong>'+score+'</strong></span><span>Time: <strong>'+sec+'s</strong></span>'}});
 b.appendChild(button('Start 45 seconds',()=>{if(started)return;score=0;sec=45;used=[];started=true;input.disabled=false;next();input.focus();iv=setInterval(()=>{sec--;status.innerHTML='<span>Solved: <strong>'+score+'</strong></span><span>Time: <strong>'+sec+'s</strong></span>';if(sec<=0)finish()},1000)},true));
 cleanup=()=>clearInterval(iv);
}
