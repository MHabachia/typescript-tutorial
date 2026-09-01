/**
 * MODUL 9 - konfiguration.ts: Umgebungsvariablen typsicher einlesen
 * ============================================================================
 * Die gesamte Konfiguration wird EINMAL beim Start geprueft und danach als
 * unveraenderliches, typisiertes Objekt weitergereicht. Fehlt etwas, bricht
 * die Anwendung sofort mit einer klaren Meldung ab ("fail fast") - statt
 * mitten im Betrieb ueber ein "undefined" zu stolpern.
 *
 * Verwendete Konzepte aus dem Kurs:
 *   Modul 1 - undefined pruefen
 *   Modul 5 - noPropertyAccessFromIndexSignature
 *   Modul 8 - Konfiguration & Fail-Fast beim Start
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: process.env direkt und ungeprueft benutzen
// -----------------------------------------------------------------------
// process.env liefert immer "string | undefined". Wer das ignoriert, baut
// sich Bugs ein, die erst in der Produktion auftauchen.
const portFalsch: any = process.env["PORT"]; // "any" nur zur Demonstration
const berechneterPortFalsch = portFalsch * 1; // NaN, wenn PORT nicht gesetzt ist
console.log(
  "[Anti-Pattern] PORT ungeprueft:",
  portFalsch,
  "| als Zahl:",
  berechneterPortFalsch
);

// -----------------------------------------------------------------------
// BEST PRACTICE: Einmal pruefen, dann typsicher weiterreichen
// -----------------------------------------------------------------------

export interface Konfiguration {
  readonly port: number;
  readonly hostname: string;
  /** Wie lange ein ausgestelltes Token gueltig bleibt. */
  readonly tokenGueltigkeitMinuten: number;
  /** Schluessel zum Signieren der Tokens - in Produktion IMMER aus der Umgebung. */
  readonly tokenGeheimnis: string;
}

/**
 * Liest eine Pflichtvariable. Fehlt sie, wirft die Funktion sofort -
 * das ist gewollt: Ein falsch konfigurierter Server soll gar nicht erst
 * hochfahren.
 */
function pflicht(env: NodeJS.ProcessEnv, name: string): string {
  // Wegen "noPropertyAccessFromIndexSignature" ist env["NAME"] Pflicht -
  // env.NAME waere ein Compilerfehler. Das ist Absicht: So sieht man sofort,
  // dass hier ein dynamischer Zugriff passiert, der fehlschlagen kann.
  const wert = env[name];
  if (wert === undefined || wert.trim() === "") {
    throw new Error(`Umgebungsvariable ${name} fehlt oder ist leer.`);
  }
  return wert;
}

/** Liest eine optionale Variable mit Standardwert. */
function optional(env: NodeJS.ProcessEnv, name: string, standard: string): string {
  const wert = env[name];
  return wert === undefined || wert.trim() === "" ? standard : wert;
}

/** Liest eine Zahl und prueft, dass es wirklich eine ist. */
function alsZahl(name: string, rohwert: string): number {
  const zahl = Number(rohwert);
  if (!Number.isFinite(zahl)) {
    throw new Error(`Umgebungsvariable ${name} muss eine Zahl sein, war aber "${rohwert}".`);
  }
  return zahl;
}

export function ladeKonfiguration(env: NodeJS.ProcessEnv = process.env): Konfiguration {
  return {
    port: alsZahl("PORT", optional(env, "PORT", "3000")),
    hostname: optional(env, "HOSTNAME", "localhost"),
    tokenGueltigkeitMinuten: alsZahl(
      "TOKEN_GUELTIGKEIT_MINUTEN",
      optional(env, "TOKEN_GUELTIGKEIT_MINUTEN", "60")
    ),
    // In einem echten Projekt gaebe es hier KEINEN Standardwert, sondern
    // pflicht(env, "TOKEN_GEHEIMNIS") - ein Geheimnis gehoert nie in den Code.
    // Fuer dieses Lernprojekt erzeugen wir ersatzweise einen Zufallswert,
    // damit der Server ohne Einrichtung startbar bleibt.
    tokenGeheimnis: optional(
      env,
      "TOKEN_GEHEIMNIS",
      `nur-fuer-lernzwecke-${Math.random().toString(36).slice(2)}`
    ),
  };
}

if (require.main === module) {
  const konfiguration = ladeKonfiguration({ PORT: "8080", HOSTNAME: "127.0.0.1" });
  console.log("[Best Practice] geladene Konfiguration:", {
    ...konfiguration,
    tokenGeheimnis: "(nicht ausgeben)",
  });

  // Fehlerfall: eine kaputte Zahl fuehrt zu einem sofortigen, klaren Abbruch.
  try {
    ladeKonfiguration({ PORT: "achttausend" });
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    console.log("[Best Practice] Fail-Fast beim Start:", text);
  }

  // Und die Pflichtvariante, damit "pflicht" nicht ungenutzt bleibt:
  try {
    pflicht({}, "DATENBANK_URL");
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    console.log("[Best Practice] fehlende Pflichtvariable:", text);
  }
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Uebergib die Konfiguration als Parameter weiter, statt in tieferen Modulen
// erneut auf process.env zuzugreifen. Das hat drei Vorteile: Du siehst an der
// Signatur, was ein Modul wirklich braucht; du kannst es im Test mit einem
// Objektliteral konfigurieren, ohne globale Variablen zu setzen; und es gibt
// genau eine Stelle im Programm, die weiss, wie Konfiguration hereinkommt.
