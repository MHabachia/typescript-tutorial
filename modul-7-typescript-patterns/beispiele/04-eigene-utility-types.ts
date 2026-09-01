/**
 * MODUL 7.4 - Eigene Utility Types (Mapped & Conditional Types)
 * ============================================================================
 * Die eingebauten Utility Types (Partial, Pick, Omit, ...) sind nicht magisch -
 * sie sind selbst in TypeScript geschrieben, mit zwei Bausteinen:
 *
 *   Mapped Type:      { [K in keyof T]: ... }   "gehe alle Schluessel durch"
 *   Conditional Type: A extends B ? X : Y       "wenn ..., dann ..., sonst ..."
 *
 * Wer diese beiden Bausteine versteht, kann sich jeden Typ bauen, den ein
 * Projekt braucht - statt ihn von Hand zu pflegen.
 */

interface Benutzer {
  id: string;
  name: string;
  email: string;
  alter: number;
  aktiv: boolean;
}

// -----------------------------------------------------------------------
// ANTI-PATTERN: Abgeleitete Typen von Hand pflegen
// -----------------------------------------------------------------------
// Fuer ein Formular sollen alle Felder Strings sein (so kommen sie aus dem
// HTML). Von Hand abgetippt heisst: bei jeder Aenderung an "Benutzer" muss
// man daran denken, auch hier nachzuziehen. Genau das vergisst man.
interface BenutzerFormularFalsch {
  id: string;
  name: string;
  email: string;
  alter: string; // hier von Hand auf string geaendert
  aktiv: string; // und hier auch
  // ... und wenn "Benutzer" morgen ein Feld bekommt? Dann fehlt es hier.
}

const formularFalsch: BenutzerFormularFalsch = {
  id: "1",
  name: "Ada",
  email: "ada@example.com",
  alter: "36",
  aktiv: "true",
};
console.log("[Anti-Pattern] handgepflegter Formulartyp:", formularFalsch);

// -----------------------------------------------------------------------
// BEST PRACTICE 1: Mapped Type - alle Felder umwandeln
// -----------------------------------------------------------------------
// "Gehe jeden Schluessel K von T durch und gib ihm den Typ string."
type AlsFormular<T> = {
  [K in keyof T]: string;
};

type BenutzerFormular = AlsFormular<Benutzer>;

const formular: BenutzerFormular = {
  id: "1",
  name: "Ada",
  email: "ada@example.com",
  alter: "36",
  aktiv: "true",
};
console.log("[Best Practice] abgeleiteter Formulartyp:", formular);
// Kommt "Benutzer" ein Feld hinzu, verlangt BenutzerFormular es automatisch.

// -----------------------------------------------------------------------
// BEST PRACTICE 2: Modifikatoren hinzufuegen und entfernen
// -----------------------------------------------------------------------
// So ist Partial<T> tatsaechlich definiert - das "?" macht optional:
type MeinPartial<T> = {
  [K in keyof T]?: T[K];
};

// Mit "-?" nimmt man das Fragezeichen wieder weg (= Required<T>):
type MeinRequired<T> = {
  [K in keyof T]-?: T[K];
};

// Und "readonly" bzw. "-readonly" funktioniert genauso:
type MeinReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

const teilweise: MeinPartial<Benutzer> = { name: "Grace" };
const vollstaendig: MeinRequired<MeinPartial<Benutzer>> = {
  id: "2",
  name: "Grace",
  email: "grace@example.com",
  alter: 45,
  aktiv: true,
};
const geschuetzt: MeinReadonly<Benutzer> = vollstaendig;
// geschuetzt.name = "anders"; // Fehler: Cannot assign to 'name'

console.log("[Best Practice] MeinPartial:", teilweise);
console.log("[Best Practice] MeinRequired:", vollstaendig.name, vollstaendig.alter);
console.log("[Best Practice] MeinReadonly:", geschuetzt.email);

// -----------------------------------------------------------------------
// BEST PRACTICE 3: Conditional Types - Typen mit Fallunterscheidung
// -----------------------------------------------------------------------
// "Wenn T ein Array ist, gib den Elementtyp zurueck, sonst T selbst."
// "infer E" heisst: "merk dir den Typ an dieser Stelle unter dem Namen E".
type ElementVon<T> = T extends readonly (infer E)[] ? E : T;

type Zahl = ElementVon<number[]>;      // number
type Text = ElementVon<string>;        // string (kein Array -> T selbst)

const eineZahl: Zahl = 42;
const einText: Text = "kein Array";
console.log("[Best Practice] ElementVon<number[]>:", eineZahl);
console.log("[Best Practice] ElementVon<string>:", einText);

// -----------------------------------------------------------------------
// BEST PRACTICE 4: Schluessel nach Typ filtern (kombiniert)
// -----------------------------------------------------------------------
// Ziel: nur die Schluessel von T, deren Wert vom Typ W ist.
// Trick: Der Mapped Type liefert pro Schluessel entweder den Namen oder
// "never" - und "never" verschwindet aus einer Union von selbst.
type SchluesselMitTyp<T, W> = {
  [K in keyof T]: T[K] extends W ? K : never;
}[keyof T];

type TextFelder = SchluesselMitTyp<Benutzer, string>; // "id" | "name" | "email"

// Damit laesst sich z.B. eine Suche bauen, die nur ueber Textfelder geht:
function sucheInTextfeldern(
  benutzer: Benutzer,
  feld: TextFelder,
  suchbegriff: string
): boolean {
  return benutzer[feld].toLowerCase().includes(suchbegriff.toLowerCase());
}

console.log(
  "[Best Practice] Suche in 'name':",
  sucheInTextfeldern(vollstaendig, "name", "gra")
);
// sucheInTextfeldern(vollstaendig, "alter", "4");
//   -> Fehler: '"alter"' is not assignable to '"id" | "name" | "email"'.

// -----------------------------------------------------------------------
// BEST PRACTICE 5: Template Literal Types
// -----------------------------------------------------------------------
// Aus Schluesselnamen lassen sich sogar neue Namen erzeugen - so entstehen
// z.B. typsichere Event-Namen oder Getter-Namen.
type EventName<T> = `${string & keyof T}:geaendert`;

type BenutzerEvent = EventName<Benutzer>;
// "id:geaendert" | "name:geaendert" | "email:geaendert" | "alter:geaendert" | "aktiv:geaendert"

function meldeAenderung(event: BenutzerEvent): string {
  return `Event ausgeloest: ${event}`;
}

console.log("[Best Practice]", meldeAenderung("email:geaendert"));
// meldeAenderung("adresse:geaendert"); // Fehler - dieses Feld gibt es nicht

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Mapped und Conditional Types sind maechtig - und genau deshalb leicht zu
// uebertreiben. Faustregel: Ein eigener Utility Type lohnt sich, wenn du
// dieselbe Typ-Umwandlung zum dritten Mal von Hand schreibst. Bleibt er
// nach zwei Minuten Lesen unverstaendlich, ist er zu clever: dann lieber
// zwei einfache Typen, die jeder im Team sofort versteht. Und wenn du in
// IntelliJ IDEA wissen willst, was ein solcher Typ konkret ergibt, fahre
// mit der Maus ueber den Typnamen - die Quick-Info loest ihn auf.
