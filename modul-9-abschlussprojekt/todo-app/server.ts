/**
 * MODUL 9 - server.ts: Der HTTP-Server der Todo-App
 * ============================================================================
 * Setzt alle Bausteine zusammen: Konfiguration, Store, Auth und Validierung.
 * Bewusst nur mit Node-Bordmitteln (node:http), ohne Express - so bleibt
 * sichtbar, was wirklich passiert.
 *
 * Starten:  npm start        (oder der Play-Button "Run All" in IntelliJ IDEA)
 * Testen:   siehe README.md in diesem Ordner (fertige curl-Befehle)
 *
 * Verwendete Konzepte aus dem Kurs:
 *   Modul 3 - Discriminated Unions, async/await
 *   Modul 4 - node:http typsicher verwenden
 *   Modul 6 - Authentifizierung, Autorisierung, Eingabepruefung
 *   Modul 8 - Konfiguration beim Start, Graceful Shutdown
 */

import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

import { ladeKonfiguration } from "./konfiguration";
import type { Konfiguration } from "./konfiguration";
import { Store, erzeugeId } from "./store";
import { darfZugreifen, erstelleToken, erzeugeDemoBenutzer, login, pruefeToken } from "./auth";
import { parseJson, parseLoginDaten, parseNeuesTodo, parseTodoAenderung } from "./validierung";
import type { Benutzer, Todo } from "./types";
import { alsBenutzerId, alsTodoId } from "./types";

// -----------------------------------------------------------------------
// ANTI-PATTERN: Request-Handler ohne Typen
// -----------------------------------------------------------------------
// Mit "any" weiss der Editor weder, was in "req" steckt, noch ob "res.end"
// ueberhaupt existiert. Autovervollstaendigung: keine. Sicherheit: keine.
function handleRequestFalsch(_req: any, res: any): void {
  res.end("Kein Typ weiss, was hier wirklich hereinkommt.");
}
console.log(
  "[Anti-Pattern] handleRequestFalsch dient nur der Veranschaulichung:",
  typeof handleRequestFalsch
);

// -----------------------------------------------------------------------
// BEST PRACTICE: Typisierte Bausteine
// -----------------------------------------------------------------------

interface AngemeldeterBenutzer {
  readonly id: string;
  readonly rolle: "admin" | "user";
}

function sendeJson(res: ServerResponse, status: number, daten: unknown): void {
  const koerper = JSON.stringify(daten);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(koerper),
  });
  res.end(koerper);
}

function leseKoerper(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const teile: Buffer[] = [];
    req.on("data", (teil: Buffer) => teile.push(teil));
    req.on("end", () => resolve(Buffer.concat(teile).toString("utf8")));
    req.on("error", reject);
  });
}

/** Liest das Bearer-Token aus dem Authorization-Header und prueft es. */
function ermittleBenutzer(
  req: IncomingMessage,
  konfiguration: Konfiguration
): AngemeldeterBenutzer | undefined {
  const kopfzeile = req.headers.authorization;
  // Der Header kann laut Node-Typen auch string[] sein - deshalb typeof.
  if (typeof kopfzeile !== "string" || !kopfzeile.startsWith("Bearer ")) {
    return undefined;
  }
  const ergebnis = pruefeToken(kopfzeile.slice("Bearer ".length), konfiguration.tokenGeheimnis);
  if (!ergebnis.ok) {
    return undefined;
  }
  return { id: ergebnis.wert.benutzerId, rolle: ergebnis.wert.rolle };
}

// -----------------------------------------------------------------------
// BEST PRACTICE: Die Anwendung
// -----------------------------------------------------------------------

export interface App {
  readonly server: Server;
  readonly konfiguration: Konfiguration;
  /** Faehrt den Server sauber herunter (Modul 8.6). */
  readonly beenden: () => Promise<void>;
}

