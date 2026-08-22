(function(){
  const GAME_VERSION='0.5.0';
  const DIFF={easy:{label:'Leicht',base:100},medium:{label:'Mittel',base:150},hard:{label:'Schwer',base:220},master:{label:'Meisterfall',base:300}};
  const MODES={thief:'Wer war der Dieb?',wrong_place:'Was stimmt hier nicht?',missing:'Was fehlt oder wurde verlegt?',liar:'Wer lügt?',logic:'Logikfall',combo:'Kombifall',spot_difference:'Finde die Fehler'};
  const STORAGE_KEY='kc-kitchen-detective-stats-v1';
  const allScenes=window.KC_KITCHEN_DETECTIVE_SCENES||[];
  let activeScenes=[];
  const state={index:0,total:0,attempts:0,hints:0,streak:0,startedAt:0,sessionStartedAt:0,locked:false,results:[],foundDifferences:0,foundMap:{}};
  const $=s=>document.querySelector(s);
  const saved=loadStats();

  function loadStats(){try{return Object.assign({bestScore:0,played:0,sessions:0},JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}catch(e){return {bestScore:0,played:0,sessions:0};}}
  function saveStats(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));}catch(e){}}
  function updateSavedStats(){if($('#bestScore'))$('#bestScore').textContent=saved.bestScore||0;if($('#playedCount'))$('#playedCount').textContent=saved.played||0;}
  function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function scene(){return activeScenes[state.index];}

  function buildSelection(){
    const mode=$('#modeSelect').value,difficulty=$('#difficultySelect').value,order=$('#orderSelect').value;
    let selected=allScenes.filter(s=>(mode==='all'||s.mode===mode)&&(difficulty==='all'||s.difficulty===difficulty));
    if(order==='random')selected=shuffle(selected);
    return selected;
  }
  function refreshStartInfo(){
    const selected=buildSelection();
    const assetStatus=window.KC_KITCHEN_DETECTIVE_ASSET_STATUS;
    const suffix=assetStatus?` · Bildfreigabe ${assetStatus.approvedCount}/${assetStatus.totalCount}`:'';
    $('#startInfo').textContent=selected.length?`${selected.length} freigegebene Fälle stehen bereit${suffix}.`:`Für diese Auswahl gibt es noch keine freigegebenen Fälle${suffix}.`;
    $('#startBtn').disabled=!selected.length;
  }
  function beginSession(){
    activeScenes=buildSelection();if(!activeScenes.length)return;
    state.index=0;state.total=0;state.streak=0;state.results=[];state.sessionStartedAt=Date.now();
    $('#startScreen').hidden=true;$('#playScreen').hidden=false;startCase();
  }
  function returnToMenu(){
    $('#playScreen').hidden=true;$('#startScreen').hidden=false;updateSavedStats();refreshStartInfo();
  }
  function startCase(){state.startedAt=Date.now();state.attempts=0;state.hints=0;state.locked=false;state.foundDifferences=0;state.foundMap={};render();}
  function render(){
    const s=scene();if(!s)return;const difficulty=DIFF[s.difficulty]||{label:s.difficulty,base:s.basePoints||0};
    $('#caseNo').textContent=`Fall ${state.index+1} / ${activeScenes.length}`;$('#caseTitle').textContent=s.title;$('#question').textContent=s.question;$('#difficulty').textContent=difficulty.label;$('#modeBadge').textContent=MODES[s.mode]||s.mode;$('#score').textContent=state.total;
    $('#progressBar').style.width=`${Math.round((state.index/activeScenes.length)*100)}%`;
    $('#feedback').innerHTML='';$('#hintBox').innerHTML='';$('#breakdown').innerHTML='';$('#nextBtn').hidden=true;$('#clueMarker').hidden=true;
    renderModeSpecificScene(s);renderAnswers(s);updatePointsPreview();
  }
  function setImage(img,src,alt){img.alt=alt;img.classList.remove('loaded','failed');img.onload=()=>img.classList.add('loaded');img.onerror=()=>img.classList.add('failed');img.src=src||'';}
  function renderModeSpecificScene(s){const isDiff=s.mode==='spot_difference';$('#singleScene').hidden=isDiff;$('#diffScene').hidden=!isDiff;$('#answers').hidden=isDiff;if(isDiff)renderDifferenceScene(s);else setImage($('#sceneImage'),s.image||'',`Szene ${s.id}: ${s.title}`);}
  function renderAnswers(s){const a=$('#answers');a.innerHTML='';if(s.mode==='spot_difference')return;(s.answers||[]).forEach((t,i)=>{const b=document.createElement('button');b.className='answer';b.textContent=`${String.fromCharCode(65+i)} – ${t}`;b.onclick=()=>answer(i);a.appendChild(b);});}
  function renderDifferenceScene(s){
    setImage($('#diffLeftImage'),s.leftImage||'',`Linkes Bild ${s.id}`);setImage($('#diffRightImage'),s.rightImage||'',`Rechtes Bild ${s.id}`);
    $('#diffCounter').textContent=`0 / ${s.differences.length} Unterschiede gefunden`;$('#diffHelp').textContent=`Schwierigkeit: ${(DIFF[s.difficulty]||{}).label||s.difficulty} · Ziel: ${s.differences.length} Unterschiede`;
    const left=$('#diffLeftMarkers'),right=$('#diffRightMarkers');left.innerHTML='';right.innerHTML='';left.onclick=e=>{if(e.target===left)differenceMiss();};right.onclick=e=>{if(e.target===right)differenceMiss();};s.differences.forEach((d,idx)=>{createHotspot(left,d.left,idx);createHotspot(right,d.right,idx);});
  }
  function createHotspot(container,box,idx){const b=document.createElement('button');b.type='button';b.className='hotspot';b.setAttribute('aria-label',`Unterschied ${idx+1}`);b.style.left=box.x+'%';b.style.top=box.y+'%';b.style.width=box.w+'%';b.style.height=box.h+'%';b.onclick=e=>{e.stopPropagation();markDifference(idx);};container.appendChild(b);}
  function markDifference(idx){const s=scene();if(state.locked||state.foundMap[idx])return;state.foundMap[idx]=true;state.foundDifferences++;const d=s.differences[idx];addFoundMarker($('#diffLeftMarkers'),d.left);addFoundMarker($('#diffRightMarkers'),d.right);$('#diffCounter').textContent=`${state.foundDifferences} / ${s.differences.length} Unterschiede gefunden`;if(state.foundDifferences===s.differences.length)finishDifferenceScene();}
  function addFoundMarker(container,box){const m=document.createElement('div');m.className='diff-marker';m.style.left=box.x+'%';m.style.top=box.y+'%';m.style.width=box.w+'%';m.style.height=box.h+'%';container.appendChild(m);}
  function differenceMiss(){if(state.locked)return;state.attempts++;state.streak=0;$('#feedback').textContent='Dort ist kein Unterschied. Versuche es noch einmal.';$('#breakdown').textContent=`Aktuell: ${state.attempts} Fehlklick${state.attempts===1?'':'s'} · mögliche Abzüge werden bei der Endwertung berechnet.`;}
  function finishDifferenceScene(){
    const s=scene();state.locked=true;state.streak++;const secs=(Date.now()-state.startedAt)/1000;const base=s.basePoints||(DIFF[s.difficulty]||{}).base||0;const completionBonus=differenceCompletionBonus(s);const missPenalty=Math.max(0,state.attempts)*20;const hintPenalty=state.hints===0?0:state.hints===1?25:65;const timeBonus=Math.max(0,Math.round(30-Math.max(0,secs-15)/2));const streakBonus=state.streak>0&&state.streak%5===0?50:0;const earned=Math.max(0,base+completionBonus+timeBonus+streakBonus-missPenalty-hintPenalty);
    recordResult(s,earned,secs);$('#feedback').innerHTML=`<strong>Alle Unterschiede gefunden!</strong> ${s.solution||'Sehr gut beobachtet.'}`;$('#breakdown').innerHTML=`<b>${earned} Punkte</b><br>Grundwert ${base} + Komplettbonus ${completionBonus} + Zeit ${timeBonus} + Serie ${streakBonus} − Fehlklicks ${missPenalty} − Hinweise ${hintPenalty}`;$('#nextBtn').hidden=false;
  }
  function differenceCompletionBonus(s){return (s.differences||[]).length>=10?70:(s.differences||[]).length>=8?50:35;}
  function updatePointsPreview(){const s=scene();if(!s)return;if(s.mode==='spot_difference'){const base=s.basePoints||(DIFF[s.difficulty]||{}).base||0;$('#pointsInfo').textContent=`Grundwert ${base} · Komplettbonus +${differenceCompletionBonus(s)} · Hinweis 1 −25 · Hinweis 2 zusätzlich −40 · Fehlklick −20 · Zeitbonus bis +30 · Serienbonus +50`;}else{const d=DIFF[s.difficulty];$('#pointsInfo').textContent=`Grundwert ${d.base} · 1. Versuch +40 · 2. Versuch +15 · Fehlversuch −20 · Hinweis 1 −25 · Hinweis 2 zusätzlich −40 · Zeitbonus bis +30 · Serienbonus +50`;}}
  function answer(i){
    if(state.locked)return;const s=scene();state.attempts++;if(i===s.correct){state.locked=true;state.streak++;const secs=(Date.now()-state.startedAt)/1000;const base=(DIFF[s.difficulty]||{}).base||s.basePoints||0;const attemptBonus=state.attempts===1?40:state.attempts===2?15:0;const missPenalty=Math.max(0,state.attempts-1)*20;const hintPenalty=state.hints===0?0:state.hints===1?25:65;const timeBonus=Math.max(0,Math.round(30-Math.max(0,secs-10)/2));const streakBonus=state.streak>0&&state.streak%5===0?50:0;const earned=Math.max(0,base+attemptBonus+timeBonus+streakBonus-missPenalty-hintPenalty);recordResult(s,earned,secs);$('#feedback').innerHTML=`<strong>Richtig!</strong> ${s.solution}`;$('#breakdown').innerHTML=`<b>${earned} Punkte</b><br>Grundwert ${base} + Versuch ${attemptBonus} + Zeit ${timeBonus} + Serie ${streakBonus} − Fehlversuche ${missPenalty} − Hinweise ${hintPenalty}`;showClue();document.querySelectorAll('.answer')[i].classList.add('correct');$('#nextBtn').hidden=false;}else{state.streak=0;const btn=document.querySelectorAll('.answer')[i];if(btn)btn.classList.add('wrong');$('#feedback').textContent='Noch nicht. Sieh genauer hin oder nutze einen Hinweis.';}
  }
  function recordResult(s,earned,seconds){state.total+=earned;state.results.push({id:s.id,title:s.title,difficulty:s.difficulty,mode:s.mode,earned,attempts:state.attempts,hints:state.hints,durationSeconds:Math.round(seconds),correct:true});saved.played=(saved.played||0)+1;$('#score').textContent=state.total;saveStats();}
  function hint(){if(state.locked)return;const s=scene();if(state.hints>=2)return;state.hints++;$('#hintBox').textContent=`Hinweis ${state.hints}: ${(s.hints||[])[state.hints-1]||'Achte auf kleine Details.'}`;updatePointsPreview();}
  function showClue(){const s=scene();if(!s.clue)return;const c=s.clue,box=$('#clueMarker');box.style.left=c.x+'%';box.style.top=c.y+'%';box.style.width=c.w+'%';box.style.height=c.h+'%';box.hidden=false;}
  function next(){if(state.index>=activeScenes.length-1){finish();return;}state.index++;startCase();}
  function maximumSessionScore(){
    return activeScenes.reduce((sum,s,idx)=>{
      const base=s.basePoints||(DIFF[s.difficulty]||{}).base||0;
      const caseBonus=s.mode==='spot_difference'?differenceCompletionBonus(s):40;
      const streakBonus=(idx+1)%5===0?50:0;
      return sum+base+caseBonus+30+streakBonus;
    },0);
  }
  function buildSessionResult(){
    const max=maximumSessionScore();
    const pct=max?Math.min(100,Math.round(state.total/max*100)):0;
    return {
      gameVersion:GAME_VERSION,
      score:state.total,
      bestScore:saved.bestScore,
      performancePercent:pct,
      rank:rank(state.total,activeScenes.length),
      completedCases:state.results.length,
      selectedCases:activeScenes.length,
      durationSeconds:Math.round((Date.now()-state.sessionStartedAt)/1000),
      cases:state.results.map(r=>({...r})),
      completed:true,
      completedAt:new Date().toISOString()
    };
  }
  function finish(){
    saved.sessions=(saved.sessions||0)+1;saved.bestScore=Math.max(saved.bestScore||0,state.total);saveStats();
    const result=buildSessionResult();result.bestScore=saved.bestScore;
    window.KC_KITCHEN_DETECTIVE_SESSION_RESULT=result;
    try{window.dispatchEvent(new CustomEvent('kc-kitchen-detective-session-complete',{detail:result}));}catch(e){}
    $('#playScreen').innerHTML=`<section class="finish"><span class="eyebrow">KC FUTURA · SPIELEWELT</span><h2>${activeScenes.length} Fälle abgeschlossen</h2><p class="big">${state.total} Punkte</p><p>Leistungswert: ${result.performancePercent}%</p><p>${result.rank}</p><p>Bestwert: ${saved.bestScore}</p><button id="againBtn">Neue Runde</button></section>`;$('#againBtn').onclick=()=>location.reload();
  }
  function rank(p,count){const factor=Math.max(1,count/23);if(p>=6500*factor)return 'Rang: Meisterdetektiv';if(p>=5000*factor)return 'Rang: Kücheninspektor';if(p>=3500*factor)return 'Rang: Spürnase';return 'Rang: Küchendetektiv';}

  window.KC_KITCHEN_DETECTIVE_ENGINE={version:GAME_VERSION,getApprovedSceneCount:()=>allScenes.length,getCurrentSessionResult:()=>window.KC_KITCHEN_DETECTIVE_SESSION_RESULT||null};
  $('#startBtn').onclick=beginSession;$('#hintBtn').onclick=hint;$('#nextBtn').onclick=next;$('#menuBtn').onclick=returnToMenu;
  ['modeSelect','difficultySelect','orderSelect'].forEach(id=>$('#'+id).addEventListener('change',refreshStartInfo));
  document.addEventListener('keydown',e=>{if($('#playScreen').hidden)return;if(e.key==='Enter'&&!$('#nextBtn').hidden)next();if(e.key.toLowerCase()==='h')hint();});
  updateSavedStats();refreshStartInfo();
})();