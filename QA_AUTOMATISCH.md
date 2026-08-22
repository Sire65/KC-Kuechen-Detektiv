# KC Küchen-Detektiv – automatischer QA-Test

Der Test `npm test` prüft bei jeder Änderung automatisch:

- exakt 23 Fälle (`KD-001` bis `KD-023`)
- eindeutige und lückenlose IDs
- gültige Spielmodi und Schwierigkeitsgrade
- Antwortlogik und gültigen `correct`-Index
- mindestens zwei Hinweise je Fall
- gültige Lösungsmarker innerhalb 0–100 %
- exakt 6 / 8 / 10 Unterschiede in KD-021 / KD-022 / KD-023
- gültige Hotspot-Koordinaten für beide Vergleichsbilder
- dass jedes freigegebene Asset wirklich existiert
- dass freigegebene Bilddateien technisch RIFF/WEBP sind
- dass Einzelbilder und Fehlerbild-Paare in der richtigen Freigabeliste stehen

Die GitHub Action `.github/workflows/validate-game.yml` führt diesen Test bei jedem Push auf `main` und bei Pull Requests aus. Dadurch kann eine fehlerhafte Fall- oder Bildfreigabe nicht unbemerkt in die nächste Version gelangen.
