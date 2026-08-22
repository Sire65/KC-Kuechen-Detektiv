# KC Küchen-Detektiv – Ergebnisvertrag für KC FUTURA

Dieser Vertrag definiert die Übergabe eines abgeschlossenen Spiels an die spätere **KC FUTURA Spielewelt**. Die Schnittstelle bleibt bewusst stabil, damit der Küchen-Detektiv eigenständig entwickelt und später ohne Umbau eingebettet werden kann.

## Bridge

Die Host-Anwendung stellt optional `window.KCFuturaGameBridge` bereit. Das Spiel muss auch ohne Bridge vollständig lauffähig bleiben.

Vorgesehener Aufruf:

```js
window.KCFuturaGameBridge?.submitGameResult?.(result)
```

## Ergebnisobjekt

```js
{
  schemaVersion: '1.0',
  gameId: 'kc-kitchen-detective',
  gameVersion: '0.3.x',
  player: {
    id: null,
    displayName: null
  },
  session: {
    startedAt: 'ISO-8601',
    finishedAt: 'ISO-8601',
    durationSeconds: 0,
    selectedMode: 'all|thief|wrong_place|missing|liar|logic|combo|spot_difference',
    selectedDifficulty: 'all|easy|medium|hard|master',
    order: 'normal|random'
  },
  result: {
    score: 0,
    bestScore: 0,
    rank: 'Küchendetektiv|Spürnase|Kücheninspektor|Meisterdetektiv',
    completedCases: 0,
    totalCasesInSession: 0,
    hintsUsed: 0,
    wrongAttempts: 0,
    perfectCases: 0
  },
  cases: [
    {
      id: 'KD-001',
      mode: 'thief',
      difficulty: 'easy',
      earned: 0,
      attempts: 1,
      hints: 0,
      durationSeconds: 0
    }
  ],
  achievements: []
}
```

## Spielerübernahme

Falls FUTURA einen angemeldeten Spieler bereitstellt, kann der Host vor Spielstart setzen:

```js
window.KCFuturaGameContext = {
  playerId: '...',
  displayName: '...'
}
```

Ohne diesen Kontext bleibt `player.id` leer; das Standalone-Spiel verwendet keine erfundene Benutzer-ID.

## Regeln

- Punkte werden nur einmal pro abgeschlossener Sitzung an FUTURA übergeben.
- Einzelne Fallresultate bleiben Bestandteil des Ergebnisobjekts, damit spätere Statistiken möglich sind.
- Hinweise, Fehlversuche und Schwierigkeitsgrad werden mit übertragen.
- Die Bridge darf niemals Voraussetzung für das lokale Spielen sein.
- Bei nicht verfügbarer Bridge wird das Ergebnis weiterhin lokal gespeichert.
- Keine geheimen Schlüssel, Tokens oder Datenbankzugänge gehören in das Spielmodul.

## Geplante Erfolge

- `first_case` – erster Fall gelöst
- `five_clean` – fünf Fälle ohne Hinweis gelöst
- `no_mistakes` – Sitzung ohne Fehlversuch
- `spot_6` – KD-021 vollständig gelöst
- `spot_8` – KD-022 vollständig gelöst
- `spot_10` – KD-023 vollständig gelöst
- `master_detective` – Meisterdetektiv-Rang erreicht

Damit können Küchen-Detektiv, Kreuzworträtsel und spätere Spiele denselben Ergebnisstandard der KC FUTURA Spielewelt verwenden.
