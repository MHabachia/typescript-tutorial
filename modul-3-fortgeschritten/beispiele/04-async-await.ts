/**
 * MODUL 3.6 - Async/Await & Promises typsicher
 * ============================================================================
 * Ein Promise ist eine Quittung: "Das Ergebnis gibt es spaeter." Der Typ
 * "Promise<T>" sagt dabei genau, WAS spaeter herauskommt.
 *
 *   async function f(): Promise<number> { return 42; }  // Wert wird verpackt
 *   const zahl: number = await f();                     // await packt aus
 *
 * Drei Dinge, die man am Anfang oft falsch macht:
 *   - "await" vergessen (man rechnet dann mit der Quittung statt der Ware)
 *   - Fehler im "catch" fuer einen Error halten (er ist "unknown")
 *   - "Promise.all" nehmen, wo "Promise.allSettled" richtig waere
 */

type Benutzer = { readonly id: number; readonly name: string };

// Kleiner Helfer: wartet kurz und simuliert damit Netzwerkverzoegerung.
// Der Timer laeuft ab und haelt den Prozess danach nicht offen.
function warte(ms: number): Promise<void> {
  return new Promise<void>((aufloesen) => {
    setTimeout(() => aufloesen(), ms);
  });
}

// -----------------------------------------------------------------------
// ANTI-PATTERN: any + vergessenes await
// -----------------------------------------------------------------------
// Der Rueckgabetyp ist wegen "noImplicitAny" ausdruecklich als "any"
// hingeschrieben. Damit weiss niemand mehr, was zurueckkommt - und der
// Compiler kann auch das fehlende "await" nicht bemaengeln.
function ladeBenutzerFalsch(): any {
  return warte(10).then(() => ({ id: 1, name: "Ada" }));
}

async function zeigeAntiPattern(): Promise<void> {
  const ohneAwait = ladeBenutzerFalsch();
  // "ohneAwait" ist ein Promise, kein Benutzer. Mit "any" faellt das nicht auf.
  console.log("[Anti-Pattern] ohne await:", ohneAwait.name); // undefined

  const mitAwait = await ladeBenutzerFalsch();
  console.log("[Anti-Pattern] mit await, aber any:", mitAwait.name);

  // Auch das hier waere erlaubt - und kracht erst zur Laufzeit:
  try {
    console.log("[Anti-Pattern] frei erfunden:", mitAwait.adresse.stadt);
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    console.log("[Anti-Pattern] kracht zur Laufzeit:", text);
  }
}

// -----------------------------------------------------------------------
// BEST PRACTICE: Promise<T> sauber typisieren
// -----------------------------------------------------------------------
// Eine async-Funktion gibt IMMER ein Promise zurueck. Du schreibst deshalb
// "Promise<Benutzer>" hin, nicht "Benutzer" - auch wenn im Rumpf ein reines
// Objekt zurueckgegeben wird. Das Verpacken macht "async" fuer dich.
async function ladeBenutzer(id: number): Promise<Benutzer> {
  await warte(10);
  if (id <= 0) {
    throw new Error(`Ungueltige Benutzer-ID: ${id}`);
  }
  return { id, name: `Benutzer-${id}` };
}

async function zaehleBenutzer(): Promise<number> {
  await warte(5);
  return 3;
}

// Fehler im catch sind "unknown" (useUnknownInCatchVariables). Ein zentraler
// Helfer erspart dir, diese Pruefung ueberall zu wiederholen.
function fehlerText(fehler: unknown): string {
  if (fehler instanceof Error) {
    return fehler.message;
  }
  return `Unbekannter Fehler: ${String(fehler)}`;
}

// -----------------------------------------------------------------------
// BEST PRACTICE: ein typisiertes Result-Pattern
// -----------------------------------------------------------------------
// Statt Fehler zu werfen, gibst du sie als Wert zurueck - als Discriminated
// Union aus Abschnitt 3.5. Der Aufrufer KANN den Fehlerfall dann nicht mehr
// uebersehen, weil er sonst gar nicht an die Daten kommt.
type Ergebnis<T> =
  | { ok: true; wert: T }
  | { ok: false; fehler: string };

