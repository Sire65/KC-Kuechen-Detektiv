const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const fail = [];
const warn = [];
const ok = msg => console.log(`✓ ${msg}`);
const error = msg => { fail.push(msg); console.error(`✗ ${msg}`); };
const warning = msg => { warn.push(msg); console.warn(`! ${msg}`); };

function loadGameData() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'scenes.js'), 'utf8'), sandbox, { filename: 'scenes.js' });
  const all = sandbox.window.KC_KITCHEN_DETECTIVE_SCENES;
  if (!Array.isArray(all)) throw new Error('scenes.js stellt kein Szenen-Array bereit.');
  sandbox.window.KC_KITCHEN_DETECTIVE_SCENES = all;
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'image-approvals.js'), 'utf8'), sandbox, { filename: 'image-approvals.js' });
  return {
    all,
    manifest: sandbox.window.KC_KITCHEN_DETECTIVE_APPROVED_ASSETS || {},
    status: sandbox.window.KC_KITCHEN_DETECTIVE_ASSET_STATUS || {}
  };
}

function boxValid(box) {
  return box && ['x','y','w','h'].every(k => Number.isFinite(box[k])) &&
    box.x >= 0 && box.y >= 0 && box.w > 0 && box.h > 0 &&
    box.x + box.w <= 100 && box.y + box.h <= 100;
}

function isRealWebP(file) {
  if (!fs.existsSync(file)) return false;
  const b = fs.readFileSync(file);
  return b.length >= 16 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
}

function validate() {
  const { all, manifest } = loadGameData();
  const expectedIds = Array.from({length:23}, (_,i) => `KD-${String(i+1).padStart(3,'0')}`);
  const ids = all.map(s => s.id);
  const validModes = new Set(['thief','wrong_place','missing','liar','logic','combo','spot_difference']);
  const validDiff = new Set(['easy','medium','hard','master']);
  const expectedDiffCounts = {'KD-021':6,'KD-022':8,'KD-023':10};

  if (all.length !== 23) error(`Erwartet 23 Fälle, gefunden ${all.length}.`); else ok('23 Falldefinitionen vorhanden');
  if (new Set(ids).size !== ids.length) error('Doppelte Fall-ID gefunden.'); else ok('Fall-IDs sind eindeutig');
  if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) error('Fall-IDs sind nicht lückenlos KD-001 bis KD-023 sortiert.'); else ok('Fall-IDs sind lückenlos');

  for (const s of all) {
    if (!s.title || !s.question) error(`${s.id}: Titel oder Frage fehlt.`);
    if (!validModes.has(s.mode)) error(`${s.id}: unbekannter Modus ${s.mode}.`);
    if (!validDiff.has(s.difficulty)) error(`${s.id}: unbekannte Schwierigkeit ${s.difficulty}.`);
    if (!Array.isArray(s.hints) || s.hints.length < 2) error(`${s.id}: mindestens zwei Hinweise erforderlich.`);
    if (!s.solution) error(`${s.id}: Lösungstext fehlt.`);

    if (s.mode === 'spot_difference') {
      const expected = expectedDiffCounts[s.id];
      if (!expected) error(`${s.id}: Differenzmodus außerhalb KD-021 bis KD-023.`);
      if (!Array.isArray(s.differences) || s.differences.length !== expected) error(`${s.id}: erwartet ${expected} Unterschiede, gefunden ${s.differences?.length ?? 0}.`);
      if (!s.leftImage || !s.rightImage) error(`${s.id}: Bildpaar unvollständig.`);
      (s.differences || []).forEach((d,i) => {
        if (!boxValid(d.left) || !boxValid(d.right)) error(`${s.id}: Hotspot ${i+1} liegt außerhalb des Bildes.`);
      });
    } else {
      if (!Array.isArray(s.answers) || s.answers.length < 2) error(`${s.id}: Antwortmöglichkeiten fehlen.`);
      if (!Number.isInteger(s.correct) || s.correct < 0 || s.correct >= (s.answers?.length || 0)) error(`${s.id}: correct verweist auf keine gültige Antwort.`);
      if (!s.image) error(`${s.id}: Bildpfad fehlt.`);
      if (s.clue && !boxValid(s.clue)) error(`${s.id}: Lösungsmarker liegt außerhalb des Bildes.`);
    }
  }
  if (!fail.length) ok('Struktur und Spiellogik der Fälle sind konsistent');

  const approvedSingles = Array.isArray(manifest.approvedSingle) ? manifest.approvedSingle : [];
  const approvedDiff = Array.isArray(manifest.approvedDifference) ? manifest.approvedDifference : [];
  for (const id of [...approvedSingles, ...approvedDiff]) {
    const s = all.find(x => x.id === id);
    if (!s) { error(`Freigabe verweist auf unbekannten Fall ${id}.`); continue; }
    const files = s.mode === 'spot_difference' ? [s.leftImage, s.rightImage] : [s.image];
    for (const rel of files) {
      const full = path.join(ROOT, rel);
      if (!fs.existsSync(full)) error(`${id}: freigegebenes Asset fehlt: ${rel}`);
      else if (!isRealWebP(full)) error(`${id}: ${rel} ist keine gültige RIFF/WEBP-Datei.`);
      else ok(`${id}: Asset technisch gültig (${rel})`);
    }
  }

  for (const id of approvedSingles) {
    const s = all.find(x => x.id === id);
    if (s?.mode === 'spot_difference') error(`${id}: Differenzfall steht fälschlich in approvedSingle.`);
  }
  for (const id of approvedDiff) {
    const s = all.find(x => x.id === id);
    if (s?.mode !== 'spot_difference') error(`${id}: Einzelbildfall steht fälschlich in approvedDifference.`);
  }

  console.log(`\nQA-Ergebnis: ${fail.length} Fehler, ${warn.length} Warnungen.`);
  if (fail.length) process.exit(1);
}

try { validate(); } catch (e) { console.error(e.stack || e); process.exit(1); }
