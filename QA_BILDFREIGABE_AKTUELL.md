# KC Küchen-Detektiv – aktuelle Bildfreigabe

Stand: 22.08.2026

## Technisch eingebaut und im Spiel freigeschaltet

- KD-001: `assets/kd-001.webp` ist im Repository vorhanden und über `image-approvals.js` freigeschaltet. Vor der finalen Version bleibt noch eine letzte Plausibilitäts-/Schwierigkeitskontrolle vorgesehen.

## Visuell brauchbarer Kandidat, aber noch nicht technisch eingebaut

- KD-002: Rührlöffelstiel ist sichtbar, ohne das Motiv zu dominieren. Der Fall bleibt bis zum tatsächlichen Asset-Upload technisch gesperrt.

## Nicht freigegeben / Nacharbeit erforderlich

- KD-003: Sahnerest in der bisherigen Variante ist zu deutlich und verrät die Lösung zu schnell.
- KD-004: entscheidende Messer-Spiegelung ist nicht zuverlässig genug vorhanden.
- KD-005: bisherige Motive passen nicht sauber zur vorgesehenen Schokoladenspur an den Fingern.
- KD-006: Schlüsselkontur in der Hosentasche fehlt; komplette Neuproduktion erforderlich.
- KD-007: Verpackungsrest am Schuh ist nicht eindeutig und fair genug umgesetzt.
- KD-008: Gewürzspur am Ärmel ist zu plakativ; subtilere Variante erforderlich.
- KD-009 bis KD-020: Falldefinitionen stehen in `scenes.js`; finale, exakt passende Einzelbilder sind noch nicht abgenommen/eingebaut.
- KD-021 bis KD-023: Fehlerbild-Paare sind noch nicht final produziert. Sie müssen aus je einem Masterbild entstehen und exakt 6 / 8 / 10 beabsichtigte Unterschiede enthalten.

## Verbindliche Regeln

- Kein Poster, Quiz-Karten-Layout oder Übersichtsblatt wird als Spielbild verwendet.
- Jeder Fall muss exakt zur Definition in `scenes.js` passen.
- Ein Bild wird erst nach Sichtprüfung freigeschaltet.
- Leicht: ca. 5–15 s Suchzeit.
- Mittel: ca. 15–35 s Suchzeit.
- Schwer: ca. 30–60 s, indirekter Hinweis oder Kombination.
- Meister: mehrere Indizien nötig; kein einzelnes Detail darf die Lösung sofort verraten.
- Hotspots werden erst auf dem endgültig freigegebenen Bild festgelegt.
- `image-approvals.js` ist die technische Freigabeschranke; Dokumentation allein schaltet keinen Fall frei.

## Nächster Abschlussblock

1. KD-002 als echtes WebP-Asset einbauen und erst dann freischalten.
2. KD-003 bis KD-020 als reine Szenenbilder ohne UI neu/final erstellen und einzeln abnehmen.
3. KD-021 bis KD-023 als kontrollierte Masterbild-Paare mit exakt 6 / 8 / 10 Unterschieden erstellen.
4. Hotspots auf den endgültigen Bildern feinjustieren.
5. `npm test`, Handy-/Tablet-/Desktop-Test und kompletter Regressionstest durchführen.
6. Danach Version 1.0 freigeben.
