/**
 * MODUL 1.5 - any, unknown, never & void
 * ============================================================================
 * Diese vier Typen beschreiben keine Daten, sondern Situationen:
 *   any     - "Typpruefung abschalten"        (Notausgang, moeglichst nie)
 *   unknown - "irgendein Wert, erst pruefen"  (der sichere Zwilling von any)
 *   void    - "gibt nichts zurueck"           (Rueckgabetyp von Prozeduren)
 *   never   - "passiert nie"                  (wirft immer / unerreichbar)
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: "any" als schneller Ausweg
// -----------------------------------------------------------------------
// Sobald ein Wert "any" ist, wird auch alles "any", was daraus entsteht -
// die Typsicherheit breitet sich nicht aus, sie verschwindet.
const antwortFalsch: any = JSON.parse('{"data":{"benutzer":{"name":"Ada"}}}');
const nameFalsch = antwortFalsch.data.benutzer.name; // any
console.log("[Anti-Pattern] Name (ungeprueft):", nameFalsch);

// Der Compiler haette auch das hier klaglos akzeptiert - es kracht erst
// zur Laufzeit:
//   antwortFalsch.data.gibtEsNicht.name.toUpperCase();

// -----------------------------------------------------------------------
// BEST PRACTICE: "unknown" erzwingt eine Pruefung
// -----------------------------------------------------------------------
const antwort: unknown = JSON.parse('{"data":{"benutzer":{"name":"Ada"}}}');

// Mit "unknown" verweigert TypeScript jeden Zugriff, solange nicht geprueft
// wurde. Die Pruefung machen wir hier Schritt fuer Schritt explizit:
function leseBenutzername(rohdaten: unknown): string | undefined {
  if (typeof rohdaten !== "object" || rohdaten === null) {
    return undefined;
  }
  const mitData = rohdaten as { data?: unknown };
  if (typeof mitData.data !== "object" || mitData.data === null) {
    return undefined;
  }
  const mitBenutzer = mitData.data as { benutzer?: unknown };
  if (typeof mitBenutzer.benutzer !== "object" || mitBenutzer.benutzer === null) {
    return undefined;
  }
  const mitName = mitBenutzer.benutzer as { name?: unknown };
  return typeof mitName.name === "string" ? mitName.name : undefined;
}

console.log("[Best Practice] Name (geprueft):", leseBenutzername(antwort));
console.log("[Best Practice] Name bei Muell:", leseBenutzername("kein Objekt"));

// -----------------------------------------------------------------------
// BEST PRACTICE: void und never
// -----------------------------------------------------------------------

// void: die Funktion gibt bewusst nichts zurueck.
function protokolliere(nachricht: string): void {
  console.log("[LOG]", nachricht);
}

// never: diese Funktion kehrt NIE normal zurueck, sie wirft immer.
function wirfFehler(nachricht: string): never {
  throw new Error(nachricht);
}

// Der praktische Nutzen von never: die Vollstaendigkeitspruefung.
type Ampel = "rot" | "gelb" | "gruen";

function beschreibe(farbe: Ampel): string {
  switch (farbe) {
    case "rot":
      return "Halt!";
    case "gelb":
      return "Gleich...";
    case "gruen":
      return "Fahr!";
    default: {
      // Wuerde "Ampel" spaeter um einen vierten Wert erweitert, waere "farbe"
      // hier nicht mehr "never" - und der Compiler meldet sofort, dass ein
      // Fall fehlt. Ein vergessener Fall kann so gar nicht erst passieren.
      const nichtErreichbar: never = farbe;
      return wirfFehler(`Unbekannte Farbe: ${String(nichtErreichbar)}`);
    }
  }
}

protokolliere("Beispiel gestartet");
console.log("[Best Practice] beschreibe('rot'):", beschreibe("rot"));
console.log("[Best Practice] beschreibe('gruen'):", beschreibe("gruen"));

// wirfFehler wird hier absichtlich nur in einer try/catch-Demo aufgerufen,
// damit das Beispiel weiterlaeuft:
try {
  wirfFehler("Das war Absicht.");
} catch (fehler) {
  // Dank "useUnknownInCatchVariables" (Teil von strict) ist "fehler" hier
  // vom Typ unknown - auch das muss also erst geprueft werden.
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  console.log("[Best Practice] gefangener Fehler:", text);
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Faustregel: Alles, was von aussen in dein Programm kommt (HTTP-Antworten,
// JSON.parse, Benutzereingaben, process.env), sollte zuerst "unknown" sein -
// niemals "any". "unknown" kostet dich ein paar Zeilen Pruefcode, schuetzt
// dafuer aber genau an der Stelle, an der Laufzeitfehler tatsaechlich
// entstehen: an der Grenze zwischen deinem Code und der Aussenwelt.
