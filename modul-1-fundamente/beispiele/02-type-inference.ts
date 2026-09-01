/**
 * MODUL 1.2 - Type Inference (automatische Typableitung)
 * ============================================================================
 * TypeScript kann bei einer Zuweisung oft SELBST erkennen, welcher Typ
 * gemeint ist - man muss also nicht jeden Typ von Hand hinschreiben. Das
 * nennt man "Type Inference". Der abgeleitete Typ ist dabei genauso streng
 * wie ein von Hand geschriebener Typ.
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: Ueberall Typen von Hand schreiben ODER ueberall "any"
// -----------------------------------------------------------------------
// Variante 1: Unnoetiger Ballast, weil der Typ ohnehin eindeutig ist.
const stadtUnnoetig: string = "Berlin";
console.log("[Anti-Pattern] stadtUnnoetig (Annotation war ueberfluessig):", stadtUnnoetig);

// Variante 2 (viel schlimmer): "any" verwenden, um sich das Nachdenken
// ueber Typen komplett zu ersparen - das zerstoert die Typsicherheit.
function verdoppleFalsch(wert: any) {
  return wert * 2; // Was, wenn "wert" ein String oder ein Objekt ist?
}
console.log("[Anti-Pattern] verdoppleFalsch(21) =", verdoppleFalsch(21));
console.log(
  '[Anti-Pattern] verdoppleFalsch("hallo") =',
  verdoppleFalsch("hallo") // ergibt "NaN" - erst zur Laufzeit sichtbar!
);

// -----------------------------------------------------------------------
// BEST PRACTICE: Type Inference nutzen, wo sie eindeutig ist
// -----------------------------------------------------------------------

// TypeScript leitet hier automatisch den Typ "string" ab:
const stadt = "Berlin";

// TypeScript leitet hier automatisch den Typ "number" ab:
const einwohnerInMillionen = 3.8;

// TypeScript leitet sogar bei Objekten und Arrays den Typ ab:
const koordinate = { breitengrad: 52.52, laengengrad: 13.405 };
const beliebtesteStaedte = ["Berlin", "Hamburg", "Muenchen"];

console.log("[Best Practice] Stadt:", stadt, "| Einwohner (Mio.):", einwohnerInMillionen);
console.log("[Best Practice] Koordinate:", koordinate);
console.log("[Best Practice] Staedte:", beliebtesteStaedte);

// Explizite Typannotationen bleiben trotzdem wichtig, wenn der Typ NICHT
// eindeutig aus dem Wert ableitbar ist - typischerweise bei Funktionsparametern
// oder wenn eine Variable ohne Anfangswert deklariert wird:
function verdoppleRichtig(wert: number): number {
  return wert * 2;
}
console.log("[Best Practice] verdoppleRichtig(21) =", verdoppleRichtig(21));

// Absichtlich "let": Der Wert wird erst NACH der Deklaration zugewiesen.
// "const x: number;" ohne Wert waere an dieser Stelle ein Compiler-Fehler
// ("must be initialized").
/* eslint-disable prefer-const */
let ergebnisSpaeterGesetzt: number; // Typ MUSS hier annotiert werden
ergebnisSpaeterGesetzt = verdoppleRichtig(10);
/* eslint-enable prefer-const */
console.log("[Best Practice] ergebnisSpaeterGesetzt:", ergebnisSpaeterGesetzt);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Faustregel: Bei Variablen mit direktem Anfangswert die Type Inference
// arbeiten lassen (kein unnoetiges Rauschen im Code). Bei Funktionssignaturen
// (Parameter UND Rueckgabewert) IMMER explizit typisieren - das ist die
// "Vertrags-Grenze" deines Codes und sollte fuer andere Entwickler (und dein
// zukuenftiges Ich) sofort lesbar sein, ohne die Funktion analysieren zu muessen.
