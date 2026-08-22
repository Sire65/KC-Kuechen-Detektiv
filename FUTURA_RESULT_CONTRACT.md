# KC Küchen-Detektiv – Ergebnisvertrag für KC FUTURA

Dieser Vertrag definiert die Übergabe einer abgeschlossenen Sitzung an die **KC FUTURA Spielewelt**. Das Spiel bleibt auch ohne FUTURA-Host vollständig standalone lauffähig.

## Vertrag 1.1

Das Spiel erzeugt nach Abschluss genau ein Ergebnisobjekt:

```js
{
  contractVersion: '1.1',
  event: 'game.completed',
  game: {
    id: 'kc-kitchen-detective',
    name: 'KC FUTURA – Küchen-Detektiv',
    version: '0.5.0'
  },
  player: {
    playerId: null,
    memberId: null,
    displayName: null
  },
  result: {
    score: 0,
    bestScore: 0,
    performancePercent: 0,
    rank: 'Küchendetektiv',
    completedCases: 0,
    selectedCases: 0,
    durationSeconds: 0,
    cases: [
      {
        id: 'KD-001',
        title: 'Das verschwundene Steak',
        difficulty: 'easy',
        mode: 'thief',
        earned: 0,
        attempts: 1,
        hints: 0,
        durationSeconds: 0,
        correct: true
      }
    ],
    completed: true
  },
  context: {
    embedded: false,
    completedAt: 'ISO-8601'
  }
}
```

## Spielerübernahme

Der Host kann vor Spielstart optional einen Spieler bereitstellen:

```js
window.KCFuturaPlayer = {
  id: '...',
  memberId: '...',
  displayName: '...'
};
```

Alternativ wird `window.KCFUTURA_PLAYER` akzeptiert. Ohne Host-Kontext werden keine erfundenen IDs erzeugt.

## Ergebniswege

Der Adapter unterstützt nacheinander folgende Host-Schnittstellen:

```js
window.KCFuturaGameBridge(payload)
window.KCFuturaGameBridge.submitResult(payload)
window.KCFuturaGameBridge.onGameResult(payload)
```

Zusätzlich werden ausgelöst:

- Browser-Event `kc-futura-game-result`
- `postMessage({ type: 'KC_FUTURA_GAME_RESULT', payload })` an den Parent-Frame
- lokaler Fallback `localStorage['kc-kitchen-detective-last-result']`
- `window.KC_KITCHEN_DETECTIVE_LAST_RESULT`

## Interner Abschluss

Die Engine erzeugt zuerst `window.KC_KITCHEN_DETECTIVE_SESSION_RESULT` und sendet das Event:

```js
window.dispatchEvent(new CustomEvent(
  'kc-kitchen-detective-session-complete',
  { detail: sessionResult }
));
```

Der FUTURA-Adapter verwendet diese strukturierten Daten direkt. Das Auslesen der Abschlussanzeige bleibt nur als Rückfallebene bestehen.

## Regeln

- Ein Sitzungsabschluss wird nur einmal an FUTURA übertragen.
- `performancePercent` ist auf maximal 100 % begrenzt.
- Die Maximalpunktzahl berücksichtigt Grundwert, bestmöglichen Versuch/Komplettbonus, Zeitbonus und mögliche Serienboni.
- Einzelresultate enthalten Versuche, Hinweise, Dauer, Modus, Schwierigkeit und Punkte.
- Die Bridge ist niemals Voraussetzung für das lokale Spielen.
- Keine geheimen Schlüssel, Tokens oder Datenbankzugänge gehören in das Spielmodul.
- Nicht bildlich freigegebene Fälle werden durch `image-approvals.js` nicht spielbar gemacht.

## Versionsregel

`module.json`, `engine.js` und `futura-adapter.js` müssen dieselbe Spielversion führen. Die automatische Architektur-QA prüft diese Konsistenz.