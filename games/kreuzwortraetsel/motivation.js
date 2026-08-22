(function(){
  const KEY='kc-kitchen-crossword-motivation-v1';
  const $=s=>document.querySelector(s);
  const load=()=>{try{return Object.assign({streak:0,bestStreak:0,achievements:[]},JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return {streak:0,bestStreak:0,achievements:[]};}};
  const save=data=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}};
  const data=load();
  let lastSignature='';

  const ACHIEVEMENTS={
    first:{label:'Erstes Rätsel',text:'Das erste Kreuzworträtsel wurde vollständig gelöst.'},
    clean:{label:'Ohne Hilfe',text:'Ein Rätsel ohne aufgedeckten Buchstaben gelöst.'},
    master:{label:'Meisterkoch',text:'Ein Rätsel im Meistermodus abgeschlossen.'},
    score700:{label:'Punktejäger',text:'Mindestens 700 Punkte in einer Runde erreicht.'},
    streak3:{label:'Dreierserie',text:'Drei Rätsel in Folge erfolgreich abgeschlossen.'},
    streak5:{label:'Küchenprofi',text:'Fünf Rätsel in Folge erfolgreich abgeschlossen.'}
  };

  function award(id,newOnes){
    if(data.achievements.includes(id))return;
    data.achievements.push(id);newOnes.push(id);
  }
  function parseHintPenalty(text){const m=text.match(/−\s*(\d+)\s*Hinweise/);return m?Number(m[1]):null;}
  function render(newOnes=[]){
    const panel=$('#resultPanel');if(!panel)return;
    $('#streakValue').textContent=data.streak;
    $('#bestStreakValue').textContent=data.bestStreak;
    const badges=$('#achievementList');badges.innerHTML='';
    data.achievements.forEach(id=>{const a=ACHIEVEMENTS[id];if(!a)return;const el=document.createElement('div');el.className='achievement'+(newOnes.includes(id)?' new-achievement':'');el.innerHTML=`<strong>${a.label}</strong><span>${a.text}</span>`;badges.appendChild(el);});
    $('#achievementEmpty').hidden=data.achievements.length>0;
  }
  function showCompletion(text){
    const score=Number($('#score')?.textContent||0),difficulty=$('#difficulty')?.value||'';
    const signature=[score,text,difficulty].join('|');if(signature===lastSignature)return;lastSignature=signature;
    data.streak=(data.streak||0)+1;data.bestStreak=Math.max(data.bestStreak||0,data.streak);
    const newly=[];award('first',newly);
    const hintPenalty=parseHintPenalty(text);if(hintPenalty===0)award('clean',newly);
    if(difficulty==='master')award('master',newly);
    if(score>=700)award('score700',newly);
    if(data.streak>=3)award('streak3',newly);if(data.streak>=5)award('streak5',newly);
    save(data);render(newly);$('#resultPanel').hidden=false;
  }
  function resetForNewRound(){lastSignature='';$('#resultPanel').hidden=true;}
  function newPuzzle(){resetForNewRound();$('#startBtn')?.click();window.scrollTo({top:0,behavior:'smooth'});}
  function choosePuzzle(){resetForNewRound();$('#game').hidden=true;$('#start').hidden=false;window.scrollTo({top:0,behavior:'smooth'});}

  const feedback=$('#feedback');
  if(feedback){new MutationObserver(()=>{const text=feedback.textContent||'';if(text.includes('Rätsel abgeschlossen!'))showCompletion(text);}).observe(feedback,{childList:true,subtree:true,characterData:true});}
  $('#newPuzzleBtn')?.addEventListener('click',newPuzzle);
  $('#choosePuzzleBtn')?.addEventListener('click',choosePuzzle);
  $('#startBtn')?.addEventListener('click',resetForNewRound);
  render();
})();