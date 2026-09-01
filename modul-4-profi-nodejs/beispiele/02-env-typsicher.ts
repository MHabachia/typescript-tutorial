/**
 * MODUL 4.5 - process.env und Node-APIs typsicher nutzen
 * ============================================================================
 * Umgebungsvariablen sind der Standardweg, Konfiguration in eine Anwendung zu
 * bekommen: Port, Datenbank-URL, API-Schluessel. Der Haken: Node kann dir
 * NICHT versprechen, dass eine Variable gesetzt ist.
 *
 * Deshalb ist "process.env" in @types/node so typisiert:
 *
 *   interface ProcessEnv { [key: string]: string | undefined }
 *
 * Zwei Konsequenzen folgen daraus:
 *   1. Jeder Wert ist "string | undefined" - NIE einfach "string".
 *   2. Jeder Wert ist ein STRING - Zahlen und Booleans musst du selbst
 *      umwandeln und pruefen.
 *
 * Und noch eine dritte, die dieses Projekt betrifft: Weil ProcessEnv eine
 * Index-Signatur ist und wir "noPropertyAccessFromIndexSignature" aktiviert
 * haben, ist "process.env.PORT" verboten - erlaubt ist nur die Klammerform
 * "process.env['PORT']". Der Grund ist Ehrlichkeit: Der Punkt sieht aus wie
 * der Zugriff auf eine bekannte Eigenschaft, ist aber in Wahrheit eine
 * Suche nach einem Schluessel, den es vielleicht gar nicht gibt.
 */

// Das "node:"-Praefix macht unmissverstaendlich klar: Das ist ein eingebautes
// Node-Modul, kein Paket aus node_modules. Ein npm-Paket namens "process"
// koennte diesen Import also nicht mehr entfuehren.
import { argv, env, platform } from "node:process";

// Damit das Beispiel ohne Vorbereitung reproduzierbar laeuft, setzen wir hier
// selbst ein paar Variablen. In echt kaemen sie aus der Shell, aus einer
// .env-Datei oder aus der Run-Configuration von IntelliJ IDEA.
env["APP_NAME"] = "Kursdemo";
env["PORT"] = "3000";
env["DEBUG"] = "true";
// "DATENBANK_URL" setzen wir absichtlich NICHT.

// -----------------------------------------------------------------------
// ANTI-PATTERN: so tun, als waere alles gesetzt
// -----------------------------------------------------------------------

// Variante 1: Die Luege per "as string". Der Compiler glaubt dir - Node nicht.
const dbUrlFalsch = env["DATENBANK_URL"] as string;
console.log("[Anti-Pattern] Datenbank-URL:", dbUrlFalsch); // undefined!
console.log(
  "[Anti-Pattern] Laenge der URL:",
  // dbUrlFalsch.length wuerde hier zur Laufzeit krachen ("Cannot read
  // properties of undefined"). Der Compiler haette es nicht verhindert.
  typeof dbUrlFalsch === "string" ? dbUrlFalsch.length : "TypeError vermieden"
);

// Variante 2: Ein "any"-Konfigurationsobjekt. Das ": any" steht hier bewusst
// explizit da - "noImplicitAny" wuerde ein stillschweigendes any verbieten.
// Ab hier prueft der Compiler gar nichts mehr: kein Tippfehler faellt auf,
// keine fehlende Variable, keine falsche Umwandlung.
const konfigFalsch: any = {
  name: env["APP_NAME"],
  port: env["PORT"], // ein STRING "3000", keine Zahl!
  timeout: env["TIMEOUT"], // gar nicht gesetzt -> undefined
};

// Rechnen mit einem String geht schief, ohne dass jemand meckert:
console.log("[Anti-Pattern] port + 1 =", konfigFalsch.port + 1); // "30001"
console.log("[Anti-Pattern] Tippfehler 'naem':", konfigFalsch.naem); // undefined
console.log("[Anti-Pattern] timeout * 2 =", konfigFalsch.timeout * 2); // NaN

// -----------------------------------------------------------------------
// BEST PRACTICE: eine Hilfsfunktion, die einmal richtig prueft
// -----------------------------------------------------------------------
// Statt an 20 Stellen im Code an die Pruefung zu denken, schreibst du sie
// EINMAL. Danach ist der Rueckgabetyp "string" - ohne undefined.

class KonfigurationsFehler extends Error {
  public constructor(schluessel: string) {
    super(`Umgebungsvariable "${schluessel}" fehlt oder ist leer.`);
    this.name = "KonfigurationsFehler";
  }
}

