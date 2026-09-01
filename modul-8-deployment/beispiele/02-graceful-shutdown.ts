/**
 * MODUL 8.6 - Graceful Shutdown
 * ============================================================================
 * Wenn eine Betriebsumgebung deinen Dienst abloest, schickt sie ihm zuerst
 * SIGTERM: "Bitte aufhoeren." Erst nach einer Frist (bei Docker 10 Sekunden)
 * folgt SIGKILL: "Sofort aus." Was du in dieser Frist tust, entscheidet
 * darueber, ob Kunden einen Fehler sehen oder nichts merken.
 *
 * Ein sauberes Herunterfahren hat immer dieselben vier Schritte:
 *   1. Keine NEUEN Anfragen mehr annehmen (server.close()).
 *   2. Laufende Anfragen zu Ende bedienen.
 *   3. Ressourcen schliessen (Datenbank, Warteschlangen, Dateien).
 *   4. Erst dann den Prozess enden lassen - mit Exit-Code 0.
 *
 * Dieses Skript startet zwei kleine Server, stellt je eine langsame Anfrage
 * und faehrt sie herunter - einmal brutal, einmal sauber. Es beendet sich
 * selbst.
 */

import http from "node:http";

// -----------------------------------------------------------------------
// Kleine Helfer (Server starten, Anfrage stellen, warten)
// -----------------------------------------------------------------------

function starteServer(server: http.Server): Promise<number> {
  return new Promise<number>((aufloesen, ablehnen) => {
    server.once("error", ablehnen);
    server.listen(0, "127.0.0.1", () => {
      const adresse = server.address();
      if (adresse === null || typeof adresse === "string") {
        ablehnen(new Error("Kein Port erhalten."));
        return;
      }
      aufloesen(adresse.port);
    });
  });
}

function hole(port: number, pfad: string): Promise<string> {
  return new Promise<string>((aufloesen, ablehnen) => {
    // "agent: false" schaltet Keep-Alive ab - so bleibt keine Verbindung
    // offen, die das Herunterfahren kuenstlich verzoegert.
    const anfrage = http.get(
      { host: "127.0.0.1", port, path: pfad, agent: false },
      (antwort) => {
        antwort.setEncoding("utf8");
        let text = "";
        antwort.on("data", (stueck: string) => {
          text += stueck;
        });
        antwort.on("end", () => {
          aufloesen(`${String(antwort.statusCode)} ${text}`);
        });
      }
    );
    anfrage.on("error", ablehnen);
  });
}

function schlafe(millisekunden: number): Promise<void> {
  return new Promise<void>((aufloesen) => {
    setTimeout(aufloesen, millisekunden);
  });
}

function nachrichtVon(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler);
}

/** Eine bewusst langsame Anfrage - z. B. eine Datenbankabfrage. */
function beantworteLangsam(antwort: http.ServerResponse, text: string): void {
  setTimeout(() => {
    if (antwort.writableEnded || antwort.destroyed) {
      return;
    }
    antwort.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    antwort.end(text);
  }, 300);
}

// -----------------------------------------------------------------------
// ANTI-PATTERN: sofort abwuergen
// -----------------------------------------------------------------------
// Der Klassiker:
//
//   process.on("SIGTERM", () => process.exit(0));
//
// Das reisst dem Prozess den Stecker heraus - mitten in der Antwort, mitten
// in der Transaktion. Der Kunde sieht einen Verbindungsabbruch. Wir zeigen
// dasselbe hier ohne process.exit(), indem wir alle Verbindungen hart
// zerstoeren.
async function zeigeAntiPattern(): Promise<void> {
  const server = http.createServer((_anfrage, antwort) => {
    beantworteLangsam(antwort, "fertig");
  });

  const port = await starteServer(server);
  console.log("[Anti-Pattern] Server laeuft auf Port", port);

  const laufendeAnfrage = hole(port, "/bestellung");
  await schlafe(50); // die Anfrage ist jetzt mitten in der Arbeit

  console.log("[Anti-Pattern] SIGTERM -> sofort alles zumachen");
  server.closeAllConnections();
  server.close();

  try {
    console.log("[Anti-Pattern] Antwort:", await laufendeAnfrage);
  } catch (fehler) {
    console.log(
      "[Anti-Pattern] Anfrage abgebrochen:",
      nachrichtVon(fehler),
      "- der Kunde bekommt einen Fehler statt seiner Bestellung."
    );
  }
}

