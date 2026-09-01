/**
 * MODUL 1.1 - Variablen und Grundtypen
 * ============================================================================
 * TypeScript ist eine "typisierte Obermenge" von JavaScript. Jede Variable
 * bekommt (explizit oder implizit) einen festen Typ. Der Compiler prueft
 * bei JEDER Nutzung, ob dieser Typ eingehalten wird - VOR der Ausfuehrung.
 *
 * Grundtypen: string, number, boolean, null, undefined, bigint, symbol.
 * Fuer Variablen gilt: bevorzugt `const` verwenden, `let` nur wenn sich der
 * Wert wirklich aendert. `var` wird in modernem TypeScript NICHT mehr
 * verwendet (Scoping-Probleme).
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: So macht man es in JavaScript / mit "any" FALSCH
// -----------------------------------------------------------------------
// In purem JavaScript (oder mit TypeScript + "any") gibt es keinerlei
// Kontrolle darueber, was in eine Variable hineingelegt wird:

let benutzerAlterFalsch: any = 32;
benutzerAlterFalsch = "zweiunddreissig"; // any erlaubt JEDEN Typ, jederzeit
benutzerAlterFalsch = true; // der Compiler sagt hier: alles ok (ist es aber nicht!)

console.log(
  "[Anti-Pattern] benutzerAlterFalsch ist jetzt vom Typ 'any' und aktuell:",
  benutzerAlterFalsch
);

// Das Problem: Wenn spaeter im Code z.B. `benutzerAlterFalsch + 1` gerechnet
// wird, kracht es erst zur LAUFZEIT - und nicht schon beim Schreiben des Codes.

// -----------------------------------------------------------------------
// BEST PRACTICE: Explizite und inferierte Typen in TypeScript
// -----------------------------------------------------------------------

const vorname: string = "Ada";
const nachname: string = "Lovelace";
const alter: number = 32;
const istAktiv: boolean = true;
const zwischenspeicher: null = null;
const nochNichtGesetzt: undefined = undefined;
const sehrGrosseZahl: bigint = 9_007_199_254_740_993n;

console.log("[Best Practice] Name:", vorname, nachname);
console.log("[Best Practice] Alter:", alter, "| Aktiv:", istAktiv);
console.log(
  "[Best Practice] Platzhalterwerte:",
  zwischenspeicher,
  nochNichtGesetzt,
  sehrGrosseZahl
);

// Versucht man jetzt, wie oben, einen falschen Typ zuzuweisen, meldet der
// TypeScript-Compiler SOFORT einen Fehler (deshalb hier auskommentiert -
// bei Bedarf einkommentieren und den Compiler-Fehler in IntelliJ beobachten):
//
// let sichereZahl: number = 42;
// sichereZahl = "42"; // Fehler: Type 'string' is not assignable to type 'number'.

// `const` signalisiert zusaetzlich: dieser Wert wird sich NIE aendern.
// Das ist nicht nur guter Stil, sondern hilft auch dem Compiler und
// spaeteren Lesern des Codes, den Code schneller zu verstehen.

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Verwende "any" nur als allerletzten Ausweg (z.B. bei sehr alten,
// untypisierten JavaScript-Bibliotheken). Ein guter Zwischenschritt ist
// `unknown`: Es akzeptiert wie "any" jeden Wert, zwingt dich aber dazu,
// den Typ erst zu pruefen (z.B. mit `typeof`), bevor du den Wert benutzt.
// So bleibt dein Code typsicher UND flexibel.
