# KC Küchen-Detektiv

Eigenständiges, modular erweiterbares Beobachtungs-, Logik- und Fehlersuchspiel für die spätere Integration in **KC FUTURA – Spielewelt**.

## Aktueller Stand

- 23 Fälle vorbereitet (`KD-001` bis `KD-023`)
- 7 Spielmodi: Dieb, falscher Ort, fehlt/verlegt, Lügner, Logik, Kombifall, Finde-die-Fehler
- 4 Schwierigkeitsstufen
- transparentes Punktesystem
- zwei Hinweisstufen mit definierten Punktabzügen
- Serienbonus und Zeitbonus
- responsive Oberfläche für Handy, Tablet und Desktop
- Auflösung mit Hinweis-Markierung
- datengetriebene Szenen, daher beliebig erweiterbar
- Bild-Freigabeschranke: nur abgenommene Szenen werden im Spiel angeboten
- automatischer QA-Test für Falldefinitionen, Hotspots und freigegebene WebP-Assets
- vorbereiteter Ergebnisvertrag für die spätere KC-FUTURA-Spielewelt

## Bildstil und Asset-Freigabe

Alle Szenen sollen nahezu fotorealistisch wirken: professionelle Restaurant- oder Großküche, natürliche erwachsene Personen, realistische Arbeitskleidung und Geräte, glaubwürdiges Licht, keine Comic-/Kinderoptik. Der entscheidende Hinweis muss klein, aber bei genauer Beobachtung fair erkennbar sein.

Einzelbilder werden unter `assets/kd-001.webp` bis `assets/kd-020.webp` erwartet. Die drei Fehlerbild-Fälle verwenden jeweils ein linkes und rechtes Bild: `kd-021-left/right.webp`, `kd-022-left/right.webp` und `kd-023-left/right.webp`.

Wichtig: Ein vorhandenes Bild gilt nicht automatisch als spielbereit. `image-approvals.js` schaltet nur visuell und logisch abgenommene Fälle frei. Poster, Übersichtsblätter oder Motive, die von `scenes.js` abweichen, werden nicht als Spielasset verwendet.

## Punktesystem

Grundwerte: Leicht 100, Mittel 150, Schwer 220, Meisterfall 300. Dazu kommen +40 für den ersten bzw. +15 für den zweiten richtigen Versuch, bis +30 Zeitbonus und +50 nach fünf richtigen Fällen in Serie. Pro Fehlversuch werden 20 Punkte abgezogen. Hinweis 1 kostet 25 Punkte, Hinweis 2 zusätzlich 40 Punkte. Bei den Fehlerbild-Fällen kommt ein Komplettbonus von +35 / +50 / +70 für 6 / 8 / 10 Unterschiede hinzu. Die komplette Rechnung wird nach jedem gelösten Fall angezeigt.

## Qualitätssicherung

`npm test` prüft automatisch unter anderem:

- exakt 23 lückenlose Fall-IDs
- gültige Modi und Schwierigkeitsgrade
- Antwortlogik und Lösungsindizes
- Hinweis- und Hotspot-Grenzen
- exakt 6 / 8 / 10 Unterschiede in `KD-021` / `KD-022` / `KD-023`
- Existenz und RIFF/WEBP-Format freigegebener Bilddateien
- korrekte Zuordnung von Einzel- und Fehlerbild-Assets

Die GitHub Action `.github/workflows/validate-game.yml` führt diese Prüfung bei Änderungen auf `main` und bei Pull Requests aus.

## FUTURA-Migration

Dieses Repository bleibt eigenständig. Für die spätere Integration kann das Spiel direkt eingebettet oder in `academy/games/kitchen-detective/` übernommen werden. Die vorgesehene Schnittstelle heißt `window.KCFuturaGameBridge`. Der verbindliche Payload für Spieler-ID, Punkte, Rang, Dauer, Erfolge und Fallstatistik ist in `FUTURA_RESULT_CONTRACT.md` dokumentiert.

## Fertigstellungskriterien Version 1.0

Version 1.0 gilt erst als fertig, wenn alle vorgesehenen finalen Szenenbilder abgenommen und eingebaut sind, die Hotspots auf den endgültigen Bildern geprüft wurden, die drei Fehlerbild-Paare exakt stimmen, Handy/Tablet/Desktop getestet sind und der komplette Regressionstest ohne Fehler durchläuft.
