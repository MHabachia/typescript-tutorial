/**
 * MODUL 7.3 - Decorators
 * ============================================================================
 * Decorators sind spezielle Funktionen, mit denen man Klassen, Methoden oder
 * Properties um zusaetzliches Verhalten erweitern kann, ohne den eigentlichen
 * Code der Klasse zu veraendern (z.B. fuer Logging, Validierung, Caching).
 * Aktiviert wird dieses Feature ueber "experimentalDecorators": true in der
 * tsconfig.json (siehe Modul 5).
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: Logging manuell in JEDE Methode hineinkopieren
// -----------------------------------------------------------------------
class TaschenrechnerFalsch {
  addiere(a: number, b: number): number {
    console.log(`[Anti-Pattern] Aufruf addiere(${a}, ${b})`); // manuell dupliziert
    return a + b;
  }

  multipliziere(a: number, b: number): number {
    console.log(`[Anti-Pattern] Aufruf multipliziere(${a}, ${b})`); // wieder dupliziert
    return a * b;
  }
}

const taschenrechnerFalsch = new TaschenrechnerFalsch();
taschenrechnerFalsch.addiere(2, 3);
taschenrechnerFalsch.multipliziere(2, 3);
// Problem: Jede neue Methode braucht die gleiche Logging-Zeile von Hand -
// das ist Wiederholung (verstoesst gegen DRY: "Don't Repeat Yourself").

// -----------------------------------------------------------------------
// BEST PRACTICE: Ein wiederverwendbarer Methoden-Decorator
// -----------------------------------------------------------------------

// Ein Decorator ist eine Funktion, die (bei Methoden-Decorators) das
// "target" (Klasse), den Methodennamen und den "PropertyDescriptor" erhaelt.
function protokolliereAufruf(
  _target: object,
  methodenName: string,
  beschreibung: PropertyDescriptor
): PropertyDescriptor {
  const originalMethode = beschreibung.value as (...args: unknown[]) => unknown;

  beschreibung.value = function (this: unknown, ...args: unknown[]): unknown {
    console.log(`[Best Practice] Aufruf ${methodenName}(${args.join(", ")})`);
    const ergebnis = originalMethode.apply(this, args);
    console.log(`[Best Practice] Ergebnis von ${methodenName}:`, ergebnis);
    return ergebnis;
  };

  return beschreibung;
}

// Ein Klassen-Decorator: bekommt den Konstruktor und kann ihn erweitern.
// Hinweis: TypeScript verlangt fuer dieses "Mixin"-Pattern zwingend die
// Signatur "new (...args: any[]) => object" - jede andere Parameterliste
// (z.B. "never[]" oder "unknown[]") lehnt der Compiler hier ab.
function versionsInfo<T extends new (...args: any[]) => object>(konstruktor: T): T {
  return class extends konstruktor {
    version = "1.0.0";
  };
}

@versionsInfo
class Taschenrechner {
  @protokolliereAufruf
  addiere(a: number, b: number): number {
    return a + b;
  }

  @protokolliereAufruf
  multipliziere(a: number, b: number): number {
    return a * b;
  }
}

const taschenrechner = new Taschenrechner();
taschenrechner.addiere(2, 3);
taschenrechner.multipliziere(4, 5);
console.log("[Best Practice] Version:", (taschenrechner as unknown as { version: string }).version);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Decorators sind ideal fuer sogenannte "Cross-Cutting Concerns" - Verhalten,
// das viele verschiedene Klassen/Methoden betrifft (Logging, Caching,
// Validierung, Zugriffskontrolle), aber inhaltlich NICHTS mit der eigentlichen
// Fachlogik zu tun hat. So bleibt die Fachlogik (z.B. `addiere`) sauber und
// lesbar, waehrend das "Drumherum" zentral an EINER Stelle gepflegt wird.
// Hinweis: Diese Syntax nutzt die "experimentellen" (legacy) Decorators von
// TypeScript, die aktuell in der Praxis (z.B. mit Frameworks wie Angular oder
// NestJS) am weitesten verbreitet sind.
