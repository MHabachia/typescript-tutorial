/**
 * MODUL 8.3 - Konfiguration & Umgebungsvariablen
 * ============================================================================
 * "process.env" ist der Briefkasten deiner Anwendung: Jeder darf etwas
 * hineinwerfen, und alles darin ist ein Zettel - also "string | undefined".
 * Niemals eine Zahl, niemals ein boolean, niemals garantiert vorhanden.
 *
 * Die Regel fuer Produktion lautet deshalb:
 *   1. Konfiguration EINMAL beim Start lesen und pruefen (Fail Fast).
 *   2. Danach nur noch ein typisiertes, "readonly" Konfigurationsobjekt
 *      durch die Anwendung reichen.
 *   3. Kein "process.env" mehr irgendwo tief im Code.
 *
 * Ein Start, der wegen einer fehlenden Variable sofort abbricht, ist ein
 * guter Start. Ein Start, der durchlaeuft und drei Stunden spaeter mitten
 * in einer Bestellung "undefined" in die Datenbank schreibt, ist ein
 * schlechter.
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: process.env ueberall im Code, ungeprueft
// -----------------------------------------------------------------------
// Wir tun so, als haette der Betreiber nur den Port gesetzt - die
// Datenbank-URL hat er vergessen.
process.env["PORT"] = "8080";
delete process.env["DATENBANK_URL"];

// "any" schaltet hier genau die Pruefung ab, die uns retten wuerde.
const rohPortFalsch: any = process.env["PORT"];
const portFalsch = parseInt(rohPortFalsch, 10) || 3000;

// Fehlende Pflichtwerte werden still durch einen Ersatzwert ueberdeckt.
const datenbankUrlFalsch = process.env["DATENBANK_URL"] ?? "";

console.log("[Anti-Pattern] Port:", portFalsch);
console.log(
  "[Anti-Pattern] Datenbank-URL:",
  `"${datenbankUrlFalsch}"`,
  "- der Server startet trotzdem und kracht erst bei der ersten Abfrage."
);

// Und so sieht es aus, wenn jemand "PORT=achttausend" schreibt:
const tippfehlerPort: any = "achttausend";
console.log(
  "[Anti-Pattern] Port bei Tippfehler:",
  parseInt(tippfehlerPort, 10) || 3000,
  "- der Tippfehler wird lautlos zu 3000."
);

// -----------------------------------------------------------------------
// BEST PRACTICE: einmal laden, pruefen, einfrieren
// -----------------------------------------------------------------------

type Umgebung = "development" | "production" | "test";

/** Das einzige Konfigurationsobjekt der Anwendung - komplett readonly. */
interface AppKonfiguration {
  readonly umgebung: Umgebung;
  readonly port: number;
  readonly datenbankUrl: string;
  readonly maxVerbindungen: number;
  readonly debugAusgabe: boolean;
}

/** Eigener Fehlertyp - so erkennt man Startfehler sofort im Log. */
class KonfigurationsFehler extends Error {
  public constructor(nachricht: string) {
    super(nachricht);
    this.name = "KonfigurationsFehler";
  }
}

/** Pflichtwert: fehlt er, gibt es keinen Start. */
function lesePflicht(schluessel: string): string {
  const wert = process.env[schluessel];
  if (wert === undefined || wert.trim() === "") {
    throw new KonfigurationsFehler(
      `Pflicht-Umgebungsvariable "${schluessel}" fehlt oder ist leer.`
    );
  }
  return wert;
}

/** Zahl mit Standardwert - aber ein Tippfehler bleibt ein Fehler. */
function leseZahl(schluessel: string, standard: number): number {
  const roh = process.env[schluessel];
  if (roh === undefined || roh.trim() === "") {
    return standard;
  }
  const zahl = Number(roh);
  if (!Number.isInteger(zahl) || zahl <= 0) {
    throw new KonfigurationsFehler(
      `Umgebungsvariable "${schluessel}" muss eine positive Ganzzahl sein, war aber "${roh}".`
    );
  }
  return zahl;
}

/** Schalter: nur "true"/"1" gelten als an. */
function leseSchalter(schluessel: string, standard: boolean): boolean {
  const roh = process.env[schluessel];
  if (roh === undefined || roh.trim() === "") {
    return standard;
  }
  return roh.toLowerCase() === "true" || roh === "1";
}

