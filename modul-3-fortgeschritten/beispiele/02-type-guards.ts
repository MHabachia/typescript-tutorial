/**
 * MODUL 3.4 - Type Guards & Narrowing
 * ============================================================================
 * "Narrowing" heisst: TypeScript verengt einen weiten Typ (z. B. eine Union
 * oder "unknown") an einer bestimmten Codestelle auf einen engeren Typ - weil
 * du vorher etwas geprueft hast.
 *
 * Die eingebauten Pruefungen:
 *   typeof x === "string"     - fuer primitive Typen
 *   x instanceof Klasse       - fuer Klassen und eingebaute Objekte
 *   "feld" in objekt          - fuer Objektformen
 *   if (x)                    - Truthiness (Vorsicht bei 0 und "")
 *   x === "wert"              - Gleichheits-Narrowing
 *
 * Und deine eigenen:
 *   function istX(w: unknown): w is X          - Type Predicate
 *   function pruefeX(w: unknown): asserts w is X - Assertion Function
 */

type Benutzer = { name: string; email: string };

// -----------------------------------------------------------------------
// ANTI-PATTERN: mit "as" behaupten statt pruefen
// -----------------------------------------------------------------------
// "as" ist keine Pruefung, sondern eine Behauptung: Du sagst dem Compiler,
// er solle dir glauben. Zur Laufzeit passiert dabei genau nichts.
function begruesseFalsch(eingabe: unknown): string {
  const benutzer = eingabe as Benutzer; // reines Wunschdenken
  return `Hallo ${benutzer.name}`;
}

console.log(
  "[Anti-Pattern] echte Daten:",
  begruesseFalsch({ name: "Ada", email: "ada@example.org" })
);
console.log(
  "[Anti-Pattern] Muelldaten:",
  begruesseFalsch({ nummer: 7 }) // "Hallo undefined" - niemand hat gewarnt
);

// -----------------------------------------------------------------------
// BEST PRACTICE: typeof - fuer primitive Typen
// -----------------------------------------------------------------------
function laengeVon(wert: string | number | boolean): number {
  if (typeof wert === "string") {
    return wert.length; // wert: string
  }
  if (typeof wert === "number") {
    return wert.toFixed(2).length; // wert: number
  }
  return wert ? 4 : 5; // wert: boolean ("true" / "false")
}

console.log("[Best Practice] typeof:", laengeVon("Hallo"), laengeVon(3.14159), laengeVon(true));

// -----------------------------------------------------------------------
// BEST PRACTICE: instanceof - fuer Klassen
// -----------------------------------------------------------------------
class Rechnung {
  public constructor(public readonly betrag: number) {}
}

function beschreibeVorgang(vorgang: Error | Rechnung | Date): string {
  if (vorgang instanceof Error) {
    return `Fehler: ${vorgang.message}`;
  }
  if (vorgang instanceof Rechnung) {
    return `Rechnung ueber ${vorgang.betrag.toFixed(2)} EUR`;
  }
  return `Datum: ${vorgang.toISOString().slice(0, 10)}`;
}

console.log("[Best Practice] instanceof:", beschreibeVorgang(new Error("Kaputt")));
console.log("[Best Practice] instanceof:", beschreibeVorgang(new Rechnung(19.99)));
console.log("[Best Practice] instanceof:", beschreibeVorgang(new Date("2024-05-01T00:00:00Z")));

// -----------------------------------------------------------------------
// BEST PRACTICE: "in" - fuer Objekte ohne gemeinsame Klasse
// -----------------------------------------------------------------------
type Hund = { name: string; bellen: () => string };
type Katze = { name: string; schnurren: () => string };

function gibLaut(tier: Hund | Katze): string {
  if ("bellen" in tier) {
    return tier.bellen(); // tier: Hund
  }
  return tier.schnurren(); // tier: Katze
}

const bello: Hund = { name: "Bello", bellen: () => "Wuff!" };
const mimi: Katze = { name: "Mimi", schnurren: () => "Schnurr..." };
console.log("[Best Practice] in:", bello.name, gibLaut(bello), "/", mimi.name, gibLaut(mimi));

// -----------------------------------------------------------------------
// BEST PRACTICE: Truthiness & Gleichheits-Narrowing
// -----------------------------------------------------------------------
function zeigeNamen(namen: string[] | null | undefined): string {
  // Ein einziger Truthiness-Test erledigt null UND undefined.
  if (!namen || namen.length === 0) {
    return "(keine Namen)";
  }
  return namen.join(", "); // namen: string[]
}