async function ladeSicher(id: number): Promise<Ergebnis<Benutzer>> {
  try {
    return { ok: true, wert: await ladeBenutzer(id) };
  } catch (fehler) {
    return { ok: false, fehler: fehlerText(fehler) };
  }
}

async function zeigeBestPractice(): Promise<void> {
  // --- einzelner Aufruf mit try/catch ---
  try {
    const benutzer = await ladeBenutzer(1);
    console.log("[Best Practice] geladen:", benutzer.id, benutzer.name);
    await ladeBenutzer(-1); // wirft
  } catch (fehler) {
    console.log("[Best Practice] gefangen:", fehlerText(fehler));
  }

  // --- Promise.all: parallel, aber alles oder nichts ---
  // Gleiche Typen -> Array. Der erste Fehler bricht alles ab.
  const dreiBenutzer: Benutzer[] = await Promise.all([
    ladeBenutzer(1),
    ladeBenutzer(2),
    ladeBenutzer(3),
  ]);
  console.log(
    "[Best Practice] Promise.all:",
    dreiBenutzer.map((b) => b.name).join(", ")
  );

  // Gemischte Typen -> Tupel. TypeScript kennt jede Position einzeln.
  const [ersterBenutzer, anzahl] = await Promise.all([ladeBenutzer(9), zaehleBenutzer()]);
  console.log("[Best Practice] Tupel:", ersterBenutzer.name, "von", anzahl);

  // --- Promise.allSettled: jedes Ergebnis einzeln bewerten ---
  // Der Rueckgabetyp ist selbst eine Discriminated Union mit dem
  // Unterscheidungsfeld "status" - Narrowing wie in Abschnitt 3.5.
  const ergebnisse = await Promise.allSettled([ladeBenutzer(4), ladeBenutzer(-2), ladeBenutzer(5)]);
  for (const ergebnis of ergebnisse) {
    if (ergebnis.status === "fulfilled") {
      console.log("[Best Practice] allSettled ok:", ergebnis.value.name);
    } else {
      console.log("[Best Practice] allSettled fehlgeschlagen:", fehlerText(ergebnis.reason));
    }
  }

  // --- Result-Pattern: Fehler als Wert ---
  for (const id of [7, -7]) {
    const ergebnis = await ladeSicher(id);
    if (ergebnis.ok) {
      console.log("[Best Practice] Result ok:", ergebnis.wert.name);
    } else {
      // "ergebnis.wert" gibt es hier gar nicht - der Fehlerfall ist erzwungen.
      console.log("[Best Practice] Result fehlerhaft:", ergebnis.fehler);
    }
  }
}

// -----------------------------------------------------------------------
// Einstiegspunkt: bei CommonJS gibt es kein await auf oberster Ebene.
// -----------------------------------------------------------------------
async function main(): Promise<void> {
  await zeigeAntiPattern();
  await zeigeBestPractice();
  console.log("[Best Practice] fertig - keine offenen Timer, das Skript endet.");
}

main().catch((fehler: unknown) => {
  console.error("[Fehler]", fehlerText(fehler));
  process.exitCode = 1;
});

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// "await" in einer Schleife ist der haeufigste Performance-Fehler in
// async-Code: Zehn Anfragen zu je 100 ms brauchen nacheinander eine ganze
// Sekunde, parallel nur 100 ms.
//
//   // langsam - eine nach der anderen:
//   for (const id of ids) { ergebnisse.push(await ladeBenutzer(id)); }
//
//   // schnell - alle gleichzeitig starten, dann gemeinsam warten:
//   const ergebnisse = await Promise.all(ids.map(ladeBenutzer));
//
// Aber: Nacheinander ist richtig, wenn ein Schritt das Ergebnis des vorigen
// braucht oder wenn du eine fremde API nicht ueberrennen darfst. Und wenn
// Teilergebnisse zaehlen, nimm "Promise.allSettled" statt "Promise.all" -
// sonst verlierst du neun gute Antworten wegen einer schlechten.
