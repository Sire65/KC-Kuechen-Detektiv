const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const gameDir=path.join(root,'games','kreuzwortraetsel');
const errors=[];
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);

const requiredFiles=['index.html','styles.css','data.js','game.js','navigation.js','motivation.js','daily.js','module.json'];
for(const file of requiredFiles){
  if(!exists(path.join(gameDir,file)))errors.push(`Pflichtdatei fehlt: games/kreuzwortraetsel/${file}`);
}

const modulePath=path.join(gameDir,'module.json');
const manifestPath=path.join(root,'games','manifest.json');
if(!exists(modulePath))errors.push('module.json fehlt');
if(!exists(manifestPath))errors.push('games/manifest.json fehlt');

let moduleJson={},manifest={};
try{moduleJson=JSON.parse(read(modulePath));}catch(e){errors.push('module.json ist kein gültiges JSON');}
try{manifest=JSON.parse(read(manifestPath));}catch(e){errors.push('games/manifest.json ist kein gültiges JSON');}

if(moduleJson.id!=='kitchen-crossword')errors.push('module.json: falsche oder fehlende id kitchen-crossword');
if(moduleJson.version!=='1.4.0')errors.push(`module.json: erwartete Version 1.4.0, gefunden ${moduleJson.version||'keine'}`);
if(moduleJson.entry!=='games/kreuzwortraetsel/index.html')errors.push('module.json: entry ist nicht FUTURA-kompatibel');
if(!Array.isArray(moduleJson.difficulties)||!['easy','medium','hard','master'].every(v=>moduleJson.difficulties.includes(v)))errors.push('module.json: Schwierigkeitsstufen unvollständig');
if(!Array.isArray(moduleJson.variants)||!['quick','classic','large'].every(v=>moduleJson.variants.includes(v)))errors.push('module.json: Varianten unvollständig');
if(moduleJson.futuraMigration?.postMessageType!=='KC_FUTURA_GAME_RESULT')errors.push('module.json: FUTURA Result Message Type fehlt/falsch');
if(moduleJson.dailyMode?.postMessageType!=='KC_FUTURA_DAILY_RESULT')errors.push('module.json: Daily Result Message Type fehlt/falsch');

const games=Array.isArray(manifest.games)?manifest.games:[];
const detective=games.find(g=>g.id==='kitchen-detective');
const crossword=games.find(g=>g.id==='kitchen-crossword');
if(!detective)errors.push('games/manifest.json: kitchen-detective fehlt');
else if(detective.entry!=='../index.html')errors.push(`games/manifest.json: kitchen-detective entry falsch (${detective.entry})`);
if(!crossword)errors.push('games/manifest.json: kitchen-crossword fehlt');
else if(crossword.entry!=='kreuzwortraetsel/index.html')errors.push(`games/manifest.json: kitchen-crossword entry falsch (${crossword.entry})`);

if(exists(path.join(gameDir,'index.html'))){
  const html=read(path.join(gameDir,'index.html'));
  const scripts=['data.js','game.js','navigation.js','motivation.js','daily.js'];
  let last=-1;
  for(const script of scripts){
    const pos=html.indexOf(`src="${script}"`);
    if(pos<0)errors.push(`index.html: Script fehlt: ${script}`);
    else if(pos<last)errors.push(`index.html: falsche Script-Reihenfolge bei ${script}`);
    last=Math.max(last,pos);
  }
  const requiredIds=['startBtn','dailyPuzzleBtn','difficulty','category','variant','grid','checkBtn','hintBtn','solveBtn','solutionPanel','resultPanel','newPuzzleBtn','choosePuzzleBtn'];
  for(const id of requiredIds)if(!html.includes(`id="${id}"`))errors.push(`index.html: Pflicht-ID fehlt: ${id}`);
}

if(exists(path.join(gameDir,'game.js'))){
  const game=read(path.join(gameDir,'game.js'));
  const versionMatch=game.match(/const\s+GAME_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if(!versionMatch)errors.push('game.js: zentrale GAME_VERSION fehlt');
  else if(versionMatch[1]!==moduleJson.version)errors.push(`Versionskonflikt: game.js ${versionMatch[1]} vs module.json ${moduleJson.version}`);
  if(!game.includes("type:'KC_FUTURA_GAME_RESULT'"))errors.push('game.js: FUTURA postMessage fehlt');
}

if(exists(path.join(gameDir,'daily.js'))){
  const daily=read(path.join(gameDir,'daily.js'));
  if(!daily.includes("type:'KC_FUTURA_DAILY_RESULT'"))errors.push('daily.js: Daily postMessage fehlt');
  if(!daily.includes("KC-FUTURA-CROSSWORD-"))errors.push('daily.js: deterministischer Tages-Seed fehlt');
}

if(exists(path.join(gameDir,'motivation.js'))){
  const motivation=read(path.join(gameDir,'motivation.js'));
  if(!motivation.includes('bestStreak'))errors.push('motivation.js: Bestserie fehlt');
  if(!motivation.includes('streak5'))errors.push('motivation.js: Serien-Abzeichen unvollständig');
}

if(errors.length){
  console.error('Kreuzworträtsel-Architektur-TÜV FEHLGESCHLAGEN');
  errors.forEach(e=>console.error('- '+e));
  process.exit(1);
}
console.log(`Kreuzworträtsel-Architektur-TÜV OK · Modul ${moduleJson.version} · ${requiredFiles.length} Pflichtdateien · FUTURA/Manifest/Daily geprüft.`);
