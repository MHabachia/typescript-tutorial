/**
 * MODUL 2.6 - Enums und warum Union Types meist besser sind
 * ============================================================================
 * Ein Enum ist eine Liste benannter Konstanten:
 *   enum Status { Offen, Erledigt }
 *
 * Enums sind eine der ganz wenigen TypeScript-Funktionen, die auch echten
 * JavaScript-Code erzeugen. Alles andere (Typen, Interfaces) verschwindet
 * beim Kompilieren spurlos - ein Enum wird zu einem Objekt zur Laufzeit.
 *
 * In der Praxis loesen zwei Alternativen dieselbe Aufgabe besser:
 *   1) String-Union:   type Status = "offen" | "erledigt"
 *   2) as-const-Objekt: const Status = { Offen: "offen" } as const
 *
 * Und Finger weg von `const enum`: Es wird beim Kompilieren "wegoptimiert"
 * und bricht mit isolatedModules, Babel, esbuild und swc - also mit fast
 * jedem modernen Build-Werkzeug.
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN 1: numerisches Enum
// -----------------------------------------------------------------------
// Ohne explizite Werte zaehlt TypeScript ab 0 hoch. Das hat drei Nachteile:
// die Werte sind beim Debuggen nichtssagend, sie verschieben sich, sobald
// jemand einen Eintrag einfuegt, und JEDE Zahl ist zuweisbar.
enum StufeFalsch {
  Niedrig, // 0
  Mittel, // 1
  Hoch, // 2
}

const gespeichert: StufeFalsch = StufeFalsch.Mittel;
console.log("[Anti-Pattern] gespeicherter Wert in der Datenbank:", gespeichert); // 1
console.log(
  "[Anti-Pattern] Rueckwaerts-Mapping erzeugt Muell im Objekt:",
  Object.keys(StufeFalsch).join(", ")
);

// Numerische Enums sind loechrig: 99 ist kein gueltiger Eintrag, wird von
// aelteren TypeScript-Versionen aber klaglos akzeptiert. Der Cast hier zeigt,
// wie leicht ein ungueltiger Wert hineinrutscht:
const kaputteStufe = 99 as StufeFalsch;
console.log("[Anti-Pattern] ungueltige Stufe:", StufeFalsch[kaputteStufe] ?? "undefined");

// -----------------------------------------------------------------------
// ANTI-PATTERN 2: any statt eines festen Wertebereichs
// -----------------------------------------------------------------------
// "any" muss hier explizit stehen, weil "noImplicitAny" aktiv ist.
function beschreibeFalsch(status: any): string {
  if (status === "erledigt") {
    return "Fertig";
  }
  return "Unbekannt";
}

console.log("[Anti-Pattern] beschreibeFalsch('erledgit'):", beschreibeFalsch("erledgit"));
console.log("[Anti-Pattern] beschreibeFalsch(42):", beschreibeFalsch(42));

// -----------------------------------------------------------------------
// BEST PRACTICE 1: String-Union
// -----------------------------------------------------------------------
// Kein Laufzeit-Code, keine Importe, lesbare Werte in Logs und JSON - und
// der Compiler kennt alle gueltigen Faelle.
type Status = "offen" | "in-arbeit" | "erledigt";

function beschreibe(status: Status): string {
  switch (status) {
    case "offen":
      return "Noch nichts passiert";
    case "in-arbeit":
      return "Laeuft gerade";
    case "erledigt":
      return "Fertig";
    default: {
      // Vollstaendigkeitspruefung: Kaeme ein vierter Status dazu, waere
      // "status" hier nicht mehr "never" - der Compiler meldet den
      // vergessenen Fall sofort.
      const nichtErreichbar: never = status;
      throw new Error(`Unbekannter Status: ${String(nichtErreichbar)}`);
    }
  }
}

console.log("[Best Practice] offen ->", beschreibe("offen"));
console.log("[Best Practice] erledigt ->", beschreibe("erledigt"));
// beschreibe("erledgit"); // Fehler: Argument of type '"erledgit"' is not
//                         // assignable to parameter of type 'Status'.

// -----------------------------------------------------------------------
// BEST PRACTICE 2: as-const-Objekt, wenn du die Werte zur Laufzeit brauchst
// -----------------------------------------------------------------------
// Manchmal willst du wie bei einem Enum ueber alle Werte iterieren oder sie
// mit einem sprechenden Namen ansprechen. Dann nimmst du ein eingefrorenes
// Objekt und leitest den Typ daraus ab - das Beste aus beiden Welten.

const Prioritaet = {
  Niedrig: "niedrig",
  Mittel: "mittel",
  Hoch: "hoch",
} as const;

// Der Union-Typ entsteht automatisch aus den Werten:
type Prioritaet = (typeof Prioritaet)[keyof typeof Prioritaet];
// entspricht: "niedrig" | "mittel" | "hoch"

// Namens-Zugriff wie beim Enum:
const meinePrioritaet: Prioritaet = Prioritaet.Hoch;

// Und zusaetzlich: ueber alle Werte iterieren.
const allePrioritaeten: readonly Prioritaet[] = Object.values(Prioritaet);

console.log("[Best Practice] gewaehlte Prioritaet:", meinePrioritaet);
console.log("[Best Practice] alle Prioritaeten:", allePrioritaeten.join(", "));

// Praktischer Nebeneffekt: eine Pruefung fuer Daten von aussen ist trivial.
function istPrioritaet(wert: unknown): wert is Prioritaet {
  return allePrioritaeten.some((p) => p === wert);
}

console.log("[Best Practice] istPrioritaet('hoch'):", istPrioritaet("hoch"));
console.log("[Best Practice] istPrioritaet('sehr hoch'):", istPrioritaet("sehr hoch"));

// -----------------------------------------------------------------------
// BEST PRACTICE 3: Wenn schon Enum, dann ein String-Enum
// -----------------------------------------------------------------------
// String-Enums haben lesbare Werte und sind nicht loechrig: eine beliebige
// Zeichenkette ist NICHT zuweisbar. Wer Enums mag, nimmt diese Variante.
enum Rolle {
  Gast = "gast",
  Nutzer = "nutzer",
  Admin = "admin",
}

const rolle: Rolle = Rolle.Admin;
console.log("[Best Practice] Rolle als String-Enum:", rolle); // "admin"
// const falsch: Rolle = "admin"; // Fehler: string ist kein Rolle-Mitglied

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Entscheidungsbaum in drei Zeilen:
//   Brauchst du die Werte NUR im Typsystem?      -> String-Union
//   Brauchst du sie auch zur Laufzeit (Liste,
//   Namenszugriff, Validierung)?                 -> as-const-Objekt
//   Arbeitest du in einer Codebasis, die Enums
//   bereits ueberall nutzt?                      -> String-Enum, konsistent bleiben
//
// Verboten bleibt in beiden Faellen `const enum`: Es existiert nach dem
// Kompilieren nicht mehr, laesst sich nicht ueber Modulgrenzen hinweg
// zuverlaessig nutzen und ist mit "isolatedModules" (in diesem Projekt aktiv)
// ohnehin eingeschraenkt.
