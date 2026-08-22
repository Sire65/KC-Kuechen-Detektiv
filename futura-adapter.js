(function(){
  const GAME_ID='kc-kitchen-detective';
  let sent=false;

  function text(selector){
    const el=document.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  function numberFrom(value){
    const m=String(value||'').replace(/\./g,'').match(/-?\d+/);
    return m ? Number(m[0]) : 0;
  }

  function playerContext(){
    const ctx=window.KCFuturaPlayer||window.KCFUTURA_PLAYER||{};
    return {
      playerId:ctx.id||ctx.playerId||null,
      memberId:ctx.memberId||null,
      displayName:ctx.displayName||ctx.name||null
    };
  }

  function buildPayload(){
    const finish=document.querySelector('#playScreen .finish');
    if(!finish)return null;

    const heading=text('#playScreen .finish h2');
    const scoreText=text('#playScreen .finish .big');
    const paragraphs=[...finish.querySelectorAll('p')].map(p=>p.textContent.trim());
    const performance=paragraphs.find(v=>v.startsWith('Leistungswert:'))||'';
    const rankLine=paragraphs.find(v=>v.startsWith('Rang:'))||'';
    const bestLine=paragraphs.find(v=>v.startsWith('Bestwert:'))||'';
    const caseCount=numberFrom(heading);
    const score=numberFrom(scoreText);
    const performancePercent=numberFrom(performance);
    const bestScore=numberFrom(bestLine);
    const player=playerContext();

    return {
      contractVersion:'1.0',
      event:'game.completed',
      game:{id:GAME_ID,name:'KC FUTURA – Küchen-Detektiv',version:'0.4.0'},
      player,
      result:{
        score,
        bestScore,
        performancePercent,
        rank:rankLine.replace(/^Rang:\s*/,'')||null,
        completedCases:caseCount,
        completed:true
      },
      context:{
        embedded:window.parent!==window,
        completedAt:new Date().toISOString()
      }
    };
  }

  function deliver(payload){
    let delivered=false;
    try{
      const bridge=window.KCFuturaGameBridge;
      if(typeof bridge==='function'){
        bridge(payload);delivered=true;
      }else if(bridge&&typeof bridge.submitResult==='function'){
        bridge.submitResult(payload);delivered=true;
      }else if(bridge&&typeof bridge.onGameResult==='function'){
        bridge.onGameResult(payload);delivered=true;
      }
    }catch(err){console.warn('KCFuturaGameBridge konnte Ergebnis nicht übernehmen:',err);}

    try{
      window.dispatchEvent(new CustomEvent('kc-futura-game-result',{detail:payload}));
    }catch(err){}

    if(window.parent!==window){
      try{
        window.parent.postMessage({type:'KC_FUTURA_GAME_RESULT',payload},'*');
        delivered=true;
      }catch(err){}
    }

    try{
      localStorage.setItem('kc-kitchen-detective-last-result',JSON.stringify(payload));
    }catch(err){}

    return delivered;
  }

  function detectFinish(){
    if(sent)return;
    const payload=buildPayload();
    if(!payload)return;
    sent=true;
    window.KC_KITCHEN_DETECTIVE_LAST_RESULT=payload;
    deliver(payload);
  }

  const observer=new MutationObserver(detectFinish);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',detectFinish,{once:true});
})();