export async function starteApp(konfiguration: Konfiguration = ladeKonfiguration()): Promise<App> {
  const benutzerListe: readonly Benutzer[] = await erzeugeDemoBenutzer();
  const todoStore = new Store<Todo>();

  // Ein Beispiel-Todo, damit GET /todos nicht leer ist:
  todoStore.speichere({
    id: alsTodoId(erzeugeId("todo")),
    titel: "TypeScript-Grundlagen wiederholen",
    erledigt: false,
    besitzerId: alsBenutzerId("b-1"),
    erstelltAm: new Date().toISOString(),
  });

  async function verarbeite(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const methode = req.method ?? "GET";
    const pfad = (req.url ?? "/").split("?")[0] ?? "/";
    console.log(`[Server] ${methode} ${pfad}`);

    // --- GET /health: fuer Monitoring, ohne Anmeldung -----------------------
    if (methode === "GET" && pfad === "/health") {
      sendeJson(res, 200, { status: "ok", todos: todoStore.anzahl });
      return;
    }

    // --- POST /login: Token ausstellen --------------------------------------
    if (methode === "POST" && pfad === "/login") {
      const koerper = parseJson(await leseKoerper(req));
      if (!koerper.ok) {
        sendeJson(res, 400, { fehler: koerper.fehler });
        return;
      }
      const daten = parseLoginDaten(koerper.wert);
      if (!daten.ok) {
        sendeJson(res, 400, { fehler: daten.fehler });
        return;
      }

      const angemeldet = await login(daten.wert.benutzername, daten.wert.passwort, benutzerListe);
      if (!angemeldet.ok) {
        sendeJson(res, 401, { fehler: angemeldet.fehler });
        return;
      }

      const token = erstelleToken(
        {
          benutzerId: angemeldet.wert.id,
          rolle: angemeldet.wert.rolle,
          gueltigBis: Date.now() + konfiguration.tokenGueltigkeitMinuten * 60_000,
        },
        konfiguration.tokenGeheimnis
      );
      sendeJson(res, 200, { benutzer: angemeldet.wert, token });
      return;
    }

    // --- Ab hier ist eine Anmeldung Pflicht ---------------------------------
    const benutzer = ermittleBenutzer(req, konfiguration);
    if (benutzer === undefined) {
      sendeJson(res, 401, { fehler: "Nicht angemeldet. Bitte zuerst /login aufrufen." });
      return;
    }

    // --- GET /todos: eigene Todos (admin sieht alle) ------------------------
    if (methode === "GET" && pfad === "/todos") {
      const sichtbar =
        benutzer.rolle === "admin"
          ? todoStore.alle()
          : todoStore.filtere((todo) => todo.besitzerId === benutzer.id);
      sendeJson(res, 200, sichtbar);
      return;
    }

    // --- POST /todos: neues Todo anlegen ------------------------------------
    if (methode === "POST" && pfad === "/todos") {
      const koerper = parseJson(await leseKoerper(req));
      if (!koerper.ok) {
        sendeJson(res, 400, { fehler: koerper.fehler });
        return;
      }
      const daten = parseNeuesTodo(koerper.wert);
      if (!daten.ok) {
        sendeJson(res, 400, { fehler: daten.fehler });
        return;
      }
      const neu: Todo = {
        id: alsTodoId(erzeugeId("todo")),
        titel: daten.wert.titel,
        erledigt: false,
        besitzerId: alsBenutzerId(benutzer.id),
        erstelltAm: new Date().toISOString(),
      };
      sendeJson(res, 201, todoStore.speichere(neu));
      return;
    }

    // --- PATCH /todos/:id: eigenes Todo aendern -----------------------------
    const patchTreffer = /^\/todos\/([^/]+)$/.exec(pfad);
    if (patchTreffer !== null && (methode === "PATCH" || methode === "DELETE")) {
      const rohId = patchTreffer[1];
      if (rohId === undefined) {
        sendeJson(res, 400, { fehler: "Ungueltige Todo-ID." });
        return;
      }
      const id = alsTodoId(rohId);
      const vorhanden = todoStore.findeById(id);
      if (vorhanden === undefined) {
        sendeJson(res, 404, { fehler: "Todo nicht gefunden." });
        return;
      }
      // Autorisierung: eigenes Todo, oder Admin.
      const gehoertMir = vorhanden.besitzerId === benutzer.id;
      if (!gehoertMir && !darfZugreifen(benutzer.rolle, "admin")) {
        sendeJson(res, 403, { fehler: "Keine Berechtigung fuer dieses Todo." });
        return;
      }

      if (methode === "DELETE") {
        todoStore.loesche(id);
        sendeJson(res, 200, { geloescht: id });
        return;
      }

      const koerper = parseJson(await leseKoerper(req));
      if (!koerper.ok) {
        sendeJson(res, 400, { fehler: koerper.fehler });
        return;
      }
      const aenderung = parseTodoAenderung(koerper.wert);
      if (!aenderung.ok) {
        sendeJson(res, 400, { fehler: aenderung.fehler });
        return;
      }
      const aktualisiert = todoStore.aktualisiere(id, aenderung.wert);
      sendeJson(res, 200, aktualisiert);
      return;
    }

    sendeJson(res, 404, { fehler: `Route ${methode} ${pfad} gibt es nicht.` });
  }

  const server = createServer((req, res) => {
    verarbeite(req, res).catch((fehler: unknown) => {
      console.error("[Server] Unerwarteter Fehler:", fehler);
      // Nach aussen bewusst OHNE Details (siehe Modul 6.6):
      sendeJson(res, 500, { fehler: "Interner Serverfehler." });
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(konfiguration.port, konfiguration.hostname, resolve);
  });

  const beenden = (): Promise<void> =>
    new Promise((resolve, reject) => {
      server.close((fehler) => (fehler ? reject(fehler) : resolve()));
    });

  return { server, konfiguration, beenden };
}

// -----------------------------------------------------------------------
// Einstiegspunkt: nur ausfuehren, wenn diese Datei direkt gestartet wird
// -----------------------------------------------------------------------
if (require.main === module) {
  starteApp()
    .then((app) => {
      const { hostname, port } = app.konfiguration;
      console.log(`[Best Practice] Server laeuft auf http://${hostname}:${port}`);
      console.log("[Best Practice] Demo-Logins: admin/admin123 (admin), gast/gast123 (user)");
      console.log("[Best Practice] curl-Beispiele stehen in der README.md dieses Ordners.");

      // Graceful Shutdown (Modul 8.6): laufende Anfragen zu Ende bringen,
      // dann sauber beenden - statt den Prozess hart abzuschiessen.
      const herunterfahren = (signal: string): void => {
        console.log(`\n[Server] ${signal} empfangen - fahre herunter ...`);
        app
          .beenden()
          .then(() => {
            console.log("[Server] Sauber beendet.");
            process.exit(0);
          })
          .catch((fehler: unknown) => {
            console.error("[Server] Fehler beim Herunterfahren:", fehler);
            process.exit(1);
          });
      };

      process.on("SIGTERM", () => herunterfahren("SIGTERM"));
      process.on("SIGINT", () => herunterfahren("SIGINT"));
    })
    .catch((fehler: unknown) => {
      console.error("[Server] Start fehlgeschlagen:", fehler);
      process.exitCode = 1;
    });
}

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Beachte, wie duenn dieser Server ist: Er nimmt entgegen, prueft, delegiert
// und antwortet - mehr nicht. Die Fachlogik liegt in store.ts, auth.ts und
// validierung.ts und ist dadurch ohne HTTP testbar. Genau deshalb laesst sich
// diese App spaeter auf Express, Fastify oder eine Serverless-Funktion
// umstellen, ohne dass eine einzige Zeile Fachlogik angefasst werden muss.
