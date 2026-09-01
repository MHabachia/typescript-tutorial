/**
 * MODUL 5.4 - Haeufige ESLint-Befunde und ihre saubere Loesung
 * ============================================================================
 * Der Compiler (tsc) und der Linter (ESLint) beantworten zwei verschiedene
 * Fragen:
 *
 *   tsc    : "Passt das ueberhaupt zusammen?"   -> Typfehler, Code ist KAPUTT
 *   ESLint : "Ist das eine gute Idee?"          -> Stil/Risiko, Code LAEUFT
 *
 * Beide Werkzeuge zusammen ergeben erst das ganze Bild. Diese Datei zeigt die
 * Befunde, die dir in der Konsole von "npm run lint" (und als gelbe bzw. rote
 * Wellenlinie in IntelliJ) am haeufigsten begegnen.
 *
 * Alle Zeilen, die ESLint als FEHLER melden wuerde, sind auskommentiert - sonst
 * wuerde "npm run lint" in diesem Repo rot. Kommentiere sie zum Ausprobieren
 * kurz ein, lass "npm run lint" laufen und kommentiere sie wieder aus.
 */

import { EOL } from "node:os";

// ===========================================================================
// 1) @typescript-eslint/no-explicit-any
//    "Unexpected any. Specify a different type"
// ===========================================================================

// ANTI-PATTERN: "any" als Universalloesung. In diesem Repo steht die Regel
// bewusst auf "warn" (siehe eslint.config.js), damit die Anti-Pattern-Kapitel
// ueberhaupt laufen - in einem echten Projekt gehoert sie auf "error".
function ersterEintragFalsch(liste: any): any {
  return liste[0];
}
console.log("[Anti-Pattern] erster Eintrag:", ersterEintragFalsch([1, 2, 3]));
// Der Rueckgabewert ist "any" - ab hier prueft TypeScript im ganzen
// Aufrufpfad nichts mehr. Der Linter warnt genau deshalb.

// ANTI-PATTERN: die Warnung wegdruecken statt sie zu beheben.
// Ein "eslint-disable"-Kommentar loescht nur die Meldung, nicht das Problem.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rohdaten: any = JSON.parse('{"treffer":2}');
console.log("[Anti-Pattern] Treffer (ungeprueft):", rohdaten.treffer);

// BEST PRACTICE: ein Generic sagt genau das, was "any" nur andeuten wollte -
// "irgendein Typ, aber durchgehend derselbe".
function ersterEintrag<T>(liste: readonly T[]): T | undefined {
  // noUncheckedIndexedAccess macht daraus ehrlicherweise "T | undefined".
  return liste[0];
}
console.log("[Best Practice] erster Eintrag:", ersterEintrag([1, 2, 3]));
console.log("[Best Practice] leere Liste:", ersterEintrag<string>([]));

// ===========================================================================
// 2) @typescript-eslint/no-unused-vars
//    "'x' is assigned a value but never used"
// ===========================================================================

// Der haeufigste Befund ueberhaupt - meist ein Rest vom Umbauen:
//   const zwischenergebnis = berechne();   // wird nirgends mehr gelesen
//   import { readFile } from "node:fs";    // Import ohne Verwendung
//
// Hier faellt der Befund doppelt an: ESLint warnt, und weil dieses Repo
// "noUnusedLocals" gesetzt hat, bricht schon der Compiler ab
// (TS6133: 'zwischenergebnis' is declared but its value is never read).

// BEST PRACTICE: Loeschen. Wirklich. Der Code steht in der Versionsverwaltung -
// du kannst ihn jederzeit zurueckholen. Was du behalten MUSST (z. B. weil eine
// Callback-Signatur den Parameter vorgibt), bekommt einen Unterstrich:
const namen = ["Ada", "Grace", "Alan"];
const nummeriert = namen.map((name, index) => `${index + 1}. ${name}`);
const nurNamen = namen.map((name, _index) => name.toUpperCase());
console.log("[Best Practice] nummeriert:", nummeriert.join(", "));
console.log("[Best Practice] nur Namen:", nurNamen.join(", "));

// Achtung, ein feiner Unterschied - und ein gutes Beispiel dafuer, dass
// Compiler und Linter zwei verschiedene Werkzeuge sind: TypeScript ignoriert
// den Unterstrich in "_index" von Haus aus, ESLint NICHT. Wenn du die
// Konvention auch im Linter willst, konfigurierst du sie in eslint.config.js:
//   '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
// Genau deshalb meldet "npm run lint" fuer diese Datei noch eine Warnung.

// ===========================================================================
// 3) @typescript-eslint/ban-ts-comment
//    'Use "@ts-expect-error" instead of "@ts-ignore" ...'
// ===========================================================================

