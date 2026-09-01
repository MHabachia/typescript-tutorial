# Modul 8: Deployment & Produktion (Profi+)

Bisher lief dein Code auf deinem Rechner. Jetzt geht er auf Reisen: Dieses
Modul zeigt dir, wie aus TypeScript ein lauffähiges Artefakt wird, wie du es
konfigurierst, in ein Container-Image packst und in Produktion am Leben hältst.

## 🎯 Lernziele

Nach diesem Modul kannst du:

- erklären, was `tsc` aus deinem Projekt macht und was genau im `dist/`-Ordner landet
- `npm run build` und `npm run start:prod` in diesem Repo einordnen und selbst ausführen
- sauber zwischen `dependencies` und `devDependencies` trennen und in Produktion mit `npm ci --omit=dev` installieren
- Umgebungsvariablen **einmal** beim Start prüfen und danach als typisiertes, `readonly` Konfigurationsobjekt weiterreichen
- Source Maps aktivieren und einen Produktions-Stacktrace bis zur richtigen `.ts`-Zeile zurückverfolgen
- ein Docker-Image mit Multi-Stage-Build erzeugen, das nur `dist/` und Produktionsabhängigkeiten enthält
- deinen Dienst per SIGTERM sauber herunterfahren und eine Go-Live-Checkliste abarbeiten

## Inhalt

