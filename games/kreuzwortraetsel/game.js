(function(){
  const WORDS=window.KC_CROSSWORD_WORDS||[];
  const $=s=>document.querySelector(s);
  const LEVELS={
    easy:{label:'Leicht',count:8,base:120},
    medium:{label:'Mittel',count:11,base:200},
    hard:{label:'Schwer',count:14,base:320},
    master:{label:'Meister',count:16,base:460}
  };
  const VARIANTS={quick:{factor:.65,label:'Schnellrunde'},classic:{factor:1,label:'Klassisch'},large:{factor:1.25,label:'Großes Rätsel'}};
  const SOLUTIONS=[
    {word:'KOCHMUETZE',clue:'Typische Kopfbedeckung in der professionellen Küche.'},
    {word:'MISEENPLACE',clue:'Fachausdruck für die vorbereitenden Arbeiten vor dem Service.'},
    {word:'KUECHENCHEF',clue:'Leitet die Küchenbrigade und trägt die Gesamtverantwortung.'},
    {word:'GARSTUFE',clue:'Bezeichnet den erreichten Garzustand eines Lebensmittels.'},
    {word:'ARBEITSBRETT',clue:'Unterlage, auf der Zutaten vorbereitet und geschnitten werden.'},
    {word:'SAUCENSPIEGEL',clue:'Klassische Art, Sauce flächig unter oder um eine Speise anzurichten.'}
  ];
  const STORAGE_KEY='kc-kitchen-crossword-stats-v2';
  const state={entries:[],cells:new Map(),score:0,hints:0,checks:0,startedAt:0,finished:false,gridSolved:false,solution:null,solutionAttempts:0,solutionBonus:0};
  const saved=loadStats();

  function loadStats(){try{return Object.assign({bestScore:0,played:0,solved:0},JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}catch(e){return {bestScore:0,played:0,solved:0};}}
  function saveStats(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));}catch(e){}}
  function norm(s){return String(s||'').toUpperCase().replace(/Ä/g,'AE').replace(/Ö/g,'OE').replace(/Ü/g,'UE').replace(/ß/g,'SS').replace(/[^A-Z]/g,'');}
  function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function rankLevel(level){return {easy:1,medium:2,hard:3,master:4}[level]||1;}
  function candidates(){const level=$('#difficulty').value,cat=$('#category').value,rank=rankLevel(level);return shuffle(WORDS.filter(w=>(cat==='all'||w.category===cat)&&rankLevel(w.level)<=rank));}
  function key(x,y){return x+','+y;}

  function placeWords(words,target){
    const placed=[],occupied=new Map(),usedDirs=new Map();
    const cellLetter=(x,y)=>occupied.get(key(x,y));
    const dirsAt=(x,y)=>usedDirs.get(key(x,y))||new Set();
    function reserve(x,y,letter,dir){const k=key(x,y);occupied.set(k,letter);if(!usedDirs.has(k))usedDirs.set(k,new Set());usedDirs.get(k).add(dir);}
    function canPlace(word,x,y,dir,requireCross){
      let crosses=0;
      for(let i=0;i<word.length;i++){
        const cx=x+(dir==='across'?i:0),cy=y+(dir==='down'?i:0),existing=cellLetter(cx,cy),dirs=dirsAt(cx,cy);
        if(existing&&existing!==word[i])return null;
        if(existing===word[i]){if(dirs.has(dir))return null;crosses++;}
        else{
          const p1=dir==='across'?[cx,cy-1]:[cx-1,cy],p2=dir==='across'?[cx,cy+1]:[cx+1,cy];
          if(cellLetter(...p1)||cellLetter(...p2))return null;
        }
      }
      const before=dir==='across'?[x-1,y]:[x,y-1],after=dir==='across'?[x+word.length,y]:[x,y+word.length];
      if(cellLetter(...before)||cellLetter(...after))return null;
      if(requireCross&&crosses===0)return null;
      return crosses;
    }
    function put(item,x,y,dir){const word=norm(item.word);for(let i=0;i<word.length;i++)reserve(x+(dir==='across'?i:0),y+(dir==='down'?i:0),word[i],dir);placed.push({item,word,x,y,dir});}
    if(!words.length)return [];
    const first=[...words].sort((a,b)=>norm(b.word).length-norm(a.word).length)[0];put(first,0,0,'across');
    const remaining=words.filter(w=>w!==first);
    while(remaining.length&&placed.length<target){
      let best=null;
      for(let wi=0;wi<remaining.length;wi++){
        const item=remaining[wi],word=norm(item.word);
        for(const p of placed)for(let i=0;i<word.length;i++)for(let j=0;j<p.word.length;j++){
          if(word[i]!==p.word[j])continue;
          const dir=p.dir==='across'?'down':'across';
          const x=p.x+(p.dir==='across'?j:0)-(dir==='across'?i:0),y=p.y+(p.dir==='down'?j:0)-(dir==='down'?i:0);
          const crosses=canPlace(word,x,y,dir,true);if(crosses===null)continue;
          const spread=Math.abs(x)+Math.abs(y),score=crosses*100-spread;
          if(!best||score>best.score)best={wi,item,x,y,dir,score};
        }
      }
      if(!best)break;
      put(best.item,best.x,best.y,best.dir);remaining.splice(best.wi,1);
    }
    return placed;
  }

  function targetCount(){const level=LEVELS[$('#difficulty').value],variant=VARIANTS[$('#variant').value]||VARIANTS.classic;return Math.max(5,Math.round(level.count*variant.factor));}

  function build(){
    const level=$('#difficulty').value,cfg=LEVELS[level],target=targetCount();
    let pool=candidates();
    if(pool.length<target)pool=shuffle(WORDS.filter(w=>rankLevel(w.level)<=rankLevel(level)));
    state.entries=placeWords(pool.slice(0,Math.max(target*4,28)),target);
    state.cells.clear();state.score=0;state.hints=0;state.checks=0;state.startedAt=Date.now();state.finished=false;state.gridSolved=false;state.solutionAttempts=0;state.solutionBonus=0;state.solution=shuffle(SOLUTIONS)[0];
    saved.played=(saved.played||0)+1;saveStats();
    renderGrid();renderClues();$('#score').textContent='0';$('#feedback').textContent='Fülle die Begriffe aus. Richtige Kreuzungen helfen dir bei mehreren Wörtern gleichzeitig.';
    $('#difficultyLabel').textContent=`${cfg.label} · ${(VARIANTS[$('#variant').value]||VARIANTS.classic).label}`;$('#solutionPanel').hidden=true;$('#solutionInput').value='';$('#start').hidden=true;$('#game').hidden=false;updateStats();
  }

  function renderGrid(){
    const grid=$('#grid');grid.innerHTML='';
    if(state.entries.length<4){grid.innerHTML='<p>Für diese Auswahl konnten nicht genug sinnvoll gekreuzte Begriffe erzeugt werden. Starte bitte eine neue Runde.</p>';return;}
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    state.entries.forEach(e=>{minX=Math.min(minX,e.x);minY=Math.min(minY,e.y);maxX=Math.max(maxX,e.x+(e.dir==='across'?e.word.length-1:0));maxY=Math.max(maxY,e.y+(e.dir==='down'?e.word.length-1:0));});
    const width=maxX-minX+1,height=maxY-minY+1;grid.style.gridTemplateColumns=`repeat(${width},minmax(28px,44px))`;
    const cells=new Map(),starts=new Map();
    state.entries.forEach(e=>{for(let i=0;i<e.word.length;i++){const x=e.x+(e.dir==='across'?i:0)-minX,y=e.y+(e.dir==='down'?i:0)-minY,k=key(x,y);if(!cells.has(k))cells.set(k,{x,y,letter:e.word[i]});if(i===0){if(!starts.has(k))starts.set(k,[]);starts.get(k).push(e);}}});
    let number=0;[...starts.keys()].sort((a,b)=>{const [ax,ay]=a.split(',').map(Number),[bx,by]=b.split(',').map(Number);return ay-by||ax-bx;}).forEach(k=>{number++;starts.get(k).forEach(e=>e.number=number);});
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

  function renderClues(){const a=$('#across'),d=$('#down');a.innerHTML='';d.innerHTML='';[...state.entries].sort((x,y)=>x.number-y.number).forEach(e=>{const li=document.createElement('li');li.value=e.number;li.innerHTML=`<span>${e.item.clue}</span><small>${categoryLabel(e.item.category)} · ${e.word.length} Buchstaben</small>`;(e.dir==='across'?a:d).appendChild(li);});}
  function categoryLabel(c){return c==='food'?'Lebensmittel':c==='utensil'?'Utensil':'Fachbegriff';}
  function updateProgress(){const inputs=[...state.cells.values()],filled=inputs.filter(i=>i.value).length;$('#progress').textContent=`${state.entries.length} Begriffe · ${filled}/${inputs.length} Buchstaben`;}
  function updateStats(){if($('#bestScore'))$('#bestScore').textContent=saved.bestScore||0;if($('#solvedCount'))$('#solvedCount').textContent=saved.solved||0;}

  function check(){
    if(state.finished||state.gridSolved)return;state.checks++;
    const inputs=[...state.cells.values()];let correct=0,filled=0;
    inputs.forEach(i=>{if(i.value)filled++;const ok=norm(i.value)===i.dataset.answer;i.classList.toggle('ok',ok);i.classList.toggle('bad',!!i.value&&!ok);if(ok)correct++;});
    if(correct===inputs.length)unlockSolution();else $('#feedback').textContent=`${correct} von ${inputs.length} Buchstaben stimmen. ${inputs.length-filled} Felder sind noch leer.`;
  }

  function unlockSolution(){state.gridSolved=true;$('#solutionClue').textContent=`${state.solution.clue} (${norm(state.solution.word).length} Buchstaben)`;$('#solutionPanel').hidden=false;$('#feedback').innerHTML='<strong>Kreuzworträtsel vollständig richtig.</strong> Jetzt kannst du das Lösungswort für bis zu 100 Bonuspunkte lösen oder ohne Bonus abschließen.';$('#solutionInput').focus();}

  function hint(){if(state.finished||state.gridSolved)return;const open=[...state.cells.values()].filter(i=>norm(i.value)!==i.dataset.answer);if(!open.length)return;const input=open[Math.floor(Math.random()*open.length)];input.value=input.dataset.answer;input.classList.remove('bad');input.classList.add('ok');state.hints++;$('#feedback').textContent='Ein Buchstabe wurde aufgedeckt. Der Hinweis kostet 20 Punkte.';updateProgress();}

  function solve(){if(state.finished)return;[...state.cells.values()].forEach(i=>{i.value=i.dataset.answer;i.classList.add('ok');});state.score=0;$('#score').textContent='0';state.finished=true;$('#solutionPanel').hidden=true;$('#feedback').textContent='Rätsel aufgelöst. Diese Runde wird nicht gewertet.';updateProgress();}

  function checkSolution(){if(!state.gridSolved||state.finished)return;state.solutionAttempts++;const ok=norm($('#solutionInput').value)===norm(state.solution.word);if(ok){state.solutionBonus=Math.max(20,100-(state.solutionAttempts-1)*25);finish();}else{$('#feedback').textContent=`Lösungswort noch nicht richtig. Versuch ${state.solutionAttempts}. Der mögliche Bonus sinkt mit weiteren Versuchen.`;}}
  function skipSolution(){if(state.gridSolved&&!state.finished){state.solutionBonus=0;finish();}}

  function finish(){
    state.finished=true;const level=$('#difficulty').value,cfg=LEVELS[level],seconds=(Date.now()-state.startedAt)/1000;
    const wordBonus=state.entries.length*25,timeBonus=Math.max(0,Math.round(90-seconds/2)),hintPenalty=state.hints*20,checkPenalty=Math.max(0,state.checks-1)*10;
    state.score=Math.max(0,cfg.base+wordBonus+timeBonus+state.solutionBonus-hintPenalty-checkPenalty);$('#score').textContent=state.score;
    saved.solved=(saved.solved||0)+1;saved.bestScore=Math.max(saved.bestScore||0,state.score);saveStats();updateStats();$('#solutionPanel').hidden=true;
    $('#feedback').innerHTML=`<strong>Rätsel abgeschlossen!</strong> ${state.score} Punkte · Grundwert ${cfg.base} + ${wordBonus} Begriffsbonus + ${timeBonus} Zeitbonus + ${state.solutionBonus} Lösungswort − ${hintPenalty} Hinweise − ${checkPenalty} zusätzliche Prüfungen.`;
    submitResult(level,seconds);
  }

  function submitResult(level,seconds){
    const payload={gameId:'kitchen-crossword',gameVersion:'1.1.0',score:state.score,difficulty:level,variant:$('#variant').value,category:$('#category').value,completed:true,terms:state.entries.length,hints:state.hints,checks:state.checks,solutionBonus:state.solutionBonus,durationSeconds:Math.round(seconds),completedAt:new Date().toISOString()};
    try{const bridge=window.KCFuturaGameBridge||(window.parent&&window.parent.KCFuturaGameBridge);if(bridge&&typeof bridge.submitResult==='function')bridge.submitResult(payload);if(window.parent&&window.parent!==window)window.parent.postMessage({type:'KC_FUTURA_GAME_RESULT',payload},'*');}catch(e){}
  }
  function back(){if(state.finished||confirm('Aktuelles Rätsel verlassen?')){$('#game').hidden=true;$('#start').hidden=false;updateStats();}}

  $('#startBtn').onclick=build;$('#checkBtn').onclick=check;$('#hintBtn').onclick=hint;$('#solveBtn').onclick=solve;$('#backBtn').onclick=back;$('#solutionBtn').onclick=checkSolution;$('#skipSolutionBtn').onclick=skipSolution;$('#solutionInput').addEventListener('keydown',e=>{if(e.key==='Enter')checkSolution();});
  updateStats();
})();