/** Aus einem freien String wird ein enger Union-Typ - oder ein Fehler. */
function leseUmgebung(): Umgebung {
  const roh = process.env["NODE_ENV"] ?? "development";
  const erlaubt: readonly Umgebung[] = ["development", "production", "test"];
  const treffer = erlaubt.find((kandidat) => kandidat === roh);
  if (treffer === undefined) {
    throw new KonfigurationsFehler(
      `NODE_ENV muss einer von [${erlaubt.join(", ")}] sein, war aber "${roh}".`
    );
  }
  return treffer;
}

/**
 * Der einzige Ort im Programm, an dem process.env gelesen wird.
 * Object.freeze macht das Objekt auch zur LAUFZEIT unveraenderlich -
 * "readonly" allein gilt nur beim Kompilieren.
 */
function ladeKonfiguration(): AppKonfiguration {
  return Object.freeze({
    umgebung: leseUmgebung(),
    port: leseZahl("PORT", 3000),
    datenbankUrl: lesePflicht("DATENBANK_URL"),
    maxVerbindungen: leseZahl("MAX_VERBINDUNGEN", 10),
    debugAusgabe: leseSchalter("DEBUG", false),
  });
}

/** Geheimnisse gehoeren nie unmaskiert ins Log. */
function maskiere(geheimnis: string): string {
  return geheimnis.length <= 8
    ? "***"
    : `${geheimnis.slice(0, 6)}***${geheimnis.slice(-4)}`;
}

// --- Erfolgsfall: alle Variablen sind gesetzt --------------------------
// In der Realitaet setzt die Betriebsumgebung (Docker, systemd, CI) diese
// Werte. Hier setzen wir sie im Skript, damit das Beispiel laeuft.
process.env["NODE_ENV"] = "production";
process.env["PORT"] = "8080";
process.env["DATENBANK_URL"] = "postgres://app:s3hrGeheim@db.intern:5432/shop";
process.env["MAX_VERBINDUNGEN"] = "25";
process.env["DEBUG"] = "false";

const konfiguration: AppKonfiguration = ladeKonfiguration();

console.log("[Best Practice] Umgebung:", konfiguration.umgebung);
console.log("[Best Practice] Port:", konfiguration.port);
console.log("[Best Practice] Datenbank-URL:", maskiere(konfiguration.datenbankUrl));
console.log("[Best Practice] Max. Verbindungen:", konfiguration.maxVerbindungen);
console.log("[Best Practice] Debug-Ausgabe:", konfiguration.debugAusgabe);

// Ab hier reicht man NUR NOCH dieses Objekt weiter - kein process.env mehr:
function starteScheinServer(kfg: AppKonfiguration): string {
  return `Server lauscht auf Port ${kfg.port} (${kfg.umgebung})`;
}
console.log("[Best Practice]", starteScheinServer(konfiguration));

// konfiguration.port = 9999;
// ^ Fehler beim Kompilieren: "Cannot assign to 'port' because it is a
//   read-only property." - und dank Object.freeze auch zur Laufzeit wirkungslos.

// --- Fehlerfall: eine Pflichtvariable fehlt ---------------------------
delete process.env["DATENBANK_URL"];

try {
  const kaputt = ladeKonfiguration();
  console.log("[Best Practice] Das darf nicht passieren:", kaputt.port);
} catch (fehler) {
  // "useUnknownInCatchVariables": "fehler" ist unknown, also erst pruefen.
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  console.log("[Best Practice] Start abgebrochen (Fail Fast):", text);
}

// --- Fehlerfall 2: unbrauchbarer Wert ---------------------------------
process.env["DATENBANK_URL"] = "postgres://app:s3hrGeheim@db.intern:5432/shop";
process.env["PORT"] = "achttausend";

try {
  const kaputt = ladeKonfiguration();
  console.log("[Best Practice] Das darf nicht passieren:", kaputt.port);
} catch (fehler) {
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  console.log("[Best Practice] Start abgebrochen (Fail Fast):", text);
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Rufe "ladeKonfiguration()" als allererstes in deinem Einstiegspunkt auf -
// vor dem Oeffnen von Datenbankverbindungen, vor "server.listen()". Faellt
// der Start durch, beende den Prozess mit "process.exitCode = 1". Genau
// darauf warten Orchestrierer wie Docker, Kubernetes oder systemd: Ein
// Container, der beim Start sauber scheitert, wird neu gestartet oder als
// defekt markiert - ein Container, der halb konfiguriert weiterlaeuft,
// liefert stundenlang stille Fehler aus. Zusatznutzen: Weil die Pruefung
// an genau einer Stelle steht, ist deine Konfigurations-Schnittstelle
// gleichzeitig die beste Dokumentation ueber alles, was dein Dienst zum
// Leben braucht.
