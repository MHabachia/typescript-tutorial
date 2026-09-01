/**
 * MODUL 5.2 - Der Strict-Mode in Aktion
 * ============================================================================
 * Die tsconfig.json dieses Repos dreht jeden Schalter auf Anschlag: "strict"
 * plus acht Zusatzoptionen. Jeder dieser Schalter faengt eine ganz bestimmte
 * Sorte Bug ab, die dir sonst erst zur Laufzeit um die Ohren fliegt.
 *
 * Diese Datei zeigt fuer jede wichtige Option:
 *   1. was OHNE sie durchrutschen wuerde (Anti-Pattern, laeuft - aber falsch)
 *   2. die Zeile, die MIT ihr nicht mehr kompiliert (auskommentiert, mit der
 *      exakten Compiler-Fehlermeldung darunter)
 *   3. wie der korrekte Code aussieht (Best Practice)
 *
 * Die auskommentierten Zeilen sind kein Deko-Kommentar: Kommentiere sie in
 * IntelliJ testweise ein (Strg+/ bzw. Cmd+/) und sieh dir die rote Wellenlinie
 * an. Danach wieder auskommentieren - sonst laeuft die Datei nicht mehr.
 */

// ===========================================================================
// 1) noImplicitAny - "ein Parameter ohne Typ ist kein Freibrief"
// ===========================================================================

// ANTI-PATTERN: "any" macht den Compiler blind.
// Ohne "noImplicitAny" haette man den Typ hier gar nicht hinschreiben muessen -
// der Effekt waere derselbe: keinerlei Pruefung.
function laengeVonFalsch(wert: any): number {
  // TypeScript erlaubt hier ALLES. Auch ".length" auf einer Zahl.
  return wert.length;
}
console.log("[Anti-Pattern] laengeVonFalsch(42):", laengeVonFalsch(42));
// Ausgabe: undefined - und "undefined" ist laut Signatur eine "number". Autsch.

// Mit "noImplicitAny" ist die Kurzform ohne Typ verboten:
//   function laengeVonOhneTyp(wert) { return wert.length; }
//   Fehler TS7006: Parameter 'wert' implicitly has an 'any' type.

// BEST PRACTICE: "unknown" statt "any" - der Compiler erzwingt die Pruefung.
function laengeVon(wert: unknown): number {
  if (typeof wert === "string") {
    return wert.length;
  }
  if (Array.isArray(wert)) {
    return wert.length;
  }
  return 0;
}
console.log("[Best Practice] laengeVon(42):", laengeVon(42));
console.log("[Best Practice] laengeVon('Hallo'):", laengeVon("Hallo"));

// ===========================================================================
// 2) strictNullChecks - "null ist ein eigener Wert, kein Nichts"
// ===========================================================================

// Eine Suche, die nichts gefunden hat:
const gefundenerName: string | null = null;

// ANTI-PATTERN: das Ausrufezeichen ("non-null assertion") behauptet einfach,
// es sei schon nichts null. Der Compiler glaubt dir - Node.js nicht.
try {
  console.log("[Anti-Pattern] Name gross:", gefundenerName!.toUpperCase());
} catch (fehler) {
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  console.log("[Anti-Pattern] Absturz zur Laufzeit:", text);
}

// Ohne das "!" meldet der Compiler den Zugriff sofort:
//   console.log(gefundenerName.toUpperCase());
//   Fehler TS18047: 'gefundenerName' is possibly 'null'.

// BEST PRACTICE: pruefen, dann benutzen.
function begruessung(name: string | null): string {
  if (name === null) {
    return "Hallo, Gast!";
  }
  return `Hallo, ${name.toUpperCase()}!`;
}
console.log("[Best Practice]", begruessung(gefundenerName));
console.log("[Best Practice]", begruessung("Ada"));

// ===========================================================================
// 3) noUncheckedIndexedAccess - "Index 0 heisst nicht, dass da etwas ist"
// ===========================================================================

const warteschlange: string[] = [];

// ANTI-PATTERN: Zugriff per Index, Ergebnis blind als string behandelt.
const ersterFalsch = warteschlange[0] as string;
console.log("[Anti-Pattern] erster Auftrag:", ersterFalsch);
// Ausgabe: undefined. Ein "ersterFalsch.toUpperCase()" waere ein Absturz.

// Ohne die Zusicherung meldet der Compiler:
//   const erster: string = warteschlange[0];
//   Fehler TS2322: Type 'string | undefined' is not assignable to type 'string'.
//     Type 'undefined' is not assignable to type 'string'.

