# Modul 3: Unter der Haube (Fortgeschritten)

Bis hierher hast du Typen beschrieben, die es schon gab. Jetzt baust du dir
eigene: Du kombinierst Typen, schneidest sie zurecht und bringst dem Compiler
bei, mitzudenken, während dein Code sich durch die Fallunterscheidungen
arbeitet.

## 🎯 Lernziele

Nach diesem Modul kannst du:

- mit Union Types (`A | B`) Werte beschreiben, die mehrere Formen haben dürfen
- mit Intersection Types (`A & B`) kleine Typbausteine zu größeren zusammensetzen
- Literal-Typen einsetzen und mit `as const` gegen unerwünschtes Widening schützen
- einen Union-Typ mit `typeof`, `instanceof`, `in` und Gleichheitsprüfungen sauber verengen
- eigene Type Guards (`wert is Typ`) und Assertion Functions (`asserts wert is Typ`) schreiben
- Discriminated Unions entwerfen und mit `never` erzwingen, dass kein Fall vergessen wird
- asynchronen Code mit `Promise<T>`, `async`/`await` und `Promise.allSettled` typsicher schreiben

## Inhalt

- [3.1 Union Types](#31-union-types)
- [3.2 Intersection Types](#32-intersection-types)
- [3.3 Literal Types & `as const`](#33-literal-types--as-const)
- [3.4 Type Guards & Narrowing](#34-type-guards--narrowing)
- [3.5 Discriminated Unions & Vollständigkeitsprüfung mit `never`](#35-discriminated-unions--vollständigkeitsprüfung-mit-never)
- [3.6 Async/Await & Promises typsicher](#36-asyncawait--promises-typsicher)
- [📋 Zusammenfassung & Cheat-Sheet](#-zusammenfassung--cheat-sheet)

**Lauffähige Beispiele:** [`beispiele/`](./beispiele/)

| Datei | Thema |
|---|---|
| [`01-union-und-intersection.ts`](./beispiele/01-union-und-intersection.ts) | Union, Intersection & Literal-Typen |
| [`02-type-guards.ts`](./beispiele/02-type-guards.ts) | Narrowing & eigene Type Guards |
| [`03-discriminated-unions.ts`](./beispiele/03-discriminated-unions.ts) | Discriminated Unions & `never` |
| [`04-async-await.ts`](./beispiele/04-async-await.ts) | Promises & async/await typsicher |

---

## 3.1 Union Types

### Theorie

Ein Union Type ist ein "entweder oder". Du schreibst zwei oder mehr Typen mit
einem senkrechten Strich hin, und der Wert darf einer von ihnen sein:

```typescript
type Id = string | number;
```

Denk an ein Türschild mit mehreren Namen: Wer klingelt, weiß, dass **eine**
dieser Personen aufmacht – aber nicht welche. Und genau daraus folgt die
wichtigste Regel:

> Mit einem Union-Wert darfst du nur das tun, was **alle** Varianten können.

`Id` hat also weder `.toUpperCase()` (kennt nur `string`) noch `.toFixed()`
(kennt nur `number`). Was beide können – `.toString()` zum Beispiel – ist
erlaubt. Alles andere musst du erst durch eine Prüfung freischalten; das
nennt sich **Narrowing** und ist das Thema von [3.4](#34-type-guards--narrowing).

Das klingt nach einer Einschränkung, ist aber der eigentliche Gewinn: Der
Compiler zwingt dich, beide Fälle zu bedenken. Genau das vergisst man in
JavaScript ständig.

Unions funktionieren mit allem – auch mit Literalen, und das ist ihr
häufigster Einsatz:

```typescript
type Ampel = "rot" | "gelb" | "gruen";
```

Diese eine Zeile ersetzt eine ganze Klasse Fehler: Tippfehler, ungültige
Zustände, vergessene Fälle. Mehr dazu in [3.3](#33-literal-types--as-const).

### Code-Beispiele

```typescript
// Eine ID darf Text oder Zahl sein.
type Id = string | number;

function formatiereId(id: Id): string {
  // Ohne Pruefung ist nur erlaubt, was BEIDE Typen koennen.
  if (typeof id === "string") {
    return id.toUpperCase();   // hier: string
  }
  return `NR-${id.toFixed(0)}`; // hier: number
}

console.log(formatiereId("ab-42")); // "AB-42"
console.log(formatiereId(42));      // "NR-42"
```

```typescript
// Union von Literalen - der haeufigste und nuetzlichste Fall.
type Ampel = "rot" | "gelb" | "gruen";

// "Record<Ampel, Ampel>" erzwingt einen Eintrag pro Farbe.
const naechsteFarbe: Record<Ampel, Ampel> = {
  rot: "gruen",
  gruen: "gelb",
  gelb: "rot",
};

console.log(naechsteFarbe.rot); // "gruen"
// naechsteFarbe.blau -> Fehler: "blau" gibt es im Typ "Ampel" nicht.
```

```typescript
// Unions treten oft zusammen mit null/undefined auf:
type VielleichtName = string | null;

function laenge(name: VielleichtName): number {
  // "name.length" allein waere ein Fehler - null hat keine Laenge.
  return name === null ? 0 : name.length;
}

console.log(laenge("Ada"), laenge(null)); // 3 0
```

### ⚠️ Häufiger Fehler

Der Klassiker ist die Annahme, ein Union-Wert sei "irgendwie beides". Das
Gegenteil stimmt: Er ist **eines von beiden**, und bis du geprüft hast,
welches, ist er praktisch nutzlos.

```typescript
function falsch(id: string | number): string {
  return id.toUpperCase(); // Fehler: Property 'toUpperCase' does not exist
                           // on type 'string | number'.
}
```

Der zweite Klassiker: die Prüfung mit `as` erschlagen.

```typescript
function auchFalsch(id: string | number): string {
  return (id as string).toUpperCase(); // kompiliert - kracht bei Zahlen
}
```

`as` schaltet den Compiler ab, es prüft nichts. Wenn du in einer Union ein
`as` schreibst, hast du fast immer eine `if`-Abfrage vergessen.

### 🎯 Übungsaufgabe

Schreibe eine Funktion `beschreibeEingabe`, die einen Wert vom Typ
`string | number | boolean` entgegennimmt und einen Satz zurückgibt:
`"Text mit 5 Zeichen"`, `"Zahl, gerundet: 3"` oder `"Schalter steht auf an"`.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
function beschreibeEingabe(wert: string | number | boolean): string {
  if (typeof wert === "string") {
    return `Text mit ${wert.length} Zeichen`;
  }
  if (typeof wert === "number") {
    return `Zahl, gerundet: ${Math.round(wert)}`;
  }
  // Uebrig bleibt nur boolean - TypeScript weiss das und meckert nicht.
  return `Schalter steht auf ${wert ? "an" : "aus"}`;
}

console.log(beschreibeEingabe("Hallo"));  // Text mit 5 Zeichen
console.log(beschreibeEingabe(3.4));      // Zahl, gerundet: 3
console.log(beschreibeEingabe(true));     // Schalter steht auf an
```

Beachte, dass die letzte Zeile **kein** `if` mehr braucht. TypeScript hat die
Union Schritt für Schritt abgetragen; übrig ist nur noch `boolean`. Diese
Denkweise – "was bleibt übrig?" – ist die Grundlage von Abschnitt 3.5.

</details>

---

## 3.2 Intersection Types

### Theorie

Die Intersection ist das Gegenstück zur Union. Sie verbindet Typen mit `&`
und bedeutet: **alles gleichzeitig**.

```typescript
type Artikel = { titel: string; preis: number };
type MitZeitstempel = { erstelltAm: string; geaendertAm: string };

type GespeicherterArtikel = Artikel & MitZeitstempel;
// -> braucht titel, preis, erstelltAm UND geaendertAm
```

Das Bild dazu: Bei der Union suchst du dir eine Tür aus. Bei der Intersection
musst du durch alle Türen gleichzeitig – und dafür alle Bedingungen erfüllen.

Merk dir die scheinbar verdrehte Faustregel:

| | erlaubte **Werte** | erlaubte **Operationen** |
|---|---|---|
| `A \| B` | mehr | weniger |
| `A & B` | weniger | mehr |

In der Praxis ist die Intersection vor allem ein Baukasten: Du schreibst
kleine, wiederverwendbare Bausteine (`MitId`, `MitZeitstempel`, `MitAutor`)
und setzt daraus die konkreten Typen zusammen. Das hält die Typen kurz und
sorgt dafür, dass eine Änderung an einem Baustein überall ankommt.

Was passiert bei einem **Konflikt**? Wenn zwei Typen dieselbe Eigenschaft mit
unverträglichen Typen deklarieren, wird daraus `never`:

```typescript
type NurText = { wert: string };
type NurZahl = { wert: number };
type Unmoeglich = NurText & NurZahl; // wert: string & number = never
```

Der Typ lässt sich hinschreiben, aber es gibt keinen Wert, der hineinpasst.
TypeScript meldet das erst, wenn du es versuchst – deshalb ist so ein Typ
tückisch: Er sieht gesund aus und ist trotzdem tot.

### Code-Beispiele

```typescript
// Bausteine definieren ...
type MitId = { id: number };
type MitZeitstempel = { erstelltAm: string; geaendertAm: string };

// ... und zusammensetzen.
type Kunde = MitId & { name: string } & MitZeitstempel;

const kunde: Kunde = {
  id: 7,
  name: "Ada Lovelace",
  erstelltAm: "2024-01-01",
  geaendertAm: "2024-01-01",
  // Faellt ein Feld weg, ist das ein Fehler: bei "&" ist alles Pflicht.
};

console.log(kunde.id, kunde.name); // 7 "Ada Lovelace"
```

```typescript
// Intersection funktioniert auch mit Funktionstypen: das Ergebnis kann beides.
type Formatierer = (wert: string) => string;
type MitBeschreibung = { beschreibung: string };

const grossschreiben: Formatierer & MitBeschreibung = Object.assign(
  (wert: string): string => wert.toUpperCase(),
  { beschreibung: "wandelt in Grossbuchstaben um" }
);

console.log(grossschreiben("ada"));           // "ADA"
console.log(grossschreiben.beschreibung);     // "wandelt in Grossbuchstaben um"
```

```typescript
// Konflikt: unvertraegliche Eigenschaften ergeben "never".
type NurText = { wert: string };
type NurZahl = { wert: number };
type Unmoeglich = NurText & NurZahl;

// const x: Unmoeglich = { wert: "a" }; // Fehler: string ist nicht never
// const y: Unmoeglich = { wert: 1 };   // Fehler: number ist nicht never

// Eine Liste davon darf man deklarieren - sie bleibt fuer immer leer.
const keine: Unmoeglich[] = [];
console.log(keine.length); // 0
```

### ⚠️ Häufiger Fehler

Union und Intersection werden bei Objekttypen regelmäßig verwechselt, weil
die Umgangssprache in die Irre führt. "Ein Kunde ist Person **und** hat eine
Adresse" – das klingt nach `&`, und hier stimmt es auch. Aber:

```typescript
// "Die Funktion nimmt Hunde und Katzen" heisst NICHT:
function falsch(tier: Hund & Katze): void {}   // muss BEIDES zugleich sein
// sondern:
function richtig(tier: Hund | Katze): void {}  // darf eines von beiden sein
```

Faustregel: Geht es um **Werte**, die durchkommen dürfen, ist es meist `|`.
Geht es um **Eigenschaften**, die zusammenkommen sollen, ist es `&`.

Zweiter Stolperstein: Eine Intersection prüft nicht auf Sinnhaftigkeit. Sie
erzeugt bei Konflikten stillschweigend `never`-Felder statt einer Fehlermeldung
an der Stelle, an der der Typ entsteht.

### 🎯 Übungsaufgabe

Du hast die Bausteine `Person` (`vorname`, `nachname`) und `MitAbteilung`
(`abteilung`). Baue daraus einen Typ `Mitarbeiter`, der zusätzlich noch eine
`personalnummer` hat, und schreibe eine Funktion, die eine Zeile wie
`"[4711] Ada Lovelace, Abteilung Forschung"` erzeugt.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
type Person = { vorname: string; nachname: string };
type MitAbteilung = { abteilung: string };

// Bausteine kombinieren und um ein eigenes Feld ergaenzen:
type Mitarbeiter = Person & MitAbteilung & { personalnummer: number };

function alsZeile(mitarbeiter: Mitarbeiter): string {
  const { personalnummer, vorname, nachname, abteilung } = mitarbeiter;
  return `[${personalnummer}] ${vorname} ${nachname}, Abteilung ${abteilung}`;
}

const ada: Mitarbeiter = {
  vorname: "Ada",
  nachname: "Lovelace",
  abteilung: "Forschung",
  personalnummer: 4711,
};

console.log(alsZeile(ada)); // [4711] Ada Lovelace, Abteilung Forschung
```

Der Vorteil des Baukastens: Bekommt `Person` später ein Feld `geburtsjahr`,
erbt `Mitarbeiter` es automatisch – und der Compiler zeigt dir jede Stelle,
an der es jetzt fehlt.

</details>

---

## 3.3 Literal Types & `as const`

### Theorie

Ein Literal-Typ ist ein Typ, in den genau **ein** Wert passt:

```typescript
let richtung: "links" = "links";
// richtung = "rechts"; // Fehler
```

Allein wäre das nutzlos – interessant wird es in Kombination mit Unions:
`"links" | "rechts" | "oben" | "unten"`. So beschreibst du eine feste Auswahl,
ohne eine einzige Zeile Laufzeitcode.

Der Haken heißt **Widening** (Verbreiterung). TypeScript nimmt an, dass eine
Variable, die sich ändern darf, auch andere Werte bekommen wird:

```typescript
const a = "links"; // Typ: "links"  - const, aendert sich nie
let b = "links";   // Typ: string   - let, koennte alles werden
```

Bei Objekten passiert das Widening **immer**, auch bei `const` – denn `const`
schützt nur den Namen, nicht den Inhalt:

```typescript
const konfig = { modus: "dunkel" };
// konfig.modus hat den Typ string, nicht "dunkel"
konfig.modus = "irgendwas"; // erlaubt!
```

Genau hier kommt `as const` ins Spiel. Es sagt: "Nimm alles wörtlich und
mach es unveränderlich." Aus jedem Wert wird sein Literal-Typ, aus jeder
Eigenschaft ein `readonly`-Feld, aus jedem Array ein `readonly`-Tupel.

```typescript
const konfig = { modus: "dunkel", stufen: [1, 2, 3] } as const;
// modus:  "dunkel"
// stufen: readonly [1, 2, 3]
```

Ein besonders praktischer Trick daraus: Du schreibst die erlaubten Werte
**einmal** als Array hin und leitest den Typ davon ab.

```typescript
const AMPELFARBEN = ["rot", "gelb", "gruen"] as const;
type Ampelfarbe = (typeof AMPELFARBEN)[number]; // "rot" | "gelb" | "gruen"
```

Eine Quelle der Wahrheit, zwei Verwendungen: die Liste zur Laufzeit, die
Union zur Compilezeit. Sie können nicht mehr auseinanderlaufen.

### Code-Beispiele

```typescript
// Widening in Aktion
const richtungKonstant = "links"; // Typ: "links"
let richtungVariabel = "links";   // Typ: string
richtungVariabel = "rechts";      // erlaubt
console.log(richtungKonstant, richtungVariabel);
```

```typescript
type Modus = "hell" | "dunkel";

function beschreibeModus(modus: Modus): string {
  return modus === "hell" ? "Heller Hintergrund" : "Dunkler Hintergrund";
}

// Ohne "as const": modus ist "string" und passt nicht auf die enge Union.
const konfigOffen = { modus: "dunkel" };
// beschreibeModus(konfigOffen.modus); // Fehler: string ist zu weit

// Mit "as const": modus ist "dunkel".
const konfig = { modus: "dunkel" } as const;
console.log(beschreibeModus(konfig.modus)); // "Dunkler Hintergrund"
console.log(konfigOffen.modus);             // "dunkel" (aber Typ string)
```

```typescript
// Liste und Typ aus einer Quelle
const ROLLEN = ["admin", "redakteur", "leser"] as const;
type Rolle = (typeof ROLLEN)[number]; // "admin" | "redakteur" | "leser"

function darfLoeschen(rolle: Rolle): boolean {
  return rolle === "admin";
}

// Die Liste zur Laufzeit durchgehen - und jeder Eintrag ist typsicher:
for (const rolle of ROLLEN) {
  console.log(rolle, darfLoeschen(rolle));
}
// admin true / redakteur false / leser false
```

### ⚠️ Häufiger Fehler

Der mit Abstand häufigste Fall: Ein Objekt wird an eine Funktion übergeben,
die einen Literal-Typ erwartet – und der Compiler meckert scheinbar grundlos.

```typescript
type Anfrage = { methode: "GET" | "POST"; pfad: string };

const optionen = { methode: "GET", pfad: "/benutzer" };
// sende(optionen); // Fehler: Type 'string' is not assignable to
//                  // type '"GET" | "POST"'.
```

Der Grund ist das Widening: `optionen.methode` ist `string`. Es gibt drei
Auswege – und der letzte ist meist der beste:

```typescript
const a = { methode: "GET" as const, pfad: "/benutzer" };  // nur dieses Feld
const b = { methode: "GET", pfad: "/benutzer" } as const;  // alles readonly
const c: Anfrage = { methode: "GET", pfad: "/benutzer" };  // Typ annotieren
```

Variante `c` ist am robustesten: Sie verhindert das Widening **und** prüft
gleich, ob das Objekt vollständig ist.

Zweiter Stolperstein: `as const` ist keine Kopie und kein Einfrieren zur
Laufzeit. Es wirkt nur im Typsystem – `Object.freeze` ist etwas anderes.

### 🎯 Übungsaufgabe

Definiere die erlaubten Log-Level `"debug"`, `"info"`, `"warn"`, `"error"`
**ein einziges Mal** so, dass du sie sowohl als Typ als auch als durchlaufbare
Liste verwenden kannst. Schreibe dann eine Funktion `istMindestens`, die
prüft, ob ein Level wichtig genug ist.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
// Eine Quelle der Wahrheit - die Reihenfolge ist gleich die Rangfolge.
const LEVEL = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVEL)[number]; // "debug" | "info" | "warn" | "error"

function istMindestens(aktuell: Level, schwelle: Level): boolean {
  // indexOf auf einem readonly-Tupel liefert die Rangfolge.
  return LEVEL.indexOf(aktuell) >= LEVEL.indexOf(schwelle);
}

for (const level of LEVEL) {
  console.log(level, "->", istMindestens(level, "warn"));
}
// debug -> false / info -> false / warn -> true / error -> true

// istMindestens("trace", "warn"); // Fehler: "trace" gibt es nicht.
```

Kommt später ein Level dazu, ergänzt du genau eine Stelle – Typ und Liste
bleiben automatisch synchron.

</details>

---

## 3.4 Type Guards & Narrowing

### Theorie

**Narrowing** heißt: TypeScript verengt einen weiten Typ an einer bestimmten
Codestelle auf einen engeren, weil du vorher etwas geprüft hast. Der Compiler
liest deinen Kontrollfluss mit – er weiß, dass im `if`-Zweig etwas gilt, was
im `else`-Zweig nicht gilt.

Fünf eingebaute Prüfungen musst du kennen:

| Prüfung | Wofür | Beispiel |
|---|---|---|
| `typeof` | primitive Typen | `typeof x === "string"` |
| `instanceof` | Klassen, `Error`, `Date` | `x instanceof Error` |
| `in` | Objektformen ohne Klasse | `"bellen" in tier` |
| Truthiness | `null`/`undefined`/leer | `if (namen)` |
| Gleichheit | Literale und Unions | `x === "rot"` |

Reichen die nicht, schreibst du dir einen eigenen. Ein **Type Predicate** ist
eine Funktion, deren Rückgabetyp nicht `boolean` heißt, sondern `wert is Typ`:

```typescript
function istBenutzer(wert: unknown): wert is Benutzer {
  // ... echte Pruefungen ...
  return true;
}
```

Übersetzt: "Wenn ich `true` liefere, dann ist der übergebene Wert ein
`Benutzer`." Das Narrowing wirkt danach beim Aufrufer – auch in `filter`.

Die zweite Variante ist die **Assertion Function**. Sie gibt nichts zurück,
sondern wirft, wenn die Bedingung nicht stimmt:

```typescript
function pruefeBenutzer(wert: unknown): asserts wert is Benutzer {
  if (!istBenutzer(wert)) {
    throw new Error("Kein gueltiger Benutzer");
  }
}
```

Nach dem Aufruf gilt der enge Typ für den ganzen restlichen Block – ohne
`if`. Das ist angenehm für "hier darf es gar nicht anders sein"-Stellen,
zum Beispiel beim Einlesen einer Konfigurationsdatei.

Ein wichtiges Detail: Für Assertion Functions verlangt TypeScript, dass die
aufgerufene Funktion eine **explizite** Typangabe hat. Eine als
`const pruefe = (w: unknown): asserts w is X => …` geschriebene Pfeilfunktion
funktioniert deshalb nur mit expliziter Annotation der Variablen.

### Code-Beispiele

```typescript
// typeof, instanceof, in - die drei Arbeitspferde
function laengeVon(wert: string | number | boolean): number {
  if (typeof wert === "string") {
    return wert.length;            // string
  }
  if (typeof wert === "number") {
    return wert.toFixed(2).length; // number
  }
  return wert ? 4 : 5;             // boolean bleibt uebrig
}

class Rechnung {
  public constructor(public readonly betrag: number) {}
}

function beschreibeVorgang(vorgang: Error | Rechnung): string {
  if (vorgang instanceof Error) {
    return `Fehler: ${vorgang.message}`;
  }
  return `Rechnung ueber ${vorgang.betrag.toFixed(2)} EUR`;
}

type Hund = { name: string; bellen: () => string };
type Katze = { name: string; schnurren: () => string };

function gibLaut(tier: Hund | Katze): string {
  return "bellen" in tier ? tier.bellen() : tier.schnurren();
}

console.log(laengeVon("Hallo"));                          // 5
console.log(beschreibeVorgang(new Rechnung(19.99)));      // Rechnung ueber 19.99 EUR
console.log(gibLaut({ name: "Bello", bellen: () => "Wuff!" })); // Wuff!
```

```typescript
// Truthiness raeumt null und undefined in einem Schritt weg.
function zeigeNamen(namen: string[] | null | undefined): string {
  if (!namen || namen.length === 0) {
    return "(keine Namen)";
  }
  return namen.join(", "); // hier: string[]
}

console.log(zeigeNamen(["Ada", "Grace"])); // "Ada, Grace"
console.log(zeigeNamen(null));             // "(keine Namen)"
```

```typescript
// Eigener Type Guard - und er wirkt sogar in filter().
type Benutzer = { name: string; email: string };

function istBenutzer(wert: unknown): wert is Benutzer {
  if (typeof wert !== "object" || wert === null) {
    return false;
  }
  const kandidat = wert as { name?: unknown; email?: unknown };
  return typeof kandidat.name === "string" && typeof kandidat.email === "string";
}

const rohliste: unknown[] = [
  { name: "Grace", email: "grace@example.org" },
  "kein Benutzer",
];

const nurBenutzer: Benutzer[] = rohliste.filter(istBenutzer);
console.log(nurBenutzer.map((b) => b.name)); // ["Grace"]
```

```typescript
// Assertion Function: wirft statt zurueckzugeben.
function pruefeBenutzer(wert: unknown): asserts wert is Benutzer {
  if (!istBenutzer(wert)) {
    throw new Error("Kein gueltiger Benutzer");
  }
}

const rohdaten: unknown = JSON.parse('{"name":"Grace","email":"g@example.org"}');
pruefeBenutzer(rohdaten);
// Ab hier ist "rohdaten" fuer TypeScript ein Benutzer - ohne if-Block.
console.log(rohdaten.email); // "g@example.org"
```

### ⚠️ Häufiger Fehler

Ein Type Guard ist ein Versprechen, das der Compiler **nicht** nachprüft. Du
darfst im Rumpf beliebigen Unsinn schreiben:

```typescript
function istBenutzerLuege(wert: unknown): wert is Benutzer {
  return typeof wert === "object"; // prueft NICHTS von dem, was es zusagt
}
```

Das kompiliert anstandslos – und ist genauso gefährlich wie ein `as`, nur
besser getarnt. Prüfe wirklich jedes Feld, das du zusagst.

Der zweite Fehler ist die berühmte `typeof null`-Falle:

```typescript
function falsch(wert: object | null): string {
  if (typeof wert === "object") {
    return Object.keys(wert).join(); // Fehler: 'wert' is possibly 'null'.
  }
  return "";
}
```

`typeof null` ergibt in JavaScript `"object"` – ein Bug aus dem Jahr 1995, den
niemand mehr reparieren kann. TypeScript kennt ihn und verengt deshalb nicht
auf `object`. Prüfe immer zusätzlich `wert !== null`.

Dritter Stolperstein: Narrowing hält nicht ewig. Nach einem `await`, einem
Callback oder einer Zuweisung an dieselbe Variable kann der Compiler die
Verengung wieder verwerfen – zu Recht, denn dazwischen kann sich der Wert
geändert haben.

### 🎯 Übungsaufgabe

Schreibe einen Type Guard `istKoordinate` für den Typ
`{ breite: number; laenge: number }` und benutze ihn, um aus einem
`unknown[]` nur die gültigen Koordinaten herauszufiltern.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
type Koordinate = { breite: number; laenge: number };

function istKoordinate(wert: unknown): wert is Koordinate {
  // 1. Ist es ueberhaupt ein Objekt? (null gilt in JS faelschlich als object)
  if (typeof wert !== "object" || wert === null) {
    return false;
  }
  // 2. Beide Felder pruefen - und zwar wirklich beide.
  const kandidat = wert as { breite?: unknown; laenge?: unknown };
  return typeof kandidat.breite === "number" && typeof kandidat.laenge === "number";
}

const eingaben: unknown[] = [
  { breite: 52.52, laenge: 13.4 },
  { breite: "52.52", laenge: 13.4 }, // breite ist Text -> raus
  null,
  { breite: 48.14, laenge: 11.58 },
];

const koordinaten: Koordinate[] = eingaben.filter(istKoordinate);
console.log(koordinaten.length); // 2
console.log(koordinaten.map((k) => `${k.breite}/${k.laenge}`).join(" "));
// 52.52/13.4 48.14/11.58
```

Weil `filter` den Type Guard versteht, ist `koordinaten` hier `Koordinate[]`
und nicht `unknown[]` – ganz ohne `as`.

</details>

---

## 3.5 Discriminated Unions & Vollständigkeitsprüfung mit `never`

### Theorie

Das ist das wichtigste Muster dieses Moduls. Wenn du aus Modul 3 nur eine
Sache mitnimmst, dann diese.

Eine **Discriminated Union** (auch Tagged Union) ist eine Union aus
Objekttypen, die alle *ein* gemeinsames Feld mit einem Literal-Typ haben –
das Unterscheidungsmerkmal, den **Discriminant**:

```typescript
type Zahlung =
  | { art: "karte"; kartennummer: string; ablaufmonat: string }
  | { art: "ueberweisung"; iban: string }
  | { art: "gutschein"; code: string; restwert: number };
```

Prüfst du jetzt `zahlung.art`, weiß TypeScript im jeweiligen Zweig **exakt**,
welche weiteren Felder existieren – und welche nicht. Im `"ueberweisung"`-Fall
ist `zahlung.kartennummer` ein Fehler. Genau so soll es sein.

Vergleiche das mit der üblichen Alternative, dem "Beutel voller optionaler
Felder":

```typescript
type ZahlungFalsch = {
  art: string;
  kartennummer?: string;
  iban?: string;
  code?: string;
};
```

Dieser Typ beschreibt alle gültigen Fälle – aber leider auch alle unsinnigen.
`{ art: "karte", iban: "DE02…" }` geht durch. `{ art: "Karte" }` mit
Tippfehler geht durch. Und weil der Compiler nie sicher weiß, ob ein Feld da
ist, brauchst du überall Fallbacks (`?? "unbekannt"`), die den echten Fehler
verschleiern.

> Die Regel dahinter: **Mach unmögliche Zustände unmöglich.** Ein Typ soll
> nicht beschreiben, was theoretisch im Speicher liegen kann, sondern was
> fachlich erlaubt ist.

#### Die Vollständigkeitsprüfung mit `never`

Der zweite Teil des Musters ist der eigentliche Trick. `never` ist der Typ,
in den kein einziger Wert passt. Wenn du in einem `switch` alle Varianten
abgearbeitet hast, bleibt im `default`-Zweig genau `never` übrig – die Union
ist aufgebraucht.

Diesen Rest gibst du an einen Helfer, der nur `never` akzeptiert:

```typescript
function nichtErreichbar(wert: never): never {
  throw new Error(`Nicht behandelter Fall: ${JSON.stringify(wert)}`);
}
```

Solange alles behandelt ist, passt der Aufruf. Ergänzt jemand später eine
vierte Variante `{ art: "lastschrift"; mandat: string }` und vergisst den
`case`, ist der Rest im `default` nicht mehr `never`, sondern genau diese neue
Variante – und der Compiler meldet:

```
Argument of type '{ art: "lastschrift"; mandat: string; }'
is not assignable to parameter of type 'never'.
```

Ein vergessener Fall wird damit zum **Compilerfehler** statt zu einem Bug im
Betrieb. Diese eine Helferfunktion verwandelt jede Erweiterung deiner Union
in eine To-do-Liste, die dir der Compiler ausdruckt.

### Code-Beispiele

```typescript
type Zahlung =
  | { art: "karte"; kartennummer: string; ablaufmonat: string }
  | { art: "ueberweisung"; iban: string }
  | { art: "gutschein"; code: string; restwert: number };

function nichtErreichbar(wert: never): never {
  throw new Error(`Nicht behandelter Fall: ${JSON.stringify(wert)}`);
}

function beschreibe(zahlung: Zahlung): string {
  switch (zahlung.art) {
    case "karte":
      // Nur hier gibt es kartennummer und ablaufmonat.
      return `Karte **** ${zahlung.kartennummer.slice(-4)}, gueltig bis ${zahlung.ablaufmonat}`;
    case "ueberweisung":
      // "zahlung.kartennummer" waere hier ein Fehler.
      return `Ueberweisung von ${zahlung.iban}`;
    case "gutschein":
      return `Gutschein ${zahlung.code} (Restwert ${zahlung.restwert.toFixed(2)} EUR)`;
    default:
      return nichtErreichbar(zahlung); // zahlung ist hier "never"
  }
}

console.log(beschreibe({ art: "ueberweisung", iban: "DE02120300000000202051" }));
// Ueberweisung von DE02120300000000202051
```

```typescript
// Der Klassiker: ein Ladezustand. Vier Zustaende, die sich ausschliessen.
type Ladezustand =
  | { status: "leer" }
  | { status: "laedt"; seit: number }
  | { status: "fertig"; eintraege: readonly string[] }
  | { status: "fehler"; meldung: string };

function zeigeZustand(zustand: Ladezustand): string {
  switch (zustand.status) {
    case "leer":
      return "Noch nichts geladen.";
    case "laedt":
      return `Laedt seit ${zustand.seit} ms ...`;
    case "fertig":
      // "noUncheckedIndexedAccess": eintraege[0] ist "string | undefined".
      return `${zustand.eintraege.length} Eintraege, erster: ${zustand.eintraege[0] ?? "-"}`;
    case "fehler":
      return `Fehlgeschlagen: ${zustand.meldung}`;
    default:
      return nichtErreichbar(zustand);
  }
}

console.log(zeigeZustand({ status: "fertig", eintraege: ["Milch", "Brot"] }));
// 2 Eintraege, erster: Milch
```

```typescript
// Narrowing geht auch ohne switch - "Extract" holt eine Variante heraus.
function istFertig(
  zustand: Ladezustand
): zustand is Extract<Ladezustand, { status: "fertig" }> {
  return zustand.status === "fertig";
}

const verlauf: Ladezustand[] = [
  { status: "leer" },
  { status: "fertig", eintraege: ["Milch"] },
];

console.log(verlauf.filter(istFertig).map((z) => z.eintraege.length)); // [1]
```

### ⚠️ Häufiger Fehler

Der häufigste Fehler ist ein Discriminant, der gar keiner ist – weil er durch
Widening zu `string` geworden ist:

```typescript
type Zustand = { status: "an" } | { status: "aus" };

const roh = { status: "an" };   // status: string, nicht "an"
// const z: Zustand = roh;      // Fehler: string ist nicht "an" | "aus"
```

Sobald das Objekt aus einer Fabrikfunktion, einem Array oder `JSON.parse`
kommt, brauchst du `as const` oder eine Typannotation (siehe
[3.3](#33-literal-types--as-const)). Ohne Literal-Typ fällt das gesamte
Narrowing in sich zusammen.

Der zweite Fehler: das `default` weglassen. Ohne `default`-Zweig gibt es
keine Vollständigkeitsprüfung – und mit `noImplicitReturns` bekommst du
stattdessen nur die wenig hilfreiche Meldung, dass nicht alle Pfade einen Wert
zurückgeben. Schreibe `nichtErreichbar` **einmal** zentral hin und rufe es in
jedem `default` auf.

Dritter Fehler: verschiedene Discriminant-Namen in derselben Codebasis
(`type` hier, `kind` dort, `art` da). Such dir einen aus und bleib dabei.

### 🎯 Übungsaufgabe

Modelliere die Nachrichten eines Chats als Discriminated Union: eine
Textnachricht (Autor + Text), eine Bildnachricht (Autor + URL + Breite +
Höhe) und eine Systemnachricht (nur Text). Schreibe eine Funktion
`alsVorschau`, die pro Nachricht eine Zeile erzeugt – mit
Vollständigkeitsprüfung.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
type Nachricht =
  | { typ: "text"; autor: string; text: string }
  | { typ: "bild"; autor: string; url: string; breite: number; hoehe: number }
  | { typ: "system"; text: string };

function nichtErreichbar(wert: never): never {
  throw new Error(`Nicht behandelter Fall: ${JSON.stringify(wert)}`);
}

function alsVorschau(nachricht: Nachricht): string {
  switch (nachricht.typ) {
    case "text":
      return `${nachricht.autor}: ${nachricht.text}`;
    case "bild":
      // "nachricht.text" gaebe es hier nicht - und das ist gut so.
      return `${nachricht.autor} hat ein Bild geschickt (${nachricht.breite}x${nachricht.hoehe})`;
    case "system":
      return `-- ${nachricht.text} --`;
    default:
      return nichtErreichbar(nachricht);
  }
}

const chat: Nachricht[] = [
  { typ: "system", text: "Ada ist beigetreten" },
  { typ: "text", autor: "Ada", text: "Hallo zusammen!" },
  { typ: "bild", autor: "Grace", url: "/bilder/1.png", breite: 800, hoehe: 600 },
];

for (const nachricht of chat) {
  console.log(alsVorschau(nachricht));
}
// -- Ada ist beigetreten --
// Ada: Hallo zusammen!
// Grace hat ein Bild geschickt (800x600)
```

Probiere es aus: Ergänze in `Nachricht` eine Variante
`{ typ: "datei"; autor: string; dateiname: string }` – ohne den passenden
`case` zu schreiben. Der Compiler zeigt dir sofort die Stelle im `default`.

</details>

---

## 3.6 Async/Await & Promises typsicher

### Theorie

Ein `Promise<T>` ist eine Quittung: "Das Ergebnis gibt es später, und es wird
vom Typ `T` sein." `await` ist der Gang zur Abholtheke – es packt das `T`
aus.

Drei Regeln, die alles Weitere erklären:

1. **Eine `async`-Funktion gibt immer ein Promise zurück.** Auch wenn im
   Rumpf `return 42;` steht, ist der Rückgabetyp `Promise<number>`. Das
   Verpacken übernimmt `async` für dich – du schreibst also nie
   `async function f(): number`.
2. **`await` gibt es nur in `async`-Funktionen** (und in ES-Modulen auf
   oberster Ebene; bei CommonJS wie in diesem Kurs brauchst du eine
   `main()`-Funktion).
3. **Ein geworfener Fehler ist `unknown`.** Dank
   `useUnknownInCatchVariables` ist `catch (fehler)` nicht `any` – du musst
   erst prüfen, was du gefangen hast.

Für mehrere parallele Aufgaben gibt es zwei Werkzeuge, die man leicht
verwechselt:

| | `Promise.all` | `Promise.allSettled` |
|---|---|---|
| Ergebnis | `T[]` bzw. Tupel | `PromiseSettledResult<T>[]` |
| Bei einem Fehler | bricht alles ab | liefert alle Ergebnisse |
| Wann? | alles wird gebraucht | Teilergebnisse zählen |

`Promise.allSettled` liefert dabei selbst eine Discriminated Union mit dem
Feld `status` (`"fulfilled"` oder `"rejected"`) – du wendest also genau das
Narrowing aus 3.5 an.

Für Fehler, die zum normalen Ablauf gehören (Benutzer nicht gefunden,
Formular ungültig), lohnt sich ein **Result-Pattern**: Statt zu werfen, gibst
du den Fehler als Wert zurück.

```typescript
type Ergebnis<T> =
  | { ok: true; wert: T }
  | { ok: false; fehler: string };
```

Der Aufrufer kommt an `wert` nur heran, nachdem er `ok` geprüft hat – der
Fehlerfall lässt sich nicht mehr übersehen. Ein `try/catch` kann man
vergessen; ein `if (ergebnis.ok)` nicht.

### Code-Beispiele

```typescript
type Benutzer = { readonly id: number; readonly name: string };

function warte(ms: number): Promise<void> {
  return new Promise<void>((aufloesen) => {
    setTimeout(() => aufloesen(), ms);
  });
}

// Rueckgabetyp ist Promise<Benutzer> - nicht Benutzer.
async function ladeBenutzer(id: number): Promise<Benutzer> {
  await warte(10);
  if (id <= 0) {
    throw new Error(`Ungueltige Benutzer-ID: ${id}`);
  }
  return { id, name: `Benutzer-${id}` }; // async verpackt das automatisch
}

// Fehler im catch sind "unknown" - ein Helfer erspart die Wiederholung.
function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : `Unbekannt: ${String(fehler)}`;
}

async function main(): Promise<void> {
  try {
    const benutzer = await ladeBenutzer(1);
    console.log(benutzer.name); // "Benutzer-1"
    await ladeBenutzer(-1);     // wirft
  } catch (fehler) {
    console.log(fehlerText(fehler)); // "Ungueltige Benutzer-ID: -1"
  }
}

// Bei CommonJS gibt es kein await auf oberster Ebene:
main().catch((fehler: unknown) => {
  console.error(fehlerText(fehler));
});
```

```typescript
// Promise.all: parallel, alles oder nichts.
const alle: Benutzer[] = await Promise.all([ladeBenutzer(1), ladeBenutzer(2)]);
console.log(alle.map((b) => b.name)); // ["Benutzer-1", "Benutzer-2"]

// Gemischte Typen ergeben ein Tupel - jede Position ist einzeln bekannt.
const [benutzer, anzahl] = await Promise.all([ladeBenutzer(9), zaehleBenutzer()]);
console.log(benutzer.name, anzahl);

// Promise.allSettled: jedes Ergebnis einzeln bewerten.
const ergebnisse = await Promise.allSettled([ladeBenutzer(4), ladeBenutzer(-2)]);
for (const ergebnis of ergebnisse) {
  if (ergebnis.status === "fulfilled") {
    console.log("ok:", ergebnis.value.name);
  } else {
    console.log("fehlgeschlagen:", fehlerText(ergebnis.reason));
  }
}
```

```typescript
// Result-Pattern: der Fehlerfall laesst sich nicht uebersehen.
type Ergebnis<T> =
  | { ok: true; wert: T }
  | { ok: false; fehler: string };

async function ladeSicher(id: number): Promise<Ergebnis<Benutzer>> {
  try {
    return { ok: true, wert: await ladeBenutzer(id) };
  } catch (fehler) {
    return { ok: false, fehler: fehlerText(fehler) };
  }
}

const ergebnis = await ladeSicher(-7);
if (ergebnis.ok) {
  console.log(ergebnis.wert.name);
} else {
  // "ergebnis.wert" gibt es hier gar nicht.
  console.log(ergebnis.fehler); // "Ungueltige Benutzer-ID: -7"
}
```

### ⚠️ Häufiger Fehler

Nummer eins ist das **vergessene `await`**:

```typescript
async function falsch(): Promise<void> {
  const benutzer = ladeBenutzer(1); // Promise<Benutzer>, kein Benutzer
  console.log(benutzer.name);       // Fehler: Property 'name' does not exist
                                    // on type 'Promise<Benutzer>'.
}
```

Solange du sauber typisierst, fängt der Compiler das ab. Steht dort aber
irgendwo `any`, rechnest du fröhlich mit der Quittung statt mit der Ware –
und bekommst `undefined`.

Nummer zwei ist `await` in einer Schleife, wo Parallelität möglich wäre:

```typescript
// langsam: zehn Anfragen zu 100 ms brauchen eine ganze Sekunde
for (const id of ids) {
  ergebnisse.push(await ladeBenutzer(id));
}

// schnell: alle gleichzeitig starten, dann gemeinsam warten
const ergebnisse = await Promise.all(ids.map((id) => ladeBenutzer(id)));
```

Nacheinander ist trotzdem richtig, wenn ein Schritt das Ergebnis des vorigen
braucht oder du eine fremde API nicht überrennen darfst.

Nummer drei: `catch (fehler)` behandeln, als wäre es ein `Error`.

```typescript
try {
  await ladeBenutzer(-1);
} catch (fehler) {
  // console.log(fehler.message); // Fehler: 'fehler' is of type 'unknown'.
  console.log(fehler instanceof Error ? fehler.message : String(fehler));
}
```

Das ist keine Schikane: In JavaScript darf man **alles** werfen – auch einen
String, `undefined` oder ein Objekt aus einer fremden Bibliothek.

### 🎯 Übungsaufgabe

Schreibe eine Funktion `ladeAlleSicher(ids: number[])`, die alle Benutzer
parallel lädt und ein Array vom Typ `Ergebnis<Benutzer>[]` zurückgibt – eines
pro ID, in derselben Reihenfolge, ohne dass ein einzelner Fehler die anderen
mitreißt.

<details>
<summary>💡 Lösung anzeigen</summary>

```typescript
type Benutzer = { readonly id: number; readonly name: string };

type Ergebnis<T> =
  | { ok: true; wert: T }
  | { ok: false; fehler: string };

function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : `Unbekannt: ${String(fehler)}`;
}

async function ladeBenutzer(id: number): Promise<Benutzer> {
  if (id <= 0) {
    throw new Error(`Ungueltige Benutzer-ID: ${id}`);
  }
  return { id, name: `Benutzer-${id}` };
}

async function ladeAlleSicher(ids: number[]): Promise<Ergebnis<Benutzer>[]> {
  // allSettled statt all: ein Fehler reisst die anderen nicht mit.
  const roh = await Promise.allSettled(ids.map((id) => ladeBenutzer(id)));

  // PromiseSettledResult ist selbst eine Discriminated Union ("status").
  return roh.map((eintrag) =>
    eintrag.status === "fulfilled"
      ? { ok: true, wert: eintrag.value }
      : { ok: false, fehler: fehlerText(eintrag.reason) }
  );
}

async function main(): Promise<void> {
  const ergebnisse = await ladeAlleSicher([1, -2, 3]);
  for (const ergebnis of ergebnisse) {
    console.log(ergebnis.ok ? `ok: ${ergebnis.wert.name}` : `fehler: ${ergebnis.fehler}`);
  }
  // ok: Benutzer-1
  // fehler: Ungueltige Benutzer-ID: -2
  // ok: Benutzer-3
}

main().catch((fehler: unknown) => {
  console.error(fehlerText(fehler));
});
```

Zwei Dinge zum Merken: `ids.map(...)` startet alle Aufrufe **sofort** – das
gemeinsame Warten passiert erst im `await`. Und die Reihenfolge des Ergebnis-
Arrays entspricht der Reihenfolge der Eingaben, nicht der Reihenfolge, in der
die Antworten eintreffen.

</details>

---

## 📋 Zusammenfassung & Cheat-Sheet

```typescript
// --- Union: "entweder oder" ------------------------------------------------
type Id = string | number;          // Wert ist eines von beiden
type Ampel = "rot" | "gelb" | "gruen";
// erlaubt ist nur, was ALLE Varianten koennen -> erst narrowen

// --- Intersection: "alles zugleich" ----------------------------------------
type Kunde = { id: number } & { name: string };  // alle Felder Pflicht
type Tot = { w: string } & { w: number };        // w wird never

// --- Literale & as const ---------------------------------------------------
const a = "links";                    // Typ "links"
let b = "links";                      // Typ string (Widening)
const k = { modus: "dunkel" } as const;   // modus: "dunkel", readonly
const ROLLEN = ["admin", "leser"] as const;
type Rolle = (typeof ROLLEN)[number]; // "admin" | "leser"

// --- Narrowing -------------------------------------------------------------
if (typeof x === "string") { … }      // primitive Typen
if (x instanceof Error) { … }         // Klassen
if ("feld" in obj) { … }              // Objektformen
if (x) { … }                          // Truthiness (Vorsicht bei 0 und "")
if (x === "rot") { … }                // Gleichheit

function istX(w: unknown): w is X { … }          // Type Predicate
function pruefeX(w: unknown): asserts w is X { … } // Assertion Function

// --- Discriminated Union + Vollstaendigkeitspruefung ------------------------
type Zahlung =
  | { art: "karte"; kartennummer: string }
  | { art: "ueberweisung"; iban: string };

function nichtErreichbar(wert: never): never {
  throw new Error(`Nicht behandelter Fall: ${JSON.stringify(wert)}`);
}

switch (zahlung.art) {
  case "karte":        return …;
  case "ueberweisung": return …;
  default:             return nichtErreichbar(zahlung); // hier: never
}

// --- Async -----------------------------------------------------------------
async function lade(): Promise<Benutzer> { … }   // immer Promise<T>
const b2 = await lade();                          // await packt aus
try { … } catch (fehler) {                        // fehler ist unknown!
  const text = fehler instanceof Error ? fehler.message : String(fehler);
}
await Promise.all([p1, p2]);        // alles oder nichts
await Promise.allSettled([p1, p2]); // jedes Ergebnis einzeln

type Ergebnis<T> = { ok: true; wert: T } | { ok: false; fehler: string };
```

| Frage | Antwort |
|---|---|
| `\|` oder `&`? | `\|` = einer von beiden. `&` = alles zugleich. |
| Warum meckert der Compiler bei `id.toUpperCase()`? | Bei einer Union ist nur erlaubt, was **alle** Varianten können. Erst narrowen. |
| Warum ist mein Objektfeld `string` statt `"dunkel"`? | Widening. `as const` oder eine Typannotation setzen. |
| `as` oder Type Guard? | Immer Type Guard. `as` prüft nichts, es behauptet nur. |
| Wie verhindere ich vergessene Fälle? | Discriminated Union + `default: return nichtErreichbar(x)`. |
| Warum ist `typeof null === "object"`? | JavaScript-Bug von 1995. Immer zusätzlich `!== null` prüfen. |
| Optionale Felder oder Discriminated Union? | Union – sie macht unmögliche Zustände unmöglich. |
| `Promise.all` oder `allSettled`? | `all`, wenn du alles brauchst. `allSettled`, wenn Teilergebnisse zählen. |
| Was ist `catch (e)` für ein Typ? | `unknown`. Erst `e instanceof Error` prüfen. |
| Muss ich `async function f(): Promise<T>` schreiben? | Ja – `async` verpackt den Rückgabewert immer in ein Promise. |

---

← [Kursübersicht](../README.md) | [Modul 2: Der nächste Schritt](../modul-2-mittelstufe/README.md) | [Modul 4: Profi Node.js](../modul-4-profi-nodejs/README.md) →