// ANTI-PATTERN: "@ts-ignore" schaltet die Pruefung der naechsten Zeile ab -
// und zwar fuer immer, auch wenn der Fehler laengst behoben ist:
//   // @ts-ignore
//   const zahl: number = "42";
//
// ESLint meldet: Use "@ts-expect-error" instead of "@ts-ignore", as
// "@ts-ignore" will do nothing if the following line is error-free.

// BEST PRACTICE: Erste Wahl ist immer, den Fehler wirklich zu beheben.
const zahl = Number("42");
console.log("[Best Practice] geparste Zahl:", zahl);

// Muss doch einmal etwas unterdrueckt werden, nimm "@ts-expect-error" mit
// Begruendung: Sobald die Zeile fehlerfrei wird, meldet der Compiler den
// ueberfluessigen Kommentar - die Ausnahme raeumt sich also selbst auf.
//   // @ts-expect-error Bibliothek liefert bis v3 falsche Typen, siehe #142
//   veralteteFunktion(42);

// ===========================================================================
// 4) @typescript-eslint/no-require-imports
//    "A `require()` style import is forbidden"
// ===========================================================================

// ANTI-PATTERN: der alte CommonJS-Stil mitten im TypeScript-Code:
//   const os = require("node:os");
//
// Das Ergebnis von require() ist "any" - du verlierst jede Typinformation,
// noch bevor du die erste Zeile geschrieben hast.

// BEST PRACTICE: ES-Modul-Syntax (siehe Import ganz oben in dieser Datei).
// TypeScript kompiliert sie fuer uns trotzdem nach CommonJS - dafuer sorgt
// "module": "CommonJS" in der tsconfig.json.
console.log("[Best Practice] Zeilenende als Code:", JSON.stringify(EOL));

// ===========================================================================
// 5) @typescript-eslint/no-empty-object-type
//    "An empty interface declaration allows any non-nullish value ..."
// ===========================================================================

// ANTI-PATTERN: ein leeres Interface als Platzhalter:
//   interface Optionen {}
//
// Das sieht nach "leeres Objekt" aus, bedeutet aber "alles ausser null und
// undefined" - auch die Zahl 0 und der Text "" passen hinein.

// BEST PRACTICE: sag, was du meinst.
type LeeresObjekt = Record<string, never>; // wirklich ein Objekt ohne Inhalt
type IrgendeinObjekt = object; // irgendein Objekt
type IrgendeinWert = unknown; // wirklich alles - dann aber erst pruefen

const leer: LeeresObjekt = {};
const objekt: IrgendeinObjekt = { a: 1 };
const wert: IrgendeinWert = 0;
console.log(
  "[Best Practice] leer/objekt/wert:",
  JSON.stringify(leer),
  JSON.stringify(objekt),
  typeof wert
);

// ===========================================================================
// 6) @typescript-eslint/no-unsafe-function-type
//    "The `Function` type accepts any function-like value."
// ===========================================================================

// ANTI-PATTERN: "Function" als Typ fuer einen Callback:
//   function fuehreAus(rueckruf: Function): void { rueckruf(); }
//
// "Function" sagt nur "irgendetwas Aufrufbares" - weder Parameter noch
// Rueckgabewert werden geprueft. Es ist das "any" unter den Funktionstypen.

// BEST PRACTICE: die Signatur hinschreiben.
type Formatierer = (wert: number) => string;

function formatiereAlle(werte: readonly number[], formatiere: Formatierer): string[] {
  return werte.map(formatiere);
}

const alsEuro: Formatierer = (wert) => `${wert.toFixed(2)} EUR`;
console.log("[Best Practice] formatiert:", formatiereAlle([1, 2.5], alsEuro).join(" | "));

// ===========================================================================
// PROFI-TIPP
// ===========================================================================
// "// eslint-disable-next-line <regel>" ist ein Skalpell, kein Radiergummi.
// Drei Regeln fuer den Umgang damit:
//
//   1. Immer die konkrete Regel nennen. Ein nacktes "// eslint-disable-next-line"
//      schaltet ALLE Regeln fuer diese Zeile ab - auch die, die morgen dazukommt.
//   2. Immer eine Begruendung dahinterschreiben, warum die Ausnahme noetig ist.
//   3. Nie "/* eslint-disable */" an den Dateianfang setzen. Damit ist die
//      Datei fuer immer aus der Qualitaetspruefung raus, und niemand merkt es.
//
// Und der wichtigste Punkt: Lass "npm run lint" nicht nur lokal laufen, sondern
// auch in der CI-Pipeline (Modul 8). Eine Regel, die man ignorieren kann, ist
// keine Regel - sie ist eine Meinung.
