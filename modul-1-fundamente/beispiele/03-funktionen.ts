/**
 * MODUL 1.3 - Funktionen
 * ============================================================================
 * Funktionen sind in TypeScript genauso typisierbar wie Variablen: Jeder
 * Parameter bekommt einen Typ, und der Rueckgabewert kann (und sollte)
 * ebenfalls typisiert werden. Zusaetzlich gibt es optionale Parameter (`?`),
 * Default-Werte und Rest-Parameter (`...`).
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: Untypisierte Funktionen (klassisches JavaScript)
// -----------------------------------------------------------------------
// Hinweis: Wegen der strikten tsconfig.json (noImplicitAny) muesste TypeScript
// hier sonst einen Fehler werfen - "any" wird deshalb bewusst und explizit
// gesetzt, um trotzdem zu zeigen, wie sich JavaScript ohne Typen verhaelt.
function berechnePreisFalsch(preis: any, rabattProzent: any) {
  // Kein Typ bekannt: was, wenn "rabattProzent" versehentlich ein String ist?
  return preis - (preis * rabattProzent) / 100;
}

console.log(
  "[Anti-Pattern] berechnePreisFalsch(100, 10) =",
  berechnePreisFalsch(100, 10)
);
// berechnePreisFalsch(100, "zehn") wuerde zur Laufzeit "NaN" liefern und
// wuerde von TypeScript ohne Typen (bzw. mit "any") nicht verhindert.

// -----------------------------------------------------------------------
// BEST PRACTICE: Vollstaendig typisierte Funktionen
// -----------------------------------------------------------------------

// Normale Funktion mit typisierten Parametern und Rueckgabetyp:
function berechnePreis(preis: number, rabattProzent: number): number {
  return preis - (preis * rabattProzent) / 100;
}

// Optionaler Parameter (mit "?"): Waehrung ist nicht immer bekannt.
function formatierePreis(preis: number, waehrung?: string): string {
  return `${preis.toFixed(2)} ${waehrung ?? "EUR"}`;
}

// Parameter mit Default-Wert: wird verwendet, wenn kein Argument uebergeben wird.
function begruesse(name: string, anrede: string = "Hallo"): string {
  return `${anrede}, ${name}!`;
}

// Rest-Parameter: beliebig viele Zahlen typsicher entgegennehmen.
function summiere(...zahlen: number[]): number {
  return zahlen.reduce((summe, aktuelleZahl) => summe + aktuelleZahl, 0);
}

// Arrow Function mit explizitem Rueckgabetyp (typischer Stil bei Callbacks):
const istGerade = (zahl: number): boolean => zahl % 2 === 0;

// Funktion, die absichtlich nichts zurueckgibt: Rueckgabetyp "void"
function protokolliere(nachricht: string): void {
  console.log("[LOG]", nachricht);
}

const reduzierterPreis = berechnePreis(100, 15);
console.log("[Best Practice] reduzierterPreis:", reduzierterPreis);
console.log("[Best Practice] formatierePreis:", formatierePreis(9.9), formatierePreis(9.9, "USD"));
console.log("[Best Practice] begruesse:", begruesse("Ada"), "|", begruesse("Ada", "Servus"));
console.log("[Best Practice] summiere(1,2,3,4):", summiere(1, 2, 3, 4));
console.log("[Best Practice] istGerade(4):", istGerade(4), "| istGerade(7):", istGerade(7));
protokolliere("Funktionen-Modul erfolgreich ausgefuehrt.");

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Optionale Parameter (`param?: T`) muessen in der Parameterliste IMMER
// nach den Pflichtparametern stehen. Nutze `??` (Nullish Coalescing) statt
// `||`, um Default-Werte zu setzen - `||` wuerde auch bei `0` oder `""`
// faelschlicherweise den Default-Wert einsetzen, `??` nur bei `null`/`undefined`.
