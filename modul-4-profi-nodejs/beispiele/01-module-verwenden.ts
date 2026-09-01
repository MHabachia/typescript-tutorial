/**
 * MODUL 4.2 - Module: export / import
 * ============================================================================
 * Ein Modul ist in TypeScript einfach eine Datei. Alles, was darin steht, ist
 * privat - bis du es mit "export" nach aussen freigibst. Ein anderes Modul
 * holt es sich mit "import" zurueck.
 *
 * Diese Datei importiert aus zwei Nachbarmodulen:
 *   ./mathe   - named exports  (mehrere benannte Bausteine)
 *   ./logger  - default export (die Datei "ist" ein Logger)
 *
 * Wichtig fuer den Kopf: Der Pfad "./mathe" ist eine DATEI, kein Paket.
 * Alles ohne "./" oder "../" sucht Node in node_modules.
 */

// --- Named imports: geschweifte Klammern, exakte Namen --------------------
import { addiere, multipliziere, dividiere, mittelwert, PI_GERUNDET } from "./mathe";

// --- Umbenennen mit "as": wenn der Name kollidiert oder unklar waere ------
import { addiere as summiereZwei } from "./mathe";

// --- import type: existiert NUR beim Kompilieren --------------------------
// Damit sagst du dem Compiler ausdruecklich: "Das ist ein Typ." Er wirft die
// Zeile beim Uebersetzen komplett weg - es entsteht also KEIN require() zur
// Laufzeit. Das verhindert unnoetige Ladevorgaenge und zirkulaere Importe.
import type { Rechenergebnis, Rechenoperation } from "./mathe";

// --- Default import: der Name ist frei waehlbar (hier: "log") -------------
import log, { LOG_PRAEFIX } from "./logger";
import type { LogStufe } from "./logger";

// -----------------------------------------------------------------------
// ANTI-PATTERN: Module per require() ohne Typen einbinden
// -----------------------------------------------------------------------
// "require" liefert von sich aus "any" - hier steht das ": any" absichtlich
// explizit da, weil "noImplicitAny" ein stilles any verbieten wuerde. Genau
// das ist der Punkt: Der Compiler weiss ab hier gar nichts mehr ueber das
// Modul. Tippfehler im Funktionsnamen? Faellt erst zur Laufzeit auf.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const matheUngetypt: any = require("./mathe");

console.log("[Anti-Pattern] 2 + 3 =", matheUngetypt.addiere(2, 3));
// Das hier kompiliert klaglos - und liefert Unsinn statt eines Fehlers:
console.log("[Anti-Pattern] Tippfehler 'addire':", typeof matheUngetypt.addire);
// Auch die Argumente werden nicht geprueft:
console.log("[Anti-Pattern] addiere('a','b') =", matheUngetypt.addiere("a", "b"));

// -----------------------------------------------------------------------
// BEST PRACTICE: import mit echten Typen
// -----------------------------------------------------------------------
console.log("[Best Practice] 2 + 3 =", addiere(2, 3));
console.log("[Best Practice] 4 * 5 =", multipliziere(4, 5));
console.log("[Best Practice] umbenannt via 'as':", summiereZwei(20, 22));

// dividiere gibt "number | undefined" zurueck - der Compiler zwingt zur
// Behandlung des Sonderfalls.
const geteilt = dividiere(10, 0);
console.log("[Best Practice] 10 / 0 =", geteilt ?? "nicht definiert");

// Der importierte Typ wird ganz normal als Annotation benutzt.
const schnitt: Rechenergebnis = mittelwert([2, 3, 4, 5]);
console.log(`[Best Practice] ${schnitt.operation} = ${schnitt.wert}`);

// Auch ein importierter Funktionstyp laesst sich weiterverwenden:
const potenziere: Rechenoperation = (a, b) => a ** b;
console.log("[Best Practice] 2 hoch 10 =", potenziere(2, 10));
console.log("[Best Practice] PI gerundet:", PI_GERUNDET);

// --- Der Default-Export in Aktion -----------------------------------------
log.info("Modul 4 gestartet");
log.warn("Das ist nur eine Uebung");

const httpLog = log.fuerBereich("http");
httpLog.info("Unter-Logger erzeugt");

// Der importierte Typ macht den Parameter selbsterklaerend:
function meldeMitStufe(stufe: LogStufe, text: string): void {
  log.log(stufe, text);
}
meldeMitStufe("error", "So sieht eine Fehlermeldung aus");
console.log("[Best Practice] Praefix aus dem Logger-Modul:", LOG_PRAEFIX);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Trenne beim Importieren konsequent zwischen Werten und Typen: "import type"
// fuer alles, was nur die Typpruefung braucht, normales "import" fuer alles,
// was zur Laufzeit wirklich existieren muss. Das kostet dich nichts und bringt
// dir drei Dinge: kleinere Bundles, schnellere Ladezeiten und - am wichtigsten -
// zirkulaere Abhaengigkeiten, die harmlos bleiben, weil zur Laufzeit gar kein
// Modul geladen wird. In IntelliJ IDEA kannst du das automatisieren:
// Settings -> Editor -> Code Style -> TypeScript -> Imports.