// -----------------------------------------------------------------------
// BEST PRACTICE: erst zuhoeren aufhoeren, dann fertig arbeiten
// -----------------------------------------------------------------------
async function zeigeBestPractice(): Promise<void> {
  let faehrtHerunter = false;

  const server = http.createServer((anfrage, antwort) => {
    // Health-Endpoint: waehrend des Herunterfahrens meldet er sich krank,
    // damit der Loadbalancer sofort aufhoert, Verkehr zu schicken.
    if (anfrage.url === "/health") {
      const code = faehrtHerunter ? 503 : 200;
      antwort.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" });
      antwort.end(faehrtHerunter ? "shutting down" : "ok");
      return;
    }
    beantworteLangsam(antwort, "Bestellung gespeichert");
  });

  const port = await starteServer(server);
  console.log("[Best Practice] Server laeuft auf Port", port);
  console.log("[Best Practice] Health vor SIGTERM:", await hole(port, "/health"));

  // Dieses Promise wird erst erfuellt, wenn wirklich alles zu ist.
  const shutdownFertig = new Promise<void>((aufloesen) => {
    const fahreHerunter = (signal: NodeJS.Signals): void => {
      if (faehrtHerunter) {
        return; // zweites Signal ignorieren - sonst raeumt man doppelt auf
      }
      faehrtHerunter = true;
      console.log(`[Best Practice] ${signal} empfangen - keine neuen Anfragen mehr.`);

      // Schritt 1+2: Zuhoeren beenden, laufende Anfragen zu Ende bedienen.
      server.close(() => {
        // Schritt 3: hier wuerdest du Datenbank & Co. schliessen.
        console.log("[Best Practice] Alle laufenden Anfragen fertig, Server zu.");
        aufloesen();
      });
      // Verbindungen, die gerade NICHTS tun, duerfen sofort gehen.
      server.closeIdleConnections();

      // Notbremse: haengt eine Anfrage, warten wir nicht ewig.
      // ".unref()" sorgt dafuer, dass dieser Timer den Prozess nicht am
      // Leben haelt, wenn alles vorher fertig wird.
      setTimeout(() => {
        console.error("[Best Practice] Frist abgelaufen - harter Abbruch.");
        server.closeAllConnections();
        aufloesen();
      }, 5000).unref();
    };

    process.once("SIGTERM", fahreHerunter);
    process.once("SIGINT", fahreHerunter);
  });

  const laufendeAnfrage = hole(port, "/bestellung");
  await schlafe(50); // auch hier: mitten in der Arbeit

  // Statt "kill -TERM <pid>" von aussen loesen wir das Signal selbst aus.
  const zugestellt = process.emit("SIGTERM", "SIGTERM");
  console.log("[Best Practice] SIGTERM ausgeloest:", zugestellt);

  console.log("[Best Practice] Antwort:", await laufendeAnfrage);
  await shutdownFertig;

  try {
    await hole(port, "/health");
    console.log("[Best Practice] Unerwartet: Port nimmt noch Anfragen an.");
  } catch (fehler) {
    console.log(
      "[Best Practice] Neue Anfrage wird abgelehnt:",
      nachrichtVon(fehler)
    );
  }
}

async function main(): Promise<void> {
  await zeigeAntiPattern();
  await zeigeBestPractice();
}

main()
  .then(() => {
    console.log("[Best Practice] Prozess endet regulaer mit Exit-Code 0.");
  })
  .catch((fehler: unknown) => {
    console.error("Beispiel fehlgeschlagen:", nachrichtVon(fehler));
    process.exitCode = 1;
  });

// -----------------------------------------------------------------------
// PROFI-TIPP
// -----------------------------------------------------------------------
// Beende einen Dienst nie mit "process.exit()", solange noch Arbeit laeuft -
// setze stattdessen "process.exitCode" und lass den Event-Loop von selbst
// leerlaufen. Zwei Fallen aus der Praxis: In Docker bekommt nur PID 1 das
// SIGTERM - startest du deinen Prozess ueber ein Shell-Skript oder in der
// Shell-Form von CMD, wird das Signal verschluckt. Nutze deshalb die
// Array-Form (CMD ["node", "dist/server.js"]). Und plane die Wartefrist
// kuerzer als die Frist der Plattform: Bei Kubernetes' Standard von 30
// Sekunden ist eine eigene Notbremse nach 10 bis 15 Sekunden richtig -
// so raeumst DU auf, nicht SIGKILL.
