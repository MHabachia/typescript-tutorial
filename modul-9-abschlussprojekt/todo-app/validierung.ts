/**
 * MODUL 9 - validierung.ts: "Parse, don't validate"
 * ============================================================================
 * Alles, was von aussen hereinkommt (Request-Body, JSON, Formulardaten), ist
 * zunaechst "unknown". Diese Datei enthaelt die einzigen Funktionen im
 * Projekt, die aus "unknown" einen vertrauenswuerdigen Typ machen. Ab da
 * arbeitet der Rest der Anwendung nur noch mit sauberen Typen.
 *
 * Verwendete Konzepte aus dem Kurs:
 *   Modul 1.5 - unknown statt any
 *   Modul 3.4 - Type Guards und Narrowing
 *   Modul 6.4 - Eingaben an der Systemgrenze pruefen
 */

import type { Ergebnis, LoginDTO, NeuesTodoDTO, TodoAenderungDTO } from "./types";
import { erfolg, fehlschlag } from "./types";

const MAX_TITEL_LAENGE = 200;

// -----------------------------------------------------------------------
// ANTI-PATTERN: Fremddaten einfach per "as" zu einem Typ erklaeren
// -----------------------------------------------------------------------
// Ein "as" ist eine BEHAUPTUNG, keine Pruefung. Der Compiler glaubt sie -
// und schweigt, wenn die Daten in Wirklichkeit ganz anders aussehen.
function leseTitelFalsch(rohdaten: unknown): string {
  const body = rohdaten as { titel: string };
  return body.titel;
}

console.log("[Anti-Pattern] Titel aus {}:", leseTitelFalsch({}));
// undefined - obwohl der Rueckgabetyp "string" verspricht. Der naechste
// Aufruf von .trim() oder .length auf diesem Wert kracht zur Laufzeit.

// -----------------------------------------------------------------------
// BEST PRACTICE: Kleine Bausteine als Type Guards
// -----------------------------------------------------------------------
// "wert is Record<string, unknown>" ist ein Type Predicate: Gibt die Funktion
// true zurueck, weiss TypeScript ab da, dass der Wert diesen Typ hat.
function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === "object" && wert !== null && !Array.isArray(wert);
}

function istNichtLeererText(wert: unknown): wert is string {
  return typeof wert === "string" && wert.trim().length > 0;
}

// -----------------------------------------------------------------------
// BEST PRACTICE: Parser, die "unknown" in sichere Typen ueberfuehren
// -----------------------------------------------------------------------

export function parseNeuesTodo(rohdaten: unknown): Ergebnis<NeuesTodoDTO> {
  if (!istObjekt(rohdaten)) {
    return fehlschlag("Der Request-Body muss ein JSON-Objekt sein.");
  }
  const titel = rohdaten["titel"];
  if (!istNichtLeererText(titel)) {
    return fehlschlag("Feld 'titel' ist erforderlich und darf nicht leer sein.");
  }
  if (titel.length > MAX_TITEL_LAENGE) {
    return fehlschlag(`Feld 'titel' darf hoechstens ${MAX_TITEL_LAENGE} Zeichen haben.`);
  }
  // Erst hier entsteht der saubere Typ - inklusive Normalisierung (trim).
  return erfolg({ titel: titel.trim() });
}

export function parseTodoAenderung(rohdaten: unknown): Ergebnis<TodoAenderungDTO> {
  if (!istObjekt(rohdaten)) {
    return fehlschlag("Der Request-Body muss ein JSON-Objekt sein.");
  }

  const titel = rohdaten["titel"];
  const erledigt = rohdaten["erledigt"];

  if (titel === undefined && erledigt === undefined) {
    return fehlschlag("Mindestens eines der Felder 'titel' oder 'erledigt' wird benoetigt.");
  }
  if (titel !== undefined && !istNichtLeererText(titel)) {
    return fehlschlag("Feld 'titel' muss ein nicht leerer Text sein.");
  }
  if (erledigt !== undefined && typeof erledigt !== "boolean") {
    return fehlschlag("Feld 'erledigt' muss true oder false sein.");
  }

  // Wichtig wegen "exactOptionalPropertyTypes": ein optionales Feld darf
  // NICHT explizit auf undefined gesetzt werden. Deshalb bauen wir das
  // Objekt schrittweise auf, statt { titel: ..., erledigt: ... } zu schreiben.
  const aenderung: { titel?: string; erledigt?: boolean } = {};
  if (istNichtLeererText(titel)) {
    aenderung.titel = titel.trim();
  }
  if (typeof erledigt === "boolean") {
    aenderung.erledigt = erledigt;
  }
  return erfolg(aenderung);
}

export function parseLoginDaten(rohdaten: unknown): Ergebnis<LoginDTO> {
  if (!istObjekt(rohdaten)) {
    return fehlschlag("Der Request-Body muss ein JSON-Objekt sein.");
  }
  const benutzername = rohdaten["benutzername"];
  const passwort = rohdaten["passwort"];

  if (!istNichtLeererText(benutzername) || !istNichtLeererText(passwort)) {
    // Bewusst eine gemeinsame, unspezifische Meldung: Sie verraet nicht,
    // welches der beiden Felder falsch war (siehe Modul 6.6).
    return fehlschlag("Felder 'benutzername' und 'passwort' sind erforderlich.");
  }
  return erfolg({ benutzername: benutzername.trim(), passwort });
}

/** Wandelt einen JSON-Text sicher in "unknown" um - ohne je zu werfen. */
export function parseJson(text: string): Ergebnis<unknown> {
  if (text.trim() === "") {
    return erfolg({});
  }
  try {
    return erfolg(JSON.parse(text) as unknown);
  } catch (fehler) {
    const grund = fehler instanceof Error ? fehler.message : String(fehler);
    return fehlschlag(`Ungueltiges JSON: ${grund}`);
  }
}

if (require.main === module) {
  console.log("[Best Practice] gueltiges Todo:", parseNeuesTodo({ titel: "  Einkaufen  " }));
  console.log("[Best Practice] leerer Titel:", parseNeuesTodo({ titel: "   " }));
  console.log("[Best Practice] kein Objekt:", parseNeuesTodo("Einkaufen"));
  console.log("[Best Practice] Aenderung:", parseTodoAenderung({ erledigt: true }));
  console.log("[Best Practice] leere Aenderung:", parseTodoAenderung({}));
  console.log("[Best Practice] Login:", parseLoginDaten({ benutzername: "admin", passwort: "x" }));
  console.log("[Best Practice] kaputtes JSON:", parseJson("{nicht json"));
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Fuer echte Projekte schreibt man solche Parser nicht von Hand, sondern
// nutzt eine Schema-Bibliothek wie Zod oder Valibot: Dort definierst du das
// Schema einmal, bekommst die Pruefung zur Laufzeit UND den passenden
// TypeScript-Typ automatisch dazu. Das Prinzip bleibt exakt dasselbe wie
// hier: An genau EINER Stelle wird aus "unknown" ein vertrauenswuerdiger
// Typ - und ueberall dahinter kann sich der restliche Code darauf verlassen.
