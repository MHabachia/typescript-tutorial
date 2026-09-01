/**
 * MODUL 4 - Hilfsmodul: logger.ts (default export)
 * ============================================================================
 * Dieses Modul demonstriert den "default export": Eine Datei sagt damit "das
 * hier bin ich". Genau EIN Default-Export pro Datei ist erlaubt.
 *
 * Faustregel: Default-Export nur, wenn die Datei genau eine Sache ist (eine
 * Klasse, eine Konfiguration, ein Service). Alles andere: named exports.
 * Beides darf in derselben Datei stehen - siehe unten.
 */

/** Die moeglichen Dringlichkeitsstufen einer Log-Zeile. */
export type LogStufe = "info" | "warn" | "error";

// Named export NEBEN dem Default-Export: das Praefix darf mitgelesen werden.
export const LOG_PRAEFIX = "[App]";

const stufenSymbol: Record<LogStufe, string> = {
  info: "i",
  warn: "!",
  error: "X",
};

class Logger {
  // "readonly": der Name steht bei der Erzeugung fest und aendert sich nie.
  private readonly bereich: string;

  constructor(bereich: string) {
    this.bereich = bereich;
  }

  public log(stufe: LogStufe, nachricht: string): void {
    // Record<LogStufe, string> ist vollstaendig - der Zugriff ist hier also
    // sicher. Trotzdem sichern wir mit "??" ab, weil "noUncheckedIndexedAccess"
    // uns bei Index-Zugriffen grundsaetzlich zur Vorsicht zwingt.
    const symbol = stufenSymbol[stufe] ?? "?";
    console.log(`${LOG_PRAEFIX}[${symbol}][${this.bereich}] ${nachricht}`);
  }

  public info(nachricht: string): void {
    this.log("info", nachricht);
  }

  public warn(nachricht: string): void {
    this.log("warn", nachricht);
  }

  /** Erzeugt einen Unter-Logger, z. B. "http" -> "http:router". */
  public fuerBereich(unterbereich: string): Logger {
    return new Logger(`${this.bereich}:${unterbereich}`);
  }
}

// Der Default-Export: eine fertige, sofort benutzbare Instanz.
const logger = new Logger("modul4");
export default logger;

// Auch der Typ selbst darf exportiert werden - so kann ein Aufrufer eine
// Variable als "Logger" typisieren, ohne die Klasse selbst zu instanziieren.
export type { Logger };

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Ein Default-Export ist bequem, aber unsichtbar fuer Werkzeuge: Weder die
// Autovervollstaendigung noch eine globale Suche kann dir zuverlaessig sagen,
// welchen Namen ein Aufrufer vergeben hat. Deshalb gilt in vielen Teams die
// Regel "named exports ueberall, default nur fuer Framework-Konventionen".
// Wenn du dich fuer default entscheidest, exportiere den Wert zusaetzlich
// unter seinem echten Namen - dann haben beide Lager, was sie brauchen.
