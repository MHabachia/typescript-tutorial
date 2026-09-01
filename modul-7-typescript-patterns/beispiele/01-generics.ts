/**
 * MODUL 7.1 - Generics
 * ============================================================================
 * Generics erlauben es, Funktionen, Klassen und Interfaces zu schreiben, die
 * mit VERSCHIEDENEN Typen funktionieren, OHNE die Typsicherheit zu verlieren.
 * Man kann sich Generics als "Platzhalter-Typen" vorstellen, die erst bei der
 * Verwendung mit einem konkreten Typ gefuellt werden (typischerweise <T>).
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: "any" verwenden, um mit mehreren Typen zu arbeiten
// -----------------------------------------------------------------------
function ersteElementFalsch(liste: any[]): any {
  return liste[0];
}

const ersteZahlFalsch = ersteElementFalsch([1, 2, 3]);
const ersterNameFalsch = ersteElementFalsch(["Ada", "Grace"]);

// Das Problem: Der Rueckgabetyp ist IMMER "any" - man verliert komplett die
// Information, dass aus einer Zahlen-Liste auch eine Zahl herauskommt.
console.log("[Anti-Pattern] ersteZahlFalsch:", ersteZahlFalsch, typeof ersteZahlFalsch);
console.log("[Anti-Pattern] ersterNameFalsch:", ersterNameFalsch, typeof ersterNameFalsch);

// -----------------------------------------------------------------------
// BEST PRACTICE: Generische Funktionen
// -----------------------------------------------------------------------

// <T> ist ein Platzhalter: TypeScript ersetzt T automatisch durch den
// tatsaechlich uebergebenen Typ und behaelt die Typsicherheit bei.
function ersteElement<T>(liste: T[]): T | undefined {
  return liste[0];
}

const ersteZahl = ersteElement([1, 2, 3]); // T wird zu "number"
const ersterName = ersteElement(["Ada", "Grace"]); // T wird zu "string"

console.log("[Best Practice] ersteZahl:", ersteZahl, "| ersterName:", ersterName);

// Generics mit Constraint (Einschraenkung): T MUSS mindestens ein "id"-Feld
// besitzen. So bleibt die Funktion flexibel, aber nicht grenzenlos.
interface MitId {
  id: string;
}

function zeigeId<T extends MitId>(objekt: T): string {
  return `Objekt mit ID: ${objekt.id}`;
}

console.log("[Best Practice]", zeigeId({ id: "abc-123", name: "Beispiel" }));

// -----------------------------------------------------------------------
// BEST PRACTICE: Generische Klasse - ein typsicherer Stack
// -----------------------------------------------------------------------
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

const zahlenStack = new Stack<number>();
zahlenStack.push(1);
zahlenStack.push(2);
zahlenStack.push(3);
console.log("[Best Practice] Stack-Groesse:", zahlenStack.anzahl, "| pop():", zahlenStack.pop());

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Generics sind ueberall dort sinnvoll, wo eine Funktion oder Klasse mit
// MEHREREN Typen funktionieren soll, OHNE dass du fuer jeden Typ eine eigene
// Kopie schreiben oder die Typsicherheit mit "any" aufgeben musst. Die
// Klasse `Store<T>` im Abschlussprojekt (Modul 9) ist ein direktes,
// praktisches Beispiel fuer generische Klassen in echtem Code.
