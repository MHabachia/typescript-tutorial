/**
 * MODUL 2.4 / 2.5 - Klassen, Zugriffsmodifizierer, Vererbung und Interfaces
 * ============================================================================
 * Eine Klasse ist ein Bauplan mit eingebautem Verhalten: Sie buendelt Daten
 * (Felder) und die Funktionen, die auf diesen Daten arbeiten (Methoden).
 *
 * Zugriffsmodifizierer regeln, wer ein Feld sehen darf:
 *   public    - jeder (Standard, kann weggelassen werden)
 *   protected - diese Klasse und ihre Unterklassen
 *   private   - nur diese Klasse (Pruefung nur beim Kompilieren!)
 *   #feld     - echtes privates Feld von JavaScript (auch zur LAUFZEIT dicht)
 *
 * Vererbung:
 *   class B extends A    - B erbt Implementierung von A ("ist ein")
 *   class B implements I - B verspricht, die Form von I zu erfuellen
 *   abstract class       - Bauplan, der selbst nicht instanziiert werden kann
 *   override             - Pflicht, wenn eine geerbte Methode ersetzt wird
 *                          (Option "noImplicitOverride")
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: "Objekt mit Funktionen" ohne Kapselung
// -----------------------------------------------------------------------
// Alles ist oeffentlich, alles ist veraenderbar - der Kontostand laesst sich
// von aussen auf jeden beliebigen Wert setzen. "any" steht hier explizit,
// weil "noImplicitAny" aktiv ist.
const kontoFalsch: any = {
  inhaber: "Ada",
  kontostand: 100,
  einzahlen(betrag: number): void {
    this.kontostand += betrag;
  },
};

kontoFalsch.einzahlen(50);
console.log("[Anti-Pattern] Kontostand nach Einzahlung:", kontoFalsch.kontostand);

// Nichts haelt jemanden von diesen beiden Zeilen ab:
kontoFalsch.kontostand = -999999;
kontoFalsch.kontostand = "viel Geld";
console.log("[Anti-Pattern] Kontostand nach Fremdzugriff:", kontoFalsch.kontostand);

// -----------------------------------------------------------------------
// BEST PRACTICE: Klasse mit Kapselung, Parameter-Properties und Gettern
// -----------------------------------------------------------------------

class Konto {
  // static: gehoert zur KLASSE, nicht zur einzelnen Instanz.
  static readonly waehrung = "EUR";
  private static anzahlKonten = 0;

  // #kontostand ist ein echtes privates Feld (ECMAScript). Es ist auch zur
  // Laufzeit nicht von aussen erreichbar - anders als "private".
  #kontostand: number;

  // Parameter-Properties: "public readonly inhaber" im Konstruktor legt das
  // Feld an UND weist es zu. Spart die uebliche Zuweisungszeile.
  constructor(
    public readonly inhaber: string,
    startguthaben: number = 0
  ) {
    this.#kontostand = startguthaben;
    Konto.anzahlKonten += 1;
  }

  // Getter: sieht beim Lesen aus wie ein Feld, ist aber eine Methode.
  get kontostand(): number {
    return this.#kontostand;
  }

  // Setter mit Pruefung - so kann kein unsinniger Wert hineingelangen.
  set kontostand(neuerWert: number) {
    if (neuerWert < 0) {
      throw new Error("Kontostand darf nicht negativ sein.");
    }
    this.#kontostand = neuerWert;
  }

  // protected: Unterklassen duerfen buchen, Fremdcode nicht.
  protected buche(betrag: number): void {
    this.#kontostand += betrag;
  }

  einzahlen(betrag: number): void {
    if (betrag <= 0) {
      throw new Error("Einzahlung muss positiv sein.");
    }
    this.buche(betrag);
  }

  static get anzahl(): number {
    return Konto.anzahlKonten;
  }

  beschreibung(): string {
    return `${this.inhaber}: ${this.#kontostand.toFixed(2)} ${Konto.waehrung}`;
  }
}

const kontoAda = new Konto("Ada", 100);
kontoAda.einzahlen(50);
console.log("[Best Practice]", kontoAda.beschreibung());

// kontoAda.#kontostand;      // Fehler: privates Feld, auch zur Laufzeit
// kontoAda.buche(1000);      // Fehler: 'buche' ist protected
// kontoAda.inhaber = "Bob";  // Fehler: readonly

// Der Setter faengt unsinnige Werte ab:
try {
  kontoAda.kontostand = -1;
} catch (fehler) {
  const text = fehler instanceof Error ? fehler.message : String(fehler);
  console.log("[Best Practice] Setter blockt:", text);
}

// -----------------------------------------------------------------------
// BEST PRACTICE: abstract, extends, implements und override
// -----------------------------------------------------------------------

// Ein Interface beschreibt nur die FORM - keine Implementierung.
interface Verzinsbar {
  readonly zinssatz: number;
  zinsenBerechnen(): number;
}

// Eine abstrakte Klasse ist ein halbfertiger Bauplan: Sie kann fertige
// Methoden mitbringen, aber nicht selbst instanziiert werden.
abstract class Anlage {
  constructor(protected betrag: number) {}

  // abstrakt: jede Unterklasse MUSS diese Methode liefern.
  abstract laufzeitInJahren(): number;

  // fertige Methode, die alle erben:
  endwert(zinssatz: number): number {
    return this.betrag * (1 + zinssatz) ** this.laufzeitInJahren();
  }

  beschreibung(): string {
    return `Anlage ueber ${this.betrag} ${Konto.waehrung}`;
  }
}

// new Anlage(100); // Fehler: Cannot create an instance of an abstract class.

// extends = Implementierung erben. implements = Form versprechen.
// Beides zusammen ist erlaubt und in der Praxis haeufig.
class Festgeld extends Anlage implements Verzinsbar {
  readonly zinssatz = 0.03;

  constructor(
    betrag: number,
    private readonly jahre: number
  ) {
    // super() muss aufgerufen werden, BEVOR "this" benutzt wird.
    super(betrag);
  }

  // "override" ist wegen "noImplicitOverride" Pflicht, sobald eine geerbte
  // Methode ersetzt wird. Vertippst du dich im Namen, meldet der Compiler
  // sofort: "This member cannot have an 'override' modifier because it is
  // not declared in the base class."
  override beschreibung(): string {
    return `${super.beschreibung()} fuer ${this.jahre} Jahre`;
  }

  // Implementierung der abstrakten Methode - hier ohne "override".
  laufzeitInJahren(): number {
    return this.jahre;
  }

  zinsenBerechnen(): number {
    return this.endwert(this.zinssatz) - this.betrag;
  }
}

const festgeld = new Festgeld(1000, 5);
console.log("[Best Practice]", festgeld.beschreibung());
console.log(
  "[Best Practice] Zinsertrag:",
  festgeld.zinsenBerechnen().toFixed(2),
  Konto.waehrung
);

// Weil Festgeld "Verzinsbar" implementiert, passt es ueberall dorthin, wo
// nur die Form verlangt wird:
function zinsreport(anlage: Verzinsbar): string {
  return `Zinssatz ${(anlage.zinssatz * 100).toFixed(1)} % -> ${anlage
    .zinsenBerechnen()
    .toFixed(2)} ${Konto.waehrung}`;
}

console.log("[Best Practice]", zinsreport(festgeld));
console.log("[Best Practice] angelegte Konten:", Konto.anzahl);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// 1) `private` ist eine reine Compiler-Regel. Im kompilierten JavaScript ist
//    das Feld ganz normal erreichbar. `#feld` dagegen ist echtes JavaScript
//    und auch zur Laufzeit dicht. Fuer neue Klassen: `#` bevorzugen.
// 2) Vererbung ist selten die richtige Antwort. Faustregel: Vererbe nur bei
//    einer echten "ist ein"-Beziehung. Fuer "kann etwas" nimm ein Interface,
//    fuer "hat etwas" reiche das Objekt einfach herein (Komposition).
// 3) Parameter-Properties (`constructor(private readonly x: number)`) sparen
//    viel Zeremonie - achte nur darauf, dass der Konstruktor dadurch nicht
//    unuebersichtlich lang wird.
