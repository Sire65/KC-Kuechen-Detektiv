(function(){
  const WORDS=window.KC_CROSSWORD_WORDS||[];
  const $=s=>document.querySelector(s);
  const LEVELS={easy:{label:'Leicht',count:8,base:120},medium:{label:'Mittel',count:11,base:200},hard:{label:'Schwer',count:14,base:320}};
  const STORAGE_KEY='kc-kitchen-crossword-stats-v1';
  const state={entries:[],cells:new Map(),score:0,hints:0,checks:0,startedAt:0,finished:false};
  const saved=loadStats();

  function loadStats(){try{return Object.assign({bestScore:0,played:0,solved:0},JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}catch(e){return {bestScore:0,played:0,solved:0};}}
  function saveStats(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));}catch(e){}}
  function norm(s){return String(s||'').toUpperCase().replace(/Ä/g,'AE').replace(/Ö/g,'OE').replace(/Ü/g,'UE').replace(/ß/g,'SS').replace(/[^A-Z]/g,'');}
  function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function candidates(){const level=$('#difficulty').value,cat=$('#category').value;const rank={easy:1,medium:2,hard:3};return shuffle(WORDS.filter(w=>(cat==='all'||w.category===cat)&&rank[w.level]<=rank[level]));}
  function key(x,y){return x+','+y;}

  function placeWords(words,target){
    const placed=[];
    const occupied=new Map();
    const usedDirs=new Map();

    function cellLetter(x,y){return occupied.get(key(x,y));}
    function dirsAt(x,y){return usedDirs.get(key(x,y))||new Set();}
    function reserve(x,y,letter,dir){
      const k=key(x,y);occupied.set(k,letter);
      if(!usedDirs.has(k))usedDirs.set(k,new Set());usedDirs.get(k).add(dir);
    }
    function canPlace(word,x,y,dir,requireCross){
      let crosses=0;
      for(let i=0;i<word.length;i++){
        const cx=x+(dir==='across'?i:0),cy=y+(dir==='down'?i:0),existing=cellLetter(cx,cy),dirs=dirsAt(cx,cy);
        if(existing&&existing!==word[i])return null;
        if(existing===word[i]){
          if(dirs.has(dir))return null;
          crosses++;
        }else{
          const p1=dir==='across'?[cx,cy-1]:[cx-1,cy];
          const p2=dir==='across'?[cx,cy+1]:[cx+1,cy];
          if(cellLetter(...p1)||cellLetter(...p2))return null;
        }
      }
      const before=dir==='across'?[x-1,y]:[x,y-1];
      const after=dir==='across'?[x+word.length,y]:[x,y+word.length];
      if(cellLetter(...before)||cellLetter(...after))return null;
      if(requireCross&&crosses===0)return null;
      return crosses;
    }
    function put(item,x,y,dir){
      const word=norm(item.word);
      for(let i=0;i<word.length;i++)reserve(x+(dir==='across'?i:0),y+(dir==='down'?i:0),word[i],dir);
      placed.push({item,word,x,y,dir});
    }

    if(!words.length)return [];
    const first=[...words].sort((a,b)=>norm(b.word).length-norm(a.word).length)[0];
    put(first,0,0,'across');
    const remaining=words.filter(w=>w!==first);

    while(remaining.length&&placed.length<target){
      let best=null;
      for(let wi=0;wi<remaining.length;wi++){
        const item=remaining[wi],word=norm(item.word);
        for(const p of placed){
          for(let i=0;i<word.length;i++){
            for(let j=0;j<p.word.length;j++){
              if(word[i]!==p.word[j])continue;
              const dir=p.dir==='across'?'down':'across';
              const x=p.x+(p.dir==='across'?j:0)-(dir==='across'?i:0);
              const y=p.y+(p.dir==='down'?j:0)-(dir==='down'?i:0);
              const crosses=canPlace(word,x,y,dir,true);
              if(crosses===null)continue;
              const spread=Math.abs(x)+Math.abs(y);
              const score=crosses*100-spread;
              if(!best||score>best.score)best={wi,item,x,y,dir,score};
            }
          }
        }
      }
      if(!best)break;
      put(best.item,best.x,best.y,best.dir);
      remaining.splice(best.wi,1);
    }
    return placed;
  }

  function build(){
    const level=$('#difficulty').value,cfg=LEVELS[level];
    let pool=candidates();
    if(pool.length<cfg.count)pool=shuffle(WORDS.filter(w=>level==='hard'||w.level===level||w.level==='easy'));
    state.entries=placeWords(pool.slice(0,Math.max(cfg.count*3,24)),cfg.count);
    state.cells.clear();state.score=0;state.hints=0;state.checks=0;state.startedAt=Date.now();state.finished=false;
    saved.played=(saved.played||0)+1;saveStats();
    renderGrid();renderClues();$('#score').textContent='0';$('#feedback').textContent='Fülle die Begriffe aus. Richtige Kreuzungen helfen dir bei mehreren Wörtern gleichzeitig.';
    $('#difficultyLabel').textContent=cfg.label;$('#start').hidden=true;$('#game').hidden=false;updateStats();
  }

  function renderGrid(){
    const grid=$('#grid');grid.innerHTML='';
    if(state.entries.length<4){grid.innerHTML='<p>Für diese Auswahl konnten nicht genug sinnvoll gekreuzte Begriffe erzeugt werden. Starte bitte eine neue Runde.</p>';return;}
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    state.entries.forEach(e=>{minX=Math.min(minX,e.x);minY=Math.min(minY,e.y);maxX=Math.max(maxX,e.x+(e.dir==='across'?e.word.length-1:0));maxY=Math.max(maxY,e.y+(e.dir==='down'?e.word.length-1:0));});
    const width=maxX-minX+1,height=maxY-minY+1;grid.style.gridTemplateColumns=`repeat(${width},minmax(28px,44px))`;
    const cells=new Map();
    const starts=new Map();
    state.entries.forEach(e=>{
      for(let i=0;i<e.word.length;i++){
        const x=e.x+(e.dir==='across'?i:0)-minX,y=e.y+(e.dir==='down'?i:0)-minY,k=key(x,y);
        if(!cells.has(k))cells.set(k,{x,y,letter:e.word[i]});
        if(i===0){if(!starts.has(k))starts.set(k,[]);starts.get(k).push(e);}
      }
    });
    let number=0;
    [...starts.keys()].sort((a,b)=>{const [ax,ay]=a.split(',').map(Number),[bx,by]=b.split(',').map(Number);return ay-by||ax-bx;}).forEach(k=>{number++;starts.get(k).forEach(e=>e.number=number);});
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const k=key(x,y),c=cells.get(k),wrap=document.createElement('div');wrap.className=c?'cell':'cell block';
      if(c){
        if(starts.has(k)){const n=document.createElement('span');n.className='num';n.textContent=starts.get(k)[0].number;wrap.appendChild(n);}
        const input=document.createElement('input');input.maxLength=1;input.autocomplete='off';input.inputMode='text';input.dataset.answer=c.letter;input.setAttribute('aria-label',`Kreuzwortfeld ${x+1}, ${y+1}`);
        input.addEventListener('input',()=>{input.value=norm(input.value).slice(-1);input.classList.remove('ok','bad');updateProgress();});wrap.appendChild(input);state.cells.set(k,input);
      }
      grid.appendChild(wrap);
    }
    updateProgress();
  }

  function renderClues(){
    const a=$('#across'),d=$('#down');a.innerHTML='';d.innerHTML='';
    [...state.entries].sort((x,y)=>x.number-y.number).forEach(e=>{const li=document.createElement('li');li.value=e.number;li.innerHTML=`<span>${e.item.clue}</span><small>${categoryLabel(e.item.category)} · ${e.word.length} Buchstaben</small>`;(e.dir==='across'?a:d).appendChild(li);});
  }
  function categoryLabel(c){return c==='food'?'Lebensmittel':c==='utensil'?'Utensil':'Fachbegriff';}
  function updateProgress(){const inputs=[...state.cells.values()],filled=inputs.filter(i=>i.value).length;$('#progress').textContent=`${state.entries.length} Begriffe · ${filled}/${inputs.length} Buchstaben`;}
  function updateStats(){if($('#bestScore'))$('#bestScore').textContent=saved.bestScore||0;if($('#solvedCount'))$('#solvedCount').textContent=saved.solved||0;}

  function check(){
    if(state.finished)return;state.checks++;
    const inputs=[...state.cells.values()];let correct=0,filled=0;
    inputs.forEach(i=>{if(i.value)filled++;const ok=norm(i.value)===i.dataset.answer;i.classList.toggle('ok',ok);i.classList.toggle('bad',!!i.value&&!ok);if(ok)correct++;});
    if(correct===inputs.length){finish();}else $('#feedback').textContent=`${correct} von ${inputs.length} Buchstaben stimmen. ${inputs.length-filled} Felder sind noch leer.`;
  }
  function hint(){
    if(state.finished)return;const open=[...state.cells.values()].filter(i=>norm(i.value)!==i.dataset.answer);if(!open.length)return;
    const input=open[Math.floor(Math.random()*open.length)];input.value=input.dataset.answer;input.classList.remove('bad');input.classList.add('ok');state.hints++;$('#feedback').textContent='Ein Buchstabe wurde aufgedeckt. Der Hinweis kostet 20 Punkte.';updateProgress();
  }
  function solve(){if(state.finished)return;[...state.cells.values()].forEach(i=>{i.value=i.dataset.answer;i.classList.add('ok');});state.score=0;$('#score').textContent='0';state.finished=true;$('#feedback').textContent='Rätsel aufgelöst. Diese Runde wird nicht gewertet.';updateProgress();}

  function finish(){
    state.finished=true;const level=$('#difficulty').value,cfg=LEVELS[level];const seconds=(Date.now()-state.startedAt)/1000;
    const wordBonus=state.entries.length*25;const timeBonus=Math.max(0,Math.round(90-seconds/2));const hintPenalty=state.hints*20;const checkPenalty=Math.max(0,state.checks-1)*10;
    state.score=Math.max(0,cfg.base+wordBonus+timeBonus-hintPenalty-checkPenalty);$('#score').textContent=state.score;
    saved.solved=(saved.solved||0)+1;saved.bestScore=Math.max(saved.bestScore||0,state.score);saveStats();updateStats();
    $('#feedback').innerHTML=`<strong>Rätsel gelöst!</strong> ${state.score} Punkte · Grundwert ${cfg.base} + ${wordBonus} Begriffsbonus + ${timeBonus} Zeitbonus − ${hintPenalty} Hinweise − ${checkPenalty} zusätzliche Prüfungen.`;
    submitResult(level,seconds);
  }

  function submitResult(level,seconds){
    const payload={gameId:'kitchen-crossword',gameVersion:'1.0.0',score:state.score,difficulty:level,completed:true,terms:state.entries.length,hints:state.hints,checks:state.checks,durationSeconds:Math.round(seconds),completedAt:new Date().toISOString()};
    try{
      const bridge=window.KCFuturaGameBridge||(window.parent&&window.parent.KCFuturaGameBridge);
      if(bridge&&typeof bridge.submitResult==='function')bridge.submitResult(payload);
      if(window.parent&&window.parent!==window)window.parent.postMessage({type:'KC_FUTURA_GAME_RESULT',payload},'*');
    }catch(e){}
  }
  function back(){if(state.finished||confirm('Aktuelles Rätsel verlassen?')){$('#game').hidden=true;$('#start').hidden=false;updateStats();}}

  $('#startBtn').onclick=build;$('#checkBtn').onclick=check;$('#hintBtn').onclick=hint;$('#solveBtn').onclick=solve;$('#backBtn').onclick=back;
  updateStats();
})();
