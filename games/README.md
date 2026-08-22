# KC FUTURA – Spielewelt-Module

Dieser Ordner enthält eigenständige Spiele, die später in die KC FUTURA Spielewelt übernommen oder direkt eingebettet werden können.

## Gemeinsame Regeln

Jedes Spiel erhält eine eindeutige `gameId`, einen eigenen Einstiegspunkt und eine transparente Punktewertung. Spielstände und Ergebnisse sollen später nicht an eine lokale Person gebunden werden, sondern über die FUTURA-Schnittstelle dem angemeldeten Spieler zugeordnet werden.

Vorgesehene Brücke: `window.KCFuturaGameBridge`.

Ein Spiel kann nach Abschluss beispielsweise `submitResult({...})` aufrufen. Vorgesehene gemeinsame Daten sind: `gameId`, Spieler-ID aus FUTURA, Punkte, Schwierigkeitsgrad, Abschlussstatus, benötigte Zeit, Hinweise/Fehler und freigeschaltete Erfolge.

Die Spiele müssen weiterhin alleine lauffähig bleiben. Fehlt die FUTURA-Brücke, darf das Spiel nicht abstürzen.

## Aktuelle Spiele

1. **Küchen-Detektiv** – Beobachtung, Logik, Fehlerbilder.
2. **Küchen-Kreuzworträtsel** – Lebensmittel, Utensilien und Fachbegriffe.

Neue Spiele werden in `games/manifest.json` registriert und nach demselben Muster ergänzt.
