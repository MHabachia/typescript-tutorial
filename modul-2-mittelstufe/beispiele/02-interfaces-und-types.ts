/**
 * MODUL 2.2 / 2.3 - Objekttypen: interface vs. type, optional, readonly,
 *                   Index-Signaturen und "as const"
 * ============================================================================
 * Ein Objekttyp ist der Bauplan fuer ein Objekt: Er sagt, welche Felder es
 * gibt und welchen Typ jedes Feld hat.
 *
 * Zwei Schreibweisen fuehren zum Ziel:
 *   interface Benutzer { name: string }
 *   type Benutzer = { name: string }
 *
 * Faustregel:
 *   - `interface` fuer Objektformen, die andere erweitern koennen sollen
 *     (extends, declaration merging)
 *   - `type` fuer alles andere: Unions, Tuples, Funktionstypen, Aliase
 *
 * Feldmodifizierer:
 *   name?: string   - optional (darf fehlen)
 *   readonly id: number - darf nach der Erzeugung nicht mehr geaendert werden
 *   [schluessel: string]: number - Index-Signatur fuer beliebige Schluessel
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: Objekte ohne Bauplan
// -----------------------------------------------------------------------
// Ohne Typ ist jedes Feld erlaubt - auch ein Tippfehler im Feldnamen.
// "any" muss hier explizit stehen, weil "noImplicitAny" aktiv ist.
const benutzerFalsch: any = {
  name: "Ada Lovelace",
  emial: "ada@example.com", // Tippfehler: emial statt email
};

// Der Zugriff auf das RICHTIG geschriebene Feld liefert stillschweigend
// undefined. Der Compiler sagt kein Wort.
console.log("[Anti-Pattern] E-Mail:", benutzerFalsch.email); // undefined
console.log("[Anti-Pattern] Name:", benutzerFalsch.name);

// Auch das hier ist erlaubt und zerstoert die Daten unbemerkt:
benutzerFalsch.id = "keine Zahl";
console.log("[Anti-Pattern] id ist jetzt:", benutzerFalsch.id);

// -----------------------------------------------------------------------
// BEST PRACTICE: interface als Bauplan
// -----------------------------------------------------------------------

interface Benutzer {
  readonly id: number; // nach dem Anlegen unveraenderlich
  name: string;
  email: string;
  telefon?: string; // optional
}

const ada: Benutzer = {
  id: 1,
  name: "Ada Lovelace",
  email: "ada@example.com",
};

// ada.id = 2;             // Fehler: Cannot assign to 'id' (read-only property)
// const x: Benutzer = {}; // Fehler: name, email und id fehlen
// telefon: undefined      // Fehler wegen exactOptionalPropertyTypes!
//   Bei "exactOptionalPropertyTypes" bedeutet "telefon?: string" wirklich
//   "entweder ein string ODER gar nicht da" - NICHT "darf undefined sein".
//   Willst du undefined ausdruecklich erlauben: telefon?: string | undefined

console.log("[Best Practice] Benutzer:", ada.name, "-", ada.email);
console.log("[Best Practice] Telefon:", ada.telefon ?? "nicht hinterlegt");

// -----------------------------------------------------------------------
// BEST PRACTICE: interface erweitern (extends) und mergen
// -----------------------------------------------------------------------

interface Administrator extends Benutzer {
  berechtigungen: readonly string[];
}

const grace: Administrator = {
  id: 2,
  name: "Grace Hopper",
  email: "grace@example.com",
  telefon: "+49 30 123456",
  berechtigungen: ["lesen", "schreiben", "loeschen"],
};

console.log(
  "[Best Practice] Admin:",
  grace.name,
  "| Rechte:",
  grace.berechtigungen.join(", ")
);

// Declaration Merging: zwei gleichnamige interfaces verschmelzen zu einem.
// Das kann NUR interface - fuer type gaebe es hier einen Fehler
// ("Duplicate identifier"). In der Praxis nutzt man das, um fremde Typen
// aus Bibliotheken um eigene Felder zu ergaenzen.
interface Konfiguration {
  host: string;
}
interface Konfiguration {
  port: number;
}

const konfig: Konfiguration = { host: "localhost", port: 3000 };
console.log("[Best Practice] Konfiguration:", `${konfig.host}:${konfig.port}`);

// -----------------------------------------------------------------------
// BEST PRACTICE: type kann mehr als Objekte
// -----------------------------------------------------------------------

// 1) Union - das kann interface nicht
type Status = "offen" | "in-arbeit" | "erledigt";

// 2) Objekttyp mit Alias
type Aufgabe = {
  titel: string;
  status: Status;
};

// 3) Intersection: zwei Typen zusammensetzen
type MitZeitstempel = { erstelltAm: string };
type AufgabeMitZeit = Aufgabe & MitZeitstempel;

// 4) Funktionstyp
type Formatierer = (aufgabe: AufgabeMitZeit) => string;

const formatiere: Formatierer = (aufgabe) =>
  `${aufgabe.titel} [${aufgabe.status}] seit ${aufgabe.erstelltAm}`;

const aufgabe: AufgabeMitZeit = {
  titel: "Modul 2 lesen",
  status: "in-arbeit",
  erstelltAm: "2024-01-15",
};

console.log("[Best Practice] Aufgabe:", formatiere(aufgabe));

// -----------------------------------------------------------------------
// BEST PRACTICE: Index-Signaturen
// -----------------------------------------------------------------------
// Wenn die Schluessel erst zur Laufzeit feststehen (z.B. Uebersetzungen),
// beschreibt eine Index-Signatur "beliebiger Schluessel -> fester Werttyp".

interface Woerterbuch {
  [schluessel: string]: string;
}

const uebersetzungen: Woerterbuch = {
  hallo: "hello",
  tschuess: "bye",
};

// ACHTUNG "noPropertyAccessFromIndexSignature": Auf Felder, die nur ueber
// die Index-Signatur existieren, greift man mit Klammern zu - NICHT mit
// Punkt. Das macht im Code sichtbar: "dieser Schluessel ist nicht garantiert".
//   uebersetzungen.hallo   // Fehler
const hallo = uebersetzungen["hallo"];

// Und wegen "noUncheckedIndexedAccess" ist der Typ hier "string | undefined":
console.log("[Best Practice] hallo ->", hallo ?? "(unbekannt)");
console.log(
  "[Best Practice] guten tag ->",
  uebersetzungen["guten tag"] ?? "(unbekannt)"
);

// Oft praeziser als eine offene Index-Signatur: Record mit festen Schluesseln.
// Hier sind ALLE Schluessel bekannt, also meldet der Compiler fehlende Faelle.
const statusTexte: Record<Status, string> = {
  offen: "Noch nichts passiert",
  "in-arbeit": "Laeuft gerade",
  erledigt: "Fertig",
};
console.log("[Best Practice] Statustext:", statusTexte[aufgabe.status]);

// -----------------------------------------------------------------------
// BEST PRACTICE: as const
// -----------------------------------------------------------------------
// "as const" friert ein Objekt oder Array ein: alle Felder werden readonly
// und bekommen ihren engsten moeglichen Literal-Typ.

const einstellungen = {
  sprache: "de",
  maxVersuche: 3,
} as const;
// Typ: { readonly sprache: "de"; readonly maxVersuche: 3 }
// einstellungen.sprache = "en"; // Fehler: read-only

const farben = ["rot", "gelb", "gruen"] as const;
// Typ: readonly ["rot", "gelb", "gruen"]

// Aus so einem Array laesst sich direkt ein Union-Typ ableiten:
type Farbe = (typeof farben)[number]; // "rot" | "gelb" | "gruen"
const lieblingsfarbe: Farbe = "gruen";

console.log("[Best Practice] Einstellungen:", einstellungen.sprache, einstellungen.maxVersuche);
console.log("[Best Practice] Farben:", farben.join(", "), "| gewaehlt:", lieblingsfarbe);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Entscheidungshilfe in einem Satz: Beschreibst du die FORM eines Objekts,
// das andere erweitern koennten - nimm `interface`. Brauchst du eine Union,
// ein Tuple, einen Funktionstyp oder eine Kombination aus mehreren Typen -
// nimm `type`. Wichtiger als die Wahl ist die Konsistenz im Team.
//
// Zweiter Tipp: Eine offene Index-Signatur (`[k: string]: T`) ist bequem,
// aber sie schaltet die Tippfehler-Pruefung fuer Feldnamen ab. Wo die
// Schluessel bekannt sind, ist `Record<"a" | "b", T>` fast immer besser.
