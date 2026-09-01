/**
 * MODUL 6.4 - "Parse, don't validate"
 * ============================================================================
 * TypeScript-Typen existieren nur beim Kompilieren. Alles, was zur Laufzeit
 * von aussen hereinkommt - HTTP-Body, JSON-Datei, Formular, Umgebungsvariable,
 * Token-Inhalt -, ist zuerst "unknown".
 *
 * Der Unterschied zwischen den beiden Denkweisen:
 *   validate - "ist das Objekt ok?" -> gibt boolean zurueck, der Typ bleibt vage
 *   parse    - "mach mir daraus einen sicheren Typ" -> gibt den Typ ODER einen
 *              Fehler zurueck. Danach ist Ungueltiges gar nicht mehr denkbar.
 *
 * Diese Datei ist Lehrmaterial: sie zeigt einen handgeschriebenen Parser,
 * damit du das Prinzip siehst. In echten Projekten nimmt man dafuer eine
 * Schema-Bibliothek wie Zod oder Valibot - dort bekommst du Typ und
 * Laufzeitpruefung aus derselben Quelle und musst nichts doppelt pflegen.
 */

// -----------------------------------------------------------------------
// ANTI-PATTERN: Fremddaten per Type Assertion "zu einem Typ erklaeren"
// -----------------------------------------------------------------------
interface Registrierung {
  readonly email: string;
  readonly alter: number;
}

// "as" prueft nichts. Es sagt dem Compiler nur: "vertrau mir". Und der
// Compiler vertraut - auch wenn im JSON voelliger Unsinn steht.
const rohdatenFalsch: any = JSON.parse('{"email": 42, "alter": "zwanzig"}');
const anmeldungFalsch = rohdatenFalsch as Registrierung;

console.log("[Anti-Pattern] behaupteter Typ:", anmeldungFalsch);
console.log(
  "[Anti-Pattern] alter + 1 =",
  // Der Compiler denkt "number", tatsaechlich ist es Text:
  ((anmeldungFalsch.alter as unknown) as string) + 1,
  "<- Textverkettung statt Rechnung"
);

// -----------------------------------------------------------------------
// BEST PRACTICE: ein Result-Typ als Discriminated Union
// -----------------------------------------------------------------------
// Kein Werfen, kein "null oder Objekt"-Raten: das Ergebnis sagt selbst, was
// es ist. Der Compiler zwingt dich, den Fehlerfall anzufassen.
type Resultat<T> =
  | { readonly ok: true; readonly wert: T }
  | { readonly ok: false; readonly fehler: ReadonlyArray<string> };

function gelungen<T>(wert: T): Resultat<T> {
  return { ok: true, wert };
}

function fehlgeschlagen<T>(...fehler: string[]): Resultat<T> {
  return { ok: false, fehler };
}

// Kleine Bausteine, aus denen groessere Parser entstehen.
function alsObjekt(wert: unknown): Record<string, unknown> | undefined {
  if (typeof wert !== "object" || wert === null || Array.isArray(wert)) {
    return undefined;
  }
  return wert as Record<string, unknown>;
}

function istEmailFormat(wert: string): boolean {
  // Bewusst simpel: eine vollstaendige E-Mail-Pruefung ist ein eigenes
  // Forschungsgebiet. Fuer Kurszwecke reicht "etwas@etwas.etwas".
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wert);
}

// Der eigentliche Parser: unknown rein, sicherer Typ oder Fehlerliste raus.
function parseRegistrierung(eingabe: unknown): Resultat<Registrierung> {
  const objekt = alsObjekt(eingabe);
  if (objekt === undefined) {
    return fehlgeschlagen("Erwartet wurde ein Objekt.");
  }

  const fehler: string[] = [];

  // Wegen "noPropertyAccessFromIndexSignature" greifen wir auf Index-
  // Signaturen mit Klammern zu: objekt["email"], nicht objekt.email.
  const email = objekt["email"];
  const alter = objekt["alter"];

  if (typeof email !== "string" || !istEmailFormat(email)) {
    fehler.push("Feld 'email' fehlt oder hat kein gueltiges Format.");
  }
  if (typeof alter !== "number" || !Number.isInteger(alter) || alter < 0 || alter > 130) {
    fehler.push("Feld 'alter' muss eine ganze Zahl zwischen 0 und 130 sein.");
  }

  if (fehler.length > 0 || typeof email !== "string" || typeof alter !== "number") {
    return fehlgeschlagen<Registrierung>(...fehler);
  }

  // Ab hier ist der Typ echt - nicht behauptet.
  return gelungen<Registrierung>({ email, alter });
}