- [8.1 Vom TypeScript zum lauffähigen JavaScript](#81-vom-typescript-zum-lauffähigen-javascript)
- [8.2 `dependencies` vs. `devDependencies`](#82-dependencies-vs-devdependencies)
- [8.3 Konfiguration & Umgebungsvariablen](#83-konfiguration--umgebungsvariablen)
- [8.4 Source Maps & Fehlersuche in Produktion](#84-source-maps--fehlersuche-in-produktion)
- [8.5 Docker: Multi-Stage-Build](#85-docker-multi-stage-build)
- [8.6 Go-Live-Checkliste](#86-go-live-checkliste)
- [📋 Zusammenfassung & Cheat-Sheet](#-zusammenfassung--cheat-sheet)

**Lauffähige Beispiele:** [`beispiele/`](./beispiele/)

| Datei | Thema |
|---|---|
| [`01-konfiguration-laden.ts`](./beispiele/01-konfiguration-laden.ts) | Umgebungsvariablen prüfen, Fail-Fast, `readonly` Konfiguration |
| [`02-graceful-shutdown.ts`](./beispiele/02-graceful-shutdown.ts) | HTTP-Server sauber per SIGTERM herunterfahren |
| [`Dockerfile.beispiel`](./beispiele/Dockerfile.beispiel) | Multi-Stage-Build als kommentierte Referenz |

---

## 8.1 Vom TypeScript zum lauffähigen JavaScript

### Theorie

Node.js kennt kein TypeScript. Was du in Produktion startest, ist **immer**
JavaScript. Der Übersetzer heißt `tsc`, und er ist erstaunlich unspektakulär:
Er liest `tsconfig.json`, sammelt alle Dateien aus `include`, prüft die Typen –
und schreibt daneben das fertige JavaScript.

Drei Optionen aus unserer [`tsconfig.json`](../tsconfig.json) steuern, wohin:

| Option | Wert hier | Bedeutung |
|---|---|---|
| `rootDir` | `.` | Wo dein Quellcode beginnt. |
| `outDir` | `./dist` | Wohin das Kompilat geschrieben wird. |
| `sourceMap` | `true` | Zusätzlich `.js.map`-Dateien erzeugen (siehe 8.4). |

Die Ordnerstruktur unter `rootDir` wird dabei **eins zu eins** nach `outDir`
gespiegelt. Aus `modul-8-deployment/beispiele/01-konfiguration-laden.ts` wird
also `dist/modul-8-deployment/beispiele/01-konfiguration-laden.js` – plus die
zugehörige `.js.map`.

Denk an ein Kuchenrezept: `rootDir` ist deine Küche, `outDir` die
Kuchenplatte. Auf der Platte liegt der Kuchen – nicht Mehl, Schüssel und
Rührgerät. Genau deshalb gehört `dist/` **nicht ins Git**:

- Es ist ein **Ergebnis**, kein Quelltext. Jeder kann es jederzeit neu erzeugen.
- Es erzeugt bei jedem Commit riesige, unlesbare Diffs.
- Es lädt zum schlimmsten aller Fehler ein: dass jemand das kompilierte `.js`
  bearbeitet und die Änderung beim nächsten Build wieder verschwindet.

In unserer [`.gitignore`](../.gitignore) steht `dist/` deshalb ganz oben.

Zwei Skripte in diesem Repo sind für Produktion relevant:

- `npm run build` → ist exakt `tsc`. Kompiliert alles nach `dist/`.
- `npm run start:prod` → ist `node dist/modul-9-abschlussprojekt/todo-app/server.js`.
  Reines Node, kein TypeScript, kein ts-node.

Die Reihenfolge ist keine Geschmacksfrage: **erst bauen, dann starten.**

### Code-Beispiele

```bash
# 1) Bauen: erzeugt bzw. aktualisiert den Ordner dist/
npm run build

# 2) Ergebnis anschauen
ls dist/modul-8-deployment/beispiele/
# 01-konfiguration-laden.js
# 01-konfiguration-laden.js.map
# 02-graceful-shutdown.js
# 02-graceful-shutdown.js.map

# 3) Starten - mit purem Node, ohne jeden TypeScript-Anteil
npm run start:prod

# Eine einzelne kompilierte Datei laesst sich genauso starten:
node dist/modul-8-deployment/beispiele/01-konfiguration-laden.js
```

```json
// tsconfig.json - die drei Zeilen, um die es in 8.1 geht
{
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist",
    "sourceMap": true
  },
  "include": ["modul-*/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

```typescript
// Was uebrig bleibt: aus diesem TypeScript ...
const port: number = 3000;
export function starte(kfg: { readonly port: number }): string {
  return `Port ${kfg.port}`;
}
console.log(starte({ port }));

// ... wird ungefaehr dieses JavaScript in dist/:
//   "use strict";
//   Object.defineProperty(exports, "__esModule", { value: true });
//   exports.starte = starte;
//   const port = 3000;
//   function starte(kfg) { return `Port ${kfg.port}`; }
//   console.log(starte({ port }));
//
// Alle Typen sind spurlos verschwunden. Sie waren nur fuer den Compiler da.
```

### ⚠️ Häufiger Fehler

Der Dauerbrenner ist ein **veraltetes `dist/`**. Du änderst eine `.ts`-Datei,
startest `npm run start:prod` – und siehst das alte Verhalten. Kein Fehler,
keine Warnung, nur Verwirrung.

Genauso tückisch: gelöschte Quelldateien. `tsc` räumt in `dist/` **nicht**
auf. Löschst du `alt.ts`, bleibt `dist/alt.js` liegen und wird munter weiter
importiert. Wenn etwas unerklärlich ist, hilft der große Reset:

```bash
rm -rf dist && npm run build
```

Und wenn du in IntelliJ IDEA plötzlich Dateien doppelt in der Suche findest:
Markiere `dist/` per Rechtsklick als *Excluded*, dann verschwindet das
Kompilat aus Suche und Autovervollständigung.

### 🎯 Übungsaufgabe

Baue das Projekt, finde heraus, welche Datei aus
`modul-8-deployment/beispiele/02-graceful-shutdown.ts` entsteht, und starte sie
mit reinem `node`. Beantworte danach: Warum funktioniert das, obwohl Node
TypeScript gar nicht kennt?

<details>
<summary>💡 Lösung anzeigen</summary>

```bash
npm run build

# rootDir "." wird nach outDir "./dist" gespiegelt - der Pfad bleibt gleich,
# nur die Endung wechselt von .ts auf .js:
node dist/modul-8-deployment/beispiele/02-graceful-shutdown.js
```

Es funktioniert, weil die Datei zu diesem Zeitpunkt **kein TypeScript mehr
ist**. `tsc` hat alle Typannotationen entfernt und übrig blieb gültiges
ES2022-JavaScript im CommonJS-Format – genau das, was Node.js versteht.

Ein Gegentest macht es endgültig klar:

```bash
node modul-8-deployment/beispiele/02-graceful-shutdown.ts
# Node scheitert an der TypeScript-Syntax - genau deshalb bauen wir vorher.
```

</details>

---

## 8.2 `dependencies` vs. `devDependencies`

### Theorie

In der `package.json` gibt es zwei Listen für Abhängigkeiten, und der
Unterschied ist einfacher, als viele denken:

> **`dependencies`**: Was dein Programm braucht, *während es läuft*.
> **`devDependencies`**: Was *du* brauchst, um es zu bauen und zu prüfen.

Die Frage lautet immer: *"Wird dieses Paket noch gebraucht, nachdem `dist/`
fertig ist?"* Ist die Antwort nein, gehört es in `devDependencies`.

Wirf einen Blick in unsere [`package.json`](../package.json): Dort stehen
`typescript`, `ts-node`, `eslint`, `typescript-eslint` und `@types/node`
allesamt unter `devDependencies`. Zu Recht:

| Paket | Warum devDependency? |
|---|---|
| `typescript` | Der Compiler. Nach dem Build nutzlos. |
| `ts-node` | Führt `.ts` direkt aus – in Produktion gibt es keine `.ts`. |
| `eslint` / `typescript-eslint` | Prüfen Quellcode, nicht Kompilat. |
| `@types/*` | Reine Typinformationen. Im JavaScript existieren sie nicht. |

Der Nutzen zeigt sich beim Installieren in Produktion:

```bash
npm ci --omit=dev
```

`npm ci` (für *clean install*) installiert **exakt** die Versionen aus
`package-lock.json`, löscht `node_modules` vorher und bricht ab, wenn Lockfile
und `package.json` nicht zusammenpassen. `--omit=dev` lässt die
devDependencies weg. Ergebnis: schnellere, reproduzierbare Installationen und
ein deutlich kleineres Image.

Warum das mehr ist als Sparsamkeit: Jedes Paket im Produktionsimage ist
potenzielle Angriffsfläche. Ein Compiler, der Code erzeugen und ausführen
kann, ist auf einem Produktionsserver ein Werkzeug, das du einem Angreifer
schenkst. **Was nicht da ist, kann nicht ausgenutzt werden.**

Und deshalb hat `ts-node` in Produktion nichts zu suchen: Es kompiliert bei
jedem Start neu (langsamer Start, mehr Speicher), es überspringt Typfehler je
nach Konfiguration stillschweigend, und es zwingt dich, den kompletten
Quellcode plus Compiler auszuliefern. `ts-node` ist ein Entwicklungswerkzeug –
so wie ein Schraubenzieher: unverzichtbar beim Zusammenbauen des Schranks,
aber du klebst ihn nicht an die Schranktür.

### Code-Beispiele

```bash
# Etwas installieren, das zur LAUFZEIT gebraucht wird:
npm install express

# Etwas installieren, das nur beim ENTWICKELN gebraucht wird:
npm install --save-dev typescript ts-node eslint @types/node

# Produktionsinstallation (im Docker-Image, auf dem Server, in der CI):
npm ci --omit=dev

# Gegenprobe: was wuerde in Produktion landen?
npm ls --omit=dev --depth=0
```

```json
// package.json - der Auszug, um den es geht
{
  "scripts": {
    "build": "tsc",
    "start:prod": "node dist/modul-9-abschlussprojekt/todo-app/server.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "devDependencies": {
    "@types/node": "^26.4.0",
    "eslint": "^9.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^6.0.3",
    "typescript-eslint": "^8.0.0"
  }
}
```

```bash
# Falsch - so startet man in Produktion NICHT:
npx ts-node modul-9-abschlussprojekt/todo-app/server.ts

# Richtig - vorher bauen, dann pures Node:
npm run build
npm run start:prod
```

### ⚠️ Häufiger Fehler

Der teuerste Fehler passiert leise: Du installierst ein Paket, das zur
Laufzeit gebraucht wird, versehentlich mit `--save-dev`. Lokal merkst du
nichts – dort sind ja alle Pakete da. Erst im Container, nach `npm ci
--omit=dev`, kracht es:

```
Error: Cannot find module 'express'
```

Der Fehler taucht also erst beim Deployment auf, nicht beim Entwickeln. Deshalb
lohnt sich in der CI ein Testlauf mit exakt der Produktionsinstallation.

Der umgekehrte Fehler ist harmloser, aber verbreitet: `@types/...` unter
`dependencies`. Typpakete enthalten null Zeilen ausführbaren Code – sie
blähen das Image nur auf.

### 🎯 Übungsaufgabe

Ein Team liefert diese `package.json` aus. Sortiere die Abhängigkeiten neu und
begründe jede Verschiebung.

```json
{
  "dependencies": {
    "express": "^5.0.0",
    "typescript": "^6.0.3",
    "@types/express": "^5.0.0",
    "dotenv": "^17.0.0",
    "eslint": "^9.0.0"
  }
}
```

<details>
<summary>💡 Lösung anzeigen</summary>

```json
{
  "dependencies": {
    "express": "^5.0.0",
    "dotenv": "^17.0.0"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "@types/express": "^5.0.0",
    "eslint": "^9.0.0"
  }
}
```

Begründung, Paket für Paket:

- **`express`** – wird zur Laufzeit per `require` geladen. Ohne das Paket
  startet der Server nicht. Bleibt `dependency`.
- **`dotenv`** – lädt beim Start eine `.env`-Datei. Läuft also zur Laufzeit.
  Bleibt `dependency`. (In Docker/Kubernetes wirst du es oft gar nicht
  brauchen, weil die Plattform die Variablen selbst setzt.)
- **`typescript`** – der Compiler. Nach `npm run build` nicht mehr nötig.
- **`@types/express`** – reine Typinformationen, im Kompilat nicht vorhanden.
- **`eslint`** – prüft Quellcode, der im Image gar nicht mehr liegt.

Prüfen lässt sich das Ergebnis so:

```bash
rm -rf node_modules
npm ci --omit=dev
npm run start:prod   # muss laufen - sonst fehlt eine echte dependency
```

</details>

---

## 8.3 Konfiguration & Umgebungsvariablen

### Theorie

Dieselbe Anwendung läuft auf deinem Laptop, in der Testumgebung und in
Produktion – mit anderer Datenbank, anderem Port, anderen Schlüsseln. Diese
Unterschiede gehören **nicht** in den Code, sondern in Umgebungsvariablen. So
baust du das Artefakt genau einmal und startest es überall.

Node.js reicht sie dir über `process.env`. Und dort beginnt das Problem:

```typescript
const port = process.env["PORT"];
//    ^ Typ: string | undefined
```

`process.env` ist ein Briefkasten. Alles darin ist ein **Zettel** – nie eine
Zahl, nie ein `boolean`, und nie garantiert vorhanden. Wegen
`noPropertyAccessFromIndexSignature` schreibst du in diesem Kurs außerdem
`process.env["PORT"]` statt `process.env.PORT`; die Klammerschreibweise macht
sichtbar, dass hier ein Nachschlagen stattfindet, das auch danebengehen kann.

Daraus folgt ein Muster, das sich in jedem ernsthaften Node-Dienst findet:

1. **Einmal beim Start lesen.** Nicht verstreut, sondern in genau einer
   Funktion.
2. **Sofort prüfen und umwandeln.** Pflichtwerte einfordern, Zahlen parsen,
   Auswahlwerte gegen einen Union-Typ prüfen.
3. **Fail Fast.** Fehlt etwas, wirf einen aussagekräftigen Fehler und beende
   den Start. Ein Dienst, der nicht startet, ist ein *gutes* Signal.
4. **Danach nur noch das typisierte `readonly` Objekt weiterreichen.** Tief im
   Code taucht `process.env` nie wieder auf.

Der Unterschied ist der zwischen einer Rauchmelderbatterie, die du beim
Einzug prüfst, und einer, die du erst beim Brand testest.

Zum Thema Geheimnisse: Passwörter, Tokens und Schlüssel gehören **nie** ins
Repository – auch nicht "nur kurz" und auch nicht auskommentiert. Git
vergisst nichts; ein einmal committetes Geheimnis gilt als kompromittiert und
muss ausgetauscht werden. Deshalb steht `.env` in unserer `.gitignore`, und
deshalb liefert man stattdessen eine `.env.example` **ohne Werte** mit.

### Code-Beispiele

```typescript
// So NICHT: ungeprueft, ueberall verstreut, still falsch
const port = Number(process.env["PORT"]) || 3000;      // "achttausend" -> 3000
const dbUrl = process.env["DATENBANK_URL"] ?? "";      // leer -> kracht spaeter
```

```typescript
// So: eine Ladefunktion, ein readonly Objekt.
interface AppKonfiguration {
  readonly umgebung: "development" | "production" | "test";
  readonly port: number;
  readonly datenbankUrl: string;
}

function lesePflicht(schluessel: string): string {
  const wert = process.env[schluessel];
  if (wert === undefined || wert.trim() === "") {
    throw new Error(`Pflicht-Umgebungsvariable "${schluessel}" fehlt.`);
  }
  return wert;
}

function leseZahl(schluessel: string, standard: number): number {
  const roh = process.env[schluessel];
  if (roh === undefined || roh.trim() === "") {
    return standard;
  }
  const zahl = Number(roh);
  if (!Number.isInteger(zahl) || zahl <= 0) {
    throw new Error(`"${schluessel}" muss eine positive Ganzzahl sein: "${roh}".`);
  }
  return zahl;
}

// Object.freeze schuetzt zusaetzlich zur Laufzeit - "readonly" gilt nur
// beim Kompilieren.
function ladeKonfiguration(): AppKonfiguration {
  return Object.freeze({
    umgebung: "production" as const,
    port: leseZahl("PORT", 3000),
    datenbankUrl: lesePflicht("DATENBANK_URL"),
  });
}
```

```bash
# Beim Start setzt die Umgebung die Werte - nicht der Code:
NODE_ENV=production PORT=8080 DATENBANK_URL=postgres://... npm run start:prod

# Docker macht dasselbe mit -e:
docker run --rm -p 3000:3000 -e PORT=3000 -e DATENBANK_URL=postgres://... meinimage:1.0.0
```

Das vollständige, lauffähige Beispiel mit Erfolgs- und Fehlerfall findest du
in [`beispiele/01-konfiguration-laden.ts`](./beispiele/01-konfiguration-laden.ts).

### ⚠️ Häufiger Fehler

Der Klassiker ist `||` statt einer echten Prüfung:

```typescript
const port = Number(process.env["PORT"]) || 3000;
```

Drei Dinge gehen hier schief. `PORT=achttausend` ergibt `NaN`, und `NaN` ist
falsy – der Tippfehler wird lautlos zu `3000`. `PORT=0` wird ebenfalls zu
`3000`. Und wenn `PORT` gar nicht gesetzt ist, erfährst du das nie.

Der zweite Klassiker ist ein `as`-Cast auf Konfigurationsdaten:

```typescript
const kfg = process.env as unknown as AppKonfiguration; // eine Lüge
```

`as` prüft nichts. Du behauptest gegenüber dem Compiler, dass `port` eine Zahl
sei – zur Laufzeit ist es weiterhin ein String oder `undefined`. Genau dafür
schreibst du die Ladefunktion.

### 🎯 Übungsaufgabe

Erweitere eine Ladefunktion um den Wert `LOG_LEVEL`. Erlaubt sind nur
`"debug"`, `"info"` und `"error"`; ohne Angabe gilt `"info"`. Alles andere
muss den Start mit einer klaren Meldung abbrechen. Der Rückgabetyp soll der
enge Union-Typ sein, nicht `string`.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
type LogLevel = "debug" | "info" | "error";

function leseLogLevel(): LogLevel {
  const roh = process.env["LOG_LEVEL"] ?? "info";

  // Ein Array vom Typ "readonly LogLevel[]" plus find() macht aus dem
  // freien String einen echten Union-Wert - ganz ohne "as".
  const erlaubt: readonly LogLevel[] = ["debug", "info", "error"];
  const treffer = erlaubt.find((kandidat) => kandidat === roh);

  if (treffer === undefined) {
    throw new Error(
      `LOG_LEVEL muss einer von [${erlaubt.join(", ")}] sein, war aber "${roh}".`
    );
  }
  return treffer; // Typ: LogLevel
}

process.env["LOG_LEVEL"] = "debug";
console.log(leseLogLevel()); // "debug"

delete process.env["LOG_LEVEL"];
console.log(leseLogLevel()); // "info" (Standardwert)

process.env["LOG_LEVEL"] = "gespraechig";
try {
  leseLogLevel();
} catch (fehler) {
  // useUnknownInCatchVariables: erst pruefen, dann benutzen
  console.log(fehler instanceof Error ? fehler.message : String(fehler));
  // LOG_LEVEL muss einer von [debug, info, error] sein, war aber "gespraechig".
}
```

Der Trick ist `find()`: Es liefert `LogLevel | undefined`, also genau den
engen Typ. Ein `as LogLevel` hätte den Tippfehler durchgewinkt.

</details>

---

## 8.4 Source Maps & Fehlersuche in Produktion

### Theorie

In Produktion läuft `dist/…/server.js`. Wenn dort etwas explodiert, zeigt der
Stacktrace zunächst auf eine JavaScript-Zeile, die du nie geschrieben hast.
Bei kompiliertem Code stimmen die Zeilennummern selten mit deinem TypeScript
überein.

Die Brücke zurück heißt **Source Map**. Sie ist eine Übersetzungstabelle
zwischen Kompilat und Quelltext: "Zeile 47 in `server.js` ist Zeile 31 in
`server.ts`". Aktiviert wird sie mit einer Zeile in der `tsconfig.json` – bei
uns steht sie schon drin:

```json
"sourceMap": true
```

Beim Build entsteht dann neben jeder `.js`-Datei eine `.js.map`. Damit Node
sie auch benutzt, brauchst du zwei Dinge:

1. Die `.js.map`-Dateien müssen **mit ausgeliefert** werden (also mit ins
   Docker-Image – unser [`Dockerfile.beispiel`](./beispiele/Dockerfile.beispiel)
   kopiert den ganzen `dist/`-Ordner, damit das automatisch passiert).
2. Node muss sie lesen: Ab Node 20 genügt `--enable-source-maps`.

Der zweite Teil guter Fehlersuche ist die **Logausgabe**. `console.log` ist
beim Entwickeln bequem und in Produktion ein Problem: Die Ausgaben landen
unstrukturiert im Textstrom, ohne Zeitstempel, ohne Schweregrad, ohne
Zusammenhang. Suche einmal in 40.000 Zeilen nach `"hier"`.

Produktionslogs schreibt man deshalb als **eine JSON-Zeile pro Ereignis**.
Maschinen können sie filtern, Menschen können sie trotzdem lesen. Denk an ein
Fahrtenbuch statt an Zettel auf dem Armaturenbrett.

Drei Regeln, die dir viel Ärger sparen:

- **Nach stdout**, nicht in eine Datei. Der Container-Betreiber sammelt ein.
- **Immer den ganzen Fehler loggen** (`fehler.stack`), nicht nur `fehler.message`.
- **Nie Geheimnisse loggen.** Passwörter, Tokens, komplette Request-Bodies –
  einmal im Log, für immer im Log.

### Code-Beispiele

```bash
# Bauen (sourceMap: true erzeugt die .map-Dateien automatisch)
npm run build
ls dist/modul-8-deployment/beispiele/*.map

# Starten MIT Source-Map-Aufloesung:
node --enable-source-maps dist/modul-9-abschlussprojekt/todo-app/server.js

# Dauerhaft fuer alle Node-Prozesse im Container:
NODE_OPTIONS=--enable-source-maps node dist/modul-9-abschlussprojekt/todo-app/server.js
```

```text
# Ohne Source Map - zeigt auf Code, den du nie geschrieben hast:
Error: Datenbank nicht erreichbar
    at pruefeVerbindung (/app/dist/modul-9-.../server.js:118:15)

# Mit --enable-source-maps - zeigt auf DEINE Zeile:
Error: Datenbank nicht erreichbar
    at pruefeVerbindung (/app/modul-9-.../server.ts:64:11)
```

```typescript
// ANTI-PATTERN: console.log-Wildwuchs
// console.log("hier");
// console.log("user", benutzer); // enthaelt womoeglich das Passwort-Hash

// BEST PRACTICE: eine strukturierte Zeile pro Ereignis
type LogStufe = "debug" | "info" | "error";

function log(stufe: LogStufe, nachricht: string, daten: Record<string, unknown> = {}): void {
  const eintrag = {
    zeit: new Date().toISOString(),
    stufe,
    nachricht,
    ...daten,
  };
  // Eine Zeile, gueltiges JSON - direkt nach stdout.
  console.log(JSON.stringify(eintrag));
}

log("info", "Server gestartet", { port: 3000, umgebung: "production" });
// {"zeit":"2026-08-31T10:00:00.000Z","stufe":"info","nachricht":"Server gestartet","port":3000,"umgebung":"production"}

try {
  throw new Error("Datenbank nicht erreichbar");
} catch (fehler) {
  // Immer den Stack mitgeben - er ist mit Source Maps Gold wert.
  log("error", "Startfehler", {
    fehler: fehler instanceof Error ? fehler.stack : String(fehler),
  });
}
```

### ⚠️ Häufiger Fehler

Der häufigste Fehler ist, `sourceMap: true` zu setzen und die `.map`-Dateien
dann beim Deployment wegzuoptimieren – etwa durch ein `COPY` nur der
`.js`-Dateien oder einen "Aufräumschritt", der `*.map` löscht. Ohne die
Tabelle nützt die beste Option nichts.

Der zweitgrößte: `catch (fehler) { console.log(fehler.message); }`. Die
Nachricht allein sagt dir *was* passiert ist, aber nie *wo*. Genau die
Information, für die du die Source Maps aktiviert hast, wirfst du damit weg.

Ein Hinweis zum Web: Bei **Browser**-Code lädt man Source Maps üblicherweise
nicht öffentlich aus, weil sie den kompletten Quelltext offenlegen. Bei
Server-Code ist das kein Thema – dort ist das Image ohnehin dein Code.

### 🎯 Übungsaufgabe

Schreibe eine Funktion `protokolliereFehler(fehler: unknown, kontext:
Record<string, unknown>)`, die eine einzige JSON-Zeile nach `stderr` schreibt.
Sie muss auch mit Werten umgehen, die gar keine `Error`-Instanz sind (z. B.
einem geworfenen String) – und darf niemals selbst eine Exception werfen.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
function protokolliereFehler(
  fehler: unknown,
  kontext: Record<string, unknown> = {}
): void {
  // "fehler" ist unknown - also Fall fuer Fall aufloesen.
  const details =
    fehler instanceof Error
      ? { name: fehler.name, nachricht: fehler.message, stack: fehler.stack }
      : { name: "UnbekannterFehler", nachricht: String(fehler) };

  const eintrag = {
    zeit: new Date().toISOString(),
    stufe: "error",
    ...details,
    ...kontext,
  };

  try {
    console.error(JSON.stringify(eintrag));
  } catch {
    // JSON.stringify kann an zyklischen Strukturen scheitern. Ein Logger,
    // der den Prozess mitreisst, ist schlimmer als ein unvollstaendiges Log.
    console.error(`{"stufe":"error","nachricht":"Log nicht serialisierbar"}`);
  }
}

protokolliereFehler(new Error("Timeout"), { anfrageId: "abc-123" });
protokolliereFehler("etwas ist schiefgelaufen", { anfrageId: "abc-124" });

const zyklisch: Record<string, unknown> = {};
zyklisch["selbst"] = zyklisch;
protokolliereFehler(new Error("mit Zyklus"), zyklisch); // wirft trotzdem nicht
```

Zwei Punkte sind entscheidend: `unknown` zwingt dich, den Nicht-`Error`-Fall
zu behandeln, und das `try`/`catch` um `JSON.stringify` verhindert, dass
ausgerechnet die Fehlerbehandlung deinen Dienst abschießt.

</details>

---

## 8.5 Docker: Multi-Stage-Build

### Theorie

Ein Container-Image ist ein Paket, das alles enthält, was dein Dienst zum
Laufen braucht: Betriebssystembasis, Node.js, deine Dateien. Es läuft auf
jedem Rechner gleich – das ist der eigentliche Gewinn.

Naiv gebaut wird dieses Paket allerdings riesig: Quellcode, TypeScript-
Compiler, ESLint, alle `@types`, dazu der npm-Cache. Ein Umzugskarton, in dem
neben dem Schrank auch noch Schraubenzieher, Verpackungsmaterial und der
Bauplan liegen.

Der **Multi-Stage-Build** löst das mit einer einfachen Idee: zwei Bauabschnitte
in einer Datei.

| Stage | Enthält | Zweck |
|---|---|---|
| `build` | Quellcode + alle Abhängigkeiten + `tsc` | kompiliert nach `dist/` |
| `runtime` | `dist/` + Produktionsabhängigkeiten | startet den Dienst |

Die zweite Stage beginnt bei **null**. Alles aus der ersten ist verschwunden –
außer dem, was du dir explizit mit `COPY --from=build` herüberholst. Die
Werkstatt bleibt draußen, im Verkaufsraum steht nur das Möbelstück.

Das bringt dir zweierlei:

- **Klein**: Statt Hunderten Megabyte Quellcode und Werkzeugen liegt nur das
  Kompilat im Image. Kleine Images werden schneller verteilt und gestartet.
- **Sicherer**: Weniger Pakete heißt weniger bekannte Schwachstellen. Und ein
  Angreifer, der es in den Container schafft, findet dort weder deinen
  Quellcode noch einen Compiler vor.

Dazu gehört immer eine **`.dockerignore`**. Sie funktioniert wie `.gitignore`,
nur für den Build-Kontext – also für alles, was Docker überhaupt erst
zugeschickt bekommt. Ohne sie wandert dein lokales `node_modules` (falsche
Architektur, riesig) und womöglich deine `.env` mit in den Build.

Die vollständige, Zeile für Zeile kommentierte Referenz liegt in
[`beispiele/Dockerfile.beispiel`](./beispiele/Dockerfile.beispiel).

### Code-Beispiele

```dockerfile
# Das Prinzip in Kurzform - die ausfuehrliche Fassung steht in
# beispiele/Dockerfile.beispiel

# ---- Stage 1: bauen ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                       # ALLE Abhaengigkeiten, inkl. tsc
COPY . .
RUN npm run typecheck && npm run build

# ---- Stage 2: laufen ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev            # nur Produktionsabhaengigkeiten
COPY --from=build /app/dist ./dist
USER node                        # nicht als root laufen
EXPOSE 3000
CMD ["node", "dist/modul-9-abschlussprojekt/todo-app/server.js"]
```

```text
# .dockerignore im Projektwurzelverzeichnis
node_modules/
dist/
.git/
.idea/
.env
*.log
Dockerfile
.dockerignore
```

```bash
# Bauen, ansehen, starten
docker build -t typescript-tutorial:1.0.0 .
docker images typescript-tutorial      # Groesse pruefen
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production -e PORT=3000 \
  -e DATENBANK_URL=postgres://app:geheim@db:5432/shop \
  typescript-tutorial:1.0.0

# Gegenprobe: liegt wirklich kein TypeScript im Image?
docker run --rm typescript-tutorial:1.0.0 sh -c "find / -name '*.ts' -not -path '*/node_modules/*' | head"
```

### ⚠️ Häufiger Fehler

Fehler Nummer eins: **`COPY . .` vor `npm ci`**. Dann ändert sich der
Build-Kontext bei jeder Codezeile, Dockers Layer-Cache wird ungültig, und jede
Änderung an einem Kommentar kostet dich eine komplette Neuinstallation aller
Pakete. Erst `package.json` und `package-lock.json` kopieren, dann
installieren, dann den Rest kopieren.

Fehler Nummer zwei: **`CMD node dist/server.js`** in Shell-Form. Docker startet
dann eine Shell als PID 1, und dein Node-Prozess bekommt das SIGTERM nie zu
sehen – der Graceful Shutdown aus 8.6 läuft nie an, nach 10 Sekunden folgt
SIGKILL. Nimm immer die Array-Form: `CMD ["node", "dist/server.js"]`.

Fehler Nummer drei: **`FROM node:latest`**. Heute grün, morgen kaputt, ohne
dass jemand etwas geändert hat. Nagle die Version fest.

### 🎯 Übungsaufgabe

Dieses Dockerfile funktioniert – ist aber in vier Punkten schlecht. Finde sie
und schreibe es neu.

```dockerfile
FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD npm run start:prod
```

<details>
<summary>💡 Lösung anzeigen</summary>

Die vier Probleme:

1. **`node:latest`** – nicht reproduzierbar. Version festnageln.
2. **Eine einzige Stage** – Compiler, ESLint, `@types` und der komplette
   Quellcode landen im Produktionsimage.
3. **`COPY . .` vor der Installation** – zerstört den Layer-Cache; außerdem
   ist `npm install` nicht reproduzierbar (nimm `npm ci`).
4. **`CMD` in Shell-Form** – `npm` wird PID 1, SIGTERM erreicht Node nicht.
   Zusätzlich läuft alles als `root`.

Besser:

```dockerfile
# ---- Stage 1: bauen ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run typecheck && npm run build

# ---- Stage 2: laufen ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/modul-9-abschlussprojekt/todo-app/server.js"]
```

Und die dazugehörige `.dockerignore` nicht vergessen – sonst schiebst du
`node_modules/` und vielleicht deine `.env` in den Build-Kontext.

</details>

---

## 8.6 Go-Live-Checkliste

### Theorie

Piloten sind nicht deshalb sicher unterwegs, weil sie alles auswendig können,
sondern weil sie vor jedem Start dieselbe Liste abhaken. Für ein Deployment
gilt dasselbe. Die folgende Liste ist deine.

**Qualitätstore in der CI.** `tsc --noEmit` prüft die Typen, ohne etwas zu
schreiben – das perfekte Tor vor jedem Merge. In diesem Repo liegt es als
`npm run typecheck` bereit, dazu `npm run lint`. Bricht eines ab, wird nicht
ausgeliefert. Ein roter Build kostet Minuten, ein kaputtes Deployment Stunden.

**Graceful Shutdown.** Bei SIGTERM: keine neuen Anfragen annehmen, laufende
zu Ende bedienen, Ressourcen schließen, dann enden. Details und ein
lauffähiges Beispiel findest du in
[`beispiele/02-graceful-shutdown.ts`](./beispiele/02-graceful-shutdown.ts).

**Health-Endpoint.** Ein `GET /health`, das ohne Authentifizierung mit `200`
antwortet – und während des Herunterfahrens mit `503`. Loadbalancer und
Orchestrierer entscheiden daran, ob sie Verkehr zu dir schicken. Wichtig:
Der Endpoint soll *schnell* sein und keine schweren Abfragen auslösen.

**Node-Version festnageln.** Im `engines`-Feld der `package.json` legst du
fest, worauf dein Code laufen darf. Zusammen mit einem festen Basis-Image
(`node:22-alpine`) läuft überall dieselbe Laufzeit.

**Abhängigkeiten aktuell halten.** `npm audit` und `npm outdated` gehören in
den Wochenrhythmus. Sicherheitslücken repariert man, bevor jemand sie findet –
nicht danach.

### Code-Beispiele

```bash
# Die Qualitaetstore - genau so laufen sie in der CI:
npm ci
npm run typecheck        # tsc --noEmit: prueft Typen, schreibt nichts
npm run lint             # eslint .
npm run build            # erst wenn beides gruen ist

# Sicherheit und Aktualitaet
npm audit --omit=dev
npm outdated
```

```json
// package.json: Laufzeit festnageln
{
  "engines": {
    "node": ">=22.0.0 <23.0.0",
    "npm": ">=10.0.0"
  }
}
```

```yaml
# Minimaler CI-Ablauf (GitHub Actions) - dieselben drei Tore
name: CI
on: [push, pull_request]
jobs:
  pruefen:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
```

Und hier die eigentliche Liste zum Abhaken:

**Vor dem Go-Live**

- [ ] `npm run typecheck` (`tsc --noEmit`) läuft fehlerfrei durch
- [ ] `npm run lint` läuft fehlerfrei durch
- [ ] `npm run build` erzeugt ein frisches `dist/` (vorher `rm -rf dist`)
- [ ] `dist/`, `node_modules/` und `.env` sind in `.gitignore` **und** `.dockerignore`
- [ ] Kein Geheimnis im Repo – auch nicht in der Git-Historie
- [ ] Alle Laufzeitpakete stehen in `dependencies`, alle Werkzeuge in `devDependencies`
- [ ] `npm ci --omit=dev` + `npm run start:prod` startet lokal sauber
- [ ] Alle Pflicht-Umgebungsvariablen sind dokumentiert (z. B. `.env.example`)
- [ ] Konfiguration wird beim Start geprüft und bricht bei Fehlern sofort ab (Fail Fast)
- [ ] `sourceMap: true` ist aktiv und die `.js.map`-Dateien werden mit ausgeliefert
- [ ] Der Prozess startet mit `--enable-source-maps`
- [ ] Logs gehen strukturiert nach stdout – ohne Geheimnisse
- [ ] SIGTERM wird behandelt: kein `process.exit()` mitten in laufenden Anfragen
- [ ] Es gibt eine Notbremse-Frist, die kürzer ist als die der Plattform
- [ ] `GET /health` antwortet mit `200` – und mit `503` während des Herunterfahrens
- [ ] `engines` in der `package.json` und das Docker-Basis-Image nennen dieselbe Node-Version
- [ ] `CMD` steht in Array-Form, der Container läuft nicht als `root`
- [ ] `npm audit --omit=dev` meldet keine offenen kritischen Lücken
- [ ] Ein Rollback-Weg ist bekannt (das vorige Image-Tag existiert noch)

### ⚠️ Häufiger Fehler

Der teuerste Fehler ist, den Typecheck aus der CI zu nehmen, "weil das
Deployment sonst rot ist". Damit wirfst du genau die Prüfung weg, die dich
schützt – und ersetzt sie durch Hoffnung.

Der zweithäufigste: Der Typecheck läuft nur lokal. Auf deinem Rechner liegt
vielleicht ein `@types`-Paket, das der frische CI-Container nicht bekommt, weil
es nur `npm install` statt `npm ci` gab. Baue in der CI immer aus dem Lockfile.

Und ein leiser Fehler, der lange gutgeht: `process.exit(0)` im
SIGTERM-Handler. Das *fühlt* sich sauber an – aber es beendet den Prozess
sofort, mitten in jeder laufenden Antwort. Setze `process.exitCode` und lass
den Event-Loop von selbst leerlaufen.

### 🎯 Übungsaufgabe

Ein Kollege zeigt dir diesen SIGTERM-Handler. Er behauptet, das sei Graceful
Shutdown. Nenne drei Probleme und schreibe die Funktion neu.

```typescript
process.on("SIGTERM", () => {
  console.log("Tschuess");
  process.exit(0);
});
```

<details>
<summary>💡 Lösung anzeigen</summary>

Die drei Probleme:

1. **`process.exit(0)` beendet sofort** – laufende Anfragen brechen mitten in
   der Antwort ab, offene Transaktionen ebenso.
2. **Der Server nimmt bis zur letzten Millisekunde neue Anfragen an**, statt
   das Zuhören zuerst einzustellen.
3. **Keine Notbremse und kein Schutz vor Doppelaufruf** – hängt eine Anfrage,
   wartet die Plattform blind bis zum SIGKILL; kommen SIGTERM und SIGINT
   zusammen, wird doppelt aufgeräumt.

So geht es richtig:

```typescript
import http from "node:http";

const server = http.createServer((_anfrage, antwort) => {
  antwort.end("ok");
});
server.listen(3000);

let faehrtHerunter = false;

function fahreHerunter(signal: NodeJS.Signals): void {
  if (faehrtHerunter) {
    return; // zweites Signal ignorieren
  }
  faehrtHerunter = true;
  console.log(JSON.stringify({ stufe: "info", nachricht: `${signal} empfangen` }));

  // 1) keine neuen Anfragen  2) laufende zu Ende bedienen
  server.close(() => {
    // 3) hier Datenbank & Co. schliessen
    console.log(JSON.stringify({ stufe: "info", nachricht: "sauber beendet" }));
    // 4) KEIN process.exit - der Event-Loop laeuft von selbst leer,
    //    der Exit-Code bleibt 0.
  });
  server.closeIdleConnections();

  // Notbremse: kuerzer als die Frist der Plattform.
  // .unref() haelt den Prozess nicht kuenstlich am Leben.
  setTimeout(() => {
    console.error(JSON.stringify({ stufe: "error", nachricht: "Frist abgelaufen" }));
    server.closeAllConnections();
    process.exitCode = 1;
  }, 10_000).unref();
}

process.once("SIGTERM", fahreHerunter);
process.once("SIGINT", fahreHerunter);
```

Ergänze dazu einen Health-Endpoint, der `faehrtHerunter` auswertet und
während des Herunterfahrens `503` liefert – dann nimmt dir der Loadbalancer
den Verkehr ab, bevor die letzten Anfragen fertig sind. Genau das zeigt
[`beispiele/02-graceful-shutdown.ts`](./beispiele/02-graceful-shutdown.ts).

</details>

---

## 📋 Zusammenfassung & Cheat-Sheet

```bash
# --- Bauen & starten -------------------------------------------------------
npm run build          # = tsc         : rootDir "." -> outDir "./dist"
npm run typecheck      # = tsc --noEmit: nur pruefen, nichts schreiben
npm run lint           # = eslint .
npm run start:prod     # = node dist/.../server.js   (kein ts-node!)
rm -rf dist && npm run build          # der grosse Reset

# --- Abhaengigkeiten -------------------------------------------------------
npm install <paket>              # Laufzeit  -> dependencies
npm install --save-dev <paket>   # Werkzeug  -> devDependencies
npm ci                           # exakt aus dem Lockfile (CI/Build)
npm ci --omit=dev                # Produktion: ohne Werkzeuge
npm audit --omit=dev             # Sicherheitsluecken pruefen

# --- Konfiguration ---------------------------------------------------------
NODE_ENV=production PORT=8080 DATENBANK_URL=... npm run start:prod

# --- Fehlersuche in Produktion ---------------------------------------------
node --enable-source-maps dist/.../server.js
NODE_OPTIONS=--enable-source-maps node dist/.../server.js

# --- Docker ----------------------------------------------------------------
docker build -t app:1.0.0 .
docker run --rm -p 3000:3000 -e PORT=3000 app:1.0.0
docker images app                # Groesse kontrollieren
```

```typescript
// --- Konfiguration einmal laden, dann readonly weiterreichen ---------------
interface AppKonfiguration {
  readonly port: number;          // process.env liefert nur string | undefined
  readonly datenbankUrl: string;  // -> pruefen und umwandeln, EINMAL beim Start
}
const kfg: AppKonfiguration = Object.freeze({ port: 3000, datenbankUrl: "…" });

// --- Graceful Shutdown in vier Schritten -----------------------------------
process.once("SIGTERM", () => {
  server.close(() => { /* 3) Ressourcen zu, 4) kein process.exit() */ });
  server.closeIdleConnections();                    // 1) + 2)
  setTimeout(() => server.closeAllConnections(), 10_000).unref(); // Notbremse
});
```

| Frage | Antwort |
|---|---|
| Was startet in Produktion? | `node dist/....js` – niemals `ts-node`. |
| Gehört `dist/` ins Git? | Nein. Es ist ein Ergebnis, kein Quelltext. |
| `npm install` oder `npm ci`? | In CI und Docker immer `npm ci` – reproduzierbar aus dem Lockfile. |
| Wohin mit `typescript`, `ts-node`, `eslint`, `@types/*`? | `devDependencies` – nach dem Build nutzlos. |
| Welchen Typ hat `process.env["PORT"]`? | `string \| undefined`. Immer prüfen und umwandeln. |
| Wo wird Konfiguration geprüft? | Genau einmal, beim Start. Danach nur `readonly` Objekt. |
| Was tun bei fehlender Pflichtvariable? | Fail Fast: aussagekräftiger Fehler, Start abbrechen. |
| Warum Source Maps? | Damit der Stacktrace auf deine `.ts`-Zeile zeigt – `.map` mit ausliefern, `--enable-source-maps` setzen. |
| Warum Multi-Stage-Build? | Runtime-Image enthält nur `dist/` + Produktionsabhängigkeiten: klein und sicherer. |
| Warum `CMD` in Array-Form? | Nur so wird Node PID 1 und bekommt SIGTERM. |
| Was passiert bei SIGTERM? | Zuhören stoppen, laufende Anfragen fertig bedienen, Ressourcen schließen, dann enden. |
| Warum kein `process.exit()`? | Es kappt laufende Anfragen. Setze `process.exitCode`. |

---

← [Kursübersicht](../README.md) | [Modul 7: TypeScript Patterns](../modul-7-typescript-patterns/README.md) | [Modul 9: Abschlussprojekt](../modul-9-abschlussprojekt/README.md) →
