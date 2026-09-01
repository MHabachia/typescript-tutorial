/**
 * MODUL 4.6 - Ein eigener HTTP-Server mit node:http
 * ============================================================================
 * Node.js bringt einen kompletten HTTP-Server mit - ohne Express, ohne
 * irgendein Paket. Zwei Typen musst du dafuer kennen:
 *
 *   IncomingMessage - die Anfrage  (Methode, URL, Header, Body als Stream)
 *   ServerResponse  - die Antwort  (Statuscode, Header, Body)
 *
 * Bild dazu: Der Server ist ein Postschalter. IncomingMessage ist der
 * Briefumschlag, den jemand hereinreicht - aussen steht die Adresse (URL) und
 * die Absicht (Methode), innen liegt der Inhalt (Body), und den bekommst du
 * nur haeppchenweise, nicht am Stueck. ServerResponse ist der Umschlag, den
 * du zurueckgibst - und du darfst ihn nur EINMAL zukleben.
 *
 * Damit dieses Beispiel von selbst terminiert, macht es alles in einem Rutsch:
 * Server starten -> eigene Testanfragen per fetch schicken -> server.close().
 */

import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

// --- Kleine Helfer, die beide Beispiele benutzen ---------------------------

/** Ermittelt die Basis-URL eines lauschenden Servers (Port 0 = freier Port). */
function basisUrl(server: Server): string {
  const adresse = server.address();
  // address() liefert "string | AddressInfo | null" - der Compiler zwingt uns,
  // alle drei Faelle zu bedenken. Bei einem TCP-Server ist es AddressInfo.
  if (adresse === null || typeof adresse === "string") {
    throw new Error("Server lauscht nicht auf einem TCP-Port.");
  }
  const info: AddressInfo = adresse;
  return `http://127.0.0.1:${info.port}`;
}

/** Startet den Server auf einem freien Port und wartet, bis er lauscht. */
function starte(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve();
    });
  });
}

/** Beendet den Server und wartet, bis wirklich alles zu ist. */
function beende(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((fehler) => {
      if (fehler) {
        reject(fehler);
        return;
      }
      resolve();
    });
  });
}

// -----------------------------------------------------------------------
// ANTI-PATTERN: untypisierter Handler, Antwort von Hand zusammengebastelt
// -----------------------------------------------------------------------
// Die beiden ": any" stehen hier explizit da, weil "noImplicitAny" ein
// stilles any verbieten wuerde. Genau darum geht es: Mit any weiss der
// Compiler nichts mehr ueber req und res - kein Header-Name wird geprueft,
// kein Statuscode, kein Methodenname. "res.sendStatus(200)" (das gibt es nur
// in Express!) wuerde klaglos kompilieren und zur Laufzeit krachen.
function handlerFalsch(req: any, res: any): void {
  // Kein Content-Type -> der Client raet. Body von Hand zusammengeklebt ->
  // ein Anfuehrungszeichen in den Daten zerlegt das JSON.
  const suchbegriff = decodeURIComponent(String(req.url).split("q=")[1] ?? "");
  res.end('{"suche": "' + suchbegriff + '", "ok": true}');
}

async function zeigeAntiPattern(): Promise<void> {
  const server = createServer(handlerFalsch);
  await starte(server);
  const url = basisUrl(server);

  // Ein einziges Anfuehrungszeichen in der Suchanfrage reicht, um das
  // handgeklebte JSON kaputtzumachen.
  const antwort = await fetch(`${url}/suche?q=${encodeURIComponent('gross"artig')}`);
  const roh = await antwort.text();

  console.log("[Anti-Pattern] Content-Type:", antwort.headers.get("content-type"));
  console.log("[Anti-Pattern] Rohantwort:", roh);
  try {
    JSON.parse(roh);
    console.log("[Anti-Pattern] JSON war zufaellig gueltig.");
  } catch (fehler) {
    // "useUnknownInCatchVariables": "fehler" ist unknown - erst pruefen.
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    console.log("[Anti-Pattern] Antwort ist kein gueltiges JSON:", text);
  }

  await beende(server);
}

// -----------------------------------------------------------------------
// BEST PRACTICE: typisierte Handler, sauberes JSON, Body richtig lesen
// -----------------------------------------------------------------------

interface Notiz {
  readonly id: number;
  readonly text: string;
}

const notizen: Notiz[] = [{ id: 1, text: "TypeScript lernen" }];

/**
 * Liest den Request-Body. Er kommt als Strom von Buffer-Stuecken an - erst
 * bei "end" hast du alles. Deshalb ein Promise: Der Body ist nie sofort da.
 */
function leseBody(anfrage: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const teile: Buffer[] = [];
    anfrage.on("data", (stueck: Buffer) => {
      teile.push(stueck);
    });
    anfrage.on("end", () => {
      resolve(Buffer.concat(teile).toString("utf8"));
    });
    anfrage.on("error", reject);
  });
}

