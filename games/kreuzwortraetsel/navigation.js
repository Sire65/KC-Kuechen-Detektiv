(function(){
  const $=s=>document.querySelector(s);
  const norm=s=>String(s||'').toUpperCase().replace(/Ä/g,'AE').replace(/Ö/g,'OE').replace(/Ü/g,'UE').replace(/ß/g,'SS').replace(/[^A-Z]/g,'');
  let entries=[];
  let active=null;
  let coordMap=new Map();
  let inputEntries=new Map();
  let rebuildTimer=null;

  function coordOf(input){
    const m=(input.getAttribute('aria-label')||'').match(/(\d+)\D+(\d+)/);
    return m?{x:Number(m[1]),y:Number(m[2])}:null;
  }
  function k(x,y){return x+','+y;}
  function scheduleRebuild(){clearTimeout(rebuildTimer);rebuildTimer=setTimeout(rebuild,20);}

  function rebuild(){
    const grid=$('#grid');
    if(!grid||!grid.querySelector('input'))return;
    entries=[];coordMap=new Map();inputEntries=new Map();active=null;
    const inputs=[...grid.querySelectorAll('.cell input')];
    inputs.forEach(input=>{const c=coordOf(input);if(c)coordMap.set(k(c.x,c.y),input);input.classList.remove('active-cell');});

    const words=window.KC_CROSSWORD_WORDS||[];
    ['across','down'].forEach(dir=>{
      const list=$('#'+dir);if(!list)return;
      [...list.querySelectorAll('li')].forEach(li=>{
        const clue=(li.querySelector('span')||li).textContent.trim();
        const item=words.find(w=>w.clue===clue);if(!item)return;
        const word=norm(item.word),number=Number(li.value||0);
        const path=findPath(word,dir,number);
        if(!path.length)return;
        const entry={dir,li,word,inputs:path,number};entries.push(entry);
        path.forEach(input=>{if(!inputEntries.has(input))inputEntries.set(input,[]);inputEntries.get(input).push(entry);});
        li.tabIndex=0;li.setAttribute('role','button');li.setAttribute('aria-label',`${number} ${dir==='across'?'waagerecht':'senkrecht'}: ${clue}`);
        if(li.dataset.kcNavBound!=='1'){
          li.dataset.kcNavBound='1';
          li.addEventListener('click',()=>activate(findEntryForClue(li),true));
          li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(findEntryForClue(li),true);}});
        }
      });
    });

    inputs.forEach(input=>{
      if(input.dataset.kcNavBound==='1')return;
      input.dataset.kcNavBound='1';
      input.addEventListener('focus',()=>selectForInput(input,false));
      input.addEventListener('click',()=>selectForInput(input,true));
      input.addEventListener('input',()=>autoAdvance(input));
      input.addEventListener('keydown',e=>handleKey(e,input));
    });
  }

  function findEntryForClue(li){return entries.find(e=>e.li===li)||null;}

  function findPath(word,dir,number){
    const candidates=[];
    for(const [coord,input] of coordMap){
      if(input.dataset.answer!==word[0])continue;
      const [x,y]=coord.split(',').map(Number),path=[];let ok=true;
      for(let i=0;i<word.length;i++){
        const nx=x+(dir==='across'?i:0),ny=y+(dir==='down'?i:0),cell=coordMap.get(k(nx,ny));
        if(!cell||cell.dataset.answer!==word[i]){ok=false;break;}path.push(cell);
      }
      if(ok)candidates.push(path);
    }
    if(candidates.length<=1)return candidates[0]||[];
    const numbered=candidates.find(path=>{
      const n=path[0].parentElement&&path[0].parentElement.querySelector('.num');
      return n&&Number(n.textContent)===number;
    });
    return numbered||candidates[0];
  }

  function activate(entry,focus){
    if(!entry)return;
    entries.forEach(e=>e.li.classList.toggle('active-clue',e===entry));
    [...coordMap.values()].forEach(i=>i.classList.remove('active-cell'));
    entry.inputs.forEach(i=>i.classList.add('active-cell'));
    active=entry;
    if(focus){
      const target=entry.inputs.find(i=>norm(i.value)!==i.dataset.answer)||entry.inputs[0];
      target.focus({preventScroll:true});
      target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});
    }
  }

  function selectForInput(input,cycle){
    const list=inputEntries.get(input)||[];if(!list.length)return;
    if(cycle&&list.length>1&&active&&list.includes(active)){
      const idx=list.indexOf(active);activate(list[(idx+1)%list.length],false);return;
    }
    if(active&&list.includes(active)){activate(active,false);return;}
    activate(list[0],false);
  }

  function autoAdvance(input){
    if(!input.value||!active||!active.inputs.includes(input))return;
    const idx=active.inputs.indexOf(input),next=active.inputs[idx+1];
    if(next){next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'nearest'});}
  }

  function handleKey(e,input){
    const c=coordOf(input);if(!c)return;
    if(e.key==='Backspace'&&!input.value&&active&&active.inputs.includes(input)){
      const idx=active.inputs.indexOf(input),prev=active.inputs[idx-1];
      if(prev){e.preventDefault();prev.focus({preventScroll:true});prev.select();}return;
    }
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
    if(delta){const next=coordMap.get(k(c.x+delta[0],c.y+delta[1]));if(next){e.preventDefault();next.focus({preventScroll:true});next.select();next.scrollIntoView({block:'nearest',inline:'nearest'});}}
  }

  const grid=$('#grid');
  if(grid)new MutationObserver(scheduleRebuild).observe(grid,{childList:true});
  document.addEventListener('DOMContentLoaded',scheduleRebuild);
  scheduleRebuild();
})();