// BEST PRACTICE: der Typ ist "string | undefined" - also den Fall behandeln.
const ersterSicher = warteschlange[0];
console.log(
  "[Best Practice] erster Auftrag:",
  ersterSicher ?? "(Warteschlange ist leer)"
);

// ===========================================================================
// 4) exactOptionalPropertyTypes - "optional heisst: weglassen, nicht undefined"
// ===========================================================================

interface Profil {
  name: string;
  spitzname?: string;
}

// ANTI-PATTERN: die Eigenschaft wird gesetzt - auf undefined.
// So etwas kommt heraus, wenn man Objekte mechanisch zusammenbaut:
const profilFalsch = { name: "Ada", spitzname: undefined };
console.log(
  "[Anti-Pattern] 'spitzname' in profilFalsch:",
  "spitzname" in profilFalsch
);
// true - der Schluessel EXISTIERT, sein Wert ist nur undefined. Jedes
// "Object.keys(...)", jedes "JSON.stringify" und jede Datenbank sieht das
// anders als ein Objekt, in dem der Schluessel schlicht fehlt.

// Mit exactOptionalPropertyTypes ist die Zuweisung an "Profil" verboten:
//   const p: Profil = { name: "Ada", spitzname: undefined };
//   Fehler TS2375: Type '{ name: string; spitzname: undefined; }' is not
//   assignable to type 'Profil' with 'exactOptionalPropertyTypes: true'.
//   Consider adding 'undefined' to the types of the target's properties.

// BEST PRACTICE: die Eigenschaft gar nicht erst anlegen.
function baueProfil(name: string, spitzname?: string): Profil {
  return spitzname === undefined ? { name } : { name, spitzname };
}
const profilOhne = baueProfil("Ada");
const profilMit = baueProfil("Grace", "Amazing Grace");
console.log("[Best Practice] ohne Spitzname:", JSON.stringify(profilOhne));
console.log("[Best Practice] mit Spitzname:", JSON.stringify(profilMit));

// ===========================================================================
// 5) noImplicitReturns - "jeder Pfad muss etwas zurueckgeben"
// ===========================================================================

// ANTI-PATTERN: ein Pfad faellt hinten raus. Damit das ueberhaupt kompiliert,
// muss "undefined" im Rueckgabetyp stehen - genau das verschleiert den Bug.
function bewerteFalsch(punkte: number): string | undefined {
  if (punkte >= 50) {
    return "bestanden";
  }
  // Der else-Fall fehlt - stillschweigend kommt undefined zurueck.
  return undefined;
}
console.log("[Anti-Pattern] bewerteFalsch(30):", bewerteFalsch(30));

// Ohne das "| undefined" im Rueckgabetyp meldet der Compiler:
//   function bewerte(punkte: number): string {
//     if (punkte >= 50) { return "bestanden"; }
//   }
//   Fehler TS2366: Function lacks ending return statement and return type
//   does not include 'undefined'.

// BEST PRACTICE: alle Pfade bedienen.
function bewerte(punkte: number): string {
  if (punkte >= 50) {
    return "bestanden";
  }
  return "nicht bestanden";
}
console.log("[Best Practice] bewerte(30):", bewerte(30));

// ===========================================================================
// 6) noFallthroughCasesInSwitch - "das vergessene break"
// ===========================================================================

// Der Klassiker: ein "break" fehlt, der naechste Fall wird mitausgefuehrt.
//   switch (stufe) {
//     case "klein":
//       preis = 10;
//     case "gross":
//       preis = 20;
//   }
//   Fehler TS7029: Fallthrough case in switch.

// BEST PRACTICE: return statt break - dann kann gar nichts durchfallen.
type Versandart = "standard" | "express" | "abholung";

function versandkosten(art: Versandart): number {
  switch (art) {
    case "standard":
      return 4.9;
    case "express":
      return 12.5;
    case "abholung":
      return 0;
    default: {
      // Vollstaendigkeitspruefung: kaeme eine vierte Versandart dazu, waere
      // "art" hier nicht mehr "never" und der Compiler meldet es.
      const nichtErreichbar: never = art;
      throw new Error(`Unbekannte Versandart: ${String(nichtErreichbar)}`);
    }
  }
}
console.log("[Best Practice] Versand express:", versandkosten("express"));

// ===========================================================================
// 7) noImplicitOverride - "ueberschreibst du absichtlich oder aus Versehen?"
// ===========================================================================

class Zahlungsart {
  gebuehr(betrag: number): number {
    return betrag * 0.01;
  }
}

