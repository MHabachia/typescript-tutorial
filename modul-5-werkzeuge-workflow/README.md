# Modul 5: Werkzeuge & Workflow (Praxis)

Bis hierher ging es um die Sprache. Jetzt geht es um die Werkstatt drumherum:
die `tsconfig.json`, den Compiler, den Linter, IntelliJ IDEA und die
npm-Skripte, mit denen du das alles startest.

## 🎯 Lernziele

Nach diesem Modul kannst du:

- die `tsconfig.json` dieses Projekts Zeile für Zeile lesen und erklären
- benennen, was `strict: true` konkret einschaltet – und welche Bugs die acht
  Zusatzoptionen dieses Repos zusätzlich abfangen
- `tsc` und `ts-node` unterscheiden und weißt, welches Werkzeug wann dran ist
- ESLint mit Flat Config für TypeScript einrichten und Compiler-Fehler von
  Lint-Befunden unterscheiden
- IntelliJ IDEA so einrichten, dass Typprüfung, ESLint und Run-Buttons sofort
  funktionieren
- npm-Skripte als deinen täglichen Arbeitsablauf nutzen und eigene ergänzen

## Inhalt

- [5.1 Die `tsconfig.json` verstehen](#51-die-tsconfigjson-verstehen)
- [5.2 Der Strict-Mode im Detail](#52-der-strict-mode-im-detail)
- [5.3 `tsc` und `ts-node`](#53-tsc-und-ts-node)
- [5.4 ESLint für TypeScript](#54-eslint-für-typescript)
- [5.5 IntelliJ IDEA einrichten](#55-intellij-idea-einrichten)
- [5.6 npm-Skripte als Workflow](#56-npm-skripte-als-workflow)
- [📋 Zusammenfassung & Cheat-Sheet](#-zusammenfassung--cheat-sheet)

**Lauffähige Beispiele:** [`beispiele/`](./beispiele/)

| Datei | Thema |
|---|---|
| [`01-strict-mode-in-aktion.ts`](./beispiele/01-strict-mode-in-aktion.ts) | Welcher Bug ohne welche Strict-Option durchrutscht |
| [`02-haeufige-lint-fehler.ts`](./beispiele/02-haeufige-lint-fehler.ts) | Typische ESLint-Befunde und ihre saubere Lösung |

---

## 5.1 Die `tsconfig.json` verstehen

### Theorie

Die `tsconfig.json` ist der Bauplan deines Projekts. Sie beantwortet dem
Compiler zwei Fragen: **Welche Dateien gehören dazu?** und **Nach welchen
Regeln übersetze ich sie?**

Zwei Ebenen musst du auseinanderhalten:

- **Außen** stehen `include`, `exclude` und `files` – sie bestimmen den
  *Dateiumfang*.
- **Innen**, in `compilerOptions`, steht alles andere – die *Regeln*.

Ein wichtiges Detail vorweg: Sobald du `tsc` **ohne** Dateinamen aufrufst,
sucht TypeScript die `tsconfig.json` und benutzt sie. Schreibst du dagegen
`tsc datei.ts`, gilt die Konfigurationsdatei **nicht** – jahrelang wurde sie
dabei stillschweigend ignoriert, seit TypeScript 6 bricht der Compiler
stattdessen ab:

```text
error TS5112: tsconfig.json is present but will not be loaded if files are
specified on commandline. Use '--ignoreConfig' to skip this error.
```

Das ist eine gute Änderung: Der häufigste "aber bei mir funktioniert es"-Moment
entstand genau dadurch, dass jemand eine einzelne Datei ohne `strict` prüfte.

Gehen wir die echte Konfiguration dieses Repos in Gruppen durch.

**Gruppe 1 – Sprachversion und Module.** Sie legt fest, welches JavaScript
hinten herauskommt und wie Importe aufgelöst werden.

- `target: "ES2022"` – welche JavaScript-Version erzeugt wird. Alles, was
  Node.js 18+ kann, darf drinbleiben; `async/await` etwa muss nicht mehr
  umgeschrieben werden.
- `lib: ["ES2022"]` – welche eingebauten Typen der Compiler kennt. Hier steht
  bewusst **kein** `"DOM"`, denn das hier ist ein Node-Projekt: `document` und
  `window` gibt es nicht, und der Compiler soll das auch wissen.
- `module: "CommonJS"` – das Modulformat der Ausgabe (`require`/
  `module.exports`). Das ist der Standard für Node ohne `"type": "module"`.
- `moduleResolution: "Node"` – wie Importpfade zu Dateien werden.
- `ignoreDeprecations: "6.0"` – `moduleResolution: "Node"` gilt ab TypeScript 6
  als veraltet. Diese Zeile unterdrückt nur die Warnung darüber; die Auflösung
  funktioniert unverändert.
- `esModuleInterop: true` – lässt dich `import express from "express"` schreiben,
  auch wenn das Paket im alten CommonJS-Stil geschrieben ist.
- `forceConsistentCasingInFileNames: true` – Groß- und Kleinschreibung in
  Importpfaden muss stimmen. Rettet dich davor, dass dein Code unter Windows
  läuft und auf dem Linux-Server nicht.
- `resolveJsonModule: true` – du darfst `.json`-Dateien direkt importieren.
- **`moduleDetection: "force"`** – jede Datei wird als eigenes Modul behandelt,
  auch ohne `import` oder `export`. Warum dieses Repo das *braucht*: Ohne die
  Option gelten Dateien ohne Import/Export als Skripte und teilen sich **einen
  globalen Namensraum**. Ein `const name` in Modul 1 und ein `const name` in
  Modul 3 wären dann derselbe Name – der Compiler meldete "Cannot redeclare
  block-scoped variable". In einem Kurs mit über 30 Beispieldateien, die alle
  dieselben naheliegenden Variablennamen benutzen, ist das unhaltbar.
- `types: ["node"]` – welche globalen Typpakete geladen werden. Ohne diesen
  Eintrag *rät* TypeScript und lädt alles aus `node_modules/@types`. Mit ihm
  ist garantiert, dass `console`, `process`, `Buffer` und `require` bekannt
  sind – und sonst nichts.

**Gruppe 2 – Ordner.**

- `rootDir: "."` – wo der Quellcode beginnt.
- `outDir: "./dist"` – wohin das kompilierte JavaScript geschrieben wird.
  Die Ordnerstruktur unterhalb von `rootDir` wird dabei gespiegelt:
  `modul-5-.../beispiele/01-....ts` wird zu `dist/modul-5-.../beispiele/01-....js`.

**Gruppe 3 – Strenge.** `strict: true` plus acht Zusatzoptionen. Die bekommen
einen eigenen Abschnitt ([5.2](#52-der-strict-mode-im-detail)).

**Gruppe 4 – Sonstiges.**

- `experimentalDecorators: true` – für die Decorators in Modul 7.
- `declaration: false` – wir bauen keine Bibliothek, also brauchen wir keine
  `.d.ts`-Dateien.
- `sourceMap: true` – erzeugt Landkarten von JavaScript zurück zu TypeScript.
  Genau die braucht der Debugger in IntelliJ, um im **TypeScript** anzuhalten
  statt im kompilierten JavaScript.
- `skipLibCheck: true` – die Typdateien fremder Pakete werden nicht geprüft.
  Spart viel Zeit und erspart dir Fehler, die du ohnehin nicht beheben kannst.
- `isolatedModules: true` – jede Datei muss für sich allein übersetzbar sein.

**Außen herum:**

- `include: ["modul-*/**/*.ts"]` – alle `.ts`-Dateien in allen Modulordnern.
- `exclude: ["node_modules", "dist"]` – fremder Code und eigener Build-Output
  bleiben draußen. `exclude` filtert dabei nur, was `include` eingesammelt hat –
  eine Datei, die per `import` erreichbar ist, wird trotzdem mitgeprüft.

### Code-Beispiele

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "CommonJS",
    "moduleResolution": "Node",
    "ignoreDeprecations": "6.0",
    "esModuleInterop": true,
    "moduleDetection": "force",
    "types": ["node"],

    "rootDir": ".",
    "outDir": "./dist"
  },
  "include": ["modul-*/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

```json
// Was "moduleDetection": "force" verhindert - ohne die Option waeren diese
// beiden Dateien EIN gemeinsamer globaler Namensraum:
//
//   modul-1-fundamente/beispiele/01-variablen-und-typen.ts
//     const name = "Ada";
//
//   modul-3-fortgeschritten/beispiele/01-union-und-intersection.ts
//     const name = "Grace";
//
//   Fehler TS2451: Cannot redeclare block-scoped variable 'name'.
```

```bash
# Zeigt die komplette Konfiguration inklusive aller Standardwerte, die du
# gar nicht hingeschrieben hast. Das beste Werkzeug, wenn du wissen willst,
# was wirklich gilt:
npx tsc --showConfig

# Zeigt, welche Dateien "include"/"exclude" tatsaechlich eingesammelt haben:
npx tsc --listFiles --noEmit
```

### ⚠️ Häufiger Fehler

Der häufigste Konfigurationsfehler ist, `include` und `outDir` gegeneinander
arbeiten zu lassen: `include: ["**/*.ts"]` sammelt beim zweiten Build auch die
Dateien in `dist/` wieder ein. Deshalb steht `dist` immer in `exclude`.

Der zweitteuerste Fehler passiert auf der Kommandozeile: `tsc datei.ts`
arbeitet **ohne** deine `tsconfig.json` – ohne `strict`, ohne `types`, ohne
alles. TypeScript 6 warnt dich davor mit `TS5112`, und die naheliegende
Reaktion ist genau die falsche: `--ignoreConfig` anzuhängen, damit "der Fehler
weggeht". Willst du nur eine einzelne Datei prüfen, nimm stattdessen
`tsc --noEmit` für das ganze Projekt; das ist bei dieser Projektgröße ohnehin
schneller, als du "Kommandozeile" tippen kannst.

### 🎯 Übungsaufgabe

Öffne die `tsconfig.json` dieses Repos und beantworte drei Fragen, ohne zu
raten – nutze `npx tsc --showConfig`:

1. Landet das kompilierte JavaScript in `dist/beispiele/` oder in
   `dist/modul-5-werkzeuge-workflow/beispiele/`? Warum?
2. Was passiert, wenn du `"lib": ["ES2022"]` um `"DOM"` ergänzt?
3. Warum steht in `types` nur `"node"` und nicht auch `"eslint"`?

<details>
<summary>💡 Lösung anzeigen</summary>

1. In `dist/modul-5-werkzeuge-workflow/beispiele/`. `outDir` spiegelt die
   Struktur **unterhalb von `rootDir`**, und `rootDir` ist hier `"."` – also
   der Projektwurzelordner. Stünde dort `rootDir: "./modul-5-werkzeuge-workflow"`,
   fiele der Modulordner in der Ausgabe weg.

2. Der Compiler würde `document`, `window`, `alert` und den ganzen Rest der
   Browser-API als bekannt annehmen. In einem Node-Projekt ist das schädlich:
   `document.querySelector(...)` würde sauber kompilieren und beim Start
   sofort mit `ReferenceError: document is not defined` abstürzen. Der
   Compiler soll dir genau das ersparen.

3. `types` listet nur Pakete mit **globalen** Typen – also solche, die
   Bezeichner bereitstellen, die du ohne Import benutzt (`process`, `console`,
   `Buffer`). ESLint wird ganz normal importiert bzw. gar nicht im Quellcode
   verwendet und braucht deshalb keinen Eintrag.

```bash
# So prüfst du Punkt 1 in 5 Sekunden, ohne die halbe Konfiguration zu lesen:
npx tsc --showConfig | grep -E '"(rootDir|outDir)"'
```

</details>

---

## 5.2 Der Strict-Mode im Detail

### Theorie

`strict: true` ist kein einzelner Schalter, sondern ein Sammelschalter. Er
aktiviert acht Einzeloptionen auf einmal:

| Option | Fängt ab |
|---|---|
| `noImplicitAny` | Parameter und Variablen ohne erkennbaren Typ |
| `strictNullChecks` | Zugriffe auf möglicherweise `null`/`undefined` |
| `strictFunctionTypes` | Callbacks mit zu engen Parametertypen |
| `strictBindCallApply` | falsche Argumente bei `call`, `apply`, `bind` |
| `strictPropertyInitialization` | Klassenfelder, die nie gesetzt werden |
| `noImplicitThis` | `this` in einem Kontext, in dem es unbekannt ist |
| `alwaysStrict` | fehlendes `"use strict"` in der Ausgabe |
| `useUnknownInCatchVariables` | `catch (e)` als `any` behandeln |

Ein paar davon in Kurzform, mit der echten Fehlermeldung:

```typescript
// strictPropertyInitialization
// class Benutzer { name: string; }
// Fehler TS2564: Property 'name' has no initializer and is not definitely
// assigned in the constructor.

// strictFunctionTypes: ein Callback, der weniger kann als versprochen
// function verarbeite(cb: (wert: string | number) => void): void { cb("x"); }
// const nurString = (wert: string): void => { console.log(wert); };
// verarbeite(nurString);
// Fehler TS2345: Argument of type '(wert: string) => void' is not assignable
// to parameter of type '(wert: string | number) => void'.

// strictBindCallApply
// function addiere(a: number, b: number): number { return a + b; }
// addiere.call(null, 1, "zwei");
// Fehler TS2345: Argument of type 'string' is not assignable to parameter of
// type 'number'.
```

Dieses Repo geht darüber hinaus. Acht weitere Optionen sind einzeln gesetzt –
und genau die sind es, die den Unterschied zwischen "kompiliert" und
"funktioniert" ausmachen.

**`noUnusedLocals` / `noUnusedParameters`** – meldet jede Variable und jeden
Parameter, den niemand liest. Ohne sie sammeln sich Reste vom Umbauen an, und
irgendwann traut sich keiner mehr, etwas zu löschen.

```typescript
// function melde(nachricht: string, unbenutzt: number): string {
//   const nichtGenutzt = 42;
//   return nachricht;
// }
// Fehler TS6133: 'unbenutzt' is declared but its value is never read.
// Fehler TS6133: 'nichtGenutzt' is declared but its value is never read.
//
// Ausweg fuer Parameter, die du behalten MUSST: Unterstrich davor.
function melde(_zeitstempel: number, nachricht: string): string {
  return nachricht;
}
```

**`noImplicitReturns`** – jeder Pfad einer Funktion muss etwas zurückgeben.
Ohne die Option liefert der vergessene `else`-Zweig still `undefined`.

```typescript
// function bewerte(punkte: number): string {
//   if (punkte >= 50) { return "bestanden"; }
// }
// Fehler TS2366: Function lacks ending return statement and return type does
// not include 'undefined'.
```

**`noFallthroughCasesInSwitch`** – das vergessene `break`. Ohne die Option
läuft der nächste `case` einfach mit, und der Preis ist plötzlich 20 statt 10.

```typescript
// switch (stufe) {
//   case "klein":
//     preis = 10;
//   case "gross":
//     preis = 20;
// }
// Fehler TS7029: Fallthrough case in switch.
```

**`noUncheckedIndexedAccess`** – vermutlich die wertvollste Option überhaupt.
Sie sagt die Wahrheit: Ein Zugriff per Index liefert `T | undefined`, denn
niemand garantiert, dass an Position 0 etwas liegt.

```typescript
// const warteschlange: string[] = [];
// const erster: string = warteschlange[0];
// Fehler TS2322: Type 'string | undefined' is not assignable to type 'string'.
//   Type 'undefined' is not assignable to type 'string'.
//
// Richtig: den Fall behandeln.
const warteschlange: string[] = [];
const erster = warteschlange[0] ?? "(leer)";
```

**`exactOptionalPropertyTypes`** – unterscheidet "Eigenschaft fehlt" von
"Eigenschaft ist `undefined`". Für `JSON.stringify`, `Object.keys` und jede
Datenbank ist das ein himmelweiter Unterschied.

```typescript
// interface Profil { name: string; spitzname?: string; }
// const p: Profil = { name: "Ada", spitzname: undefined };
// Fehler TS2375: Type '{ name: string; spitzname: undefined; }' is not
// assignable to type 'Profil' with 'exactOptionalPropertyTypes: true'.
// Consider adding 'undefined' to the types of the target's properties.
```

**`noImplicitOverride`** – wer eine Methode der Basisklasse überschreibt, muss
`override` hinschreiben. Der Gewinn kommt später: Wird die Methode in der
Basisklasse umbenannt, meldet der Compiler sofort, dass hier nichts mehr
überschrieben wird – statt still eine tote Methode stehen zu lassen.

```typescript
// class Kreditkarte extends Zahlungsart {
//   gebuehr(betrag: number): number { return betrag * 0.03; }
// }
// Fehler TS4114: This member must have an 'override' modifier because it
// overrides a member in the base class 'Zahlungsart'.
```

**`noPropertyAccessFromIndexSignature`** – bei Objekten mit Index-Signatur ist
der Punktzugriff verboten. Er sieht aus wie eine bekannte Eigenschaft, ist aber
nur geraten; die eckige Klammer macht das Raten sichtbar.

```typescript
// interface Konfiguration { [schluessel: string]: string | undefined; }
// const konfig: Konfiguration = { PORT: "3000" };
// console.log(konfig.PORT);
// Fehler TS4111: Property 'PORT' comes from an index signature, so it must be
// accessed with ['PORT'].
```

### Code-Beispiele

Alle acht Optionen mit lauffähigem Gegenbeispiel findest du in
[`beispiele/01-strict-mode-in-aktion.ts`](./beispiele/01-strict-mode-in-aktion.ts).
Ein Auszug – das Muster ist überall gleich: erst der Bug, der ohne die Option
durchrutscht, dann die korrekte Lösung.

```typescript
// ANTI-PATTERN: der Zugriff per Index wird blind als string behandelt.
const warteschlange: string[] = [];
const ersterFalsch = warteschlange[0] as string;
console.log("[Anti-Pattern] erster Auftrag:", ersterFalsch); // undefined

// BEST PRACTICE: der Typ ist "string | undefined" - also den Fall behandeln.
const ersterSicher = warteschlange[0];
console.log(
  "[Best Practice] erster Auftrag:",
  ersterSicher ?? "(Warteschlange ist leer)"
);
```

```bash
# Beispiel starten und den Unterschied Zeile fuer Zeile sehen:
npx ts-node modul-5-werkzeuge-workflow/beispiele/01-strict-mode-in-aktion.ts
```

### ⚠️ Häufiger Fehler

Der typische Umgang mit einem Strict-Fehler ist der Ausrufezeichen-Reflex:

```typescript
const gefundenerName: string | null = null;
console.log(gefundenerName!.toUpperCase()); // "vertrau mir, das ist nicht null"
```

Das `!` (Non-Null-Assertion) macht den roten Strich weg – und den Absturz
nicht. Zur Laufzeit steht dann `Cannot read properties of null` in der
Konsole. Dasselbe gilt für `as any` und `// @ts-ignore`: Sie löschen nicht den
Fehler, sondern nur die Warnung davor.

Nimm `!` nur dort, wo du eine Garantie hast, die der Compiler nicht sehen kann
(z. B. direkt nach einer eigenen Prüffunktion) – und schreib dazu, welche.

### 🎯 Übungsaufgabe

Die folgende Funktion kompiliert unter `strict: true` **nicht**. Finde alle
drei Verstöße, benenne die zuständige Option und schreibe die Funktion so um,
dass sie unter der vollen Strenge dieses Repos durchgeht:

```typescript
interface Bestellung {
  positionen: string[];
  kommentar?: string;
}

function ersteBeschreibung(bestellung: Bestellung, sprache) {
  const erste: string = bestellung.positionen[0];
  if (erste.length > 0) {
    return erste.toUpperCase();
  }
}
```

<details>
<summary>💡 Lösung anzeigen</summary>

Die drei Verstöße:

1. `sprache` hat keinen Typ → `noImplicitAny`
   (*TS7006: Parameter 'sprache' implicitly has an 'any' type.*)
2. `bestellung.positionen[0]` ist `string | undefined` →
   `noUncheckedIndexedAccess`
   (*TS2322: Type 'string | undefined' is not assignable to type 'string'.*)
3. Der `else`-Fall fehlt → `noImplicitReturns`
   (*TS2366: Function lacks ending return statement ...*)

Und ein vierter, sobald du ihn behebst: `sprache` wird nirgends benutzt –
`noUnusedParameters` meldet *TS6133*. Entweder du benutzt den Parameter, oder
du präfixt ihn mit `_`.

```typescript
interface Bestellung {
  positionen: string[];
  kommentar?: string;
}

function ersteBeschreibung(bestellung: Bestellung, sprache: string): string {
  // Der Indexzugriff ist ehrlich "string | undefined" - also pruefen:
  const erste = bestellung.positionen[0];
  if (erste === undefined || erste.length === 0) {
    return sprache === "de" ? "Keine Position" : "No item";
  }
  // Alle Pfade geben einen string zurueck - noImplicitReturns ist zufrieden.
  return erste.toUpperCase();
}

console.log(ersteBeschreibung({ positionen: ["Kaffee"] }, "de")); // KAFFEE
console.log(ersteBeschreibung({ positionen: [] }, "de"));         // Keine Position
```

Beachte: `kommentar` wird nie auf `undefined` gesetzt, sondern schlicht
weggelassen – so will es `exactOptionalPropertyTypes`.

</details>

---

## 5.3 `tsc` und `ts-node`

### Theorie

Zwei Werkzeuge, ein Ziel – aber zwei ganz verschiedene Wege:

| | `tsc` | `ts-node` |
|---|---|---|
| Was passiert | schreibt `.js`-Dateien nach `dist/` | übersetzt im Speicher und führt sofort aus |
| Ergebnis | Dateien | Programmausgabe |
| Geschwindigkeit | langsam beim Bauen, schnell beim Start | kein Bauen, aber Start jedes Mal langsamer |
| Wofür | Produktion, CI | Lernen, Skripte, schnelles Ausprobieren |

Die Metapher: `tsc` ist der Bäcker, der Brot backt und in den Laden stellt.
`ts-node` ist die Mikrowelle – schnell warm, aber niemand würde damit eine
Bäckerei betreiben.

Drei Aufrufe von `tsc` solltest du im Schlaf können:

- **`tsc`** – kompiliert das ganze Projekt nach `outDir`. Das ist `npm run build`.
- **`tsc --noEmit`** – prüft nur die Typen und schreibt **keine** Datei. Das ist
  der schnellste ehrliche Test, ob dein Projekt gesund ist, und genau das, was
  `npm run typecheck` macht. In jeder CI-Pipeline gehört dieser Aufruf an die
  erste Stelle.
- **`tsc --watch`** (kurz `tsc -w`) – bleibt laufen und übersetzt bei jedem
  Speichern neu. Kombiniert mit `--noEmit` bekommst du eine dauerhaft
  mitlaufende Typprüfung in einem Terminalfenster.

**Warum `ts-node` nicht in Produktion gehört** – vier Gründe:

1. **Startzeit.** Jeder Start übersetzt das Projekt erneut. Was beim
   Beispiel-Skript eine Sekunde kostet, kostet beim Serverstart nach einem
   Deployment das Vielfache.
2. **Speicher.** Der komplette TypeScript-Compiler läuft im selben Prozess wie
   dein Server mit – auf dem Produktionsserver reine Verschwendung.
3. **Fehler zur falschen Zeit.** `ts-node` meldet Typfehler beim *Starten*.
   Ein Tippfehler in einer selten benutzten Datei legt dir den Server lahm,
   statt schon in der CI aufzufallen.
4. **Abhängigkeiten.** TypeScript und `ts-node` stehen unter `devDependencies`.
   Auf dem Produktionsserver installierst du mit `npm ci --omit=dev` – dort
   sind sie schlicht nicht vorhanden.

Die Regel lautet deshalb: **bauen, dann ausliefern.** In der Entwicklung
`ts-node`, in Produktion `node dist/....js`. Genau so ist es in der
`package.json` dieses Repos hinterlegt (`start` vs. `start:prod`).

### Code-Beispiele

```bash
# Nur pruefen, nichts schreiben - der schnellste Gesundheitstest:
npx tsc --noEmit

# Ganzes Projekt bauen (Ergebnis landet in dist/):
npx tsc

# Dauerhaft mitlaufende Typpruefung in einem eigenen Terminal:
npx tsc --noEmit --watch

# Eine einzelne Datei direkt ausfuehren, ohne Build:
npx ts-node modul-5-werkzeuge-workflow/beispiele/01-strict-mode-in-aktion.ts
```

```bash
# Der Produktionsweg in drei Schritten:
npm run build                                    # erzeugt dist/
node dist/modul-9-abschlussprojekt/todo-app/server.js   # startet reines JS

# ... und genau dafuer gibt es in diesem Repo:
npm run start:prod
```

```bash
# So sieht der Unterschied im Dateisystem aus:
#
#   vor  "npx tsc":   modul-5-werkzeuge-workflow/beispiele/01-....ts
#   nach "npx tsc":   modul-5-werkzeuge-workflow/beispiele/01-....ts
#                     dist/modul-5-werkzeuge-workflow/beispiele/01-....js
#                     dist/modul-5-werkzeuge-workflow/beispiele/01-....js.map
#
# Die .map-Datei kommt von "sourceMap": true - sie erlaubt dem Debugger,
# im TypeScript statt im JavaScript anzuhalten.
```

### ⚠️ Häufiger Fehler

Zwei Verwechslungen kosten regelmäßig Zeit.

**Erstens:** `ts-node` ist kein Typprüfer für dein Projekt. Es übersetzt nur
die Dateien, die tatsächlich importiert werden. Läuft dein Skript
fehlerfrei, heißt das **nicht**, dass das Projekt fehlerfrei ist – die Datei,
die du seit gestern kaputt herumliegen hast, wurde einfach nie angefasst. Nur
`npm run typecheck` prüft alles.

**Zweitens:** `dist/` ist Build-Output, kein Quellcode. Es steht in der
`.gitignore` und wird bei jedem Build überschrieben. Wenn du dort etwas
reparierst, ist deine Reparatur beim nächsten `npm run build` weg.

### 🎯 Übungsaufgabe

Baue dir eine Minimal-Pipeline und beobachte, was jeder Schritt tut:

1. Führe `npm run typecheck` aus. Wie lange dauert es, und was entsteht im
   Dateisystem?
2. Führe `npm run build` aus. Was ist jetzt anders?
3. Baue absichtlich einen Typfehler in eine Beispieldatei ein (z. B.
   `const zahl: number = "text";`) und führe beide Befehle erneut aus.
   Welcher meldet den Fehler – und schreibt `tsc` trotzdem Dateien?

<details>
<summary>💡 Lösung anzeigen</summary>

```bash
# 1) typecheck: prueft alles, schreibt NICHTS. Es entsteht keine einzige Datei.
npm run typecheck

# 2) build: prueft ebenfalls alles - und legt zusaetzlich dist/ an.
npm run build
ls dist/

# 3) Mit einem Typfehler melden BEIDE denselben Fehler:
#    error TS2322: Type 'string' is not assignable to type 'number'.
```

Die überraschende Antwort auf Frage 3: **`tsc` schreibt die Dateien trotzdem.**
TypeScript ist standardmäßig gutmütig – es meldet den Fehler, erzeugt aber
dennoch JavaScript (die Typannotationen werden ja ohnehin nur entfernt).

Willst du das verhindern, setzt du `"noEmitOnError": true` in die
`compilerOptions`. Der übliche Weg in der Praxis ist aber ein anderer: In der
CI läuft erst `npm run typecheck`, und nur wenn das durchgeht, folgt
`npm run build`. Ein fehlgeschlagener Schritt bricht die Pipeline ab – so kann
fehlerhaftes JavaScript gar nicht erst ins Deployment rutschen.

</details>

---

## 5.4 ESLint für TypeScript

### Theorie

Compiler und Linter beantworten zwei verschiedene Fragen:

> **`tsc` fragt: "Passt das zusammen?"**
> **ESLint fragt: "Ist das eine gute Idee?"**

Ein Typfehler bedeutet: Der Code ist kaputt, er darf so nicht laufen. Ein
Lint-Befund bedeutet: Der Code läuft, aber er wird dir Ärger machen. `any` ist
das Musterbeispiel – vollkommen gültiges TypeScript, und trotzdem meldet der
Linter es zu Recht.

| | `tsc` | ESLint |
|---|---|---|
| Prüft | Typen, Zuweisbarkeit | Muster, Stil, Risiko |
| Bei Verstoß | Fehler, Build bricht ab | Warnung oder Fehler, je nach Konfiguration |
| Konfiguriert in | `tsconfig.json` | `eslint.config.js` |
| Abschaltbar per | `@ts-expect-error` | `// eslint-disable-next-line <regel>` |

Seit ESLint 9 ist die **Flat Config** der Standard: eine Datei namens
`eslint.config.js`, die ein **Array von Konfigurationsobjekten** exportiert.
Jedes Objekt gilt für die Dateien, auf die es zutrifft; spätere Objekte
überschreiben frühere. Die alten `.eslintrc.json` mit ihrem `extends`-Mechanismus
sind Geschichte.

Für TypeScript brauchst du das Paket **`typescript-eslint`**. Es liefert drei
Dinge: den Parser (damit ESLint TypeScript-Syntax überhaupt lesen kann), die
TypeScript-Regeln, und die Hilfsfunktion `tseslint.config(...)`, die dir das
Array korrekt zusammenbaut.

So sieht die echte Konfiguration dieses Repos aus – und sie ist bewusst kurz:

- `ignores` – was gar nicht erst geprüft wird (`dist`, `node_modules`).
- `...tseslint.configs.recommended` – der empfohlene Regelsatz.
- ein eigenes Objekt am Ende, das zwei Regeln herunterstuft.

Die Herabstufung von `no-explicit-any` auf `'warn'` ist eine bewusste
Entscheidung **dieses Kurses**: Die Anti-Pattern-Beispiele *müssen* `any`
benutzen dürfen, sonst könnten sie nicht zeigen, was ohne Typsicherheit
passiert. In einem echten Projekt gehört die Regel auf `'error'`.

Über `// eslint-disable-next-line` gilt: Es ist ein Skalpell, kein
Radiergummi. Drei Regeln dazu:

1. Immer die **konkrete Regel** nennen. Ein nacktes
   `// eslint-disable-next-line` schaltet alle Regeln für diese Zeile ab –
   auch die, die morgen dazukommt.
2. Immer eine **Begründung** dahinterschreiben.
3. Nie `/* eslint-disable */` an den Dateianfang. Damit ist die ganze Datei aus
   der Prüfung raus, und niemand merkt es.

### Code-Beispiele

```javascript
// eslint.config.js - Flat Config, CommonJS-Variante
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  }
);
```

```typescript
// Die haeufigsten Befunde in Kurzform - ausfuehrlich in
// beispiele/02-haeufige-lint-fehler.ts

// @typescript-eslint/no-explicit-any
// "Unexpected any. Specify a different type"
function ersterEintragFalsch(liste: any): any {
  return liste[0];
}

// Besser: ein Generic sagt genau das, was "any" nur andeuten wollte.
function ersterEintrag<T>(liste: readonly T[]): T | undefined {
  return liste[0];
}

// @typescript-eslint/ban-ts-comment
// 'Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do
//  nothing if the following line is error-free'

// @typescript-eslint/no-require-imports
// "A `require()` style import is forbidden"

// @typescript-eslint/no-empty-object-type
// "An empty interface declaration allows any non-nullish value ..."

// @typescript-eslint/no-unsafe-function-type
// "The `Function` type accepts any function-like value."
```

```bash
# Ganzes Projekt pruefen (das ist "npm run lint"):
npx eslint .

# Automatisch behebbare Befunde gleich korrigieren:
npx eslint . --fix

# Nur einen Ordner, mit Regelnamen in der Ausgabe:
npx eslint modul-5-werkzeuge-workflow/ --format stylish
```

### ⚠️ Häufiger Fehler

Der Klassiker ist, ESLint als Ersatz für den Compiler zu betrachten: "Der
Linter ist grün, also ist alles gut." Das ist es nicht. ESLint prüft in der
Standardkonfiguration **keine Typen** – es liest den Syntaxbaum, nicht das
Typsystem. Ein `const zahl: number = "text";` interessiert ESLint nicht die
Bohne; das ist Aufgabe von `tsc`. Deshalb brauchst du **beide** Werkzeuge, und
deshalb stehen `typecheck` und `lint` als zwei getrennte Skripte in der
`package.json`.

Der zweite Klassiker ist die Ausnahme, die zur Regel wird. Ein
`// eslint-disable-next-line` schleicht sich ein, wird kopiert, und ein halbes
Jahr später stehen 200 davon in der Codebasis. Wenn du eine Regel so oft
ausnehmen musst, ist nicht dein Code das Problem, sondern die Regel – dann
stell sie in `eslint.config.js` bewusst ab und schreib **einmal** in einem
Kommentar hin, warum.

### 🎯 Übungsaufgabe

Diese Funktion produziert zwei ESLint-Befunde **und** einen Compiler-Fehler.
Ordne jedes Problem dem richtigen Werkzeug zu und schreibe die Funktion sauber:

```typescript
function verarbeite(daten: any, rueckruf: Function) {
  const unbenutzt = daten.length;
  return rueckruf(daten);
}
```

<details>
<summary>💡 Lösung anzeigen</summary>

Zuordnung:

| Problem | Werkzeug | Meldung |
|---|---|---|
| `daten: any` | ESLint | `@typescript-eslint/no-explicit-any` |
| `rueckruf: Function` | ESLint | `@typescript-eslint/no-unsafe-function-type` |
| `unbenutzt` wird nie gelesen | **beide** | ESLint: `no-unused-vars`, tsc: `TS6133` |

Das dritte Problem ist der interessante Fall: Weil dieses Repo
`noUnusedLocals` gesetzt hat, meldet es sogar der Compiler – und bricht damit
den Build ab, nicht nur den Lint-Lauf.

```typescript
// Ein Generic statt "any", eine echte Signatur statt "Function",
// und die tote Variable ist einfach geloescht.
type Verarbeiter<T, R> = (daten: T) => R;

function verarbeite<T, R>(daten: T, rueckruf: Verarbeiter<T, R>): R {
  return rueckruf(daten);
}

console.log(verarbeite([1, 2, 3], (werte) => werte.length)); // 3
console.log(verarbeite("Ada", (text) => text.toUpperCase())); // ADA
```

Beachte, wie viel der Compiler jetzt weiß: Im zweiten Aufruf kennt er `text`
als `string`, ohne dass du es hingeschrieben hast. Genau das war mit `any` und
`Function` unmöglich.

</details>

---

## 5.5 IntelliJ IDEA einrichten

### Theorie

IntelliJ IDEA bringt für TypeScript fast alles mit – aber "fast" ist das
entscheidende Wort. Fünf Minuten Einrichtung, und die IDE arbeitet für dich
statt gegen dich.

**Voraussetzung.** IntelliJ IDEA **Ultimate** unterstützt TypeScript,
JavaScript und Node.js von Haus aus. Mit der **Community Edition** brauchst du
zusätzlich das **Node.js-Plugin** (*Settings → Plugins → Marketplace →
"Node.js"*). Ohne dieses Plugin fehlen dir die npm-Run-Konfigurationen und die
grünen Play-Buttons.

**Schritt 1 – Projekt öffnen.** *File → Open* und den **Wurzelordner** des
Repos wählen – also den Ordner mit `package.json` und `tsconfig.json`, nicht
einen einzelnen Modulordner. IntelliJ erkennt beide Dateien und richtet das
Projekt danach ein. Beim ersten Öffnen fragt die IDE **"Trust Project?"** –
bestätige mit **Trust Project**. Im *Safe Mode* (die andere Option) laufen
weder ESLint noch npm-Skripte.

**Schritt 2 – Node-Interpreter.** *Settings → Languages & Frameworks →
Node.js*. Im Feld **Node interpreter** muss deine Node-Installation stehen
(z. B. `/usr/local/bin/node` oder ein Eintrag deines Versionsmanagers).
Darunter zeigt **Package manager** auf `npm`. Setze außerdem den Haken bei
**Coding assistance for Node.js** – dann kennt die IDE die Node-Kern-API.

**Schritt 3 – TypeScript-Language-Service.** *Settings → Languages &
Frameworks → TypeScript*. Prüfe:

- **TypeScript** zeigt auf `node_modules/typescript` deines Projekts – nicht
  auf eine mitgelieferte Version. So siehst du exakt dieselben Fehler wie in
  der Konsole.
- **TypeScript Language Service** ist aktiviert.
- **Recompile on changes** kannst du aus lassen; das Bauen übernimmt
  `npm run build`.

Ganz unten im Fenster liegt außerdem das TypeScript-Werkzeugfenster mit den
Errors-Tabs – dort siehst du **alle** Projektfehler, nicht nur die der offenen
Datei.

**Schritt 4 – ESLint.** *Settings → Languages & Frameworks → Code Quality
Tools → ESLint*. Wähle **Automatic ESLint configuration**. IntelliJ findet
dann `eslint.config.js` und das ESLint aus `node_modules` von selbst. Lint-
Befunde erscheinen ab sofort als Wellenlinie direkt im Editor – gelb für
`warn`, rot für `error`.

**Schritt 5 – eine `.ts`-Datei starten.** Rechtsklick auf die Datei im
Projektbaum → **Run '01-strict-mode-in-aktion.ts'**. IntelliJ legt beim ersten
Mal automatisch eine Run-Konfiguration vom Typ *Node.js* an und trägt
`ts-node` als Interpreter-Option ein. Danach genügt Umschalt+F10 zum erneuten
Starten.

**Schritt 6 – npm-Skripte per Gutter-Icon.** Öffne `package.json`. Links neben
jedem Eintrag unter `"scripts"` erscheint ein grünes Play-Dreieck im
sogenannten *Gutter* (dem schmalen Streifen neben den Zeilennummern). Ein
Klick darauf startet das Skript. Alternativ liegt links das Werkzeugfenster
**npm** mit allen Skripten als Baum.

**Schritt 7 – die mitgelieferten Run-Konfigurationen.** Im Ordner
`.idea/runConfigurations/` liegen drei fertige Konfigurationen, die nach dem
Öffnen sofort oben rechts in der Auswahlliste stehen:

| Datei | Name in IntelliJ | startet |
|---|---|---|
| `Run_All.xml` | Run All (Abschlussprojekt) | `npm run start` |
| `Typecheck.xml` | Typecheck (tsc --noEmit) | `npm run typecheck` |
| `Lint.xml` | Lint (ESLint) | `npm run lint` |

**Warum genau dieser Ordner nicht in der `.gitignore` steht:** `.idea/` enthält
zwei sehr verschiedene Sorten Dateien. Der größte Teil ist **persönlich** –
welche Fenster du offen hast, deine lokale Historie, Caches. Das gehört
niemanden außer dir und wird ignoriert. Die Run-Konfigurationen dagegen sind
**Team-Inhalt**: Sie beschreiben, wie man dieses Projekt startet, und das ist
für jeden im Team dasselbe. Deshalb ignoriert die `.gitignore` erst alles unter
`.idea/*` und nimmt dann gezielt `runConfigurations/` wieder aus. Wer das Repo
klont, bekommt die grünen Play-Buttons geschenkt – ohne dass jemand seine
Fensteranordnung mitcommittet.

### Code-Beispiele

```gitignore
# ---------------------------------------------------------------------------
# IntelliJ IDEA
# ---------------------------------------------------------------------------
# Persoenliche IntelliJ-Einstellungen (Workspace, Caches, lokale Historie)
# werden ignoriert. Die Run-Konfigurationen unter ".idea/runConfigurations/"
# sind aber Team-Inhalt und werden bewusst NICHT ignoriert.
.idea/*
!.idea/runConfigurations/
!.idea/runConfigurations/**
```

```xml
<!-- .idea/runConfigurations/Run_All.xml
     Eine npm-Run-Konfiguration: Typ "js.build_tools.npm", Befehl "run",
     Skript "start". "node-interpreter value=project" heisst: nimm den
     Interpreter aus den Projekteinstellungen (Schritt 2) - so funktioniert
     die Datei auf jedem Rechner, egal wo Node dort installiert ist. -->
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Run All (Abschlussprojekt)" type="js.build_tools.npm" nameIsGenerated="false">
    <package-json value="$PROJECT_DIR$/package.json" />
    <command value="run" />
    <scripts>
      <script value="start" />
    </scripts>
    <node-interpreter value="project" />
    <envs />
    <method v="2" />
  </configuration>
</component>
```

```bash
# Die wichtigsten Tastenkuerzel im Alltag (Windows/Linux | macOS):
#
#   Umschalt+F10   | Strg+R        aktuelle Run-Konfiguration erneut starten
#   Umschalt+F9    | Strg+D        dasselbe im Debugger
#   Strg+/         | Cmd+/         Zeile aus-/einkommentieren
#   Alt+Enter      | Wahl+Enter    Schnellkorrektur zum Fehler unter dem Cursor
#   Strg+Alt+L     | Cmd+Wahl+L    Code formatieren
#   Doppelt Umschalt              "Search Everywhere" - findet alles
```

### ⚠️ Häufiger Fehler

Drei Stolpersteine sehen fast gleich aus und haben ganz verschiedene Ursachen.

**"Die IDE zeigt Fehler, die Konsole nicht (oder umgekehrt)."** Fast immer
benutzt IntelliJ eine andere TypeScript-Version als dein Projekt. Prüfe
*Settings → Languages & Frameworks → TypeScript* – dort muss
`node_modules/typescript` stehen. Hilft das nicht: *File → Invalidate Caches*.

**"ESLint meldet nichts."** Meistens wurde das Projekt im *Safe Mode*
geöffnet, oder `npm install` fehlt. Ohne `node_modules` findet die Automatik
weder ESLint noch die Konfiguration.

**"Run funktioniert nicht, obwohl `npx ts-node` in der Konsole läuft."** Dann
fehlt in der Community Edition das Node.js-Plugin, oder der Node-Interpreter
in den Projekteinstellungen ist leer.

Und ein vierter, der eigentlich keiner ist: Öffne **nie** einen einzelnen
Modulordner als Projekt. Ohne `tsconfig.json` im Projektwurzelordner kennt die
IDE deine Compiler-Optionen nicht und zeigt dir völlig andere Fehler als der
Compiler.

### 🎯 Übungsaufgabe

Richte dir eine eigene Run-Konfiguration ein, die **nur** dieses Modul
startet – und zwar so, dass sie auch bei deinen Kollegen ankommt:

1. Öffne `package.json` und starte `modul5` über das Gutter-Icon.
2. Lege eine npm-Run-Konfiguration mit dem Namen "Modul 5 Beispiele" an, die
   `npm run modul5` ausführt.
3. Sorge dafür, dass die Konfiguration mit ins Repository wandert.

<details>
<summary>💡 Lösung anzeigen</summary>

Schritt 2 in der Oberfläche: *Run → Edit Configurations… → + → npm*. Dort
eintragen:

- **Name:** `Modul 5 Beispiele`
- **package.json:** `$PROJECT_DIR$/package.json`
- **Command:** `run`
- **Scripts:** `modul5`
- **Node interpreter:** `Project`

Schritt 3 ist der entscheidende: Setze im selben Dialog den Haken bei
**Store as project file**. Erst dann schreibt IntelliJ die Konfiguration nach
`.idea/runConfigurations/` – und nur dieser Ordner ist von der `.gitignore`
ausgenommen. Ohne den Haken landet sie in `.idea/workspace.xml`, und die Datei
wird ignoriert.

Das Ergebnis ist diese Datei, `.idea/runConfigurations/Modul_5_Beispiele.xml`:

```xml
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Modul 5 Beispiele" type="js.build_tools.npm" nameIsGenerated="false">
    <package-json value="$PROJECT_DIR$/package.json" />
    <command value="run" />
    <scripts>
      <script value="modul5" />
    </scripts>
    <node-interpreter value="project" />
    <envs />
    <method v="2" />
  </configuration>
</component>
```

Kontrolle auf der Kommandozeile – die Datei muss von Git gesehen werden:

```bash
git status --short .idea/
# ?? .idea/runConfigurations/Modul_5_Beispiele.xml
```

Steht dort nichts, greift die `.gitignore` noch – dann hast du den Haken
"Store as project file" vergessen.

</details>

---

## 5.6 npm-Skripte als Workflow

### Theorie

npm-Skripte sind die Bedienknöpfe deines Projekts. Ihr eigentlicher Wert liegt
nicht darin, Tipparbeit zu sparen, sondern darin, dass **alle dieselben
Befehle benutzen** – du, deine Kollegen und die CI-Pipeline. Eine Anleitung im
Wiki veraltet; ein `npm run build` nicht.

Zwei Dinge zur Mechanik:

- npm legt `node_modules/.bin` in den Pfad. Deshalb funktioniert `"build": "tsc"`
  ohne `npx` – innerhalb eines Skripts ist die lokale Version schon gefunden.
- `start` und `test` sind Sonderfälle: Sie laufen auch ohne `run`
  (`npm start`). Bei allen anderen brauchst du `npm run <name>`.

Die Skripte dieses Repos:

| Skript | Befehl | Wofür |
|---|---|---|
| `start` | `ts-node modul-9-.../server.ts` | Abschlussprojekt in der Entwicklung starten |
| `start:prod` | `node dist/modul-9-.../server.js` | dasselbe aus dem Build – der Produktionsweg |
| `build` | `tsc` | ganzes Projekt nach `dist/` kompilieren |
| `typecheck` | `tsc --noEmit` | nur prüfen, nichts schreiben |
| `lint` | `eslint .` | Codequalität prüfen |
| `modul1` … `modul9` | `ts-node modul-N-.../beispiele/01-....ts` | das erste Beispiel eines Moduls starten |

Der Doppelpunkt in `start:prod` ist reine Namenskonvention – npm liest ihn
nicht als Hierarchie, aber Menschen tun es. Übliche Muster sind
`build:watch`, `test:unit`, `lint:fix`.

Zwei Konventionen solltest du kennen, bevor du eigene Skripte schreibst:

- **`pre`- und `post`-Hooks.** Ein Skript namens `prebuild` läuft automatisch
  vor `build`, `postbuild` danach. Praktisch – aber sparsam einsetzen: Was
  automatisch mitläuft, sieht niemand mehr.
- **Verkettung.** `&&` führt den nächsten Befehl nur aus, wenn der vorherige
  erfolgreich war. Genau das willst du für eine Prüfkette:
  `"verify": "npm run typecheck && npm run lint"`.

### Code-Beispiele

```json
{
  "scripts": {
    "start": "ts-node modul-9-abschlussprojekt/todo-app/server.ts",
    "start:prod": "node dist/modul-9-abschlussprojekt/todo-app/server.js",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "modul5": "ts-node modul-5-werkzeuge-workflow/beispiele/01-strict-mode-in-aktion.ts"
  }
}
```

```json
{
  "scripts": {
    "typecheck:watch": "tsc --noEmit --watch",
    "lint:fix": "eslint . --fix",
    "clean": "rm -rf dist",
    "verify": "npm run typecheck && npm run lint",
    "modul5:lint": "ts-node modul-5-werkzeuge-workflow/beispiele/02-haeufige-lint-fehler.ts"
  }
}
```

```bash
# Der Alltag in vier Befehlen:
npm install          # einmal nach dem Klonen
npm run modul5       # ein Beispiel ausprobieren
npm run typecheck    # vor jedem Commit
npm run lint         # vor jedem Commit

# Alle verfuegbaren Skripte anzeigen lassen:
npm run
```

### ⚠️ Häufiger Fehler

Der teuerste Fehler ist ein globales `npm install -g typescript`. Dann läuft
auf deinem Rechner Version A, auf dem Build-Server Version B – und dieselbe
Datei kompiliert hier und dort unterschiedlich. Installiere TypeScript
**immer** lokal als `devDependency` (so wie hier) und rufe es über npm-Skripte
oder `npx` auf. `npx` nimmt automatisch die lokale Version aus `node_modules`.

Der zweite Fehler ist der zu lange Einzeiler. Wenn ein Skript aus fünf mit
`&&` verketteten Befehlen besteht, versteht es nach zwei Wochen niemand mehr –
auch du nicht. Zerlege es in benannte Teilskripte und setze sie zusammen:

```json
"verify": "npm run typecheck && npm run lint"
```

### 🎯 Übungsaufgabe

Ergänze die `package.json` um einen Ablauf, den du vor jedem Commit ausführen
kannst: Er soll die Typen prüfen, danach linten und – nur wenn beides sauber
ist – bauen. Und ein zweites Skript, das den `dist`-Ordner vorher aufräumt.

<details>
<summary>💡 Lösung anzeigen</summary>

```json
{
  "scripts": {
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "verify": "npm run typecheck && npm run lint",
    "build": "tsc",
    "rebuild": "npm run clean && npm run verify && npm run build"
  }
}
```

Warum diese Aufteilung gut ist:

- **Jeder Schritt ist einzeln aufrufbar.** Wenn `rebuild` fehlschlägt, kannst
  du `npm run lint` allein starten, um zu sehen, woran es lag.
- **`&&` bricht bei Fehlern ab.** Schlägt `typecheck` fehl, wird weder gelintet
  noch gebaut – du bekommst genau eine Fehlermeldung statt drei.
- **Die CI benutzt dieselben Skripte.** Was bei dir lokal grün ist, ist es
  auch auf dem Server.

```bash
npm run rebuild
```

Zur `pre`-Hook-Variante: Du *könntest* stattdessen ein `"prebuild": "npm run
verify"` schreiben – dann prüft jedes `npm run build` automatisch mit. Das ist
bequem, versteckt aber einen Schritt. Für ein Lernprojekt ist der explizite
Weg über `rebuild` die bessere Wahl: Man sieht, was passiert.

Unter Windows funktioniert `rm -rf` in der klassischen `cmd.exe` nicht. Wenn
dein Team gemischt unterwegs ist, nimm dort das Paket `rimraf`:
`"clean": "rimraf dist"`.

</details>

---

## 📋 Zusammenfassung & Cheat-Sheet

```bash
# --- Typen pruefen & bauen -------------------------------------------------
npm run typecheck      # tsc --noEmit  - prueft alles, schreibt nichts
npm run build          # tsc           - kompiliert nach dist/
npx tsc --noEmit -w    # dauerhafte Typpruefung im Hintergrund
npx tsc --showConfig   # zeigt die WIRKLICH geltende Konfiguration

# --- Ausfuehren ------------------------------------------------------------
npm run modul5         # Beispiel dieses Moduls per ts-node
npx ts-node <datei>.ts # beliebige Datei direkt ausfuehren (nur Entwicklung!)
npm run start:prod     # node dist/... - der Produktionsweg

# --- Codequalitaet ---------------------------------------------------------
npm run lint           # eslint .
npx eslint . --fix     # behebt, was automatisch behebbar ist

# --- IntelliJ IDEA ---------------------------------------------------------
# Settings -> Languages & Frameworks -> Node.js          (Interpreter)
# Settings -> Languages & Frameworks -> TypeScript       (Language Service)
# Settings -> ... -> Code Quality Tools -> ESLint        (Automatic)
# Rechtsklick auf .ts-Datei -> Run                       (startet ts-node)
# package.json -> gruenes Dreieck im Gutter              (startet npm-Skript)
# .idea/runConfigurations/                               (Team-Konfigurationen)
```

```jsonc
// Die Optionen dieses Repos, die ueber "strict" hinausgehen:
"noUnusedLocals": true,               // TS6133 - tote Variablen
"noUnusedParameters": true,           // TS6133 - tote Parameter ("_" hilft)
"noImplicitReturns": true,            // TS2366 - vergessener Rueckgabepfad
"noFallthroughCasesInSwitch": true,   // TS7029 - vergessenes break
"noUncheckedIndexedAccess": true,     // TS2322 - liste[0] ist T | undefined
"exactOptionalPropertyTypes": true,   // TS2375 - fehlt != undefined
"noImplicitOverride": true,           // TS4114 - "override" hinschreiben
"noPropertyAccessFromIndexSignature": true // TS4111 - obj["key"] statt obj.key
```

| Frage | Antwort |
|---|---|
| `tsc` oder `ts-node`? | `ts-node` nur in der Entwicklung. In Produktion immer `npm run build` + `node dist/...`. |
| Wie prüfe ich schnell alles? | `npm run typecheck` – prüft das ganze Projekt und schreibt keine Datei. |
| Warum `moduleDetection: "force"`? | Ohne sie teilen sich Dateien ohne Import/Export einen globalen Namensraum – gleiche Variablennamen kollidierten. |
| Warum `types: ["node"]`? | Damit `console`, `process` und `Buffer` garantiert bekannt sind und nichts anderes zufällig mitgeladen wird. |
| Compiler-Fehler oder Lint-Befund? | Compiler: "passt nicht zusammen". Lint: "läuft, ist aber eine schlechte Idee". |
| Warum meldet die IDE andere Fehler als die Konsole? | IntelliJ benutzt eine andere TypeScript-Version – auf `node_modules/typescript` umstellen. |
| Warum ist `.idea/runConfigurations/` nicht ignoriert? | Run-Konfigurationen sind Team-Inhalt; der Rest von `.idea/` ist persönlich. |
| `!` benutzen, wenn der Compiler meckert? | Nur mit echter Garantie und Begründung. Sonst behebst du die Warnung, nicht den Bug. |

---

← [Kursübersicht](../README.md) | [Modul 4: Profi Node.js](../modul-4-profi-nodejs/README.md) | [Modul 6: Sicherheit & Auth](../modul-6-sicherheit-auth/README.md) →
