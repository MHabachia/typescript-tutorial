/**
 * MODUL 9 - types.ts: Die zentralen Typen der Todo-App
 * ============================================================================
 * Dies ist die "Source of Truth" der gesamten Anwendung. Alle anderen Dateien
 * (store, auth, validierung, server) importieren ausschliesslich VON HIER und
 * definieren keine eigenen Datenstrukturen. Diese Datei importiert dafuer
 * nichts aus dem Projekt - so kann keine zirkulaere Abhaengigkeit entstehen.
 *
 * Verwendete Konzepte aus dem Kurs:
 *   Modul 2 - Interfaces, readonly
 *   Modul 3 - Literal Unions
 *   Modul 6 - Branded Types (nominale Typisierung)
 *   Modul 7 - Utility Types (Pick, Omit, Partial)
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: Datenstrukturen ohne festen Typ
// -----------------------------------------------------------------------
// Wegen der strikten tsconfig muessen wir "any" explizit hinschreiben -
// und genau das ist der Punkt: der Compiler prueft danach gar nichts mehr.
const todoFalsch: any = { titel: "Einkaufen", fertig: false };
todoFalsch.erledigt = "ja"; // Tippfehler ("fertig" vs. "erledigt") UND falscher
// Typ (string statt boolean) - beides bleibt unbemerkt bis zur Laufzeit.
console.log("[Anti-Pattern] todoFalsch:", todoFalsch);

// -----------------------------------------------------------------------
// BEST PRACTICE: Branded Types fuer IDs (Modul 6)
// -----------------------------------------------------------------------
// "type TodoId = string" waere zu schwach: Dann liessen sich Benutzer-IDs
// und Todo-IDs beliebig verwechseln. Die "Marke" existiert nur im Typsystem
// und verschwindet beim Kompilieren restlos - zur Laufzeit sind es Strings.
export type BenutzerId = string & { readonly __marke: "BenutzerId" };
export type TodoId = string & { readonly __marke: "TodoId" };

export function alsBenutzerId(wert: string): BenutzerId {
  return wert as BenutzerId;
}

export function alsTodoId(wert: string): TodoId {
  return wert as TodoId;
}

// -----------------------------------------------------------------------
// BEST PRACTICE: Fachliche Typen
// -----------------------------------------------------------------------

// Literal Union statt freiem string: nur diese beiden Werte sind gueltig.
export type Rolle = "admin" | "user";

export interface Benutzer {
  readonly id: BenutzerId;
  readonly benutzername: string;
  /** Format: "<salt>:<hash>" - siehe auth.ts. Niemals nach aussen geben! */
  readonly passwortHash: string;
  readonly rolle: Rolle;
}

export interface Todo {
  readonly id: TodoId;
  readonly titel: string;
  readonly erledigt: boolean;
  readonly besitzerId: BenutzerId;
  readonly erstelltAm: string;
}

// -----------------------------------------------------------------------
// BEST PRACTICE: DTOs aus dem Kerntyp ableiten (Modul 7)
// -----------------------------------------------------------------------
// DTO = "Data Transfer Object": die Form, in der Daten ueber die
// Systemgrenze gehen. Sie wird IMMER abgeleitet, nie abgetippt.

/** Was ein Client beim Anlegen schicken darf - alles andere setzt der Server. */
export type NeuesTodoDTO = Pick<Todo, "titel">;

/** Was ein Client aendern darf: Titel und/oder Erledigt-Status. */
export type TodoAenderungDTO = Partial<Pick<Todo, "titel" | "erledigt">>;

/** Login-Daten aus dem Request-Body. */
export interface LoginDTO {
  readonly benutzername: string;
  readonly passwort: string;
}

/** Ein Benutzer, wie er nach aussen gehen darf - garantiert ohne Passwort. */
export type OeffentlicherBenutzer = Omit<Benutzer, "passwortHash">;

// -----------------------------------------------------------------------
// BEST PRACTICE: Ein Ergebnis-Typ als Discriminated Union (Modul 3)
// -----------------------------------------------------------------------
// Jede Operation, die scheitern kann, gibt dieses Format zurueck. Der
// Aufrufer MUSS erst "ok" pruefen, bevor er an "wert" kommt - vergessene
// Fehlerbehandlung ist damit ein Compilerfehler statt eines Bugs.
export type Ergebnis<T> =
  | { readonly ok: true; readonly wert: T }
  | { readonly ok: false; readonly fehler: string };

export function erfolg<T>(wert: T): Ergebnis<T> {
  return { ok: true, wert };
}

export function fehlschlag<T>(fehler: string): Ergebnis<T> {
  return { ok: false, fehler };
}

if (require.main === module) {
  const beispielTodo: Todo = {
    id: alsTodoId("t-1"),
    titel: "TypeScript Zero to Hero durcharbeiten",
    erledigt: false,
    besitzerId: alsBenutzerId("b-1"),
    erstelltAm: new Date().toISOString(),
  };
  console.log("[Best Practice] beispielTodo:", beispielTodo);

  const geglueckt = erfolg<NeuesTodoDTO>({ titel: "Neues Todo" });
  const gescheitert = fehlschlag<NeuesTodoDTO>("titel ist erforderlich.");
  console.log("[Best Practice] Ergebnis (ok):", geglueckt);
  console.log("[Best Practice] Ergebnis (Fehler):", gescheitert);

  // Der Compiler laesst den Zugriff auf ".wert" erst nach der Pruefung zu:
  if (geglueckt.ok) {
    console.log("[Best Practice] Titel aus dem Ergebnis:", geglueckt.wert.titel);
  }
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Halte Typen strikt getrennt von Logik: Diese Datei importiert bewusst
// NICHTS aus dem Projekt, alle anderen importieren aus ihr. Dadurch gibt es
// nur eine Richtung im Abhaengigkeitsgraphen - und damit keine zirkulaeren
// Importe, die in groesseren Node-Projekten sonst zu sehr schwer
// auffindbaren "undefined ist kein Konstruktor"-Fehlern fuehren.
