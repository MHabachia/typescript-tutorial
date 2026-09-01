# Modul 4: Professionalisierung & Backend (Profi / Node.js)

Bis hierher lief dein TypeScript in einer einzigen Datei. Jetzt wird daraus ein
Projekt: mehrere Module, eine Konfiguration aus der Umgebung und am Ende ein
echter HTTP-Server – alles typsicher, alles ohne Framework.

## 🎯 Lernziele

Nach diesem Modul kannst du:

- ein Node.js-Projekt mit `typescript`, `ts-node` und `@types/node` einrichten und erklären, was jedes Teil tut
- Code über `export` und `import` auf mehrere Dateien verteilen – named, default, mit `as` umbenannt und als reiner Typ-Import
- CommonJS und ECMAScript-Module unterscheiden und die Rolle von `"module"`, `esModuleInterop` und `"type": "module"` einordnen
- eine sinnvolle Projektstruktur aufbauen, Barrel-Files bewusst einsetzen und zirkuläre Abhängigkeiten vermeiden
- `process.env` und `process.argv` typsicher auslesen, statt dem Compiler etwas vorzulügen
- einen eigenen HTTP-Server mit `node:http` schreiben, den Request-Body lesen und sauberes JSON zurückgeben

## Inhalt

- [4.1 Node.js mit TypeScript einrichten](#41-nodejs-mit-typescript-einrichten)
- [4.2 Module: `export` / `import`](#42-module-export--import)
- [4.3 CommonJS vs. ECMAScript-Module](#43-commonjs-vs-ecmascript-module)
- [4.4 Projektstruktur & Barrel-Files](#44-projektstruktur--barrel-files)
- [4.5 `process.env` und Node-APIs typsicher nutzen](#45-processenv-und-node-apis-typsicher-nutzen)
- [4.6 Ein eigener HTTP-Server mit `node:http`](#46-ein-eigener-http-server-mit-nodehttp)
- [📋 Zusammenfassung & Cheat-Sheet](#-zusammenfassung--cheat-sheet)

**Lauffähige Beispiele:** [`beispiele/`](./beispiele/)

| Datei | Thema |
|---|---|
| [`mathe.ts`](./beispiele/mathe.ts) | Modul mit named exports |
| [`logger.ts`](./beispiele/logger.ts) | Modul mit default export |
| [`01-module-verwenden.ts`](./beispiele/01-module-verwenden.ts) | `import` / `export` in der Praxis |
| [`02-env-typsicher.ts`](./beispiele/02-env-typsicher.ts) | `process.env` und `process.argv` |
| [`03-http-server.ts`](./beispiele/03-http-server.ts) | HTTP-Server mit `node:http` |

---

## 4.1 Node.js mit TypeScript einrichten

### Theorie

Node.js versteht kein TypeScript. Punkt. Node kennt nur JavaScript – deine
`.ts`-Dateien sind für ihn Text ohne Bedeutung. Damit trotzdem etwas passiert,
brauchst du drei Bausteine, die oft verwechselt werden:

| Paket | Was es tut | Bild dazu |
|---|---|---|
| `typescript` | Der Compiler (`tsc`). Prüft Typen und erzeugt `.js`-Dateien. | Der Übersetzer |
| `ts-node` | Kompiliert und startet in einem Schritt, ohne `.js`-Dateien zu hinterlassen. | Der Simultandolmetscher |
| `@types/node` | Die Typbeschreibungen für alles, was Node mitbringt. | Das Wörterbuch |

Der dritte Punkt überrascht Einsteiger am meisten. **Warum braucht man
`@types/node` überhaupt?** Weil `console`, `process`, `Buffer`, `__dirname`
und `require` keine Bestandteile der Sprache JavaScript sind – sie kommen von
der Laufzeitumgebung. Im Browser gäbe es sie so gar nicht. TypeScript liefert
nur Typen für die Sprache selbst (`Array`, `Promise`, `JSON` …). Alles, was
Node zusätzlich bereitstellt, muss beschrieben werden – und genau das ist
`@types/node`. Ohne dieses Paket scheitert schon ein simples
`console.log("hi")` mit *"Cannot find name 'console'"*.

Dieses Repository macht es so: Alle drei Pakete stehen in `package.json` unter
`devDependencies` (sie werden nur beim Entwickeln gebraucht, nicht im fertigen
Produkt). Die `tsconfig.json` bindet die Node-Typen ausdrücklich ein:

```jsonc
"types": ["node"]
```

Und die Skripte in der `package.json` starten die Beispiele über `ts-node`:

```jsonc
"scripts": {
  "modul4": "ts-node modul-4-profi-nodejs/beispiele/01-module-verwenden.ts",
  "build": "tsc",
  "typecheck": "tsc --noEmit"
}
```

Zwei Betriebsarten, die du auseinanderhalten solltest:

- **Entwicklung:** `ts-node datei.ts` – schnell, keine Zwischendateien.
- **Produktion:** erst `tsc` (erzeugt `dist/`), dann `node dist/datei.js` –
  weil `ts-node` bei jedem Start neu kompiliert und das im Betrieb nur Zeit
  und Speicher kostet.

**In IntelliJ IDEA** brauchst du dafür meistens gar keine Kommandozeile:
Rechtsklick auf eine `.ts`-Datei → **Run '\<dateiname\>'**. IntelliJ IDEA legt
automatisch eine Run-Configuration an und benutzt das `ts-node` aus deinem
Projekt. Beim zweiten Mal reicht dann `Strg`+`F5` (macOS: `Ctrl`+`R`). Läuft
etwas nicht, prüfe unter *Settings → Languages & Frameworks → TypeScript*, ob
dort die TypeScript-Version aus `node_modules` ausgewählt ist – nicht die
mitgelieferte.

### Code-Beispiele

```bash
# Ein Projekt von Null aufsetzen
npm init -y
npm install --save-dev typescript ts-node @types/node

# tsconfig.json erzeugen
npx tsc --init

# Eine Datei sofort ausfuehren (Entwicklung)
npx ts-node beispiele/01-module-verwenden.ts

# Nur pruefen, ohne etwas zu erzeugen
npx tsc --noEmit

# Fuer die Produktion uebersetzen und mit Node starten
npx tsc
node dist/beispiele/01-module-verwenden.js
```

```typescript
// Das hier funktioniert NUR, wenn @types/node installiert und eingebunden ist.
// Ohne das Paket meldet der Compiler: "Cannot find name 'process'."
console.log("Node-Version:", process.version);
console.log("Arbeitsverzeichnis:", process.cwd());

// Buffer ist ebenfalls reines Node - im Browser gibt es ihn nicht.
const daten = Buffer.from("Hallo", "utf8");
console.log("Bytes:", daten.length); // 5
```

### ⚠️ Häufiger Fehler

Der Klassiker: `@types/node` wird in die `dependencies` statt in die
`devDependencies` geschrieben – oder umgekehrt `typescript` wird global
installiert und lokal vergessen. Beides rächt sich, sobald jemand anderes das
Projekt auscheckt.

Der zweite Klassiker ist die Annahme, `ts-node` prüfe deine Typen genauso
streng wie `tsc`. Standardmäßig tut es das zwar – aber viele Projekte schalten
aus Geschwindigkeitsgründen `transpileOnly` ein, und dann läuft fehlerhafter
Code klaglos durch. Verlass dich in der Continuous Integration nie auf
`ts-node`, sondern führe immer zusätzlich `tsc --noEmit` aus.

### 🎯 Übungsaufgabe

Lege ein leeres Verzeichnis an und richte es so ein, dass eine Datei
`hallo.ts` mit `npx ts-node hallo.ts` läuft und Node-Version sowie
Betriebssystem ausgibt. Welche drei Pakete installierst du – und in welchen
Abschnitt der `package.json` gehören sie?

<details>
<summary>💡 Lösung anzeigen</summary>

```bash
npm init -y
# Alle drei sind Entwicklungswerkzeuge -> --save-dev.
# Im fertigen dist/-Ordner laeuft nur noch reines JavaScript.
npm install --save-dev typescript ts-node @types/node
npx tsc --init
```

```typescript
// hallo.ts
// "process" stammt aus @types/node - ohne das Paket kennt TypeScript
// diesen Namen nicht.
console.log("Node-Version:", process.version);
console.log("Betriebssystem:", process.platform);
console.log("Argumente:", process.argv.slice(2));
```

```bash
npx ts-node hallo.ts
```

In IntelliJ IDEA reicht stattdessen ein Rechtsklick auf `hallo.ts` →
**Run 'hallo.ts'**.

</details>

---

## 4.2 Module: `export` / `import`

### Theorie

Ein Modul ist in TypeScript nichts Kompliziertes: **Ein Modul ist eine Datei.**
Alles, was darin steht, gehört erst einmal nur dieser Datei. Was andere
benutzen dürfen, markierst du mit `export`; was du von woanders brauchst, holst
du mit `import`.

Das ist mehr als Ordnung – es ist Kapselung ohne Zusatzaufwand: Eine nicht
exportierte Hilfsfunktion ist von außen unsichtbar, ganz ohne `private`.

Es gibt zwei Sorten von Exporten:

```typescript
// Named exports: beliebig viele pro Datei, der Name ist verbindlich.
export const PI = 3.14;
export function addiere(a: number, b: number): number { return a + b; }

// Default export: genau EINER pro Datei. Sagt "das hier bin ich".
export default class Logger { /* … */ }
```

Und entsprechend zwei Sorten von Importen:

```typescript
import { PI, addiere } from "./mathe";   // named: Klammern, exakte Namen
import Logger from "./logger";           // default: Name frei waehlbar
import Logger, { LOG_PRAEFIX } from "./logger"; // beides zusammen
```

Drei Werkzeuge machen den Alltag angenehmer:

**1. Umbenennen mit `as`.** Wenn zwei Module denselben Namen exportieren oder
ein Name im neuen Zusammenhang unklar wäre:

```typescript
import { addiere as summiereZwei } from "./mathe";
import { formatiere as formatiereDatum } from "./datum";
```

**2. `export type`.** Typen und Interfaces exportierst du genauso wie Werte.
Das `type`-Schlüsselwort davor macht klar: Das existiert nur beim Kompilieren.

```typescript
export type Rechenoperation = (a: number, b: number) => number;
export interface Notiz { id: number; text: string; }
```

**3. `import type`.** Der wichtigste Trick dieses Abschnitts. Damit sagst du
dem Compiler ausdrücklich, dass du nur einen Typ willst – und er entfernt die
Zeile beim Übersetzen restlos:

```typescript
import type { Notiz } from "./notiz";  // erzeugt KEIN require() zur Laufzeit
import { speichere } from "./notiz";   // erzeugt ein require()
```

Warum lohnt sich das? Drei Gründe: Das erzeugte JavaScript lädt weniger
Module, du siehst auf einen Blick, welche Abhängigkeiten echt sind – und
zirkuläre Abhängigkeiten zwischen reinen Typen werden völlig harmlos, weil zur
Laufzeit gar nichts passiert. Mit `isolatedModules` (in diesem Projekt aktiv)
wird `import type` an manchen Stellen sogar Pflicht.

Wichtig noch zum Pfad: `"./mathe"` mit Punkt-Schrägstrich meint eine **Datei**
neben dir. Ein Import ohne `./` oder `../` – etwa `"express"` – sucht Node in
`node_modules`.

### Code-Beispiele

```typescript
// mathe.ts - ein Modul mit named exports
export type Rechenoperation = (a: number, b: number) => number;

export const addiere: Rechenoperation = (a, b) => a + b;
export const multipliziere: Rechenoperation = (a, b) => a * b;

// NICHT exportiert -> von aussen unsichtbar und unbenutzbar.
function runde(wert: number, stellen: number): number {
  const faktor = 10 ** stellen;
  return Math.round(wert * faktor) / faktor;
}

export function mittelwert(zahlen: readonly number[]): number {
  if (zahlen.length === 0) return 0;
  return runde(zahlen.reduce((a, b) => a + b, 0) / zahlen.length, 2);
}
```

```typescript
// logger.ts - ein Modul mit default export
export type LogStufe = "info" | "warn" | "error";

class Logger {
  constructor(private readonly bereich: string) {}
  log(stufe: LogStufe, nachricht: string): void {
    console.log(`[${stufe}][${this.bereich}] ${nachricht}`);
  }
}

const logger = new Logger("app");
export default logger;      // die Datei "ist" dieser Logger
export type { Logger };     // der Typ zusaetzlich, fuer Annotationen
```

```typescript
// 01-module-verwenden.ts - alle Importformen nebeneinander
import { addiere, mittelwert } from "./mathe";
import { addiere as summiereZwei } from "./mathe";   // umbenannt
import type { Rechenoperation } from "./mathe";      // nur der Typ
import log, { LOG_PRAEFIX } from "./logger";         // default + named

const potenziere: Rechenoperation = (a, b) => a ** b;

console.log(addiere(2, 3));          // 5
console.log(summiereZwei(20, 22));   // 42
console.log(mittelwert([2, 3, 4, 5]));
console.log(potenziere(2, 10));      // 1024

log.log("info", `Fertig ${LOG_PRAEFIX}`);
```

### ⚠️ Häufiger Fehler

Die zwei Importformen werden ständig vertauscht – mit einer besonders
verwirrenden Fehlermeldung:

```typescript
// logger.ts hat einen DEFAULT-Export.
import { logger } from "./logger";
// Fehler: Module '"./logger"' has no exported member 'logger'.
// Richtig: import logger from "./logger";

// mathe.ts hat NAMED exports.
import mathe from "./mathe";
// Fehler: Module '"./mathe"' has no default export.
// Richtig: import { addiere } from "./mathe";
//    oder: import * as mathe from "./mathe";
```

Merkhilfe: **Geschweifte Klammern = du greifst nach einem bestimmten Namen.
Keine Klammern = du nimmst die ganze Datei.**

Der zweite Stolperstein betrifft Dateiendungen. In CommonJS – wie in diesem
Projekt – schreibst du `from "./mathe"` **ohne** `.ts` und **ohne** `.js`.
Schreibst du `"./mathe.ts"`, meldet der Compiler *"An import path can only end
with a '.ts' extension when 'allowImportingTsExtensions' is enabled"*.

### 🎯 Übungsaufgabe

Lagere eine Formatierungsfunktion in ein eigenes Modul `format.ts` aus: Sie
soll einen Betrag als `"1.234,50 EUR"` ausgeben. Exportiere zusätzlich einen
Typ `Waehrung` (`"EUR" | "USD" | "CHF"`). Importiere beides in eine zweite
Datei – den Typ so, dass zur Laufzeit kein Modul geladen wird.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// format.ts
export type Waehrung = "EUR" | "USD" | "CHF";

// Private Hilfe - bewusst NICHT exportiert.
const LOKALISIERUNG = "de-DE";

export function formatiereBetrag(betrag: number, waehrung: Waehrung): string {
  const zahl = betrag.toLocaleString(LOKALISIERUNG, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${zahl} ${waehrung}`;
}
```

```typescript
// rechnung.ts
import { formatiereBetrag } from "./format";
// "import type": wird beim Kompilieren komplett entfernt, erzeugt also kein
// require("./format") - der Wert-Import oben tut das ohnehin schon.
import type { Waehrung } from "./format";

const standardWaehrung: Waehrung = "EUR";

console.log(formatiereBetrag(1234.5, standardWaehrung)); // 1.234,50 EUR
console.log(formatiereBetrag(99, "USD"));                // 99,00 USD
```

`Waehrung` als Union statt als `string` hat einen konkreten Nutzen: Ein Tippfehler
wie `"EURO"` wird sofort gemeldet, statt still in der Rechnung zu landen.

</details>

---

## 4.3 CommonJS vs. ECMAScript-Module

### Theorie

Es gibt in der JavaScript-Welt zwei Modulsysteme, und du wirst beiden
begegnen. Der Grund ist historisch: Node.js brauchte 2009 Module, die Sprache
selbst bekam sie erst 2015.

| | CommonJS (CJS) | ECMAScript-Module (ESM) |
|---|---|---|
| Herkunft | Node.js, seit 2009 | JavaScript-Standard, seit ES2015 |
| Exportieren | `module.exports = …` | `export …` |
| Importieren | `const x = require("…")` | `import x from "…"` |
| Zeitpunkt | zur Laufzeit, synchron | vor der Ausführung, statisch |
| Bedingter Import | `if (…) require("…")` erlaubt | nicht erlaubt (nur `import()`) |
| Dateiendung im Import | darf fehlen | Pflicht: `"./mathe.js"` |

Der praktisch wichtigste Unterschied steht in der Zeile "Zeitpunkt". `require`
ist ein ganz normaler Funktionsaufruf mitten im Programm. `import` dagegen wird
**vor** dem ersten Ausführen ausgewertet – deshalb können Werkzeuge daraus
ableiten, was wirklich benutzt wird (Stichwort Tree Shaking), und deshalb darf
`import` auch nicht in einem `if` stehen.

Und wo kommt TypeScript ins Spiel? Du schreibst **immer** `import`/`export`.
Was daraus wird, entscheidet allein die `tsconfig.json`:

```jsonc
"module": "CommonJS"
```

Diese eine Zeile bedeutet: Der Compiler übersetzt dein `import { addiere } from
"./mathe"` in ein `const mathe_1 = require("./mathe")`. Dein Quelltext sieht
modern aus, das Ergebnis ist klassisches Node.

**`esModuleInterop`** ist die Brücke zwischen beiden Welten. Viele alte
Bibliotheken exportieren ein einziges Objekt (`module.exports = express`).
Streng genommen ist das kein Default-Export, `import express from "express"`
dürfte also gar nicht funktionieren. `esModuleInterop: true` erzeugt beim
Übersetzen die nötige Hilfsschicht – ohne diese Option müsstest du überall das
sperrige `import express = require("express")` schreiben.

**Wann setzt man `"type": "module"`?** Dieser Eintrag in der `package.json`
schaltet das ganze Projekt auf echtes ESM um. Sinnvoll ist das bei neuen
Projekten, bei Bibliotheken für den Browser und bei Paketen, die es nur noch
als ESM gibt. Der Preis: Du musst in Importen die Dateiendung `.js`
mitschreiben (ja, `.js` – auch wenn die Quelldatei `.ts` heißt), `require`,
`__dirname` und `__filename` gibt es nicht mehr, und `ts-node` braucht
zusätzliche Schalter.

**Dieses Repository bleibt bewusst bei CommonJS.** Für einen Kurs zählt, dass
jedes Beispiel mit einem einzigen `npx ts-node datei.ts` läuft – ohne Loader,
ohne Endungsregeln, ohne Konfigurationsdiskussion. Du lernst dabei nichts
Falsches: Der TypeScript-Quelltext ist in beiden Welten identisch, nur die
Zielsprache unterscheidet sich.

### Code-Beispiele

```javascript
// So sieht klassisches CommonJS aus - reines JavaScript, kein TypeScript.
// mathe.js
function addiere(a, b) { return a + b; }
module.exports = { addiere };

// app.js
const { addiere } = require("./mathe");
console.log(addiere(2, 3));
```

```typescript
// Dasselbe in TypeScript - du schreibst IMMER import/export ...
import { addiere } from "./mathe";
console.log(addiere(2, 3));

// ... und "module": "CommonJS" macht daraus beim Uebersetzen ungefaehr das:
//
//   "use strict";
//   Object.defineProperty(exports, "__esModule", { value: true });
//   const mathe_1 = require("./mathe");
//   console.log((0, mathe_1.addiere)(2, 3));
```

```typescript
// Was esModuleInterop bewirkt:

// Eine alte Bibliothek exportiert so:  module.exports = machWas;
// Ohne esModuleInterop waere nur das erlaubt:
//   import machWas = require("alte-lib");

// Mit esModuleInterop: true schreibst du wie gewohnt:
//   import machWas from "alte-lib";
// Der Compiler baut die Bruecke automatisch ein.
```

```jsonc
// Der Umschalter fuers ganze Projekt - hier bewusst NICHT gesetzt:
// package.json
{
  // "type": "module",   <- wuerde alles auf ESM umstellen
  "devDependencies": { "ts-node": "^10.9.2", "typescript": "^6.0.3" }
}
```

### ⚠️ Häufiger Fehler

Die berühmteste Fehlermeldung der Node-Welt:

```text
Error [ERR_REQUIRE_ESM]: require() of ES Module … not supported
```

Sie bedeutet fast immer: Du benutzt ein CommonJS-Projekt und hast ein Paket
installiert, das nur noch als ESM ausgeliefert wird (`node-fetch` ab Version 3
ist das bekannteste Beispiel). Drei Auswege, in dieser Reihenfolge:

1. Prüfe, ob du das Paket überhaupt brauchst – `fetch` ist seit Node 18
   eingebaut.
2. Bleib auf der letzten CommonJS-Version des Pakets.
3. Stell das Projekt vollständig auf ESM um – aber wirklich vollständig, nicht
   halb.

Der zweite häufige Fehler ist das Mischen in einer Datei: `require` und
`import` gleichzeitig zu benutzen funktioniert in TypeScript zwar oft, aber
`import` wird immer zuerst ausgewertet – die Reihenfolge im Quelltext täuscht
dich dann über die tatsächliche Ausführungsreihenfolge.

### 🎯 Übungsaufgabe

Ein Kollege gibt dir dieses JavaScript-Modul. Schreibe es in TypeScript um –
mit Typen und mit `export`/`import` – und erkläre, was `"module": "CommonJS"`
aus deinem `import` macht.

```javascript
// konfig.js
const standard = { port: 3000, debug: false };
module.exports = standard;
module.exports.laden = function (port) {
  return { port: port, debug: false };
};
```

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// konfig.ts
export interface Konfiguration {
  readonly port: number;
  readonly debug: boolean;
}

// Aus "module.exports = standard" wird ein Default-Export ...
const standard: Konfiguration = { port: 3000, debug: false };
export default standard;

// ... und aus "module.exports.laden" ein named export.
export function laden(port: number): Konfiguration {
  return { port, debug: false };
}
```

```typescript
// app.ts
import standard, { laden } from "./konfig";
import type { Konfiguration } from "./konfig";

const meine: Konfiguration = laden(8080);
console.log(standard.port, meine.port); // 3000 8080
```

Mit `"module": "CommonJS"` erzeugt der Compiler daraus wieder
`const konfig_1 = require("./konfig")` und greift auf `konfig_1.default` bzw.
`konfig_1.laden` zu. Der Node-Prozess sieht also nie ein `import` – nur dein
Quelltext ist modern. Genau deshalb kannst du dieselbe `.ts`-Datei später ohne
eine einzige Änderung nach ESM übersetzen: Du drehst nur an der `tsconfig.json`.

</details>

---

## 4.4 Projektstruktur & Barrel-Files

### Theorie

Ab etwa zwanzig Dateien entscheidet die Ordnerstruktur darüber, ob ein Projekt
angenehm oder anstrengend ist. Eine bewährte Aufteilung für einen Node-Dienst:

```text
projekt/
├── src/
│   ├── index.ts            # Startpunkt: verkabelt alles
│   ├── konfig.ts           # liest EINMAL process.env
│   ├── domaene/            # fachliche Typen und Regeln
│   │   ├── notiz.ts
│   │   └── index.ts        # Barrel
│   ├── http/               # Server, Routen, Handler
│   │   └── server.ts
│   └── werkzeuge/          # allgemeine Helfer (logger, format)
│       └── logger.ts
├── tests/
├── dist/                   # Ergebnis von tsc - nie von Hand anfassen
├── package.json
└── tsconfig.json
```

Die Leitidee: **Gruppiere nach Fachlichkeit, nicht nach Dateityp.** Ein Ordner
`domaene/` mit allem zur Notiz ist hilfreicher als ein Ordner `interfaces/`,
in dem Typen aus zehn verschiedenen Themen liegen. Denn geändert wird immer ein
Thema – nie "alle Interfaces gleichzeitig".

Ein **Barrel-File** ist eine `index.ts`, die nur weiterexportiert. Sie macht
aus einem Ordner ein einziges Modul:

```typescript
// domaene/index.ts
export { erstelleNotiz, loescheNotiz } from "./notiz";
export type { Notiz } from "./notiz";
```

Aufrufer schreiben dann statt drei Importzeilen nur noch eine:

```typescript
import { erstelleNotiz, loescheNotiz } from "./domaene";
```

Das hat Vor- und Nachteile, und du solltest beide kennen:

**Dafür:** kürzere Importe; der Ordner bekommt eine klar definierte
Außenschnittstelle; du kannst Dateien intern umbenennen oder aufteilen, ohne
dass ein einziger Aufrufer etwas merkt.

**Dagegen:** Wer `./domaene` importiert, lädt zur Laufzeit **alle** darüber
exportierten Module – auch die, die er nicht braucht. Werkzeuge finden die
Ursprungsdatei schwerer, und – der eigentliche Grund für schlechten Ruf –
Barrels sind die häufigste Quelle **zirkulärer Abhängigkeiten**.

Zirkulär heißt: A importiert B, und B importiert (womöglich über drei Ecken)
wieder A. Node bricht diesen Kreis nicht ab, sondern liefert einfach ein noch
halb fertiges Modul aus. Das Ergebnis ist ein `undefined` an einer Stelle, an
der laut Typen etwas stehen müsste – ein Fehler, den der Compiler nicht sieht.

Drei Regeln, die Kreise zuverlässig verhindern:

1. **Innerhalb eines Ordners nie über das eigene Barrel importieren.**
   `notiz.ts` schreibt `from "./benutzer"`, niemals `from "./index"`.
2. **Nach unten importieren, nicht nach oben.** Lege eine Reihenfolge fest –
   z. B. `werkzeuge` → `domaene` → `http` – und importiere nur in diese
   Richtung.
3. **Reine Typen mit `import type` importieren.** Diese Zeilen verschwinden
   beim Übersetzen, können also gar keinen Laufzeit-Kreis erzeugen.

### Code-Beispiele

```typescript
// domaene/notiz.ts
export interface Notiz {
  readonly id: number;
  readonly text: string;
}

export function erstelleNotiz(id: number, text: string): Notiz {
  return { id, text };
}
```

```typescript
// domaene/index.ts - das Barrel: NUR Re-Exporte, keine Logik
export { erstelleNotiz } from "./notiz";
// Bei "isolatedModules" ist "export type" hier Pflicht: Der Compiler
// uebersetzt jede Datei einzeln und kann sonst nicht wissen, dass "Notiz"
// nur ein Typ ist - er wuerde einen Laufzeit-Export erzeugen, den es nicht gibt.
export type { Notiz } from "./notiz";
```

```typescript
// http/server.ts - der Aufrufer sieht nur noch EINEN Pfad
import { erstelleNotiz } from "../domaene";
import type { Notiz } from "../domaene";

const erste: Notiz = erstelleNotiz(1, "TypeScript lernen");
console.log(erste);
```

```typescript
// ANTI-PATTERN: ein Kreis, den nur die Laufzeit bemerkt
//
// domaene/notiz.ts    ->  import { pruefeBenutzer } from "./benutzer";
// domaene/benutzer.ts ->  import { erstelleNotiz }  from "./index";  // Kreis!
//
// Node laedt "index" mittendrin noch einmal, bekommt ein halb fertiges Modul
// und "erstelleNotiz" ist zur Laufzeit "undefined" - obwohl der Compiler
// zufrieden war.
//
// Die Reparatur ist eine Zeile: innerhalb des Ordners direkt importieren.
// domaene/benutzer.ts ->  import { erstelleNotiz } from "./notiz";
```

### ⚠️ Häufiger Fehler

Das größte Barrel-Missverständnis ist das **Wurzel-Barrel**: eine einzige
`src/index.ts`, die wirklich alles aus dem gesamten Projekt re-exportiert.
Das fühlt sich zunächst bequem an, führt aber dazu, dass jede Datei mittelbar
jede andere lädt. Ein Kreis ist dann nur noch eine Frage der Zeit, der Start
des Programms wird spürbar langsamer, und in Tests ziehst du für eine einzige
Hilfsfunktion die halbe Anwendung mit hoch.

Faustregel: **Ein Barrel pro fachlichem Ordner – und keins darüber.** Nutze es
für die Außensicht auf einen Bereich, nie für Importe innerhalb desselben
Bereichs.

### 🎯 Übungsaufgabe

Du hast drei Dateien: `werkzeuge/logger.ts` (default export `logger`),
`werkzeuge/format.ts` (named exports `formatiereDatum`, `formatiereBetrag`)
und `werkzeuge/zeit.ts` (named export `jetzt`). Schreibe das Barrel
`werkzeuge/index.ts` und den Import in `http/server.ts`. Worauf musst du bei
den Typen achten?

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// werkzeuge/index.ts
// Named exports werden einfach durchgereicht:
export { formatiereDatum, formatiereBetrag } from "./format";
export { jetzt } from "./zeit";

// Ein default export muss beim Weiterreichen einen Namen bekommen -
// "export { default } from" waere sonst schon der Default DIESER Datei.
export { default as logger } from "./logger";

// Typen IMMER mit "export type" weiterreichen. Bei "isolatedModules" ist das
// Pflicht: Ohne das Schluesselwort erzeugt der Compiler einen Laufzeit-Export
// fuer etwas, das zur Laufzeit gar nicht existiert.
export type { Waehrung } from "./format";
```

```typescript
// http/server.ts
import { logger, formatiereBetrag, jetzt } from "../werkzeuge";
import type { Waehrung } from "../werkzeuge";

const waehrung: Waehrung = "EUR";
logger.log("info", `${jetzt()}: Umsatz ${formatiereBetrag(1234.5, waehrung)}`);
```

Wichtig: `format.ts` darf jetzt **nicht** `from "./index"` importieren, wenn es
etwas aus `zeit.ts` braucht – sonst entsteht genau der Kreis, den das Barrel
verstecken würde. Innerhalb von `werkzeuge/` gilt: direkt zur Datei.

</details>

---

## 4.5 `process.env` und Node-APIs typsicher nutzen

### Theorie

Konfiguration gehört nicht in den Quelltext. Port, Datenbank-URL, API-Schlüssel
– all das kommt von außen, über **Umgebungsvariablen**. In Node liest du sie
über `process.env`.

Und hier lauert die erste echte Falle des Moduls. So ist `process.env` in
`@types/node` beschrieben:

```typescript
interface ProcessEnv {
  [key: string]: string | undefined;
}
```

Lies diese drei Zeilen genau, sie erklären alles:

1. **Jeder Wert ist `string | undefined`.** Node kann dir nicht versprechen,
   dass eine Variable gesetzt ist – also verspricht der Typ es auch nicht.
2. **Jeder Wert ist ein String.** `PORT=3000` gibt dir `"3000"`, nicht `3000`.
   `"3000" + 1` ergibt `"30001"`. Umwandeln musst du selbst.
3. **Es ist eine Index-Signatur**, kein Objekt mit bekannten Feldern.

Aus Punkt 3 folgt eine Regel, die in diesem Projekt aktiv ist und dich
anfangs überraschen wird. Wegen

```jsonc
"noPropertyAccessFromIndexSignature": true
```

ist `process.env.PORT` **verboten**; erlaubt ist nur `process.env["PORT"]`.
Warum diese Strenge? Weil der Punkt lügt. Ein Punkt sieht aus wie der Zugriff
auf eine Eigenschaft, von der der Compiler weiß, dass es sie gibt (`nutzer.name`).
Bei einer Index-Signatur weiß er aber gar nichts – er schlägt bloß einen
Schlüssel nach, den es vielleicht nicht gibt. Die eckige Klammer macht diesen
Unterschied im Code sichtbar: *Hier wird gesucht, nicht zugegriffen.* Praktisch
heißt das: Tippfehler wie `process.env.PROT` fallen dir beim Lesen eher auf,
weil die Schreibweise dich zum Nachdenken zwingt.

Die Lösung für all das ist immer dieselbe: **eine Hilfsfunktion, die einmal
richtig prüft.**

```typescript
function leseUmgebungsvariable(schluessel: string, fallback?: string): string {
  const wert = process.env[schluessel];
  if (wert !== undefined && wert.trim() !== "") return wert;
  if (fallback !== undefined) return fallback;
  throw new Error(`Umgebungsvariable "${schluessel}" fehlt.`);
}
```

Der Rückgabetyp ist `string` – ohne `undefined`. Ab hier ist im restlichen
Programm nichts mehr zu prüfen. Und fehlt eine unverzichtbare Variable, bricht
der Start sofort ab, statt nachts um drei den ersten Request scheitern zu
lassen.

**`process.argv`** funktioniert nach demselben Muster. Es ist ein `string[]`
mit fester Bedeutung: `argv[0]` ist der Pfad zu Node, `argv[1]` der Pfad zum
Skript, ab `argv[2]` kommen deine eigenen Argumente. Wegen
`noUncheckedIndexedAccess` liefert `argv[2]` den Typ `string | undefined` – und
das ist keine Schikane, sondern die Wahrheit: Niemand garantiert dir, dass der
Benutzer überhaupt etwas übergeben hat.

Zuletzt das **`node:`-Präfix**. Seit Node 16 kannst du eingebaute Module so
importieren:

```typescript
import { createServer } from "node:http";   // statt "http"
import { readFile } from "node:fs/promises";
import { argv, env } from "node:process";
```

Das ist mehr als Kosmetik. Erstens ist auf einen Blick klar, dass es sich um
ein eingebautes Modul handelt und nicht um ein Paket aus `node_modules`.
Zweitens ist es sicherer: Ein bösartiges npm-Paket namens `http` könnte einen
Import ohne Präfix entführen – ein `node:`-Import niemals.

### Code-Beispiele

```typescript
// ANTI-PATTERN: dem Compiler etwas vorluegen
const dbUrl = process.env["DATENBANK_URL"] as string;
console.log(dbUrl.length);
// Der Compiler ist zufrieden. Ist die Variable nicht gesetzt, kracht es:
// "TypeError: Cannot read properties of undefined (reading 'length')"

// Ausserdem verboten in diesem Projekt (noPropertyAccessFromIndexSignature):
// const port = process.env.PORT;
// Fehler: Property 'PORT' comes from an index signature,
//         so it must be accessed with ['PORT'].
```

```typescript
// BEST PRACTICE: einmal pruefen, dann typsicher weiterarbeiten
function leseUmgebungsvariable(schluessel: string, fallback?: string): string {
  const wert = process.env[schluessel];
  // Leerstring behandeln wir wie "nicht gesetzt" - PORT="" hilft niemandem.
  if (wert !== undefined && wert.trim() !== "") return wert;
  if (fallback !== undefined) return fallback;
  throw new Error(`Umgebungsvariable "${schluessel}" fehlt oder ist leer.`);
}

function leseZahl(schluessel: string, fallback: number): number {
  const roh = process.env[schluessel];
  if (roh === undefined) return fallback;
  const zahl = Number(roh);
  if (!Number.isFinite(zahl)) {
    throw new Error(`"${schluessel}" ist keine Zahl: "${roh}"`);
  }
  return zahl;
}

interface AppKonfiguration {
  readonly name: string;
  readonly port: number;
  readonly datenbankUrl: string;
}

const konfig: AppKonfiguration = {
  name: leseUmgebungsvariable("APP_NAME", "meine-app"),
  port: leseZahl("PORT", 8080),
  datenbankUrl: leseUmgebungsvariable("DATENBANK_URL", "sqlite://./lokal.db"),
};

console.log(konfig.port + 1); // echte Zahl, kein "80801"
```

```typescript
// process.argv und das node:-Praefix
import { argv, env, platform } from "node:process";

const argumente: readonly string[] = argv.slice(2);
// argv[0] ist "string | undefined" - "??" liefert einen sicheren Standard.
const erstesArgument: string = argumente[0] ?? "(kein Argument uebergeben)";

console.log("Plattform:", platform);
console.log("Erstes Argument:", erstesArgument);
console.log("Sprache:", env["LANG"] ?? "unbekannt");
```

### ⚠️ Häufiger Fehler

Der mit Abstand häufigste Fehler ist das `!` oder `as string` hinter einem
`process.env`-Zugriff:

```typescript
const geheimnis = process.env["API_SCHLUESSEL"]!; // gefaehrlich
```

Das Ausrufezeichen prüft nichts – es schaltet nur die Warnung ab. Du hast das
Problem damit nicht gelöst, sondern verschoben: von einer klaren Fehlermeldung
beim Start hin zu einem `undefined`, das irgendwo tief im Code zum Absturz
führt oder, noch schlimmer, als Text `"undefined"` in einem Header landet.

Der zweite Fehler ist die Boolean-Falle:

```typescript
const debug = Boolean(process.env["DEBUG"]);   // falsch!
```

`Boolean("false")` ist `true` – jeder nicht leere String ist "truthy". Auch
`DEBUG=false` schaltet damit den Debug-Modus **ein**. Richtig ist ein
ausdrücklicher Vergleich: `process.env["DEBUG"] === "true"`.

### 🎯 Übungsaufgabe

Schreibe eine Funktion `leseFlag(schluessel: string, fallback: boolean): boolean`.
Sie soll `"true"`, `"1"` und `"yes"` (auch in Großschreibung) als `true`
werten, alles andere als `false`, und bei fehlender Variable den Fallback
zurückgeben. Teste sie mit `DEBUG=false`, `DEBUG=YES` und ohne `DEBUG`.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
import { env } from "node:process";

function leseFlag(schluessel: string, fallback: boolean): boolean {
  // "?." greift nur, wenn der Wert nicht undefined ist - das erspart die
  // getrennte Pruefung vor dem toLowerCase().
  const roh = env[schluessel]?.toLowerCase();
  if (roh === undefined) {
    return fallback;
  }
  // Ausdruecklicher Vergleich statt Boolean(): sonst waere "false" -> true.
  return roh === "true" || roh === "1" || roh === "yes";
}

env["DEBUG"] = "false";
console.log(leseFlag("DEBUG", true));  // false - genau wie erwartet

env["DEBUG"] = "YES";
console.log(leseFlag("DEBUG", false)); // true - Grossschreibung egal

delete env["DEBUG"];
console.log(leseFlag("DEBUG", true));  // true - der Fallback greift
```

Der entscheidende Unterschied zu `Boolean(env["DEBUG"])`: Dort wäre der erste
Fall `true` gewesen, weil der nicht leere String `"false"` truthy ist. Genau
solche Fehler kosten nachts Stunden.

</details>

---

## 4.6 Ein eigener HTTP-Server mit `node:http`

### Theorie

Node bringt einen vollwertigen HTTP-Server mit – ohne Express, ohne
irgendein Paket. Für den Kurs ist das der ideale Einstieg: Du siehst, was ein
Framework später für dich erledigt.

Zwei Typen musst du kennen:

| Typ | Rolle |
|---|---|
| `IncomingMessage` | die Anfrage: `method`, `url`, `headers`, Body als Stream |
| `ServerResponse` | die Antwort: `writeHead()`, `write()`, `end()` |

Ein Bild dazu: Der Server ist ein Postschalter. `IncomingMessage` ist der
Umschlag, den jemand hereinreicht – außen steht die Adresse (`url`) und die
Absicht (`method`), innen liegt der Inhalt. Und dieser Inhalt kommt nicht am
Stück, sondern in Häppchen. `ServerResponse` ist der Umschlag, den du
zurückgibst – und den darfst du nur **einmal** zukleben.

Der Grundaufbau:

```typescript
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

const server = createServer((anfrage: IncomingMessage, antwort: ServerResponse) => {
  antwort.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  antwort.end(JSON.stringify({ ok: true }));
});

server.listen(3000);
```

Drei Dinge, die TypeScript dir hier abverlangt – und das jeweils zu Recht:

**1. `anfrage.url` ist `string | undefined`.** Bei einem gewöhnlichen Request
ist sie zwar immer gesetzt, aber der Typ deckt auch Sonderfälle ab. Also
`const pfad = anfrage.url ?? "/";` statt hoffen.

**2. Der Body ist ein Stream, kein String.** Er kommt in `Buffer`-Stücken an,
und erst beim Ereignis `end` hast du alles. Deshalb verpackst du das Lesen in
ein Promise:

```typescript
function leseBody(anfrage: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const teile: Buffer[] = [];
    anfrage.on("data", (stueck: Buffer) => { teile.push(stueck); });
    anfrage.on("end", () => { resolve(Buffer.concat(teile).toString("utf8")); });
    anfrage.on("error", reject);
  });
}
```

**3. `JSON.parse` liefert `any`.** Das Ergebnis ist unbekannte Fremddaten.
Nimm es sofort als `unknown` entgegen und schick es durch einen Type Guard,
bevor du es benutzt.

Zum Antworten gilt: Baue JSON **nie** per String-Verkettung zusammen. Ein
einziges Anführungszeichen in den Daten zerlegt dir die Antwort. `JSON.stringify`
kümmert sich um alle Sonderzeichen – und der `Content-Type`-Header sagt dem
Client, was er bekommt, statt ihn raten zu lassen.

Das Beispiel [`03-http-server.ts`](./beispiele/03-http-server.ts) macht das
alles vor und beendet sich selbst: Es startet den Server auf einem freien Port,
schickt sich per `fetch` eigene Testanfragen und ruft anschließend
`server.close()` auf. In [Modul 9](../modul-9-abschlussprojekt/README.md) baust
du auf genau diesem Grundgerüst die fertige Todo-API auf.

### Code-Beispiele

```typescript
// ANTI-PATTERN: untypisierter Handler, Antwort von Hand zusammengeklebt
function handlerFalsch(req: any, res: any): void {
  // Kein Content-Type -> der Client raet. Und ein Anfuehrungszeichen in den
  // Daten zerlegt das JSON:
  //   {"suche": "gross"artig", "ok": true}   <- kaputt
  res.end('{"suche": "' + req.url + '", "ok": true}');
}
// Mit "any" wuerde sogar res.sendStatus(200) kompilieren - das gibt es aber
// nur in Express, nicht in node:http. Absturz erst zur Laufzeit.
```

```typescript
// BEST PRACTICE: genau EINE Stelle, an der geantwortet wird
import type { ServerResponse } from "node:http";

function sendeJson(antwort: ServerResponse, status: number, koerper: unknown): void {
  const text = JSON.stringify(koerper);
  antwort.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
  });
  antwort.end(text);
}
```

```typescript
// BEST PRACTICE: Body lesen, pruefen, antworten
interface Notiz {
  readonly id: number;
  readonly text: string;
}

const notizen: Notiz[] = [];

// Type Guard: erst nach dieser Pruefung ist "daten" eine Notiz-Eingabe.
function istNotizEingabe(wert: unknown): wert is { text: string } {
  if (typeof wert !== "object" || wert === null) return false;
  const kandidat = wert as { text?: unknown };
  return typeof kandidat.text === "string" && kandidat.text.trim() !== "";
}

async function handler(anfrage: IncomingMessage, antwort: ServerResponse): Promise<void> {
  const pfad = (anfrage.url ?? "/").split("?")[0] ?? "/";
  const methode = anfrage.method ?? "GET";

  if (methode === "POST" && pfad === "/notizen") {
    let daten: unknown;
    try {
      daten = JSON.parse(await leseBody(anfrage));
    } catch {
      sendeJson(antwort, 400, { fehler: "Body ist kein gueltiges JSON" });
      return;
    }
    if (!istNotizEingabe(daten)) {
      sendeJson(antwort, 400, { fehler: "Feld 'text' fehlt oder ist leer" });
      return;
    }
    const neu: Notiz = { id: notizen.length + 1, text: daten.text };
    notizen.push(neu);
    sendeJson(antwort, 201, neu);
    return;
  }

  sendeJson(antwort, 404, { fehler: `Kein Handler fuer ${methode} ${pfad}` });
}
```

```typescript
// So beendet sich das Beispiel selbst - Server starten, testen, schliessen
const server = createServer((anfrage, antwort) => {
  // createServer erwartet einen SYNCHRONEN Handler. Ein abgelehntes Promise
  // wuerde sonst den ganzen Prozess beenden - deshalb der .catch().
  handler(anfrage, antwort).catch((fehler: unknown) => {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    sendeJson(antwort, 500, { fehler: text });
  });
});

// Port 0 = "such dir einen freien Port" - so kollidiert nichts.
server.listen(0, "127.0.0.1", async () => {
  const antwort = await fetch("http://127.0.0.1:3000/notizen");
  console.log(antwort.status, await antwort.text());
  server.close();   // ohne diese Zeile laeuft das Skript ewig weiter
});
```

### ⚠️ Häufiger Fehler

Zweimal antworten. Der Fehler sieht harmlos aus:

```typescript
if (!gueltig) {
  sendeJson(antwort, 400, { fehler: "ungueltig" });
  // hier fehlt das return!
}
sendeJson(antwort, 200, { ok: true });
// Error [ERR_STREAM_WRITE_AFTER_END]: write after end
```

`res.end()` klebt den Umschlag zu – ein zweiter Schreibversuch wirft. Die
Gegenmaßnahme ist strukturell, nicht diszipliniert: **eine** zentrale
Antwortfunktion und nach jedem Aufruf konsequent ein `return`.

Der zweite Klassiker: Ein Skript, das nicht terminiert. Ein lauschender Server
hält den Node-Prozess absichtlich am Leben. Für einen echten Dienst ist das
genau richtig – für ein Beispiel oder einen Test brauchst du `server.close()`,
sonst hängt dein Terminal (oder deine CI) für immer.

Und drittens: Body-Größe ohne Limit. Wer den kompletten Stream ungeprüft in
den Speicher liest, lädt jeden Angreifer ein, den Prozess mit einem einzigen
Request umzubringen. Zähl die Bytes mit und brich ab etwa 1 MB mit Status 413 ab.

### 🎯 Übungsaufgabe

Erweitere den Server um die Route `GET /notizen/:id` (z. B. `/notizen/2`). Gibt
es die Notiz, antworte mit Status 200 und der Notiz; sonst mit 404 und
`{ "fehler": "Notiz nicht gefunden" }`. Achte darauf, dass eine nicht
numerische ID (`/notizen/abc`) sauber mit 400 beantwortet wird.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
if (methode === "GET" && pfad.startsWith("/notizen/")) {
  // split("/") auf "/notizen/2" ergibt ["", "notizen", "2"].
  // Wegen "noUncheckedIndexedAccess" ist [2] vom Typ "string | undefined" -
  // deshalb der Fallback statt eines "!".
  const rohId = pfad.split("/")[2] ?? "";
  const id = Number(rohId);

  // Number("") ist 0 und Number("abc") ist NaN - beides muessen wir abfangen.
  if (rohId === "" || !Number.isInteger(id)) {
    sendeJson(antwort, 400, { fehler: `Ungueltige ID: "${rohId}"` });
    return;
  }

  // find() gibt "Notiz | undefined" zurueck - der Compiler erzwingt die
  // Behandlung des Nichtgefunden-Falls. Genau der wird sonst vergessen.
  const gefunden = notizen.find((n) => n.id === id);
  if (gefunden === undefined) {
    sendeJson(antwort, 404, { fehler: "Notiz nicht gefunden" });
    return;
  }

  sendeJson(antwort, 200, gefunden);
  return;
}
```

Drei Dinge sind hier typisch TypeScript: der Fallback nach `split()` wegen
`noUncheckedIndexedAccess`, der erzwungene `undefined`-Zweig nach `find()` und
das `return` nach jeder Antwort. Das dritte verhindert `ERR_STREAM_WRITE_AFTER_END`
– und ist damit die einzige der drei Regeln, die dir nicht der Compiler,
sondern nur die Gewohnheit einbläut.

</details>

---

## 📋 Zusammenfassung & Cheat-Sheet

```typescript
// --- Module: exportieren ---------------------------------------------------
export const PI = 3.14;                     // named export
export function addiere(a: number, b: number): number { return a + b; }
export type Waehrung = "EUR" | "USD";       // Typ exportieren
export default logger;                      // genau EINER pro Datei
export { default as logger } from "./logger";   // im Barrel weiterreichen

// --- Module: importieren ---------------------------------------------------
import { addiere } from "./mathe";              // named
import { addiere as summe } from "./mathe";     // umbenannt
import logger from "./logger";                  // default (Name frei)
import logger, { LOG_PRAEFIX } from "./logger"; // beides
import type { Waehrung } from "./format";       // nur Typ - kein require()
import * as mathe from "./mathe";               // alles als Objekt

// --- Umgebung typsicher ----------------------------------------------------
process.env["PORT"];        // string | undefined  (Klammern sind Pflicht!)
// process.env.PORT;        // Fehler: noPropertyAccessFromIndexSignature
function leseUmgebungsvariable(k: string, fallback?: string): string { … }
const port = Number(process.env["PORT"] ?? "8080");
const debug = process.env["DEBUG"] === "true";   // NIE Boolean(...)
const erstesArg = process.argv[2] ?? "(keins)";  // noUncheckedIndexedAccess

// --- Node-Module mit Praefix -----------------------------------------------
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { argv, env } from "node:process";

// --- HTTP-Server -----------------------------------------------------------
const server = createServer((anfrage: IncomingMessage, antwort: ServerResponse) => {
  const pfad = (anfrage.url ?? "/").split("?")[0] ?? "/";
  antwort.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  antwort.end(JSON.stringify({ pfad }));       // NIE Strings zusammenkleben
});
server.listen(3000);
server.close();                                 // sonst terminiert nichts
```

| Frage | Antwort |
|---|---|
| Wozu `@types/node`? | `console`, `process`, `Buffer` sind kein JavaScript, sondern Node. Ohne die Typen kennt der Compiler diese Namen nicht. |
| `ts-node` oder `tsc`? | `ts-node` beim Entwickeln, `tsc` + `node dist/…` in Produktion. In CI immer zusätzlich `tsc --noEmit`. |
| Named oder default export? | Named ist der Standard. Default nur, wenn die Datei genau eine Sache ist. |
| Wann `import type`? | Immer, wenn du den Import nur für die Typprüfung brauchst – spart Laufzeit-Importe und entschärft Kreise. |
| Was macht `"module": "CommonJS"`? | Übersetzt dein `import` in `require()`. Dein Quelltext bleibt modern. |
| Wozu `esModuleInterop`? | Erlaubt `import x from "alte-lib"` bei Paketen mit `module.exports = …`. |
| Wann `"type": "module"`? | Bei neuen ESM-Projekten. Dieses Repo bleibt bewusst bei CommonJS – jedes Beispiel läuft ohne Zusatzschalter. |
| Barrel-File – ja oder nein? | Eins pro fachlichem Ordner. Nie eins über dem ganzen Projekt, nie innerhalb desselben Ordners importieren. |
| Welchen Typ hat `process.env["X"]`? | `string \| undefined` – und immer ein String, nie eine Zahl. |
| Warum `process.env["PORT"]` statt `.PORT`? | `ProcessEnv` ist eine Index-Signatur. Die Klammer zeigt: hier wird gesucht, nicht zugegriffen. |
| `DEBUG=false` auswerten? | `=== "true"` vergleichen. `Boolean("false")` ist `true`. |
| Warum terminiert mein Server-Skript nicht? | Ein lauschender Server hält den Prozess am Leben. `server.close()` beendet ihn. |

---

← [Kursübersicht](../README.md) | [Modul 3: Unter der Haube](../modul-3-fortgeschritten/README.md) | [Modul 5: Werkzeuge & Workflow](../modul-5-werkzeuge-workflow/README.md) →