function zeige(bezeichnung: string, eingabe: unknown): void {
  const ergebnis = parseRegistrierung(eingabe);
  if (ergebnis.ok) {
    console.log(`[Best Practice] ${bezeichnung}: ok ->`, ergebnis.wert);
  } else {
    console.log(`[Best Practice] ${bezeichnung}: abgelehnt ->`, ergebnis.fehler.join(" "));
  }
}

zeige("gueltige Daten", JSON.parse('{"email":"ada@example.org","alter":36}'));
zeige("falsche Typen", JSON.parse('{"email":42,"alter":"zwanzig"}'));
zeige("kein Objekt", JSON.parse('"nur ein Text"'));
zeige("fehlendes Feld", JSON.parse('{"email":"ada@example.org"}'));

// -----------------------------------------------------------------------
// BEST PRACTICE: dieselbe Technik fuer einen Token-Inhalt (siehe 6.3)
// -----------------------------------------------------------------------
// Der Inhalt eines Tokens kommt genauso von aussen wie ein Formular - auch
// wenn er "nur" aus dem eigenen Cookie stammt. Also: parsen, nicht glauben.
// Achtung, Lehrmaterial: hier wird NUR der bereits geprueft geglaubte Inhalt
// gelesen. Die Signaturpruefung eines echten Tokens erledigt eine Bibliothek
// (z. B. jose fuer JWT) - selbstgebaute Token-Formate sind eine der
// klassischen Fehlerquellen.
interface TokenInhalt {
  readonly benutzerId: string;
  readonly rolle: "mitglied" | "admin";
  readonly laeuftAbUm: number; // Unix-Zeit in Sekunden
}

function parseTokenInhalt(eingabe: unknown, jetztSekunden: number): Resultat<TokenInhalt> {
  const objekt = alsObjekt(eingabe);
  if (objekt === undefined) {
    return fehlgeschlagen("Token-Inhalt ist kein Objekt.");
  }

  const benutzerId = objekt["benutzerId"];
  const rolle = objekt["rolle"];
  const laeuftAbUm = objekt["laeuftAbUm"];

  if (typeof benutzerId !== "string" || benutzerId.length === 0) {
    return fehlgeschlagen("Token ungueltig.");
  }
  if (rolle !== "mitglied" && rolle !== "admin") {
    return fehlgeschlagen("Token ungueltig.");
  }
  if (typeof laeuftAbUm !== "number") {
    return fehlgeschlagen("Token ungueltig.");
  }
  if (laeuftAbUm <= jetztSekunden) {
    // Die Ablaufzeit ist Pflicht, nicht Kuer: ein Token ohne Ablauf ist ein
    // Generalschluessel, den du nie zurueckbekommst.
    return fehlgeschlagen("Token abgelaufen.");
  }

  return gelungen<TokenInhalt>({ benutzerId, rolle, laeuftAbUm });
}

const jetzt = Math.floor(Date.now() / 1000);
const gueltigerInhalt = parseTokenInhalt(
  { benutzerId: "b-1", rolle: "admin", laeuftAbUm: jetzt + 900 },
  jetzt
);
const abgelaufenerInhalt = parseTokenInhalt(
  { benutzerId: "b-1", rolle: "admin", laeuftAbUm: jetzt - 10 },
  jetzt
);

console.log(
  "[Best Practice] Token gueltig:",
  gueltigerInhalt.ok ? gueltigerInhalt.wert.rolle : gueltigerInhalt.fehler.join(" ")
);
console.log(
  "[Best Practice] Token abgelaufen:",
  abgelaufenerInhalt.ok ? abgelaufenerInhalt.wert.rolle : abgelaufenerInhalt.fehler.join(" ")
);

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Parse einmal, ganz aussen - im Controller, im Request-Handler, direkt nach
// JSON.parse. Alles dahinter arbeitet nur noch mit fertigen Typen und muss
// nie wieder "was, wenn das kein string ist?" fragen. Das Gegenteil sieht man
// oft: dieselbe Pruefung liegt in fuenf Funktionen verstreut, vier davon sind
// leicht unterschiedlich, und die fuenfte fehlt genau dort, wo es zaehlt.
// Faustregel: an der Systemgrenze misstrauisch, im Inneren entspannt.