/** Genau eine Stelle, an der geantwortet wird - inklusive korrektem Header. */
function sendeJson(
  antwort: ServerResponse,
  status: number,
  koerper: unknown
): void {
  const text = JSON.stringify(koerper);
  antwort.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
  });
  antwort.end(text);
}

/** Prueft, ob unstrukturierte JSON-Daten wirklich eine neue Notiz sind. */
function istNotizEingabe(wert: unknown): wert is { text: string } {
  if (typeof wert !== "object" || wert === null) {
    return false;
  }
  const kandidat = wert as { text?: unknown };
  return typeof kandidat.text === "string" && kandidat.text.trim() !== "";
}

// Die Parameter sind hier vollstaendig typisiert - createServer gibt die Typen
// sogar selbst vor, aber hingeschrieben liest es sich fuer Menschen besser.
async function handler(
  anfrage: IncomingMessage,
  antwort: ServerResponse
): Promise<void> {
  // req.url ist "string | undefined" - also absichern statt hoffen.
  const pfad = (anfrage.url ?? "/").split("?")[0] ?? "/";
  const methode = anfrage.method ?? "GET";

  if (methode === "GET" && pfad === "/notizen") {
    sendeJson(antwort, 200, { anzahl: notizen.length, notizen });
    return;
  }

  if (methode === "POST" && pfad === "/notizen") {
    const roh = await leseBody(anfrage);
    let daten: unknown;
    try {
      daten = JSON.parse(roh);
    } catch {
      sendeJson(antwort, 400, { fehler: "Body ist kein gueltiges JSON" });
      return;
    }
    // JSON.parse liefert "any" - wir behandeln es sofort als "unknown" und
    // pruefen. Erst nach der Pruefung ist es eine Notiz.
    if (!istNotizEingabe(daten)) {
      sendeJson(antwort, 400, { fehler: "Feld 'text' fehlt oder ist leer" });
      return;
    }
    const neu: Notiz = { id: notizen.length + 1, text: daten.text };
    notizen.push(neu);
    sendeJson(antwort, 201, neu);
    return;
  }

  sendeJson(antwort, 404, { fehler: `Kein Handler fuer ${methode} ${pfad}` });
}

async function zeigeBestPractice(): Promise<void> {
  // createServer erwartet einen synchronen Handler. Unser Handler ist async,
  // also faengt der Wrapper alle abgelehnten Promises ab - sonst wuerde ein
  // Fehler den ganzen Prozess beenden und der Client wartet ewig.
  const server = createServer((anfrage, antwort) => {
    handler(anfrage, antwort).catch((fehler: unknown) => {
      const text = fehler instanceof Error ? fehler.message : String(fehler);
      sendeJson(antwort, 500, { fehler: text });
    });
  });

  await starte(server);
  const url = basisUrl(server);
  console.log("[Best Practice] Server laeuft auf", url);

  const liste = await fetch(`${url}/notizen`);
  console.log(
    "[Best Practice] GET /notizen ->",
    liste.status,
    await liste.text()
  );

  const angelegt = await fetch(`${url}/notizen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: 'Modul 4 "abschliessen"' }),
  });
  console.log(
    "[Best Practice] POST /notizen ->",
    angelegt.status,
    await angelegt.text()
  );

  const kaputt = await fetch(`${url}/notizen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titel: "falsches Feld" }),
  });
  console.log(
    "[Best Practice] POST ohne 'text' ->",
    kaputt.status,
    await kaputt.text()
  );

  const nichts = await fetch(`${url}/gibt-es-nicht`);
  console.log(
    "[Best Practice] GET /gibt-es-nicht ->",
    nichts.status,
    await nichts.text()
  );

  await beende(server);
  console.log("[Best Practice] Server sauber beendet.");
}

async function main(): Promise<void> {
  await zeigeAntiPattern();
  await zeigeBestPractice();
}

// Top-Level-await gibt es in CommonJS nicht - deshalb der Aufruf mit catch.
main().catch((fehler: unknown) => {
  console.error("Beispiel fehlgeschlagen:", fehler);
  process.exitCode = 1;
});

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Drei Dinge, die dich in echten Projekten retten:
// 1. Antworte genau EINMAL pro Request. Ein zweites res.end() wirft
//    "ERR_STREAM_WRITE_AFTER_END". Eine zentrale sendeJson-Funktion und
//    konsequente "return"-Anweisungen im Router verhindern das strukturell.
// 2. Begrenze die Body-Groesse. Ohne Limit kann dir jemand mit einem einzigen
//    Request den Speicher vollschreiben - lies mit, zaehl die Bytes und brich
//    ab 1 MB mit Status 413 ab.
// 3. Traue keinem JSON. JSON.parse liefert "any"; behandle das Ergebnis sofort
//    als "unknown" und schick es durch eine Pruefung wie istNotizEingabe.
//    In Modul 6 lernst du dafuer Type Guards und Schema-Validierung, in
//    Modul 9 baust du auf genau diesem Server die fertige Todo-API auf.