/**
 * Liest eine Umgebungsvariable.
 * - Mit Fallback: Fehlt die Variable, kommt der Fallback zurueck.
 * - Ohne Fallback: Fehlt die Variable, fliegt ein Fehler - und zwar SOFORT
 *   beim Start, nicht erst nachts um drei beim ersten Request.
 */
function leseUmgebungsvariable(schluessel: string, fallback?: string): string {
  const wert = env[schluessel];
  // Leerstring behandeln wir wie "nicht gesetzt" - PORT="" hilft niemandem.
  if (wert !== undefined && wert.trim() !== "") {
    return wert;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new KonfigurationsFehler(schluessel);
}

/** Dieselbe Idee fuer Zahlen - inklusive Pruefung auf echte Zahl. */
function leseZahl(schluessel: string, fallback: number): number {
  const roh = env[schluessel];
  if (roh === undefined) {
    return fallback;
  }
  const zahl = Number(roh);
  if (!Number.isFinite(zahl)) {
    throw new Error(`Umgebungsvariable "${schluessel}" ist keine Zahl: "${roh}"`);
  }
  return zahl;
}

/** Und fuer Booleans: "true", "1" und "yes" gelten als wahr. */
function leseFlag(schluessel: string, fallback: boolean): boolean {
  const roh = env[schluessel]?.toLowerCase();
  if (roh === undefined) {
    return fallback;
  }
  return roh === "true" || roh === "1" || roh === "yes";
}

interface AppKonfiguration {
  readonly name: string;
  readonly port: number;
  readonly debug: boolean;
  readonly datenbankUrl: string;
}

const konfig: AppKonfiguration = {
  name: leseUmgebungsvariable("APP_NAME"),
  port: leseZahl("PORT", 8080),
  debug: leseFlag("DEBUG", false),
  // Fehlende Variable mit sinnvollem Standard - kein Absturz.
  datenbankUrl: leseUmgebungsvariable("DATENBANK_URL", "sqlite://./lokal.db"),
};

console.log("[Best Practice] Konfiguration:", konfig);
console.log("[Best Practice] port + 1 =", konfig.port + 1); // 3001 - echte Zahl

// Und so sieht der Ernstfall aus: eine wirklich unverzichtbare Variable.
try {
  const geheimnis = leseUmgebungsvariable("API_SCHLUESSEL");
  console.log("[Best Practice] Schluessel geladen:", geheimnis);
} catch (fehler) {
  // "useUnknownInCatchVariables": "fehler" ist "unknown", nicht "Error".
  // Erst pruefen, dann benutzen.
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  console.log("[Best Practice] Start sauber abgebrochen:", text);
}

// -----------------------------------------------------------------------
// BEST PRACTICE: process.argv - Argumente von der Kommandozeile
// -----------------------------------------------------------------------
// argv ist ein string[] mit fester Bedeutung der ersten beiden Eintraege:
//   argv[0] = Pfad zur node-Datei
//   argv[1] = Pfad zum ausgefuehrten Skript
//   argv[2] = das erste echte Argument
//
// Wegen "noUncheckedIndexedAccess" ist argv[2] vom Typ "string | undefined" -
// und das ist keine Schikane, sondern die Wahrheit: Niemand garantiert dir,
// dass der Benutzer ueberhaupt ein Argument uebergeben hat.
const argumente: readonly string[] = argv.slice(2);
const erstesArgument: string = argumente[0] ?? "(kein Argument uebergeben)";

console.log("[Best Practice] Plattform:", platform);
console.log("[Best Practice] Anzahl Argumente:", argumente.length);
console.log("[Best Practice] Erstes Argument:", erstesArgument);
console.log(
  "[Best Practice] Probier mal: npx ts-node <datei>.ts --modus=schnell"
);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Lies die Umgebung genau EINMAL - beim Programmstart, in einer einzigen
// Datei (typischerweise "konfig.ts"), und gib von dort ein fertig geprueftes,
// vollstaendig typisiertes Objekt heraus. Der Rest deiner Anwendung fasst
// "process.env" danach nie wieder an. Das hat drei Vorteile: Ein Konfigurations-
// fehler bricht den Start ab statt irgendeinen spaeteren Request, deine
// Geschaeftslogik ist ohne gesetzte Umgebung testbar, und du hast eine einzige
// Stelle, an der dokumentiert ist, welche Variablen dein Dienst eigentlich
// braucht. In Modul 8 baust du genau das noch einmal richtig aus.
