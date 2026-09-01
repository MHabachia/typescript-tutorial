/**
 * MODUL 9 - store.ts: Ein generischer, typsicherer Datenspeicher
 * ============================================================================
 * Eine einzige Store-Klasse verwaltet beliebige Objekte, solange sie ein
 * "id"-Feld haben - hier fuer Todos und Benutzer gleichermassen einsetzbar.
 *
 * Verwendete Konzepte aus dem Kurs:
 *   Modul 7.1 - Generics
 *   Modul 7.2 - Constraints und Lookup Types (T["id"])
 *   Modul 7.3 - Utility Types (Partial, Omit)
 */

import type { Todo } from "./types";
import { alsBenutzerId, alsTodoId } from "./types";

// -----------------------------------------------------------------------
// ANTI-PATTERN: Ein globales, untypisiertes Array als "Datenbank"
// -----------------------------------------------------------------------
const todosFalsch: any[] = [];
todosFalsch.push({ titel: "Kaffee kochen" }); // keine id, kein erledigt-Feld -
// wird trotzdem klaglos akzeptiert, weil alles "any" ist.
console.log("[Anti-Pattern] todosFalsch:", todosFalsch);

// -----------------------------------------------------------------------
// BEST PRACTICE: Generische Store-Klasse
// -----------------------------------------------------------------------
/**
 * Verwaltet Objekte mit einem id-Feld.
 *
 * Der Constraint `T extends { readonly id: string }` sagt: "T darf alles
 * sein, solange es eine id hat". Der Lookup Type `T["id"]` sorgt dafuer,
 * dass gebrandete IDs (TodoId, BenutzerId) erhalten bleiben - man kann also
 * keine BenutzerId an einen Todo-Store uebergeben.
 */
export class Store<T extends { readonly id: string }> {
  private readonly daten = new Map<string, T>();

  alle(): readonly T[] {
    return Array.from(this.daten.values());
  }

  /** Alle Eintraege, die eine Bedingung erfuellen. */
  filtere(bedingung: (eintrag: T) => boolean): readonly T[] {
    return this.alle().filter(bedingung);
  }

  findeById(id: T["id"]): T | undefined {
    return this.daten.get(id);
  }

  speichere(element: T): T {
    this.daten.set(element.id, element);
    return element;
  }

  /**
   * Aktualisiert einzelne Felder. Dank `Partial<Omit<T, "id">>` sind alle
   * Felder optional - aber die id laesst sich nicht ueberschreiben.
   */
  aktualisiere(id: T["id"], aenderung: Partial<Omit<T, "id">>): T | undefined {
    const vorhanden = this.daten.get(id);
    if (vorhanden === undefined) {
      return undefined;
    }
    const aktualisiert = { ...vorhanden, ...aenderung } as T;
    this.daten.set(id, aktualisiert);
    return aktualisiert;
  }

  loesche(id: T["id"]): boolean {
    return this.daten.delete(id);
  }

  get anzahl(): number {
    return this.daten.size;
  }
}

/** Erzeugt eine praktisch eindeutige ID. In echten Projekten: randomUUID(). */
export function erzeugeId(praefix: string): string {
  return `${praefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

if (require.main === module) {
  const todoStore = new Store<Todo>();

  const ersteId = alsTodoId(erzeugeId("todo"));
  todoStore.speichere({
    id: ersteId,
    titel: "TypeScript lernen",
    erledigt: false,
    besitzerId: alsBenutzerId("b-1"),
    erstelltAm: new Date().toISOString(),
  });
  todoStore.speichere({
    id: alsTodoId(erzeugeId("todo")),
    titel: "Kaffee kochen",
    erledigt: true,
    besitzerId: alsBenutzerId("b-2"),
    erstelltAm: new Date().toISOString(),
  });

  console.log("[Best Practice] Anzahl:", todoStore.anzahl);
  console.log(
    "[Best Practice] offene Todos:",
    todoStore.filtere((todo) => !todo.erledigt).map((todo) => todo.titel)
  );

  todoStore.aktualisiere(ersteId, { erledigt: true });
  console.log("[Best Practice] nach Aktualisierung:", todoStore.findeById(ersteId)?.erledigt);

  console.log("[Best Practice] geloescht:", todoStore.loesche(ersteId), "| Rest:", todoStore.anzahl);
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Dieser Store haelt alles im Arbeitsspeicher - beim Neustart ist alles weg.
// Entscheidend ist aber die Schnittstelle: alle / findeById / speichere /
// aktualisiere / loesche. Tauschst du die Map spaeter gegen eine echte
// Datenbank aus, bleibt diese Schnittstelle gleich, und server.ts muss nicht
// angefasst werden. Genau das ist der Kern des "Repository Pattern": Die
// Fachlogik kennt nur die Schnittstelle, nie die Speichertechnik.
