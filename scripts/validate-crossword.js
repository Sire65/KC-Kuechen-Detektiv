const fs=require('fs');
const vm=require('vm');
const path=require('path');

const root=path.resolve(__dirname,'..');
const dataPath=path.join(root,'games','kreuzwortraetsel','data.js');
const source=fs.readFileSync(dataPath,'utf8');
const context={window:{}};
vm.createContext(context);
vm.runInContext(source,context,{filename:'data.js'});
const words=context.window.KC_CROSSWORD_WORDS||[];

const errors=[];
const allowedCategories=new Set(['food','utensil','technique']);
const allowedLevels=new Set(['easy','medium','hard','master']);
const normalize=s=>String(s||'').toUpperCase().replace(/Ä/g,'AE').replace(/Ö/g,'OE').replace(/Ü/g,'UE').replace(/ß/g,'SS').replace(/[^A-Z]/g,'');

if(words.length<50)errors.push(`Zu wenig Begriffe: ${words.length} (mindestens 50 erwartet)`);
const seen=new Map();
for(const [idx,item] of words.entries()){
  const pos=idx+1;
  if(!item||typeof item!=='object'){errors.push(`Eintrag ${pos} ist kein Objekt`);continue;}
  const normalized=normalize(item.word);
  if(!normalized)errors.push(`Eintrag ${pos}: leeres Wort`);
  if(normalized.length<2)errors.push(`Eintrag ${pos}: Wort zu kurz (${item.word})`);
  if(seen.has(normalized))errors.push(`Doppelter Begriff: ${item.word} / ${seen.get(normalized)}`);else seen.set(normalized,item.word);
  if(!allowedCategories.has(item.category))errors.push(`${item.word}: ungültige Kategorie ${item.category}`);
  if(!allowedLevels.has(item.level))errors.push(`${item.word}: ungültige Stufe ${item.level}`);
  if(!item.clue||String(item.clue).trim().length<12)errors.push(`${item.word}: Hinweis fehlt oder ist zu kurz`);
}

const required=['TOMATE','GURKE','PFEFFER','KELLE','LOEFFEL','BLANCHIEREN','NAPPIEREN'];
for(const word of required)if(!seen.has(word))errors.push(`Pflichtbegriff fehlt: ${word}`);

const counts={};
for(const category of allowedCategories){
  counts[category]={};
  for(const level of allowedLevels)counts[category][level]=words.filter(w=>w.category===category&&w.level===level).length;
}
if(words.filter(w=>w.level==='master').length<10)errors.push('Meister-Wortpool ist zu klein (mindestens 10 erwartet)');
if(words.filter(w=>w.category==='technique').length<20)errors.push('Zu wenig Fachbegriffe (mindestens 20 erwartet)');

if(errors.length){
  console.error('Kreuzworträtsel-QA FEHLGESCHLAGEN');
  errors.forEach(e=>console.error('- '+e));
  process.exit(1);
}
console.log(`Kreuzworträtsel-QA OK: ${words.length} Begriffe, ${words.filter(w=>w.level==='master').length} Meisterbegriffe.`);
console.log(JSON.stringify(counts,null,2));
