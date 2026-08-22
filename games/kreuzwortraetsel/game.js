(function(){
  const WORDS=window.KC_CROSSWORD_WORDS||[];
  const $=s=>document.querySelector(s);
  const LEVELS={easy:{label:'Leicht',count:7,base:120},medium:{label:'Mittel',count:9,base:180},hard:{label:'Schwer',count:11,base:260}};
  const state={entries:[],cells:new Map(),score:0,hints:0,startedAt:0,finished:false};

  function norm(s){return String(s||'').toUpperCase().replace(/Ä/g,'AE').replace(/Ö/g,'OE').replace(/Ü/g,'UE').replace(/ß/g,'SS').replace(/[^A-Z]/g,'');}
  function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function candidates(){const level=$('#difficulty').value,cat=$('#category').value;const rank={easy:1,medium:2,hard:3};return shuffle(WORDS.filter(w=>(cat==='all'||w.category===cat)&&rank[w.level]<=rank[level]));}

  function placeWords(words){
    const placed=[];const occupied=new Map();
    function key(x,y){return x+','+y;}
    function canPlace(word,x,y,dir){
      for(let i=0;i<word.length;i++){
        const cx=x+(dir==='across'?i:0),cy=y+(dir==='down'?i:0),k=key(cx,cy),existing=occupied.get(k);
        if(existing&&existing!==word[i])return false;
      }
      return true;
    }
    function put(item,x,y,dir){const word=norm(item.word);for(let i=0;i<word.length;i++){occupied.set(key(x+(dir==='across'?i:0),y+(dir==='down'?i:0)),word[i]);}placed.push({item,word,x,y,dir});}
    if(!words.length)return [];
    put(words[0],0,0,'across');
    for(const item of words.slice(1)){
      const word=norm(item.word);let best=null;
      outer: for(const p of placed){
        for(let i=0;i<word.length;i++)for(let j=0;j<p.word.length;j++)if(word[i]===p.word[j]){
          const dir=p.dir==='across'?'down':'across';
          const x=p.x+(p.dir==='across'?j:0)-(dir==='across'?i:0);
          const y=p.y+(p.dir==='down'?j:0)-(dir==='down'?i:0);
          if(canPlace(word,x,y,dir)){best={x,y,dir};break outer;}
        }
      }
      if(best)put(item,best.x,best.y,best.dir);
    }
    return placed;
  }

  function build(){
    const level=$('#difficulty').value,cfg=LEVELS[level];
    let pool=candidates();
    if(pool.length<4){pool=shuffle(WORDS.filter(w=>w.level===level||level==='hard'));}
    state.entries=placeWords(pool.slice(0,Math.max(cfg.count+5,12))).slice(0,cfg.count);
    state.cells.clear();state.score=0;state.hints=0;state.startedAt=Date.now();state.finished=false;
    renderGrid();renderClues();$('#score').textContent='0';$('#feedback').textContent='Fülle die Felder aus und drücke anschließend „Prüfen“.';
    $('#difficultyLabel').textContent=cfg.label;$('#start').hidden=true;$('#game').hidden=false;
  }

  function renderGrid(){
    const grid=$('#grid');grid.innerHTML='';
    if(!state.entries.length){grid.innerHTML='<p>Für diese Auswahl stehen noch nicht genug Begriffe bereit.</p>';return;}
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    state.entries.forEach(e=>{minX=Math.min(minX,e.x);minY=Math.min(minY,e.y);maxX=Math.max(maxX,e.x+(e.dir==='across'?e.word.length-1:0));maxY=Math.max(maxY,e.y+(e.dir==='down'?e.word.length-1:0));});
    const width=maxX-minX+1,height=maxY-minY+1;grid.style.gridTemplateColumns=`repeat(${width},minmax(30px,46px))`;
    const cells=new Map();
    state.entries.forEach((e,idx)=>{
      e.number=idx+1;
      for(let i=0;i<e.word.length;i++){
        const x=e.x+(e.dir==='across'?i:0)-minX,y=e.y+(e.dir==='down'?i:0)-minY,k=x+','+y;
        if(!cells.has(k))cells.set(k,{x,y,letter:e.word[i],numbers:[]});
        if(i===0)cells.get(k).numbers.push(e.number);
      }
    });
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const k=x+','+y,c=cells.get(k),wrap=document.createElement('div');wrap.className=c?'cell':'cell block';
      if(c){
        if(c.numbers.length){const n=document.createElement('span');n.className='num';n.textContent=c.numbers[0];wrap.appendChild(n);}
        const input=document.createElement('input');input.maxLength=1;input.autocomplete='off';input.inputMode='text';input.dataset.answer=c.letter;input.setAttribute('aria-label',`Feld ${x+1}/${y+1}`);
        input.addEventListener('input',()=>{input.value=norm(input.value).slice(-1);input.classList.remove('ok','bad');});wrap.appendChild(input);state.cells.set(k,input);
      }
      grid.appendChild(wrap);
    }
    $('#progress').textContent=`${state.entries.length} Begriffe`;
  }

  function renderClues(){const a=$('#across'),d=$('#down');a.innerHTML='';d.innerHTML='';state.entries.forEach(e=>{const li=document.createElement('li');li.value=e.number;li.textContent=e.item.clue;(e.dir==='across'?a:d).appendChild(li);});}
  function check(){
    if(state.finished)return;
    const inputs=[...state.cells.values()];let correct=0,filled=0;
    inputs.forEach(i=>{if(i.value)filled++;const ok=norm(i.value)===i.dataset.answer;i.classList.toggle('ok',ok);i.classList.toggle('bad',!!i.value&&!ok);if(ok)correct++;});
    if(correct===inputs.length){finish();}else $('#feedback').textContent=`${correct} von ${inputs.length} Buchstaben sind richtig. ${inputs.length-filled} Felder sind noch leer.`;
  }
  function hint(){if(state.finished)return;const open=[...state.cells.values()].filter(i=>norm(i.value)!==i.dataset.answer);if(!open.length)return;const input=open[Math.floor(Math.random()*open.length)];input.value=input.dataset.answer;input.classList.add('ok');state.hints++;state.score=Math.max(0,state.score-20);$('#score').textContent=state.score;$('#feedback').textContent='Ein Buchstabe wurde aufgedeckt. Dafür werden 20 Punkte abgezogen.';}
  function solve(){if(state.finished)return;[...state.cells.values()].forEach(i=>{i.value=i.dataset.answer;i.classList.add('ok');});state.score=0;$('#score').textContent='0';state.finished=true;$('#feedback').textContent='Rätsel aufgelöst. Für diese Runde werden keine Punkte gewertet.';}
  function finish(){
    state.finished=true;const level=$('#difficulty').value,cfg=LEVELS[level];const seconds=(Date.now()-state.startedAt)/1000;const timeBonus=Math.max(0,Math.round(60-seconds/3));state.score=Math.max(0,cfg.base+state.entries.length*20+timeBonus-state.hints*20);$('#score').textContent=state.score;
    $('#feedback').innerHTML=`<strong>Rätsel gelöst!</strong> ${state.score} Punkte · Grundwert ${cfg.base} + ${state.entries.length*20} Begriffsbonus + ${timeBonus} Zeitbonus − ${state.hints*20} Hinweise.`;
    try{const bridge=window.parent&&window.parent.KCFuturaGameBridge||window.KCFuturaGameBridge;if(bridge&&typeof bridge.submitResult==='function')bridge.submitResult({gameId:'kitchen-crossword',score:state.score,difficulty:level,completed:true,terms:state.entries.length,hints:state.hints});}catch(e){}
  }
  function back(){if(confirm('Aktuelles Rätsel verlassen?')){$('#game').hidden=true;$('#start').hidden=false;}}

  $('#startBtn').onclick=build;$('#checkBtn').onclick=check;$('#hintBtn').onclick=hint;$('#solveBtn').onclick=solve;$('#backBtn').onclick=back;
})();
