/**
 * MODUL 6.1 - Authentifizierung vs. Autorisierung
 * ============================================================================
 * Zwei Fragen, die staendig verwechselt werden:
 *   Authentifizierung - "Wer bist du?"      (Login, Passwort, Token)
 *   Autorisierung     - "Darfst du das?"    (Rollen, Rechte, Regeln)
 *
 * Der Ausweis am Empfang beweist, WER du bist. Ob dir die Tuer zum Serverraum
 * aufgeht, ist eine voellig andere Frage.
 *
 * Diese Datei ist Lehrmaterial. Sie zeigt, wie man Rollen und Rechte
 * typsicher MODELLIERT - sie ist kein fertiges Berechtigungssystem. In echten
 * Projekten liegt die Rechtepruefung immer serverseitig und wird zusaetzlich
 * getestet.
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: Rollen und Rechte als lose Strings
// -----------------------------------------------------------------------
// "string" erlaubt jeden Wert - auch Tippfehler. Und ein Tippfehler in einer
// Rechtepruefung ist keine Kleinigkeit: er entscheidet ueber Zugriff.
interface BenutzerFalsch {
  name: string;
  rolle: string; // "admin"? "Admin"? "administrator"? Alles erlaubt.
}

function darfLoeschenFalsch(benutzer: BenutzerFalsch): boolean {
  // Tippfehler "adminn" - der Compiler sagt nichts. Zur Laufzeit darf
  // ploetzlich NIEMAND mehr loeschen. Umgekehrt waere es schlimmer.
  return benutzer.rolle === "adminn";
}

const chefFalsch: BenutzerFalsch = { name: "Ada", rolle: "admin" };
console.log("[Anti-Pattern] Rolle als string:", chefFalsch.rolle);
console.log(
  "[Anti-Pattern] Admin darf loeschen?",
  darfLoeschenFalsch(chefFalsch),
  "<- falsch, wegen Tippfehler in der Pruefung"
);

// -----------------------------------------------------------------------
// BEST PRACTICE: Rollen und Rechte als Union-Typen
// -----------------------------------------------------------------------
// Jetzt kennt der Compiler die erlaubten Werte. Ein Tippfehler ist ein
// Kompilierfehler - und damit ein Problem, das nie in Produktion ankommt.
type Rolle = "gast" | "mitglied" | "moderator" | "admin";

type Recht =
  | "todo:lesen"
  | "todo:anlegen"
  | "todo:loeschen"
  | "benutzer:verwalten";

// Die Rechte-Matrix: pro Rolle eine unveraenderliche Liste von Rechten.
// "Record<Rolle, ...>" erzwingt, dass JEDE Rolle einen Eintrag hat. Kommt
// spaeter eine Rolle dazu, meldet der Compiler die Luecke sofort.
const RECHTE_MATRIX: Record<Rolle, ReadonlyArray<Recht>> = {
  gast: ["todo:lesen"],
  mitglied: ["todo:lesen", "todo:anlegen"],
  moderator: ["todo:lesen", "todo:anlegen", "todo:loeschen"],
  admin: ["todo:lesen", "todo:anlegen", "todo:loeschen", "benutzer:verwalten"],
};

interface Benutzer {
  readonly name: string;
  readonly rolle: Rolle;
}

// Eine einzige zentrale Stelle fuer die Frage "darf er?". Verteilte
// if-Abfragen quer durch den Code sind die Hauptquelle fuer Luecken.
function hatRecht(benutzer: Benutzer, recht: Recht): boolean {
  // Zugriff ueber einen Literal-Union-Schluessel ist hier sicher: der Record
  // garantiert fuer jede Rolle einen Eintrag.
  return RECHTE_MATRIX[benutzer.rolle].includes(recht);
}

const ada: Benutzer = { name: "Ada", rolle: "admin" };
const gustav: Benutzer = { name: "Gustav", rolle: "gast" };

console.log("[Best Practice] Ada darf loeschen?", hatRecht(ada, "todo:loeschen"));
console.log("[Best Practice] Gustav darf loeschen?", hatRecht(gustav, "todo:loeschen"));
console.log("[Best Practice] Gustav darf lesen?", hatRecht(gustav, "todo:lesen"));

// hatRecht("todo:loeschn") waere ein Kompilierfehler - der Tippfehler von
// oben kann hier gar nicht mehr entstehen.

// -----------------------------------------------------------------------
// BEST PRACTICE: Autorisierung, die den Rest des Codes schuetzt
// -----------------------------------------------------------------------
// Statt ueberall "if (hatRecht(...))" zu schreiben, kapselt man die Pruefung
// einmal. Wer sie vergisst, kommt an die Aktion gar nicht heran.
type Ergebnis<T> =
  | { readonly ok: true; readonly wert: T }
  | { readonly ok: false; readonly fehler: string };

function fuehreAus<T>(
  benutzer: Benutzer,
  benoetigtesRecht: Recht,
  aktion: () => T
): Ergebnis<T> {
  if (!hatRecht(benutzer, benoetigtesRecht)) {
    // Bewusst knapp: die Fehlermeldung verraet nicht, welche Rolle noetig
    // waere oder wie die Matrix aussieht (siehe Abschnitt 6.6).
    return { ok: false, fehler: "Keine Berechtigung." };
  }
  return { ok: true, wert: aktion() };
}

const versuchAda = fuehreAus(ada, "benutzer:verwalten", () => "Benutzerliste geladen");
const versuchGustav = fuehreAus(gustav, "benutzer:verwalten", () => "Benutzerliste geladen");

console.log(
  "[Best Practice] Ada verwaltet Benutzer:",
  versuchAda.ok ? versuchAda.wert : versuchAda.fehler
);
console.log(
  "[Best Practice] Gustav verwaltet Benutzer:",
  versuchGustav.ok ? versuchGustav.wert : versuchGustav.fehler
);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Modelliere Rechte feiner als Rollen. Rollen aendern sich mit der
// Organisation ("Moderator" heisst naechstes Jahr "Community Manager"),
// Rechte aendern sich mit der Software. Wenn dein Code ueberall
// "rolle === 'admin'" prueft, musst du bei jeder Umbenennung alles anfassen.
// Prueft er stattdessen "hatRecht(benutzer, 'benutzer:verwalten')", aenderst
// du nur eine Zeile in der Matrix. Und: Autorisierung gehoert IMMER auf den
// Server. Das Frontend blendet Knoepfe aus - das ist Komfort, kein Schutz.
