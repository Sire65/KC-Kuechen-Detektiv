const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const errors=[];
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);
const required=['index.html','styles.css','scenes.js','image-approvals.js','engine.js','futura-adapter.js','module.json','FUTURA_RESULT_CONTRACT.md'];
for(const file of required)if(!exists(path.join(root,file)))errors.push(`Pflichtdatei fehlt: ${file}`);

let moduleJson={};
try{moduleJson=JSON.parse(read(path.join(root,'module.json')));}catch(e){errors.push('module.json ungültig');}
if(moduleJson.id!=='kc-kitchen-detective')errors.push('module.json: falsche id');
if(moduleJson.version!=='0.5.0')errors.push(`module.json: erwartete Version 0.5.0, gefunden ${moduleJson.version||'keine'}`);
if(moduleJson.entry!=='index.html')errors.push('module.json: entry muss index.html sein');
if(moduleJson.sceneCount!==23)errors.push(`module.json: sceneCount muss 23 sein, gefunden ${moduleJson.sceneCount}`);

const engine=exists(path.join(root,'engine.js'))?read(path.join(root,'engine.js')):'';
const adapter=exists(path.join(root,'futura-adapter.js'))?read(path.join(root,'futura-adapter.js')):'';
const ev=engine.match(/const\s+GAME_VERSION=['"]([^'"]+)/)?.[1];
const av=adapter.match(/const\s+GAME_VERSION=['"]([^'"]+)/)?.[1];
if(ev!==moduleJson.version)errors.push(`Versionskonflikt engine.js ${ev} vs module.json ${moduleJson.version}`);
if(av!==moduleJson.version)errors.push(`Versionskonflikt futura-adapter.js ${av} vs module.json ${moduleJson.version}`);
if(!engine.includes('kc-kitchen-detective-session-complete'))errors.push('engine.js: strukturiertes Session-Abschluss-Event fehlt');
if(!engine.includes('Math.min(100'))errors.push('engine.js: Leistungswert ist nicht auf 100% begrenzt');
if(!engine.includes('durationSeconds'))errors.push('engine.js: Falldauer fehlt in Resultaten');
if(!adapter.includes("contractVersion:'1.1'"))errors.push('futura-adapter.js: Vertrag 1.1 fehlt');
if(!adapter.includes("type:'KC_FUTURA_GAME_RESULT'"))errors.push('futura-adapter.js: FUTURA postMessage fehlt');
if(!adapter.includes('cases:Array.isArray'))errors.push('futura-adapter.js: Einzelfallresultate fehlen');

const html=exists(path.join(root,'index.html'))?read(path.join(root,'index.html')):'';
const scripts=['scenes.js','image-approvals.js','engine.js','futura-adapter.js'];
let last=-1;
for(const script of scripts){const p=html.indexOf(`src="${script}"`);if(p<0)errors.push(`index.html: ${script} fehlt`);else if(p<last)errors.push(`index.html: Script-Reihenfolge falsch bei ${script}`);last=Math.max(last,p);}

const approvals=exists(path.join(root,'image-approvals.js'))?read(path.join(root,'image-approvals.js')):'';
if(!approvals.includes('approvedSingle'))errors.push('image-approvals.js: approvedSingle fehlt');
if(!approvals.includes('approvedDifference'))errors.push('image-approvals.js: approvedDifference fehlt');
if(!approvals.includes('SCENES_ALL'))errors.push('image-approvals.js: Vollkatalog-Sicherung fehlt');

const manifestPath=path.join(root,'games','manifest.json');
if(exists(manifestPath)){
  try{const manifest=JSON.parse(read(manifestPath));const item=(manifest.games||[]).find(g=>g.id==='kitchen-detective');if(!item)errors.push('games/manifest.json: kitchen-detective fehlt');else if(item.entry!=='../index.html')errors.push(`games/manifest.json: kitchen-detective entry falsch (${item.entry})`);}catch(e){errors.push('games/manifest.json ungültig');}
}else errors.push('games/manifest.json fehlt');

if(errors.length){console.error('Küchen-Detektiv Architektur-TÜV FEHLGESCHLAGEN');errors.forEach(e=>console.error('- '+e));process.exit(1);}
console.log(`Küchen-Detektiv Architektur-TÜV OK · Version ${moduleJson.version} · ${required.length} Pflichtdateien · FUTURA/Manifest/Asset-Gate geprüft.`);