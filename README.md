# KC Küchen-Detektiv

Eigenständiges, modular erweiterbares Beobachtungs-, Logik- und Fehlersuchspiel für die spätere Integration in **KC FUTURA – Spielewelt**.

## Aktueller Stand

- 20 Fälle vorbereitet
- 6 Spielmodi: Dieb, falscher Ort, fehlt/verlegt, Lügner, Logik, Kombifall
- 4 Schwierigkeitsstufen
- transparentes Punktesystem
- zwei Hinweisstufen mit definierten Punktabzügen
- Serienbonus und Zeitbonus
- responsive Oberfläche für Handy, Tablet und Desktop
- Auflösung mit Hinweis-Markierung
- datengetriebene Szenen, daher beliebig erweiterbar

## Bildstil

Alle Szenen sollen nahezu fotorealistisch wirken: professionelle Restaurant- oder Großküche, natürliche erwachsene Personen, realistische Arbeitskleidung und Geräte, glaubwürdiges Licht, keine Comic-/Kinderoptik. Der entscheidende Hinweis muss klein, aber bei genauer Beobachtung fair erkennbar sein.

Die Bilddateien werden unter `assets/kd-001.webp` bis `assets/kd-020.webp` erwartet. Bis die finalen Bilder ergänzt sind, ist die Spiellogik unabhängig davon weiterentwickelbar.

## Punktesystem

Grundwerte: Leicht 100, Mittel 150, Schwer 220, Meisterfall 300. Dazu kommen +40 für den ersten bzw. +15 für den zweiten richtigen Versuch, bis +30 Zeitbonus und +50 nach fünf richtigen Fällen in Serie. Pro Fehlversuch werden 20 Punkte abgezogen. Hinweis 1 kostet 25 Punkte, Hinweis 2 zusätzlich 40 Punkte. Die komplette Rechnung wird nach jedem gelösten Fall angezeigt.

## FUTURA-Migration

Dieses Repository bleibt eigenständig. Für die spätere Integration kann das Spiel direkt eingebettet oder in `academy/games/kitchen-detective/` übernommen werden. Die vorgesehene spätere Schnittstelle zu FUTURA heißt `window.KCFuturaGameBridge` und kann Benutzer-ID, Gesamtpunkte, Erfolge, Level und Statistik übergeben.
