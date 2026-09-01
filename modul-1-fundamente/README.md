# Modul 1: Die Fundamente (Anfänger)

TypeScript ist kein neues JavaScript. Es ist JavaScript **plus ein Typsystem**,
das dir beim Schreiben über die Schulter schaut und dich warnt, bevor dein Code
überhaupt läuft. In diesem Modul lernst du dieses Typsystem von Grund auf kennen.

## 🎯 Lernziele

Nach diesem Modul kannst du:

- erklären, was TypeScript dir gegenüber reinem JavaScript bringt
- Variablen mit `let` und `const` typsicher deklarieren
- die primitiven Typen (`string`, `number`, `boolean`, `null`, `undefined`, `bigint`, `symbol`) verwenden
- entscheiden, wann du einen Typ **hinschreiben** musst und wann TypeScript ihn **selbst erkennt**
- Funktionen vollständig typisieren (Parameter, Rückgabewert, optionale Parameter, Default-Werte, Rest-Parameter)
- die Sondertypen `any`, `unknown`, `never` und `void` unterscheiden und richtig einsetzen

## Inhalt

- [1.1 Was TypeScript wirklich macht](#11-was-typescript-wirklich-macht)
- [1.2 Variablen (`let`, `const`) & primitive Typen](#12-variablen-let-const--primitive-typen)
- [1.3 Type Annotation vs. Type Inference](#13-type-annotation-vs-type-inference)
- [1.4 Funktionen typisieren](#14-funktionen-typisieren)
- [1.5 `any`, `unknown`, `never` & `void`](#15-any-unknown-never--void)
- [📋 Zusammenfassung & Cheat-Sheet](#-zusammenfassung--cheat-sheet)

**Lauffähige Beispiele:** [`beispiele/`](./beispiele/)

| Datei | Thema |
|---|---|
| [`01-variablen-und-typen.ts`](./beispiele/01-variablen-und-typen.ts) | Variablen & primitive Typen |
| [`02-type-inference.ts`](./beispiele/02-type-inference.ts) | Automatische Typableitung |
| [`03-funktionen.ts`](./beispiele/03-funktionen.ts) | Funktionen typisieren |
| [`04-any-unknown-never.ts`](./beispiele/04-any-unknown-never.ts) | Die Sondertypen |

---

## 1.1 Was TypeScript wirklich macht

### Theorie

Stell dir vor, du packst Umzugskartons. In JavaScript sind alle Kartons
unbeschriftet: Du kannst reinlegen, was du willst, und merkst erst beim
Auspacken am Zielort, dass im Karton "Geschirr" Bücher liegen. TypeScript
beschriftet die Kartons – und meckert schon beim Einpacken, wenn du das
Falsche hineinlegen willst.

Drei Dinge sind wichtig zu verstehen:

1. **TypeScript läuft nie.** Der Browser und Node.js kennen nur JavaScript.
   TypeScript wird vor dem Ausführen zu JavaScript **kompiliert** – dabei
   werden alle Typinformationen einfach entfernt.
2. **Typen sind eine Entwicklungshilfe, kein Laufzeitschutz.** Ein Typfehler
   wird beim Kompilieren gemeldet, nicht beim Ausführen. Daten, die zur
   Laufzeit von außen kommen (HTTP-Request, JSON-Datei, Benutzereingabe),
   musst du trotzdem prüfen – dazu mehr in [Modul 6](../modul-6-sicherheit-auth/README.md).
3. **Jedes gültige JavaScript ist gültiges TypeScript.** Du kannst also
   schrittweise umsteigen und musst nicht alles auf einmal umschreiben.

Der Nutzen zeigt sich vor allem in drei Momenten: Der Editor schlägt dir die
richtigen Eigenschaften vor (Autovervollständigung), Tippfehler fallen sofort
auf, und beim Umbenennen einer Eigenschaft zeigt dir der Compiler zuverlässig
**alle** Stellen, die du anpassen musst.

### Code-Beispiele

```typescript
// So sieht der Unterschied konkret aus.

// JavaScript: faellt erst zur Laufzeit auf - und nur, wenn diese Zeile
// tatsaechlich ausgefuehrt wird.
const preis = "10";
const menge = 3;
// preis * menge ergibt 30 - aber preis + menge ergaebe "103". Autsch.

// TypeScript: der Fehler wird SOFORT beim Schreiben gemeldet.
const preisTypisiert: number = 10;
const mengeTypisiert: number = 3;
console.log(preisTypisiert * mengeTypisiert); // 30 - garantiert eine Zahl
```

```typescript
// Was TypeScript aus deinem Code macht:

// Dein TypeScript ...
const name: string = "Ada";

// ... wird zu diesem JavaScript kompiliert:
// const name = "Ada";
//
// Die Typannotation ":string" ist im fertigen JavaScript nicht mehr vorhanden.
```

### ⚠️ Häufiger Fehler

Viele Einsteiger glauben, TypeScript prüfe die Typen auch beim Ausführen. Das
tut es nicht. Wenn du per `fetch` ein JSON-Objekt lädst und behauptest, es sei
vom Typ `Benutzer`, glaubt TypeScript dir das einfach – ob die Daten wirklich
so aussehen, weiß niemand. Typen sind ein Versprechen, das *du* einhalten
musst; der Compiler prüft nur, ob du dich innerhalb deines eigenen Codes an
dein Versprechen hältst.

### 🎯 Übungsaufgabe

Erkläre in eigenen Worten (z. B. als Kommentar in einer Datei), warum dieser
Code in JavaScript funktioniert, in TypeScript aber einen Fehler ergibt:

```typescript
let zaehler = 0;
zaehler = "drei";
```

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
let zaehler = 0;
// TypeScript leitet aus dem Anfangswert 0 automatisch den Typ "number" ab.
// Die Variable ist damit fuer immer auf Zahlen festgelegt.

// zaehler = "drei";
// Fehler: Type 'string' is not assignable to type 'number'.
//
// In JavaScript gaebe es hier keinen Fehler - der Variablen ist es egal, was
// sie enthaelt. Der Fehler wuerde erst spaeter auffallen, naemlich dann, wenn
// jemand mit "zaehler" rechnen will und ploetzlich "NaN" herauskommt.

zaehler = 3; // so ist es richtig
console.log(zaehler);
```

</details>

---

## 1.2 Variablen (`let`, `const`) & primitive Typen

### Theorie

Eine Variable ist wie eine beschriftete Kiste. In TypeScript steht auf dem
Etikett zusätzlich, **was** hineindarf:

```typescript
const vorname: string = "Ada";
//    ^Name    ^Typ     ^Wert
```

Für das Deklarieren gilt eine einfache Regel:

- **`const`** ist die Standardwahl. Sie bedeutet: Dieser Name zeigt immer auf
  denselben Wert.
- **`let`** nur dann, wenn der Wert sich später wirklich ändert (z. B. ein
  Zähler in einer Schleife).
- **`var`** benutzt du nie mehr. Es hat ein anderes, fehleranfälliges
  Gültigkeitsverhalten und gilt seit ES6 als überholt.

Die **primitiven Typen** sind die kleinsten Bausteine:

| Typ | Wofür | Beispiel |
|---|---|---|
| `string` | Text | `"Hallo"`, `` `Hi ${name}` `` |
| `number` | alle Zahlen (auch Kommazahlen) | `42`, `3.14`, `-7` |
| `boolean` | wahr/falsch | `true`, `false` |
| `null` | bewusst gesetzte Leere | `null` |
| `undefined` | noch gar kein Wert gesetzt | `undefined` |
| `bigint` | sehr große Ganzzahlen | `9007199254740993n` |
| `symbol` | garantiert eindeutiger Schlüssel | `Symbol("id")` |

Wichtig: TypeScript kennt **kein** `int` oder `float`. Alle Zahlen sind
`number`. Nur wenn du über die Grenze von ca. 9 Billiarden hinausmusst,
brauchst du `bigint`.

### Code-Beispiele

```typescript
// Primitive Typen mit expliziter Annotation
const vorname: string = "Ada";
const alter: number = 36;
const istAktiv: boolean = true;
const sehrGrosseZahl: bigint = 9_007_199_254_740_993n;

// Unterstriche in Zahlen sind reine Lesehilfe fuer Menschen:
const einwohnerzahl = 8_400_000; // identisch zu 8400000
```

```typescript
// null vs. undefined - der Unterschied in einem Satz:
//   undefined = "hier wurde noch nie etwas hingelegt"
//   null      = "hier liegt absichtlich nichts"

let nochNichtGeladen: string | undefined; // Wert kommt spaeter
const bewusstLeer: string | null = null;  // Wert existiert absichtlich nicht

console.log(nochNichtGeladen); // undefined
console.log(bewusstLeer);      // null
```

```typescript
// Template Literals sind typsicher: TypeScript weiss, dass hier ein string
// herauskommt, egal was du einsetzt.
const stadt = "Berlin";
const begruessung: string = `Willkommen in ${stadt}!`;
console.log(begruessung); // "Willkommen in Berlin!"
```

### ⚠️ Häufiger Fehler

Der Klassiker ist die Verwechslung von `const` und "unveränderlich".
`const` schützt nur den **Namen**, nicht den **Inhalt**:

```typescript
const werte = [1, 2, 3];
werte.push(4);       // erlaubt! Das Array selbst darf sich aendern.
// werte = [9, 8, 7]; // Fehler: der Name darf nicht neu belegt werden.
```

Wenn du auch den Inhalt schützen willst, brauchst du `readonly` oder
`as const` – das lernst du in [Modul 2](../modul-2-mittelstufe/README.md).

### 🎯 Übungsaufgabe

Deklariere die Daten eines Buches mit passenden Typen: Titel, Seitenzahl,
Erscheinungsjahr, und ob du es schon gelesen hast. Gib anschließend einen Satz
wie `"Der Hobbit (1937), 310 Seiten - gelesen: ja"` auf der Konsole aus.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
const titel: string = "Der Hobbit";
const seitenzahl: number = 310;
const erscheinungsjahr: number = 1937;
const gelesen: boolean = true;

// Alle vier Werte aendern sich nie -> alle vier bekommen "const".
console.log(
  `${titel} (${erscheinungsjahr}), ${seitenzahl} Seiten - gelesen: ${gelesen ? "ja" : "nein"}`
);
// Der Hobbit (1937), 310 Seiten - gelesen: ja
```

Beachte: Die expliziten Annotationen sind hier eigentlich überflüssig, weil
TypeScript die Typen selbst erkennt. Warum das kein Widerspruch ist, klärt
der nächste Abschnitt.

</details>

---

## 1.3 Type Annotation vs. Type Inference

### Theorie

Es gibt zwei Wege, wie ein Typ zustande kommt:

- **Type Annotation** – du schreibst ihn hin: `const stadt: string = "Berlin";`
- **Type Inference** – TypeScript leitet ihn selbst ab: `const stadt = "Berlin";`

Beide Varianten ergeben exakt denselben Typ und exakt dieselbe Strenge. Die
Inferenz ist kein "schwächerer" Modus, sondern der Normalfall.

Die Faustregel für die Praxis lautet:

> **Werte** darf TypeScript ableiten. **Schnittstellen** schreibst du hin.

Konkret heißt das: Bei einer Variablen mit Anfangswert lässt du die Annotation
weg (sie wäre nur Rauschen). Bei Funktionsparametern und Rückgabewerten
schreibst du sie hin – das ist der Vertrag, den andere Entwickler lesen, ohne
deine Implementierung verstehen zu müssen.

Es gibt genau zwei Situationen, in denen du bei Variablen doch annotieren musst:

1. Die Variable wird **ohne Anfangswert** deklariert (`let ergebnis: number;`).
2. Der abgeleitete Typ wäre **enger oder weiter, als du willst**
   (z. B. `let status: "offen" | "erledigt" = "offen";`).

### Code-Beispiele

```typescript
// Inference: TypeScript kennt hier bereits alle Typen exakt.
const stadt = "Berlin";              // string
const einwohnerInMillionen = 3.8;    // number
const koordinate = { breite: 52.52, laenge: 13.4 }; // { breite: number; laenge: number }
const staedte = ["Berlin", "Hamburg"];              // string[]

// Beweis: der Editor meckert sofort.
// stadt = 42; // Fehler: Type 'number' is not assignable to type 'string'.
```

```typescript
// Annotation ist Pflicht, wenn kein Anfangswert da ist:
let ergebnis: number;
ergebnis = 42; // ohne die Annotation waere "ergebnis" hier "any"
console.log(ergebnis);
```

```typescript
// Der wichtige Sonderfall: const vs. let bei Inference

const richtung1 = "links";  // Typ: "links"  (Literal-Typ, weil const)
let richtung2 = "links";    // Typ: string   (weil let sich aendern darf)

// Deshalb ist das hier erlaubt ...
richtung2 = "rechts";
// ... und dieser Typ ist genau der Grund, warum Union Types (Modul 3)
// so gut mit const zusammenspielen.
console.log(richtung1, richtung2);
```

### ⚠️ Häufiger Fehler

Ein sehr verbreitetes Muster ist, aus Unsicherheit **überall** Typen
hinzuschreiben:

```typescript
const namen: string[] = ["Ada", "Grace"];
const anzahl: number = namen.length;
const ersterName: string = namen[0]!;
```

Das ist nicht falsch, aber es ist Lärm: Drei Annotationen, die TypeScript alle
selbst gewusst hätte. Schlimmer noch – wenn sich der Ursprungstyp später
ändert, musst du jede dieser Stellen von Hand nachziehen. Weniger annotieren
heißt hier tatsächlich: weniger Wartungsaufwand.

### 🎯 Übungsaufgabe

Entscheide bei jeder Zeile, ob die Annotation nötig, sinnvoll oder überflüssig
ist – und schreibe die Zeilen entsprechend um:

```typescript
const summe: number = 10 + 5;
let benutzername: string;
const aktiv: boolean = true;
```

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// 1) Ueberfluessig: 10 + 5 ist offensichtlich eine Zahl.
const summe = 15;

// 2) Noetig: ohne Anfangswert kann TypeScript nichts ableiten.
let benutzername: string;
benutzername = "ada";

// 3) Ueberfluessig: true ist offensichtlich ein boolean.
const aktiv = true;

console.log(summe, benutzername, aktiv);
```

Merksatz: Wenn der Wert direkt danebensteht, kann die Annotation weg.

</details>

---

## 1.4 Funktionen typisieren

### Theorie

Funktionen sind die Stelle, an der sich Typsicherheit am stärksten auszahlt –
denn eine Funktion ist ein Versprechen an alle, die sie aufrufen: *"Gib mir
das hier rein, dann bekommst du das hier zurück."*

Eine vollständig typisierte Funktion sieht so aus:

```typescript
function berechnePreis(preis: number, rabatt: number): number {
  //                   ^Parameter mit Typ            ^Rueckgabetyp
  return preis - (preis * rabatt) / 100;
}
```

Vier Parameter-Varianten solltest du kennen:

| Variante | Syntax | Bedeutung |
|---|---|---|
| Pflicht | `(name: string)` | muss übergeben werden |
| Optional | `(name?: string)` | darf fehlen, ist dann `undefined` |
| Default | `(name: string = "Gast")` | wird gesetzt, wenn nichts übergeben wird |
| Rest | `(...zahlen: number[])` | beliebig viele Argumente |

Der **Rückgabetyp** darf inferiert werden, sollte aber bei öffentlichen
Funktionen hingeschrieben werden. Grund: Schreibst du ihn hin, meldet der
Compiler dir sofort, wenn deine Implementierung versehentlich etwas anderes
zurückgibt. Ohne Annotation ändert sich stillschweigend der Typ – und der
Fehler taucht erst irgendwo weiter hinten im Code auf.

`void` ist der Rückgabetyp für Funktionen, die nichts zurückgeben (z. B. eine
Funktion, die nur etwas ausgibt oder speichert).

### Code-Beispiele

```typescript
// Pflicht- und Rueckgabetyp
function verdopple(zahl: number): number {
  return zahl * 2;
}

// Optionaler Parameter: "waehrung" kann fehlen
function formatierePreis(betrag: number, waehrung?: string): string {
  return `${betrag.toFixed(2)} ${waehrung ?? "EUR"}`;
}

// Default-Wert
function begruesse(name: string, anrede: string = "Hallo"): string {
  return `${anrede}, ${name}!`;
}

// Rest-Parameter: beliebig viele Zahlen
function summiere(...zahlen: number[]): number {
  return zahlen.reduce((summe, zahl) => summe + zahl, 0);
}

console.log(verdopple(21));                 // 42
console.log(formatierePreis(9.9));          // "9.90 EUR"
console.log(formatierePreis(9.9, "USD"));   // "9.90 USD"
console.log(begruesse("Ada"));              // "Hallo, Ada!"
console.log(summiere(1, 2, 3, 4));          // 10
```

```typescript
// Arrow Functions werden genauso typisiert:
const istGerade = (zahl: number): boolean => zahl % 2 === 0;

// void: die Funktion gibt bewusst nichts zurueck
function protokolliere(nachricht: string): void {
  console.log("[LOG]", nachricht);
}

console.log(istGerade(4)); // true
protokolliere("fertig");
```

```typescript
// Ein Funktionstyp als eigenständiger Typ - nuetzlich fuer Callbacks:
type Rechenoperation = (a: number, b: number) => number;

const addieren: Rechenoperation = (a, b) => a + b;
const multiplizieren: Rechenoperation = (a, b) => a * b;
// Achtung: a und b brauchen hier KEINE Annotation mehr - TypeScript kennt
// ihre Typen bereits aus "Rechenoperation". Das nennt sich contextual typing.

console.log(addieren(2, 3), multiplizieren(2, 3)); // 5 6
```

### ⚠️ Häufiger Fehler

Optionale Parameter und Default-Werte werden gerne mit `||` kombiniert:

```typescript
function wiederhole(text: string, anzahl?: number): string {
  return text.repeat(anzahl || 3); // gefaehrlich!
}
```

Übergibst du hier `0`, wird daraus `3` – denn `0` ist "falsy". Genauso bei
`""` und `false`. Nimm stattdessen `??` (Nullish Coalescing): Es greift nur
bei `null` und `undefined`.

```typescript
function wiederholeRichtig(text: string, anzahl?: number): string {
  return text.repeat(anzahl ?? 3); // richtig
}
```

Zweiter Stolperstein: Optionale Parameter müssen **hinter** den Pflichtparametern
stehen. `function f(a?: string, b: number)` ist ein Syntaxfehler.

### 🎯 Übungsaufgabe

Schreibe eine Funktion `erstelleBenutzernamen`, die aus Vor- und Nachnamen
einen Benutzernamen in Kleinbuchstaben baut (`"Ada Lovelace"` → `"ada.lovelace"`).
Optional soll eine Zahl angehängt werden können (`"ada.lovelace42"`).

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
function erstelleBenutzernamen(
  vorname: string,
  nachname: string,
  nummer?: number
): string {
  const basis = `${vorname}.${nachname}`.toLowerCase();
  // "?? """ statt "|| """: so wuerde auch die Nummer 0 korrekt angehaengt.
  return nummer === undefined ? basis : `${basis}${nummer}`;
}

console.log(erstelleBenutzernamen("Ada", "Lovelace"));      // ada.lovelace
console.log(erstelleBenutzernamen("Ada", "Lovelace", 42));  // ada.lovelace42
console.log(erstelleBenutzernamen("Grace", "Hopper", 0));   // grace.hopper0
```

</details>

---

## 1.5 `any`, `unknown`, `never` & `void`

### Theorie

Vier Typen fallen aus dem Rahmen, weil sie nicht *Daten* beschreiben, sondern
*Situationen*. Sie werden ständig verwechselt – hier die Unterschiede in je
einem Satz:

| Typ | Bedeutung | Wann? |
|---|---|---|
| `any` | "Schalte die Typprüfung ab." | Notausgang. Möglichst nie. |
| `unknown` | "Irgendein Wert – prüf ihn erst." | Für Daten von außen. |
| `void` | "Diese Funktion gibt nichts zurück." | Rückgabetyp von Prozeduren. |
| `never` | "Das passiert nie." | Funktionen, die immer werfen; Vollständigkeitsprüfung. |

Der wichtigste Unterschied ist der zwischen `any` und `unknown`. Beide nehmen
jeden Wert an – aber:

- Mit einem `any`-Wert darfst du **alles** machen. TypeScript schweigt.
- Mit einem `unknown`-Wert darfst du **nichts** machen, bevor du geprüft hast,
  was es ist.

`unknown` ist damit der sichere Zwilling von `any`. Wann immer du versucht
bist, `any` zu schreiben, probiere zuerst `unknown`.

### Code-Beispiele

```typescript
// any schaltet die Typpruefung komplett ab:
const daten: any = "das ist ein Text";
console.log(daten.toFixed(2)); // kompiliert - kracht aber zur Laufzeit!

// unknown zwingt dich zur Pruefung:
const sichereDaten: unknown = "das ist ein Text";
// console.log(sichereDaten.toFixed(2)); // Fehler: 'sichereDaten' is of type 'unknown'.

if (typeof sichereDaten === "number") {
  console.log(sichereDaten.toFixed(2)); // hier weiss TypeScript: es ist number
} else {
  console.log("Kein Zahlenwert:", sichereDaten);
}
```

```typescript
// void: Rueckgabetyp fuer Funktionen ohne Ergebnis
function speichere(eintrag: string): void {
  console.log("gespeichert:", eintrag);
  // kein return-Wert
}
speichere("Notiz");
```

```typescript
// never: dieser Punkt im Code wird nie erreicht
function wirfFehler(nachricht: string): never {
  throw new Error(nachricht);
}

// Der praktische Nutzen von never zeigt sich bei der Vollstaendigkeitspruefung
// (mehr dazu in Modul 3):
type Ampel = "rot" | "gelb" | "gruen";

function beschreibe(farbe: Ampel): string {
  switch (farbe) {
    case "rot":
      return "Halt!";
    case "gelb":
      return "Gleich...";
    case "gruen":
      return "Fahr!";
    default: {
      // Kaeme hier je ein vierter Wert an, meldet der Compiler einen Fehler -
      // "farbe" waere dann naemlich nicht mehr "never".
      const nichtErreichbar: never = farbe;
      return wirfFehler(`Unbekannte Farbe: ${String(nichtErreichbar)}`);
    }
  }
}

console.log(beschreibe("rot")); // "Halt!"
```

### ⚠️ Häufiger Fehler

`any` wird gerne als schneller Ausweg benutzt, wenn der Compiler nervt – und
verbreitet sich dann wie ein Ölfleck durch die Codebasis. Denn sobald ein Wert
`any` ist, wird auch alles `any`, was daraus abgeleitet wird:

```typescript
const antwort: any = JSON.parse("{}");
const benutzer = antwort.data.user;      // any
const name = benutzer.name.toUpperCase(); // any - und kein Schutz mehr
```

Eine einzige `any`-Stelle kann so ganze Aufrufketten ungeprüft lassen. Wenn du
`any` wirklich brauchst (z. B. bei einer sehr alten Bibliothek ohne Typen),
grenze es auf eine einzige Zeile ein und wandle den Wert sofort in einen
richtigen Typ um.

### 🎯 Übungsaufgabe

Die Funktion `laengeVon` soll die Länge eines Wertes zurückgeben – egal ob
Text oder Array – und bei allem anderen `0` liefern. Schreibe sie **ohne**
`any`.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
function laengeVon(wert: unknown): number {
  // typeof-Pruefung fuer Text
  if (typeof wert === "string") {
    return wert.length;
  }
  // Array.isArray ist der zuverlaessige Test fuer Arrays
  if (Array.isArray(wert)) {
    return wert.length;
  }
  return 0;
}

console.log(laengeVon("Hallo"));        // 5
console.log(laengeVon([1, 2, 3]));      // 3
console.log(laengeVon(42));             // 0
console.log(laengeVon(null));           // 0
```

Mit `unknown` erzwingt TypeScript, dass du beide Fälle prüfst, bevor du
`.length` benutzt. Mit `any` hättest du diesen Schutz nicht – und
`laengeVon(42)` wäre zur Laufzeit `undefined` statt `0`.

</details>

---

## 📋 Zusammenfassung & Cheat-Sheet

```typescript
// --- Variablen -------------------------------------------------------------
const name = "Ada";          // const ist die Standardwahl
let zaehler = 0;             // let nur, wenn sich der Wert aendert
let spaeter: number;         // Annotation noetig, weil kein Anfangswert

// --- Primitive Typen -------------------------------------------------------
const text: string = "Hi";
const zahl: number = 42;
const jaNein: boolean = true;
const gross: bigint = 123n;
const leer: null = null;
const nichts: undefined = undefined;

// --- Funktionen ------------------------------------------------------------
function f(pflicht: string, optional?: number, mitDefault = 10): string { … }
function rest(...zahlen: number[]): number { … }
const pfeil = (x: number): boolean => x > 0;
function ohneRueckgabe(): void { … }

// --- Sondertypen -----------------------------------------------------------
let a: any;      // Typpruefung AUS - vermeiden
let u: unknown;  // sicherer Ersatz fuer any - erst pruefen, dann nutzen
function nie(): never { throw new Error("…"); }
```

| Frage | Antwort |
|---|---|
| `const` oder `let`? | Immer `const`, außer der Wert ändert sich. `var` nie. |
| Typ hinschreiben oder nicht? | Variablen mit Wert: weglassen. Funktionssignaturen: hinschreiben. |
| `any` oder `unknown`? | Immer `unknown`, außer du hast einen sehr guten Grund. |
| `||` oder `??` für Default-Werte? | `??` – sonst werden `0`, `""` und `false` überschrieben. |
| `null` oder `undefined`? | `undefined` = nie gesetzt, `null` = absichtlich leer. |
| Prüft TypeScript zur Laufzeit? | Nein. Externe Daten musst du selbst validieren. |

---

← [Kursübersicht](../README.md) | [Modul 2: Der nächste Schritt](../modul-2-mittelstufe/README.md) →
