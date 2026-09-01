# Modul 9: Abschlussprojekt – Typsichere Todo-API (Profi+)

Acht Module lang hast du einzelne Konzepte geübt. Jetzt baust du daraus eine
vollständige Anwendung: eine Todo-API mit Anmeldung, Rollen, Eingabeprüfung
und sauberem Herunterfahren – ohne ein einziges externes Framework.

## 🎯 Lernziele

Nach diesem Modul kannst du:

- eine mehrschichtige Anwendung so aufteilen, dass jede Datei genau eine Aufgabe hat
- Typen als "Source of Truth" definieren und alle DTOs daraus ableiten
- eine generische Speicherschicht (Repository Pattern) schreiben
- Authentifizierung und Autorisierung typsicher trennen
- externe Eingaben an der Systemgrenze in vertrauenswürdige Typen überführen
- den fertigen Server starten, testen, für Produktion bauen und erweitern

## Inhalt

- [9.1 Die Anforderungen](#91-die-anforderungen)
- [9.2 Architektur: Wer kennt wen?](#92-architektur-wer-kennt-wen)
- [9.3 Die Bausteine im Einzelnen](#93-die-bausteine-im-einzelnen)
- [9.4 Starten & Testen](#94-starten--testen)
- [9.5 Die API-Referenz](#95-die-api-referenz)
- [9.6 Erweiterungsideen](#96-erweiterungsideen)
- [📋 Zusammenfassung & Cheat-Sheet](#-zusammenfassung--cheat-sheet)

**Das Projekt:** [`todo-app/`](./todo-app/) – siehe auch die
[README des Projekts](./todo-app/README.md).

| Datei | Aufgabe |
|---|---|
| [`todo-app/types.ts`](./todo-app/types.ts) | Zentrale Typen, Branded IDs, DTOs, `Ergebnis<T>` |
| [`todo-app/konfiguration.ts`](./todo-app/konfiguration.ts) | Umgebungsvariablen prüfen (Fail-Fast) |
| [`todo-app/store.ts`](./todo-app/store.ts) | Generischer Datenspeicher |
| [`todo-app/validierung.ts`](./todo-app/validierung.ts) | `unknown` → sicherer Typ ("Parse, don't validate") |
| [`todo-app/auth.ts`](./todo-app/auth.ts) | Passwort-Hashing, Tokens, Rollen |
| [`todo-app/server.ts`](./todo-app/server.ts) | HTTP-Routen, Graceful Shutdown |

---

## 9.1 Die Anforderungen

### Theorie

Bevor eine Zeile Code entsteht, steht die Frage: Was soll das Ding können?
Für unsere Todo-API lautet die Antwort:

**Fachlich**

- Benutzer können sich mit Benutzername und Passwort anmelden und erhalten ein Token.
- Angemeldete Benutzer sehen ihre eigenen Todos, legen neue an, ändern und löschen sie.
- Es gibt zwei Rollen: `user` (sieht nur eigene Todos) und `admin` (sieht und ändert alle).
- Ein Health-Endpunkt ist ohne Anmeldung erreichbar.

**Technisch**

- Passwörter werden niemals im Klartext gespeichert.
- Kein Passwort-Hash verlässt jemals den Server.
- Jede Eingabe von außen wird geprüft, bevor sie in die Anwendung gelangt.
- Der Server fährt bei `SIGTERM` sauber herunter.
- Die Konfiguration wird beim Start geprüft – nicht mitten im Betrieb.

Diese Liste ist zugleich unsere Prüfliste am Ende. Notiere solche
Anforderungen immer, bevor du anfängst: Sie sind der einzige Maßstab, an dem
sich "fertig" objektiv messen lässt.

### Code-Beispiele

```typescript
// Aus den fachlichen Anforderungen ergeben sich direkt die Kerntypen.
// Beachte: Der Passwort-Hash steckt im Typ "Benutzer" - aber es gibt einen
// zweiten Typ fuer alles, was nach aussen geht.

export type Rolle = "admin" | "user";

export interface Benutzer {
  readonly id: BenutzerId;
  readonly benutzername: string;
  readonly passwortHash: string;   // bleibt IMMER im Server
  readonly rolle: Rolle;
}

// Omit macht die Anforderung "kein Hash nach aussen" zu einer Compilerregel:
export type OeffentlicherBenutzer = Omit<Benutzer, "passwortHash">;
```

### ⚠️ Häufiger Fehler

Der klassische Anfängerfehler in Projekten dieser Größe ist, sofort mit dem
Server anzufangen: `createServer`, ein paar Routen, und die Datenstrukturen
entstehen unterwegs. Das Ergebnis ist eine Datei mit 400 Zeilen, in der
Fachlogik, HTTP-Behandlung und Validierung untrennbar verwoben sind – und
die sich nicht testen lässt, ohne einen Server zu starten.

Fang immer bei den **Typen** an. Sie sind schnell geschrieben, kosten nichts
und zwingen dich, die Anforderungen zu Ende zu denken, bevor du Code baust,
den du wieder wegwirfst.

### 🎯 Übungsaufgabe

Formuliere für eine Erweiterung "Todos haben eine Priorität" die nötigen
Änderungen – und zwar zuerst auf Typebene. Welche Typen und DTOs sind
betroffen?

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// 1) Neuer Literal-Union-Typ fuer die Prioritaet:
export type Prioritaet = "niedrig" | "normal" | "hoch";

// 2) Feld im Kerntyp ergaenzen:
export interface Todo {
  readonly id: TodoId;
  readonly titel: string;
  readonly erledigt: boolean;
  readonly prioritaet: Prioritaet; // neu
  readonly besitzerId: BenutzerId;
  readonly erstelltAm: string;
}

// 3) Die DTOs muessen NICHT angefasst werden, wenn sie abgeleitet sind -
//    man erweitert nur die Auswahl:
export type NeuesTodoDTO = Pick<Todo, "titel" | "prioritaet">;
export type TodoAenderungDTO = Partial<Pick<Todo, "titel" | "erledigt" | "prioritaet">>;
```

Der Gewinn: Sobald du `Todo` erweiterst, zeigt dir `tsc --noEmit` **jede**
Stelle, die noch nicht damit umgehen kann – im Store, im Parser und im
Server. Du musst nichts suchen, der Compiler führt dich hin.

</details>

---

## 9.2 Architektur: Wer kennt wen?

### Theorie

Die wichtigste Entscheidung in diesem Projekt ist nicht, welche Bibliothek
man nimmt, sondern **in welche Richtung die Abhängigkeiten zeigen**. Unsere
Regel: Sie zeigen immer nach innen, nie im Kreis.

```
                  server.ts          <- kennt alle, kennt niemand
                 /    |    \
   validierung.ts  auth.ts  store.ts <- kennen nur types.ts
   konfiguration.ts    \    /
                     types.ts        <- kennt niemanden
```

`types.ts` importiert bewusst nichts aus dem Projekt. `server.ts` wird von
niemandem importiert. Dazwischen liegen die Fachmodule, die sich untereinander
nicht kennen. Daraus folgen drei angenehme Eigenschaften:

1. **Keine zirkulären Importe.** In Node führen die sonst zu
   `undefined`-Fehlern, die extrem schwer zu finden sind.
2. **Testbarkeit ohne HTTP.** `store`, `auth` und `validierung` lassen sich
   direkt aufrufen – deshalb hat in diesem Projekt jede Datei eine eigene
   Demo, die per `ts-node` startbar ist.
3. **Austauschbarkeit.** Express statt `node:http`? Dann ändert sich nur
   `server.ts`.

Der Zusatz `if (require.main === module) { … }` am Ende jeder Datei ist dabei
ein nützlicher Node-Kniff: Der Block läuft **nur**, wenn die Datei direkt
gestartet wird – beim Import bleibt er stumm.

### Code-Beispiele

```typescript
// In jeder Datei des Projekts, am Ende:
if (require.main === module) {
  // Diese Demo laeuft nur bei "ts-node store.ts",
  // NICHT wenn server.ts die Datei importiert.
  const todoStore = new Store<Todo>();
  console.log("Anzahl:", todoStore.anzahl);
}
```

```typescript
// server.ts ist die einzige Datei, die alles zusammenfuehrt:
import { ladeKonfiguration } from "./konfiguration";
import { Store, erzeugeId } from "./store";
import { darfZugreifen, erstelleToken, login, pruefeToken } from "./auth";
import { parseJson, parseLoginDaten, parseNeuesTodo } from "./validierung";
import type { Benutzer, Todo } from "./types";
```

### ⚠️ Häufiger Fehler

Ein zirkulärer Import entsteht schneller, als man denkt: `auth.ts` braucht
"nur eben kurz" eine Hilfsfunktion aus `server.ts`, und schon importieren
sich zwei Dateien gegenseitig. TypeScript meldet das **nicht** als Fehler –
zur Laufzeit ist dann eine der beiden Hälften beim Import noch `undefined`.

Die Regel, die das zuverlässig verhindert: Gemeinsam genutzter Code wandert
immer **nach unten** in eine Datei, die selbst nichts importiert – bei uns
`types.ts`. Wenn zwei Module dasselbe brauchen, gehört es keinem von beiden.

### 🎯 Übungsaufgabe

Der Store soll beim Speichern eine Logmeldung schreiben, und die
Log-Funktion liegt in `server.ts`. Warum ist ein Import aus `server.ts` in
`store.ts` die falsche Lösung – und was macht man stattdessen?

<details>
<summary>💡 Lösung anzeigen</summary>

Der Import wäre zirkulär (`server` → `store` → `server`) und dreht zudem die
Abhängigkeitsrichtung um: Die Speicherschicht würde plötzlich den Server
kennen.

Zwei saubere Lösungen:

```typescript
// Variante A: Die Log-Funktion nach unten verschieben (eigene Datei,
// die selbst nichts importiert) - dann duerfen beide sie benutzen.
// logger.ts
export function protokolliere(nachricht: string): void {
  console.log(`[${new Date().toISOString()}] ${nachricht}`);
}
```

```typescript
// Variante B (noch flexibler): Der Store bekommt den Logger hereingereicht.
// Er kennt dann nur noch die Form der Funktion, nicht ihre Herkunft.
export class Store<T extends { readonly id: string }> {
  constructor(private readonly protokolliere: (nachricht: string) => void = () => {}) {}

  speichere(element: T): T {
    this.protokolliere(`gespeichert: ${element.id}`);
    // ...
    return element;
  }
}
```

Variante B heißt **Dependency Injection** und macht den Store im Test
besonders angenehm: Dort übergibt man einfach eine Funktion, die die
Meldungen in ein Array schreibt.

</details>

---

## 9.3 Die Bausteine im Einzelnen

### Theorie

Jede Datei des Projekts löst genau ein Problem – und jede benutzt dabei
Konzepte aus den vorherigen Modulen:

| Datei | Aufgabe | Konzepte aus |
|---|---|---|
| `types.ts` | Kerntypen, Branded IDs, DTOs, `Ergebnis<T>` | Modul 2, 3, 6, 7 |
| `konfiguration.ts` | Umgebungsvariablen prüfen, Fail-Fast | Modul 1, 5, 8 |
| `store.ts` | generischer Speicher (Repository Pattern) | Modul 7 |
| `validierung.ts` | `unknown` → sicherer Typ | Modul 1, 3, 6 |
| `auth.ts` | Hashing, Tokens, Rollen | Modul 3, 6 |
| `server.ts` | HTTP-Routen, Fehlerbehandlung, Shutdown | Modul 3, 4, 6, 8 |

Zwei Bausteine verdienen besondere Aufmerksamkeit, weil sie das ganze
Projekt zusammenhalten:

**`Ergebnis<T>`** – eine Discriminated Union, die jede fehlbare Operation
zurückgibt:

```typescript
export type Ergebnis<T> =
  | { readonly ok: true; readonly wert: T }
  | { readonly ok: false; readonly fehler: string };
```

Weil `.wert` erst nach `if (ergebnis.ok)` erreichbar ist, kann niemand die
Fehlerbehandlung vergessen. Aus einer Disziplinfrage wird eine Compilerregel.

**Branded Types** – IDs, die sich nicht verwechseln lassen:

```typescript
export type BenutzerId = string & { readonly __marke: "BenutzerId" };
export type TodoId = string & { readonly __marke: "TodoId" };
```

Zur Laufzeit sind das ganz normale Strings; die "Marke" existiert nur im
Typsystem. Eine `BenutzerId` dort zu übergeben, wo eine `TodoId` erwartet
wird, ist damit ein Compilerfehler.

### Code-Beispiele

```typescript
// store.ts: Der Lookup Type T["id"] haelt die Marke am Leben.
export class Store<T extends { readonly id: string }> {
  private readonly daten = new Map<string, T>();

  findeById(id: T["id"]): T | undefined {
    return this.daten.get(id);
  }

  // Partial<Omit<T, "id">>: alle Felder optional - ausser der id,
  // die sich gar nicht erst aendern laesst.
  aktualisiere(id: T["id"], aenderung: Partial<Omit<T, "id">>): T | undefined {
    const vorhanden = this.daten.get(id);
    if (vorhanden === undefined) {
      return undefined;
    }
    const aktualisiert = { ...vorhanden, ...aenderung } as T;
    this.daten.set(id, aktualisiert);
    return aktualisiert;
  }
}
```

```typescript
// validierung.ts: aus "unknown" wird ein vertrauenswuerdiger Typ.
export function parseNeuesTodo(rohdaten: unknown): Ergebnis<NeuesTodoDTO> {
  if (!istObjekt(rohdaten)) {
    return fehlschlag("Der Request-Body muss ein JSON-Objekt sein.");
  }
  const titel = rohdaten["titel"];
  if (!istNichtLeererText(titel)) {
    return fehlschlag("Feld 'titel' ist erforderlich und darf nicht leer sein.");
  }
  return erfolg({ titel: titel.trim() }); // inklusive Normalisierung
}
```

```typescript
// auth.ts: Passwoerter mit Salt und langsamem Hashverfahren.
export async function hashePasswort(passwort: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const schluessel = await scryptAsync(passwort, salt);
  return `${salt}:${schluessel.toString("hex")}`; // "<salt>:<hash>"
}

// Vergleich in konstanter Zeit - gegen Timing-Angriffe:
export async function pruefePasswort(passwort: string, gespeichert: string): Promise<boolean> {
  const [salt, hash] = gespeichert.split(":");
  if (salt === undefined || hash === undefined) return false;
  const erwartet = Buffer.from(hash, "hex");
  const berechnet = await scryptAsync(passwort, salt);
  return erwartet.length === berechnet.length && timingSafeEqual(erwartet, berechnet);
}
```

```typescript
// server.ts: jede Route folgt demselben Ablauf -
// lesen -> parsen -> autorisieren -> handeln -> antworten.
if (methode === "POST" && pfad === "/todos") {
  const koerper = parseJson(await leseKoerper(req));
  if (!koerper.ok) { sendeJson(res, 400, { fehler: koerper.fehler }); return; }

  const daten = parseNeuesTodo(koerper.wert);
  if (!daten.ok) { sendeJson(res, 400, { fehler: daten.fehler }); return; }

  const neu: Todo = {
    id: alsTodoId(erzeugeId("todo")),
    titel: daten.wert.titel,
    erledigt: false,
    besitzerId: alsBenutzerId(benutzer.id),
    erstelltAm: new Date().toISOString(),
  };
  sendeJson(res, 201, todoStore.speichere(neu));
  return;
}
```

### ⚠️ Häufiger Fehler

In `parseTodoAenderung` steckt eine Falle, die genau durch die strenge
tsconfig sichtbar wird. Naheliegend wäre:

```typescript
return erfolg({ titel, erledigt }); // beide koennen undefined sein
```

Das scheitert an `exactOptionalPropertyTypes`: Ein optionales Feld darf
**fehlen**, aber nicht explizit auf `undefined` gesetzt werden. `{ titel:
undefined }` ist eben nicht dasselbe wie `{}` – im ersten Fall würde der
Store den Titel mit `undefined` überschreiben. Deshalb wird das Objekt
schrittweise aufgebaut:

```typescript
const aenderung: { titel?: string; erledigt?: boolean } = {};
if (istNichtLeererText(titel)) aenderung.titel = titel.trim();
if (typeof erledigt === "boolean") aenderung.erledigt = erledigt;
```

Genau solche Datenverluste sind es, die die strengen Optionen aus
[Modul 5](../modul-5-werkzeuge-workflow/README.md) verhindern sollen.

### 🎯 Übungsaufgabe

Warum gibt `login()` bei einem unbekannten Benutzernamen dieselbe
Fehlermeldung zurück wie bei einem falschen Passwort ("Benutzername oder
Passwort ist falsch.")?

<details>
<summary>💡 Lösung anzeigen</summary>

Weil unterschiedliche Meldungen verraten würden, **welche Benutzernamen
existieren**. Ein Angreifer könnte damit erst eine Liste gültiger Konten
zusammenstellen (User Enumeration) und dann gezielt Passwörter probieren.

```typescript
const gefunden = bekannteBenutzer.find((k) => k.benutzername === benutzername);
if (gefunden === undefined) {
  return fehlschlag("Benutzername oder Passwort ist falsch."); // identisch ...
}
const passt = await pruefePasswort(passwort, gefunden.passwortHash);
if (!passt) {
  return fehlschlag("Benutzername oder Passwort ist falsch."); // ... zu dieser
}
```

Dasselbe Prinzip gilt für die Antwort des Servers: Ein interner Fehler wird
protokolliert (mit allen Details), nach außen geht aber nur "Interner
Serverfehler." – Stacktraces gehören nicht in eine HTTP-Antwort. Mehr dazu
in [Modul 6.6](../modul-6-sicherheit-auth/README.md).

</details>

---

## 9.4 Starten & Testen

### Theorie

Es gibt zwei Wege, das Projekt zu starten – beide führen in IntelliJ IDEA
zum Ziel:

1. **Der Play-Button.** Das Repository bringt die Run-Konfiguration
   *"Run All (Abschlussprojekt)"* mit (`.idea/runConfigurations/Run_All.xml`).
   Sie erscheint nach dem Öffnen des Projekts oben rechts in der Symbolleiste.
2. **Das Terminal in IntelliJ** (*View → Tool Windows → Terminal*) mit
   `npm start`.

Zusätzlich lässt sich jede einzelne Datei separat ausführen – Rechtsklick im
Editor → *Run 'dateiname.ts'*. Dann läuft nur der `require.main`-Block dieser
Datei, und du siehst das jeweilige Modul isoliert arbeiten.

Konfiguriert wird über Umgebungsvariablen: `PORT` (Standard 3000),
`HOSTNAME` (Standard `localhost`), `TOKEN_GUELTIGKEIT_MINUTEN` (Standard 60)
und `TOKEN_GEHEIMNIS`.

### Code-Beispiele

```bash
# Alle Abhaengigkeiten installieren (einmalig)
npm install

# Server starten
npm start

# Einzelne Bausteine isoliert ausfuehren
npx ts-node modul-9-abschlussprojekt/todo-app/store.ts
npx ts-node modul-9-abschlussprojekt/todo-app/auth.ts
npx ts-node modul-9-abschlussprojekt/todo-app/validierung.ts

# Auf einem anderen Port starten
PORT=4000 npm start
```

```bash
# 1) Anmelden und Token merken
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"benutzername":"admin","passwort":"admin123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 2) Eigene Todos abrufen
curl -s http://localhost:3000/todos -H "Authorization: Bearer $TOKEN"

# 3) Neues Todo anlegen
curl -s -X POST http://localhost:3000/todos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titel":"Abschlussprojekt verstehen"}'
```

```bash
# Fuer Produktion bauen und ohne ts-node starten (Modul 8)
npm run build
npm run start:prod
```

### ⚠️ Häufiger Fehler

Wer den Server im IntelliJ-Terminal mit dem Fenster-X schließt statt mit der
roten Stop-Taste, lässt den Node-Prozess unter Umständen weiterlaufen. Beim
nächsten Start kommt dann `EADDRINUSE: address already in use :::3000` – und
man sucht den Fehler im Code, obwohl der alte Server noch den Port hält.

Beende den Server immer mit der roten Stop-Taste (oder `Strg`/`Cmd + C` im
Terminal). Beides sendet `SIGINT`, worauf unser Server dank Graceful
Shutdown sauber herunterfährt. Hilft das nicht: `lsof -i :3000` zeigt, wer
den Port belegt.

### 🎯 Übungsaufgabe

Starte den Server auf Port 4000 mit einer Token-Gültigkeit von einer Minute,
melde dich an und finde heraus, was nach Ablauf der Minute passiert.

<details>
<summary>💡 Lösung anzeigen</summary>

```bash
PORT=4000 TOKEN_GUELTIGKEIT_MINUTEN=1 npm start
```

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/login \
  -H "Content-Type: application/json" \
  -d '{"benutzername":"gast","passwort":"gast123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

curl -s http://localhost:4000/todos -H "Authorization: Bearer $TOKEN"
# -> []   (der Gast hat noch keine eigenen Todos)

sleep 65

curl -s http://localhost:4000/todos -H "Authorization: Bearer $TOKEN"
# -> {"fehler":"Nicht angemeldet. Bitte zuerst /login aufrufen."}
```

Der Grund steckt in `pruefeToken`: Die Signatur stimmt noch, aber
`gueltigBis` liegt in der Vergangenheit – also gibt die Funktion
`{ ok: false, fehler: "Token ist abgelaufen." }` zurück. Genau deshalb
enthält der Token-Inhalt ein Ablaufdatum: Ein gestohlenes Token ist nicht
ewig gültig.

</details>

---

## 9.5 Die API-Referenz

### Theorie

Die API folgt durchgängig denselben Regeln:

- Alle Antworten sind JSON.
- Fehler haben immer die Form `{ "fehler": "..." }`.
- Geschützte Routen erwarten den Header `Authorization: Bearer <token>`.
- Statuscodes: `200` OK, `201` angelegt, `400` Eingabe fehlerhaft,
  `401` nicht angemeldet, `403` nicht berechtigt, `404` nicht gefunden,
  `500` interner Fehler.

| Methode | Pfad | Anmeldung | Beschreibung |
|---|---|---|---|
| `GET` | `/health` | nein | Statusanzeige für Monitoring |
| `POST` | `/login` | nein | Anmeldung, liefert Token |
| `GET` | `/todos` | ja | eigene Todos (Admin: alle) |
| `POST` | `/todos` | ja | neues Todo anlegen |
| `PATCH` | `/todos/:id` | ja | Todo ändern (eigenes oder als Admin) |
| `DELETE` | `/todos/:id` | ja | Todo löschen (eigenes oder als Admin) |

**Demo-Zugänge:** `admin` / `admin123` (Rolle `admin`) und `gast` / `gast123`
(Rolle `user`).

### Code-Beispiele

```bash
# POST /login
curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"benutzername":"admin","passwort":"admin123"}'
```

```json
{
  "benutzer": { "id": "b-1", "benutzername": "admin", "rolle": "admin" },
  "token": "eyJiZW51dHplcklkIjoi...T0tFTg"
}
```

```bash
# PATCH /todos/:id - Todo als erledigt markieren
curl -s -X PATCH http://localhost:3000/todos/todo-abc-123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"erledigt":true}'
```

```json
{
  "id": "todo-abc-123",
  "titel": "Abschlussprojekt verstehen",
  "erledigt": true,
  "besitzerId": "b-1",
  "erstelltAm": "2026-09-01T08:04:40.341Z"
}
```

```bash
# Typische Fehlerantworten
curl -s http://localhost:3000/todos
# {"fehler":"Nicht angemeldet. Bitte zuerst /login aufrufen."}          401

curl -s -X POST http://localhost:3000/todos -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"titel":"   "}'
# {"fehler":"Feld 'titel' ist erforderlich und darf nicht leer sein."}  400

curl -s -X PATCH http://localhost:3000/todos/fremdes-todo \
  -H "Authorization: Bearer $GAST_TOKEN" -d '{"erledigt":true}'
# {"fehler":"Keine Berechtigung fuer dieses Todo."}                     403
```

### ⚠️ Häufiger Fehler

Beim Testen mit `curl` fehlt gern der Header `Content-Type: application/json`
– oder der Body wird mit doppelten Anführungszeichen umschlossen, sodass die
Shell die inneren Zeichen frisst. Das Ergebnis ist ein `400` mit "Der
Request-Body muss ein JSON-Objekt sein", und man sucht den Fehler im Server.

Verwende für JSON-Bodys immer **einfache** Anführungszeichen außen und
doppelte innen: `-d '{"titel":"Test"}'`. Und beachte: Die Feldnamen dieser
API sind deutsch (`titel`, `benutzername`, `passwort`) – `title` oder
`username` werden korrekterweise abgelehnt.

### 🎯 Übungsaufgabe

Ergänze eine Route `GET /todos/:id`, die ein einzelnes Todo zurückgibt –
inklusive der richtigen Statuscodes.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// In server.ts, innerhalb von verarbeite(), nach dem GET /todos-Block:
const einzelTreffer = /^\/todos\/([^/]+)$/.exec(pfad);
if (methode === "GET" && einzelTreffer !== null) {
  const rohId = einzelTreffer[1];
  if (rohId === undefined) {
    sendeJson(res, 400, { fehler: "Ungueltige Todo-ID." });
    return;
  }
  const todo = todoStore.findeById(alsTodoId(rohId));

  // Wichtig: 404 auch dann, wenn das Todo existiert, aber jemand anderem
  // gehoert. Ein 403 wuerde verraten, dass es diese ID gibt.
  if (todo === undefined || (todo.besitzerId !== benutzer.id && benutzer.rolle !== "admin")) {
    sendeJson(res, 404, { fehler: "Todo nicht gefunden." });
    return;
  }
  sendeJson(res, 200, todo);
  return;
}
```

Der Kommentar ist der eigentliche Lerninhalt: Ob man bei fremden Ressourcen
`403` oder `404` zurückgibt, ist eine bewusste Entscheidung. `404` verrät
weniger.

</details>

---

## 9.6 Erweiterungsideen

### Theorie

Das Projekt ist bewusst schlank – damit du es erweitern kannst. Vier
Vorschläge, nach Schwierigkeit sortiert:

1. **Priorität und Fälligkeitsdatum** (leicht) – Felder in `Todo` ergänzen,
   Parser erweitern, den Compiler die restlichen Stellen zeigen lassen.
2. **Sortierung und Filter** (mittel) – `GET /todos?erledigt=false&sortiere=titel`.
   Übung in Query-Parametern und typsicherem Parsen.
3. **Echte Persistenz** (mittel) – den `Store` gegen eine SQLite- oder
   Datei-Implementierung tauschen. Die Schnittstelle bleibt gleich, `server.ts`
   ändert sich nicht.
4. **Tests** (anspruchsvoll) – mit dem eingebauten Test-Runner von Node
   (`node:test`) oder Vitest. Weil die Fachlogik ohne HTTP auskommt, sind
   `store`, `auth` und `validierung` direkt testbar.

Für jede Erweiterung gilt derselbe Ablauf wie am Anfang: erst die Typen,
dann `tsc --noEmit` laufen lassen, dann die gemeldeten Stellen abarbeiten.

### Code-Beispiele

```typescript
// Idee 2: Query-Parameter typsicher lesen
function leseFilter(url: string): { erledigt?: boolean } {
  const parameter = new URL(url, "http://localhost").searchParams;
  const erledigt = parameter.get("erledigt");
  if (erledigt === null) {
    return {}; // kein Filter gesetzt
  }
  // Bewusst nur "true"/"false" akzeptieren - alles andere wird ignoriert.
  return erledigt === "true" ? { erledigt: true } : { erledigt: false };
}
```

```typescript
// Idee 3: Der Store als Schnittstelle - die Implementierung wird austauschbar
export interface Repository<T extends { readonly id: string }> {
  alle(): readonly T[];
  findeById(id: T["id"]): T | undefined;
  speichere(element: T): T;
  loesche(id: T["id"]): boolean;
}

// Die vorhandene Klasse erfuellt diese Schnittstelle bereits:
// class Store<T> implements Repository<T> { ... }
```

```typescript
// Idee 4: ein Test mit dem eingebauten Runner von Node
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNeuesTodo } from "./validierung";

test("leerer Titel wird abgelehnt", () => {
  const ergebnis = parseNeuesTodo({ titel: "   " });
  assert.equal(ergebnis.ok, false);
});

test("Titel wird getrimmt", () => {
  const ergebnis = parseNeuesTodo({ titel: "  Einkaufen  " });
  assert.equal(ergebnis.ok, true);
  if (ergebnis.ok) {
    assert.equal(ergebnis.wert.titel, "Einkaufen");
  }
});
```

### ⚠️ Häufiger Fehler

Die häufigste Falle beim Erweitern ist, das Datenmodell zu ändern und die
Prüfschicht zu vergessen. Ergänzt du `prioritaet` in `Todo`, meldet der
Compiler zuverlässig jede Stelle, an der ein `Todo` **gebaut** wird – aber
`parseNeuesTodo` arbeitet mit `unknown` und kompiliert weiterhin klaglos.
Die neue Eigenschaft käme dann nie beim Server an.

Merke: Der Compiler schützt dich innerhalb deines Codes. An der Systemgrenze
– dort, wo `unknown` hereinkommt – musst du selbst nachziehen. Deshalb
gehört zu jeder Modelländerung immer auch ein Blick in `validierung.ts`.

### 🎯 Übungsaufgabe

Implementiere Erweiterung 1 vollständig: Todos bekommen eine Priorität
(`"niedrig" | "normal" | "hoch"`), die beim Anlegen optional mitgegeben und
später geändert werden kann.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// --- types.ts --------------------------------------------------------------
export type Prioritaet = "niedrig" | "normal" | "hoch";

export interface Todo {
  readonly id: TodoId;
  readonly titel: string;
  readonly erledigt: boolean;
  readonly prioritaet: Prioritaet; // neu
  readonly besitzerId: BenutzerId;
  readonly erstelltAm: string;
}

export type NeuesTodoDTO = Pick<Todo, "titel"> & { readonly prioritaet?: Prioritaet };
export type TodoAenderungDTO = Partial<Pick<Todo, "titel" | "erledigt" | "prioritaet">>;
```

```typescript
// --- validierung.ts --------------------------------------------------------
// Ein Type Guard fuer die Literal Union (Modul 3.4):
const PRIORITAETEN = ["niedrig", "normal", "hoch"] as const;

function istPrioritaet(wert: unknown): wert is Prioritaet {
  return typeof wert === "string" && (PRIORITAETEN as readonly string[]).includes(wert);
}

export function parseNeuesTodo(rohdaten: unknown): Ergebnis<NeuesTodoDTO> {
  if (!istObjekt(rohdaten)) {
    return fehlschlag("Der Request-Body muss ein JSON-Objekt sein.");
  }
  const titel = rohdaten["titel"];
  if (!istNichtLeererText(titel)) {
    return fehlschlag("Feld 'titel' ist erforderlich und darf nicht leer sein.");
  }

  const prioritaet = rohdaten["prioritaet"];
  if (prioritaet !== undefined && !istPrioritaet(prioritaet)) {
    return fehlschlag("Feld 'prioritaet' muss niedrig, normal oder hoch sein.");
  }

  // Wieder schrittweise wegen exactOptionalPropertyTypes:
  const dto: { titel: string; prioritaet?: Prioritaet } = { titel: titel.trim() };
  if (istPrioritaet(prioritaet)) {
    dto.prioritaet = prioritaet;
  }
  return erfolg(dto);
}
```

```typescript
// --- server.ts -------------------------------------------------------------
const neu: Todo = {
  id: alsTodoId(erzeugeId("todo")),
  titel: daten.wert.titel,
  erledigt: false,
  prioritaet: daten.wert.prioritaet ?? "normal", // Standardwert
  besitzerId: alsBenutzerId(benutzer.id),
  erstelltAm: new Date().toISOString(),
};
```

Führe danach `npm run typecheck` aus – der Compiler zeigt dir, ob du noch
eine Stelle vergessen hast.

</details>

---

## 📋 Zusammenfassung & Cheat-Sheet

```bash
# --- Projekt starten -------------------------------------------------------
npm install                 # einmalig
npm start                   # Server auf http://localhost:3000
PORT=4000 npm start         # anderer Port
npm run typecheck           # tsc --noEmit ueber das ganze Repo
npm run build && npm run start:prod   # Produktionsbetrieb ohne ts-node

# --- Einzelne Bausteine ausfuehren -----------------------------------------
npx ts-node modul-9-abschlussprojekt/todo-app/store.ts
npx ts-node modul-9-abschlussprojekt/todo-app/auth.ts

# --- API testen ------------------------------------------------------------
curl -s -X POST localhost:3000/login -H "Content-Type: application/json" \
  -d '{"benutzername":"admin","passwort":"admin123"}'
curl -s localhost:3000/todos -H "Authorization: Bearer $TOKEN"
```

```typescript
// --- Die vier tragenden Muster des Projekts --------------------------------
type Ergebnis<T> = { ok: true; wert: T } | { ok: false; fehler: string };  // Modul 3
type TodoId = string & { readonly __marke: "TodoId" };                      // Modul 6
class Store<T extends { readonly id: string }> { … }                        // Modul 7
if (require.main === module) { /* Demo nur beim Direktstart */ }            // Modul 4
```

| Frage | Antwort |
|---|---|
| Womit fange ich in einem neuen Projekt an? | Mit den Typen – nie mit dem Server. |
| Wie vermeide ich zirkuläre Importe? | Gemeinsames wandert nach unten in eine Datei ohne eigene Importe. |
| Wo werden Fremddaten geprüft? | Ausschließlich in `validierung.ts`, an der Systemgrenze. |
| Wie erzwinge ich Fehlerbehandlung? | Mit `Ergebnis<T>` als Discriminated Union. |
| Wie verhindere ich vertauschte IDs? | Branded Types (`TodoId` vs. `BenutzerId`). |
| Warum kein `403` bei fremden Ressourcen? | `404` verrät nicht, dass die ID existiert. |
| Was mache ich nach einer Modelländerung? | `npm run typecheck` – und `validierung.ts` prüfen. |

---

← [Kursübersicht](../README.md) | [Modul 8: Deployment](../modul-8-deployment/README.md) | [Projekt-README](./todo-app/README.md) →
