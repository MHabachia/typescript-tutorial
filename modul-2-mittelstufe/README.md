# Modul 2: Der nächste Schritt (Mittelstufe)

In Modul 1 hast du einzelne Werte typisiert. Jetzt geht es um **Strukturen**:
Listen, Objekte, Baupläne und feste Wertebereiche – also um das, woraus echte
Programme bestehen.

## 🎯 Lernziele

Nach diesem Modul kannst du:

- Arrays (`T[]`, `Array<T>`, `readonly T[]`) und Tuples mit fester Länge unterscheiden und einsetzen
- erklären, warum `array[0]` in diesem Projekt den Typ `T | undefined` hat – und sauber damit umgehen
- Objekttypen mit `interface` und `type` beschreiben und begründet zwischen beiden wählen
- optionale Felder, `readonly`, Index-Signaturen und `as const` richtig verwenden
- Klassen mit `public`/`private`/`protected`, `#private`-Feldern, Parameter-Properties, Gettern und `static` schreiben
- mit `extends`, `abstract`, `implements` und `override` eine saubere Vererbungshierarchie bauen
- entscheiden, wann ein Enum passt – und warum meistens ein Union Type die bessere Wahl ist

## Inhalt

- [2.1 Arrays & Tuples](#21-arrays--tuples)
- [2.2 Objekttypen: `interface` vs. `type`](#22-objekttypen-interface-vs-type)
- [2.3 Optionale Felder, `readonly` & Index-Signaturen](#23-optionale-felder-readonly--index-signaturen)
- [2.4 Klassen & Zugriffsmodifizierer](#24-klassen--zugriffsmodifizierer)
- [2.5 Vererbung, `abstract` & Interfaces implementieren](#25-vererbung-abstract--interfaces-implementieren)
- [2.6 Enums – und warum Union Types meist besser sind](#26-enums--und-warum-union-types-meist-besser-sind)
- [📋 Zusammenfassung & Cheat-Sheet](#-zusammenfassung--cheat-sheet)

**Lauffähige Beispiele:** [`beispiele/`](./beispiele/)

| Datei | Thema |
|---|---|
| [`01-arrays-und-tuples.ts`](./beispiele/01-arrays-und-tuples.ts) | Arrays, `readonly`, Tuples |
| [`02-interfaces-und-types.ts`](./beispiele/02-interfaces-und-types.ts) | `interface` vs. `type`, Index-Signaturen, `as const` |
| [`03-klassen-und-oop.ts`](./beispiele/03-klassen-und-oop.ts) | Klassen, Kapselung, Vererbung |
| [`04-enums-vs-unions.ts`](./beispiele/04-enums-vs-unions.ts) | Enums vs. Union Types |

---

## 2.1 Arrays & Tuples

### Theorie

Ein **Array** ist ein Regal mit gleichartigem Inhalt und beliebiger Länge. Ein
**Tuple** ist ein Setzkasten mit festen Fächern: Anzahl und Reihenfolge stehen
fest, jedes Fach hat seinen eigenen Typ.

Für Arrays gibt es zwei Schreibweisen mit identischer Bedeutung:

```typescript
const namen: string[] = ["Ada"];        // Kurzform - der Normalfall
const zahlen: Array<number> = [1, 2];   // Langform
```

Nimm die Kurzform. Die Langform lohnt sich nur, wenn der Elementtyp selbst
kompliziert ist (`Array<{ id: number }>` liest sich besser als
`{ id: number }[]`).

Mit `readonly` machst du ein Array unveränderlich:

```typescript
const preise: readonly number[] = [10, 20];
// preise.push(30); // Fehler: 'push' existiert auf diesem Typ gar nicht
```

Das ist kein Trick, sondern ein anderer Typ: `readonly number[]` hat schlicht
keine verändernden Methoden. `map`, `filter` und `slice` funktionieren weiter –
die erzeugen ja ein neues Array.

**Tuples** legen die Länge fest, und ihre Elemente dürfen Namen tragen:

```typescript
type Koordinate = [breite: number, laenge: number];
const berlin: Koordinate = [52.52, 13.4];
```

Die Namen `breite` und `laenge` sind reine Dokumentation – zur Laufzeit bleibt
es ein ganz normales Array. Aber dein Editor zeigt sie an, und das ist der
halbe Nutzen.

#### `noUncheckedIndexedAccess` – die Option, die anfangs nervt

In der [`tsconfig.json`](../tsconfig.json) dieses Kurses ist
`noUncheckedIndexedAccess` aktiv. Sie ändert eine einzige, aber sehr wichtige
Regel:

> Der Zugriff über einen Index liefert nicht `T`, sondern `T | undefined`.

Der Grund ist simpel: TypeScript kennt die **Länge** eines Arrays nicht. Ob
`werte[5]` existiert, weiß erst die Laufzeit. Ohne diese Option behauptet der
Compiler, `werte[5]` sei garantiert eine Zahl – und genau daraus entsteht der
häufigste Laufzeitfehler überhaupt: *"cannot read property of undefined"*.

Vier saubere Wege damit umzugehen:

| Weg | Wann |
|---|---|
| `werte[0] ?? 0` | Es gibt einen sinnvollen Ersatzwert |
| `if (wert === undefined) { … }` | Der leere Fall braucht eigene Behandlung |
| `for (const w of werte)` | Du willst sowieso über alles laufen |
| Tuple statt Array | Die Länge steht fest – dann greift die Regel nicht |

Der letzte Punkt ist wichtig: Bei einem Tuple `[number, number]` ist `t[0]`
ganz normal `number`, denn das Fach existiert garantiert.

### Code-Beispiele

```typescript
// Array vs. Tuple
const messwerte: number[] = [12, 13, 14];      // beliebig viele Zahlen
const spanne: [min: number, max: number] = [0, 100]; // genau zwei

console.log(messwerte.length, spanne[0], spanne[1]); // 3 0 100
```

```typescript
// noUncheckedIndexedAccess in der Praxis
const werte: number[] = [12, 13, 14];

const roh = werte[0];           // Typ: number | undefined
const mitFallback = werte[0] ?? 0; // Typ: number

function ersterEintrag(liste: readonly number[]): string {
  const wert = liste[0];
  if (wert === undefined) {
    return "Liste ist leer";
  }
  return `erster Eintrag: ${wert}`; // hier ist "wert" sicher eine Zahl
}

console.log(roh, mitFallback);
console.log(ersterEintrag(werte)); // "erster Eintrag: 12"
console.log(ersterEintrag([]));    // "Liste ist leer"
```

```typescript
// readonly: lesen ja, aendern nein
const basisPreise: readonly number[] = [10, 20, 30];
const brutto: number[] = basisPreise.map((p) => p * 1.19); // erlaubt
// basisPreise.push(40); // Fehler

console.log(basisPreise, brutto);
```

```typescript
// Tuple als Rueckgabewert - zwei zusammengehoerige Werte
function teileMitRest(zaehler: number, nenner: number): [ganzzahl: number, rest: number] {
  return [Math.floor(zaehler / nenner), zaehler % nenner];
}

const [ganzzahl, rest] = teileMitRest(17, 5);
console.log(ganzzahl, rest); // 3 2
```

### ⚠️ Häufiger Fehler

Der Reflex bei `noUncheckedIndexedAccess` ist das Ausrufezeichen:

```typescript
const erster = werte[0]!; // "vertrau mir, das existiert"
```

Der Non-Null-Assertion-Operator `!` schaltet die Prüfung ab, ohne etwas zu
prüfen. Ist die Liste doch leer, hast du exakt den Fehler zurück, den die
Option verhindern wollte – nur ohne Warnung. Benutze `!` nur, wenn du direkt
darüber bewiesen hast, dass der Wert existiert, und schreibe den Beweis als
Kommentar dazu.

Zweiter Stolperstein: `const` schützt ein Array nicht.

```typescript
const werte = [1, 2, 3];
werte.push(4); // erlaubt - const schuetzt nur den Namen
```

Willst du den **Inhalt** schützen, brauchst du `readonly` oder `as const`.

### 🎯 Übungsaufgabe

Schreibe eine Funktion `minMax`, die aus einem `readonly number[]` ein Tuple
`[min, max]` zurückgibt. Bei einer leeren Liste soll sie `undefined` liefern.
Nutze **kein** `!`.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
function minMax(werte: readonly number[]): [min: number, max: number] | undefined {
  const erster = werte[0];
  // Diese eine Pruefung erledigt zwei Dinge: sie faengt die leere Liste ab
  // UND macht aus "number | undefined" ein sicheres "number".
  if (erster === undefined) {
    return undefined;
  }

  let min = erster;
  let max = erster;

  // for..of liefert direkt "number" - kein Index, kein undefined.
  for (const wert of werte) {
    if (wert < min) min = wert;
    if (wert > max) max = wert;
  }

  return [min, max];
}

const ergebnis = minMax([7, 2, 9, 4]);
console.log(ergebnis); // [ 2, 9 ]
console.log(minMax([])); // undefined

// Der Rueckgabetyp "Tuple | undefined" zwingt den Aufrufer zur Pruefung:
if (ergebnis !== undefined) {
  const [min, max] = ergebnis;
  console.log(`min=${min}, max=${max}`); // min=2, max=9
}
```

`Math.min(...werte)` wäre kürzer – liefert bei einer leeren Liste aber
`Infinity` statt eines Fehlers. Genau solche stillen Sonderfälle willst du
vermeiden.

</details>

---

## 2.2 Objekttypen: `interface` vs. `type`

### Theorie

Ein Objekttyp ist der Bauplan für ein Objekt: Welche Felder gibt es, und
welchen Typ hat jedes? Zwei Schreibweisen führen zum Ziel:

```typescript
interface Benutzer {
  name: string;
  alter: number;
}

type BenutzerAlias = {
  name: string;
  alter: number;
};
```

Für reine Objektformen sind die beiden praktisch austauschbar. Die
Unterschiede zeigen sich an den Rändern:

| | `interface` | `type` |
|---|---|---|
| Objektform beschreiben | ✅ | ✅ |
| Erweitern | `extends` | `&` (Intersection) |
| Union (`A \| B`) | ❌ | ✅ |
| Tuple, Funktionstyp, Primitiv-Alias | ❌ | ✅ |
| Declaration Merging | ✅ | ❌ |
| Fehlermeldungen | oft kürzer, mit Namen | manchmal ausgeschrieben |

**Declaration Merging** ist die eigentliche Besonderheit von `interface`:
Zwei gleichnamige `interface`-Deklarationen verschmelzen automatisch zu einer.

```typescript
interface Konfiguration { host: string; }
interface Konfiguration { port: number; }
// Ergebnis: { host: string; port: number }
```

Bei `type` wäre das ein Fehler ("Duplicate identifier"). In der Praxis
brauchst du Merging vor allem, um Typen aus fremden Bibliotheken um eigene
Felder zu ergänzen (z. B. `Request` in Express um `req.benutzer`).

Der Umkehrschluss: Genau diese Offenheit kann auch stören. Ein `type` ist
**geschlossen** – niemand kann ihn nachträglich von außen erweitern.

Die Faustregel für den Alltag:

> Beschreibst du die **Form eines Objekts**, das andere erweitern könnten –
> nimm `interface`. Brauchst du eine **Union**, ein **Tuple**, einen
> **Funktionstyp** oder eine **Kombination** – nimm `type`.

Wichtiger als die Regel ist die Konsistenz: Wähle im Team eine Linie und bleib
dabei.

### Code-Beispiele

```typescript
// interface: erweiterbar per extends
interface Benutzer {
  id: number;
  name: string;
}

interface Administrator extends Benutzer {
  berechtigungen: readonly string[];
}

const grace: Administrator = {
  id: 2,
  name: "Grace Hopper",
  berechtigungen: ["lesen", "schreiben"],
};
console.log(grace.name, grace.berechtigungen.length);
```

```typescript
// type: alles, was interface nicht kann

// 1) Union
type Status = "offen" | "in-arbeit" | "erledigt";

// 2) Intersection - zwei Typen zusammensetzen
type MitZeitstempel = { erstelltAm: string };
type Aufgabe = { titel: string; status: Status } & MitZeitstempel;

// 3) Funktionstyp
type Formatierer = (a: Aufgabe) => string;

const formatiere: Formatierer = (a) => `${a.titel} [${a.status}]`;
console.log(formatiere({ titel: "Lesen", status: "offen", erstelltAm: "2024-01-15" }));
```

```typescript
// Declaration Merging - nur mit interface moeglich
interface Konfiguration { host: string; }
interface Konfiguration { port: number; }

const konfig: Konfiguration = { host: "localhost", port: 3000 };
console.log(`${konfig.host}:${konfig.port}`); // localhost:3000
```

### ⚠️ Häufiger Fehler

Ein Klassiker ist der Versuch, ein `interface` für eine Union zu benutzen:

```typescript
// interface Ergebnis = Erfolg | Fehler; // Syntaxfehler
type Ergebnis = Erfolg | Fehler;         // so geht es
```

Der zweite Klassiker betrifft die **Excess Property Checks**. TypeScript meckert
nur bei einem direkt hingeschriebenen Objektliteral über zusätzliche Felder:

```typescript
interface Punkt { x: number; y: number; }

// const a: Punkt = { x: 1, y: 2, z: 3 }; // Fehler: 'z' ist nicht bekannt

const roh = { x: 1, y: 2, z: 3 };
const b: Punkt = roh; // KEIN Fehler - roh hat alles, was Punkt braucht
```

Das ist kein Bug. TypeScript prüft **strukturell**: `roh` erfüllt den Vertrag
`Punkt`, das Zusatzfeld stört nicht. Die schärfere Prüfung beim Literal ist
eine reine Tippfehler-Hilfe.

### 🎯 Übungsaufgabe

Modelliere ein Ergebnis, das entweder erfolgreich ist (mit Daten) oder
fehlgeschlagen (mit Fehlermeldung). Entscheide begründet, ob `interface` oder
`type` die richtige Wahl ist, und schreibe eine Funktion, die das Ergebnis als
Text ausgibt.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// Die Bausteine sind Objektformen -> interface.
interface Erfolg {
  ok: true;          // Literal-Typ als Unterscheidungsmerkmal
  daten: string;
}

interface Fehlschlag {
  ok: false;
  meldung: string;
}

// Die Kombination ist eine Union -> hier ist "type" Pflicht.
type Ergebnis = Erfolg | Fehlschlag;

function beschreibe(ergebnis: Ergebnis): string {
  // Das Feld "ok" ist der Diskriminator: nach dieser Pruefung weiss
  // TypeScript genau, welcher der beiden Faelle vorliegt.
  if (ergebnis.ok) {
    return `OK: ${ergebnis.daten}`;      // hier existiert nur "daten"
  }
  return `Fehler: ${ergebnis.meldung}`;  // hier existiert nur "meldung"
}

console.log(beschreibe({ ok: true, daten: "42 Zeilen" })); // OK: 42 Zeilen
console.log(beschreibe({ ok: false, meldung: "Timeout" })); // Fehler: Timeout
```

Dieses Muster heißt **Discriminated Union** und ist eines der wichtigsten in
TypeScript überhaupt – Modul 3 vertieft es.

</details>

---

## 2.3 Optionale Felder, `readonly` & Index-Signaturen

### Theorie

Drei Modifizierer machen aus einem starren Bauplan einen brauchbaren:

```typescript
interface Benutzer {
  readonly id: number;              // nach dem Anlegen unveraenderlich
  name: string;                     // Pflicht
  telefon?: string;                 // optional
}
```

**`readonly`** gilt pro Feld und nur für die oberste Ebene. Ein
`readonly liste: string[]` verhindert, dass du `liste` **ersetzt** – aber nicht,
dass du in die Liste hineinschreibst. Dafür bräuchtest du
`readonly liste: readonly string[]`.

**Optionale Felder** (`?`) bedeuten in diesem Projekt etwas Präziseres als
sonst, denn `exactOptionalPropertyTypes` ist aktiv:

> `telefon?: string` heißt "entweder ein String **oder das Feld fehlt ganz**" –
> **nicht** "darf `undefined` sein".

```typescript
const a: Benutzer = { id: 1, name: "Ada" };                    // ok
// const b: Benutzer = { id: 1, name: "Ada", telefon: undefined }; // Fehler!
```

Willst du `undefined` ausdrücklich erlauben, schreib es hin:
`telefon?: string | undefined`. Der Unterschied klingt nach Haarspalterei, ist
aber real: `"telefon" in a` ist im einen Fall `false`, im anderen `true` – und
`Object.keys` liefert unterschiedliche Ergebnisse.

**Index-Signaturen** beschreiben Objekte, deren Schlüssel erst zur Laufzeit
feststehen:

```typescript
interface Woerterbuch {
  [schluessel: string]: string;
}
```

Zwei Optionen aus der `tsconfig.json` greifen hier zusammen:

- `noUncheckedIndexedAccess`: `woerterbuch["hallo"]` hat den Typ
  `string | undefined` – der Schlüssel könnte ja fehlen.
- `noPropertyAccessFromIndexSignature`: Du musst mit **Klammern** zugreifen
  (`woerterbuch["hallo"]`), nicht mit Punkt. So sieht man beim Lesen sofort:
  "Dieser Schlüssel ist nicht garantiert."

Wo die Schlüssel bekannt sind, ist `Record<...>` fast immer besser – dort
meldet der Compiler fehlende Fälle.

**`as const`** schließlich friert einen ganzen Wert ein: alle Felder werden
`readonly`, alle Werte bekommen ihren engsten Literal-Typ.

```typescript
const einstellungen = { sprache: "de", maxVersuche: 3 } as const;
// Typ: { readonly sprache: "de"; readonly maxVersuche: 3 }
```

### Code-Beispiele

```typescript
// readonly und optional
interface Benutzer {
  readonly id: number;
  name: string;
  telefon?: string;
}

const ada: Benutzer = { id: 1, name: "Ada Lovelace" };
// ada.id = 2; // Fehler: Cannot assign to 'id' (read-only property)
ada.name = "Ada King"; // erlaubt

console.log(ada.name, "| Telefon:", ada.telefon ?? "nicht hinterlegt");
```

```typescript
// Index-Signatur: Klammer-Zugriff, Ergebnis ist "string | undefined"
interface Woerterbuch {
  [schluessel: string]: string;
}

const uebersetzungen: Woerterbuch = { hallo: "hello", tschuess: "bye" };

// uebersetzungen.hallo;         // Fehler (noPropertyAccessFromIndexSignature)
console.log(uebersetzungen["hallo"] ?? "(unbekannt)");     // hello
console.log(uebersetzungen["guten tag"] ?? "(unbekannt)"); // (unbekannt)
```

```typescript
// Record ist praeziser, wenn die Schluessel feststehen
type Status = "offen" | "in-arbeit" | "erledigt";

const statusTexte: Record<Status, string> = {
  offen: "Noch nichts passiert",
  "in-arbeit": "Laeuft gerade",
  erledigt: "Fertig",
  // fehlte ein Eintrag, meldet der Compiler es sofort
};

console.log(statusTexte["in-arbeit"]); // Laeuft gerade
```

```typescript
// as const: einfrieren und Literal-Typen ableiten
const farben = ["rot", "gelb", "gruen"] as const;
// Typ: readonly ["rot", "gelb", "gruen"]

type Farbe = (typeof farben)[number]; // "rot" | "gelb" | "gruen"
const gewaehlt: Farbe = "gruen";

console.log(farben.join(", "), "| gewaehlt:", gewaehlt);
```

### ⚠️ Häufiger Fehler

`readonly` und `as const` werden für Laufzeitschutz gehalten. Sie sind reine
Compiler-Regeln und verschwinden beim Kompilieren:

```typescript
const konfig = { port: 3000 } as const;
// konfig.port = 4000;         // Fehler beim Kompilieren
(konfig as { port: number }).port = 4000; // laeuft durch - und aendert den Wert
```

Wenn du echten Laufzeitschutz brauchst, ist `Object.freeze()` das Werkzeug.

Der zweite häufige Fehler ist die offene Index-Signatur als Bequemlichkeit:

```typescript
interface Konfig { [k: string]: string; }
const c: Konfig = { hsot: "localhost" }; // Tippfehler - niemand merkt es
```

Eine Index-Signatur schaltet die Tippfehler-Prüfung für Feldnamen ab. Setze
sie nur ein, wenn die Schlüssel wirklich unbekannt sind.

### 🎯 Übungsaufgabe

Beschreibe die Konfiguration einer App: eine unveränderliche `version`, ein
Pflichtfeld `host`, ein optionaler `port` und beliebig viele
Umgebungsvariablen als Zeichenketten. Gib anschließend `host:port` und eine
einzelne Umgebungsvariable sicher aus.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
interface AppKonfiguration {
  readonly version: string;
  host: string;
  port?: number;
  umgebung: Record<string, string>; // eigenes Feld statt offener Index-Signatur
}

const konfig: AppKonfiguration = {
  version: "1.0.0",
  host: "localhost",
  // "port" wird weggelassen - NICHT auf undefined gesetzt.
  // Wegen exactOptionalPropertyTypes waere "port: undefined" ein Fehler.
  umgebung: { NODE_ENV: "development" },
};

// port ist "number | undefined" -> Fallback noetig
console.log(`${konfig.host}:${konfig.port ?? 3000}`); // localhost:3000

// Record-Zugriff: Klammern (noPropertyAccessFromIndexSignature) und
// Fallback (noUncheckedIndexedAccess).
console.log(konfig.umgebung["NODE_ENV"] ?? "(nicht gesetzt)"); // development
console.log(konfig.umgebung["DATABASE_URL"] ?? "(nicht gesetzt)"); // (nicht gesetzt)

// konfig.version = "2.0.0"; // Fehler: read-only
```

Der Trick ist, die Index-Signatur in ein **eigenes Feld** (`umgebung`) zu
sperren, statt sie auf das ganze Interface zu legen. So bleiben `version`,
`host` und `port` weiterhin tippfehlergeschützt.

</details>

---

## 2.4 Klassen & Zugriffsmodifizierer

### Theorie

Eine Klasse ist ein Bauplan mit eingebautem Verhalten: Sie bündelt Daten
(Felder) und die Funktionen, die auf diesen Daten arbeiten (Methoden). Der
eigentliche Gewinn ist **Kapselung** – von außen sieht man nur, was man sehen
soll.

Vier Sichtbarkeiten stehen zur Verfügung:

| Modifizierer | Sichtbar für | Zur Laufzeit dicht? |
|---|---|---|
| `public` (Standard) | jeden | – |
| `protected` | diese Klasse + Unterklassen | nein |
| `private` | nur diese Klasse | **nein** |
| `#feld` | nur diese Klasse | **ja** |

Der Unterschied zwischen `private` und `#feld` ist wichtig: `private` ist eine
reine Compiler-Regel. Im kompilierten JavaScript ist das Feld ganz normal
erreichbar. `#feld` ist echtes JavaScript und auch zur Laufzeit unzugänglich.
Für neuen Code: `#` bevorzugen.

**Parameter-Properties** sparen die übliche Zuweisungszeremonie. Statt

```typescript
class Konto {
  public readonly inhaber: string;
  constructor(inhaber: string) {
    this.inhaber = inhaber;
  }
}
```

schreibst du einfach:

```typescript
class Konto {
  constructor(public readonly inhaber: string) {}
}
```

Der Modifizierer im Konstruktorparameter legt das Feld an **und** weist es zu.

**Getter und Setter** sehen von außen aus wie Felder, sind aber Methoden. Das
ist die Standardlösung für "lesen ja, schreiben nur unter Bedingungen":

```typescript
get kontostand(): number { return this.#kontostand; }
set kontostand(wert: number) {
  if (wert < 0) throw new Error("negativ");
  this.#kontostand = wert;
}
```

**`static`** gehört zur Klasse, nicht zur Instanz – für Konstanten,
Fabrikmethoden und Zähler.

Ein Wort zu `strictPropertyInitialization` (in diesem Projekt aktiv): Jedes
Feld muss entweder direkt initialisiert oder im Konstruktor gesetzt werden.
Sonst wäre es beim ersten Zugriff `undefined`, obwohl der Typ etwas anderes
verspricht.

### Code-Beispiele

```typescript
class Konto {
  static readonly waehrung = "EUR";   // gehoert zur Klasse
  #kontostand: number;                // echtes privates Feld

  constructor(
    public readonly inhaber: string,  // Parameter-Property
    startguthaben: number = 0
  ) {
    this.#kontostand = startguthaben; // strictPropertyInitialization erfuellt
  }

  get kontostand(): number {
    return this.#kontostand;
  }

  set kontostand(wert: number) {
    if (wert < 0) throw new Error("Kontostand darf nicht negativ sein.");
    this.#kontostand = wert;
  }

  protected buche(betrag: number): void {
    this.#kontostand += betrag;
  }

  einzahlen(betrag: number): void {
    if (betrag <= 0) throw new Error("Einzahlung muss positiv sein.");
    this.buche(betrag);
  }
}

const konto = new Konto("Ada", 100);
konto.einzahlen(50);
console.log(`${konto.inhaber}: ${konto.kontostand} ${Konto.waehrung}`); // Ada: 150 EUR
```

```typescript
// Was der Compiler blockiert:
// konto.#kontostand;      // Fehler - privates Feld
// konto.buche(1000);      // Fehler - protected
// konto.inhaber = "Bob";  // Fehler - readonly

// Der Setter prueft, bevor er schreibt:
try {
  konto.kontostand = -1;
} catch (fehler) {
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  console.log(text); // "Kontostand darf nicht negativ sein."
}
```

### ⚠️ Häufiger Fehler

`private` wird für einen Sicherheitsmechanismus gehalten. Ist es nicht:

```typescript
class Geheim {
  private schluessel = "abc123";
}

const g = new Geheim();
// g.schluessel;                        // Fehler beim Kompilieren
console.log((g as { schluessel: string }).schluessel); // "abc123" - laeuft
```

Ein einziger Cast, und das Feld liegt offen. Bei `#schluessel` geht das nicht –
der Zugriff wirft schon in JavaScript einen Fehler.

Zweiter Stolperstein: `this` in einem herausgelösten Callback.

```typescript
const zaehler = new Konto("Ada");
// setTimeout(zaehler.einzahlen, 100); // "this" ist hier nicht mehr das Konto
setTimeout(() => zaehler.einzahlen(10), 100); // richtig
```

### 🎯 Übungsaufgabe

Baue eine Klasse `Temperatur`, die intern in Celsius rechnet. Von außen soll
man Celsius **und** Fahrenheit lesen und setzen können. Unter dem absoluten
Nullpunkt (−273,15 °C) soll ein Fehler geworfen werden.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
class Temperatur {
  static readonly ABSOLUTER_NULLPUNKT = -273.15;

  // Ein einziges Feld haelt die Wahrheit - alles andere wird berechnet.
  #celsius: number;

  constructor(celsius: number) {
    // Die Pruefung liegt im Setter, also nutzen wir ihn auch im Konstruktor.
    this.#celsius = Temperatur.ABSOLUTER_NULLPUNKT;
    this.celsius = celsius;
  }

  get celsius(): number {
    return this.#celsius;
  }

  set celsius(wert: number) {
    if (wert < Temperatur.ABSOLUTER_NULLPUNKT) {
      throw new Error(`Unter ${Temperatur.ABSOLUTER_NULLPUNKT} Grad C geht nicht.`);
    }
    this.#celsius = wert;
  }

  // Fahrenheit ist kein Feld, sondern eine Sicht auf dasselbe Datum.
  get fahrenheit(): number {
    return this.#celsius * 1.8 + 32;
  }

  set fahrenheit(wert: number) {
    this.celsius = (wert - 32) / 1.8; // laeuft ueber den pruefenden Setter
  }
}

const t = new Temperatur(20);
console.log(t.celsius, t.fahrenheit); // 20 68

t.fahrenheit = 212;
console.log(t.celsius); // 100

try {
  t.celsius = -300;
} catch (fehler) {
  console.log(fehler instanceof Error ? fehler.message : String(fehler));
}
```

Der Kern: **eine** Quelle der Wahrheit (`#celsius`), alles andere abgeleitet.
So kann Fahrenheit gar nicht aus dem Takt geraten.

</details>

---

## 2.5 Vererbung, `abstract` & Interfaces implementieren

### Theorie

Zwei Schlüsselwörter sehen ähnlich aus und bedeuten Grundverschiedenes:

- **`extends`** – "ist ein". Die Unterklasse **erbt** Felder und
  Implementierungen. Es geht nur eine Basisklasse.
- **`implements`** – "erfüllt die Form von". Die Klasse **verspricht** nur,
  bestimmte Felder und Methoden zu haben; geerbt wird nichts. Beliebig viele
  Interfaces sind erlaubt.

```typescript
class Festgeld extends Anlage implements Verzinsbar { … }
//              ^ erbt Code        ^ verspricht Form
```

Eine **abstrakte Klasse** ist ein halbfertiger Bauplan: Sie darf fertige
Methoden mitbringen, aber nicht selbst instanziiert werden. `abstract`
markierte Methoden **müssen** von jeder Unterklasse geliefert werden.

```typescript
abstract class Anlage {
  abstract laufzeitInJahren(): number; // Unterklasse muss liefern
  endwert(zins: number): number { … }  // fertig, wird geerbt
}
// new Anlage(); // Fehler: Cannot create an instance of an abstract class.
```

Wann was?

| Du willst … | Nimm |
|---|---|
| nur die Form vorschreiben, kein Code | `interface` |
| Form **und** gemeinsamen Code vorschreiben | `abstract class` |
| Code von einer konkreten Klasse übernehmen | `extends` |
| mehrere Rollen erfüllen | mehrere `implements` |

**`override`** ist in diesem Projekt Pflicht (`noImplicitOverride`): Sobald du
eine geerbte Methode ersetzt, muss das Schlüsselwort davor. Das klingt nach
Bürokratie, fängt aber einen fiesen Fehler ab – vertippst du dich im
Methodennamen, entsteht ohne `override` still eine **neue** Methode, und die
alte läuft weiter. Mit `override` meldet der Compiler sofort: *"This member
cannot have an 'override' modifier because it is not declared in the base
class."*

Und noch eine Regel: `super()` muss im Konstruktor der Unterklasse aufgerufen
werden, **bevor** du `this` benutzt.

### Code-Beispiele

```typescript
interface Verzinsbar {
  readonly zinssatz: number;
  zinsenBerechnen(): number;
}

abstract class Anlage {
  constructor(protected betrag: number) {}

  abstract laufzeitInJahren(): number;    // Pflicht fuer Unterklassen

  endwert(zinssatz: number): number {     // fertig geerbt
    return this.betrag * (1 + zinssatz) ** this.laufzeitInJahren();
  }

  beschreibung(): string {
    return `Anlage ueber ${this.betrag} EUR`;
  }
}
```

```typescript
class Festgeld extends Anlage implements Verzinsbar {
  readonly zinssatz = 0.03;

  constructor(betrag: number, private readonly jahre: number) {
    super(betrag); // vor jedem "this"
  }

  override beschreibung(): string {          // ersetzt -> override Pflicht
    return `${super.beschreibung()} fuer ${this.jahre} Jahre`;
  }

  laufzeitInJahren(): number {               // abstrakt -> kein override
    return this.jahre;
  }

  zinsenBerechnen(): number {
    return this.endwert(this.zinssatz) - this.betrag;
  }
}

const festgeld = new Festgeld(1000, 5);
console.log(festgeld.beschreibung());              // Anlage ueber 1000 EUR fuer 5 Jahre
console.log(festgeld.zinsenBerechnen().toFixed(2)); // 159.27
```

```typescript
// Weil Festgeld "Verzinsbar" implementiert, passt es ueberall dorthin,
// wo nur die Form verlangt wird - die Klasse selbst ist egal.
function zinsreport(anlage: Verzinsbar): string {
  return `${(anlage.zinssatz * 100).toFixed(1)} % -> ${anlage.zinsenBerechnen().toFixed(2)} EUR`;
}

console.log(zinsreport(festgeld)); // 3.0 % -> 159.27 EUR
```

### ⚠️ Häufiger Fehler

Der größte Fehler ist Vererbung an der falschen Stelle. Vererbung koppelt zwei
Klassen fest aneinander – jede Änderung an der Basis trifft alle Erben.

```typescript
// Falsch: eine Rechteck-Klasse "ist" kein Quadrat und umgekehrt
class Rechteck { constructor(public breite: number, public hoehe: number) {} }
class Quadrat extends Rechteck { … } // setzt breite = hoehe -> bricht Annahmen
```

Faustregeln:

- **"ist ein"** → `extends`
- **"kann etwas"** → `implements` mit einem Interface
- **"hat etwas"** → gar keine Vererbung, sondern Komposition (das Objekt
  einfach als Feld hereinreichen)

Im Zweifel: Komposition. Sie ist fast immer leichter zu ändern.

Zweiter Fehler: `abstract` mit `interface` verwechseln. Ein Interface
verschwindet beim Kompilieren komplett; eine abstrakte Klasse erzeugt echten
JavaScript-Code. Brauchst du keinen gemeinsamen Code, nimm das Interface.

### 🎯 Übungsaufgabe

Modelliere Mitarbeiter: Eine abstrakte Basisklasse `Mitarbeiter` mit Namen und
einer abstrakten Methode `monatsgehalt()`. Davon abgeleitet `Festangestellter`
(fixes Gehalt) und `Freelancer` (Stundensatz × Stunden). Eine gemeinsame
Methode soll die Gehaltsabrechnung ausgeben.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
abstract class Mitarbeiter {
  // Parameter-Property: legt das Feld an und weist es zu.
  constructor(public readonly name: string) {}

  // Jede Unterklasse rechnet anders - also abstrakt.
  abstract monatsgehalt(): number;

  // Gemeinsamer Code lebt in der Basisklasse. Genau dafuer ist eine
  // abstrakte Klasse da (ein Interface koennte das nicht).
  abrechnung(): string {
    return `${this.name}: ${this.monatsgehalt().toFixed(2)} EUR`;
  }
}

class Festangestellter extends Mitarbeiter {
  constructor(name: string, private readonly jahresgehalt: number) {
    super(name); // vor jedem Zugriff auf "this"
  }

  monatsgehalt(): number {
    return this.jahresgehalt / 12;
  }
}

class Freelancer extends Mitarbeiter {
  constructor(
    name: string,
    private readonly stundensatz: number,
    private readonly stunden: number
  ) {
    super(name);
  }

  monatsgehalt(): number {
    return this.stundensatz * this.stunden;
  }

  // Ersetzt eine GEERBTE Methode -> "override" ist Pflicht.
  override abrechnung(): string {
    return `${super.abrechnung()} (${this.stunden} h)`;
  }
}

// Beide passen in dieselbe Liste - das ist der Sinn der Basisklasse.
const team: readonly Mitarbeiter[] = [
  new Festangestellter("Ada", 72000),
  new Freelancer("Grace", 90, 120),
];

for (const person of team) {
  console.log(person.abrechnung());
}
// Ada: 6000.00 EUR
// Grace: 10800.00 EUR (120 h)
```

Beachte: `monatsgehalt` bekommt **kein** `override` – es implementiert eine
abstrakte Methode, es ersetzt keine fertige. `abrechnung` in `Freelancer`
dagegen schon.

</details>

---

## 2.6 Enums – und warum Union Types meist besser sind

### Theorie

Ein Enum ist eine Liste benannter Konstanten:

```typescript
enum Status { Offen, InArbeit, Erledigt }
```

Enums sind eine der ganz wenigen TypeScript-Funktionen, die auch echten
**JavaScript-Code erzeugen**. Alles andere – Typen, Interfaces – verschwindet
beim Kompilieren spurlos. Ein Enum dagegen wird zu einem Objekt zur Laufzeit.

Bei **numerischen Enums** (der Standardform) zählt TypeScript ab `0` hoch. Das
bringt drei Probleme:

1. In der Datenbank landet `1` – beim Debuggen sagt dir das nichts.
2. Fügt jemand oben einen Eintrag ein, verschieben sich **alle** Werte. Deine
   gespeicherten Daten bedeuten plötzlich etwas anderes.
3. Numerische Enums sind "löchrig": Auch Werte, die gar kein Mitglied sind,
   rutschen leicht hinein.

Zwei Alternativen lösen dieselbe Aufgabe besser.

**1) String-Union** – wenn du die Werte nur im Typsystem brauchst:

```typescript
type Status = "offen" | "in-arbeit" | "erledigt";
```

Kein Laufzeit-Code, kein Import nötig, lesbare Werte in Logs und JSON, und der
Compiler kennt alle gültigen Fälle (inklusive Vollständigkeitsprüfung im
`switch`).

**2) `as const`-Objekt** – wenn du die Werte auch zur Laufzeit brauchst
(iterieren, per Namen ansprechen, validieren):

```typescript
const Prioritaet = {
  Niedrig: "niedrig",
  Mittel: "mittel",
  Hoch: "hoch",
} as const;

type Prioritaet = (typeof Prioritaet)[keyof typeof Prioritaet];
// "niedrig" | "mittel" | "hoch"
```

Das gibt dir alles, was ein Enum kann – Namenszugriff `Prioritaet.Hoch`,
`Object.values(...)` für die Liste – aber mit normalem JavaScript und einem
sauberen Union-Typ.

**`const enum` ist tabu.** Es wird beim Kompilieren an jeder Verwendungsstelle
durch den Wert ersetzt und existiert danach gar nicht mehr. Das bricht mit
`isolatedModules` (in diesem Projekt aktiv), Babel, esbuild und swc – also mit
fast jedem modernen Build-Werkzeug.

Wenn es unbedingt ein Enum sein soll, dann ein **String-Enum**:
`enum Rolle { Admin = "admin" }`. Lesbare Werte, nicht löchrig.

### Code-Beispiele

```typescript
// Numerisches Enum - die Probleme in drei Zeilen
enum StufeFalsch { Niedrig, Mittel, Hoch }

console.log(StufeFalsch.Mittel);            // 1 - sagt beim Debuggen nichts
console.log(Object.keys(StufeFalsch));      // ["0","1","2","Niedrig","Mittel","Hoch"]
// Fuegt jemand "SehrNiedrig" an den Anfang, ist "Mittel" ploetzlich 2.
```

```typescript
// String-Union: der Normalfall
type Status = "offen" | "in-arbeit" | "erledigt";

function beschreibe(status: Status): string {
  switch (status) {
    case "offen":     return "Noch nichts passiert";
    case "in-arbeit": return "Laeuft gerade";
    case "erledigt":  return "Fertig";
    default: {
      // Kaeme ein vierter Status dazu, waere "status" hier nicht mehr
      // "never" - der Compiler meldet den vergessenen Fall sofort.
      const nichtErreichbar: never = status;
      throw new Error(`Unbekannter Status: ${String(nichtErreichbar)}`);
    }
  }
}

console.log(beschreibe("offen")); // Noch nichts passiert
// beschreibe("erledgit");        // Fehler: Tippfehler wird abgefangen
```

```typescript
// as-const-Objekt: wenn du die Werte auch zur Laufzeit brauchst
const Prioritaet = {
  Niedrig: "niedrig",
  Mittel: "mittel",
  Hoch: "hoch",
} as const;

type Prioritaet = (typeof Prioritaet)[keyof typeof Prioritaet];

const meine: Prioritaet = Prioritaet.Hoch;            // Namenszugriff
const alle: readonly Prioritaet[] = Object.values(Prioritaet); // Liste

console.log(meine, "|", alle.join(", ")); // hoch | niedrig, mittel, hoch
```

```typescript
// Wenn schon Enum, dann ein String-Enum
enum Rolle {
  Gast = "gast",
  Admin = "admin",
}

console.log(Rolle.Admin);          // "admin" - lesbar in Logs und JSON
// const r: Rolle = "admin";       // Fehler: Strings sind nicht zuweisbar
```

### ⚠️ Häufiger Fehler

Der häufigste Fehler ist, Enum-Werte in einer Datenbank oder API zu
speichern – als Zahlen:

```typescript
enum Stufe { Niedrig, Mittel, Hoch }
// gespeichert wird: 1

// Ein halbes Jahr spaeter fuegt jemand einen Eintrag ein:
enum StufeNeu { SehrNiedrig, Niedrig, Mittel, Hoch }
// gespeicherte 1 bedeutet jetzt "Niedrig" statt "Mittel" - stillschweigend.
```

Nach außen (Datenbank, JSON, URL) gehören immer **Strings**. Sie überleben
Umsortierungen und sind in Logs sofort lesbar.

Zweiter Fehler: `const enum`. Es sieht nach einer Optimierung aus, ist aber
mit `isolatedModules` und jedem transpiler-basierten Build (Babel, esbuild,
swc, Vite) unbrauchbar. Es gibt keinen Grund, es zu benutzen.

### 🎯 Übungsaufgabe

Ersetze dieses numerische Enum durch eine Lösung, die zusätzlich erlaubt, über
alle Werte zu iterieren und einen unbekannten Wert aus einer API zu prüfen.

```typescript
enum Bestellstatus { Neu, Bezahlt, Versandt, Storniert }
```

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// as-const-Objekt: Namenszugriff wie beim Enum, aber ohne dessen Nachteile.
const Bestellstatus = {
  Neu: "neu",
  Bezahlt: "bezahlt",
  Versandt: "versandt",
  Storniert: "storniert",
} as const;

// Der Union-Typ entsteht automatisch aus den Werten. Typ und Konstante
// duerfen denselben Namen tragen - TypeScript haelt Typ- und Wert-Ebene
// getrennt.
type Bestellstatus = (typeof Bestellstatus)[keyof typeof Bestellstatus];
// "neu" | "bezahlt" | "versandt" | "storniert"

const alleStatus: readonly Bestellstatus[] = Object.values(Bestellstatus);

// Type Guard: prueft einen unbekannten Wert von aussen und verengt
// gleichzeitig seinen Typ.
function istBestellstatus(wert: unknown): wert is Bestellstatus {
  return alleStatus.some((s) => s === wert);
}

// 1) Namenszugriff wie beim Enum
const status: Bestellstatus = Bestellstatus.Bezahlt;
console.log(status); // "bezahlt" - lesbar, nicht "1"

// 2) Iterieren
console.log(alleStatus.join(", ")); // neu, bezahlt, versandt, storniert

// 3) Daten von aussen pruefen
const ausApi: unknown = "versandt";
if (istBestellstatus(ausApi)) {
  console.log("gueltiger Status:", ausApi); // hier ist der Typ verengt
} else {
  console.log("ungueltiger Status");
}

console.log(istBestellstatus("geloescht")); // false
```

Das ist der volle Funktionsumfang eines Enums – nur mit lesbaren Werten,
ohne Zahlenmagie und mit einer Validierung, die sich nicht von selbst
veraltet: Kommt ein Status dazu, wächst `alleStatus` automatisch mit.

</details>

---

## 📋 Zusammenfassung & Cheat-Sheet

```typescript
// --- Arrays & Tuples -------------------------------------------------------
const a: string[] = ["x"];              // Kurzform (Normalfall)
const b: Array<string> = ["x"];         // Langform (identisch)
const c: readonly number[] = [1, 2];    // kein push/pop/sort
const t: [breite: number, laenge: number] = [52.5, 13.4]; // feste Laenge

const wert = a[0];        // Typ: string | undefined (noUncheckedIndexedAccess)
const sicher = a[0] ?? "";// Typ: string
for (const x of a) { … }  // x ist string - kein undefined

// --- Objekttypen -----------------------------------------------------------
interface Benutzer {          // erweiterbar, merged
  readonly id: number;        // nach dem Anlegen fest
  name: string;               // Pflicht
  telefon?: string;           // fehlt ganz - NICHT "= undefined"
}
interface Admin extends Benutzer { rechte: readonly string[]; }

type Status = "offen" | "erledigt";        // Union - nur type kann das
type MitZeit = Benutzer & { zeit: string };// Intersection
type Fn = (x: number) => string;           // Funktionstyp

// --- Index-Signaturen & as const -------------------------------------------
interface Dict { [k: string]: string; }
const d: Dict = { a: "1" };
d["a"];                       // Klammern! (noPropertyAccessFromIndexSignature)
const r: Record<Status, string> = { offen: "…", erledigt: "…" }; // praeziser

const konf = { port: 3000 } as const;      // alles readonly + Literal-Typen
const farben = ["rot", "gruen"] as const;
type Farbe = (typeof farben)[number];      // "rot" | "gruen"

// --- Klassen ---------------------------------------------------------------
class Konto {
  static readonly waehrung = "EUR";        // an der Klasse
  #stand: number;                          // echt privat (auch zur Laufzeit)
  constructor(public readonly inhaber: string, start = 0) { this.#stand = start; }
  get stand(): number { return this.#stand; }
  set stand(v: number) { if (v < 0) throw new Error("…"); this.#stand = v; }
  protected buche(x: number): void { this.#stand += x; }  // + Unterklassen
}

// --- Vererbung -------------------------------------------------------------
interface Verzinsbar { zinssatz: number; }
abstract class Anlage {
  abstract laufzeit(): number;             // Unterklasse MUSS liefern
  endwert(): number { … }                  // wird geerbt
}
class Festgeld extends Anlage implements Verzinsbar {
  zinssatz = 0.03;
  constructor(private jahre: number) { super(); }  // super() vor "this"
  override endwert(): number { … }         // Pflicht (noImplicitOverride)
  laufzeit(): number { return this.jahre; }// abstrakt -> KEIN override
}

// --- Enums vs. Unions ------------------------------------------------------
type Ampel = "rot" | "gelb" | "gruen";     // Standardwahl
const Rolle = { Admin: "admin" } as const; // wenn zur Laufzeit gebraucht
type Rolle = (typeof Rolle)[keyof typeof Rolle];
enum Farbcode { Rot = "rot" }              // wenn schon Enum, dann String-Enum
// const enum X { … }                      // NIEMALS
```

| Frage | Antwort |
|---|---|
| `T[]` oder `Array<T>`? | `T[]`, außer der Elementtyp ist selbst kompliziert. |
| Warum ist `array[0]` `T \| undefined`? | `noUncheckedIndexedAccess` – TypeScript kennt die Länge nicht. Nutze `??`, eine Prüfung oder `for..of`. |
| Array oder Tuple? | Feste Länge und feste Bedeutung pro Position → Tuple. Ab drei Feldern besser ein Objekt. |
| `interface` oder `type`? | Objektform, die erweitert wird → `interface`. Union, Tuple, Funktionstyp → `type`. |
| Was kann nur `interface`? | Declaration Merging (zwei gleichnamige verschmelzen). |
| Darf `foo?: string` auf `undefined` gesetzt werden? | Nein – `exactOptionalPropertyTypes`. Feld weglassen oder `string \| undefined` schreiben. |
| Index-Signatur oder `Record`? | Schlüssel bekannt → `Record`. Nur bei wirklich unbekannten Schlüsseln die Index-Signatur. |
| `private` oder `#feld`? | `#feld` – nur das ist auch zur Laufzeit dicht. |
| Schützt `readonly` zur Laufzeit? | Nein. Dafür `Object.freeze()`. |
| `extends` oder `implements`? | „ist ein" → `extends`. „kann etwas" → `implements`. „hat etwas" → Komposition. |
| Wann `override`? | Immer beim Ersetzen einer **geerbten** Methode. Nicht beim Implementieren einer `abstract`-Methode. |
| Enum oder Union? | Union. Enum nur als String-Enum und nur, wenn die Codebasis es schon nutzt. `const enum` nie. |

---

← [Kursübersicht](../README.md) | [Modul 1: Die Fundamente](../modul-1-fundamente/README.md) | [Modul 3: Fortgeschritten](../modul-3-fortgeschritten/README.md) →
