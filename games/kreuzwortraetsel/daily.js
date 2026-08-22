(function(){
  const $=s=>document.querySelector(s);
  const KEY='kc-kitchen-crossword-daily-v1';
  const GAME_VERSION='1.4.0';
  let dailyActive=false;
  let startingDaily=false;
  let completionRecorded=false;
  let currentDate='';

  function dateKey(d=new Date()){
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function hash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function seeded(seed){let x=seed>>>0;return function(){x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return {};}}
  function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));}catch(e){}}
  function plan(date){
    const seed=hash('KC-FUTURA-CROSSWORD-'+date);
    const weekday=new Date(date+'T12:00:00').getDay();
    const difficulty=weekday===0?'master':(weekday===5||weekday===6?'hard':'medium');
    const categories=['all','food','utensil','technique'];
    const variants=['classic','classic','large','quick'];
    return {seed,difficulty,category:categories[seed%categories.length],variant:variants[(seed>>>3)%variants.length]};
  }
  function labelPlan(p){
    const dl={medium:'Mittel',hard:'Schwer',master:'Meister'},cl={all:'Gemischt',food:'Lebensmittel',utensil:'Utensilien',technique:'Fachbegriffe'},vl={classic:'Klassisch',large:'Großes Rätsel',quick:'Schnellrunde'};
    return `${dl[p.difficulty]} · ${cl[p.category]} · ${vl[p.variant]}`;
  }
  function render(){
    const date=dateKey(),p=plan(date),store=load(),today=store[date]||{};
    if($('#dailyDate'))$('#dailyDate').textContent=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());
    if($('#dailyMode'))$('#dailyMode').textContent=labelPlan(p);
    if($('#dailyBest'))$('#dailyBest').textContent=today.bestScore||0;
    if($('#dailyDone'))$('#dailyDone').textContent=today.completed?'Heute gelöst':'Noch offen';
  }
  function startDaily(){
    currentDate=dateKey();const p=plan(currentDate);
    $('#difficulty').value=p.difficulty;$('#category').value=p.category;$('#variant').value=p.variant;
    completionRecorded=false;dailyActive=true;startingDaily=true;window.KC_CROSSWORD_DAILY={active:true,date:currentDate,seed:p.seed};
    const original=Math.random;Math.random=seeded(p.seed);
    try{$('#startBtn').click();}finally{Math.random=original;startingDaily=false;}
    const badge=document.getElementById('dailyGameBadge');if(badge){badge.hidden=false;badge.textContent=`Tagesrätsel · ${currentDate}`;}
  }
  function onComplete(text){
    if(!dailyActive||completionRecorded||!text.includes('Rätsel abgeschlossen!'))return;
    completionRecorded=true;
    const p=plan(currentDate),score=Number($('#score')?.textContent||0),store=load(),row=store[currentDate]||{bestScore:0,plays:0};
    row.completed=true;row.plays=(row.plays||0)+1;row.bestScore=Math.max(row.bestScore||0,score);row.lastScore=score;row.difficulty=p.difficulty;row.category=p.category;row.variant=p.variant;row.completedAt=new Date().toISOString();store[currentDate]=row;save(store);render();
    const detail={gameId:'kitchen-crossword',gameVersion:GAME_VERSION,mode:'daily',dailyDate:currentDate,difficulty:p.difficulty,category:p.category,variant:p.variant,score,bestScore:row.bestScore,completed:true};
    try{window.dispatchEvent(new CustomEvent('kc-futura-daily-result',{detail}));if(window.parent&&window.parent!==window)window.parent.postMessage({type:'KC_FUTURA_DAILY_RESULT',payload:detail},'*');}catch(e){}
  }
  function leaveDaily(){dailyActive=false;startingDaily=false;completionRecorded=false;window.KC_CROSSWORD_DAILY={active:false};const badge=$('#dailyGameBadge');if(badge)badge.hidden=true;}

  $('#dailyPuzzleBtn')?.addEventListener('click',startDaily);
  $('#startBtn')?.addEventListener('click',()=>{if(!startingDaily)leaveDaily();});
  $('#choosePuzzleBtn')?.addEventListener('click',leaveDaily);
  $('#newPuzzleBtn')?.addEventListener('click',leaveDaily,true);
  const feedback=$('#feedback');if(feedback)new MutationObserver(()=>onComplete(feedback.textContent||'')).observe(feedback,{childList:true,subtree:true,characterData:true});
  render();
})();
