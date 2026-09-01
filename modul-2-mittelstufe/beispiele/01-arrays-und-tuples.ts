/**
 * MODUL 2.1 - Arrays und Tuples
 * ============================================================================
 * Ein Array ist eine Kiste mit gleichartigem Inhalt und beliebiger Laenge:
 * `string[]` heisst "beliebig viele Texte". Ein Tuple ist dagegen ein
 * Setzkasten mit festen Faechern: `[string, number]` heisst "genau zwei
 * Elemente, erst ein Text, dann eine Zahl".
 *
 * Schreibweisen:
 *   T[]        - Kurzform, der Normalfall
 *   Array<T>   - Langform, identische Bedeutung
 *   readonly T[] / ReadonlyArray<T> - Array, das nicht veraendert werden darf
 *
 * WICHTIG fuer dieses Projekt: In der tsconfig ist "noUncheckedIndexedAccess"
 * aktiv. Damit hat `array[0]` NICHT den Typ T, sondern `T | undefined` -
 * TypeScript zwingt dich also, an leere Arrays und zu grosse Indizes zu
 * denken. Bei Tuples gilt das nur fuer Indizes ausserhalb der festen Laenge.
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: Arrays ohne Typ und "Positions-Wissen" im Kopf
// -----------------------------------------------------------------------
// Ein "any[]" ist ein Sack, in den alles hineindarf. Der Typ muss hier
// explizit hingeschrieben werden, weil "noImplicitAny" aktiv ist - genau
// das ist der Punkt: Man muss das Abschalten der Pruefung bewusst tun.
const messwerteFalsch: any[] = [12, "13", true, null];

// Die Summe sieht harmlos aus - das Ergebnis ist es nicht:
let summeFalsch: any = 0;
for (const wert of messwerteFalsch) {
  summeFalsch = summeFalsch + wert; // aus Zahl + Text wird stillschweigend Text
}
console.log("[Anti-Pattern] Summe aus any[]:", summeFalsch);

// Noch unangenehmer: Positionen als "gemischtes Array". Was steht auf
// Index 1? Das weiss nur, wer die Funktion geschrieben hat.
const koordinateFalsch: any[] = ["Berlin", 52.52, 13.4];
console.log(
  "[Anti-Pattern] Breite laut Index 1:",
  koordinateFalsch[1],
  "- aber niemand haelt jemanden davon ab, hier Unsinn abzulegen."
);

// -----------------------------------------------------------------------
// BEST PRACTICE: typisierte Arrays
// -----------------------------------------------------------------------

const messwerte: number[] = [12, 13, 14, 15];
const staedte: Array<string> = ["Berlin", "Hamburg", "Muenchen"];

// Die Summe kann jetzt nur noch eine Zahl sein:
const summe: number = messwerte.reduce((a, b) => a + b, 0);
console.log("[Best Practice] Summe aus number[]:", summe);
console.log("[Best Practice] Staedte:", staedte.join(", "));

// -----------------------------------------------------------------------
// BEST PRACTICE: noUncheckedIndexedAccess richtig behandeln
// -----------------------------------------------------------------------
// messwerte[0] hat den Typ "number | undefined" - nicht "number".
const ersterWert: number | undefined = messwerte[0];
console.log("[Best Practice] erster Wert (roh):", ersterWert);

// Drei saubere Wege, damit umzugehen:

// 1) Fallback mit ?? (greift nur bei null/undefined, nicht bei 0)
const ersterMitFallback: number = messwerte[0] ?? 0;

// 2) Pruefen und den Fall behandeln
function ersterEintrag(werte: readonly number[]): string {
  const wert = werte[0];
  if (wert === undefined) {
    return "Liste ist leer";
  }
  return `erster Eintrag: ${wert}`;
}

// 3) Iterieren statt indizieren - for..of liefert direkt "number"
let groesster = Number.NEGATIVE_INFINITY;
for (const wert of messwerte) {
  groesster = Math.max(groesster, wert);
}

console.log("[Best Practice] erster Wert mit Fallback:", ersterMitFallback);
console.log("[Best Practice]", ersterEintrag(messwerte));
console.log("[Best Practice]", ersterEintrag([]));
console.log("[Best Practice] groesster Wert:", groesster);

// -----------------------------------------------------------------------
// BEST PRACTICE: readonly Arrays
// -----------------------------------------------------------------------
// Ein "readonly number[]" kann gelesen, aber nicht veraendert werden.
// Methoden wie push, pop oder sort existieren auf diesem Typ gar nicht.
const basisPreise: readonly number[] = [10, 20, 30];
// basisPreise.push(40); // Fehler: Property 'push' does not exist on type 'readonly number[]'.

// map/filter/slice sind erlaubt: sie erzeugen ein NEUES Array.
const bruttoPreise: number[] = basisPreise.map((p) => p * 1.19);
console.log("[Best Practice] readonly bleibt unveraendert:", basisPreise);
console.log(
  "[Best Practice] neues Array aus map:",
  bruttoPreise.map((p) => p.toFixed(2)).join(" | ")
);

// -----------------------------------------------------------------------
// BEST PRACTICE: Tuples mit fester Laenge und benannten Elementen
// -----------------------------------------------------------------------
// Benannte Tuple-Elemente sind reine Dokumentation - zur Laufzeit bleibt es
// ein normales Array. Aber der Editor zeigt die Namen an, und das genuegt.
type Koordinate = readonly [breite: number, laenge: number];

const berlin: Koordinate = [52.52, 13.4];
// const kaputt: Koordinate = [52.52];        // Fehler: Laenge stimmt nicht
// const auchKaputt: Koordinate = [52.52, ""]; // Fehler: falscher Typ

// Bei Tuples greift noUncheckedIndexedAccess NICHT innerhalb der festen
// Laenge: berlin[0] ist "number", weil das Fach garantiert existiert.
console.log("[Best Practice] Breite/Laenge:", berlin[0], berlin[1]);

// Destrukturierung ist die lesbarste Variante:
const [breite, laenge] = berlin;
console.log("[Best Practice] destrukturiert:", breite, laenge);

// Tuples sind ideal fuer Funktionen mit zwei zusammengehoerigen Rueckgaben:
function teileMitRest(
  zaehler: number,
  nenner: number
): [ganzzahl: number, rest: number] {
  return [Math.floor(zaehler / nenner), zaehler % nenner];
}

const [ganzzahl, rest] = teileMitRest(17, 5);
console.log("[Best Practice] 17 / 5 =", ganzzahl, "Rest", rest);

// Optionale und Rest-Elemente in Tuples:
type Logeintrag = [stufe: "info" | "warn", text: string, code?: number];
const eintraege: Logeintrag[] = [
  ["info", "Start"],
  ["warn", "Speicher knapp", 42],
];
for (const [stufe, text, code] of eintraege) {
  console.log(`[Best Practice] ${stufe.toUpperCase()}: ${text} (${code ?? "-"})`);
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Nimm Tuples sparsam. Sobald ein Tuple drei oder mehr Felder hat, ist ein
// Objekt fast immer besser lesbar: `{ breite, laenge }` erklaert sich beim
// Lesen selbst, `[number, number, number]` nicht.
//
// Und noch ein Tipp zu noUncheckedIndexedAccess: Die Option nervt anfangs,
// verhindert aber die haeufigste Fehlerklasse ueberhaupt - "cannot read
// property of undefined". Schalte sie nicht ab; nutze stattdessen `?? `,
// `at()`, eine explizite Pruefung oder gleich `for..of`.
