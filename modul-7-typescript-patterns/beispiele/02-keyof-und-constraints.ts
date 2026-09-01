/**
 * MODUL 7.2 - keyof, Generic Constraints & Lookup Types
 * ============================================================================
 * Generics allein sind oft zu weit gefasst: "<T> passt auf alles" heisst auch
 * "<T> weiss nichts". Mit Constraints (`extends`) grenzt du ein, was T sein
 * darf - und mit `keyof` beziehst du dich typsicher auf die Schluessel eines
 * Objekttyps. Zusammen ergibt das eines der maechtigsten Werkzeuge in
 * TypeScript: Funktionen, die Objekte generisch lesen und schreiben, ohne
 * jemals die Typsicherheit zu verlieren.
 *
 *   keyof T          - Union aller Schluesselnamen von T
 *   T[K]             - der Typ, der hinter dem Schluessel K liegt (Lookup)
 *   K extends keyof T - "K muss ein echter Schluessel von T sein"
 */

interface Produkt {
  id: string;
  bezeichnung: string;
  preis: number;
  aufLager: boolean;
}

const laptop: Produkt = {
  id: "p-1",
  bezeichnung: "Laptop",
  preis: 1299.99,
  aufLager: true,
};

// -----------------------------------------------------------------------
// ANTI-PATTERN: Eine Getter-Funktion mit "any" und freiem string
// -----------------------------------------------------------------------
// Wegen der strikten tsconfig (noImplicitAny) muessen wir "any" hier
// explizit hinschreiben - genau das ist der Punkt: der Code sieht harmlos
// aus, gibt aber jede Kontrolle auf.
function holeWertFalsch(objekt: any, schluessel: string): any {
  return objekt[schluessel];
}

console.log("[Anti-Pattern] preis:", holeWertFalsch(laptop, "preis"));
// Tippfehler? Kein Problem fuer den Compiler - er meldet nichts:
console.log("[Anti-Pattern] Tippfehler 'preiss':", holeWertFalsch(laptop, "preiss"));
// Und der Rueckgabetyp ist immer "any", also auch das hier bleibt unbemerkt:
const unsinn: boolean = holeWertFalsch(laptop, "preis"); // eine Zahl als boolean
console.log("[Anti-Pattern] Zahl als boolean deklariert:", unsinn);

// -----------------------------------------------------------------------
// BEST PRACTICE: keyof + Lookup Type
// -----------------------------------------------------------------------
// K ist auf die tatsaechlichen Schluessel von T eingeschraenkt, und der
// Rueckgabetyp T[K] ist exakt der Typ des jeweiligen Feldes.
function holeWert<T, K extends keyof T>(objekt: T, schluessel: K): T[K] {
  return objekt[schluessel];
}

const preis = holeWert(laptop, "preis");           // Typ: number
const bezeichnung = holeWert(laptop, "bezeichnung"); // Typ: string

console.log("[Best Practice] preis:", preis.toFixed(2)); // .toFixed gibt es nur auf number
console.log("[Best Practice] bezeichnung:", bezeichnung.toUpperCase());

// Ein Tippfehler ist jetzt ein Compilerfehler:
//   holeWert(laptop, "preiss");
//   -> Argument of type '"preiss"' is not assignable to parameter of type
//      'keyof Produkt'.

// -----------------------------------------------------------------------
// BEST PRACTICE: Setter mit passendem Werttyp
// -----------------------------------------------------------------------
// Auch beim Schreiben passt der Werttyp automatisch zum Schluessel.
function setzeWert<T, K extends keyof T>(objekt: T, schluessel: K, wert: T[K]): T {
  return { ...objekt, [schluessel]: wert };
}

const reduziert = setzeWert(laptop, "preis", 999.0);
console.log("[Best Practice] reduzierter Preis:", reduziert.preis);

// setzeWert(laptop, "preis", "billig");
//   -> Argument of type 'string' is not assignable to parameter of type 'number'.

// -----------------------------------------------------------------------
// BEST PRACTICE: Constraints fuer sinnvolle Einschraenkungen
// -----------------------------------------------------------------------

// "T muss ein Objekt mit einer id sein" - mehr verlangt die Funktion nicht.
interface MitId {
  id: string;
}

function findeById<T extends MitId>(liste: readonly T[], id: string): T | undefined {
  return liste.find((eintrag) => eintrag.id === id);
}

// "T muss eine Laenge haben" - funktioniert fuer Strings UND Arrays.
function istLeer<T extends { length: number }>(wert: T): boolean {
  return wert.length === 0;
}

const produkte: Produkt[] = [laptop, { ...laptop, id: "p-2", bezeichnung: "Maus", preis: 25 }];
console.log("[Best Practice] findeById('p-2'):", findeById(produkte, "p-2")?.bezeichnung);
console.log("[Best Practice] istLeer(''):", istLeer(""), "| istLeer([1]):", istLeer([1]));

// -----------------------------------------------------------------------
// BEST PRACTICE: Mehrere Schluessel auf einmal (pluecke)
// -----------------------------------------------------------------------
function pfluecke<T extends object, K extends keyof T>(objekt: T, schluessel: readonly K[]): Pick<T, K> {
  const ergebnis = {} as Pick<T, K>;
  for (const key of schluessel) {
    ergebnis[key] = objekt[key];
  }
  return ergebnis;
}

const kurzinfo = pfluecke(laptop, ["bezeichnung", "preis"]);
console.log("[Best Practice] pfluecke:", kurzinfo);
// kurzinfo hat exakt den Typ { bezeichnung: string; preis: number } -
// ein Zugriff auf kurzinfo.aufLager waere ein Compilerfehler.

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Faustregel fuer Generics: Beginne mit dem Constraint, nicht mit <T>.
// Frage dich zuerst "was muss der Typ koennen, damit meine Funktion
// funktioniert?" und schreibe genau das hinter `extends`. Ein zu weites
// <T> zwingt dich spaeter zu Casts, ein zu enges Constraint macht die
// Funktion unbrauchbar. `keyof` und `T[K]` sind dabei fast immer die
// Bausteine, die du suchst, wenn eine Funktion "irgendein Feld" eines
// Objekts lesen oder schreiben soll.
