/**
 * MODUL 6.5 - Branded Types / Nominal Typing
 * ============================================================================
 * TypeScript vergleicht Typen nach ihrer FORM (strukturell), nicht nach ihrem
 * NAMEN. "type BenutzerId = string" ist deshalb kein eigener Typ - es ist nur
 * ein zweiter Name fuer string. Jede Zeichenkette der Welt passt hinein.
 *
 * Ein Brand ist eine unsichtbare Markierung, die den Typ dennoch eindeutig
 * macht: string PLUS ein Merkmal, das nur deine Konstruktorfunktion vergeben
 * kann. Zur Laufzeit bleibt es ein ganz normaler string - das Merkmal
 * existiert nur im Typsystem.
 *
 * Sicherheitsrelevant ist das vor allem fuer "schon geprueft"-Werte: eine
 * SichereEmail ist eine Zeichenkette, die nachweislich durch die Pruefung
 * gelaufen ist. Der Compiler wird damit zum Waechter deiner Systemgrenze.
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: Typ-Aliase als vermeintlicher Schutz
// -----------------------------------------------------------------------
type BenutzerIdFalsch = string;
type TodoIdFalsch = string;

function loescheTodoFalsch(_besitzer: BenutzerIdFalsch, todo: TodoIdFalsch): string {
  return `geloescht: ${todo}`;
}

const benutzerFalsch: BenutzerIdFalsch = "b-42";
const todoFalsch: TodoIdFalsch = "t-7";

// Die Argumente sind vertauscht - und der Compiler sagt kein Wort, weil beide
// Typen fuer ihn identisch sind. Das Ergebnis: die falsche Ressource wird
// angefasst. Solche Verwechslungen sind eine echte Klasse von Sicherheits-
// luecken, nicht nur ein Schoenheitsfehler.
console.log(
  "[Anti-Pattern] vertauschte IDs:",
  loescheTodoFalsch(todoFalsch, benutzerFalsch),
  "<- kompiliert, obwohl es Unsinn ist"
);

// -----------------------------------------------------------------------
// BEST PRACTICE: Branded Types mit Konstruktorfunktion
// -----------------------------------------------------------------------
// Das Muster: Basistyp & { readonly __brand: "Name" }. Das Feld existiert nie
// wirklich - niemand kann es von Hand erzeugen, ausser ueber die Funktion,
// die du dafuer vorsiehst.
type BenutzerId = string & { readonly __brand: "BenutzerId" };
type TodoId = string & { readonly __brand: "TodoId" };

function alsBenutzerId(roh: string): BenutzerId {
  if (!/^b-\d+$/.test(roh)) {
    throw new Error("Ungueltige BenutzerId.");
  }
  // Die Assertion steht an EINER Stelle - genau hier, hinter der Pruefung.
  // Das ist der Deal: ein kontrolliertes "as" im Konstruktor kauft dir
  // Typsicherheit im gesamten restlichen Code.
  return roh as BenutzerId;
}

function alsTodoId(roh: string): TodoId {
  if (!/^t-\d+$/.test(roh)) {
    throw new Error("Ungueltige TodoId.");
  }
  return roh as TodoId;
}

function loescheTodo(besitzer: BenutzerId, todo: TodoId): string {
  return `Benutzer ${besitzer} loescht Todo ${todo}`;
}

const benutzerId = alsBenutzerId("b-42");
const todoId = alsTodoId("t-7");

console.log("[Best Practice] richtige Reihenfolge:", loescheTodo(benutzerId, todoId));
// loescheTodo(todoId, benutzerId);
//   Fehler: Type '"TodoId"' is not assignable to type '"BenutzerId"'.
//   Die Verwechslung von oben ist jetzt unmoeglich.

// Zur Laufzeit ist alles ganz normaler Text:
console.log("[Best Practice] zur Laufzeit nur ein string:", typeof benutzerId);

// -----------------------------------------------------------------------
// BEST PRACTICE: Brands fuer "bereits geprueft"-Werte
// -----------------------------------------------------------------------
// Noch nuetzlicher als IDs: Werte, die eine Pruefung bestanden haben. Der Typ
// transportiert das Wissen "wurde validiert" durch das ganze Programm.
type SichereEmail = string & { readonly __brand: "SichereEmail" };

function alsSichereEmail(roh: string): SichereEmail | undefined {
  const getrimmt = roh.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getrimmt) || getrimmt.length > 254) {
    return undefined;
  }
  return getrimmt as SichereEmail;
}

// Diese Funktion kann gar nicht mehr mit ungeprueftem Text aufgerufen werden.
// Du musst nicht darauf vertrauen, dass der Aufrufer geprueft hat - der
// Compiler weiss es.
function versendeWillkommensmail(empfaenger: SichereEmail): string {
  return `Mail an ${empfaenger} in die Warteschlange gelegt`;
}

const geprueft = alsSichereEmail("  Ada@Example.ORG ");
const ungeprueft = alsSichereEmail("kein-at-zeichen");

console.log(
  "[Best Practice] geprueft:",
  geprueft === undefined ? "abgelehnt" : versendeWillkommensmail(geprueft)
);
console.log(
  "[Best Practice] ungeprueft:",
  ungeprueft === undefined ? "abgelehnt" : versendeWillkommensmail(ungeprueft)
);
// versendeWillkommensmail("beliebiger text");
//   Fehler: Property '__brand' is missing in type 'string'.

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Halte die Konstruktorfunktion und den Brand-Typ in EINER Datei und
// exportiere nur die Funktion, nicht den Weg am Konstruktor vorbei. Sonst
// schreibt irgendwann jemand "wert as BenutzerId" quer durchs Projekt und die
// Garantie ist wieder weg - der Brand ist nur so stark wie die Disziplin, ihn
// ausschliesslich hinter der Pruefung zu vergeben. Fuer groessere Projekte
// gibt es dafuer auch fertige Loesungen: Zod kann per ".brand()" direkt
// gebrandete Typen aus einem Schema erzeugen, sodass Pruefung und Brand
// zwangslaeufig zusammengehoeren.
