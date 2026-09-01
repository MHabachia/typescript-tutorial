# Beitragen

Danke, dass du diesen Kurs verbessern möchtest! Ob Tippfehler, ein besseres
Beispiel oder ein ganzes Kapitel – jeder Beitrag ist willkommen.

## Wie du beitragen kannst

- **Fehler melden:** Öffne ein Issue mit einer klaren Beschreibung – am besten
  mit Modul und Abschnitt (z. B. "Modul 3.4, Code-Beispiel läuft nicht") und,
  wenn es um Code geht, mit der Fehlermeldung.
- **Verbesserungen vorschlagen:** Eine unklare Erklärung, eine bessere
  Metapher, ein fehlender Stolperstein? Öffne ein Issue oder direkt einen
  Pull Request.
- **Neue Beispiele ergänzen:** Gerne – solange sie zum Aufbau des jeweiligen
  Moduls passen und dem Muster unten folgen.

## Stil-Richtlinien

**Sprache**

- Erklärungen, Kommentare und Bezeichner sind auf Deutsch – das ist in diesem
  Kurs Absicht, damit Sprache und Fachbegriffe nicht ständig wechseln.
- In Markdown-Dateien werden Umlaute normal geschrieben.
- In `.ts`-Dateien werden **keine Umlaute** verwendet, auch nicht in
  Kommentaren: stattdessen `ue`, `oe`, `ae`, `ss`.

**Code**

- Einrückung: 2 Leerzeichen, keine Tabs.
- Benennung: `PascalCase` für Typen, Interfaces und Klassen, `camelCase` für
  Funktionen und Variablen, `UPPER_SNAKE_CASE` für Konstanten.
- `const` ist die Standardwahl, `let` nur bei echter Neuzuweisung, `var` nie.
- Kein `any`, außer als bewusstes Anti-Pattern – und dann mit einem Kommentar,
  warum es dort steht.

**Aufbau einer Beispieldatei**

Jede Datei unter `beispiele/` folgt demselben Muster:

1. `/** ... */`-Kopfkommentar mit Modulnummer und Erklärung des Konzepts
2. `// ANTI-PATTERN: ...` – wie man es falsch macht, mit `console.log`-Ausgabe
3. `// BEST PRACTICE: ...` – die saubere Lösung, mit `console.log`-Ausgabe
4. `// PROFI-TIPP` als Kommentarblock am Dateiende

Jede Datei muss einzeln über `ts-node` lauffähig sein, von selbst terminieren
und ihre Ausgaben mit `[Anti-Pattern]` bzw. `[Best Practice]` präfixen.

**Aufbau eines Kapitels**

Jedes `modul-*/README.md` folgt derselben Gliederung: `🎯 Lernziele`,
`Inhalt` (mit Sprungmarken und Dateitabelle), pro Abschnitt `### Theorie`,
`### Code-Beispiele`, `### ⚠️ Häufiger Fehler` und `### 🎯 Übungsaufgabe`
(Lösung in `<details>`), am Ende `📋 Zusammenfassung & Cheat-Sheet` und die
Navigationszeile.

## Checkliste vor dem Pull Request

- [ ] `npm run typecheck` läuft ohne Fehler durch
- [ ] `npm run lint` meldet keine Fehler (Warnungen aus Anti-Pattern-Blöcken sind in Ordnung)
- [ ] Jede geänderte Beispieldatei wurde per `ts-node` ausgeführt und terminiert sauber
- [ ] Kommentare begründen die Entscheidung, statt den Code nur zu wiederholen
- [ ] Keine IDE-eigenen Dateien im Commit (Ausnahme: `.idea/runConfigurations/`)
- [ ] Bei neuen Themen: `README.md` und `GLOSSAR.md` ergänzt

## Fragen?

Öffne einfach ein Issue. Auch "Ich verstehe Abschnitt X nicht" ist ein
wertvoller Beitrag – wenn eine Erklärung nicht ankommt, ist meistens die
Erklärung das Problem, nicht der Leser.
