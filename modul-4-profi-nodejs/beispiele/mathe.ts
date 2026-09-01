/**
 * MODUL 4 - Hilfsmodul: mathe.ts (named exports)
 * ============================================================================
 * Dieses Modul demonstriert "named exports": mehrere benannte Dinge, die von
 * aussen einzeln importiert werden koennen. Wer dieses Modul benutzt, sucht
 * sich per "import { addiere } from './mathe'" genau das heraus, was er
 * braucht - der Rest bleibt unangetastet.
 *
 * Faustregel: Ein Modul ist eine Datei. Was nicht exportiert wird, ist privat
 * und von aussen unsichtbar - ganz ohne "private"-Schluesselwort.
 */

// Ein Typ kann genauso exportiert werden wie eine Funktion. "export type"
// macht dabei ausdruecklich klar: Das hier existiert NUR beim Kompilieren,
// im fertigen JavaScript ist davon nichts mehr uebrig.
export type Rechenoperation = (a: number, b: number) => number;

/** Beschreibt ein Rechenergebnis inklusive der verwendeten Operation. */
export interface Rechenergebnis {
  readonly operation: string;
  readonly wert: number;
}

// --- Named exports: direkt am Schluesselwort "export" ----------------------

export const addiere: Rechenoperation = (a, b) => a + b;

export const multipliziere: Rechenoperation = (a, b) => a * b;

/**
 * Teilt a durch b. Bei b === 0 gibt es kein sinnvolles Ergebnis - deshalb
 * "number | undefined" statt eines stillen NaN.
 */
export function dividiere(a: number, b: number): number | undefined {
  return b === 0 ? undefined : a / b;
}

// --- Privat: NICHT exportiert, also von aussen nicht erreichbar ------------

function runde(wert: number, stellen: number): number {
  const faktor = 10 ** stellen;
  return Math.round(wert * faktor) / faktor;
}

/** Berechnet den Mittelwert und rundet ihn auf zwei Stellen. */
export function mittelwert(zahlen: readonly number[]): Rechenergebnis {
  if (zahlen.length === 0) {
    return { operation: "mittelwert", wert: 0 };
  }
  const summe = zahlen.reduce((a, b) => a + b, 0);
  return { operation: "mittelwert", wert: runde(summe / zahlen.length, 2) };
}

// Alternative Schreibweise: alles am Dateiende in einer Liste exportieren.
// Beide Varianten sind gleichwertig - such dir eine aus und bleib dabei.
const PI_GERUNDET = 3.14;
export { PI_GERUNDET };

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Named exports sind der Standard fuer Bibliotheks-Module. Sie haben einen
// unterschaetzten Vorteil: Der Name steht in der Datei, nicht beim Aufrufer.
// Benennst du "addiere" spaeter um, meldet der Compiler jede einzelne
// Importstelle. Bei einem Default-Export darf sich jeder Aufrufer einen
// eigenen Namen ausdenken - dann findet dich keine Umbenennung mehr.
