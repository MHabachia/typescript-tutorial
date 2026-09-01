# Modul 7: TypeScript & fortgeschrittene Patterns (Profi+)

Bis hierher hast du Typen *benutzt*. In diesem Modul fängst du an, Typen zu
**bauen**: Funktionen und Klassen, die mit vielen Typen arbeiten, ohne die
Sicherheit aufzugeben – und Typen, die sich aus anderen Typen von selbst
ergeben.

## 🎯 Lernziele

Nach diesem Modul kannst du:

- generische Funktionen, Klassen und Interfaces schreiben und lesen
- mit `extends` sinnvoll einschränken, was ein generischer Typ sein darf
- mit `keyof` und `T[K]` typsicher auf beliebige Objektfelder zugreifen
- die eingebauten Utility Types (`Partial`, `Pick`, `Omit`, `Record`, `Readonly`, `Required`, `ReturnType`) sicher einsetzen
- eigene Utility Types mit Mapped und Conditional Types bauen
- Decorators verstehen und für querschnittliche Aufgaben wie Logging einsetzen

## Inhalt

- [7.1 Generics: Typen als Parameter](#71-generics-typen-als-parameter)
- [7.2 `keyof`, Constraints & Lookup Types](#72-keyof-constraints--lookup-types)
- [7.3 Die eingebauten Utility Types](#73-die-eingebauten-utility-types)
- [7.4 Eigene Utility Types: Mapped & Conditional Types](#74-eigene-utility-types-mapped--conditional-types)
- [7.5 Decorators](#75-decorators)
- [📋 Zusammenfassung & Cheat-Sheet](#-zusammenfassung--cheat-sheet)

**Lauffähige Beispiele:** [`beispiele/`](./beispiele/)

| Datei | Thema |
|---|---|
| [`01-generics.ts`](./beispiele/01-generics.ts) | Generische Funktionen & Klassen |
| [`02-keyof-und-constraints.ts`](./beispiele/02-keyof-und-constraints.ts) | `keyof`, `extends`, Lookup Types |
| [`03-utility-types.ts`](./beispiele/03-utility-types.ts) | Eingebaute Utility Types |
| [`04-eigene-utility-types.ts`](./beispiele/04-eigene-utility-types.ts) | Mapped & Conditional Types |
| [`05-decorators.ts`](./beispiele/05-decorators.ts) | Klassen- & Methoden-Decorators |

---

## 7.1 Generics: Typen als Parameter

### Theorie

Eine normale Funktion nimmt **Werte** entgegen. Eine generische Funktion nimmt
zusätzlich **Typen** entgegen.

Stell dir einen Versandkarton vor. Der Karton ist immer derselbe – aber auf
dem Etikett steht, was drin ist. Ein Karton "Bücher" gibt beim Auspacken
Bücher zurück, ein Karton "Geschirr" gibt Geschirr zurück. Der Karton ist
`Array<T>`, das Etikett ist `T`.

```typescript
function ersteElement<T>(liste: T[]): T | undefined {
  //               ^Typparameter
  return liste[0];
}
```

Rufst du `ersteElement([1, 2, 3])` auf, setzt TypeScript `T = number` – ohne
dass du irgendetwas hinschreiben musst. Das nennt sich **Type Argument
Inference**. Nur wenn die Ableitung nicht gelingt, gibst du den Typ explizit
an: `ersteElement<string>([])`.

Warum nicht einfach `any[]`? Weil `any` die Information **wegwirft**:
`ersteElement` mit `any` gäbe immer `any` zurück – aus einer Zahlenliste käme
kein `number` mehr heraus, sondern etwas Unbestimmtes. Generics dagegen
**reichen die Information durch**.

Der Rückgabetyp ist hier bewusst `T | undefined` und nicht `T`: Bei einer
leeren Liste gibt es kein erstes Element. Genau darauf besteht die
tsconfig-Option `noUncheckedIndexedAccess` (siehe
[Modul 5](../modul-5-werkzeuge-workflow/README.md)).

### Code-Beispiele

```typescript
// Generische Funktion: T wird beim Aufruf automatisch bestimmt
function ersteElement<T>(liste: T[]): T | undefined {
  return liste[0];
}

const ersteZahl = ersteElement([1, 2, 3]);       // number | undefined
const ersterName = ersteElement(["Ada", "Grace"]); // string | undefined

console.log(ersteZahl, ersterName); // 1 Ada
```

```typescript
// Generische Klasse: ein typsicherer Stack
class Stack<T> {
  private elemente: T[] = [];

  push(element: T): void {
    this.elemente.push(element);
  }

  pop(): T | undefined {
    return this.elemente.pop();
  }

  get anzahl(): number {
    return this.elemente.length;
  }
}

const zahlen = new Stack<number>();
zahlen.push(1);
zahlen.push(2);
console.log(zahlen.pop(), zahlen.anzahl); // 2 1

// zahlen.push("drei"); // Fehler: string ist nicht number
```

```typescript
// Mehrere Typparameter - hier ein typsicheres Paar
function paare<A, B>(links: A, rechts: B): [A, B] {
  return [links, rechts];
}

const eintrag = paare("alter", 36); // [string, number]
console.log(eintrag);
```

### ⚠️ Häufiger Fehler

Generics werden gerne benutzt, wo gar keine gebraucht werden:

```typescript
// Ueberfluessig: T taucht nur an EINER Stelle auf
function gibAus<T>(wert: T): void {
  console.log(wert);
}
```

Faustregel: Ein Typparameter lohnt sich erst, wenn er **mindestens zweimal**
vorkommt – etwa in Parameter *und* Rückgabewert, oder in zwei Parametern, die
zusammenpassen müssen. Kommt `T` nur einmal vor, tut `unknown` denselben
Dienst und ist ehrlicher.

Der zweite Klassiker: Generics und `any` vermischen. Sobald irgendwo im
Aufrufweg ein `any` steht, ist die ganze Typkette wertlos – der Compiler
prüft dann nichts mehr, obwohl der Code "generisch" aussieht.

### 🎯 Übungsaufgabe

Schreibe eine generische Funktion `letzteElemente`, die die letzten `n`
Einträge einer Liste zurückgibt – typsicher für beliebige Elementtypen.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
function letzteElemente<T>(liste: readonly T[], anzahl: number): T[] {
  // slice mit negativem Index liefert die letzten n Elemente.
  // Math.max schuetzt vor anzahl <= 0 (slice(0) waere sonst die ganze Liste).
  return anzahl <= 0 ? [] : liste.slice(-anzahl);
}

console.log(letzteElemente([1, 2, 3, 4, 5], 2)); // [4, 5]
console.log(letzteElemente(["a", "b", "c"], 1)); // ["c"]
console.log(letzteElemente([1, 2, 3], 0));       // []
```

`readonly T[]` als Parametertyp ist hier bewusst gewählt: Die Funktion liest
nur, also darf sie auch unveränderliche Arrays annehmen.

</details>

---

## 7.2 `keyof`, Constraints & Lookup Types

### Theorie

Ein nacktes `<T>` bedeutet "alles ist erlaubt" – und damit auch "ich weiß
nichts über T". Mit `extends` grenzt du ein, was `T` mindestens können muss:

```typescript
function zeigeId<T extends { id: string }>(objekt: T): string {
  return objekt.id; // erlaubt, weil das Constraint eine id garantiert
}
```

Dazu kommen zwei Operatoren, die auf Typebene arbeiten:

| Schreibweise | Bedeutung | Beispiel |
|---|---|---|
| `keyof T` | Union aller Schlüsselnamen von `T` | `keyof Produkt` → `"id" \| "preis" \| …` |
| `T[K]` | der Typ hinter dem Schlüssel `K` | `Produkt["preis"]` → `number` |

Kombiniert ergibt das die vielleicht nützlichste generische Signatur
überhaupt:

```typescript
function holeWert<T, K extends keyof T>(objekt: T, schluessel: K): T[K] {
  return objekt[schluessel];
}
```

Diese Funktion akzeptiert nur echte Schlüssel (Tippfehler = Compilerfehler)
und liefert für jeden Schlüssel exakt den richtigen Typ zurück – `number` bei
`"preis"`, `string` bei `"bezeichnung"`.

### Code-Beispiele

```typescript
interface Produkt {
  id: string;
  bezeichnung: string;
  preis: number;
  aufLager: boolean;
}

const laptop: Produkt = { id: "p-1", bezeichnung: "Laptop", preis: 1299.99, aufLager: true };

function holeWert<T, K extends keyof T>(objekt: T, schluessel: K): T[K] {
  return objekt[schluessel];
}

const preis = holeWert(laptop, "preis");             // number
const bezeichnung = holeWert(laptop, "bezeichnung"); // string

console.log(preis.toFixed(2));        // "1299.99" - .toFixed gibt es nur auf number
console.log(bezeichnung.toUpperCase()); // "LAPTOP"

// holeWert(laptop, "preiss");
// Fehler: Argument of type '"preiss"' is not assignable to parameter of type 'keyof Produkt'.
```

```typescript
// Auch beim Schreiben passt der Werttyp automatisch zum Schluessel:
function setzeWert<T, K extends keyof T>(objekt: T, schluessel: K, wert: T[K]): T {
  return { ...objekt, [schluessel]: wert };
}

const reduziert = setzeWert(laptop, "preis", 999);
console.log(reduziert.preis); // 999

// setzeWert(laptop, "preis", "billig"); // Fehler: string ist nicht number
```

```typescript
// Constraints machen Funktionen so breit wie noetig - und so eng wie moeglich:
function istLeer<T extends { length: number }>(wert: T): boolean {
  return wert.length === 0;
}

console.log(istLeer(""));      // true  - string hat length
console.log(istLeer([1, 2]));  // false - Array hat length
// istLeer(42);                // Fehler - number hat kein length
```

### ⚠️ Häufiger Fehler

Ein Constraint wird oft zu **weit** gewählt (`<T>` ohne `extends`) und der
fehlende Typ dann mit einem `as` überbrückt:

```typescript
function holeIdFalsch<T>(objekt: T): string {
  return (objekt as { id: string }).id; // gefaehrlich!
}
```

Das `as` ist eine Behauptung, keine Prüfung. Übergibt jemand ein Objekt ohne
`id`, gibt die Funktion zur Laufzeit `undefined` zurück – obwohl der Typ
`string` verspricht. Richtig ist, die Anforderung im Constraint auszudrücken:
`<T extends { id: string }>`. Dann übernimmt der Compiler die Prüfung.

### 🎯 Übungsaufgabe

Schreibe eine Funktion `gruppiereNach`, die eine Liste von Objekten nach dem
Wert eines Feldes gruppiert. Der Feldname soll typsicher sein, und das Feld
muss ein `string` sein.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
interface Person {
  name: string;
  stadt: string;
  alter: number;
}

// K ist auf Schluessel eingeschraenkt, deren Wert ein string ist:
function gruppiereNach<T, K extends keyof T>(
  liste: readonly T[],
  schluessel: K
): Record<string, T[]> {
  const ergebnis: Record<string, T[]> = {};
  for (const eintrag of liste) {
    const gruppe = String(eintrag[schluessel]);
    // Wegen noUncheckedIndexedAccess ist ergebnis[gruppe] moeglicherweise
    // undefined - deshalb erst anlegen, dann befuellen.
    const vorhandene = ergebnis[gruppe] ?? [];
    vorhandene.push(eintrag);
    ergebnis[gruppe] = vorhandene;
  }
  return ergebnis;
}

const personen: Person[] = [
  { name: "Ada", stadt: "London", alter: 36 },
  { name: "Grace", stadt: "New York", alter: 45 },
  { name: "Alan", stadt: "London", alter: 41 },
];

console.log(gruppiereNach(personen, "stadt"));
// { London: [Ada, Alan], "New York": [Grace] }
```

</details>

---

## 7.3 Die eingebauten Utility Types

### Theorie

Ein Datenmodell taucht in einer Anwendung selten nur in **einer** Form auf.
Ein `Benutzer` ist beim Anlegen etwas anderes als beim Bearbeiten und wieder
etwas anderes in der API-Antwort:

- Beim **Anlegen** fehlt die `id` (die vergibt der Server).
- Beim **Bearbeiten** sind alle Felder optional (man ändert ja nur eines).
- In der **API-Antwort** darf der `passwortHash` niemals auftauchen.

Die schlechte Lösung ist, drei Interfaces von Hand zu pflegen. Die gute
Lösung sind Utility Types: Du definierst **einen** Typ als Wahrheit und
leitest alle anderen daraus ab.

| Utility Type | Wirkung |
|---|---|
| `Partial<T>` | alle Felder optional |
| `Required<T>` | alle Felder verpflichtend |
| `Readonly<T>` | alle Felder unveränderlich |
| `Pick<T, K>` | nur die genannten Felder behalten |
| `Omit<T, K>` | die genannten Felder entfernen |
| `Record<K, T>` | Objekt mit Schlüsseln `K` und Werten `T` |
| `ReturnType<F>` | der Rückgabetyp einer Funktion |
| `Parameters<F>` | die Parametertypen einer Funktion als Tupel |
| `Awaited<P>` | der Typ, den ein Promise liefert |
| `NonNullable<T>` | `null` und `undefined` entfernen |

### Code-Beispiele

```typescript
interface Benutzer {
  id: string;
  name: string;
  email: string;
  passwortHash: string;
}

// Ein Typ als Wahrheit - alle anderen leiten sich ab:
type BenutzerUpdate = Partial<Benutzer>;                  // alles optional
type BenutzerOeffentlich = Omit<Benutzer, "passwortHash">; // ohne Passwort
type BenutzerLogin = Pick<Benutzer, "email" | "passwortHash">;
type BenutzerAnlegen = Omit<Benutzer, "id">;               // ohne id
type BenutzerNachId = Record<string, Benutzer>;

const update: BenutzerUpdate = { name: "Ada Lovelace" };
const oeffentlich: BenutzerOeffentlich = {
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
}; // passwortHash ist hier nicht nur unnoetig, sondern verboten

console.log(update, oeffentlich);
```

```typescript
// ReturnType und Parameters lesen Typen aus Funktionen heraus:
function erstelleAntwort(status: number, text: string) {
  return { status, text, zeitpunkt: new Date().toISOString() };
}

type Antwort = ReturnType<typeof erstelleAntwort>;
// { status: number; text: string; zeitpunkt: string }

type AntwortArgumente = Parameters<typeof erstelleAntwort>;
// [status: number, text: string]

const antwort: Antwort = erstelleAntwort(200, "OK");
const argumente: AntwortArgumente = [404, "Nicht gefunden"];

console.log(antwort.status, erstelleAntwort(...argumente).text);
```

```typescript
// Awaited und NonNullable
async function ladeName(): Promise<string | null> {
  return "Ada";
}

type GeladenerName = Awaited<ReturnType<typeof ladeName>>; // string | null
type SichererName = NonNullable<GeladenerName>;            // string

const name: SichererName = "Ada";
console.log(name.toUpperCase());
```

### ⚠️ Häufiger Fehler

`Partial<T>` wird gern als bequemer Weg benutzt, um lästige Pflichtfelder
loszuwerden:

```typescript
function speichereFalsch(benutzer: Partial<Benutzer>): void {
  console.log(benutzer.email.toLowerCase()); // Fehler - email kann fehlen!
}
```

`Partial` ist für **Updates** gedacht, nicht als Universallösung. Wenn eine
Funktion bestimmte Felder wirklich braucht, verlangt sie diese auch: entweder
über den vollen Typ oder über `Pick`. Ein `Partial` im Parameter heißt: "Ich
komme mit jeder Kombination klar" – und dann musst du auch wirklich jedes
Feld prüfen.

Zweiter Stolperstein: `Omit` prüft die Schlüsselnamen nur eingeschränkt.
`Omit<Benutzer, "passwortHashh">` (mit Tippfehler) ist erlaubt und entfernt
schlicht nichts. Bei `Pick` würde derselbe Tippfehler auffallen.

### 🎯 Übungsaufgabe

Gegeben ist der Typ `Artikel` unten. Leite daraus ab: (a) einen Typ für das
Anlegen ohne `id` und ohne `erstelltAm`, (b) einen Typ, bei dem nur `preis`
und `bestand` änderbar sind, und (c) einen komplett unveränderlichen Typ.

```typescript
interface Artikel {
  id: string;
  erstelltAm: string;
  bezeichnung: string;
  preis: number;
  bestand: number;
}
```

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
interface Artikel {
  id: string;
  erstelltAm: string;
  bezeichnung: string;
  preis: number;
  bestand: number;
}

// (a) Anlegen: id und erstelltAm vergibt der Server
type ArtikelAnlegen = Omit<Artikel, "id" | "erstelltAm">;

// (b) Nur preis und bestand aenderbar - und beides optional,
//     weil man auch nur eines der beiden aendern koennen soll:
type ArtikelAendern = Partial<Pick<Artikel, "preis" | "bestand">>;

// (c) Komplett unveraenderlich
type ArtikelGelesen = Readonly<Artikel>;

const neu: ArtikelAnlegen = { bezeichnung: "Tastatur", preis: 49.9, bestand: 12 };
const aenderung: ArtikelAendern = { preis: 39.9 };
const gelesen: ArtikelGelesen = {
  id: "a-1",
  erstelltAm: "2026-01-01",
  bezeichnung: "Tastatur",
  preis: 39.9,
  bestand: 12,
};
// gelesen.preis = 10; // Fehler: Cannot assign to 'preis' because it is a read-only property.

console.log(neu, aenderung, gelesen.bezeichnung);
```

Beachte die Verschachtelung in (b): `Partial<Pick<…>>` liest sich von innen
nach außen – erst die Felder auswählen, dann optional machen.

</details>

---

## 7.4 Eigene Utility Types: Mapped & Conditional Types

### Theorie

Die eingebauten Utility Types sind nicht eingebaut im Sinne von "magisch" –
sie sind selbst in TypeScript geschrieben. `Partial<T>` sieht in der
Standardbibliothek so aus:

```typescript
type Partial<T> = {
  [K in keyof T]?: T[K];
};
```

Das ist ein **Mapped Type**: "Gehe jeden Schlüssel `K` von `T` durch und
erzeuge ein Feld gleichen Namens". Die Modifikatoren `?` und `readonly`
kannst du dabei hinzufügen – oder mit `-?` und `-readonly` wieder entfernen.

Der zweite Baustein ist der **Conditional Type**, eine Fallunterscheidung auf
Typebene:

```typescript
type ElementVon<T> = T extends readonly (infer E)[] ? E : T;
//                   "wenn T ein Array ist"  ^merk dir den Elementtyp
```

`infer` ist dabei das Besondere: Es sagt "an dieser Stelle steht irgendein
Typ – nenn ihn `E` und gib ihn mir".

Beides zusammen erlaubt Typen, die sich vollständig aus anderen Typen
ergeben. Der praktische Nutzen: Ändert sich das Datenmodell, ändern sich alle
abgeleiteten Typen mit – und der Compiler zeigt dir sofort jede Stelle, die
nicht mehr passt.

### Code-Beispiele

```typescript
interface Benutzer {
  id: string;
  name: string;
  email: string;
  alter: number;
  aktiv: boolean;
}

// Mapped Type: alle Felder werden zu string (z.B. fuer ein HTML-Formular)
type AlsFormular<T> = {
  [K in keyof T]: string;
};

type BenutzerFormular = AlsFormular<Benutzer>;
// { id: string; name: string; email: string; alter: string; aktiv: string }

const formular: BenutzerFormular = {
  id: "1",
  name: "Ada",
  email: "ada@example.com",
  alter: "36",
  aktiv: "true",
};
console.log(formular);
```

```typescript
// Modifikatoren setzen und entfernen
type MeinPartial<T> = { [K in keyof T]?: T[K] };    // "?" hinzufuegen
type MeinRequired<T> = { [K in keyof T]-?: T[K] };  // "?" entfernen
type MeinReadonly<T> = { readonly [K in keyof T]: T[K] };

const teilweise: MeinPartial<Benutzer> = { name: "Grace" };
console.log(teilweise);
```

```typescript
// Conditional Type mit infer
type ElementVon<T> = T extends readonly (infer E)[] ? E : T;

type A = ElementVon<number[]>; // number
type B = ElementVon<string>;   // string (kein Array -> T selbst)

const a: A = 42;
const b: B = "kein Array";
console.log(a, b);
```

```typescript
// Kombination: Schluessel nach Werttyp filtern
// Der Mapped Type liefert pro Schluessel entweder den Namen oder "never" -
// und "never" verschwindet aus einer Union von selbst.
type SchluesselMitTyp<T, W> = {
  [K in keyof T]: T[K] extends W ? K : never;
}[keyof T];

type TextFelder = SchluesselMitTyp<Benutzer, string>; // "id" | "name" | "email"

function sucheInTextfeldern(benutzer: Benutzer, feld: TextFelder, begriff: string): boolean {
  return benutzer[feld].toLowerCase().includes(begriff.toLowerCase());
}

const ada: Benutzer = { id: "1", name: "Ada", email: "ada@example.com", alter: 36, aktiv: true };
console.log(sucheInTextfeldern(ada, "name", "ad")); // true
// sucheInTextfeldern(ada, "alter", "3"); // Fehler - "alter" ist kein Textfeld
```

```typescript
// Template Literal Types: neue Namen aus vorhandenen Schluesseln erzeugen
type EventName<T> = `${string & keyof T}:geaendert`;

type BenutzerEvent = EventName<Benutzer>;
// "id:geaendert" | "name:geaendert" | "email:geaendert" | ...

function melde(event: BenutzerEvent): string {
  return `Event: ${event}`;
}

console.log(melde("email:geaendert"));
// melde("adresse:geaendert"); // Fehler - dieses Feld gibt es nicht
```

### ⚠️ Häufiger Fehler

Der häufigste Fehler ist nicht technischer, sondern menschlicher Natur:
**zu clever werden**. Ein Typ wie dieser ist korrekt – und für die meisten
Teams unlesbar:

```typescript
type Tief<T> = T extends object
  ? { [K in keyof T]: T[K] extends Function ? never : Tief<T[K]> }
  : T;
```

Typen sind Dokumentation. Wenn ein Kollege zwei Minuten braucht, um zu
verstehen, was ein Typ bedeutet, hast du Komplexität von der Laufzeit in das
Typsystem verschoben, statt sie zu beseitigen. Faustregel: Ein eigener
Utility Type lohnt sich, wenn du dieselbe Umwandlung zum dritten Mal von Hand
schreibst – und er sollte einen Namen haben, der ohne Kommentar verständlich
ist.

Technischer Stolperstein am Rande: Conditional Types verteilen sich über
Unions (`ElementVon<number[] | string>` wird einzeln ausgewertet). Das ist
meistens erwünscht – und überrascht genau dann, wenn es das nicht ist.

### 🎯 Übungsaufgabe

Schreibe einen eigenen Utility Type `NullbarMachen<T>`, der jedes Feld von
`T` zusätzlich `null` erlaubt – so, wie es Datenbankzeilen oft tun.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
interface Benutzer {
  id: string;
  name: string;
  alter: number;
}

// Mapped Type: Schluessel uebernehmen, Werttyp um null erweitern
type NullbarMachen<T> = {
  [K in keyof T]: T[K] | null;
};

type BenutzerZeile = NullbarMachen<Benutzer>;
// { id: string | null; name: string | null; alter: number | null }

const zeile: BenutzerZeile = { id: "1", name: null, alter: 36 };

// Dank strictNullChecks erzwingt TypeScript jetzt eine Pruefung:
console.log(zeile.name?.toUpperCase() ?? "(kein Name)"); // "(kein Name)"
console.log(zeile.id?.padStart(3, "0") ?? "(keine id)"); // "001"
```

Zusatzfrage: Wie würdest du das Gegenteil bauen – `null` überall entfernen?
Antwort: `type NullEntfernen<T> = { [K in keyof T]: NonNullable<T[K]> };`

</details>

---

## 7.5 Decorators

### Theorie

Manche Aufgaben betreffen viele Klassen, haben aber mit deren eigentlicher
Fachlogik nichts zu tun: Logging, Zeitmessung, Caching, Zugriffsprüfung.
Schreibt man sie in jede Methode hinein, steht die Fachlogik bald zwischen
lauter Nebensächlichkeiten.

Ein **Decorator** ist eine Funktion, die eine Klasse, Methode oder
Eigenschaft "umhüllt" und ihr Verhalten hinzufügt – ohne den ursprünglichen
Code anzufassen:

```typescript
class Taschenrechner {
  @protokolliereAufruf   // <- Decorator
  addiere(a: number, b: number): number {
    return a + b;        // <- reine Fachlogik, sonst nichts
  }
}
```

Ein Methoden-Decorator bekommt drei Dinge: das Ziel (die Klasse), den Namen
der Methode und den `PropertyDescriptor`, in dem die eigentliche Funktion
steckt. Er ersetzt `descriptor.value` durch eine neue Funktion, die die
Originalfunktion aufruft – und drumherum das Zusätzliche erledigt.

Damit die `@`-Syntax funktioniert, muss in der `tsconfig.json` die Option
`"experimentalDecorators": true` gesetzt sein – in diesem Repo ist sie das
bereits. Diese Variante ("Legacy Decorators") ist die, die Frameworks wie
Angular und NestJS in der Praxis verwenden.

### Code-Beispiele

```typescript
// Methoden-Decorator: protokolliert Aufruf und Ergebnis
function protokolliereAufruf(
  _target: object,
  methodenName: string,
  beschreibung: PropertyDescriptor
): PropertyDescriptor {
  const originalMethode = beschreibung.value as (...args: unknown[]) => unknown;

  beschreibung.value = function (this: unknown, ...args: unknown[]): unknown {
    console.log(`Aufruf ${methodenName}(${args.join(", ")})`);
    const ergebnis = originalMethode.apply(this, args);
    console.log(`Ergebnis von ${methodenName}:`, ergebnis);
    return ergebnis;
  };

  return beschreibung;
}

class Taschenrechner {
  @protokolliereAufruf
  addiere(a: number, b: number): number {
    return a + b;
  }
}

new Taschenrechner().addiere(2, 3);
// Aufruf addiere(2, 3)
// Ergebnis von addiere: 5
```

```typescript
// Klassen-Decorator: erweitert den Konstruktor (Mixin-Pattern)
// TypeScript verlangt hier zwingend die Signatur "new (...args: any[]) => object" -
// jede andere Parameterliste lehnt der Compiler beim Mixin ab.
function versionsInfo<T extends new (...args: any[]) => object>(konstruktor: T): T {
  return class extends konstruktor {
    version = "1.0.0";
  };
}

@versionsInfo
class Dienst {
  name = "Abrechnung";
}

const dienst = new Dienst();
console.log(dienst.name, (dienst as unknown as { version: string }).version);
// Abrechnung 1.0.0
```

### ⚠️ Häufiger Fehler

Ein sehr teurer Stolperstein ist `emitDecoratorMetadata`. Diese Option wird
oft zusammen mit `experimentalDecorators` eingeschaltet, weil sie in
Anleitungen gemeinsam auftauchen. Sie erzeugt aber Code, der zur Laufzeit
`Reflect.metadata(...)` aufruft – und das gibt es in Node.js nicht von Haus
aus. Ohne das Paket `reflect-metadata` (und einen Import ganz oben in der
Einstiegsdatei) bekommst du dann einen Laufzeitfehler, obwohl alles
kompiliert. Dieses Repo lässt die Option deshalb bewusst aus: Für Logging-
und Mixin-Decorators braucht man sie nicht.

Der zweite Fehler ist konzeptionell: Decorators verstecken Verhalten. Wer
`addiere()` liest, sieht nicht, dass dabei geloggt wird. Das ist genau ihr
Zweck – aber es heißt auch, dass man sie sparsam und mit sprechenden Namen
einsetzen sollte.

### 🎯 Übungsaufgabe

Schreibe einen Methoden-Decorator `@messeZeit`, der die Ausführungsdauer
einer Methode misst und ausgibt.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
function messeZeit(
  _target: object,
  methodenName: string,
  beschreibung: PropertyDescriptor
): PropertyDescriptor {
  const originalMethode = beschreibung.value as (...args: unknown[]) => unknown;

  beschreibung.value = function (this: unknown, ...args: unknown[]): unknown {
    const start = Date.now();
    const ergebnis = originalMethode.apply(this, args);
    const dauer = Date.now() - start;
    console.log(`${methodenName} dauerte ${dauer} ms`);
    return ergebnis;
  };

  return beschreibung;
}

class Berechnung {
  @messeZeit
  summeBis(grenze: number): number {
    let summe = 0;
    for (let i = 1; i <= grenze; i++) {
      summe += i;
    }
    return summe;
  }
}

console.log(new Berechnung().summeBis(1_000_000));
// summeBis dauerte 3 ms
// 500000500000
```

Achtung bei asynchronen Methoden: Dort misst dieser Decorator nur, wie lange
das *Erzeugen* des Promise dauert. Für `async`-Methoden müsste die neue
Funktion selbst `async` sein und das Ergebnis `await`en.

</details>

---

## 📋 Zusammenfassung & Cheat-Sheet

```typescript
// --- Generics --------------------------------------------------------------
function f<T>(wert: T): T { return wert; }          // Typparameter
class Box<T> { constructor(public inhalt: T) {} }    // generische Klasse
function g<T extends { id: string }>(x: T) { … }     // Constraint

// --- keyof & Lookup --------------------------------------------------------
type Schluessel = keyof Produkt;                     // "id" | "preis" | ...
type Preistyp = Produkt["preis"];                    // number
function hole<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }

// --- Eingebaute Utility Types ----------------------------------------------
Partial<T>        // alles optional
Required<T>       // alles verpflichtend
Readonly<T>       // alles unveraenderlich
Pick<T, "a"|"b">  // nur diese Felder
Omit<T, "a">      // ohne dieses Feld
Record<K, T>      // Objekt mit Schluesseln K
ReturnType<typeof fn>   // Rueckgabetyp
Parameters<typeof fn>   // Parametertypen als Tupel
Awaited<Promise<T>>     // T
NonNullable<T>          // ohne null | undefined

// --- Eigene Utility Types --------------------------------------------------
type Meine<T> = { [K in keyof T]?: T[K] };           // Mapped Type
type Ohne<T>  = { [K in keyof T]-?: T[K] };          // Modifikator entfernen
type El<T>    = T extends (infer E)[] ? E : T;       // Conditional + infer
type Event<T> = `${string & keyof T}:geaendert`;     // Template Literal Type

// --- Decorators ------------------------------------------------------------
function deko(_t: object, name: string, d: PropertyDescriptor) { … }
class C { @deko methode() { … } }                     // experimentalDecorators: true
```

| Frage | Antwort |
|---|---|
| Wann lohnt sich `<T>`? | Wenn der Typparameter mindestens zweimal vorkommt. Sonst reicht `unknown`. |
| `<T>` oder `any`? | Immer Generics – `any` wirft die Typinformation weg, Generics reichen sie durch. |
| Wie greife ich generisch auf ein Feld zu? | `<T, K extends keyof T>(o: T, k: K): T[K]` |
| Neuen Typ für ein Update-Formular? | `Partial<T>` – nie von Hand kopieren. |
| Passwort aus der API-Antwort halten? | `Omit<Benutzer, "passwortHash">` |
| Eigener Utility Type – ab wann? | Ab dem dritten Mal, wenn er ohne Kommentar verständlich bleibt. |
| `emitDecoratorMetadata` einschalten? | Nur mit `reflect-metadata` im Projekt – sonst Laufzeitfehler. |

---

← [Kursübersicht](../README.md) | [Modul 6: Sicherheit & Auth](../modul-6-sicherheit-auth/README.md) | [Modul 8: Deployment](../modul-8-deployment/README.md) →
