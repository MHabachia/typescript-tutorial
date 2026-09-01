/**
 * MODUL 3.5 - Discriminated Unions & Vollstaendigkeitspruefung mit never
 * ============================================================================
 * Eine Discriminated Union (auch: Tagged Union) ist eine Union aus
 * Objekttypen, die alle EIN gemeinsames Feld mit einem Literaltyp haben -
 * das Unterscheidungsmerkmal ("Discriminant").
 *
 *   type Zahlung =
 *     | { art: "karte";        kartennummer: string }
 *     | { art: "ueberweisung"; iban: string };
 *
 * Der Gewinn: Sobald du "zahlung.art" pruefst, weiss TypeScript exakt, welche
 * weiteren Felder es gibt - und welche nicht. Zusammen mit "never" im
 * default-Zweig kann dir dann kein Fall mehr durchrutschen.
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: der "Beutel voller optionaler Felder"
// -----------------------------------------------------------------------
// Ein Typ, in dem fast alles optional ist, beschreibt zwar alle gueltigen
// Faelle - aber leider auch alle unsinnigen.
type ZahlungFalsch = {
  art: string; // "string" statt Literalen: jeder Tippfehler ist erlaubt
  kartennummer?: string;
  iban?: string;
  gutscheincode?: string;
};

function beschreibeFalsch(zahlung: ZahlungFalsch): string {
  if (zahlung.art === "karte") {
    // Der Compiler weiss nicht, dass bei "karte" eine Kartennummer da sein
    // MUSS - also brauchst du ueberall Fallbacks.
    return `Karte ${zahlung.kartennummer?.slice(-4) ?? "????"}`;
  }
  if (zahlung.art === "ueberweisung") {
    return `Ueberweisung von ${zahlung.iban ?? "unbekannt"}`;
  }
  return `Unbekannte Zahlungsart: ${zahlung.art}`;
}

// Dieses Objekt ist offensichtlich Unsinn - der Compiler nimmt es klaglos an:
const unsinn: ZahlungFalsch = { art: "karte", iban: "DE02120300000000202051" };
console.log("[Anti-Pattern] widerspruechliches Objekt:", beschreibeFalsch(unsinn));
console.log("[Anti-Pattern] Tippfehler faellt nicht auf:", beschreibeFalsch({ art: "Karte" }));

// -----------------------------------------------------------------------
// BEST PRACTICE: Discriminated Union
// -----------------------------------------------------------------------
type Zahlung =
  | { art: "karte"; kartennummer: string; ablaufmonat: string }
  | { art: "ueberweisung"; iban: string }
  | { art: "gutschein"; code: string; restwert: number };

// Der Wert "never" akzeptiert nichts. Landet hier trotzdem etwas, hast du
// einen Fall vergessen - und der Compiler sagt es dir, nicht der Kunde.
function nichtErreichbar(wert: never): never {
  throw new Error(`Nicht behandelter Fall: ${JSON.stringify(wert)}`);
}

function beschreibe(zahlung: Zahlung): string {
  switch (zahlung.art) {
    case "karte":
      // Hier - und nur hier - gibt es "kartennummer" und "ablaufmonat".
      return `Karte **** ${zahlung.kartennummer.slice(-4)}, gueltig bis ${zahlung.ablaufmonat}`;
    case "ueberweisung":
      // "zahlung.kartennummer" waere hier ein Fehler. Genau so soll es sein.
      return `Ueberweisung von ${zahlung.iban}`;
    case "gutschein":
      return `Gutschein ${zahlung.code} (Restwert ${zahlung.restwert.toFixed(2)} EUR)`;
    default:
      // Alle Faelle behandelt -> "zahlung" ist hier "never".
      return nichtErreichbar(zahlung);
  }
}

const zahlungen: Zahlung[] = [
  { art: "karte", kartennummer: "4242424242424242", ablaufmonat: "12/27" },
  { art: "ueberweisung", iban: "DE02120300000000202051" },
  { art: "gutschein", code: "SOMMER24", restwert: 12.5 },
];

for (const zahlung of zahlungen) {
  console.log("[Best Practice]", beschreibe(zahlung));
}

// Was passiert, wenn die Union waechst?
// Ergaenzt du in "Zahlung" eine Variante { art: "lastschrift"; mandat: string },
// ist "zahlung" im default-Zweig nicht mehr "never", sondern genau diese neue
// Variante. Der Aufruf "nichtErreichbar(zahlung)" schlaegt dann fehl mit:
//   Argument of type '{ art: "lastschrift"; ... }' is not assignable to
//   parameter of type 'never'.
// Ein vergessener Fall wird so zum Compilerfehler statt zum Bug im Betrieb.

// -----------------------------------------------------------------------
// BEST PRACTICE: der Klassiker - ein Ladezustand
// -----------------------------------------------------------------------
// Vier Zustaende, die sich gegenseitig ausschliessen. Als Objekt mit
// "istLaden", "daten" und "fehler" waere jede Kombination moeglich - hier
// gibt es nur die vier, die es wirklich gibt.
type Ladezustand =
  | { status: "leer" }
  | { status: "laedt"; seit: number }
  | { status: "fertig"; eintraege: readonly string[] }
  | { status: "fehler"; meldung: string };

function zeigeZustand(zustand: Ladezustand): string {
  switch (zustand.status) {
    case "leer":
      return "Noch nichts geladen.";
    case "laedt":
      return `Laedt seit ${zustand.seit} ms ...`;
    case "fertig":
      // "noUncheckedIndexedAccess": eintraege[0] ist "string | undefined".
      return `${zustand.eintraege.length} Eintraege, erster: ${zustand.eintraege[0] ?? "-"}`;
    case "fehler":
      return `Fehlgeschlagen: ${zustand.meldung}`;
    default:
      return nichtErreichbar(zustand);
  }
}

const verlauf: Ladezustand[] = [
  { status: "leer" },
  { status: "laedt", seit: 120 },
  { status: "fertig", eintraege: ["Milch", "Brot"] },
  { status: "fehler", meldung: "Zeitueberschreitung" },
];

for (const zustand of verlauf) {
  console.log("[Best Practice] Zustand:", zeigeZustand(zustand));
}

// -----------------------------------------------------------------------
// BEST PRACTICE: Narrowing geht auch ohne switch
// -----------------------------------------------------------------------
function istFertig(zustand: Ladezustand): zustand is Extract<Ladezustand, { status: "fertig" }> {
  return zustand.status === "fertig";
}

const fertige = verlauf.filter(istFertig);
console.log(
  "[Best Practice] nur fertige Zustaende:",
  fertige.map((z) => z.eintraege.join("+")).join(" | ")
);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Drei Regeln, die Discriminated Unions in der Praxis tragfaehig machen:
//
// 1. Das Unterscheidungsfeld steht IMMER an erster Stelle und heisst in der
//    ganzen Codebasis gleich ("art", "status", "kind", "type" - such dir eins
//    aus und bleib dabei). Wer den Typ liest, sieht sofort, worum es geht.
//
// 2. Der Discriminant muss ein Literaltyp sein. Kommen die Objekte aus einer
//    Fabrikfunktion oder einem Array, brauchst du "as const" - sonst wird aus
//    "karte" der weite Typ "string" und das Narrowing faellt in sich zusammen.
//
// 3. Schreib "nichtErreichbar" genau EINMAL zentral und rufe es in jedem
//    default-Zweig auf. Diese eine Zeile verwandelt jede spaetere Erweiterung
//    der Union in eine To-do-Liste, die dir der Compiler ausdruckt.
