(function(){
  const GAME_ID='kc-kitchen-detective';
  const GAME_VERSION='0.5.0';
  let sent=false;

  function text(selector){const el=document.querySelector(selector);return el?el.textContent.trim():'';}
  function numberFrom(value){const m=String(value||'').replace(/\./g,'').match(/-?\d+/);return m?Number(m[0]):0;}
  function playerContext(){
    const ctx=window.KCFuturaPlayer||window.KCFUTURA_PLAYER||{};
    return {playerId:ctx.id||ctx.playerId||null,memberId:ctx.memberId||null,displayName:ctx.displayName||ctx.name||null};
  }
  function fromSessionResult(session){
    if(!session)return null;
    return {
      contractVersion:'1.1',event:'game.completed',
      game:{id:GAME_ID,name:'KC FUTURA – Küchen-Detektiv',version:session.gameVersion||GAME_VERSION},
      player:playerContext(),
      result:{
        score:session.score||0,bestScore:session.bestScore||0,performancePercent:session.performancePercent||0,
        rank:String(session.rank||'').replace(/^Rang:\s*/, '')||null,completedCases:session.completedCases||0,
        selectedCases:session.selectedCases||session.completedCases||0,durationSeconds:session.durationSeconds||0,
        cases:Array.isArray(session.cases)?session.cases:[],completed:session.completed!==false
      },
      context:{embedded:window.parent!==window,completedAt:session.completedAt||new Date().toISOString()}
    };
  }
  function fromFinishDom(){
    const finish=document.querySelector('#playScreen .finish');if(!finish)return null;
    const heading=text('#playScreen .finish h2'),scoreText=text('#playScreen .finish .big');
    const paragraphs=[...finish.querySelectorAll('p')].map(p=>p.textContent.trim());
    const performance=paragraphs.find(v=>v.startsWith('Leistungswert:'))||'',rankLine=paragraphs.find(v=>v.startsWith('Rang:'))||'',bestLine=paragraphs.find(v=>v.startsWith('Bestwert:'))||'';
    return {contractVersion:'1.0',event:'game.completed',game:{id:GAME_ID,name:'KC FUTURA – Küchen-Detektiv',version:GAME_VERSION},player:playerContext(),result:{score:numberFrom(scoreText),bestScore:numberFrom(bestLine),performancePercent:numberFrom(performance),rank:rankLine.replace(/^Rang:\s*/,'')||null,completedCases:numberFrom(heading),completed:true},context:{embedded:window.parent!==window,completedAt:new Date().toISOString(),fallback:true}};
  }
  function deliver(payload){
    if(!payload||sent)return false;sent=true;let delivered=false;
    try{const bridge=window.KCFuturaGameBridge||(window.parent&&window.parent.KCFuturaGameBridge);if(typeof bridge==='function'){bridge(payload);delivered=true;}else if(bridge&&typeof bridge.submitResult==='function'){bridge.submitResult(payload);delivered=true;}else if(bridge&&typeof bridge.onGameResult==='function'){bridge.onGameResult(payload);delivered=true;}}catch(err){console.warn('KCFuturaGameBridge konnte Ergebnis nicht übernehmen:',err);}
    try{window.dispatchEvent(new CustomEvent('kc-futura-game-result',{detail:payload}));}catch(err){}
    if(window.parent!==window){try{window.parent.postMessage({type:'KC_FUTURA_GAME_RESULT',payload},'*');delivered=true;}catch(err){}}
    try{localStorage.setItem('kc-kitchen-detective-last-result',JSON.stringify(payload));}catch(err){}
    window.KC_KITCHEN_DETECTIVE_LAST_RESULT=payload;return delivered;
  }
  function detectFinish(){if(sent)return;const payload=fromSessionResult(window.KC_KITCHEN_DETECTIVE_SESSION_RESULT)||fromFinishDom();if(payload)deliver(payload);}

  window.addEventListener('kc-kitchen-detective-session-complete',e=>deliver(fromSessionResult(e.detail)));
  const observer=new MutationObserver(detectFinish);observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',detectFinish,{once:true});
})();