# Glossar

Alle Fachbegriffe dieses Kurses, alphabetisch sortiert. In Klammern steht das
Modul, in dem der Begriff eingeführt wird.

← [zurück zur Kursübersicht](./README.md)

---

### Annotation (Type Annotation) · *Modul 1*

Ein Typ, den du selbst hinschreibst: `const name: string = "Ada"`. Gegenstück
zur [Inference](#inference-type-inference--modul-1). Faustregel: bei
Funktionssignaturen annotieren, bei Variablen mit Anfangswert weglassen.

### Anti-Pattern

Eine verbreitete, aber schlechte Lösung. In diesem Kurs zeigt jede
Beispieldatei zuerst das Anti-Pattern und danach die Best Practice, damit der
Unterschied sichtbar wird.

### `any` · *Modul 1*

Der Typ, der die Typprüfung abschaltet. Mit einem `any`-Wert ist alles
erlaubt – und nichts mehr geprüft. Ein einziges `any` färbt auf alles ab, was
daraus abgeleitet wird. Ersatz: [`unknown`](#unknown--modul-1).

### `as` (Type Assertion) · *Modul 3, 6*

Eine Behauptung über einen Typ: `wert as Benutzer`. Der Compiler glaubt sie
ungeprüft. Bei Daten von außen ist `as` deshalb gefährlich – dort gehört eine
echte Prüfung hin ([Type Guard](#type-guard--type-predicate--modul-3)).

### `as const` · *Modul 2, 3*

Macht ein Literal so eng wie möglich und unveränderlich: aus `"links"` (Typ
`string`) wird der Literal-Typ `"links"`, aus einem Array ein `readonly`-Tupel.
Häufig genutzt, um aus Werten Union-Typen abzuleiten.

### Assertion Function · *Modul 3*

Eine Funktion mit der Signatur `asserts wert is Typ`. Sie wirft, wenn der Typ
nicht stimmt – danach weiß TypeScript im weiteren Code, dass der Wert diesen
Typ hat.

### Barrel-File · *Modul 4*

Eine `index.ts`, die Exporte mehrerer Dateien bündelt, damit Nutzer nur aus
einem Pfad importieren müssen. Praktisch, kann aber zirkuläre Abhängigkeiten
und größere Bundles begünstigen.

### Best Practice

Die empfohlene Lösung eines Problems. In diesem Kurs immer der zweite Block
jeder Beispieldatei, direkt nach dem Anti-Pattern.

### Branded Type (Nominal Typing) · *Modul 6, 9*

Ein Typ, der zur Laufzeit ein einfacher Wert ist, im Typsystem aber eine
unsichtbare "Marke" trägt: `type TodoId = string & { readonly __marke: "TodoId" }`.
Verhindert, dass zwei gleich aussehende Werte (z. B. `TodoId` und
`BenutzerId`) verwechselt werden.

### CommonJS · *Modul 4*

Das ältere Modulsystem von Node.js mit `require()` und `module.exports`.
Dieses Repository kompiliert nach CommonJS – deshalb funktioniert
`require.main === module` in den Beispieldateien.

### Conditional Type · *Modul 7*

Eine Fallunterscheidung auf Typebene: `A extends B ? X : Y`. Zusammen mit
[`infer`](#infer--modul-7) das Werkzeug, um Typen aus anderen Typen
herauszulesen.

### Constraint · *Modul 7*

Die Einschränkung eines generischen Typparameters mit `extends`, z. B.
`<T extends { id: string }>`. Legt fest, was `T` mindestens können muss.

### Decorator · *Modul 7*

Eine Funktion, die eine Klasse oder Methode umhüllt und ihr Verhalten
hinzufügt (Logging, Zeitmessung, Zugriffsprüfung), ohne den ursprünglichen
Code zu ändern. Braucht `"experimentalDecorators": true`.

### Discriminated Union · *Modul 3, 9*

Eine Union von Objekttypen, die sich über ein gemeinsames Feld unterscheiden
lassen: `{ ok: true; wert: T } | { ok: false; fehler: string }`. TypeScript
erkennt anhand dieses Feldes automatisch, welcher Fall vorliegt – vergessene
Fehlerbehandlung wird damit zum Compilerfehler.

### DTO (Data Transfer Object) · *Modul 9*

Die Form, in der Daten über eine Systemgrenze gehen (z. B. im Request-Body).
Wird immer aus dem Kerntyp abgeleitet, nie abgetippt – etwa
`type NeuesTodoDTO = Pick<Todo, "titel">`.

### Enum · *Modul 2*

Ein benannter Satz von Konstanten. In TypeScript oft entbehrlich: Ein
Literal-Union-Typ (`"admin" | "user"`) ist meist einfacher, erzeugt keinen
zusätzlichen Laufzeitcode und lässt sich besser mit JSON kombinieren.

### ESM (ECMAScript Modules) · *Modul 4*

Das moderne Modulsystem mit `import`/`export`, aktiviert über
`"type": "module"` in der `package.json`. Gegenstück zu
[CommonJS](#commonjs--modul-4).

### Fail-Fast · *Modul 8, 9*

Das Prinzip, bei fehlerhafter Konfiguration sofort beim Start abzubrechen –
statt später mitten im Betrieb über ein `undefined` zu stolpern.

### Generic (Generics) · *Modul 7*

Ein Typparameter, der erst bei der Verwendung mit einem konkreten Typ gefüllt
wird: `function ersteElement<T>(liste: T[]): T | undefined`. Erlaubt
wiederverwendbaren Code ohne Verlust der Typsicherheit.

### Graceful Shutdown · *Modul 8, 9*

Ein Server, der auf `SIGTERM`/`SIGINT` laufende Anfragen zu Ende bringt und
sich dann sauber beendet, statt hart abgebrochen zu werden.

### `infer` · *Modul 7*

Schlüsselwort innerhalb eines Conditional Type, das einen Typ an einer Stelle
"einfängt": `T extends (infer E)[] ? E : T` liest den Elementtyp eines Arrays
aus.

### Inference (Type Inference) · *Modul 1*

Die automatische Typableitung. `const stadt = "Berlin"` hat den Typ `string`,
ohne dass du ihn hinschreibst – und ist dabei genauso streng geprüft wie eine
[Annotation](#annotation-type-annotation--modul-1).

### Index-Signatur · *Modul 2*

Erlaubt beliebige Schlüssel eines Typs: `{ [schluessel: string]: number }`.
Wegen `noPropertyAccessFromIndexSignature` greift man darauf mit
`obj["key"]` zu, nicht mit `obj.key`.

### Interface · *Modul 2*

Beschreibt die Form eines Objekts. Kann mit `extends` erweitert werden und ist
offen für Declaration Merging. Für Unions und komplexe Typoperationen nimmt
man stattdessen [`type`](#type-alias--modul-2).

### Intersection Type · *Modul 3*

Die Kombination mehrerer Typen mit `&`: `A & B` hat die Eigenschaften von
beiden. Gegenstück zum [Union Type](#union-type--modul-3).

### `keyof` · *Modul 7*

Liefert die Union aller Schlüsselnamen eines Typs: `keyof Produkt` ergibt
`"id" | "bezeichnung" | "preis"`. Zentraler Baustein für typsichere
Objektzugriffe.

### Literal Type · *Modul 3*

Ein Typ, der genau einen Wert erlaubt: `"admin"`, `42`, `true`. Aus mehreren
Literal-Typen entstehen die praktischen Literal Unions wie
`type Rolle = "admin" | "user"`.

### Lookup Type · *Modul 7*

Greift den Typ hinter einem Schlüssel ab: `Produkt["preis"]` ergibt `number`.
In Kombination mit `keyof` die Grundlage generischer Getter und Setter.

### Mapped Type · *Modul 7*

Erzeugt einen neuen Typ, indem alle Schlüssel eines bestehenden durchlaufen
werden: `{ [K in keyof T]?: T[K] }`. So ist `Partial<T>` tatsächlich definiert.

### Narrowing · *Modul 3*

Das schrittweise Einengen eines Typs durch Prüfungen. Nach
`if (typeof wert === "string")` weiß TypeScript im `if`-Block, dass `wert` ein
`string` ist.

### `never` · *Modul 1, 3*

Der Typ, der keinen Wert haben kann. Rückgabetyp von Funktionen, die immer
werfen – und das Werkzeug für die
[Vollständigkeitsprüfung](#vollständigkeitsprüfung-exhaustiveness-check--modul-3).

### Nullish Coalescing (`??`) · *Modul 1*

Liefert den rechten Wert nur, wenn der linke `null` oder `undefined` ist.
Anders als `||`, das auch bei `0`, `""` und `false` greift – und deshalb bei
Default-Werten oft falsch ist.

### Optional Chaining (`?.`) · *Modul 2*

Greift auf eine Eigenschaft zu, ohne zu werfen, wenn der Wert `null` oder
`undefined` ist: `benutzer?.adresse?.stadt`.

### "Parse, don't validate" · *Modul 6, 9*

Das Prinzip, Fremddaten nicht nur zu prüfen, sondern in einen neuen,
vertrauenswürdigen Typ zu überführen. Danach kann der restliche Code sich auf
den Typ verlassen, statt überall erneut zu prüfen.

### Parameter Property · *Modul 2*

Kurzschreibweise, bei der ein Konstruktorparameter direkt zum Klassenfeld
wird: `constructor(private readonly name: string) {}`.

### Repository Pattern · *Modul 9*

Eine Speicherschicht hinter einer festen Schnittstelle (`alle`, `findeById`,
`speichere`, `loesche`). Die Fachlogik kennt nur die Schnittstelle – die
Technik dahinter (Map, SQLite, HTTP) bleibt austauschbar.

### Salt · *Modul 6*

Ein zufälliger Wert, der vor dem Hashen an ein Passwort gehängt wird. Sorgt
dafür, dass gleiche Passwörter unterschiedliche Hashes ergeben, und macht
vorberechnete Tabellen nutzlos.

### `scrypt` · *Modul 6, 9*

Ein absichtlich langsames, speicherintensives Hashverfahren für Passwörter
(in `node:crypto` enthalten). Bremst einen einzelnen Login kaum, macht
massenhaftes Durchprobieren aber teuer.

### Source Map · *Modul 8*

Eine Zuordnungsdatei, die kompiliertes JavaScript auf die ursprünglichen
TypeScript-Zeilen zurückführt – damit Stacktraces in Produktion lesbar
bleiben.

### Strict Mode · *Modul 1, 5*

`"strict": true` in der `tsconfig.json`. Schaltet unter anderem
`noImplicitAny`, `strictNullChecks` und `strictFunctionTypes` ein. Dieser Kurs
aktiviert zusätzlich mehrere Optionen darüber hinaus.

### Structural Typing · *Modul 2*

TypeScript vergleicht Typen anhand ihrer **Form**, nicht ihres Namens. Zwei
Interfaces mit denselben Feldern sind austauschbar – der Gegenentwurf dazu ist
[Nominal Typing](#branded-type-nominal-typing--modul-6-9).

### Template Literal Type · *Modul 7*

Ein Typ, der aus Textbausteinen entsteht: `` `${string & keyof T}:geaendert` ``
erzeugt typsichere Event-Namen.

### Timing-Angriff · *Modul 6*

Ein Angriff, der aus der Antwortzeit Rückschlüsse zieht. Gegenmittel beim
Vergleich von Hashes: `timingSafeEqual` aus `node:crypto`, das immer gleich
lange braucht.

### Tuple · *Modul 2*

Ein Array mit fester Länge und festem Typ pro Position:
`type Koordinate = [number, number]`.

### `ts-node` · *Modul 4, 5*

Führt `.ts`-Dateien direkt aus, ohne vorheriges Kompilieren. Ideal zum Lernen
und Ausprobieren – in Produktion nimmt man stattdessen das mit `tsc`
kompilierte JavaScript.

### `tsc` · *Modul 5, 8*

Der TypeScript-Compiler. `tsc` kompiliert nach `dist/`, `tsc --noEmit` prüft
nur die Typen, ohne Dateien zu schreiben.

### Type Alias · *Modul 2*

Ein Name für einen beliebigen Typ: `type Rolle = "admin" | "user"`. Anders als
ein [Interface](#interface--modul-2) kann ein Type Alias auch Unions,
Intersections und Tuples beschreiben.

### Type Guard / Type Predicate · *Modul 3*

Eine Funktion mit der Signatur `wert is Typ`, die zur Laufzeit prüft und dem
Compiler das Ergebnis mitteilt. Grundlage jeder sicheren Verarbeitung von
Fremddaten.

### Union Type · *Modul 3*

Ein Typ, der mehrere Möglichkeiten zulässt: `string | number`. Vor der
Benutzung muss meist per [Narrowing](#narrowing--modul-3) geklärt werden,
welcher Fall vorliegt.

### `unknown` · *Modul 1*

Der sichere Zwilling von [`any`](#any--modul-1): Nimmt jeden Wert an, erlaubt
aber keine Operation, bevor der Typ geprüft wurde. Der richtige Typ für alles,
was von außen kommt.

### Utility Type · *Modul 7*

Ein eingebauter Typ, der andere Typen umformt: `Partial`, `Required`,
`Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited`, `NonNullable`.
Ersetzt handgepflegte Kopien von Typen.

### `void` · *Modul 1*

Der Rückgabetyp von Funktionen, die nichts zurückgeben. Nicht zu verwechseln
mit [`never`](#never--modul-1-3), das bedeutet: kehrt gar nicht erst zurück.

### Vollständigkeitsprüfung (Exhaustiveness Check) · *Modul 3*

Ein `default`-Zweig, der den verbleibenden Wert einer Union `never` zuweist.
Kommt später ein neuer Fall hinzu, meldet der Compiler sofort die Stelle, an
der er noch fehlt.

---

← [zurück zur Kursübersicht](./README.md)