// Ohne das Schluesselwort "override" meldet der Compiler:
//   class Kreditkarte extends Zahlungsart {
//     gebuehr(betrag: number): number { return betrag * 0.03; }
//   }
//   Fehler TS4114: This member must have an 'override' modifier because it
//   overrides a member in the base class 'Zahlungsart'.

// BEST PRACTICE: die Absicht hinschreiben. Wird die Methode in der Basisklasse
// spaeter umbenannt, meldet der Compiler sofort, dass hier nichts mehr
// ueberschrieben wird - statt still eine tote Methode stehen zu lassen.
class Kreditkarte extends Zahlungsart {
  override gebuehr(betrag: number): number {
    return betrag * 0.03;
  }
}
console.log("[Best Practice] Kartengebuehr auf 100:", new Kreditkarte().gebuehr(100));

// ===========================================================================
// 8) noPropertyAccessFromIndexSignature - "Punkt luegt bei Index-Signaturen"
// ===========================================================================

interface Konfiguration {
  [schluessel: string]: string | undefined;
}
const konfig: Konfiguration = { PORT: "3000" };

// ANTI-PATTERN: Punktzugriff sieht aus wie eine bekannte Eigenschaft - ist aber
// nur geraten. Ein Tippfehler faellt niemandem auf:
console.log("[Anti-Pattern] Tippfehler bleibt stumm:", konfig["PORTT"]);

// Mit der Option ist der Punktzugriff verboten:
//   console.log(konfig.PORT);
//   Fehler TS4111: Property 'PORT' comes from an index signature, so it must
//   be accessed with ['PORT'].

// BEST PRACTICE: Klammerzugriff - er macht sichtbar, dass hier geraten wird,
// und der Wert ist ehrlicherweise "string | undefined".
const port = konfig["PORT"] ?? "8080";
console.log("[Best Practice] Port:", port);

// ===========================================================================
// 9) useUnknownInCatchVariables - "was geworfen wird, weiss niemand"
// ===========================================================================

// In JavaScript darf man ALLES werfen - auch einen String oder eine Zahl.
// Deshalb ist die catch-Variable unter "strict" vom Typ unknown.
//   catch (fehler) { console.log(fehler.message); }
//   Fehler TS18046: 'fehler' is of type 'unknown'.

// BEST PRACTICE: erst pruefen, dann auspacken.
function fehlertext(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler);
}

try {
  throw new Error("Datenbank nicht erreichbar");
} catch (fehler) {
  console.log("[Best Practice] gefangen (Error):", fehlertext(fehler));
}

try {
  // Absichtlich kein Error-Objekt - genau dafuer gibt es die Pruefung.
  throw "nur ein Text";
} catch (fehler) {
  console.log("[Best Practice] gefangen (String):", fehlertext(fehler));
}

// ===========================================================================
// 10) noUnusedLocals / noUnusedParameters - "Leichen im Keller"
// ===========================================================================

// Der Compiler meldet jede Variable und jeden Parameter, den niemand liest:
//   function melde(nachricht: string, unbenutzt: number): string {
//     const nichtGenutzt = 42;
//     return nachricht;
//   }
//   Fehler TS6133: 'unbenutzt' is declared but its value is never read.
//   Fehler TS6133: 'nichtGenutzt' is declared but its value is never read.

// BEST PRACTICE: Was du wirklich brauchst (z. B. weil eine Schnittstelle die
// Reihenfolge vorgibt), praefixt du mit einem Unterstrich - den ignoriert
// TypeScript bewusst.
function protokolliere(_zeitstempel: number, nachricht: string): string {
  return `[LOG] ${nachricht}`;
}
console.log("[Best Practice]", protokolliere(Date.now(), "Modul 5 fertig"));

// ===========================================================================
// PROFI-TIPP
// ===========================================================================
// Schalte den Strict-Mode NIE fuer eine ganze Datei ab, um schnell fertig zu
// werden. Der Reflex "// @ts-ignore" oder "as any" loescht nicht den Fehler,
// sondern nur die Warnung davor - der Bug bleibt und schlaegt spaeter in
// Produktion zu, wo er zehnmal teurer ist.
//
// Wenn du ein bestehendes Projekt auf strict umstellst, geh in dieser
// Reihenfolge vor: erst "strict": true einschalten und die Fehler zaehlen
// (npm run typecheck), dann Datei fuer Datei aufraeumen, und erst ganz zum
// Schluss die Extras wie "noUncheckedIndexedAccess" dazunehmen. Genau die
// bringen naemlich die meisten Treffer - und die wertvollsten.
