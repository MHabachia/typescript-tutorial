/**
 * MODUL 3.1 / 3.2 / 3.3 - Union, Intersection & Literal-Typen
 * ============================================================================
 * Drei Werkzeuge, mit denen du aus vorhandenen Typen neue baust:
 *   A | B      Union        - "entweder A oder B"   (Auswahl)
 *   A & B      Intersection - "A UND B zugleich"    (Kombination)
 *   "rot"      Literal      - "genau dieser Wert"   (Praezision)
 *
 * Merkhilfe: Die Union macht die Menge der erlaubten WERTE groesser, aber die
 * Menge der erlaubten OPERATIONEN kleiner. Bei der Intersection ist es genau
 * umgekehrt.
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: "any", wenn zwei Typen moeglich sind
// -----------------------------------------------------------------------
// Eine ID darf ein Text ODER eine Zahl sein. Wer das mit "any" loest (der Typ
// muss wegen "noImplicitAny" ausdruecklich hingeschrieben werden), schaltet
// die Pruefung komplett ab - der Fehler faellt erst zur Laufzeit auf.
function formatiereIdFalsch(id: any): string {
  return id.toUpperCase();
}

console.log("[Anti-Pattern] ID als Text:", formatiereIdFalsch("ab-42"));

try {
  console.log("[Anti-Pattern] ID als Zahl:", formatiereIdFalsch(42));
} catch (fehler) {
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  console.log("[Anti-Pattern] kracht zur Laufzeit:", text);
}

// -----------------------------------------------------------------------
// BEST PRACTICE: Union Type - "entweder oder", aber sauber getrennt
// -----------------------------------------------------------------------
type Id = string | number;

function formatiereId(id: Id): string {
  // Ohne Pruefung erlaubt TypeScript nur das, was BEIDE Typen koennen.
  // "id.toUpperCase()" waere hier ein Fehler - "number" kennt das nicht.
  if (typeof id === "string") {
    return id.toUpperCase(); // hier ist id garantiert ein string
  }
  return `NR-${id.toFixed(0)}`; // und hier garantiert eine number
}

console.log("[Best Practice] ID als Text:", formatiereId("ab-42"));
console.log("[Best Practice] ID als Zahl:", formatiereId(42));

// Union aus Literalen: der wohl nuetzlichste Union-Typ ueberhaupt.
type Ampel = "rot" | "gelb" | "gruen";

// "Record<Ampel, Ampel>" erzwingt, dass wirklich jede Farbe einen Nachfolger
// hat - vergisst du eine, meckert der Compiler.
const naechsteFarbe: Record<Ampel, Ampel> = {
  rot: "gruen",
  gruen: "gelb",
  gelb: "rot",
};

console.log("[Best Practice] auf rot folgt:", naechsteFarbe.rot);
console.log("[Best Practice] auf gelb folgt:", naechsteFarbe.gelb);
// naechsteFarbe.blau -> Fehler, "blau" gibt es im Typ "Ampel" nicht.

// -----------------------------------------------------------------------
// BEST PRACTICE: Intersection Type - alles aus A UND alles aus B
// -----------------------------------------------------------------------
type Artikel = { titel: string; preis: number };
type MitZeitstempel = { erstelltAm: string; geaendertAm: string };

type GespeicherterArtikel = Artikel & MitZeitstempel;

const artikel: GespeicherterArtikel = {
  titel: "Kaffeemuehle",
  preis: 49.9,
  erstelltAm: "2024-05-01",
  geaendertAm: "2024-05-03",
  // Liesse man ein Feld weg, waere das ein Fehler: bei "&" sind ALLE
  // Eigenschaften beider Typen Pflicht.
};

console.log(
  "[Best Practice] Intersection:",
  `${artikel.titel} (${artikel.preis} EUR), zuletzt ${artikel.geaendertAm}`
);

// Intersections sind der uebliche Weg, kleine Bausteine zu mischen:
type MitId = { id: number };
type Kunde = MitId & { name: string } & MitZeitstempel;

const kunde: Kunde = {
  id: 7,
  name: "Ada Lovelace",
  erstelltAm: "2024-01-01",
  geaendertAm: "2024-01-01",
};

console.log("[Best Practice] gemischter Typ:", kunde.id, kunde.name);

// Konflikt-Fall: Was passiert, wenn sich zwei Typen widersprechen?
type NurText = { wert: string };
type NurZahl = { wert: number };
// "wert" waere hier "string & number" - also "never". Der Typ laesst sich
// hinschreiben, aber es gibt keinen einzigen Wert, der hineinpasst.
type Unmoeglich = NurText & NurZahl;
// const x: Unmoeglich = { wert: "a" }; // Fehler: string ist nicht never

// Man kann eine Liste solcher Werte deklarieren - sie bleibt aber fuer immer
// leer, weil es keinen einzigen passenden Wert gibt.
function zaehleUnmoegliche(werte: Unmoeglich[]): number {
  return werte.length;
}

console.log(
  "[Best Practice] Konflikt:",
  "string & number ergibt never, Anzahl moeglicher Werte:",
  zaehleUnmoegliche([])
);

// -----------------------------------------------------------------------
// BEST PRACTICE: Literal-Typen und "as const"
// -----------------------------------------------------------------------
// Widening: "const" merkt sich den genauen Wert, "let" nur den weiten Typ.
const richtungKonstant = "links"; // Typ: "links"
let richtungVariabel = "links"; // Typ: string
richtungVariabel = "rechts";
console.log("[Best Practice] Widening:", richtungKonstant, richtungVariabel);

type Modus = "hell" | "dunkel";

function beschreibeModus(modus: Modus): string {
  return modus === "hell" ? "Heller Hintergrund" : "Dunkler Hintergrund";
}

// Ohne "as const" wird aus "dunkel" der weite Typ "string" - und string passt
// nicht auf die enge Union "Modus".
const konfigOhneConst = { modus: "dunkel", stufen: [1, 2, 3] };
// beschreibeModus(konfigOhneConst.modus); // Fehler: string ist zu weit

// Mit "as const" wird jede Eigenschaft readonly und behaelt ihren Literaltyp.
const konfig = { modus: "dunkel", stufen: [1, 2, 3] } as const;
// konfig.modus  -> "dunkel"
// konfig.stufen -> readonly [1, 2, 3]
// konfig.modus = "hell"; // Fehler: readonly

console.log("[Best Practice] Modus:", beschreibeModus(konfig.modus));

// Nebeneffekt von "as const", der viel Aerger spart:
// Bei einem normalen Array ist "stufen[0]" wegen "noUncheckedIndexedAccess"
// vom Typ "number | undefined" - du brauchst einen Fallback.
const ersteStufeOffen = konfigOhneConst.stufen[0] ?? 0;
// Beim Tupel aus "as const" weiss TypeScript: Index 0 existiert garantiert.
const ersteStufeFest = konfig.stufen[0];

console.log(
  "[Best Practice] erste Stufe:",
  ersteStufeOffen,
  "vs. (Tupel)",
  ersteStufeFest
);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Union-Typen aus Literalen sind fast immer die bessere Wahl als "enum".
// Sie erzeugen keinerlei JavaScript-Code, lassen sich direkt mit Strings
// vergleichen und funktionieren nahtlos mit JSON.
//
// Wenn du die erlaubten Werte trotzdem einmal zentral als Wert brauchst
// (z. B. fuer eine Schleife oder ein Dropdown), leite den Typ aus dem Array
// ab - dann kann er nie auseinanderlaufen:
//
//   const AMPELFARBEN = ["rot", "gelb", "gruen"] as const;
//   type Ampelfarbe = (typeof AMPELFARBEN)[number]; // "rot" | "gelb" | "gruen"
//
// Eine Quelle der Wahrheit, zwei Verwendungen: Liste zur Laufzeit, Union zur
// Compilezeit.