console.log("[Best Practice] Truthiness:", zeigeNamen(["Ada", "Grace"]));
console.log("[Best Practice] Truthiness:", zeigeNamen(null));

// Gleichheits-Narrowing: aus "a === b" folgert TypeScript, welche Typen in
// beiden Unions ueberhaupt gleich sein KOENNEN - hier nur "string".
function vergleiche(a: string | number, b: string | boolean): string {
  if (a === b) {
    return `beide sind der Text "${a.toUpperCase()}"`; // a und b: string
  }
  return "unterschiedlich";
}

console.log("[Best Practice] Gleichheit:", vergleiche("ada", "ada"));
console.log("[Best Practice] Gleichheit:", vergleiche(42, true));

// -----------------------------------------------------------------------
// BEST PRACTICE: eigener Type Guard ("wert is Typ")
// -----------------------------------------------------------------------
// Der Rueckgabetyp "wert is Benutzer" sagt: "Wenn ich true liefere, dann ist
// der uebergebene Wert ein Benutzer." Das Narrowing wirkt danach ausserhalb.
function istBenutzer(wert: unknown): wert is Benutzer {
  if (typeof wert !== "object" || wert === null) {
    return false;
  }
  const kandidat = wert as { name?: unknown; email?: unknown };
  return typeof kandidat.name === "string" && typeof kandidat.email === "string";
}

function begruesse(eingabe: unknown): string {
  if (!istBenutzer(eingabe)) {
    return "Hallo, unbekannter Gast";
  }
  return `Hallo ${eingabe.name} (${eingabe.email})`; // eingabe: Benutzer
}

console.log("[Best Practice] Type Guard:", begruesse({ name: "Ada", email: "ada@example.org" }));
console.log("[Best Practice] Type Guard:", begruesse({ nummer: 7 }));

// Type Guards wirken auch in Array-Methoden - "filter" verengt den Typ mit:
const rohliste: unknown[] = [
  { name: "Grace", email: "grace@example.org" },
  "kein Benutzer",
  { name: "Alan", email: "alan@example.org" },
];
const nurBenutzer: Benutzer[] = rohliste.filter(istBenutzer);
console.log(
  "[Best Practice] gefiltert:",
  nurBenutzer.map((b) => b.name).join(", ")
);

// -----------------------------------------------------------------------
// BEST PRACTICE: Assertion Function ("asserts wert is Typ")
// -----------------------------------------------------------------------
// Unterschied zum Type Guard: Sie liefert kein true/false, sondern wirft.
// Danach gilt der enge Typ fuer den Rest der Funktion - ohne if-Block.
function pruefeBenutzer(wert: unknown): asserts wert is Benutzer {
  if (!istBenutzer(wert)) {
    throw new Error("Kein gueltiger Benutzer");
  }
}

const rohdaten: unknown = JSON.parse('{"name":"Grace","email":"grace@example.org"}');
try {
  pruefeBenutzer(rohdaten);
  // Ab hier ist "rohdaten" fuer TypeScript ein Benutzer.
  console.log("[Best Practice] Assertion:", rohdaten.email);
} catch (fehler) {
  console.log("[Best Practice] Assertion fehlgeschlagen:", String(fehler));
}

const muell: unknown = { nummer: 7 };
try {
  pruefeBenutzer(muell);
  console.log("[Best Practice] Assertion:", muell.email);
} catch (fehler) {
  // "useUnknownInCatchVariables": "fehler" ist unknown und muss geprueft werden.
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  console.log("[Best Practice] Assertion fehlgeschlagen:", text);
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Ein Type Guard ist ein Versprechen, das der Compiler NICHT nachprueft: Im
// Rumpf darfst du auch Unsinn zurueckgeben ("return true;"), und TypeScript
// glaubt es dir. Ein schlampiger Type Guard ist damit genauso gefaehrlich wie
// ein "as" - nur besser getarnt.
//
// Zwei Konsequenzen fuer die Praxis:
//   1. Halte Type Guards kurz und pruefe wirklich JEDES Feld, das du zusagst.
//   2. Fuer echte Aussendaten (HTTP, Dateien, Formulare) nimm lieber eine
//      Validierungsbibliothek wie zod - die erzeugt Pruefung und Typ aus
//      derselben Quelle, sodass beide gar nicht erst auseinanderlaufen
//      koennen. Mehr dazu in Modul 6.
